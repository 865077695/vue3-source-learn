import { isObject } from "@vue/shared"
import { activeEffect, track, trigger } from "./effect"
import { reactive, ReactiveFlags } from "./reactive"

export const mutableHandlers = {
    get(target, key, receiver) {
        // return target[key]
        if (ReactiveFlags.IS_REACIVE === key) { // 
            return true
        }

        // effect里有响应式变量时，会进入到这里
        track(target, key)
        // return Reflect.get(target, key, receiver) // 会把this指向代理对象
        let r = Reflect.get(target, key, receiver)
        if(isObject(r)) {
            return reactive(r)
        }
    },
    set(target, key, value, receiver) {
        // target[key] = value
        // return true
        let oldValue = target[key] // 老值
        let r = Reflect.set(target, key, value, receiver) // r是boolean
        if(oldValue !== value) {
            trigger(target, key, value, oldValue)
        }
        return r
    }
}
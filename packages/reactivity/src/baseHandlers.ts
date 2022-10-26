import { activeEffect, track } from "./effect"
import { ReactiveFlags } from "./reactive"

export const mutableHandlers = {
    get(target, key, receiver) {
        // return target[key]
        console.log(key)

        if (ReactiveFlags.IS_REACIVE === key) { // 
            return true
        }

        console.log(activeEffect, key)
        // effect里有响应式变量时，会进入到这里
        track(target, key)
        return Reflect.get(target, key, receiver) // 会把this指向代理对象
    },
    set(target, key, value, receiver) {
        // target[key] = value
        // return true
        return Reflect.set(target, key, value, receiver)
    }
}
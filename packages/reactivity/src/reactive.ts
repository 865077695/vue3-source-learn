import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
    IS_REACIVE = '__v__isReactive', // 是否已是响应式对象
}

// 存储已代理的对象
const reactiveMap = new WeakMap() // key只能是对象
export function reactive(target) {
    // 非对象不处理
    if (!isObject(target)) {
        return target
    }
    
    // 是否已经是代理对象
    if(target[ReactiveFlags.IS_REACIVE]) { // target是普通对象的话不会进get，target是代理对象的话会进get
        return target
    }
    
    // 是否已被代理过
    const exisitsProxy = reactiveMap.get(target)
    if (exisitsProxy) {
        return exisitsProxy
    }

    // 代理
    const proxy = new Proxy(target, mutableHandlers)

    // 缓存
    reactiveMap.set(target, proxy)

    return proxy
}

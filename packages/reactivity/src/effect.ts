import { ReactiveEffect } from "vue";

export let activeEffect
class ReactiveEffect {
    public active = true
    public deps = [] // effect的依赖项
    public parent = undefined
    constructor(public fn) { // public fn, this.fn

    }

    run() {
        if (!this.active) {
            return this.fn() // 未激活的直接执行一次函数
        }

        // 其他情况 是激活的
        try {
            this.parent = activeEffect
            activeEffect = this
            return this.fn()
        } finally {
            activeEffect = this.parent
            this.parent = undefined
        }

    }
}

// 依赖收集，将当前的effect放到全局变量上
export function effect(fn) {
    const _effect = new ReactiveEffect(fn) // 响应式的effect
    _effect.run() // 创建时默认执行一次 
}

// let mapping = {
//     target1: {
//         name: [effect1, effect2, ...]
//     }
// }
const targetMap = new WeakMap()
export function track(target, key) {
    if (!activeEffect) { // 不是在effect中取值，不需要收集
        return
    }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key) // 记录哪些effect依赖该属性
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    let shouldTrack = !dep.has(activeEffect) //未收集的收集一下（双向存储）
    if(shouldTrack) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep) // 收集该effect依赖的属性，后续需要停止effect时来清理对应属性中存储的该effect
    }
}

/**
 * // 老方案：stack 依赖收集处理effect嵌套的情况
 * stack = [e1, e2]
 * 
 * effect(() => { // e1
 *   proxy.name
 *   effect(() => { // e2
 *      proxy.age
 *   })
 *   proxy.sex
 * })
 */

/**
 * // 新方案：标记 
 * activeEffect = e1
 * effect(()) => { e1  e1.parent = null
 *  proxy.name
 *  effect(() => { e2  e2.parent = e1
 *      proxy.age
 *  })
 *  proxy.age activeEffect = e2.parent
 * }
 */
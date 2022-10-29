export let activeEffect

// 每次执行effect之前，清理掉effect中依赖的属性,重新收集，避免有些已经不需要依赖的数据还存在
function cleanupEffect(effect) {
    let {deps} = effect
    for(let i = 0; i < deps.length; i++) {
        const depEffects = deps[i]
        // deps[i]: [effect1, effect2]: 所以依赖某个属性的effect组成的new set
        depEffects.delete(effect) // 将effect从effect依赖的每个属性的dep(set)上删除
    }
    effect.deps.length = 0 // 清理deps
}
export class ReactiveEffect {
    public active = true
    public deps = [] // effect的依赖项
    public parent = undefined
    constructor(public fn, private scheduler) { // public fn, this.fn     fn中使用到的变量变化了就会触发scheduler

    }

    run() {
        if (!this.active) {
            return this.fn() // 未激活的直接执行一次函数
        }

        // 其他情况 是激活的
        try {
            this.parent = activeEffect
            activeEffect = this
            cleanupEffect(this) // 清理当前effect的依赖以及依赖的属性中存储的effect（双向清除）
            return this.fn() // 调fn时候出发get做的依赖收集
        } finally {
            activeEffect = this.parent
            this.parent = undefined
        }

    }
    stop() {
        if(this.active) {
            cleanupEffect(this) // 移除双向依赖，并失活
            this.active = false
        }
    }
}

// 依赖收集，将当前的effect放到全局变量上
export function effect(fn, options:any={}) {
    const _effect = new ReactiveEffect(fn, options.scheduler) // 响应式的effect
    _effect.run() // 创建时默认执行一次 
    const runner = _effect.run.bind(_effect) // 保证执行runner时，this指向当前effect
    runner.effect = _effect
    return runner
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
    let depEffects = depsMap.get(key) // 记录哪些effect依赖该属性
    if (!depEffects) {
        depsMap.set(key, (depEffects = new Set()))
    }

    trackEffects(depEffects)
    // let shouldTrack = !depEffects.has(activeEffect) //未收集的收集一下（双向存储）
    // if (shouldTrack) {
    //     depEffects.add(activeEffect)
    //     activeEffect.deps.push(depEffects) // 收集该effect依赖的属性，后续需要停止effect时来清理对应属性中存储的该effect
    // }
}

export function trackEffects(depEffects) {
    let shouldTrack = !depEffects.has(activeEffect) //未收集的收集一下（双向存储）
    if (shouldTrack) {
        depEffects.add(activeEffect)
        activeEffect.deps.push(depEffects) // 收集该effect依赖的属性，后续需要停止effect时来清理对应属性中存储的该effect
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

export function trigger(target, key, newValue, oldValue) {
    const depsMap = targetMap.get(target) // map{key: setEffect}
    if (!depsMap) return
    const depEffects = depsMap.get(key) // [effect]
    if (depEffects) {
        triggerEffects(depEffects)
        // const effects = [...depEffects]
        // effects.forEach(effect => {
        //     // 重新执行effect时，会将effect放到activeEffect，对比一下activeEffect是否是当前effect，避免无限嵌套执行，如果当前正在执行此effect就不重新执行此effect
        //     if(effect !== activeEffect) {
        //         if(!effect.scheduler) {

        //             effect.run() // trigger触发run，每次调run都会重新依赖收集
        //         } else {
        //             effect.scheduler() // 组件更新可以基于scheduler实现
        //         }
        //     }
        // })
    }
}

export function triggerEffects(depEffects) {
    const effects = [...depEffects]
    effects.forEach(effect => {
        // 重新执行effect时，会将effect放到activeEffect，对比一下activeEffect是否是当前effect，避免无限嵌套执行，如果当前正在执行此effect就不重新执行此effect
        if(effect !== activeEffect) {
            if(!effect.scheduler) {

                effect.run() // trigger触发run，每次调run都会重新依赖收集
            } else {
                effect.scheduler() // 组件更新可以基于scheduler实现
            }
        }
    })
}
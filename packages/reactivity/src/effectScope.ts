export let activeEffectScope

class EffectScope{
    active = true // 状态
    effects = [] // 存储在当前作用域中的effect
    parent // 处理嵌套情况
    scopes // 收集作用域
    constructor( detached = false) { // 是否是独立的
        if(!detached && activeEffectScope) { // 如果是嵌套，走到内层时，activeEffectScope在run之前还是外层的，将即将进入的这个作用域放入外层的作用域
            activeEffectScope.scopes || (activeEffectScope.scopes = []).push(this) // 外层作用域收集自己的子作用域
        }
    }

    run(fn) {
        if(this.active) {
            try{

                activeEffectScope = this
                return fn()
            } finally {
                activeEffectScope = this.parent
                this.parent = null
            }
        }
    }

    stop() {
        if(this.active) {
            for(let i = 0; i < this.effects.length; i++) {
                this.effects[i].stop() // 终止scope内的每个effect
            }
            this.active = false
        }

        if(this.scopes) {
            for(let i = 0; i < this.scopes.length; i++) {
                this.scopes[i].stop() // 停止内层scope
            }
        }
    }
}

export function recordEffectScope(effect) {
    if(activeEffectScope && activeEffectScope.active) {
        activeEffectScope.effects.push(effect)
    }
}

export function effectScope(detached) {
    return new EffectScope(detached)
}
import { isFunction } from "@vue/shared";
import { activeEffect, ReactiveEffect, trackEffects, triggerEffects } from './effect'

class ComputedRefImpl{
  public dep = undefined
  public effect = undefined
  public __v_isRef = true // 有这个属性，需要用.value取值
  public _dirty = true
  public _value // 缓存值
  constructor(getter, public setter) {
    // 取值的时候才执行effect.run
    this.effect = new ReactiveEffect(getter, () => { // 第二个参数是scheduler,有scheduler时不会自动更新，只会在更新时调scheduler
      this._dirty = true
      triggerEffects(this.dep)
    })
  }

  get value() { // 等价于Object.defineProperty

    if(activeEffect) {
      // 如果有activeEffect，表示这个计算属性有在effect中使用，需要让计算属性和effect双向收集一下
      const depEffects = this.dep || (this.dep = new Set())
      trackEffects(depEffects) // effect和计算属性双向收集
    }
    if(this._dirty) {
      this._value = this.effect.run() // 取值并缓存、并返回
      this._dirty = false // 取过了
    }
    return this._value
  }

  set(newValue) {
    this.setter(newValue)
  }
}

export  function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions)

  let getter
  let setter

  if(onlyGetter) {
    getter = getterOrOptions
    setter = null
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  // getter方法必须存在
  return new ComputedRefImpl(getter, setter)
}
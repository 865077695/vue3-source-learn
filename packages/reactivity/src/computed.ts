import { isFunction } from "@vue/shared";
import { ReactiveEffect } from './effect'

class ComputedRefImpl{
  dep = undefined
  effect = undefined
  __v_isRef = true // 有这个属性，需要用.value取值
  _dirty = true
  _value // 缓存值
  constructor(getter, public setter) {
    // 取值的时候才执行effect.run
    this.effect = new ReactiveEffect(getter, () => { // 第二个参数是scheduler,有scheduler时不会自动更新，只会在更新时调scheduler
      this._dirty = true
    })
  }

  get value() { // 等价于Object.defineProperty
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
import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";


// 递归取一遍属性，来触发effect收集
function traverse(source, s = new Set()) {
  if(!isObject) {
    return source
  }

  // 注意循环引用
  if(s.has(source)) {
    return source
  }
  s.add(source)

  for(let key in source) {
    traverse(source[key], s)
  }
  return source
}

export function watch(source, cb, {immediate} = {} as any) {
  let getter
  if(isReactive(source)) {
    getter = () => traverse(source) // 后面直接调用run时，会执行此函数，直接返回对象，只有访问属性才能收集依赖
  } else if (isFunction(source)) {
    getter = source
  }
  let oldValue
  const job = () => {
    // 调用watch的回调函数
    let newValue = effect.run() // 新值
    cb(newValue, oldValue)
    oldValue = newValue // 记录老值下次使用
  }

  const effect = new ReactiveEffect(getter, job)

  
  if(immediate) {
    return job()
  }
  
  oldValue = effect.run() // 最开始的老值
}
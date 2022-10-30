import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";


// 递归取一遍属性，来触发effect收集
function traverse(source, s = new Set()) {
  if (!isObject) {
    return source
  }

  // 注意循环引用
  if (s.has(source)) {
    return source
  }
  s.add(source)

  for (let key in source) {
    traverse(source[key], s)
  }
  return source
}

function doWtach(source, cb, { immediate } = {} as any) {

  let getter
  if (isReactive(source)) {
    getter = () => traverse(source) // 后面直接调用run时，会执行此函数，直接返回对象，只有访问属性才能收集依赖
  } else if (isFunction(source)) {
    getter = source
  }
  let oldValue
  let cleanup
  const onCleanup = (userCb) => { // 专用于处理watch中有异步操作时，保留最后一次被触发的effect的结果，而不是最后结束的异步的结果，每再一次被触发，就调用上次的onCleanup函数
    cleanup = userCb
  }
  const job = () => {
    if (cb) { // watch
      // 调用watch的回调函数
      let newValue = effect.run() // 新值
      if (cleanup) cleanup()
      cb(newValue, oldValue, onCleanup)
      oldValue = newValue // 记录老值下次使用
    } else { // watchEffect
      effect.run() // 出发fn
    }
  }

  const effect = new ReactiveEffect(getter, job)


  if (immediate) {
    return job()
  }

  oldValue = effect.run() // 最开始的老值
}

export function watch(source, cb, options) {
  doWtach(source, cb, options)
}

export function watchEffect(fn, options) {
  doWtach(fn, null, options)
}
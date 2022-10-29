// packages/reactivity/src/effect.ts
var activeEffect;
function cleanupEffect(effect2) {
  let { deps } = effect2;
  for (let i = 0; i < deps.length; i++) {
    const depEffects = deps[i];
    depEffects.delete(effect2);
  }
  effect2.deps.length = 0;
}
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    this.parent = void 0;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
};
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let depEffects = depsMap.get(key);
  if (!depEffects) {
    depsMap.set(key, depEffects = /* @__PURE__ */ new Set());
  }
  trackEffects(depEffects);
}
function trackEffects(depEffects) {
  let shouldTrack = !depEffects.has(activeEffect);
  if (shouldTrack) {
    depEffects.add(activeEffect);
    activeEffect.deps.push(depEffects);
  }
}
function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap)
    return;
  const depEffects = depsMap.get(key);
  if (depEffects) {
    triggerEffects(depEffects);
  }
}
function triggerEffects(depEffects) {
  const effects = [...depEffects];
  effects.forEach((effect2) => {
    if (effect2 !== activeEffect) {
      if (!effect2.scheduler) {
        effect2.run();
      } else {
        effect2.scheduler();
      }
    }
  });
}

// packages/shared/src/index.ts
function isObject(value) {
  return value !== null && typeof value === "object";
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if ("__v__isReactive" /* IS_REACIVE */ === key) {
      return true;
    }
    track(target, key);
    let r = Reflect.get(target, key, receiver);
    if (isObject(r)) {
      return reactive(r);
    }
    return r;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    let r = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return r;
  }
};

// packages/reactivity/src/reactive.ts
var ReactiveFlags = /* @__PURE__ */ ((ReactiveFlags2) => {
  ReactiveFlags2["IS_REACIVE"] = "__v__isReactive";
  return ReactiveFlags2;
})(ReactiveFlags || {});
function isReactive(target) {
  return !!(target && target["__v__isReactive" /* IS_REACIVE */]);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v__isReactive" /* IS_REACIVE */]) {
    return target;
  }
  const exisitsProxy = reactiveMap.get(target);
  if (exisitsProxy) {
    return exisitsProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/reactivity/src/computed.ts
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.dep = void 0;
    this.effect = void 0;
    this.__v_isRef = true;
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
      if (this.dep) {
        triggerEffects(this.dep);
      }
    });
  }
  get value() {
    if (activeEffect) {
      const depEffects = this.dep || (this.dep = /* @__PURE__ */ new Set());
      trackEffects(depEffects);
    }
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }
  set(newValue) {
    this.setter(newValue);
  }
};
function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = null;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}

// packages/reactivity/src/watch.ts
function traverse(source, s = /* @__PURE__ */ new Set()) {
  if (!isObject) {
    return source;
  }
  if (s.has(source)) {
    return source;
  }
  s.add(source);
  for (let key in source) {
    traverse(source[key], s);
  }
  return source;
}
function watch(source, cb, { immediate } = {}) {
  let getter;
  if (isReactive(source)) {
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  const job = () => {
    let newValue = effect2.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };
  const effect2 = new ReactiveEffect(getter, job);
  if (immediate) {
    return job();
  }
  oldValue = effect2.run();
}
export {
  ReactiveEffect,
  ReactiveFlags,
  activeEffect,
  computed,
  effect,
  isReactive,
  reactive,
  track,
  trackEffects,
  trigger,
  triggerEffects,
  watch
};
//# sourceMappingURL=reactivity.esm.js.map

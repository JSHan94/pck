// frontend/node_modules/solid-js/dist/dev.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  };
}
var IS_DEV = true;
var equalFn = (a3, b3) => a3 === b3;
var $PROXY = Symbol("solid-proxy");
var $TRACK = Symbol("solid-track");
var $DEVCOMP = Symbol("solid-dev-component");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
var DevHooks = {
  afterUpdate: null,
  afterCreateOwner: null,
  afterCreateSignal: null,
  afterRegisterGraph: null
};
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? {
    owned: null,
    cleanups: null,
    context: null,
    owner: null
  } : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? () => fn(() => {
    throw new Error("Dispose method must be an explicit argument to createRoot function");
  }) : () => fn(() => untrack(() => cleanNode(root)));
  DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(root);
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s3 = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  {
    if (options.name) s3.name = options.name;
    if (options.internal) {
      s3.internal = true;
    } else {
      registerGraph(s3);
      if (DevHooks.afterCreateSignal) DevHooks.afterCreateSignal(s3);
    }
  }
  const setter = (value2) => {
    if (typeof value2 === "function") {
      if (Transition && Transition.running && Transition.sources.has(s3)) value2 = value2(s3.tValue);
      else value2 = value2(s3.value);
    }
    return writeSignal(s3, value2);
  };
  return [readSignal.bind(s3), setter];
}
function createRenderEffect(fn, value, options) {
  const c3 = createComputation(fn, value, false, STALE, options);
  if (Scheduler && Transition && Transition.running) Updates.push(c3);
  else updateComputation(c3);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c3 = createComputation(fn, value, false, STALE, options), s3 = SuspenseContext && useContext(SuspenseContext);
  if (s3) c3.suspense = s3;
  if (!options || !options.render) c3.user = true;
  Effects ? Effects.push(c3) : updateComputation(c3);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c3 = createComputation(fn, value, true, 0, options);
  c3.observers = null;
  c3.observerSlots = null;
  c3.comparator = options.equals || void 0;
  if (Scheduler && Transition && Transition.running) {
    c3.tState = STALE;
    Updates.push(c3);
  } else updateComputation(c3);
  return readSignal.bind(c3);
}
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
function on(deps, fn, options) {
  const isArray = Array.isArray(deps);
  let prevInput;
  let defer = options && options.defer;
  return (prevValue) => {
    let input;
    if (isArray) {
      input = Array(deps.length);
      for (let i2 = 0; i2 < deps.length; i2++) input[i2] = deps[i2]();
    } else input = deps();
    if (defer) {
      defer = false;
      return prevValue;
    }
    const result = untrack(() => fn(input, prevInput, prevValue));
    prevInput = input;
    return result;
  };
}
function onMount(fn) {
  createEffect(() => untrack(fn));
}
function onCleanup(fn) {
  if (Owner === null) console.warn("cleanups created outside a `createRoot` or `render` will never be run");
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l3 = Listener;
  const o3 = Owner;
  return Promise.resolve().then(() => {
    Listener = l3;
    Owner = o3;
    let t2;
    if (Scheduler || SuspenseContext) {
      t2 = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true
      });
      t2.done || (t2.done = new Promise((res) => t2.resolve = res));
      t2.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t2 ? t2.done : void 0;
  });
}
var [transPending, setTransPending] = createSignal(false);
function devComponent(Comp, props) {
  const c3 = createComputation(() => untrack(() => {
    Object.assign(Comp, {
      [$DEVCOMP]: true
    });
    return Comp(props);
  }), void 0, true, 0);
  c3.props = props;
  c3.observers = null;
  c3.observerSlots = null;
  c3.name = Comp.name;
  c3.component = Comp;
  updateComputation(c3);
  return c3.tValue !== void 0 ? c3.tValue : c3.value;
}
function registerGraph(value) {
  if (Owner) {
    if (Owner.sourceMap) Owner.sourceMap.push(value);
    else Owner.sourceMap = [value];
    value.graph = Owner;
  }
  if (DevHooks.afterRegisterGraph) DevHooks.afterRegisterGraph(value);
}
function createContext(defaultValue, options) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id, options),
    defaultValue
  };
}
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
}
function children(fn) {
  const children2 = createMemo(fn);
  const memo2 = createMemo(() => resolveChildren(children2()), void 0, {
    name: "children"
  });
  memo2.toArray = () => {
    const c3 = memo2();
    return Array.isArray(c3) ? c3 : c3 != null ? [c3] : [];
  };
  return memo2;
}
var SuspenseContext;
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  if (runningTransition && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning) node.value = value;
    } else node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
          const o3 = node.observers[i2];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o3)) continue;
          if (TransitionRunning ? !o3.tState : !o3.state) {
            if (o3.pure) Updates.push(o3);
            else Effects.push(o3);
            if (o3.observers) markDownstream(o3);
          }
          if (!TransitionRunning) o3.state = STALE;
          else o3.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV) throw new Error("Potential Infinite Loop Detected.");
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = void 0;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init2, pure, state = STALE, options) {
  const c3 = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init2,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c3.state = 0;
    c3.tState = state;
  }
  if (Owner === null) console.warn("computations created outside a `createRoot` or `render` will never be disposed");
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c3];
      else Owner.tOwned.push(c3);
    } else {
      if (!Owner.owned) Owner.owned = [c3];
      else Owner.owned.push(c3);
    }
  }
  if (options && options.name) c3.name = options.name;
  if (ExternalSourceConfig && c3.fn) {
    const [track, trigger] = createSignal(void 0, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(c3.fn, trigger);
    onCleanup(() => ordinary.dispose());
    const triggerInTransition = () => startTransition(trigger).then(() => inTransition.dispose());
    const inTransition = ExternalSourceConfig.factory(c3.fn, triggerInTransition);
    c3.fn = (x3) => {
      track();
      return Transition && Transition.running ? inTransition.track(x3) : ordinary.track(x3);
    };
  }
  DevHooks.afterCreateOwner && DevHooks.afterCreateOwner(c3);
  return c3;
}
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0) return;
  if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (runningTransition ? node.tState : node.state) ancestors.push(node);
  }
  for (let i2 = ancestors.length - 1; i2 >= 0; i2--) {
    node = ancestors[i2];
    if (runningTransition) {
      let top = node, prev = ancestors[i2 + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init2) {
  if (Updates) return fn();
  let wait = false;
  if (!init2) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
    else runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e3 of Effects) {
        "tState" in e3 && (e3.state = e3.tState);
        delete e3.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d3 of disposed) cleanNode(d3);
        for (const v2 of sources) {
          v2.value = v2.tValue;
          if (v2.owned) {
            for (let i2 = 0, len = v2.owned.length; i2 < len; i2++) cleanNode(v2.owned[i2]);
          }
          if (v2.tOwned) v2.owned = v2.tOwned;
          delete v2.tValue;
          delete v2.tOwned;
          v2.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e2 = Effects;
  Effects = null;
  if (e2.length) runUpdates(() => runEffects(e2), false);
  else DevHooks.afterUpdate && DevHooks.afterUpdate();
  if (res) res();
}
function runQueue(queue) {
  for (let i2 = 0; i2 < queue.length; i2++) runTop(queue[i2]);
}
function scheduleQueue(queue) {
  for (let i2 = 0; i2 < queue.length; i2++) {
    const item = queue[i2];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
function runUserEffects(queue) {
  let i2, userLength = 0;
  for (i2 = 0; i2 < queue.length; i2++) {
    const e2 = queue[i2];
    if (!e2.user) runTop(e2);
    else queue[userLength++] = e2;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i2 = 0; i2 < userLength; i2++) runTop(queue[i2]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition) node.tState = 0;
  else node.state = 0;
  for (let i2 = 0; i2 < node.sources.length; i2 += 1) {
    const source = node.sources[i2];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i2 = 0; i2 < node.observers.length; i2 += 1) {
    const o3 = node.observers[i2];
    if (runningTransition ? !o3.tState : !o3.state) {
      if (runningTransition) o3.tState = PENDING;
      else o3.state = PENDING;
      if (o3.pure) Updates.push(o3);
      else Effects.push(o3);
      o3.observers && markDownstream(o3);
    }
  }
}
function cleanNode(node) {
  let i2;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n2 = obs.pop(), s3 = source.observerSlots.pop();
        if (index < obs.length) {
          n2.sourceSlots[s3] = index;
          obs[index] = n2;
          source.observerSlots[index] = s3;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i2 = node.tOwned.length - 1; i2 >= 0; i2--) cleanNode(node.tOwned[i2]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i2 = node.owned.length - 1; i2 >= 0; i2--) cleanNode(node.owned[i2]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i2 = node.cleanups.length - 1; i2 >= 0; i2--) node.cleanups[i2]();
    node.cleanups = null;
  }
  if (Transition && Transition.running) node.tState = 0;
  else node.state = 0;
  delete node.sourceMap;
}
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i2 = 0; i2 < node.owned.length; i2++) reset(node.owned[i2]);
  }
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function runErrors(err, fns, owner) {
  try {
    for (const f3 of fns) f3(err);
  } catch (e2) {
    handleError(e2, owner && owner.owner || null);
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  if (Effects) Effects.push({
    fn() {
      runErrors(error, fns, owner);
    },
    state: STALE
  });
  else runErrors(error, fns, owner);
}
function resolveChildren(children2) {
  if (typeof children2 === "function" && !children2.length) return resolveChildren(children2());
  if (Array.isArray(children2)) {
    const results = [];
    for (let i2 = 0; i2 < children2.length; i2++) {
      const result = resolveChildren(children2[i2]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children2;
}
function createProvider(id, options) {
  return function provider(props) {
    let res;
    createRenderEffect(() => res = untrack(() => {
      Owner.context = {
        ...Owner.context,
        [id]: props.value
      };
      return children(() => props.children);
    }), void 0, options);
    return res;
  };
}
var FALLBACK = Symbol("fallback");
function dispose(d3) {
  for (let i2 = 0; i2 < d3.length; i2++) d3[i2]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i2, j2;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j2 = 0; j2 < newLen; j2++) {
          items[j2] = newItems[j2];
          mapped[j2] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++) ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j2 = newEnd; j2 >= start; j2--) {
          item = newItems[j2];
          i2 = newIndices.get(item);
          newIndicesNext[j2] = i2 === void 0 ? -1 : i2;
          newIndices.set(item, j2);
        }
        for (i2 = start; i2 <= end; i2++) {
          item = items[i2];
          j2 = newIndices.get(item);
          if (j2 !== void 0 && j2 !== -1) {
            temp[j2] = mapped[i2];
            tempdisposers[j2] = disposers[i2];
            indexes && (tempIndexes[j2] = indexes[i2]);
            j2 = newIndicesNext[j2];
            newIndices.set(item, j2);
          } else disposers[i2]();
        }
        for (j2 = start; j2 < newLen; j2++) {
          if (j2 in temp) {
            mapped[j2] = temp[j2];
            disposers[j2] = tempdisposers[j2];
            if (indexes) {
              indexes[j2] = tempIndexes[j2];
              indexes[j2](j2);
            }
          } else mapped[j2] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j2] = disposer;
      if (indexes) {
        const [s3, set] = createSignal(j2, {
          name: "index"
        });
        indexes[j2] = set;
        return mapFn(newItems[j2], s3);
      }
      return mapFn(newItems[j2]);
    }
  };
}
var hydrationEnabled = false;
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c3 = sharedConfig.context;
      setHydrateContext(nextHydrateContext());
      const r2 = devComponent(Comp, props || {});
      setHydrateContext(c3);
      return r2;
    }
  }
  return devComponent(Comp, props || {});
}
var narrowedError = (name) => `Attempting to access a stale value from <${name}> that could possibly be undefined. This may occur because you are reading the accessor returned from the component at a time where it has already been unmounted. We recommend cleaning up any stale timers or async, or reading from the initial condition.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0), void 0, {
    name: "value"
  });
}
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, void 0, {
    name: "condition value"
  });
  const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, {
    equals: (a3, b3) => !a3 === !b3,
    name: "condition"
  });
  return createMemo(() => {
    const c3 = condition();
    if (c3) {
      const child = props.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(keyed ? c3 : () => {
        if (!untrack(condition)) throw narrowedError("Show");
        return conditionValue();
      })) : child;
    }
    return props.fallback;
  }, void 0, {
    name: "value"
  });
}
var SuspenseListContext = createContext();
if (globalThis) {
  if (!globalThis.Solid$$) globalThis.Solid$$ = true;
  else console.warn("You appear to have multiple instances of Solid. This can lead to unexpected behavior.");
}

// frontend/node_modules/solid-js/web/dist/dev.js
var booleans = [
  "allowfullscreen",
  "async",
  "alpha",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback",
  "preservespitch",
  "shadowrootclonable",
  "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus",
  "shadowrootserializable",
  "sharedstoragewritable"
];
var Properties = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "adAuctionHeaders",
  "allowFullscreen",
  "browsingTopics",
  "defaultChecked",
  "defaultMuted",
  "defaultSelected",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "preservesPitch",
  "shadowRootClonable",
  "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus",
  "shadowRootSerializable",
  "sharedStorageWritable",
  ...booleans
]);
var Aliases = Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
});
var PropAliases = Object.assign(/* @__PURE__ */ Object.create(null), {
  class: "className",
  novalidate: {
    $: "noValidate",
    FORM: 1
  },
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  },
  adauctionheaders: {
    $: "adAuctionHeaders",
    IFRAME: 1
  },
  allowfullscreen: {
    $: "allowFullscreen",
    IFRAME: 1
  },
  browsingtopics: {
    $: "browsingTopics",
    IMG: 1
  },
  defaultchecked: {
    $: "defaultChecked",
    INPUT: 1
  },
  defaultmuted: {
    $: "defaultMuted",
    AUDIO: 1,
    VIDEO: 1
  },
  defaultselected: {
    $: "defaultSelected",
    OPTION: 1
  },
  disablepictureinpicture: {
    $: "disablePictureInPicture",
    VIDEO: 1
  },
  disableremoteplayback: {
    $: "disableRemotePlayback",
    AUDIO: 1,
    VIDEO: 1
  },
  preservespitch: {
    $: "preservesPitch",
    AUDIO: 1,
    VIDEO: 1
  },
  shadowrootclonable: {
    $: "shadowRootClonable",
    TEMPLATE: 1
  },
  shadowrootdelegatesfocus: {
    $: "shadowRootDelegatesFocus",
    TEMPLATE: 1
  },
  shadowrootserializable: {
    $: "shadowRootSerializable",
    TEMPLATE: 1
  },
  sharedstoragewritable: {
    $: "sharedStorageWritable",
    IFRAME: 1,
    IMG: 1
  }
});
var memo = (fn) => createMemo(() => fn());
function reconcileArrays(parentNode, a3, b3) {
  let bLength = b3.length, aEnd = a3.length, bEnd = bLength, aStart = 0, bStart = 0, after = a3[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a3[aStart] === b3[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a3[aEnd - 1] === b3[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b3[bStart - 1].nextSibling : b3[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b3[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a3[aStart])) a3[aStart].remove();
        aStart++;
      }
    } else if (a3[aStart] === b3[bEnd - 1] && b3[bStart] === a3[aEnd - 1]) {
      const node = a3[--aEnd].nextSibling;
      parentNode.insertBefore(b3[bStart++], a3[aStart++].nextSibling);
      parentNode.insertBefore(b3[--bEnd], node);
      a3[aEnd] = b3[bEnd];
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map();
        let i2 = bStart;
        while (i2 < bEnd) map.set(b3[i2], i2++);
      }
      const index = map.get(a3[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i2 = aStart, sequence = 1, t2;
          while (++i2 < aEnd && i2 < bEnd) {
            if ((t2 = map.get(a3[i2])) == null || t2 !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a3[aStart];
            while (bStart < index) parentNode.insertBefore(b3[bStart++], node);
          } else parentNode.replaceChild(b3[bStart++], a3[aStart++]);
        } else aStart++;
      } else a3[aStart++].remove();
    }
  }
}
function render(code, element, init2, options = {}) {
  if (!element) {
    throw new Error("The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document.");
  }
  let disposer;
  createRoot((dispose2) => {
    disposer = dispose2;
    element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init2);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    if (isHydrating()) throw new Error("Failed attempt to create new DOM elements during hydration. Check that the libraries you are using support hydration.");
    const t2 = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    t2.innerHTML = html;
    return isSVG ? t2.content.firstChild.firstChild : isMathML ? t2.firstChild : t2.content.firstChild;
  };
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function setAttribute(node, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
  prev || (prev = {});
  value || (value = {});
  let v2, s3;
  for (s3 in prev) {
    value[s3] == null && nodeStyle.removeProperty(s3);
    delete prev[s3];
  }
  for (s3 in value) {
    v2 = value[s3];
    if (v2 !== prev[s3]) {
      nodeStyle.setProperty(s3, v2);
      prev[s3] = v2;
    }
  }
  return prev;
}
function setStyleProperty(node, name, value) {
  value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  const hydrating = isHydrating(parent);
  if (hydrating) {
    !current && (current = [...parent.childNodes]);
    let cleaned = [];
    for (let i2 = 0; i2 < current.length; i2++) {
      const node = current[i2];
      if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
      else cleaned.push(node);
    }
    current = cleaned;
  }
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t2 = typeof value, multi = marker !== void 0;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t2 === "string" || t2 === "number") {
    if (hydrating) return current;
    if (t2 === "number") {
      value = value.toString();
      if (value === current) return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t2 === "boolean") {
    if (hydrating) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t2 === "function") {
    createRenderEffect(() => {
      let v2 = value();
      while (typeof v2 === "function") v2 = v2();
      current = insertExpression(parent, v2, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydrating) {
      if (!array.length) return current;
      if (marker === void 0) return current = [...parent.childNodes];
      let node = array[0];
      if (node.parentNode !== parent) return current;
      const nodes = [node];
      while ((node = node.nextSibling) !== marker) nodes.push(node);
      return current = nodes;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (hydrating && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else console.warn(`Unrecognized value. Skipped inserting`, value);
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i2 = 0, len = array.length; i2 < len; i2++) {
    let item = array[i2], prev = current && current[normalized.length], t2;
    if (item == null || item === true || item === false) ;
    else if ((t2 = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t2 === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i2 = 0, len = array.length; i2 < len; i2++) parent.insertBefore(array[i2], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i2 = current.length - 1; i2 >= 0; i2--) {
      const el = current[i2];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i2) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}
var RequestContext = Symbol();

// frontend/node_modules/bippy/dist/rdt-hook-CrcWl4lP.js
var e = `0.5.16`;
var t = `bippy-${e}`;
var n = Object.defineProperty;
var r = Object.prototype.hasOwnProperty;
var i = () => {
};
var a = (e2) => {
  try {
    let t2 = Function.prototype.toString.call(e2);
    t2.indexOf(`^_^`) > -1 && setTimeout(() => {
      throw Error(`React is running in production mode, but dead code elimination has not been applied. Read how to correctly configure React for production: https://reactjs.org/link/perf-use-production-build`);
    });
  } catch {
  }
};
var o = (e2 = h()) => `getFiberRoots` in e2;
var s = false;
var c;
var l = (e2 = h()) => s ? true : (typeof e2.inject == `function` && (c = e2.inject.toString()), !!c?.includes(`(injected)`));
var u = /* @__PURE__ */ new Set();
var d = /* @__PURE__ */ new Set();
var f = (e2) => {
  let r2 = /* @__PURE__ */ new Map(), o3 = 0, s3 = { _instrumentationIsActive: false, _instrumentationSource: t, checkDCE: a, hasUnsupportedRendererAttached: false, inject(e3) {
    let t2 = ++o3;
    return r2.set(t2, e3), d.add(e3), s3._instrumentationIsActive || (s3._instrumentationIsActive = true, u.forEach((e4) => e4())), t2;
  }, on: i, onCommitFiberRoot: i, onCommitFiberUnmount: i, onPostCommitFiberRoot: i, renderers: r2, supportsFiber: true, supportsFlight: true };
  try {
    n(globalThis, `__REACT_DEVTOOLS_GLOBAL_HOOK__`, { configurable: true, enumerable: true, get() {
      return s3;
    }, set(t3) {
      if (t3 && typeof t3 == `object`) {
        let n2 = s3.renderers;
        s3 = t3, n2.size > 0 && (n2.forEach((e3, n3) => {
          d.add(e3), t3.renderers.set(n3, e3);
        }), p(e2));
      }
    } });
    let t2 = window.hasOwnProperty, r3 = false;
    n(window, `hasOwnProperty`, { configurable: true, value: function(...e3) {
      try {
        if (!r3 && e3[0] === `__REACT_DEVTOOLS_GLOBAL_HOOK__`) return globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ = void 0, r3 = true, -0;
      } catch {
      }
      return t2.apply(this, e3);
    }, writable: true });
  } catch {
    p(e2);
  }
  return s3;
};
var p = (e2) => {
  e2 && u.add(e2);
  try {
    let n2 = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!n2) return;
    if (!n2._instrumentationSource) {
      n2.checkDCE = a, n2.supportsFiber = true, n2.supportsFlight = true, n2.hasUnsupportedRendererAttached = false, n2._instrumentationSource = t, n2._instrumentationIsActive = false;
      let e3 = o(n2);
      if (e3 || (n2.on = i), n2.renderers.size) {
        n2._instrumentationIsActive = true, u.forEach((e4) => e4());
        return;
      }
      let r2 = n2.inject, c3 = l(n2);
      if (c3 && !e3) {
        s = true;
        let e4 = n2.inject({ scheduleRefresh() {
        } });
        e4 && (n2._instrumentationIsActive = true);
      }
      n2.inject = (e4) => {
        let t2 = r2(e4);
        return d.add(e4), c3 && n2.renderers.set(t2, e4), n2._instrumentationIsActive = true, u.forEach((e5) => e5()), t2;
      };
    }
    (n2.renderers.size || n2._instrumentationIsActive || l()) && e2?.();
  } catch {
  }
};
var m = () => r.call(globalThis, `__REACT_DEVTOOLS_GLOBAL_HOOK__`);
var h = (e2) => m() ? (p(e2), globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__) : f(e2);
var g = () => !!(typeof window < `u` && (window.document?.createElement || window.navigator?.product === `ReactNative`));
var _ = () => {
  try {
    g() && h();
  } catch {
  }
};

// frontend/node_modules/bippy/dist/install-hook-only-DtUPvEBg.js
_();

// frontend/node_modules/bippy/dist/core-D7_ABaNC.js
var a2 = 0;
var o2 = 1;
var c2 = 5;
var f2 = 11;
var p2 = 13;
var m2 = 14;
var h2 = 15;
var ee = 16;
var te = 19;
var y = 26;
var b = 27;
var ne = 28;
var re = 30;
var ie = 2;
var ae = 4096;
var oe = 4;
var se = 16;
var ce = 32;
var le = 1024;
var ue = 8192;
var O = ie | oe | se | ce | ae | ue | le;
var k = (e2) => {
  switch (e2.tag) {
    case c2:
    case y:
    case b:
      return true;
    default:
      return typeof e2.type == `string`;
  }
};
var pe = (e2) => {
  switch (e2.tag) {
    case o2:
    case f2:
    case a2:
    case m2:
    case h2:
      return true;
    default:
      return false;
  }
};
var me = (e2) => !e2 || typeof e2 != `object` ? true : `pendingProps` in e2 && !(`containerInfo` in e2);
function N(e2, t2, n2 = false) {
  if (!e2) return null;
  let r2 = t2(e2);
  if (r2 instanceof Promise) return (async () => {
    if (await r2 === true) return e2;
    let i3 = n2 ? e2.return : e2.child;
    for (; i3; ) {
      let e3 = await F(i3, t2, n2);
      if (e3) return e3;
      i3 = n2 ? null : i3.sibling;
    }
    return null;
  })();
  if (r2 === true) return e2;
  let i2 = n2 ? e2.return : e2.child;
  for (; i2; ) {
    let e3 = P(i2, t2, n2);
    if (e3) return e3;
    i2 = n2 ? null : i2.sibling;
  }
  return null;
}
var P = (e2, t2, n2 = false) => {
  if (!e2) return null;
  if (t2(e2) === true) return e2;
  let r2 = n2 ? e2.return : e2.child;
  for (; r2; ) {
    let e3 = P(r2, t2, n2);
    if (e3) return e3;
    r2 = n2 ? null : r2.sibling;
  }
  return null;
};
var F = async (e2, t2, n2 = false) => {
  if (!e2) return null;
  if (await t2(e2) === true) return e2;
  let r2 = n2 ? e2.return : e2.child;
  for (; r2; ) {
    let e3 = await F(r2, t2, n2);
    if (e3) return e3;
    r2 = n2 ? null : r2.sibling;
  }
  return null;
};
var I = (e2) => {
  let t2 = e2;
  return typeof t2 == `function` ? t2 : typeof t2 == `object` && t2 ? I(t2.type || t2.render) : null;
};
var Te = (e2) => {
  let t2 = e2;
  if (typeof t2 == `string`) return t2;
  if (typeof t2 != `function` && !(typeof t2 == `object` && t2)) return null;
  let n2 = t2.displayName || t2.name || null;
  if (n2) return n2;
  let r2 = I(t2);
  return r2 && (r2.displayName || r2.name) || null;
};
var De = (e2) => {
  let t2 = e2.alternate;
  if (!t2) return e2;
  if (t2.actualStartTime && e2.actualStartTime) return t2.actualStartTime > e2.actualStartTime ? t2 : e2;
  for (let t3 of $) {
    let n2 = N(t3.current, (t4) => {
      if (t4 === e2) return true;
    });
    if (n2) return n2;
  }
  return e2;
};
var Pe = (e2) => {
  let n2 = h();
  for (let t2 of n2.renderers.values()) try {
    let n3 = t2.findFiberByHostInstance?.(e2);
    if (n3) return n3;
  } catch {
  }
  if (typeof e2 == `object` && e2) {
    if (`_reactRootContainer` in e2) return e2._reactRootContainer?._internalRoot?.current?.child;
    for (let t2 in e2) if (t2.startsWith(`__reactContainer$`) || t2.startsWith(`__reactInternalInstance$`) || t2.startsWith(`__reactFiber`)) return e2[t2] || null;
  }
  return null;
};
var Fe = Error();
var $ = /* @__PURE__ */ new Set();

// frontend/node_modules/bippy/dist/source.js
var b2 = Object.create;
var x2 = Object.defineProperty;
var S2 = Object.getOwnPropertyDescriptor;
var C2 = Object.getOwnPropertyNames;
var ee2 = Object.getPrototypeOf;
var te2 = Object.prototype.hasOwnProperty;
var ne2 = (e2, t2) => () => (t2 || e2((t2 = { exports: {} }).exports, t2), t2.exports);
var re2 = (e2, t2, n2, r2) => {
  if (t2 && typeof t2 == `object` || typeof t2 == `function`) for (var i2 = C2(t2), a3 = 0, o3 = i2.length, s3; a3 < o3; a3++) s3 = i2[a3], !te2.call(e2, s3) && s3 !== n2 && x2(e2, s3, { get: ((e3) => t2[e3]).bind(null, s3), enumerable: !(r2 = S2(t2, s3)) || r2.enumerable });
  return e2;
};
var ie2 = (e2, t2, n2) => (n2 = e2 == null ? {} : b2(ee2(e2)), re2(t2 || !e2 || !e2.__esModule ? x2(n2, `default`, { value: e2, enumerable: true }) : n2, e2));
var ae2 = () => {
  let n2 = h();
  for (let t2 of [...Array.from(d), ...Array.from(n2.renderers.values())]) {
    let e2 = t2.currentDispatcherRef;
    if (e2 && typeof e2 == `object`) return `H` in e2 ? e2.H : e2.current;
  }
  return null;
};
var w2 = (t2) => {
  for (let n2 of d) {
    let e2 = n2.currentDispatcherRef;
    e2 && typeof e2 == `object` && (`H` in e2 ? e2.H = t2 : e2.current = t2);
  }
};
var T2 = (e2) => `
    in ${e2}`;
var oe2 = (e2, t2) => {
  let n2 = T2(e2);
  return t2 && (n2 += ` (at ${t2})`), n2;
};
var E = false;
var D = (e2, t2) => {
  if (!e2 || E) return ``;
  let n2 = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0, E = true;
  let r2 = ae2();
  w2(null);
  let i2 = console.error, a3 = console.warn;
  console.error = () => {
  }, console.warn = () => {
  };
  try {
    let n3 = { DetermineComponentFrameRoot() {
      let n4;
      try {
        if (t2) {
          let t3 = function() {
            throw Error();
          };
          if (Object.defineProperty(t3.prototype, `props`, { set: function() {
            throw Error();
          } }), typeof Reflect == `object` && Reflect.construct) {
            try {
              Reflect.construct(t3, []);
            } catch (e3) {
              n4 = e3;
            }
            Reflect.construct(e2, [], t3);
          } else {
            try {
              t3.call();
            } catch (e3) {
              n4 = e3;
            }
            e2.call(t3.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (e3) {
            n4 = e3;
          }
          let t3 = e2();
          t3 && typeof t3.catch == `function` && t3.catch(() => {
          });
        }
      } catch (e3) {
        if (e3 instanceof Error && n4 instanceof Error && typeof e3.stack == `string`) return [e3.stack, n4.stack];
      }
      return [null, null];
    } };
    n3.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
    let r3 = Object.getOwnPropertyDescriptor(n3.DetermineComponentFrameRoot, `name`);
    r3?.configurable && Object.defineProperty(n3.DetermineComponentFrameRoot, `name`, { value: `DetermineComponentFrameRoot` });
    let [i3, a4] = n3.DetermineComponentFrameRoot();
    if (i3 && a4) {
      let t3 = i3.split(`
`), n4 = a4.split(`
`), r4 = 0, o4 = 0;
      for (; r4 < t3.length && !t3[r4].includes(`DetermineComponentFrameRoot`); ) r4++;
      for (; o4 < n4.length && !n4[o4].includes(`DetermineComponentFrameRoot`); ) o4++;
      if (r4 === t3.length || o4 === n4.length) for (r4 = t3.length - 1, o4 = n4.length - 1; r4 >= 1 && o4 >= 0 && t3[r4] !== n4[o4]; ) o4--;
      for (; r4 >= 1 && o4 >= 0; r4--, o4--) if (t3[r4] !== n4[o4]) {
        if (r4 !== 1 || o4 !== 1) do
          if (r4--, o4--, o4 < 0 || t3[r4] !== n4[o4]) {
            let n5 = `
${t3[r4].replace(` at new `, ` at `)}`, i4 = Te(e2);
            return i4 && n5.includes(`<anonymous>`) && (n5 = n5.replace(`<anonymous>`, i4)), n5;
          }
        while (r4 >= 1 && o4 >= 0);
        break;
      }
    }
  } finally {
    E = false, Error.prepareStackTrace = n2, w2(r2), console.error = i2, console.warn = a3;
  }
  let o3 = e2 ? Te(e2) : ``, s3 = o3 ? T2(o3) : ``;
  return s3;
};
var se2 = (e2, t2) => {
  let m3 = e2.tag, h3 = ``;
  switch (m3) {
    case ne:
      h3 = T2(`Activity`);
      break;
    case o2:
      h3 = D(e2.type, true);
      break;
    case f2:
      h3 = D(e2.type.render, false);
      break;
    case a2:
    case h2:
      h3 = D(e2.type, false);
      break;
    case c2:
    case y:
    case b:
      h3 = T2(e2.type);
      break;
    case ee:
      h3 = T2(`Lazy`);
      break;
    case p2:
      h3 = e2.child !== t2 && t2 !== null ? T2(`Suspense Fallback`) : T2(`Suspense`);
      break;
    case te:
      h3 = T2(`SuspenseList`);
      break;
    case re:
      h3 = T2(`ViewTransition`);
      break;
    default:
      return ``;
  }
  return h3;
};
var ce2 = (e2) => {
  try {
    let t2 = ``, n2 = e2, r2 = null;
    do {
      t2 += se2(n2, r2);
      let e3 = n2._debugInfo;
      if (e3 && Array.isArray(e3)) for (let n3 = e3.length - 1; n3 >= 0; n3--) {
        let r3 = e3[n3];
        typeof r3.name == `string` && (t2 += oe2(r3.name, r3.env));
      }
      r2 = n2, n2 = n2.return;
    } while (n2);
    return t2;
  } catch (e3) {
    return e3 instanceof Error ? `
Error generating stack: ${e3.message}
${e3.stack}` : ``;
  }
};
var O2 = (e2) => {
  let t2 = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  let n2 = e2;
  if (!n2) return ``;
  Error.prepareStackTrace = t2, n2.startsWith(`Error: react-stack-top-frame
`) && (n2 = n2.slice(29));
  let r2 = n2.indexOf(`
`);
  if (r2 !== -1 && (n2 = n2.slice(r2 + 1)), r2 = Math.max(n2.indexOf(`react_stack_bottom_frame`), n2.indexOf(`react-stack-bottom-frame`)), r2 !== -1 && (r2 = n2.lastIndexOf(`
`, r2)), r2 !== -1) n2 = n2.slice(0, r2);
  else return ``;
  return n2;
};
var k2 = /(^|@)\S+:\d+/;
var A2 = /^\s*at .*(\S+:\d+|\(native\))/m;
var le2 = /^(eval@)?(\[native code\])?$/;
var M2 = (e2, t2) => {
  if (t2?.includeInElement !== false) {
    let n2 = e2.split(`
`), r2 = [];
    for (let e3 of n2) if (/^\s*at\s+/.test(e3)) {
      let t3 = F2(e3, void 0)[0];
      t3 && r2.push(t3);
    } else if (/^\s*in\s+/.test(e3)) {
      let t3 = e3.replace(/^\s*in\s+/, ``).replace(/\s*\(at .*\)$/, ``);
      r2.push({ function: t3, raw: e3 });
    } else if (e3.match(k2)) {
      let t3 = I2(e3, void 0)[0];
      t3 && r2.push(t3);
    }
    return P2(r2, t2);
  }
  return e2.match(A2) ? F2(e2, t2) : I2(e2, t2);
};
var N2 = (e2) => {
  if (!e2.includes(`:`)) return [e2, void 0, void 0];
  let t2 = /(.+?)(?::(\d+))?(?::(\d+))?$/, n2 = t2.exec(e2.replace(/[()]/g, ``));
  return [n2[1], n2[2] || void 0, n2[3] || void 0];
};
var P2 = (e2, t2) => t2 && t2.slice != null ? Array.isArray(t2.slice) ? e2.slice(t2.slice[0], t2.slice[1]) : e2.slice(0, t2.slice) : e2;
var F2 = (e2, t2) => {
  let n2 = P2(e2.split(`
`).filter((e3) => !!e3.match(A2)), t2);
  return n2.map((e3) => {
    let t3 = e3;
    t3.includes(`(eval `) && (t3 = t3.replace(/eval code/g, `eval`).replace(/(\(eval at [^()]*)|(,.*$)/g, ``));
    let n3 = t3.replace(/^\s+/, ``).replace(/\(eval code/g, `(`).replace(/^.*?\s+/, ``), r2 = n3.match(/ (\(.+\)$)/);
    n3 = r2 ? n3.replace(r2[0], ``) : n3;
    let i2 = N2(r2 ? r2[1] : n3), a3 = r2 && n3 || void 0, o3 = [`eval`, `<anonymous>`].includes(i2[0]) ? void 0 : i2[0];
    return { function: a3, file: o3, line: i2[1] ? +i2[1] : void 0, col: i2[2] ? +i2[2] : void 0, raw: t3 };
  });
};
var I2 = (e2, t2) => {
  let n2 = P2(e2.split(`
`).filter((e3) => !e3.match(le2)), t2);
  return n2.map((e3) => {
    let t3 = e3;
    if (t3.includes(` > eval`) && (t3 = t3.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, `:$1`)), !t3.includes(`@`) && !t3.includes(`:`)) return { function: t3 };
    {
      let e4 = /(([^\n\r"\u2028\u2029]*".[^\n\r"\u2028\u2029]*"[^\n\r@\u2028\u2029]*(?:@[^\n\r"\u2028\u2029]*"[^\n\r@\u2028\u2029]*)*(?:[\n\r\u2028\u2029][^@]*)?)?[^@]*)@/, n3 = t3.match(e4), r2 = n3 && n3[1] ? n3[1] : void 0, i2 = N2(t3.replace(e4, ``));
      return { function: r2, file: i2[0], line: i2[1] ? +i2[1] : void 0, col: i2[2] ? +i2[2] : void 0, raw: t3 };
    }
  });
};
var pe2 = ne2((exports, t2) => {
  (function(n2, r2) {
    typeof exports == `object` && t2 !== void 0 ? r2(exports) : typeof define == `function` && define.amd ? define([`exports`], r2) : (n2 = typeof globalThis < `u` ? globalThis : n2 || self, r2(n2.sourcemapCodec = {}));
  })(void 0, function(e2) {
    "use strict";
    let t3 = 44, n2 = 59, r2 = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`, i2 = new Uint8Array(64), a3 = new Uint8Array(128);
    for (let e3 = 0; e3 < r2.length; e3++) {
      let t4 = r2.charCodeAt(e3);
      i2[e3] = t4, a3[t4] = e3;
    }
    function o3(e3, t4) {
      let n3 = 0, r3 = 0, i3 = 0;
      do {
        let t5 = e3.next();
        i3 = a3[t5], n3 |= (i3 & 31) << r3, r3 += 5;
      } while (i3 & 32);
      let o4 = n3 & 1;
      return n3 >>>= 1, o4 && (n3 = -2147483648 | -n3), t4 + n3;
    }
    function s3(e3, t4, n3) {
      let r3 = t4 - n3;
      r3 = r3 < 0 ? -r3 << 1 | 1 : r3 << 1;
      do {
        let t5 = r3 & 31;
        r3 >>>= 5, r3 > 0 && (t5 |= 32), e3.write(i2[t5]);
      } while (r3 > 0);
      return t4;
    }
    function c3(e3, n3) {
      return e3.pos >= n3 ? false : e3.peek() !== t3;
    }
    let l3 = 1024 * 16, u3 = typeof TextDecoder < `u` ? new TextDecoder() : typeof Buffer < `u` ? { decode(e3) {
      let t4 = Buffer.from(e3.buffer, e3.byteOffset, e3.byteLength);
      return t4.toString();
    } } : { decode(e3) {
      let t4 = ``;
      for (let n3 = 0; n3 < e3.length; n3++) t4 += String.fromCharCode(e3[n3]);
      return t4;
    } };
    class d3 {
      constructor() {
        this.pos = 0, this.out = ``, this.buffer = new Uint8Array(l3);
      }
      write(e3) {
        let { buffer: t4 } = this;
        t4[this.pos++] = e3, this.pos === l3 && (this.out += u3.decode(t4), this.pos = 0);
      }
      flush() {
        let { buffer: e3, out: t4, pos: n3 } = this;
        return n3 > 0 ? t4 + u3.decode(e3.subarray(0, n3)) : t4;
      }
    }
    class f3 {
      constructor(e3) {
        this.pos = 0, this.buffer = e3;
      }
      next() {
        return this.buffer.charCodeAt(this.pos++);
      }
      peek() {
        return this.buffer.charCodeAt(this.pos);
      }
      indexOf(e3) {
        let { buffer: t4, pos: n3 } = this, r3 = t4.indexOf(e3, n3);
        return r3 === -1 ? t4.length : r3;
      }
    }
    let p3 = [];
    function m3(e3) {
      let { length: t4 } = e3, n3 = new f3(e3), r3 = [], i3 = [], a4 = 0;
      for (; n3.pos < t4; n3.pos++) {
        a4 = o3(n3, a4);
        let e4 = o3(n3, 0);
        if (!c3(n3, t4)) {
          let t5 = i3.pop();
          t5[2] = a4, t5[3] = e4;
          continue;
        }
        let s4 = o3(n3, 0), l4 = o3(n3, 0), u4 = l4 & 1, d4 = u4 ? [a4, e4, 0, 0, s4, o3(n3, 0)] : [a4, e4, 0, 0, s4], f4 = p3;
        if (c3(n3, t4)) {
          f4 = [];
          do {
            let e5 = o3(n3, 0);
            f4.push(e5);
          } while (c3(n3, t4));
        }
        d4.vars = f4, r3.push(d4), i3.push(d4);
      }
      return r3;
    }
    function h3(e3) {
      let t4 = new d3();
      for (let n3 = 0; n3 < e3.length; ) n3 = g3(e3, n3, t4, [0]);
      return t4.flush();
    }
    function g3(e3, n3, r3, i3) {
      let a4 = e3[n3], { 0: o4, 1: c4, 2: l4, 3: u4, 4: d4, vars: f4 } = a4;
      n3 > 0 && r3.write(t3), i3[0] = s3(r3, o4, i3[0]), s3(r3, c4, 0), s3(r3, d4, 0);
      let p4 = a4.length === 6 ? 1 : 0;
      s3(r3, p4, 0), a4.length === 6 && s3(r3, a4[5], 0);
      for (let e4 of f4) s3(r3, e4, 0);
      for (n3++; n3 < e3.length; ) {
        let t4 = e3[n3], { 0: a5, 1: o5 } = t4;
        if (a5 > l4 || a5 === l4 && o5 >= u4) break;
        n3 = g3(e3, n3, r3, i3);
      }
      return r3.write(t3), i3[0] = s3(r3, l4, i3[0]), s3(r3, u4, 0), n3;
    }
    function _3(e3) {
      let { length: t4 } = e3, n3 = new f3(e3), r3 = [], i3 = [], a4 = 0, s4 = 0, l4 = 0, u4 = 0, d4 = 0, m4 = 0, h4 = 0, g4 = 0;
      do {
        let e4 = n3.indexOf(`;`), t5 = 0;
        for (; n3.pos < e4; n3.pos++) {
          if (t5 = o3(n3, t5), !c3(n3, e4)) {
            let e5 = i3.pop();
            e5[2] = a4, e5[3] = t5;
            continue;
          }
          let f4 = o3(n3, 0), _4 = f4 & 1, v3 = f4 & 2, y3 = f4 & 4, b4 = null, x4 = p3, S4;
          if (_4) {
            let e5 = o3(n3, s4);
            l4 = o3(n3, s4 === e5 ? l4 : 0), s4 = e5, S4 = [a4, t5, 0, 0, e5, l4];
          } else S4 = [a4, t5, 0, 0];
          if (S4.isScope = !!y3, v3) {
            let e5 = u4, t6 = d4;
            u4 = o3(n3, u4);
            let r4 = e5 === u4;
            d4 = o3(n3, r4 ? d4 : 0), m4 = o3(n3, r4 && t6 === d4 ? m4 : 0), b4 = [u4, d4, m4];
          }
          if (S4.callsite = b4, c3(n3, e4)) {
            x4 = [];
            do {
              h4 = a4, g4 = t5;
              let e5 = o3(n3, 0), r4;
              if (e5 < -1) {
                r4 = [[o3(n3, 0)]];
                for (let t6 = -1; t6 > e5; t6--) {
                  let e6 = h4;
                  h4 = o3(n3, h4), g4 = o3(n3, h4 === e6 ? g4 : 0);
                  let t7 = o3(n3, 0);
                  r4.push([t7, h4, g4]);
                }
              } else r4 = [[e5]];
              x4.push(r4);
            } while (c3(n3, e4));
          }
          S4.bindings = x4, r3.push(S4), i3.push(S4);
        }
        a4++, n3.pos = e4 + 1;
      } while (n3.pos < t4);
      return r3;
    }
    function v2(e3) {
      if (e3.length === 0) return ``;
      let t4 = new d3();
      for (let n3 = 0; n3 < e3.length; ) n3 = y2(e3, n3, t4, [0, 0, 0, 0, 0, 0, 0]);
      return t4.flush();
    }
    function y2(e3, n3, r3, i3) {
      let a4 = e3[n3], { 0: o4, 1: c4, 2: l4, 3: u4, isScope: d4, callsite: f4, bindings: p4 } = a4;
      i3[0] < o4 ? (b3(r3, i3[0], o4), i3[0] = o4, i3[1] = 0) : n3 > 0 && r3.write(t3), i3[1] = s3(r3, a4[1], i3[1]);
      let m4 = (a4.length === 6 ? 1 : 0) | (f4 ? 2 : 0) | (d4 ? 4 : 0);
      if (s3(r3, m4, 0), a4.length === 6) {
        let { 4: e4, 5: t4 } = a4;
        e4 !== i3[2] && (i3[3] = 0), i3[2] = s3(r3, e4, i3[2]), i3[3] = s3(r3, t4, i3[3]);
      }
      if (f4) {
        let { 0: e4, 1: t4, 2: n4 } = a4.callsite;
        e4 === i3[4] ? t4 !== i3[5] && (i3[6] = 0) : (i3[5] = 0, i3[6] = 0), i3[4] = s3(r3, e4, i3[4]), i3[5] = s3(r3, t4, i3[5]), i3[6] = s3(r3, n4, i3[6]);
      }
      if (p4) for (let e4 of p4) {
        e4.length > 1 && s3(r3, -e4.length, 0);
        let t4 = e4[0][0];
        s3(r3, t4, 0);
        let n4 = o4, i4 = c4;
        for (let t5 = 1; t5 < e4.length; t5++) {
          let a5 = e4[t5];
          n4 = s3(r3, a5[1], n4), i4 = s3(r3, a5[2], i4), s3(r3, a5[0], 0);
        }
      }
      for (n3++; n3 < e3.length; ) {
        let t4 = e3[n3], { 0: a5, 1: o5 } = t4;
        if (a5 > l4 || a5 === l4 && o5 >= u4) break;
        n3 = y2(e3, n3, r3, i3);
      }
      return i3[0] < l4 ? (b3(r3, i3[0], l4), i3[0] = l4, i3[1] = 0) : r3.write(t3), i3[1] = s3(r3, u4, i3[1]), n3;
    }
    function b3(e3, t4, r3) {
      do
        e3.write(n2);
      while (++t4 < r3);
    }
    function x3(e3) {
      let { length: t4 } = e3, n3 = new f3(e3), r3 = [], i3 = 0, a4 = 0, s4 = 0, l4 = 0, u4 = 0;
      do {
        let e4 = n3.indexOf(`;`), t5 = [], d4 = true, f4 = 0;
        for (i3 = 0; n3.pos < e4; ) {
          let r4;
          i3 = o3(n3, i3), i3 < f4 && (d4 = false), f4 = i3, c3(n3, e4) ? (a4 = o3(n3, a4), s4 = o3(n3, s4), l4 = o3(n3, l4), c3(n3, e4) ? (u4 = o3(n3, u4), r4 = [i3, a4, s4, l4, u4]) : r4 = [i3, a4, s4, l4]) : r4 = [i3], t5.push(r4), n3.pos++;
        }
        d4 || S3(t5), r3.push(t5), n3.pos = e4 + 1;
      } while (n3.pos <= t4);
      return r3;
    }
    function S3(e3) {
      e3.sort(C3);
    }
    function C3(e3, t4) {
      return e3[0] - t4[0];
    }
    function ee3(e3) {
      let r3 = new d3(), i3 = 0, a4 = 0, o4 = 0, c4 = 0;
      for (let l4 = 0; l4 < e3.length; l4++) {
        let u4 = e3[l4];
        if (l4 > 0 && r3.write(n2), u4.length === 0) continue;
        let d4 = 0;
        for (let e4 = 0; e4 < u4.length; e4++) {
          let n3 = u4[e4];
          e4 > 0 && r3.write(t3), d4 = s3(r3, n3[0], d4), n3.length !== 1 && (i3 = s3(r3, n3[1], i3), a4 = s3(r3, n3[2], a4), o4 = s3(r3, n3[3], o4), n3.length !== 4 && (c4 = s3(r3, n3[4], c4)));
        }
      }
      return r3.flush();
    }
    e2.decode = x3, e2.decodeGeneratedRanges = _3, e2.decodeOriginalScopes = m3, e2.encode = ee3, e2.encodeGeneratedRanges = v2, e2.encodeOriginalScopes = h3, Object.defineProperty(e2, `__esModule`, { value: true });
  });
});
var B2 = ie2(pe2(), 1);
var V2 = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
var me2 = /^data:application\/json[^,]+base64,/;
var he2 = /(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/;
var H2 = typeof WeakRef < `u`;
var U2 = /* @__PURE__ */ new Map();
var W2 = /* @__PURE__ */ new Map();
var ge2 = (e2) => H2 && e2 instanceof WeakRef;
var G2 = (e2, t2, n2, r2) => {
  if (n2 < 0 || n2 >= e2.length) return null;
  let i2 = e2[n2];
  if (!i2 || i2.length === 0) return null;
  let a3 = null;
  for (let e3 of i2) if (e3[0] <= r2) a3 = e3;
  else break;
  if (!a3 || a3.length < 4) return null;
  let [, o3, s3, c3] = a3;
  if (o3 === void 0 || s3 === void 0 || c3 === void 0) return null;
  let l3 = t2[o3];
  return l3 ? { columnNumber: c3, fileName: l3, lineNumber: s3 + 1 } : null;
};
var K = (e2, t2, n2) => {
  if (e2.sections) {
    let r2 = null;
    for (let i3 of e2.sections) if (t2 > i3.offset.line || t2 === i3.offset.line && n2 >= i3.offset.column) r2 = i3;
    else break;
    if (!r2) return null;
    let i2 = t2 - r2.offset.line, a3 = t2 === r2.offset.line ? n2 - r2.offset.column : n2;
    return G2(r2.map.mappings, r2.map.sources, i2, a3);
  }
  return G2(e2.mappings, e2.sources, t2 - 1, n2);
};
var _e2 = (e2, t2) => {
  let n2 = t2.split(`
`), r2;
  for (let e3 = n2.length - 1; e3 >= 0 && !r2; e3--) {
    let t3 = n2[e3].match(he2);
    t3 && (r2 = t3[1] || t3[2]);
  }
  if (!r2) return null;
  let i2 = V2.test(r2);
  if (!(me2.test(r2) || i2 || r2.startsWith(`/`))) {
    let t3 = e2.split(`/`);
    t3[t3.length - 1] = r2, r2 = t3.join(`/`);
  }
  return r2;
};
var ve2 = (e2) => ({ file: e2.file, mappings: (0, B2.decode)(e2.mappings), names: e2.names, sourceRoot: e2.sourceRoot, sources: e2.sources, sourcesContent: e2.sourcesContent, version: 3 });
var ye2 = (e2) => {
  let t2 = e2.sections.map(({ map: e3, offset: t3 }) => ({ map: { ...e3, mappings: (0, B2.decode)(e3.mappings) }, offset: t3 })), n2 = /* @__PURE__ */ new Set();
  for (let e3 of t2) for (let t3 of e3.map.sources) n2.add(t3);
  return { file: e2.file, mappings: [], names: [], sections: t2, sourceRoot: void 0, sources: Array.from(n2), sourcesContent: void 0, version: 3 };
};
var q = (e2) => {
  if (!e2) return false;
  let t2 = e2.trim();
  if (!t2) return false;
  let n2 = t2.match(V2);
  if (!n2) return true;
  let r2 = n2[0].toLowerCase();
  return r2 === `http:` || r2 === `https:`;
};
var J = async (e2, t2 = fetch) => {
  if (!q(e2)) return null;
  let n2;
  try {
    let r3 = await t2(e2);
    n2 = await r3.text();
  } catch {
    return null;
  }
  if (!n2) return null;
  let r2 = _e2(e2, n2);
  if (!r2 || !q(r2)) return null;
  try {
    let e3 = await t2(r2), n3 = await e3.json();
    return `sections` in n3 ? ye2(n3) : ve2(n3);
  } catch {
    return null;
  }
};
var Y = async (e2, t2 = true, n2) => {
  if (t2 && U2.has(e2)) {
    let t3 = U2.get(e2);
    if (t3 == null) return null;
    if (ge2(t3)) {
      let n3 = t3.deref();
      if (n3) return n3;
      U2.delete(e2);
    } else return t3;
  }
  if (t2 && W2.has(e2)) return W2.get(e2);
  let r2 = J(e2, n2);
  t2 && W2.set(e2, r2);
  let i2 = await r2;
  return t2 && W2.delete(e2), t2 && (i2 === null ? U2.set(e2, null) : U2.set(e2, H2 ? new WeakRef(i2) : i2)), i2;
};
var be2 = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;
var xe2 = [`rsc://`, `file:///`, `webpack://`, `node:`, `turbopack://`, `metro://`];
var Se2 = `about://React/`;
var Ce2 = [`<anonymous>`, `eval`, ``];
var we2 = /\.(jsx|tsx|ts|js)$/;
var Te2 = /(\.min|bundle|chunk|vendor|vendors|runtime|polyfill|polyfills)\.(js|mjs|cjs)$|(chunk|bundle|vendor|vendors|runtime|polyfill|polyfills|framework|app|main|index)[-_.][A-Za-z0-9_-]{4,}\.(js|mjs|cjs)$|[\da-f]{8,}\.(js|mjs|cjs)$|[-_.][\da-f]{20,}\.(js|mjs|cjs)$|\/dist\/|\/build\/|\/.next\/|\/out\/|\/node_modules\/|\.webpack\.|\.vite\.|\.turbopack\./i;
var Ee2 = /^\?[\w~.\-]+(?:=[^&#]*)?(?:&[\w~.\-]+(?:=[^&#]*)?)*$/;
var De2 = (e2) => e2._debugStack instanceof Error && typeof e2._debugStack?.stack == `string`;
var Oe = (e2) => {
  let t2 = e2._debugSource;
  return t2 ? typeof t2 == `object` && !!t2 && `fileName` in t2 && typeof t2.fileName == `string` && `lineNumber` in t2 && typeof t2.lineNumber == `number` : false;
};
var ke2 = async (e2, t2 = true, n2) => {
  if (Oe(e2)) {
    let t3 = e2._debugSource;
    return t3 || null;
  }
  let r2 = X2(e2), i2 = await Z(r2, 1, t2, n2);
  return !i2 || i2.length === 0 ? null : i2[0];
};
var X2 = (e2) => De2(e2) ? O2(e2._debugStack.stack) : ce2(e2);
var Z = async (e2, t2 = 1, n2 = true, r2) => {
  let i2 = M2(e2, { slice: t2 ?? 1 }), a3 = [];
  for (let e3 of i2) {
    if (!e3?.file) continue;
    let t3 = await Y(e3.file, n2, r2);
    if (t3 && typeof e3.line == `number` && typeof e3.col == `number`) {
      let n3 = K(t3, e3.line, e3.col);
      if (n3) {
        a3.push(n3);
        continue;
      }
    }
    a3.push({ fileName: e3.file, lineNumber: e3.line, columnNumber: e3.col, functionName: e3.function });
  }
  return a3;
};
var Q = (e2) => {
  if (!e2 || Ce2.includes(e2)) return ``;
  let t2 = e2;
  if (t2.startsWith(Se2)) {
    let e3 = t2.slice(Se2.length), n3 = e3.indexOf(`/`), r2 = e3.indexOf(`:`);
    t2 = n3 !== -1 && (r2 === -1 || n3 < r2) ? e3.slice(n3 + 1) : e3;
  }
  for (let e3 of xe2) if (t2.startsWith(e3)) {
    t2 = t2.slice(e3.length), e3 === `file:///` && (t2 = `/${t2.replace(/^\/+/, ``)}`);
    break;
  }
  if (be2.test(t2)) {
    let e3 = t2.match(be2);
    e3 && (t2 = t2.slice(e3[0].length));
  }
  let n2 = t2.indexOf(`?`);
  if (n2 !== -1) {
    let e3 = t2.slice(n2);
    Ee2.test(e3) && (t2 = t2.slice(0, n2));
  }
  return t2;
};
var je2 = (e2) => {
  let t2 = Q(e2);
  return !(!t2 || !we2.test(t2) || Te2.test(t2));
};

// frontend/node_modules/react-grab/dist/index.js
var FORM_TAGS_AND_ROLES = [
  "input",
  "textarea",
  "select",
  "searchbox",
  "slider",
  "spinbutton",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "radio",
  "textbox"
];
var isCustomElement = (element) => {
  return Boolean(element.tagName) && !element.tagName.startsWith("-") && element.tagName.includes("-");
};
var isReadonlyArray = (value) => {
  return Array.isArray(value);
};
var isHotkeyEnabledOnTagName = (event, enabledOnTags = false) => {
  const { composed, target } = event;
  let targetTagName;
  let targetRole;
  if (target instanceof HTMLElement && isCustomElement(target) && composed) {
    const composedPath = event.composedPath();
    const targetElement = composedPath[0];
    if (targetElement instanceof HTMLElement) {
      targetTagName = targetElement.tagName;
      targetRole = targetElement.role;
    }
  } else if (target instanceof HTMLElement) {
    targetTagName = target.tagName;
    targetRole = target.role;
  }
  if (isReadonlyArray(enabledOnTags)) {
    return Boolean(
      targetTagName && enabledOnTags && enabledOnTags.some(
        (tag) => typeof targetTagName === "string" && tag.toLowerCase() === targetTagName.toLowerCase() || tag === targetRole
      )
    );
  }
  return Boolean(targetTagName && enabledOnTags && enabledOnTags);
};
var isKeyboardEventTriggeredByInput = (event) => {
  return isHotkeyEnabledOnTagName(event, FORM_TAGS_AND_ROLES);
};
var ATTRIBUTE_NAME = "data-react-grab";
var mountRoot = () => {
  const mountedHost = document.querySelector(`[${ATTRIBUTE_NAME}]`);
  if (mountedHost) {
    const mountedRoot = mountedHost.shadowRoot?.querySelector(
      `[${ATTRIBUTE_NAME}]`
    );
    if (mountedRoot instanceof HTMLDivElement && mountedHost.shadowRoot) {
      return mountedRoot;
    }
  }
  const host = document.createElement("div");
  host.setAttribute(ATTRIBUTE_NAME, "true");
  host.style.zIndex = "2147483646";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  const shadowRoot = host.attachShadow({ mode: "open" });
  const root = document.createElement("div");
  root.setAttribute(ATTRIBUTE_NAME, "true");
  shadowRoot.appendChild(root);
  const doc = document.body ?? document.documentElement;
  doc.appendChild(host);
  return root;
};
var VIEWPORT_MARGIN_PX = 8;
var INDICATOR_CLAMP_PADDING_PX = 4;
var CURSOR_OFFSET_PX = 14;
var OFFSCREEN_POSITION = -1e3;
var SELECTION_LERP_FACTOR = 0.95;
var SUCCESS_LABEL_DURATION_MS = 1700;
var PROGRESS_INDICATOR_DELAY_MS = 150;
var DRAG_THRESHOLD_PX = 2;
var Z_INDEX_LABEL = 2147483647;
var lerp = (start, end, factor) => {
  return start + (end - start) * factor;
};
var _tmpl$ = template(`<div>`);
var SelectionBox = (props) => {
  const [currentX, setCurrentX] = createSignal(props.bounds.x);
  const [currentY, setCurrentY] = createSignal(props.bounds.y);
  const [currentWidth, setCurrentWidth] = createSignal(props.bounds.width);
  const [currentHeight, setCurrentHeight] = createSignal(props.bounds.height);
  const [opacity, setOpacity] = createSignal(1);
  let hasBeenRenderedOnce = false;
  let animationFrameId = null;
  let fadeTimerId = null;
  let targetBounds = props.bounds;
  let isAnimating = false;
  const lerpFactor = () => {
    if (props.lerpFactor !== void 0) return props.lerpFactor;
    if (props.variant === "drag") return 0.7;
    return SELECTION_LERP_FACTOR;
  };
  const startAnimation = () => {
    if (isAnimating) return;
    isAnimating = true;
    const animate = () => {
      const interpolatedX = lerp(currentX(), targetBounds.x, lerpFactor());
      const interpolatedY = lerp(currentY(), targetBounds.y, lerpFactor());
      const interpolatedWidth = lerp(currentWidth(), targetBounds.width, lerpFactor());
      const interpolatedHeight = lerp(currentHeight(), targetBounds.height, lerpFactor());
      setCurrentX(interpolatedX);
      setCurrentY(interpolatedY);
      setCurrentWidth(interpolatedWidth);
      setCurrentHeight(interpolatedHeight);
      const hasConvergedToTarget = Math.abs(interpolatedX - targetBounds.x) < 0.5 && Math.abs(interpolatedY - targetBounds.y) < 0.5 && Math.abs(interpolatedWidth - targetBounds.width) < 0.5 && Math.abs(interpolatedHeight - targetBounds.height) < 0.5;
      if (!hasConvergedToTarget) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
        isAnimating = false;
      }
    };
    animationFrameId = requestAnimationFrame(animate);
  };
  createEffect(on(() => props.bounds, (newBounds) => {
    targetBounds = newBounds;
    if (!hasBeenRenderedOnce) {
      setCurrentX(targetBounds.x);
      setCurrentY(targetBounds.y);
      setCurrentWidth(targetBounds.width);
      setCurrentHeight(targetBounds.height);
      hasBeenRenderedOnce = true;
      return;
    }
    startAnimation();
  }));
  createEffect(() => {
    if (props.variant === "grabbed" && props.createdAt) {
      fadeTimerId = window.setTimeout(() => {
        setOpacity(0);
      }, 1500);
    }
  });
  onCleanup(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (fadeTimerId !== null) {
      window.clearTimeout(fadeTimerId);
      fadeTimerId = null;
    }
    isAnimating = false;
  });
  const baseStyle = {
    position: "fixed",
    "box-sizing": "border-box",
    "pointer-events": props.variant === "drag" ? "none" : "auto",
    "z-index": props.variant === "grabbed" ? "2147483645" : "2147483646"
  };
  const variantStyle = () => {
    if (props.variant === "drag") {
      return {
        border: "1px dashed rgba(210, 57, 192, 0.4)",
        "background-color": "rgba(210, 57, 192, 0.05)",
        "will-change": "transform, width, height",
        contain: "layout paint size",
        cursor: "crosshair"
      };
    }
    if (props.variant === "selection") {
      return {
        border: "1px dashed rgba(210, 57, 192, 0.5)",
        "background-color": "rgba(210, 57, 192, 0.08)"
      };
    }
    return {
      border: "1px solid rgb(210, 57, 192)",
      "background-color": "rgba(210, 57, 192, 0.08)",
      transition: "opacity 0.3s ease-out"
    };
  };
  return createComponent(Show, {
    get when() {
      return props.visible !== false;
    },
    get children() {
      var _el$ = _tmpl$();
      createRenderEffect((_$p) => style(_el$, {
        ...baseStyle,
        ...variantStyle(),
        top: `${currentY()}px`,
        left: `${currentX()}px`,
        width: `${currentWidth()}px`,
        height: `${currentHeight()}px`,
        "border-radius": props.bounds.borderRadius,
        transform: props.bounds.transform,
        opacity: opacity()
      }, _$p));
      return _el$;
    }
  });
};
var _tmpl$2 = template(`<span style="display:inline-block;width:8px;height:8px;border:1.5px solid rgb(210, 57, 192);border-top-color:transparent;border-radius:50%;margin-right:4px;vertical-align:middle">`);
var Spinner = (props) => {
  let spinnerRef;
  onMount(() => {
    if (spinnerRef) {
      spinnerRef.animate([{
        transform: "rotate(0deg)"
      }, {
        transform: "rotate(360deg)"
      }], {
        duration: 600,
        easing: "linear",
        iterations: Infinity
      });
    }
  });
  return (() => {
    var _el$ = _tmpl$2();
    var _ref$ = spinnerRef;
    typeof _ref$ === "function" ? use(_ref$, _el$) : spinnerRef = _el$;
    createRenderEffect((_$p) => style(_el$, {
      ...props.style
    }, _$p));
    return _el$;
  })();
};
var getClampedElementPosition = (positionLeft, positionTop, elementWidth, elementHeight) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const minLeft = VIEWPORT_MARGIN_PX;
  const minTop = VIEWPORT_MARGIN_PX;
  const maxLeft = viewportWidth - elementWidth - VIEWPORT_MARGIN_PX;
  const maxTop = viewportHeight - elementHeight - VIEWPORT_MARGIN_PX;
  const clampedLeft = Math.max(minLeft, Math.min(positionLeft, maxLeft));
  const clampedTop = Math.max(minTop, Math.min(positionTop, maxTop));
  return { left: clampedLeft, top: clampedTop };
};
var useAnimatedPosition = (options) => {
  const lerpFactor = options.lerpFactor ?? 0.3;
  const convergenceThreshold = options.convergenceThreshold ?? 0.5;
  const [x3, setX] = createSignal(options.x());
  const [y2, setY] = createSignal(options.y());
  let targetX = options.x();
  let targetY = options.y();
  let animationFrameId = null;
  let hasBeenRenderedOnce = false;
  const animate = () => {
    const currentX = lerp(x3(), targetX, lerpFactor);
    const currentY = lerp(y2(), targetY, lerpFactor);
    setX(currentX);
    setY(currentY);
    const hasConverged = Math.abs(currentX - targetX) < convergenceThreshold && Math.abs(currentY - targetY) < convergenceThreshold;
    if (!hasConverged) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      animationFrameId = null;
    }
  };
  const startAnimation = () => {
    if (animationFrameId !== null) return;
    animationFrameId = requestAnimationFrame(animate);
  };
  createEffect(() => {
    targetX = options.x();
    targetY = options.y();
    if (!hasBeenRenderedOnce) {
      setX(targetX);
      setY(targetY);
      hasBeenRenderedOnce = true;
      return;
    }
    startAnimation();
  });
  onCleanup(() => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });
  return { x: x3, y: y2 };
};
var useFadeInOut = (options) => {
  const [opacity, setOpacity] = createSignal(0);
  createEffect(
    on(
      () => options.visible,
      (isVisible) => {
        if (isVisible !== false) {
          requestAnimationFrame(() => {
            setOpacity(1);
          });
        } else {
          setOpacity(0);
          return;
        }
        if (options.autoFadeOutAfter !== void 0) {
          const fadeOutTimer = setTimeout(() => {
            setOpacity(0);
          }, options.autoFadeOutAfter);
          onCleanup(() => clearTimeout(fadeOutTimer));
        }
      }
    )
  );
  return opacity;
};
var getCursorQuadrants = (cursorX, cursorY, elementWidth, elementHeight, offset) => {
  return [
    {
      left: Math.round(cursorX) + offset,
      top: Math.round(cursorY) + offset
    },
    {
      left: Math.round(cursorX) - elementWidth - offset,
      top: Math.round(cursorY) + offset
    },
    {
      left: Math.round(cursorX) + offset,
      top: Math.round(cursorY) - elementHeight - offset
    },
    {
      left: Math.round(cursorX) - elementWidth - offset,
      top: Math.round(cursorY) - elementHeight - offset
    }
  ];
};
var _tmpl$3 = template(`<div style="position:absolute;top:0;left:0;bottom:0;background-color:rgba(178, 28, 142, 0.2);border-radius:3px;transition:width 0.1s ease-out;pointer-events:none">`);
var _tmpl$22 = template(`<span style=display:inline-block;margin-right:4px;font-weight:600>✓`);
var _tmpl$32 = template(`<div style=margin-right:4px>Copied`);
var _tmpl$4 = template(`<span style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-variant-numeric:tabular-nums;vertical-align:middle">`);
var _tmpl$5 = template(`<span style=font-variant-numeric:tabular-nums;font-size:10px;margin-left:4px;vertical-align:middle>`);
var _tmpl$6 = template(`<div style=margin-left:4px>to clipboard`);
var _tmpl$7 = template(`<div style=font-size:9px;opacity:0.6;text-align:center;margin-top:2px>Click or drag to select`);
var _tmpl$8 = template(`<div style="position:fixed;background-color:#fde7f7;color:#b21c8e;border:1px solid #f7c5ec;border-radius:4px;font-size:11px;font-weight:500;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;pointer-events:none;transition:opacity 0.2s ease-in-out;max-width:calc(100vw - (16px + env(safe-area-inset-left) + env(safe-area-inset-right)));overflow:hidden"><div style="position:relative;padding:2px 6px;display:flex;flex-direction:column"><div style=display:flex;align-items:center;text-overflow:ellipsis;white-space:nowrap>`);
var Label = (props) => {
  let labelRef;
  const position = useAnimatedPosition({
    x: () => props.x,
    y: () => props.y,
    lerpFactor: 0.3
  });
  const opacity = useFadeInOut({
    visible: props.visible,
    autoFadeOutAfter: props.variant === "success" ? SUCCESS_LABEL_DURATION_MS : void 0
  });
  const labelBoundingRect = () => labelRef?.getBoundingClientRect();
  const computedPosition = () => {
    const boundingRect = labelBoundingRect();
    if (!boundingRect) return {
      left: position.x(),
      top: position.y()
    };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const quadrants = getCursorQuadrants(position.x(), position.y(), boundingRect.width, boundingRect.height, CURSOR_OFFSET_PX);
    for (const position2 of quadrants) {
      const fitsHorizontally = position2.left >= VIEWPORT_MARGIN_PX && position2.left + boundingRect.width <= viewportWidth - VIEWPORT_MARGIN_PX;
      const fitsVertically = position2.top >= VIEWPORT_MARGIN_PX && position2.top + boundingRect.height <= viewportHeight - VIEWPORT_MARGIN_PX;
      if (fitsHorizontally && fitsVertically) {
        return position2;
      }
    }
    const fallback = getClampedElementPosition(quadrants[0].left, quadrants[0].top, boundingRect.width, boundingRect.height);
    fallback.left += INDICATOR_CLAMP_PADDING_PX;
    fallback.top += INDICATOR_CLAMP_PADDING_PX;
    return fallback;
  };
  const labelSegments = () => {
    const separator = " in ";
    const separatorIndex = props.text.indexOf(separator);
    if (separatorIndex === -1) {
      return {
        primary: props.text,
        secondary: ""
      };
    }
    return {
      primary: props.text.slice(0, separatorIndex),
      secondary: props.text.slice(separatorIndex)
    };
  };
  return createComponent(Show, {
    get when() {
      return props.visible !== false;
    },
    get children() {
      var _el$ = _tmpl$8(), _el$3 = _el$.firstChild, _el$4 = _el$3.firstChild;
      var _ref$ = labelRef;
      typeof _ref$ === "function" ? use(_ref$, _el$) : labelRef = _el$;
      insert(_el$, createComponent(Show, {
        get when() {
          return memo(() => props.variant === "processing")() && props.progress !== void 0;
        },
        get children() {
          var _el$2 = _tmpl$3();
          createRenderEffect((_$p) => setStyleProperty(_el$2, "width", `${Math.min(100, Math.max(0, (props.progress ?? 0) * 100))}%`));
          return _el$2;
        }
      }), _el$3);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant === "processing";
        },
        get children() {
          return createComponent(Spinner, {});
        }
      }), null);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant === "success";
        },
        get children() {
          return _tmpl$22();
        }
      }), null);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant === "success";
        },
        get children() {
          return _tmpl$32();
        }
      }), null);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant === "processing";
        },
        children: "Please wait…"
      }), null);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant !== "processing";
        },
        get children() {
          return [(() => {
            var _el$7 = _tmpl$4();
            insert(_el$7, () => labelSegments().primary);
            return _el$7;
          })(), createComponent(Show, {
            get when() {
              return memo(() => props.variant === "hover")() && labelSegments().secondary !== "";
            },
            get children() {
              var _el$8 = _tmpl$5();
              insert(_el$8, () => labelSegments().secondary);
              return _el$8;
            }
          })];
        }
      }), null);
      insert(_el$4, createComponent(Show, {
        get when() {
          return props.variant === "success";
        },
        get children() {
          return _tmpl$6();
        }
      }), null);
      insert(_el$3, createComponent(Show, {
        get when() {
          return memo(() => props.variant === "hover")() && props.showHint;
        },
        get children() {
          return _tmpl$7();
        }
      }), null);
      createRenderEffect((_p$) => {
        var _v$ = `${computedPosition().top}px`, _v$2 = `${computedPosition().left}px`, _v$3 = props.zIndex?.toString() ?? "2147483647", _v$4 = opacity();
        _v$ !== _p$.e && setStyleProperty(_el$, "top", _p$.e = _v$);
        _v$2 !== _p$.t && setStyleProperty(_el$, "left", _p$.t = _v$2);
        _v$3 !== _p$.a && setStyleProperty(_el$, "z-index", _p$.a = _v$3);
        _v$4 !== _p$.o && setStyleProperty(_el$, "opacity", _p$.o = _v$4);
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0,
        o: void 0
      });
      return _el$;
    }
  });
};
var _tmpl$9 = template(`<canvas style=position:fixed;top:0;left:0;pointer-events:none;z-index:2147483645>`);
var Crosshair = (props) => {
  let canvasRef;
  let context = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  const position = useAnimatedPosition({
    x: () => props.mouseX,
    y: () => props.mouseY,
    lerpFactor: 0.3
  });
  const setupCanvas = () => {
    if (!canvasRef) return;
    dpr = Math.max(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvasRef.width = width * dpr;
    canvasRef.height = height * dpr;
    canvasRef.style.width = `${width}px`;
    canvasRef.style.height = `${height}px`;
    context = canvasRef.getContext("2d");
    if (context) {
      context.scale(dpr, dpr);
    }
  };
  const render2 = () => {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = "rgba(210, 57, 192)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(position.x(), 0);
    context.lineTo(position.x(), height);
    context.moveTo(0, position.y());
    context.lineTo(width, position.y());
    context.stroke();
  };
  createEffect(() => {
    setupCanvas();
    render2();
    const handleResize = () => {
      setupCanvas();
      render2();
    };
    window.addEventListener("resize", handleResize);
    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
  });
  createEffect(() => {
    position.x();
    position.y();
    render2();
  });
  return createComponent(Show, {
    get when() {
      return props.visible !== false;
    },
    get children() {
      var _el$ = _tmpl$9();
      var _ref$ = canvasRef;
      typeof _ref$ === "function" ? use(_ref$, _el$) : canvasRef = _el$;
      return _el$;
    }
  });
};
var ReactGrabRenderer = (props) => {
  return [createComponent(Show, {
    get when() {
      return memo(() => !!props.selectionVisible)() && props.selectionBounds;
    },
    get children() {
      return createComponent(SelectionBox, {
        variant: "selection",
        get bounds() {
          return props.selectionBounds;
        },
        get visible() {
          return props.selectionVisible;
        }
      });
    }
  }), createComponent(Show, {
    get when() {
      return memo(() => !!(props.crosshairVisible === true && props.mouseX !== void 0))() && props.mouseY !== void 0;
    },
    get children() {
      return createComponent(Crosshair, {
        get mouseX() {
          return props.mouseX;
        },
        get mouseY() {
          return props.mouseY;
        },
        visible: true
      });
    }
  }), createComponent(Show, {
    get when() {
      return memo(() => !!props.dragVisible)() && props.dragBounds;
    },
    get children() {
      return createComponent(SelectionBox, {
        variant: "drag",
        get bounds() {
          return props.dragBounds;
        },
        get visible() {
          return props.dragVisible;
        }
      });
    }
  }), createComponent(For, {
    get each() {
      return props.grabbedBoxes ?? [];
    },
    children: (box) => createComponent(SelectionBox, {
      variant: "grabbed",
      get bounds() {
        return box.bounds;
      },
      get createdAt() {
        return box.createdAt;
      }
    })
  }), createComponent(Show, {
    get when() {
      return props.labelVariant !== "processing";
    },
    get children() {
      return createComponent(For, {
        get each() {
          return props.successLabels ?? [];
        },
        children: (label) => createComponent(Label, {
          variant: "success",
          get text() {
            return label.text;
          },
          get x() {
            return props.mouseX ?? 0;
          },
          get y() {
            return props.mouseY ?? 0;
          }
        })
      });
    }
  }), createComponent(Show, {
    get when() {
      return memo(() => !!(props.labelVisible && props.labelVariant && props.labelText && props.labelX !== void 0))() && props.labelY !== void 0;
    },
    get children() {
      return createComponent(Label, {
        get variant() {
          return props.labelVariant;
        },
        get text() {
          return props.labelText;
        },
        get x() {
          return props.labelX;
        },
        get y() {
          return props.labelY;
        },
        get visible() {
          return props.labelVisible;
        },
        get zIndex() {
          return props.labelZIndex;
        },
        get progress() {
          return props.progress;
        },
        get showHint() {
          return props.labelShowHint;
        }
      });
    }
  })];
};
var isCapitalized = (value) => value.length > 0 && /^[A-Z]/.test(value);
var NEXT_INTERNAL_COMPONENT_NAMES = [
  "InnerLayoutRouter",
  "RedirectErrorBoundary",
  "RedirectBoundary",
  "HTTPAccessFallbackErrorBoundary",
  "HTTPAccessFallbackBoundary",
  "LoadingBoundary",
  "ErrorBoundary",
  "InnerScrollAndFocusHandler",
  "ScrollAndFocusHandler",
  "RenderFromTemplateContext",
  "OuterLayoutRouter",
  "body",
  "html",
  "RedirectErrorBoundary",
  "RedirectBoundary",
  "HTTPAccessFallbackErrorBoundary",
  "HTTPAccessFallbackBoundary",
  "DevRootHTTPAccessFallbackBoundary",
  "AppDevOverlayErrorBoundary",
  "AppDevOverlay",
  "HotReload",
  "Router",
  "ErrorBoundaryHandler",
  "ErrorBoundary",
  "AppRouter",
  "ServerRoot",
  "SegmentStateProvider",
  "RootErrorBoundary"
];
var checkIsNextProject = () => {
  return Boolean(document.getElementById("__NEXT_DATA__"));
};
var checkIsInternalComponentName = (name) => {
  if (name.startsWith("_")) return true;
  if (NEXT_INTERNAL_COMPONENT_NAMES.includes(name)) return true;
  return false;
};
var checkIsSourceComponentName = (name) => {
  if (checkIsInternalComponentName(name)) return false;
  if (!isCapitalized(name)) return false;
  if (name.startsWith("Primitive.")) return false;
  if (name.includes("Provider") && name.includes("Context")) return false;
  return true;
};
var getNearestComponentName = (element) => {
  const fiber = Pe(element);
  if (!fiber) return null;
  let foundComponentName = null;
  N(
    fiber,
    (currentFiber) => {
      if (pe(currentFiber)) {
        const displayName = Te(currentFiber);
        if (displayName && checkIsSourceComponentName(displayName)) {
          foundComponentName = displayName;
          return true;
        }
      }
      return false;
    },
    true
  );
  return foundComponentName;
};
var getStack = async (element) => {
  const maybeFiber = Pe(element);
  if (!maybeFiber || !me(maybeFiber)) return [];
  const fiber = De(maybeFiber);
  const unresolvedStack = [];
  N(
    fiber,
    (currentFiber) => {
      const displayName = k(currentFiber) ? typeof currentFiber.type === "string" ? currentFiber.type : null : Te(currentFiber);
      if (displayName && !checkIsInternalComponentName(displayName)) {
        unresolvedStack.push({
          name: displayName,
          sourcePromise: ke2(currentFiber)
        });
      }
    },
    true
  );
  const resolvedStack = await Promise.all(
    unresolvedStack.map(async (frame) => ({
      name: frame.name,
      source: await frame.sourcePromise
    }))
  );
  return resolvedStack.filter((frame) => frame.source !== null);
};
var formatStack = (stack) => {
  const isNextProject = checkIsNextProject();
  return stack.map(({ name, source }) => {
    if (!source) return `  at ${name}`;
    if (source.fileName.startsWith("about://React/Server")) {
      return `  at ${name} (Server)`;
    }
    if (!je2(source.fileName)) return `  at ${name}`;
    const framePart = `  at ${name} in ${Q(source.fileName)}`;
    if (isNextProject) {
      return `${framePart}:${source.lineNumber}:${source.columnNumber}`;
    }
    return framePart;
  }).join("\n");
};
var getHTMLPreview = (element) => {
  const tagName = element.tagName.toLowerCase();
  if (!(element instanceof HTMLElement)) {
    return `<${tagName} />`;
  }
  const text = element.innerText?.trim() ?? element.textContent?.trim() ?? "";
  let attrsText = "";
  const attributes = Array.from(element.attributes);
  for (const attribute of attributes) {
    const name = attribute.name;
    let value = attribute.value;
    if (value.length > 20) {
      value = `${value.slice(0, 20)}...`;
    }
    attrsText += ` ${name}="${value}"`;
  }
  const topElements = [];
  const bottomElements = [];
  let foundFirstText = false;
  const childNodes = Array.from(element.childNodes);
  for (const node of childNodes) {
    if (node.nodeType === Node.COMMENT_NODE) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent && node.textContent.trim().length > 0) {
        foundFirstText = true;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (!foundFirstText) {
        topElements.push(node);
      } else {
        bottomElements.push(node);
      }
    }
  }
  const formatElements = (elements) => {
    if (elements.length === 0) return "";
    if (elements.length <= 2) {
      return elements.map((el) => `<${el.tagName.toLowerCase()} ...>`).join("\n  ");
    }
    return `(${elements.length} elements)`;
  };
  let content = "";
  const topElementsStr = formatElements(topElements);
  if (topElementsStr) content += `
  ${topElementsStr}`;
  if (text.length > 0) {
    const truncatedText = text.length > 100 ? `${text.slice(0, 100)}...` : text;
    content += `
  ${truncatedText}`;
  }
  const bottomElementsStr = formatElements(bottomElements);
  if (bottomElementsStr) content += `
  ${bottomElementsStr}`;
  if (content.length > 0) {
    return `<${tagName}${attrsText}>${content}
</${tagName}>`;
  }
  return `<${tagName}${attrsText} />`;
};
var waitForFocus = () => {
  if (document.hasFocus()) {
    return new Promise((resolve) => setTimeout(resolve, 50));
  }
  return new Promise((resolve) => {
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      setTimeout(resolve, 50);
    };
    window.addEventListener("focus", onFocus);
    window.focus();
  });
};
var copyContent = async (content, onSuccess) => {
  await waitForFocus();
  try {
    try {
      await navigator.clipboard.writeText(content);
      onSuccess?.();
      return true;
    } catch {
      const result = copyContentFallback(content, onSuccess);
      return result;
    }
  } catch {
    return false;
  }
};
var copyContentFallback = (content, onSuccess) => {
  if (!document.execCommand) return false;
  const el = document.createElement("textarea");
  el.value = String(content);
  el.style.clipPath = "inset(50%)";
  el.ariaHidden = "true";
  const doc = document.body || document.documentElement;
  doc.append(el);
  try {
    el.select();
    const result = document.execCommand("copy");
    if (result) onSuccess?.();
    return result;
  } finally {
    el.remove();
  }
};
var playCopySound = () => {
  try {
    const audioContext = new (window.AudioContext || // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- window.webkitAudioContext is not typed
    window.webkitAudioContext)();
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    const notes = [
      { freq: 523.25, start: 0, duration: 0.1 },
      { freq: 659.25, start: 0.05, duration: 0.1 },
      { freq: 783.99, start: 0.1, duration: 0.15 }
    ];
    notes.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      oscillator.frequency.value = note.freq;
      oscillator.type = "triangle";
      const startTime = audioContext.currentTime + note.start;
      const peakTime = startTime + 0.01;
      const endTime = startTime + note.duration;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, peakTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);
      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  } catch {
  }
};
var isElementVisible = (element, computedStyle = window.getComputedStyle(element)) => {
  return computedStyle.display !== "none" && computedStyle.visibility !== "hidden" && computedStyle.opacity !== "0";
};
var isValidGrabbableElement = (element) => {
  if (element.closest(`[${ATTRIBUTE_NAME}]`)) {
    return false;
  }
  const computedStyle = window.getComputedStyle(element);
  if (!isElementVisible(element, computedStyle)) {
    return false;
  }
  if (computedStyle.pointerEvents === "none") {
    return false;
  }
  return true;
};
var getElementAtPosition = (clientX, clientY) => {
  const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
  for (const candidateElement of elementsAtPoint) {
    if (isValidGrabbableElement(candidateElement)) {
      return candidateElement;
    }
  }
  return null;
};
var DRAG_COVERAGE_THRESHOLD = 0.75;
var calculateIntersectionArea = (rect1, rect2) => {
  const intersectionLeft = Math.max(rect1.left, rect2.left);
  const intersectionTop = Math.max(rect1.top, rect2.top);
  const intersectionRight = Math.min(rect1.right, rect2.right);
  const intersectionBottom = Math.min(rect1.bottom, rect2.bottom);
  const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
  const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);
  return intersectionWidth * intersectionHeight;
};
var hasIntersection = (rect1, rect2) => {
  return rect1.left < rect2.right && rect1.right > rect2.left && rect1.top < rect2.bottom && rect1.bottom > rect2.top;
};
var filterElementsInDrag = (dragRect, isValidGrabbableElement2, shouldCheckCoverage) => {
  const elements = [];
  const allElements = Array.from(document.querySelectorAll("*"));
  const dragBounds = {
    left: dragRect.x,
    top: dragRect.y,
    right: dragRect.x + dragRect.width,
    bottom: dragRect.y + dragRect.height
  };
  for (const candidateElement of allElements) {
    if (!shouldCheckCoverage) {
      const tagName = (candidateElement.tagName || "").toUpperCase();
      if (tagName === "HTML" || tagName === "BODY") continue;
    }
    if (!isValidGrabbableElement2(candidateElement)) {
      continue;
    }
    const elementRect = candidateElement.getBoundingClientRect();
    const elementBounds = {
      left: elementRect.left,
      top: elementRect.top,
      right: elementRect.left + elementRect.width,
      bottom: elementRect.top + elementRect.height
    };
    if (shouldCheckCoverage) {
      const intersectionArea = calculateIntersectionArea(dragBounds, elementBounds);
      const elementArea = Math.max(0, elementRect.width * elementRect.height);
      const hasMajorityCoverage = elementArea > 0 && intersectionArea / elementArea >= DRAG_COVERAGE_THRESHOLD;
      if (hasMajorityCoverage) {
        elements.push(candidateElement);
      }
    } else {
      if (hasIntersection(elementBounds, dragBounds)) {
        elements.push(candidateElement);
      }
    }
  }
  return elements;
};
var removeNestedElements = (elements) => {
  return elements.filter((element) => {
    return !elements.some(
      (otherElement) => otherElement !== element && otherElement.contains(element)
    );
  });
};
var getElementsInDrag = (dragRect, isValidGrabbableElement2) => {
  const elements = filterElementsInDrag(dragRect, isValidGrabbableElement2, true);
  const uniqueElements = removeNestedElements(elements);
  return uniqueElements;
};
var getElementsInDragLoose = (dragRect, isValidGrabbableElement2) => {
  const elements = filterElementsInDrag(dragRect, isValidGrabbableElement2, false);
  const uniqueElements = removeNestedElements(elements);
  return uniqueElements;
};
var createElementBounds = (element) => {
  const boundingRect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  return {
    borderRadius: computedStyle.borderRadius || "0px",
    height: boundingRect.height,
    transform: computedStyle.transform || "none",
    width: boundingRect.width,
    x: boundingRect.left,
    y: boundingRect.top
  };
};
var hasLoggedIntro = false;
var init = (rawOptions) => {
  const options = {
    enabled: true,
    keyHoldDuration: 300,
    allowActivationInsideInput: true,
    playCopySound: false,
    ...rawOptions
  };
  if (options.enabled === false) {
    return {
      activate: () => {
      },
      deactivate: () => {
      },
      toggle: () => {
      },
      isActive: () => false,
      dispose: () => {
      }
    };
  }
  const logIntro = () => {
    if (hasLoggedIntro) return;
    hasLoggedIntro = true;
    try {
      const version = "0.0.44";
      const logoSvg = `<svg width="294" height="294" viewBox="0 0 294 294" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_0_3)"><mask id="mask0_0_3" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="294" height="294"><path d="M294 0H0V294H294V0Z" fill="white"/></mask><g mask="url(#mask0_0_3)"><path d="M144.599 47.4924C169.712 27.3959 194.548 20.0265 212.132 30.1797C227.847 39.2555 234.881 60.3243 231.926 89.516C231.677 92.0069 231.328 94.5423 230.94 97.1058L228.526 110.14C228.517 110.136 228.505 110.132 228.495 110.127C228.486 110.165 228.479 110.203 228.468 110.24L216.255 105.741C216.256 105.736 216.248 105.728 216.248 105.723C207.915 103.125 199.421 101.075 190.82 99.5888L190.696 99.5588L173.526 97.2648L173.511 97.2631C173.492 97.236 173.467 97.2176 173.447 97.1905C163.862 96.2064 154.233 95.7166 144.599 95.7223C134.943 95.7162 125.295 96.219 115.693 97.2286C110.075 105.033 104.859 113.118 100.063 121.453C95.2426 129.798 90.8624 138.391 86.939 147.193C90.8624 155.996 95.2426 164.588 100.063 172.933C104.866 181.302 110.099 189.417 115.741 197.245C115.749 197.245 115.758 197.246 115.766 197.247L115.752 197.27L115.745 197.283L115.754 197.296L126.501 211.013L126.574 211.089C132.136 217.767 138.126 224.075 144.507 229.974L144.609 230.082L154.572 238.287C154.539 238.319 154.506 238.35 154.472 238.38C154.485 238.392 154.499 238.402 154.513 238.412L143.846 247.482L143.827 247.497C126.56 261.128 109.472 268.745 94.8019 268.745C88.5916 268.837 82.4687 267.272 77.0657 264.208C61.3496 255.132 54.3164 234.062 57.2707 204.871C57.528 202.307 57.8806 199.694 58.2904 197.054C28.3363 185.327 9.52301 167.51 9.52301 147.193C9.52301 129.042 24.2476 112.396 50.9901 100.375C53.3443 99.3163 55.7938 98.3058 58.2904 97.3526C57.8806 94.7023 57.528 92.0803 57.2707 89.516C54.3164 60.3243 61.3496 39.2555 77.0657 30.1797C94.6494 20.0265 119.486 27.3959 144.599 47.4924ZM70.6423 201.315C70.423 202.955 70.2229 204.566 70.0704 206.168C67.6686 229.567 72.5478 246.628 83.3615 252.988L83.5176 253.062C95.0399 259.717 114.015 254.426 134.782 238.38C125.298 229.45 116.594 219.725 108.764 209.314C95.8516 207.742 83.0977 205.066 70.6423 201.315ZM80.3534 163.438C77.34 171.677 74.8666 180.104 72.9484 188.664C81.1787 191.224 89.5657 193.247 98.0572 194.724L98.4618 194.813C95.2115 189.865 92.0191 184.66 88.9311 179.378C85.8433 174.097 83.003 168.768 80.3534 163.438ZM60.759 110.203C59.234 110.839 57.7378 111.475 56.27 112.11C34.7788 121.806 22.3891 134.591 22.3891 147.193C22.3891 160.493 36.4657 174.297 60.7494 184.26C63.7439 171.581 67.8124 159.182 72.9104 147.193C67.822 135.23 63.7566 122.855 60.759 110.203ZM98.4137 99.6404C89.8078 101.145 81.3075 103.206 72.9676 105.809C74.854 114.203 77.2741 122.468 80.2132 130.554L80.3059 130.939C82.9938 125.6 85.8049 120.338 88.8834 115.008C91.9618 109.679 95.1544 104.569 98.4137 99.6404ZM94.9258 38.5215C90.9331 38.4284 86.9866 39.3955 83.4891 41.3243C72.6291 47.6015 67.6975 64.5954 70.0424 87.9446L70.0416 88.2194C70.194 89.8208 70.3941 91.4325 70.6134 93.0624C83.0737 89.3364 95.8263 86.6703 108.736 85.0924C116.57 74.6779 125.28 64.9532 134.773 56.0249C119.877 44.5087 105.895 38.5215 94.9258 38.5215ZM205.737 41.3148C202.268 39.398 198.355 38.4308 194.394 38.5099L194.29 38.512C183.321 38.512 169.34 44.4991 154.444 56.0153C163.93 64.9374 172.634 74.6557 180.462 85.064C193.375 86.6345 206.128 89.3102 218.584 93.0624C218.812 91.4325 219.003 89.8118 219.165 88.2098C221.548 64.7099 216.65 47.6164 205.737 41.3148ZM144.552 64.3097C138.104 70.2614 132.054 76.6306 126.443 83.3765C132.39 82.995 138.426 82.8046 144.552 82.8046C150.727 82.8046 156.778 83.0143 162.707 83.3765C157.08 76.6293 151.015 70.2596 144.552 64.3097Z" fill="white"/><path d="M144.598 47.4924C169.712 27.3959 194.547 20.0265 212.131 30.1797C227.847 39.2555 234.88 60.3243 231.926 89.516C231.677 92.0069 231.327 94.5423 230.941 97.1058L228.526 110.14L228.496 110.127C228.487 110.165 228.478 110.203 228.469 110.24L216.255 105.741L216.249 105.723C207.916 103.125 199.42 101.075 190.82 99.5888L190.696 99.5588L173.525 97.2648L173.511 97.263C173.492 97.236 173.468 97.2176 173.447 97.1905C163.863 96.2064 154.234 95.7166 144.598 95.7223C134.943 95.7162 125.295 96.219 115.693 97.2286C110.075 105.033 104.859 113.118 100.063 121.453C95.2426 129.798 90.8622 138.391 86.939 147.193C90.8622 155.996 95.2426 164.588 100.063 172.933C104.866 181.302 110.099 189.417 115.741 197.245L115.766 197.247L115.752 197.27L115.745 197.283L115.754 197.296L126.501 211.013L126.574 211.089C132.136 217.767 138.126 224.075 144.506 229.974L144.61 230.082L154.572 238.287C154.539 238.319 154.506 238.35 154.473 238.38L154.512 238.412L143.847 247.482L143.827 247.497C126.56 261.13 109.472 268.745 94.8018 268.745C88.5915 268.837 82.4687 267.272 77.0657 264.208C61.3496 255.132 54.3162 234.062 57.2707 204.871C57.528 202.307 57.8806 199.694 58.2904 197.054C28.3362 185.327 9.52298 167.51 9.52298 147.193C9.52298 129.042 24.2476 112.396 50.9901 100.375C53.3443 99.3163 55.7938 98.3058 58.2904 97.3526C57.8806 94.7023 57.528 92.0803 57.2707 89.516C54.3162 60.3243 61.3496 39.2555 77.0657 30.1797C94.6493 20.0265 119.486 27.3959 144.598 47.4924ZM70.6422 201.315C70.423 202.955 70.2229 204.566 70.0704 206.168C67.6686 229.567 72.5478 246.628 83.3615 252.988L83.5175 253.062C95.0399 259.717 114.015 254.426 134.782 238.38C125.298 229.45 116.594 219.725 108.764 209.314C95.8515 207.742 83.0977 205.066 70.6422 201.315ZM80.3534 163.438C77.34 171.677 74.8666 180.104 72.9484 188.664C81.1786 191.224 89.5657 193.247 98.0572 194.724L98.4618 194.813C95.2115 189.865 92.0191 184.66 88.931 179.378C85.8433 174.097 83.003 168.768 80.3534 163.438ZM60.7589 110.203C59.234 110.839 57.7378 111.475 56.2699 112.11C34.7788 121.806 22.3891 134.591 22.3891 147.193C22.3891 160.493 36.4657 174.297 60.7494 184.26C63.7439 171.581 67.8124 159.182 72.9103 147.193C67.822 135.23 63.7566 122.855 60.7589 110.203ZM98.4137 99.6404C89.8078 101.145 81.3075 103.206 72.9676 105.809C74.8539 114.203 77.2741 122.468 80.2132 130.554L80.3059 130.939C82.9938 125.6 85.8049 120.338 88.8834 115.008C91.9618 109.679 95.1544 104.569 98.4137 99.6404ZM94.9258 38.5215C90.9331 38.4284 86.9866 39.3955 83.4891 41.3243C72.629 47.6015 67.6975 64.5954 70.0424 87.9446L70.0415 88.2194C70.194 89.8208 70.3941 91.4325 70.6134 93.0624C83.0737 89.3364 95.8262 86.6703 108.736 85.0924C116.57 74.6779 125.28 64.9532 134.772 56.0249C119.877 44.5087 105.895 38.5215 94.9258 38.5215ZM205.737 41.3148C202.268 39.398 198.355 38.4308 194.394 38.5099L194.291 38.512C183.321 38.512 169.34 44.4991 154.443 56.0153C163.929 64.9374 172.634 74.6557 180.462 85.064C193.374 86.6345 206.129 89.3102 218.584 93.0624C218.813 91.4325 219.003 89.8118 219.166 88.2098C221.548 64.7099 216.65 47.6164 205.737 41.3148ZM144.551 64.3097C138.103 70.2614 132.055 76.6306 126.443 83.3765C132.389 82.995 138.427 82.8046 144.551 82.8046C150.727 82.8046 156.779 83.0143 162.707 83.3765C157.079 76.6293 151.015 70.2596 144.551 64.3097Z" fill="#FF40E0"/></g><mask id="mask1_0_3" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="102" y="84" width="161" height="162"><path d="M235.282 84.827L102.261 112.259L129.693 245.28L262.714 217.848L235.282 84.827Z" fill="white"/></mask><g mask="url(#mask1_0_3)"><path d="M136.863 129.916L213.258 141.224C220.669 142.322 222.495 152.179 215.967 155.856L187.592 171.843L184.135 204.227C183.339 211.678 173.564 213.901 169.624 207.526L129.021 141.831C125.503 136.14 130.245 128.936 136.863 129.916Z" fill="#FF40E0" stroke="#FF40E0" stroke-width="0.817337" stroke-linecap="round" stroke-linejoin="round"/></g></g><defs><clipPath id="clip0_0_3"><rect width="294" height="294" fill="white"/></clipPath></defs></svg>`;
      const logoDataUri = `data:image/svg+xml;base64,${btoa(logoSvg)}`;
      console.log(`%cReact Grab${version ? ` v${version}` : ""}%c
https://react-grab.com`, `background: #330039; color: #ffffff; border: 1px solid #d75fcb; padding: 4px 4px 4px 24px; border-radius: 4px; background-image: url("${logoDataUri}"); background-size: 16px 16px; background-repeat: no-repeat; background-position: 4px center; display: inline-block; margin-bottom: 4px;`, "");
      fetch("https://react-grab.com/api/version").then((res) => res.text()).catch(() => null);
    } catch {
    }
  };
  logIntro();
  return createRoot((dispose2) => {
    const [isHoldingKeys, setIsHoldingKeys] = createSignal(false);
    const [mouseX, setMouseX] = createSignal(OFFSCREEN_POSITION);
    const [mouseY, setMouseY] = createSignal(OFFSCREEN_POSITION);
    const [isDragging, setIsDragging] = createSignal(false);
    const [dragStartX, setDragStartX] = createSignal(OFFSCREEN_POSITION);
    const [dragStartY, setDragStartY] = createSignal(OFFSCREEN_POSITION);
    const [isCopying, setIsCopying] = createSignal(false);
    const [lastGrabbedElement, setLastGrabbedElement] = createSignal(null);
    const [progressStartTime, setProgressStartTime] = createSignal(null);
    const [progress, setProgress] = createSignal(0);
    const [grabbedBoxes, setGrabbedBoxes] = createSignal([]);
    const [successLabels, setSuccessLabels] = createSignal([]);
    const [isActivated, setIsActivated] = createSignal(false);
    const [isToggleMode, setIsToggleMode] = createSignal(false);
    const [showProgressIndicator, setShowProgressIndicator] = createSignal(false);
    const [didJustDrag, setDidJustDrag] = createSignal(false);
    const [copyStartX, setCopyStartX] = createSignal(OFFSCREEN_POSITION);
    const [copyStartY, setCopyStartY] = createSignal(OFFSCREEN_POSITION);
    const [mouseHasSettled, setMouseHasSettled] = createSignal(false);
    let holdTimerId = null;
    let progressAnimationId = null;
    let progressDelayTimerId = null;
    let keydownSpamTimerId = null;
    let mouseSettleTimerId = null;
    const isRendererActive = createMemo(() => isActivated() && !isCopying());
    const hasValidMousePosition = createMemo(() => mouseX() > OFFSCREEN_POSITION && mouseY() > OFFSCREEN_POSITION);
    const isTargetKeyCombination = (event) => (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c";
    const showTemporaryGrabbedBox = (bounds) => {
      const boxId = `grabbed-${Date.now()}-${Math.random()}`;
      const createdAt = Date.now();
      const newBox = {
        id: boxId,
        bounds,
        createdAt
      };
      const currentBoxes = grabbedBoxes();
      setGrabbedBoxes([...currentBoxes, newBox]);
      setTimeout(() => {
        setGrabbedBoxes((previousBoxes) => previousBoxes.filter((box) => box.id !== boxId));
      }, SUCCESS_LABEL_DURATION_MS);
    };
    const showTemporarySuccessLabel = (text) => {
      const labelId = `success-${Date.now()}-${Math.random()}`;
      setSuccessLabels((previousLabels) => [...previousLabels, {
        id: labelId,
        text
      }]);
      setTimeout(() => {
        setSuccessLabels((previousLabels) => previousLabels.filter((label) => label.id !== labelId));
      }, SUCCESS_LABEL_DURATION_MS);
    };
    const wrapInSelectedElementTags = (context) => `<selected_element>
${context}
</selected_element>`;
    const extractElementTagName = (element) => (element.tagName || "").toLowerCase();
    const extractElementLabelText = (element) => {
      const tagName = extractElementTagName(element);
      const componentName = getNearestComponentName(element);
      if (tagName && componentName) {
        return `<${tagName}> in ${componentName}`;
      }
      if (tagName) {
        return `<${tagName}>`;
      }
      return "<element>";
    };
    const notifyElementsSelected = (elements) => {
      try {
        const elementsPayload = elements.map((element) => ({
          tagName: extractElementTagName(element)
        }));
        window.dispatchEvent(new CustomEvent("react-grab:element-selected", {
          detail: {
            elements: elementsPayload
          }
        }));
      } catch {
      }
    };
    const executeCopyOperation = async (positionX, positionY, operation) => {
      setCopyStartX(positionX);
      setCopyStartY(positionY);
      setIsCopying(true);
      startProgressAnimation();
      await operation().finally(() => {
        setIsCopying(false);
        stopProgressAnimation();
        if (isToggleMode()) {
          if (!isHoldingKeys()) {
            deactivateRenderer();
          } else {
            setIsToggleMode(false);
          }
        }
      });
    };
    const hasInnerText = (element) => "innerText" in element;
    const extractElementTextContent = (element) => {
      if (hasInnerText(element)) {
        return element.innerText;
      }
      return element.textContent ?? "";
    };
    const createCombinedTextContent = (elements) => elements.map((element) => extractElementTextContent(element).trim()).filter((textContent) => textContent.length > 0).join("\n\n");
    const tryCopyWithFallback = async (elements) => {
      let didCopy = false;
      try {
        const elementSnippetResults = await Promise.allSettled(elements.map(async (element) => `## HTML Frame:
${getHTMLPreview(element)}

## Code Location:
${formatStack(await getStack(element))}`));
        const elementSnippets = elementSnippetResults.map((result) => result.status === "fulfilled" ? result.value : "").filter((snippet) => snippet.trim());
        if (elementSnippets.length > 0) {
          const plainTextContent = elementSnippets.map((snippet) => wrapInSelectedElementTags(snippet)).join("\n\n");
          didCopy = await copyContent(plainTextContent, options.playCopySound ? playCopySound : void 0);
        }
        if (!didCopy) {
          const plainTextContentOnly = createCombinedTextContent(elements);
          if (plainTextContentOnly.length > 0) {
            didCopy = await copyContent(plainTextContentOnly, options.playCopySound ? playCopySound : void 0);
          }
        }
      } catch {
        const plainTextContentOnly = createCombinedTextContent(elements);
        if (plainTextContentOnly.length > 0) {
          didCopy = await copyContent(plainTextContentOnly, options.playCopySound ? playCopySound : void 0);
        }
      }
      return didCopy;
    };
    const copySingleElementToClipboard = async (targetElement2) => {
      showTemporaryGrabbedBox(createElementBounds(targetElement2));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const didCopy = await tryCopyWithFallback([targetElement2]);
      if (didCopy) {
        showTemporarySuccessLabel(extractElementLabelText(targetElement2));
      }
      notifyElementsSelected([targetElement2]);
    };
    const copyMultipleElementsToClipboard = async (targetElements) => {
      if (targetElements.length === 0) return;
      for (const element of targetElements) {
        showTemporaryGrabbedBox(createElementBounds(element));
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const didCopy = await tryCopyWithFallback(targetElements);
      if (didCopy) {
        showTemporarySuccessLabel(`${targetElements.length} elements`);
      }
      notifyElementsSelected(targetElements);
    };
    const targetElement = createMemo(() => {
      if (!isRendererActive() || isDragging()) return null;
      return getElementAtPosition(mouseX(), mouseY());
    });
    const selectionBounds = createMemo(() => {
      const element = targetElement();
      if (!element) return void 0;
      const elementBounds = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      return {
        borderRadius: computedStyle.borderRadius || "0px",
        height: elementBounds.height,
        transform: computedStyle.transform || "none",
        width: elementBounds.width,
        x: elementBounds.left,
        y: elementBounds.top
      };
    });
    const calculateDragDistance = (endX, endY) => ({
      x: Math.abs(endX - dragStartX()),
      y: Math.abs(endY - dragStartY())
    });
    const isDraggingBeyondThreshold = createMemo(() => {
      if (!isDragging()) return false;
      const dragDistance = calculateDragDistance(mouseX(), mouseY());
      return dragDistance.x > DRAG_THRESHOLD_PX || dragDistance.y > DRAG_THRESHOLD_PX;
    });
    const calculateDragRectangle = (endX, endY) => {
      const dragX = Math.min(dragStartX(), endX);
      const dragY = Math.min(dragStartY(), endY);
      const dragWidth = Math.abs(endX - dragStartX());
      const dragHeight = Math.abs(endY - dragStartY());
      return {
        x: dragX,
        y: dragY,
        width: dragWidth,
        height: dragHeight
      };
    };
    const dragBounds = createMemo(() => {
      if (!isDraggingBeyondThreshold()) return void 0;
      const drag = calculateDragRectangle(mouseX(), mouseY());
      return {
        borderRadius: "0px",
        height: drag.height,
        transform: "none",
        width: drag.width,
        x: drag.x,
        y: drag.y
      };
    });
    const labelText = createMemo(() => {
      const element = targetElement();
      return element ? extractElementLabelText(element) : "<element>";
    });
    const labelPosition = createMemo(() => isCopying() ? {
      x: copyStartX(),
      y: copyStartY()
    } : {
      x: mouseX(),
      y: mouseY()
    });
    const progressPosition = createMemo(() => isCopying() ? {
      x: copyStartX(),
      y: copyStartY()
    } : {
      x: mouseX(),
      y: mouseY()
    });
    createEffect(on(() => [targetElement(), lastGrabbedElement()], ([currentElement, lastElement]) => {
      if (lastElement && currentElement && lastElement !== currentElement) {
        setLastGrabbedElement(null);
      }
    }));
    const startProgressAnimation = () => {
      const startTime = Date.now();
      setProgressStartTime(startTime);
      setShowProgressIndicator(false);
      progressDelayTimerId = window.setTimeout(() => {
        setShowProgressIndicator(true);
        progressDelayTimerId = null;
      }, PROGRESS_INDICATOR_DELAY_MS);
      const animateProgress = () => {
        const currentStartTime = progressStartTime();
        if (currentStartTime === null) return;
        const elapsedTime = Date.now() - currentStartTime;
        const normalizedTime = elapsedTime / options.keyHoldDuration;
        const easedProgress = 1 - Math.exp(-normalizedTime);
        const maxProgressBeforeCompletion = 0.95;
        const currentProgress = isCopying() ? Math.min(easedProgress, maxProgressBeforeCompletion) : 1;
        setProgress(currentProgress);
        if (currentProgress < 1) {
          progressAnimationId = requestAnimationFrame(animateProgress);
        }
      };
      animateProgress();
    };
    const stopProgressAnimation = () => {
      if (progressAnimationId !== null) {
        cancelAnimationFrame(progressAnimationId);
        progressAnimationId = null;
      }
      if (progressDelayTimerId !== null) {
        window.clearTimeout(progressDelayTimerId);
        progressDelayTimerId = null;
      }
      setProgressStartTime(null);
      setProgress(1);
      setShowProgressIndicator(false);
    };
    const activateRenderer = () => {
      stopProgressAnimation();
      setIsActivated(true);
      document.body.style.cursor = "crosshair";
      options.onActivate?.();
    };
    const deactivateRenderer = () => {
      setIsToggleMode(false);
      setIsHoldingKeys(false);
      setIsActivated(false);
      document.body.style.cursor = "";
      if (isDragging()) {
        setIsDragging(false);
        document.body.style.userSelect = "";
      }
      if (holdTimerId) window.clearTimeout(holdTimerId);
      if (keydownSpamTimerId) window.clearTimeout(keydownSpamTimerId);
      if (mouseSettleTimerId) {
        window.clearTimeout(mouseSettleTimerId);
        mouseSettleTimerId = null;
      }
      setMouseHasSettled(false);
      stopProgressAnimation();
      options.onDeactivate?.();
    };
    const abortController = new AbortController();
    const eventListenerSignal = abortController.signal;
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isHoldingKeys()) {
        deactivateRenderer();
        return;
      }
      if (event.key === "Enter" && isHoldingKeys()) {
        setIsToggleMode(true);
        if (keydownSpamTimerId !== null) {
          window.clearTimeout(keydownSpamTimerId);
          keydownSpamTimerId = null;
        }
        if (!isActivated()) {
          if (holdTimerId) window.clearTimeout(holdTimerId);
          activateRenderer();
        }
        return;
      }
      if (!options.allowActivationInsideInput && isKeyboardEventTriggeredByInput(event)) {
        return;
      }
      if (!isTargetKeyCombination(event)) return;
      if (isActivated()) {
        if (isToggleMode()) return;
        if (keydownSpamTimerId !== null) {
          window.clearTimeout(keydownSpamTimerId);
        }
        keydownSpamTimerId = window.setTimeout(() => {
          deactivateRenderer();
        }, 200);
        return;
      }
      if (event.repeat) return;
      if (holdTimerId !== null) {
        window.clearTimeout(holdTimerId);
      }
      if (!isHoldingKeys()) {
        setIsHoldingKeys(true);
      }
      holdTimerId = window.setTimeout(() => {
        activateRenderer();
      }, options.keyHoldDuration);
    }, {
      signal: eventListenerSignal,
      capture: true
    });
    window.addEventListener("keyup", (event) => {
      if (!isHoldingKeys() && !isActivated()) return;
      const isReleasingModifier = !event.metaKey && !event.ctrlKey;
      const isReleasingC = event.key.toLowerCase() === "c";
      if (isReleasingC || isReleasingModifier) {
        if (isToggleMode()) return;
        deactivateRenderer();
      }
    }, {
      signal: eventListenerSignal,
      capture: true
    });
    window.addEventListener("mousemove", (event) => {
      setMouseX(event.clientX);
      setMouseY(event.clientY);
      if (mouseSettleTimerId !== null) {
        window.clearTimeout(mouseSettleTimerId);
      }
      setMouseHasSettled(false);
      mouseSettleTimerId = window.setTimeout(() => {
        setMouseHasSettled(true);
        mouseSettleTimerId = null;
      }, 300);
    }, {
      signal: eventListenerSignal
    });
    window.addEventListener("mousedown", (event) => {
      if (!isRendererActive() || isCopying()) return;
      event.preventDefault();
      setIsDragging(true);
      setDragStartX(event.clientX);
      setDragStartY(event.clientY);
      document.body.style.userSelect = "none";
    }, {
      signal: eventListenerSignal
    });
    window.addEventListener("mouseup", (event) => {
      if (!isDragging()) return;
      const dragDistance = calculateDragDistance(event.clientX, event.clientY);
      const wasDragGesture = dragDistance.x > DRAG_THRESHOLD_PX || dragDistance.y > DRAG_THRESHOLD_PX;
      setIsDragging(false);
      document.body.style.userSelect = "";
      if (wasDragGesture) {
        setDidJustDrag(true);
        const dragRect = calculateDragRectangle(event.clientX, event.clientY);
        const elements = getElementsInDrag(dragRect, isValidGrabbableElement);
        if (elements.length > 0) {
          void executeCopyOperation(event.clientX, event.clientY, () => copyMultipleElementsToClipboard(elements));
        } else {
          const fallbackElements = getElementsInDragLoose(dragRect, isValidGrabbableElement);
          if (fallbackElements.length > 0) {
            void executeCopyOperation(event.clientX, event.clientY, () => copyMultipleElementsToClipboard(fallbackElements));
          }
        }
      } else {
        const element = getElementAtPosition(event.clientX, event.clientY);
        if (!element) return;
        setLastGrabbedElement(element);
        void executeCopyOperation(event.clientX, event.clientY, () => copySingleElementToClipboard(element));
      }
    }, {
      signal: eventListenerSignal
    });
    window.addEventListener("click", (event) => {
      if (isRendererActive() || isCopying() || didJustDrag()) {
        event.preventDefault();
        event.stopPropagation();
        const hadDrag = didJustDrag();
        if (hadDrag) {
          setDidJustDrag(false);
        }
        if (isToggleMode() && !isCopying()) {
          if (!isHoldingKeys()) {
            deactivateRenderer();
          } else {
            setIsToggleMode(false);
          }
        }
      }
    }, {
      signal: eventListenerSignal,
      capture: true
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        setGrabbedBoxes([]);
      }
    }, {
      signal: eventListenerSignal
    });
    onCleanup(() => {
      abortController.abort();
      if (holdTimerId) window.clearTimeout(holdTimerId);
      if (keydownSpamTimerId) window.clearTimeout(keydownSpamTimerId);
      if (mouseSettleTimerId) window.clearTimeout(mouseSettleTimerId);
      stopProgressAnimation();
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    });
    const rendererRoot = mountRoot();
    const selectionVisible = createMemo(() => isRendererActive() && !isDragging() && Boolean(targetElement()));
    const dragVisible = createMemo(() => isRendererActive() && isDraggingBeyondThreshold());
    const labelVariant = createMemo(() => isCopying() ? "processing" : "hover");
    const labelVisible = createMemo(() => {
      if (isCopying()) return true;
      if (successLabels().length > 0) return false;
      return isRendererActive() && !isDragging() && Boolean(targetElement());
    });
    const progressVisible = createMemo(() => isCopying() && showProgressIndicator() && hasValidMousePosition());
    const crosshairVisible = createMemo(() => isRendererActive() && !isDragging());
    render(() => createComponent(ReactGrabRenderer, {
      get selectionVisible() {
        return selectionVisible();
      },
      get selectionBounds() {
        return selectionBounds();
      },
      get dragVisible() {
        return dragVisible();
      },
      get dragBounds() {
        return dragBounds();
      },
      get grabbedBoxes() {
        return grabbedBoxes();
      },
      get successLabels() {
        return successLabels();
      },
      get labelVariant() {
        return labelVariant();
      },
      get labelText() {
        return labelText();
      },
      get labelX() {
        return labelPosition().x;
      },
      get labelY() {
        return labelPosition().y;
      },
      get labelVisible() {
        return labelVisible();
      },
      labelZIndex: Z_INDEX_LABEL,
      get labelShowHint() {
        return mouseHasSettled();
      },
      get progressVisible() {
        return progressVisible();
      },
      get progress() {
        return progress();
      },
      get mouseX() {
        return progressPosition().x;
      },
      get mouseY() {
        return progressPosition().y;
      },
      get crosshairVisible() {
        return crosshairVisible();
      }
    }), rendererRoot);
    return {
      activate: () => {
        if (!isActivated()) {
          activateRenderer();
        }
      },
      deactivate: () => {
        if (isActivated()) {
          deactivateRenderer();
        }
      },
      toggle: () => {
        if (isActivated()) {
          deactivateRenderer();
        } else {
          activateRenderer();
        }
      },
      isActive: () => isActivated(),
      dispose: dispose2
    };
  });
};
var globalApi = null;
var getGlobalApi = () => globalApi;
globalApi = init();
export {
  getGlobalApi,
  init,
  playCopySound
};
/*! Bundled license information:

bippy/dist/rdt-hook-CrcWl4lP.js:
bippy/dist/install-hook-only-DtUPvEBg.js:
bippy/dist/core-D7_ABaNC.js:
bippy/dist/src-C_DvVIY-.js:
bippy/dist/index.js:
bippy/dist/source.js:
  (**
   * @license bippy
   *
   * Copyright (c) Aiden Bai
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-grab/dist/index.js:
  (**
   * @license MIT
   *
   * Copyright (c) 2025 Aiden Bai
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=react-grab.js.map

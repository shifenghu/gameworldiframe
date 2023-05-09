import { MyPlugin } from "./Defined.used";
import _ from "lodash";
const MessageIdPrefix = {
  Sync: "__sync_",
  Async: "__async_",
};
export class SandboxPluginContext {
  private plugin: MyPlugin;
  private sandbox: Sandbox;
  private timeout = 5;
  constructor(sandbox: Sandbox, plugin: MyPlugin, timeout = 5000) {
    this.sandbox = sandbox;
    this.plugin = plugin;
    this.timeout = timeout;
  }
  public Post(method: string, ...args: any[]): void {
    this.sandbox.Post(this.plugin.Namespace, method, ...args);
  }
  public PostAsync(method: string, ...args: any[]): Promise<MessagePayload> {
    return this.sandbox.PostAsnyc(this.plugin.Namespace, method, ...args, this.timeout);
  }
  public Replay(postId: string, method: string, ...args: any[]): void {
    this.sandbox.Replay(postId, this.plugin.Namespace, method, ...args);
  }
  public ReplayByMessage(message: MessagePayload, ...args: any[]): void {
    this.sandbox.Replay(message.Id, this.plugin.Namespace, message.Method, ...args);
  }
  public AddPluginEventListener(method: string, callback: EventListenerCallback): RemoveListener {
    return this.sandbox.AddPluginEventListener(this.plugin.Namespace, method, callback);
  }
  public OnFiredPluginEvent(method: string, ...args: any[]): void {
    this.sandbox.OnFiredPluginEvent(this.plugin.Namespace, method, ...args);
  }

  public AddListener(method: string, callback: MessageCallback): RemoveListener {
    return this.sandbox.AddListener(this.plugin.Namespace, method, callback);
  }
}

export default class Sandbox {
  private plugins: { [namespace in string]: MyPlugin };
  private Inited = false;
  private isReady = false;
  private iframe: SandboxIframe;
  private readonly configurator: SandboxConfigurator = {};
  private readonly stageListeners: { [key in SandboxStage]?: StageEventListenerFunction[] };

  private pluginEventlisteners: { [eventName in string]: EventListenerCallback[] };

  public readonly context: SandboxContext;

  constructor(sandboxIframe: SandboxIframe) {
    this.plugins = {};
    this.pluginEventlisteners = {};
    this.stageListeners = {};
    this.iframe = sandboxIframe;
    this.context = {
      Account: {
        GetInfo: () => CastMessageByPromise(this.PostAsnyc("Account", "GetInfo")),
      },
    };
  }

  public OnLoaded(): void {
    this.isReady = true;
    const list = this.stageListeners[SandboxStage.Inited];
    if (!_.isUndefined(list)) {
      RemoveAndIterator(list, (o) => o(SandboxStage.Inited));
    }
  }

  public IsReady(): boolean {
    return this.isReady;
  }

  /**
   * 添加一个事件监听，主要用于内部插件监听
   * @param namespace
   * @param method
   * @param callback
   * @returns
   */
  public AddPluginEventListener(namespace: string, method: string, callback: EventListenerCallback): RemoveListener {
    let events = this.pluginEventlisteners[`${namespace}.${method}`];
    if (_.isUndefined(events)) {
      events = [];
    }
    events.push(callback);
    this.pluginEventlisteners[`${namespace}.${method}`] = events;
    return () => _.remove(events, (o) => o === callback);
  }

  /**
   * 添加一个阶段监听
   * @param stage
   * @param callback
   */
  public AddStageListener(stage: SandboxStage, callback: StageEventListenerFunction): RemoveListener {
    // onload
    if (stage === SandboxStage.Inited && this.IsReady()) {
      callback(stage);
      return _.noop;
    }
    let callbacks = this.stageListeners[stage];
    if (callbacks === undefined) {
      callbacks = [];
    }
    callbacks.push(callback);
    this.stageListeners[stage] = callbacks;
    return () => _.remove(callbacks as any[], (o) => o === callback);
  }

  /**
   * 触发事件
   * @param namespace
   * @param method
   * @param args
   * @returns
   */
  public OnFiredPluginEvent(namespace: string, method: string, ...args: any[]): void {
    const events = this.pluginEventlisteners[`${namespace}.${method}`];
    if (_.isUndefined(events)) {
      console.debug(`${namespace}.${method} event is not found listener function.`);
      return;
    }
    events.forEach((o) => o(...args));
  }

  /**
   * 添加一个插件
   * @param plugin
   */
  public AddPlugin(plugin: MyPlugin): void {
    this.plugins[plugin.Namespace] = plugin;
  }

  /**
   * 初始化
   */
  public Initialize(): void {
    if (this.Inited) {
      console.warn(`Sandbox has been initialized.`);
      return;
    }
    // 获取所有的 plugin
    const list = [] as MyPlugin[];
    _.forEach(this.plugins, (o) => {
      // 处理默认值
      // eslint-disable-next-line no-param-reassign
      o.Orderer = Math.max(1, o.Orderer);
      list.push(o);
    });
    // 排序
    list.sort((o1, o2) => o2.Orderer - o1.Orderer);
    // 初始化
    let st = this.stageListeners[SandboxStage.BeforeInitPlugin];
    if (!_.isUndefined(st)) {
      RemoveAndIterator(st, (o) => o(SandboxStage.BeforeInitPlugin));
    }
    // 开始执行
    list.forEach((o) => o.Initialize(this.configurator, new SandboxPluginContext(this, o)));
    st = this.stageListeners[SandboxStage.AfterInitPlugin];
    if (!_.isUndefined(st)) {
      RemoveAndIterator(st, (o) => o(SandboxStage.AfterInitPlugin));
    }
    this.Inited = true;
  }

  public Post(namespace: string, method: string, args: any[] = []): void {
    this.iframe.Post({
      Id: _.uniqueId(MessageIdPrefix.Sync),
      Namespace: namespace,
      Method: method,
      Args: args,
    });
  }

  public Replay(postId: string, namespace: string, method: string, args: any[] = []): void {
    this.iframe.Post({
      Id: postId,
      Namespace: namespace,
      Method: method,
      Args: args,
    });
  }

  public PostAsnyc(namespace: string, method: string, args: any[] = [], timeout = 5000): Promise<MessagePayload> {
    return this.iframe.PostAsync(
      {
        Id: _.uniqueId(MessageIdPrefix.Async),
        Namespace: namespace,
        Method: method,
        Args: args,
      },
      timeout
    );
  }

  public AddListener(namespace: string, method: string, callback: MessageCallback): RemoveListener {
    return this.iframe.AddEventListener(`${namespace}.${method}`, callback);
  }

  public evaluate(code: string): void {
    try {
      console.debug(window.Sandbox);
      window.eval(`with(window.Sandbox.context){${code}}`);
    } catch (e) {
      console.error(`eval() threw an exception %o.`, e);
      console.error(`(function () {with(context){${code}}}()`);
    }
  }
}
export enum SandboxStage {
  Inited = "Inited",
  BeforeInitPlugin = "BeforeInitPlugin",
  AfterInitPlugin = "AfterInitPlugin",
  Destory = "Destory",
  PostBefore = "PostBefore",
  PostAfer = "PostAfer",
}

/**
 * 移除
 * @param array 数组
 * @param canRemove 是否能够删除
 * @returns 无
 */
export const RemoveAndIterator = function <T>(array: T[], canRemove: (o: T) => boolean | undefined): void {
  if (array == null || !canRemove) {
    return;
  }
  let count = 0;
  while (count < array.length) {
    if (canRemove(array[count]) === true) {
      array.splice(count, 1);
      continue;
    }
    count++;
  }
};
export const CastMessageByPromise = function <T>(promise: Promise<MessagePayload>) {
  return new Promise<T>((res, rej) => {
    promise
      .then((o) => {
        console.log("gggg o is %o", o.Args);
        o.Args.length > 0 ? res(o.Args[0] as T) : res(o.Args as T);
      })
      .catch(rej);
  });
};

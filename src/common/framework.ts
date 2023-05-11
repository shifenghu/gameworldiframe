namespace Sandbox {
  /**
   * 消息载体
   */
  export interface IMessagePayload {
    readonly Id: string;
    readonly Namespace: string;
    readonly Method: string;
    readonly Args: any;
    readonly Encryption?: string;
  }

  export interface SandboxUtils {
    IterateListeners: (listeners: MessageChannelListeners, eventName: string, ifRemove: (event: IMessageEvent) => boolean) => void;
    MergeEventName: (namespace: string, method: string) => string;
  }

  export interface IMessageChannelData {
    EventType: MessageEventType;
    Payload: IMessagePayload;
  }

  export type MessageEventType = "Inited" | "Method";
  /**
   * 移除监听事件
   */
  export type RemoveListener = () => boolean;

  /**
   * 消息回调事件
   */
  export type MessageCallback = (message: IMessagePayload) => void;

  /**
   * 生命周期回调
   */
  export type SandboxLifecycleCallback = (eventType: LifecycleEventType, ...args: any[]) => void;

  export type MessageChannelListeners = { [key in string]: Sandbox.IMessageEvent[] };

  /**
   * 消息回调时间
   */
  export interface IPromiseCallback {
    Resolve: MessageCallback;
    Error: (message: string) => void;
  }

  /**
   * 生命周期阶段类型
   */
  export enum LifecycleEventType {
    Inited = "Inited",
    Destroyed = "Destroyed",
    BeforeInitPlugin = "BeforeInitPlugin",
    AfterInitPlugin = "AfterInitPlugin",
  }
  /**
   * 消息事件
   */
  export interface IMessageEvent {
    readonly MatchId: string;
    readonly Callback: IPromiseCallback | MessageCallback;
    readonly Timeout: number;
    readonly Times: number;
    readonly IsPromise: Boolean;
    OnCallback: (message: IMessagePayload) => boolean;
    IsTimeout: () => boolean;
  }

  export interface IMessageChannel {
    Post: (message: IMessagePayload) => void;
    Fetch: (message: IMessagePayload, timeout: number) => Promise<IMessagePayload>;
    On: (namespace: string, method: string, callback: MessageCallback) => RemoveListener;
    // 销毁组件
    Destroy: () => void;
  }
  /**
   * 生命周期接口
   */
  export interface ISandboxLifecycle {
    OnLifecycle: (eventType: LifecycleEventType, callback: SandboxLifecycleCallback) => void;
    OffLifecycle: (eventType: LifecycleEventType, callback: SandboxLifecycleCallback) => boolean;
  }

  /**
   * 盒子对plugin开发的配置接口
   */
  export interface IConfigurator {}

  export interface ISandbox extends ISandboxLifecycle {
    Post: (namespace: string, method: string, args: any[]) => void;
    Fetch: (namespace: string, method: string, args: any[], timeout: number) => Promise<IMessagePayload>;
    Reply: (message: IMessagePayload, args: any[]) => void;
    On: (namespace: string, method: string, callback: MessageCallback) => RemoveListener;
  }

  /**
   * 盒子上下文
   */
  export interface IContext<T extends IConfigurator, M extends IContext<T, M>> extends ISandboxLifecycle {
    readonly Sandbox: ISandbox;
    readonly Plugin: IPlugin<T, M>;
    Post: (method: string, args: any[]) => void;
    Fetch: (method: string, args: any[], timeout: number) => Promise<IMessagePayload>;
    Reply: (message: IMessagePayload, args: any[]) => void;
    On: (method: string, callback: MessageCallback) => RemoveListener;
  }

  /**
   * 插件
   */
  export interface IPlugin<T extends IConfigurator, M extends IContext<T, M>> {
    // 组件名称
    readonly Namespace: string;
    // 组件排序
    readonly Orderer: number;
    // 初始化组件
    Initialize: (configurator: T, context: M) => void;
    // 销毁组件
    Destroy: () => void;
  }
}

declare interface Window {
  Sandbox: Sandbox.ISandbox;
}

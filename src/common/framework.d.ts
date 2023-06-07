declare namespace Sandbox {
  /**
   * 消息载体
   */
  declare interface IMessagePayload {
    readonly Id: string;
    readonly Namespace: string;
    readonly Method: string;
    readonly Args: any;
    readonly Encryption?: string;
    readonly Error?: string;
  }

  declare interface SandboxUtils {
    IterateListeners: (listeners: MessageChannelListeners, eventName: string, ifRemove: (event: IMessageEvent) => boolean) => void;
    MergeEventName: (namespace: string, method: string) => string;
  }

  declare interface IMessageChannelData {
    EventType: MessageEventType;
    Payload: IMessagePayload;
  }

  /**
   * 移除监听事件
   */
  declare type RemoveListener = () => boolean;

  /**
   * 消息回调事件
   */
  declare type MessageCallback = (message: IMessagePayload) => void;

  /**
   * 生命周期回调
   */
  declare type SandboxLifecycleCallback = (eventType: LifecycleEventType, ...args: any[]) => void;

  declare type MessageChannelListeners = { [key in string]: Sandbox.IMessageEvent[] };

  /**
   * 消息回调时间
   */
  declare interface IPromiseCallback {
    Resolve: MessageCallback;
    Error: (message: string) => void;
  }
  /**
   * 消息事件
   */
  declare interface IMessageEvent {
    readonly MatchId: string;
    readonly Callback: IPromiseCallback | MessageCallback;
    readonly Timeout: number;
    readonly Times: number;
    readonly IsPromise: boolean;
    OnCallback: (message: IMessagePayload) => boolean;
    IsTimeout: () => boolean;
  }

  declare interface IMessageChannel {
    Post: (message: IMessagePayload) => void;
    Fetch: (message: IMessagePayload, timeout: number) => Promise<IMessagePayload>;
    On: (namespace: string, method: string, callback: MessageCallback) => RemoveListener;
    // 销毁组件
    Destroy: () => void;
  }
  /**
   * 生命周期接口
   */
  declare interface ISandboxLifecycle {
    OnLifecycle: (eventType: LifecycleEventType, callback: SandboxLifecycleCallback) => void;
    OffLifecycle: (eventType: LifecycleEventType, callback: SandboxLifecycleCallback) => boolean;
  }

  /**
   * 盒子对plugin开发的配置接口
   */
  declare interface IConfigurator {}

  declare interface ISandbox extends ISandboxLifecycle {
    Post: (namespace: string, method: string, args: any[]) => string;
    PostError: (namespace: string, method: string, error: string) => string;
    Fetch: (namespace: string, method: string, args: any[], timeout: number) => Promise<IMessagePayload>;
    Reply: (message: IMessagePayload, args: any[]) => void;
    ReplayError: (message: IMessagePayload, error: string) => void;
    On: (namespace: string, method: string, callback: MessageCallback) => RemoveListener;
  }

  /**
   * 盒子上下文
   */
  declare interface IContext<T extends IConfigurator, M extends IContext<T, M>> extends ISandboxLifecycle {
    readonly Sandbox: ISandbox;
    readonly Plugin: IPlugin<T, M>;
    Post: (method: string, args: any[]) => string;
    PostError: (method: string, error: string) => string;
    Fetch: (method: string, args: any[], timeout: number) => Promise<IMessagePayload>;
    Reply: (message: IMessagePayload, args: any[]) => void;
    ReplayError: (message: IMessagePayload, error: string) => void;
    On: (method: string, callback: MessageCallback) => RemoveListener;
  }

  /**
   * 插件
   */
  declare interface IPlugin<T extends IConfigurator, M extends IContext<T, M>> {
    // 组件名称
    readonly Namespace: string;
    // 组件排序
    readonly Orderer: number;
    // 初始化组件
    Initialize: (configurator: T, context: M) => void;
    // 销毁组件
    Destroy: () => void;
  }
  declare interface ApplicationInfo {
    Name: string;
    Platform: Sandbox.AppPlatformType;
    Uri: string;
    Size: {
      Width: number;
      Height: number;
    };
  }

  //应用平台类型
  declare type AppPlatformType = "Unity" | "H5";
}

declare interface Window {
  Sandbox: Sandbox.ISandbox;
}

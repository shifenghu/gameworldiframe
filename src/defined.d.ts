interface Window {
  SanboxIFrame: any;
  Sandbox: {
    evaluate: (code: string, context: SandboxContext) => void;
  };
}
declare type EventType = "Method" | "Callback" | "Inited";
declare type RemoveListener = () => void;
declare type MessageCallback = (o: MessagePayload) => void;
declare type SandboxIframeEvent = PromiseCallback<MessagePayload> | MessageCallback;

declare interface PromiseCallback<T> {
  Resolve: MessageCallback<T>;
  Error: (message: string) => void;
}

// 基础插件接口
declare type MessageCallback<T> = (message: T) => void;
declare interface SandboxIframe {
  // 发送一个同步消息
  Post: (payload: MessagePayload) => void;
  // 发送一个有回调的消息
  PostAsync: (payload: MessagePayload, timeout: number) => Promise<MessagePayload>;
  // 添加一个消息监听
  AddEventListener: (eventName: string, callback: MessageCallback) => RemoveListener;
  // 销毁
  Destroy: () => void;
}

declare interface SandboxIframeInner extends SandboxIframe {
  _IsInited: Boolean;
  _listeners: { [key in string]: IFrameMessageEvent[] };
  _parentWindow?: Window | null;
}
declare interface IframeMessage {
  EventType: EventType;
  Payload: MessagePayload;
}
declare interface MessagePayload {
  Namespace: string;
  Method: string;
  Id: string;
  Args: any[];
}
declare interface SandboxContext {
  [key: string]: any;
}
declare interface SandboxConfigurator {}

declare type EventListenerCallback = (...args: any[]) => void;

declare type StageEventListenerFunction = (stage: SandBoxStage, ...args: any[]) => boolean | undefined;

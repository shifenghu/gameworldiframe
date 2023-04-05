interface Window {
  SanboxIFrame: any;
}
declare type EventType = "Method" | "Callback" | "Inited";
declare type RemoveListener = () => void;
declare interface PromiseCallback {
  Resolve: MessageCallback;
  Error: (message: string) => void;
}

// 基础插件接口
declare interface MyPlugin {
  // 组件名称
  Namespace: string;
  // 初始化组件
  Initialize: () => void;
  // 销毁组件
  Destroy: () => void;
}
declare type MessageCallback = (message: any) => void;
declare interface SandboxIframe {
  // 发送一个同步消息
  Post: (payload: MessagePayload) => void;
  // 发送一个有回调的消息
  PostAsync: <T>(payload: MessagePayload, timeout: number) => Promise<T>;
  // 添加一个消息监听
  AddEventListener: (
    eventName: string,
    callback: MessageCallback
  ) => RemoveListener;
  // 销毁
  Destroy: () => void;
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

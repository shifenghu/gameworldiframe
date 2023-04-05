import _ from "lodash";
const InitEventType = "Inited";
const EventTypeName = "EventType";
const InitPostData = {
  Namespace: "",
  Method: "",
  Id: "xxxxxxxx",
  Args: [],
};

class IFrameMessageEvent {
  public readonly Id: string;
  public readonly Promise: PromiseCallback;
  public readonly Timeout: number;
  constructor(id: string, promise: PromiseCallback, timeout = -1) {
    this.Id = id;
    this.Promise = promise;
    this.Timeout = timeout == -1 ? -1 : new Date().getTime() + timeout;
  }

  /**
   * 检查是否超时
   * @returns 是否超时
   */
  public IsTimeout(): boolean {
    return this.Timeout > 0 && this.Timeout < new Date().getTime();
  }
}

export default (): SandboxIframe => {
  if (window.SanboxIFrame) {
    return window.SanboxIFrame;
  }
  const sandboxIframe = {} as any;
  sandboxIframe._IsInited = false;
  sandboxIframe._listeners = {};
  sandboxIframe._onceListeners = {};
  sandboxIframe._parentWindow = undefined as undefined | MessageEventSource;
  const PostMessage = function (
    eventType: EventType = "Callback",
    payload = {}
  ) {
    sandboxIframe._parentWindow?.postMessage(
      {
        EventType: eventType,
        Payload: payload,
      },
      "*"
    );
  };
  /// 初始化方法监听
  const InitLoaded = function (event: MessageEvent<IframeMessage>) {
    if (sandboxIframe._IsInited || event.data.EventType != InitEventType) {
      return false;
    }
    sandboxIframe._parentWindow = event.source;
    PostMessage("Inited", InitPostData);
    sandboxIframe._IsInited = true;
    return true;
  };
  const clearTimeoutEvent = () => {
    // 移除 once
    Object.keys(sandboxIframe._onceListeners).forEach((o) => {
      const event = sandboxIframe._onceListeners[o];
      if (event.IsTimeout()) {
        delete sandboxIframe._onceListeners[o];
        event.Promise.Error("Timeout");
      }
    });
  };
  const interval = setInterval(clearTimeoutEvent, 2000);
  sandboxIframe.Destroy = function () {
    clearInterval(interval);
  };
  /**
   * 处理正常调用
   * @param data
   * @returns
   */
  const doListenerForAllways = (data: IframeMessage) => {
    if (data.EventType !== "Method") {
      return;
    }
    // 获取接受的回调函数
    const list = sandboxIframe._listeners[
      data[EventTypeName]
    ] as MessageCallback[];
    if (!_.isArray(list)) {
      console.warn(`${data[EventTypeName]} can't find any listener function.`);
    } else {
      list.forEach((o) => o(data.Payload));
    }
  };
  /**
   * 处理单次任务，一般是异步任务
   * @param data
   * @returns
   */
  const doListenerForOnce = (data: IframeMessage) => {
    if (data.EventType !== "Callback") {
      return;
    }
    const message = data.Payload as MessagePayload;
    const event = sandboxIframe._onceListeners[
      message.Id
    ] as IFrameMessageEvent;
    if (!_.isUndefined(event)) {
      delete sandboxIframe._onceListeners[message.Id];
      if (event.IsTimeout()) {
        event.Promise.Error("Timeout");
      } else {
        event.Promise.Resolve(message);
      }
    }
  };
  // 其他方法监听处理
  const Callback = function (message: IframeMessage) {
    doListenerForOnce(message);
    doListenerForAllways(message);
  };

  // 消息监听
  sandboxIframe._MessageListener = function (
    event: MessageEvent<IframeMessage>
  ) {
    // 是否是我们需要的消息
    if (!event.data.EventType) {
      return;
    }
    // 开始处理 InitLoaded
    if (InitLoaded(event)) {
      return;
    }
    // 其他信息处理
    Callback(event.data);
  };
  sandboxIframe.Post = function (payload: MessagePayload) {
    PostMessage("Method", payload);
  };
  sandboxIframe.PostAsync = function <T>(
    payload: MessagePayload,
    timeout: number = 5000
  ) {
    PostMessage("Callback", payload);
    console.log(
      `Post async message [${JSON.stringify(payload)}] is successfull.`
    );
    return new Promise<T>((res, rej) => {
      const promiseCallback = {} as PromiseCallback;
      promiseCallback.Resolve = (o) => res(o);
      promiseCallback.Error = rej;
      sandboxIframe._onceListeners[payload.Id] = new IFrameMessageEvent(
        payload.Id,
        promiseCallback,
        timeout
      );
    });
  };
  sandboxIframe.AddEventListener = function (
    eventName: string,
    callback: MessageCallback
  ) {
    const list = sandboxIframe._listeners[eventName]
      ? sandboxIframe._listeners[eventName]
      : [];
    list.push(callback);
    sandboxIframe._listeners[eventName] = list;
    return () =>
      _.remove(sandboxIframe._listeners[eventName], (o) => o === callback);
  };

  window.addEventListener("message", sandboxIframe._MessageListener);
  window.SanboxIFrame = sandboxIframe;
  return sandboxIframe;
};

// 45

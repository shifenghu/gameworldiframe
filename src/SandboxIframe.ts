import _ from "lodash";
import { MyPlugin } from "./Defined.used";
import Sandbox from "./Sandbox";
const InitEventType = "Inited";
const InitPostData = {
  Namespace: "",
  Method: "",
  Id: "xxxxxxxx",
  Args: [],
};

class IFrameMessageEvent {
  public readonly Id: string;
  public readonly Promise: SandboxIframeEvent;
  public readonly Timeout: number;
  public readonly Times: number;
  public readonly IsPromise: Boolean;
  private times = -1;
  constructor(id: string, promise: SandboxIframeEvent, timeout = -1, times = -1) {
    this.Id = id;
    this.Promise = promise;
    this.Timeout = timeout == -1 ? -1 : new Date().getTime() + timeout;
    this.times = times;
    this.Times = times;
    this.IsPromise = _.isPlainObject(this.Promise) && _.isFunction((this.Promise as PromiseCallback<MessagePayload>).Resolve);
  }

  /**
   * 激活一次
   * @param message 消息
   * @returns 是否需要删除
   */
  public Callback(message: MessagePayload): boolean {
    // 如果已经没有次数了，则直接删除
    if (this.times === 0) {
      return true;
    }
    // 是否已经过期了
    if (this.IsTimeout()) {
      this.IsPromise && (this.Promise as PromiseCallback<MessagePayload>).Error("Timeout");
      return true;
    }
    // 执行一次
    try {
      if (this.IsPromise) {
        (this.Promise as PromiseCallback<MessagePayload>).Resolve(message);
      } else {
        (this.Promise as MessageCallback)(message);
      }
    } catch (e) {
      console.error(`Message callback error is %o`, e);
    }
    if (this.times < 0) {
      return false;
    }
    this.times--;
    return false;
  }

  /**
   * 检查是否超时
   * @returns 是否超时
   */
  public IsTimeout(): boolean {
    return this.IsPromise && this.Timeout > 0 && this.Timeout < new Date().getTime();
  }
}

export default (plugins: MyPlugin[] = [], OnLoaded: () => void): void => {
  if (window.Sandbox) {
    return;
  }
  const sandboxIframe = {} as SandboxIframeInner;
  sandboxIframe._IsInited = false;
  sandboxIframe._listeners = {};
  sandboxIframe._parentWindow = undefined;
  let initCounter = 0;
  const PostMessage = function (eventType: EventType = "Method", payload = {}) {
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
    sandboxIframe._parentWindow = event.source as Window;
    initCounter++;
    if (initCounter == 1) {
      PostMessage("Inited", InitPostData);
    } else {
      sandbox.OnLoaded();
      OnLoaded();
      sandboxIframe._IsInited = true;
    }
    return true;
  };
  const clearTimeoutEvent = () => {
    // 移除超时
    Object.keys(sandboxIframe._listeners).forEach((id) =>
      iteratorListener(id, (event) => {
        if (event.IsTimeout()) {
          (event.Promise as PromiseCallback<MessagePayload>).Error("Timeout");
          return true;
        }
        return false;
      })
    );
  };

  const iteratorListener = (eventName: string, ifRemove: (event: IFrameMessageEvent) => boolean) => {
    const events = sandboxIframe._listeners[eventName];
    if (_.isUndefined(events)) {
      console.warn(`[${eventName}] event not found process handler : %o.`, sandboxIframe._listeners);
      return;
    }
    let counter = 0;
    while (counter < events.length) {
      const event = events[counter];
      if (ifRemove(event)) {
        events.splice(counter, 1);
      } else {
        counter++;
      }
    }
    if (events.length > 0) {
      sandboxIframe._listeners[eventName] = events;
    } else {
      delete sandboxIframe._listeners[eventName];
    }
  };
  /**
   * 处理单次任务，一般是异步任务
   * @param data
   * @returns
   */
  const doListener = (data: IframeMessage) => {
    if (data.EventType !== "Method") {
      return;
    }
    console.log("once message is %o", data);
    const message = data.Payload as MessagePayload;
    iteratorListener(`${message.Namespace}.${message.Method}`, (event) => event.Callback(message));
  };

  const interval = setInterval(clearTimeoutEvent, 2000);
  sandboxIframe.Destroy = function () {
    clearInterval(interval);
  };

  // 消息监听
  const MessageListener = function (event: MessageEvent<IframeMessage>) {
    // 是否是我们需要的消息
    if (!event.data.EventType) {
      return;
    }
    // 开始处理 InitLoaded
    if (InitLoaded(event)) {
      return;
    }
    // 其他信息处理
    doListener(event.data);
  };
  sandboxIframe.Post = (payload: MessagePayload) => PostMessage("Method", payload);
  sandboxIframe.PostAsync = function (payload: MessagePayload, timeout: number = 5000) {
    PostMessage("Method", payload);
    console.log(`Post async message [${JSON.stringify(payload)}] is successfull.`);
    return new Promise<MessagePayload>((res, rej) => {
      const promiseCallback = {} as PromiseCallback<MessagePayload>;
      promiseCallback.Resolve = res;
      promiseCallback.Error = rej;
      sandboxIframe._listeners[`${payload.Namespace}.${payload.Method}`] = [new IFrameMessageEvent(payload.Id, promiseCallback as SandboxIframeEvent, timeout, 1)];
    });
  };
  sandboxIframe.AddEventListener = function (eventName: string, callback: MessageCallback) {
    const list: IFrameMessageEvent[] = sandboxIframe._listeners[eventName] ? sandboxIframe._listeners[eventName] : [];
    list.push(new IFrameMessageEvent(eventName, callback, -1, -1));
    sandboxIframe._listeners[eventName] = list;
    console.log(`add ${eventName} event listener`);
    return () => _.remove(sandboxIframe._listeners[eventName], (o: IFrameMessageEvent) => o.Promise === callback);
  };

  window.addEventListener("message", MessageListener);
  const sandbox = new Sandbox(sandboxIframe);
  _.forEach(plugins, (o) => sandbox.AddPlugin(o));
  sandbox.Initialize();
  window.Sandbox = sandbox;
};

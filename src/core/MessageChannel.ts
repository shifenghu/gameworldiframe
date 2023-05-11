/// <reference path="../common/framework.ts" />

import SandboxUtils from "../common/SandboxUtils";
import _ from "lodash";
const InitPostData = {
  Namespace: "",
  Method: "",
  Id: "xxxxxxxx",
  Args: [],
};

/**
 * 事件数据
 */
class MessageChannelEvent implements Sandbox.IMessageEvent {
  public readonly MatchId: string;
  public readonly Callback: Sandbox.MessageCallback | Sandbox.IPromiseCallback;
  public readonly Timeout: number;
  public readonly Times: number;
  public readonly IsPromise: Boolean;
  private times: number;
  constructor(matchId: string = "", callback: Sandbox.MessageCallback | Sandbox.IPromiseCallback, times: number = -1, timeout: number = -1) {
    this.MatchId = matchId;
    this.Callback = callback;
    this.Timeout = timeout == -1 ? -1 : new Date().getTime() + timeout;
    this.Times = times;
    this.IsPromise = _.isPlainObject(callback);
    this.times = times;
  }

  public OnCallback(message: Sandbox.IMessagePayload): boolean {
    // 如果已经没有次数了，则直接删除
    if (this.times === 0) {
      return true;
    }
    // 是否已经过期了
    if (this.IsTimeout()) {
      this.IsPromise && (this.Callback as Sandbox.IPromiseCallback).Error("Timeout");
      return true;
    }
    // 是否要匹配match id
    if (!_.isEmpty(this.MatchId) && message.Id !== this.MatchId) {
      return false;
    }
    // 执行一次
    try {
      if (this.IsPromise) {
        (this.Callback as Sandbox.IPromiseCallback).Resolve(message);
      } else {
        (this.Callback as Sandbox.MessageCallback)(message);
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

  public IsTimeout(): boolean {
    return this.IsPromise && this.Timeout > 0 && this.Timeout < new Date().getTime();
  }
}

export class MessageChannel implements Sandbox.IMessageChannel {
  private iframe?: Window | undefined;
  private isInited = false;
  private initCounter = 0;
  private readonly OnLoaded: () => void;
  private listeners: Sandbox.MessageChannelListeners = {};
  private interval?: NodeJS.Timer;

  constructor(onLoaded: () => void) {
    this.OnLoaded = onLoaded;
    this.Init();
  }

  private Init() {
    this.interval = setInterval(() => this.clearTimeoutEvent(), 2000);
    // this.messageListener = (event) => {
    //   // 是否是我们需要的消息
    //   if (!event.data.EventType) {
    //     return;
    //   }
    //   // 开始处理 InitLoaded
    //   if (this.InitLoaded(event)) {
    //     return;
    //   }
    //   // 其他信息处理
    //   this.doListener(event.data);
    // };
    window.addEventListener("message", this.messageListener);
  }

  private messageListener(event: MessageEvent<Sandbox.IMessageChannelData>) {
    // 是否是我们需要的消息
    if (!event.data.EventType) {
      return;
    }
    // 开始处理 InitLoaded
    if (this.InitLoaded(event)) {
      return;
    }
    // 其他信息处理
    this.doListener(event.data);
  }
  /**
   * 发送一个消息
   * @param eventType  事件类型
   * @param payload 荷载数据
   */
  private PostMessage(eventType: Sandbox.MessageEventType = "Method", payload: Sandbox.IMessagePayload) {
    this.iframe?.postMessage(
      {
        EventType: eventType,
        Payload: payload,
      },
      "*"
    );
  }

  /**
   * 初始加载
   * @param event
   */
  private InitLoaded(event: MessageEvent<Sandbox.IMessageChannelData>) {
    if (this.isInited || event.data.EventType != "Inited") {
      return false;
    }
    this.iframe = event.source as Window;
    this.initCounter++;
    if (this.initCounter == 1) {
      this.PostMessage("Inited", InitPostData);
    } else {
      this.OnLoaded();
      this.isInited = true;
    }
    return true;
  }

  /**
   * 清除超时事件
   */
  private clearTimeoutEvent() {
    // 移除超时
    Object.keys(this.listeners).forEach((id) =>
      SandboxUtils.IterateListeners(this.listeners, id, (event) => {
        if (event.IsTimeout()) {
          (event.Callback as Sandbox.IPromiseCallback).Error("Timeout");
          return true;
        }
        return false;
      })
    );
  }

  private doListener(data: Sandbox.IMessageChannelData) {
    if (data.EventType !== "Method") {
      return;
    }
    console.log("once message is %o", data);
    const message = data.Payload;
    SandboxUtils.IterateListeners(this.listeners, SandboxUtils.MergeEventName(message.Namespace, message.Method), (event: Sandbox.IMessageEvent) => event.OnCallback(message));
  }

  public Post(message: Sandbox.IMessagePayload) {
    this.PostMessage("Method", message);
    console.log(`Post message [${JSON.stringify(message)}] is successfull.`);
  }

  public Fetch(message: Sandbox.IMessagePayload, timeout: number = 5000): Promise<Sandbox.IMessagePayload> {
    return new Promise<Sandbox.IMessagePayload>((res, rej) => {
      this.Post(message);
      const promiseCallback = {} as Sandbox.IPromiseCallback;
      promiseCallback.Resolve = res;
      promiseCallback.Error = rej;
      this.listeners[SandboxUtils.MergeEventName(message.Namespace, message.Method)] = [new MessageChannelEvent(message.Id, promiseCallback, timeout, 1)];
    });
  }

  public On(namespace: string, method: string, callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    const eventName = SandboxUtils.MergeEventName(namespace, method);
    const list: Sandbox.IMessageEvent[] = this.listeners[eventName] ? this.listeners[eventName] : [];
    list.push(new MessageChannelEvent(eventName, callback, -1, -1));
    this.listeners[eventName] = list;
    console.log(`add ${eventName} event listener`);
    return () => _.remove(this.listeners[eventName], (o: Sandbox.IMessageEvent) => o.Callback === callback).length > 0;
  }

  public Destroy() {
    this.interval && clearInterval(this.interval);
    this.messageListener && window.removeEventListener("message", this.messageListener);
  }
}

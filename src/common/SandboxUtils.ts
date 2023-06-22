import _ from "lodash";

export const SandboxUtils = {} as Sandbox.SandboxUtils;

export type MessageEventType = "Inited" | "Method";
// 初始化时消息命名空间，Connect：framwork 链接, Connected: 链接成功， InitListeners : 组件监听完成, InitDatas:数据初始化完成，一般伴随着异步操作和消息交互, Inited: 初始化成功, Progress:处理进度
export type InitMessageNamespace = "Connect" | "Connected" | "InitListeners" | "InitDatas" | "Inited" | "Progress";

/**
 * 生命周期阶段类型
 */
export enum LifecycleEventType {
  Inited = "Inited",
  Init = "Init",
  Destroyed = "Destroyed",
  BeforeInitListenersPlugin = "BeforeInitListenersPlugin",
  AfterInitListenersPlugin = "AfterInitListenersPlugin",
  BeforeInitDatasPlugin = "BeforeInitDatasPlugin",
  AfterInitDatasPlugin = "AfterInitDatasPlugin",
}

/**
 * 便利事件监听
 * @param listeners 事件监听函数列表
 * @param eventName 事件名称
 * @param ifRemove 是否移除
 */
SandboxUtils.IterateListeners = (listeners: Sandbox.MessageChannelListeners, eventName: string, ifRemove: (event: Sandbox.IMessageEvent) => boolean): void => {
  const events = listeners[eventName];
  if (_.isUndefined(events)) {
    console.warn(`[${eventName}] event not found process handler : %o.`, listeners);
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
    listeners[eventName] = events;
  } else {
    delete listeners[eventName];
  }
};

/**
 * 合并事件名称
 * @param namespace
 * @param method
 * @returns
 */
SandboxUtils.MergeEventName = (namespace: string, method: string) => {
  return `${namespace}.${method}`;
};

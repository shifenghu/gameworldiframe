/// <reference path="./framework.ts" />

import _ from "lodash";

const SandboxUtils = {} as Sandbox.SandboxUtils;

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

export default SandboxUtils;

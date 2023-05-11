/// <reference path="../common/framework.ts" />
import _ from "lodash";

import { MessageChannel } from "./MessageChannel";

const MessageIdPrefix = {
  Sync: "__sync_",
  Async: "__async_",
};

export class SandboxConfigurator implements Sandbox.IConfigurator {}

export abstract class MyPlugin implements Sandbox.IPlugin<SandboxConfigurator, SandboxContext> {
  public static readonly DefaultOrder = 99;
  public abstract readonly Namespace: string;
  public readonly Orderer = MyPlugin.DefaultOrder;
  public abstract Initialize(configurator: SandboxConfigurator, context: SandboxContext): void;
  public Destroy() {}
}

export class SandboxContext implements Sandbox.IContext<SandboxConfigurator, SandboxContext> {
  public readonly Sandbox: Sandbox.ISandbox;
  public readonly Plugin: Sandbox.IPlugin<SandboxConfigurator, SandboxContext>;
  constructor(sandbox: Sandbox.ISandbox, plugin: Sandbox.IPlugin<SandboxConfigurator, SandboxContext>) {
    this.Sandbox = sandbox;
    this.Plugin = plugin;
  }
  public Post(method: string, args: any[] = []) {
    this.Sandbox.Post(this.Plugin.Namespace, method, args);
  }
  public Fetch(method: string, args: any[] = [], timeout: number = 5000): Promise<Sandbox.IMessagePayload> {
    return this.Sandbox.Fetch(this.Plugin.Namespace, method, args, timeout);
  }
  public Reply(message: Sandbox.IMessagePayload, args: any[] = []) {
    this.Sandbox.Reply(message, args);
  }
  public On(method: string, callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.Sandbox.On(this.Plugin.Namespace, method, callback);
  }
  public OnLifecycle(eventType: Sandbox.LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback) {
    this.Sandbox.OnLifecycle(eventType, callback);
  }
  public OffLifecycle(eventType: Sandbox.LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback): boolean {
    return this.Sandbox.OffLifecycle(eventType, callback);
  }
}

export class SandboxApplication implements Sandbox.ISandbox {
  private messageChannel!: MessageChannel;
  private readonly plugins: MyPlugin[] = [];
  private configurator: SandboxConfigurator = {};
  private lifecycleEvents: { [key in Sandbox.LifecycleEventType]: Sandbox.SandboxLifecycleCallback[] };

  constructor() {
    this.lifecycleEvents = {
      Inited: [],
      Destroyed: [],
      BeforeInitPlugin: [],
      AfterInitPlugin: [],
    };
  }

  private OnLoad() {
    this.TriggerLifecycle(Sandbox.LifecycleEventType.Inited);
  }

  private TriggerLifecycle(type: Sandbox.LifecycleEventType, ...args: any[]) {
    _.forEach(this.lifecycleEvents[type], (o) => o(type, ...args));
  }

  public AddPlugin(plugin: MyPlugin) {
    this.plugins.push(plugin);
  }

  public Initialize() {
    this.messageChannel = new MessageChannel(() => this.OnLoad());
    // 先给 plugin 排序
    this.plugins.sort((o1, o2) => o1.Orderer - o2.Orderer);
    // 开始初始化
    this.TriggerLifecycle(Sandbox.LifecycleEventType.BeforeInitPlugin);
    _.forEach(this.plugins, (o) => o.Initialize(this.configurator, new SandboxContext(this, o)));
    this.TriggerLifecycle(Sandbox.LifecycleEventType.AfterInitPlugin);
  }

  public Post(namespace: string, method: string, args: any[] = []) {
    this.messageChannel.Post({
      Id: _.uniqueId(MessageIdPrefix.Sync),
      Namespace: namespace,
      Method: method,
      Args: args,
    });
  }
  public Fetch(namespace: string, method: string, args: any[] = [], timeout: number = 5000): Promise<Sandbox.IMessagePayload> {
    return this.messageChannel.Fetch(
      {
        Id: _.uniqueId(MessageIdPrefix.Async),
        Namespace: namespace,
        Method: method,
        Args: args,
      },
      timeout
    );
  }
  public Reply(message: Sandbox.IMessagePayload, args: any[] = []) {
    this.messageChannel.Post({
      Id: message.Id,
      Namespace: message.Namespace,
      Method: message.Method,
      Args: args,
    });
  }
  public On(namespace: string, method: string, callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.messageChannel.On(namespace, method, callback);
  }
  public OnLifecycle(eventType: Sandbox.LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback) {
    this.lifecycleEvents[eventType].push(callback);
  }

  public OffLifecycle(eventType: Sandbox.LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback): boolean {
    return _.remove(this.lifecycleEvents[eventType], (o) => o === callback).length > 0;
  }

  // 销毁组件
  public Destroy() {
    this.TriggerLifecycle(Sandbox.LifecycleEventType.Destroyed);
    this.messageChannel.Destroy();
  }
}
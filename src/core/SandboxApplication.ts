import _ from "lodash";

import { MessageChannel } from "./MessageChannel";
import { ApplicationContext } from "src/Application";
import { LifecycleEventType } from "../common/SandboxUtils";

const MessageIdPrefix = "__f_message_id_";

export class SandboxConfigurator implements Sandbox.IConfigurator {}

export abstract class MyPlugin implements Sandbox.IPlugin<SandboxConfigurator, SandboxContext> {
  public static readonly DefaultOrder = 99;
  public abstract readonly Namespace: string;
  public readonly Orderer = MyPlugin.DefaultOrder;
  abstract Context: SandboxContext;
  public abstract Initialize(configurator: SandboxConfigurator, context: SandboxContext): void;
  public Destroy() {}
}

export class SandboxContext implements Sandbox.IContext<SandboxConfigurator, SandboxContext> {
  public readonly Sandbox: SandboxApplication;
  public readonly Plugin: Sandbox.IPlugin<SandboxConfigurator, SandboxContext>;
  public readonly ApplicationContext: ApplicationContext;
  constructor(sandbox: SandboxApplication, plugin: Sandbox.IPlugin<SandboxConfigurator, SandboxContext>, ApplicationContext: ApplicationContext) {
    this.Sandbox = sandbox;
    this.Plugin = plugin;
    this.ApplicationContext = ApplicationContext;
  }

  public Post(method: string, args: any[] = []): string {
    return this.Sandbox.Post(this.Plugin.Namespace, method, args);
  }

  public PostError(method: string, error: string): string {
    return this.Sandbox.PostError(this.Plugin.Namespace, method, error);
  }

  public Fetch(method: string, args: any[] = [], timeout: number = 5000): Promise<Sandbox.IMessagePayload> {
    return this.Sandbox.Fetch(this.Plugin.Namespace, method, args, timeout);
  }
  public Reply(message: Sandbox.IMessagePayload, args: any[] = []) {
    this.Sandbox.Reply(message, args);
  }

  public ReplayError(message: Sandbox.IMessagePayload, error: string): void {
    this.Sandbox.ReplayError(message, error);
  }

  public On(method: string, callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.Sandbox.On(this.Plugin.Namespace, method, callback);
  }
  public OnLifecycle(eventType: LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback) {
    this.Sandbox.OnLifecycle(eventType, callback);
  }
  public OnAll(callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.Sandbox.OnAll(callback);
  }
  public OffLifecycle(eventType: LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback): boolean {
    return this.Sandbox.OffLifecycle(eventType, callback);
  }
}

export class SandboxApplication implements Sandbox.ISandbox {
  private messageChannel!: MessageChannel;
  private readonly plugins: MyPlugin[] = [];
  private configurator: SandboxConfigurator = {};
  private lifecycleEvents: { [key in LifecycleEventType]: Sandbox.SandboxLifecycleCallback[] };
  public readonly ApplicationContext: any = {};

  constructor() {
    this.lifecycleEvents = {
      Inited: [],
      Destroyed: [],
      BeforeInitPlugin: [],
      AfterInitPlugin: [],
    };
    this.ApplicationContext.Sandbox = this;
  }

  private OnLoad() {
    this.TriggerLifecycle(LifecycleEventType.Inited);
  }

  private TriggerLifecycle(type: LifecycleEventType, ...args: any[]) {
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
    this.TriggerLifecycle(LifecycleEventType.BeforeInitPlugin);
    _.forEach(this.plugins, (o) => o.Initialize(this.configurator, new SandboxContext(this, o, this.ApplicationContext)));
    this.TriggerLifecycle(LifecycleEventType.AfterInitPlugin);
  }

  public Post(namespace: string, method: string, args: any[] = []): string {
    const id = _.uniqueId(MessageIdPrefix);
    this.messageChannel.Post({
      Id: id,
      Namespace: namespace,
      Method: method,
      Args: args,
    });
    return id;
  }

  public PostError(namespace: string, method: string, error: string): string {
    const id = _.uniqueId(MessageIdPrefix);
    this.messageChannel.Post({
      Id: id,
      Namespace: namespace,
      Method: method,
      Args: undefined,
      Error: error,
    });
    return id;
  }

  public OnAll(callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.messageChannel.OnAll(callback);
  }

  public Fetch(namespace: string, method: string, args: any[] = [], timeout: number = 5000): Promise<Sandbox.IMessagePayload> {
    return this.messageChannel.Fetch(
      {
        Id: _.uniqueId(MessageIdPrefix),
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

  public ReplayError(message: Sandbox.IMessagePayload, error: string): void {
    this.messageChannel.Post({
      Id: message.Id,
      Namespace: message.Namespace,
      Method: message.Method,
      Args: undefined,
      Error: error,
    });
  }
  public On(namespace: string, method: string, callback: Sandbox.MessageCallback): Sandbox.RemoveListener {
    return this.messageChannel.On(namespace, method, callback);
  }
  public OnLifecycle(eventType: LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback) {
    this.lifecycleEvents[eventType].push(callback);
  }

  public OffLifecycle(eventType: LifecycleEventType, callback: Sandbox.SandboxLifecycleCallback): boolean {
    return _.remove(this.lifecycleEvents[eventType], (o) => o === callback).length > 0;
  }

  public GameInit() {
    console.log("Game is inited");
  }

  public GameExit() {
    console.log("Game is exited");
  }

  // 销毁组件
  public Destroy() {
    this.TriggerLifecycle(LifecycleEventType.Destroyed);
    this.messageChannel.Destroy();
  }
}

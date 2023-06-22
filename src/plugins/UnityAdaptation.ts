import { LifecycleEventType } from "../common/SandboxUtils";
import { MyPlugin, SandboxConfigurator, SandboxContext } from "../core/SandboxApplication";
import _ from "lodash";
export default class UnityAdaptation extends MyPlugin {
  public Namespace: string = "Unity";
  public Context!: SandboxContext;
  private UnityInstance!: {
    SendMessage: (name: string, method: string, value: string) => void;
  };
  /* 是否初始化 */
  public IsReady: boolean = false;

  private GameName!: string;

  private onCompleted!: () => void;

  public InitializeListeners(_0: SandboxConfigurator, context: SandboxContext): void {
    this.Context = context;
    this.Context.OnAll((message: Sandbox.IMessagePayload) => this.OnListener(message));
    (window as any)["InitUnityGame"] = (bootstrapName: string, instance: any) => this.SetUnity(bootstrapName, instance);
    // 添加生命周期监听
    context.OnLifecycle(LifecycleEventType.Inited, () => this.OnInited());
  }

  public async InitializeData(_0: SandboxConfigurator, _1: SandboxContext): Promise<void> {
    return new Promise((res) => (this.onCompleted = res));
  }

  private OnInited(): void {
    const data = {} as any;
    data.Id = "xxx";
    data.Namespace = "__Inited";
    data.Method = "__Inited";
    this.UnityInstance.SendMessage(this.GameName, "OnTrigger", JSON.stringify(data));
  }

  private SetUnity(bootstrapName: string, instance: any): void {
    this.UnityInstance = instance;
    this.GameName = bootstrapName;
    this.IsReady = true;
    this.onCompleted();
  }

  private OnListener(message: Sandbox.IMessagePayload): void {
    if (!this.UnityInstance || !this.GameName) {
      console.warn("UnityInstance and GameName don't Initialize.");
      return;
    }
    const data = {} as any;
    data.Id = message.Id;
    data.Namespace = message.Namespace;
    data.Method = message.Method;
    data.Error = message.Error;
    data.ArgsJson = _.isUndefined(message.Args) ? undefined : JSON.stringify(message.Args);
    data.Encryption = message.Encryption;
    this.UnityInstance.SendMessage(this.GameName, "OnTrigger", JSON.stringify(data));
    console.error("get message is %o", JSON.stringify(data));
  }
}

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

  public Initialize(_0: SandboxConfigurator, context: SandboxContext): void {
    this.Context = context;
    this.Context.OnAll((message: Sandbox.IMessagePayload) => this.OnListener(message));
    (window as any)["InitUnityGame"] = (bootstrapName: string, instance: any) => this.SetUnity(bootstrapName, instance);
  }

  private SetUnity(bootstrapName: string, instance: any): void {
    this.UnityInstance = instance;
    this.GameName = bootstrapName;
    this.IsReady = true;
    console.error("set name is %s,%o", this.GameName, this.UnityInstance);
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

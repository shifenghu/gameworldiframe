import { SandboxContext, SandboxConfigurator, MyPlugin } from "../core/SandboxApplication";

export default class ApplicationPlugin extends MyPlugin {
  public readonly Namespace = "Application";
  Context!: SandboxContext;
  public InitializeListeners(_: SandboxConfigurator, context: SandboxContext) {
    this.Context = context;
    context.On("SetInfo", (message: Sandbox.IMessagePayload) => this.OnSetInfo(message));
  }

  private OnSetInfo(message: Sandbox.IMessagePayload) {
    this.Context.ApplicationContext.App = message.Args;
    this.Context.Reply(message, "Successed");
  }
}

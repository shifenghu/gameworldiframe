import { SandboxContext, SandboxConfigurator, MyPlugin } from "../core/SandboxApplication";

export default class ApplicationPlugin extends MyPlugin {
  public readonly Namespace = "Application";
  Context!: SandboxContext;
  public Initialize(_: SandboxConfigurator, context: SandboxContext) {
    this.Context = context;
    context.On("SetInfo", (message: Sandbox.IMessagePayload) => context.Reply(message, ["Successed"]));
    context.On("GetName", (message: Sandbox.IMessagePayload) => context.Reply(message, ["Get name is Successed"]));
  }
}

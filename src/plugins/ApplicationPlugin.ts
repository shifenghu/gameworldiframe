import { SandboxContext, SandboxConfigurator, MyPlugin } from "../core/SandboxApplication";

export default class ApplicationPlugin extends MyPlugin {
  public readonly Namespace = "Application";
  public Initialize(_: SandboxConfigurator, context: SandboxContext) {
    context.On("GetName", (message: Sandbox.IMessagePayload) => context.Reply(message, ["My name is Application plugin."]));
  }
}

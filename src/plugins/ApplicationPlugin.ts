import { SandboxPluginContext } from "src/Sandbox";
import { MyPlugin } from "../Defined.used";

export default class ApplicationPlugin implements MyPlugin {
  public Namespace = "Application";
  public readonly Orderer: number = 1;
  public Initialize(_: SandboxConfigurator, context: SandboxPluginContext) {
    context.AddListener("GetName", (message: MessagePayload) => context.Replay(message.Id, message.Method, "My name is Application plugin."));
  }
  public Destroy() {}
}

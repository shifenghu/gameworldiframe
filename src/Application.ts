import { SandboxApplication } from "./core/SandboxApplication";

export interface ApplicationContext {
  Sandbox: SandboxApplication;
  App: Sandbox.ApplicationInfo;
}

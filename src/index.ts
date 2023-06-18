import { SandboxApplication } from "./core/SandboxApplication";
import _ from "lodash";
import AllPlugins from "./plugins";
const Initialize = (): SandboxApplication => {
  const application = new SandboxApplication();
  _.forEach(AllPlugins, (o) => application.AddPlugin(new o()));
  application.Initialize();
  (window as any).sandbox = application;
  return application;
};
// 执行
Initialize();

import { SandboxApplication } from "./core/SandboxApplication";
import _ from "lodash";
import AllPlugins from "./plugins";
const Initialize = (): SandboxApplication => {
  const application = new SandboxApplication();
  _.forEach(AllPlugins, (o) => application.AddPlugin(new o()));
  application.Initialize().then(() => console.error("Iframe application is Initialized."));
  (window as any).sandbox = application;
  return application;
};
// 执行
Initialize();

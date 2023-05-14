import { SandboxApplication } from "./core/SandboxApplication";
import _ from "lodash";
import AllPlugins from "./plugins";
import { LifecycleEventType } from "./common/SandboxUtils";

const Initialize = (code: string): SandboxApplication => {
  const application = new SandboxApplication();
  application.OnLifecycle(LifecycleEventType.Inited, () => {
    try {
      window.eval(`with(window.context){${code}}`);
    } catch (e) {
      console.error(`eval() threw an exception %o.`, e);
      console.error(`(function () {with(window.context){${code}}}()`);
    }
  });
  _.forEach(AllPlugins, (o) => application.AddPlugin(new o()));
  application.Initialize();
  (window as any).sandbox = application;
  (window as any).context = application.ApplicationContext;
  return application;
};
// 执行
Initialize("console.log(111)");

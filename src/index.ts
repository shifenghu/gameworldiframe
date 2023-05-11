import { SandboxApplication } from "./core/SandboxApplication";
import _ from "lodash";
import AllPlugins from "./plugins";

export default (code: string): SandboxApplication => {
  const application = new SandboxApplication();
  application.OnLifecycle(Sandbox.LifecycleEventType.Inited, () => {
    try {
      console.debug(window.Sandbox);
      window.eval(`with(window.sandboxContext){${code}}`);
    } catch (e) {
      console.error(`eval() threw an exception %o.`, e);
      console.error(`(function () {with(window.sandbox){${code}}}()`);
    }
  });
  _.forEach(AllPlugins, (o) => application.AddPlugin(new o()));
  application.Initialize();
  (window as any).sandbox = application;
  return application;
};

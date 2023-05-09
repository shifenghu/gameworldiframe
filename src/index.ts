import SandboxIframe from "./SandboxIframe";
import ApplicationPlugin from "./plugins/ApplicationPlugin";
import Demo from "./Demo";
// 初始化
SandboxIframe([new ApplicationPlugin()], () => Demo());

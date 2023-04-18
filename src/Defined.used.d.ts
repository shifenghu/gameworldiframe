export declare interface MyPlugin {
  // 组件名称
  Namespace: string;
  Orderer: number;
  // 初始化组件
  Initialize: (configurator: SandboxConfigurator, context: SandboxPluginContext) => void;
  // 销毁组件
  Destroy: () => void;
}

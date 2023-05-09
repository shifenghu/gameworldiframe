namespace Sandbox {
  /**
   * 移除监听函数
   */
  export declare type RemoveListener = () => void;
  /**
   * 消息载体
   */
  export declare interface MessagePayload {
    // 消息 Id
    Id: string;
    Namespace: string;
    Method: string;
    // 参数
    Args: any;
  }
}

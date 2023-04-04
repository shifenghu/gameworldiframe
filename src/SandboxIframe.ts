export default () => {
  if (window.SanboxIFrame) {
    return window.SanboxIFrame;
  }
  const sandboxIframe = {} as any;
  // 消息监听
  sandboxIframe._MessageListener = function (event) {
    //
  };
  window.addEventListener("message", sandboxIframe._MessageListener);
  window.SanboxIFrame = sandboxIframe;
  return sandboxIframe;
};

// 45

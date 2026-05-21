// 文舒 — 所有页面的引导：Cordova 就绪后配置原生体验
// 引入方式：<script src="../js/boot.js"></script>（必须在 cordova.js 之后）

(function () {
  function onReady() {
    try {
      if (window.StatusBar) {
        // 透明 + 让 WebView 内容延伸到底下
        try { StatusBar.overlaysWebView(true); } catch (_) {}
        // 米色背景配深色图标
        try { StatusBar.backgroundColorByHexString('#00000000'); } catch (_) {}
        try { StatusBar.styleDefault(); } catch (_) {} // dark text/icons
      }
    } catch (_) { /* webview only */ }
  }
  if (window.cordova) {
    document.addEventListener('deviceready', onReady, false);
  } else {
    // 浏览器调试也跑一下，确保不报错
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
    else onReady();
  }
})();

// 文舒 — 所有页面的引导：Cordova 就绪后配置原生体验

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

  function bootAfterCordovaProbe() {
    if (window.cordova) {
      document.addEventListener('deviceready', onReady, false);
    } else if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  if (window.cordova || document.querySelector('script[src$="/cordova.js"], script[src$="../cordova.js"]')) {
    bootAfterCordovaProbe();
    return;
  }

  const cordovaScript = document.createElement('script');
  cordovaScript.src = new URL('../cordova.js', document.baseURI).href;
  cordovaScript.onload = bootAfterCordovaProbe;
  cordovaScript.onerror = bootAfterCordovaProbe;
  document.head.appendChild(cordovaScript);
})();

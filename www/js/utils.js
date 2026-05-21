// 工具函数

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function nowIso() {
  return new Date().toISOString();
}

export function timestamp() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// 中文字数：去除空白与所有标点（中英文）
export function cnWordCount(text) {
  if (!text) return 0;
  // 去掉空白、英文标点、中文标点、markdown 标记
  const cleaned = String(text)
    .replace(/<[^>]+>/g, '')
    .replace(/[\s ]/g, '')
    .replace(/[　-〿＀-￯ -⁯!-/:-@[-`{-~]/g, '');
  return [...cleaned].length;
}

// 中文成语数量
export function aiPhraseFlags(text) {
  const flags = ['此外', '然而', '值得注意的是', '彰显', '诠释', '赋能', '映射', '折射', '不禁', '油然而生', '心潮澎湃', '这一刻', '仿佛', '宛如'];
  const hits = flags.filter((p) => text.includes(p));
  return hits;
}

// 下载/分享文本文件
// 在 Cordova 里走 SocialSharing 原生分享面板（用户可存到文件/Drive/发邮件…），
// 在浏览器里退回 Blob URL 触发 <a download>
export function download(filename, content, mime = 'text/plain;charset=utf-8') {
  const ss = window.plugins?.socialsharing;
  const isCordova = !!window.cordova && !!ss;
  if (isCordova) {
    try {
      // UTF-8 字符串转 base64
      const bytes = new TextEncoder().encode(content);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const base64 = btoa(bin);
      const dataMime = mime.split(';')[0]; // 去 charset
      // SocialSharing 用 df:文件名;data:mime;base64,xxx 这种格式带文件名
      const fileEntry = `df:${filename};data:${dataMime};base64,${base64}`;
      ss.shareWithOptions(
        { subject: filename, message: filename, files: [fileEntry] },
        () => toast('已 通 过 系 统 分 享 导 出', 'success'),
        (err) => {
          const m = err?.message || String(err || '未知错误');
          if (/cancel/i.test(m)) return; // 用户取消不算错
          toast('导 出 失 败：' + m, 'error');
        }
      );
      return;
    } catch (e) {
      toast('原 生 分 享 异 常，已 退 回 浏 览 器 下 载：' + e.message);
      // 继续走浏览器分支
    }
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

export function urlParam(key, def = null) {
  const v = new URLSearchParams(location.search).get(key);
  return v ?? def;
}

export function goBack(fallback = 'library.html') {
  try {
    if (history.length > 1) {
      history.back();
      return;
    }
  } catch {}
  location.href = fallback;
}

export function bindBackButtons(root = document) {
  root.querySelectorAll('[data-back-fallback]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      goBack(el.getAttribute('data-back-fallback') || 'library.html');
    });
  });
}

// debounce
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// toast 提示
let toastTimer;
export function toast(msg, kind = 'info', duration = 2400) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.dataset.kind = kind;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// 简易确认弹窗，返回 Promise<boolean>
export function confirmDialog(message, { okLabel = '确 定', cancelLabel = '取 消' } = {}) {
  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal">
        <div class="modal-body">${message}</div>
        <div class="modal-foot">
          <button class="modal-cancel">${cancelLabel}</button>
          <button class="modal-ok">${okLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(mask);
    const close = (ok) => { mask.remove(); resolve(ok); };
    mask.querySelector('.modal-ok').onclick = () => close(true);
    mask.querySelector('.modal-cancel').onclick = () => close(false);
    mask.onclick = (e) => { if (e.target === mask) close(false); };
  });
}

// 章节号显示
export function chNo(n) { return String(n).padStart(2, '0'); }

// 中文数字（章号显示用，1-99）
const cnDigits = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function chCn(n) {
  if (n < 10) return cnDigits[n];
  if (n === 10) return '十';
  if (n < 20) return '十' + cnDigits[n - 10];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return cnDigits[t] + '十' + (o ? cnDigits[o] : '');
}

// 震动 / 触觉反馈
// 用法：vibrate('tap') / vibrate('ok') / vibrate('warn') / vibrate('long')
// 优先走 cordova-plugin-haptic：Android 直接 View.performHapticFeedback(HapticFeedbackConstants.*)
//   —— 完全不走 WebView 的 navigator.vibrate，不受 user-activation 限制，也不需要 VIBRATE 权限。
// 浏览器 / iOS 缺插件时退回 navigator.vibrate。
// （Android < API 30 的部分常量会被系统降级为无反馈，这是预期，不会崩。）
const VIB_HAPTIC = {
  // level → [androidType, iosType]
  tap:   ['VIRTUAL_KEY',  'ImpactLight'],
  ok:    ['CONFIRM',      'Success'],
  start: ['KEYBOARD_TAP', 'SelectionChanged'],
  done:  ['CONFIRM',      'Success'],
  warn:  ['REJECT',       'Warning'],
  long:  ['LONG_PRESS',   'ImpactHeavy'],
};
const VIB_PATTERNS = {
  tap: 25,
  ok: 40,
  start: 30,
  done: [40, 60, 40],
  warn: [60, 50, 60, 50, 60],
  long: 120,
};
export function vibrate(level = 'tap') {
  // 优先：原生 HapticFeedbackConstants
  try {
    const hp = window.cordova?.plugins?.hapticPlugin;
    if (hp && typeof level === 'string' && VIB_HAPTIC[level]) {
      const [android, ios] = VIB_HAPTIC[level];
      hp.sendHapticFeedback(android, ios, () => {});
      return;
    }
  } catch { /* fall through */ }
  // 兜底：W3C Vibration API（浏览器 / iOS Web）
  const pattern = typeof level === 'string' ? VIB_PATTERNS[level] : level;
  if (pattern == null) return;
  try {
    if (navigator?.vibrate) navigator.vibrate(pattern);
  } catch { /* no-op */ }
}

// 一键给元素绑震动反馈（不打断它本来的 onclick）
// 用 click：只有完整的"按下→抬起且没明显位移"才算 tap，滑动/拖拽不会触发
export function vibOn(el, level = 'tap') {
  if (!el) return;
  el.addEventListener('click', () => vibrate(level), { passive: true });
}

// API Key 兴入闸门：未填则跳转 settings 并提示
// 在每个流程页 <script type="module"> 最前面调用 requireApiKey() 即可
export function requireApiKey() {
  try {
    // 用绝对路径 import 会绕过 cache 浪费时间；从同目录 store.js 同步读取 localStorage 更稳
    const raw = localStorage.getItem('wenshu.v1');
    const apiKey = raw ? (JSON.parse(raw).prefs?.apiKey || '').trim() : '';
    if (apiKey) return true;
  } catch { /* fall through to redirect */ }
  // 不能用 alert（破坏沉浸），用 sessionStorage 让 settings 页知道是为啥来的
  try { sessionStorage.setItem('wenshu.needApiKey', '1'); } catch {}
  location.replace('settings.html');
  return false;
}

// 全局给主要按钮加震动：监听 click 冒泡，命中常见可点元素就震一下
// 为什么用 click 而不是 pointerdown：click 只在完整 tap（down+up 在同一元素内、无明显位移）后触发，
// 滑动、滚动、按住不松手都不会响——之前 pointerdown 会在所有这些"非确认点击"上震，太吵。
let _globalVibBound = false;
export function bindGlobalTapVibration() {
  if (_globalVibBound) return;
  _globalVibBound = true;
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, a.btn, a.btn-primary, a.btn-quiet, .btn, .btn-primary, .btn-quiet, .entry-card, [data-vib]');
    if (!t) return;
    if (t.disabled) return;
    // data-vib="ok|warn|start|done|long" 可覆盖默认
    vibrate(t.dataset.vib || 'tap');
  }, { passive: true });
}

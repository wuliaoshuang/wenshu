# 文舒 · WENSHU

> 一座替你听落笔声音的小说工坊 · Powered by DeepSeek

文舒是一款面向中文小说创作者的轻量写作工坊，提供从灵感捕捉、章节策划、续写润色，到阅读与导出的完整流程。基于 Cordova 同时构建 Android / iOS 原生包，前端由 Vite 构建，也可直接部署到 Web 在浏览器中使用。

---

## ✨ 功能特色

- **捕风（capture）**：随手记录灵感、人设碎片、场景画面
- **策（plan）**：章节大纲、人物卡、世界观结构化整理
- **砚（settings）**：DeepSeek API Key、模型、全局提示词等写作配置
- **编（editor）**：DeepSeek 续写 / 改写 / 润色，行内插入与改写
- **阅（reader）**：极简竖排阅读视图
- **集（library）**：作品与章节集合管理
- **出（export）**：TXT / Markdown 导出
- **侍（agent）**：AI 写作助手对话面板

UI 沿用了水墨 / 宣纸的视觉系统，所有 token 集中在 [www/css/tokens.css](www/css/tokens.css)。

---

## 🧱 技术栈

- **Cordova 12** + cordova-android 13 / cordova-ios 8（原生壳）
- **Vite MPA**：HTML + CSS + ES Modules，多页应用构建与开发服务器
- **AI 后端**：DeepSeek Chat Completions（OpenAI 兼容协议，浏览器直连）
- **本地存储**：`localStorage`（无服务端，所有数据保存在用户设备）

### 前端框架建议

为了最快迁移，当前保留现有多页 HTML，不立刻重写业务。后续如果要引入框架，推荐 **Vue 3 + Vite**：

- 页面可以按 `www/html/*.html` 逐个改成 Vue 入口，适合现有 MPA 结构
- 模板语法和当前 DOM 写法接近，迁移成本比 React 更低
- `store.js`、`deepseek.js`、`prompts.js` 这些业务模块可以先原样复用
- 角色卡、设置页、Agent 输入区这类表单密集页面，用 Vue 会明显减少手写 DOM 状态同步

目录结构：

```
.
├── landing/                  # Vercel 落地页，不参与 Cordova APK 打包
├── www/                      # 实际的 Web 前端（同时是 Cordova 的 webroot）
│   ├── html/                 # 各页面：index / capture / plan / editor / reader …
│   ├── css/                  # tokens.css 设计变量 + app.css 全局样式
│   ├── js/                   # boot / store / deepseek / prompts / utils …
│   └── assets/               # 图标、品牌资源
├── res/                      # Cordova 用的多分辨率应用图标
├── hooks/                    # Cordova 构建 hook：先跑 Vite，再同步 dist/www
├── config.xml                # Cordova 应用清单
├── build.json                # iOS 签名配置（团队 ID 等）
├── vite.config.js            # Vite 多页构建入口
├── package.json              # Vite + Cordova 工具链脚本
└── vercel.json               # Vercel 静态部署配置（指向 landing/）
```

---

## 🚀 本地预览（浏览器）

由于 `js/deepseek.js` 等模块使用了 ES Modules（`import` 语法），浏览器需要通过 HTTP 协议访问，不能用 `file://` 打开。现在使用 Vite 本地开发服务器：

```bash
npm install
npm run dev
```

然后访问：

```
http://localhost:5173/www/html/index.html
```

> 浏览器环境下 `cordova.js` 会 404 是正常的，boot.js 已做兼容处理，不影响功能。

首次使用请进入 **「砚」（设置页）**，填入你自己的 [DeepSeek API Key](https://platform.deepseek.com/api_keys)。Key 仅保存在你浏览器的 localStorage，**不会上传任何服务器**。

---

## 📱 移动端构建（Cordova）

> 需要本地装好 Node ≥ 18、Android Studio（含 JDK 17、Android SDK 34）、以及 iOS 所需的 Xcode 15+。

```bash
# 安装依赖
npm install

# Web 构建（输出 dist/，供 Vercel / 预览使用）
npm run build
npm run preview

# 添加平台（首次）
npm run prepare:android
npx cordova platform add ios   # 需要 macOS

# 调试构建
npm run build:debug

# 真机/模拟器运行
npm run run:android

# 发布 APK
npm run build:apk
```

Cordova 构建时会通过 [hooks/build-vite.js](hooks/build-vite.js) 先执行 Vite 构建，再通过 [hooks/sync-vite-www.js](hooks/sync-vite-www.js) 把 `dist/www` 同步到平台临时 webroot。源码目录 `www/` 仍然保留为可编辑源文件。

iOS 发布签名走 [build.json](build.json) 中的 Apple Development Team；上传 App Store 时使用 [ExportOptions.plist](ExportOptions.plist)。

---

## ☁️ 部署到 Vercel

仓库根目录已经包含 [vercel.json](vercel.json)。Vercel 部署仓库根目录：`/` 会展示 `landing/` 落地页，`/www/html/index.html` 是可体验的 Web App 入口；Cordova APK 仍只打包 `www/`，不会包含落地页。两种方式部署：

### 方式 1：仪表盘（推荐）

1. 推到 GitHub 之后，进入 [vercel.com/new](https://vercel.com/new)
2. Import 这个仓库
3. **Framework Preset** 保持 `Other` 即可
4. **Build Command** 使用 `npm run build:web`，**Output Directory** 使用 `dist`（`vercel.json` 已经声明）
5. 点 **Deploy**

### 方式 2：CLI

```bash
npm i -g vercel
vercel            # 首次部署（预览环境）
vercel --prod     # 正式环境
```

部署完成后访问域名根路径即可进入文舒落地页，访问 `/www/html/index.html` 可打开线上 Web App。

> ⚠️ **重要**：不要把你自己的 DeepSeek API Key 写进代码里再提交。所有 Key 都通过 App 内"砚"页面由用户自行填入，存在客户端 localStorage 里。

---

## 🔐 安全与隐私

- 没有自建后端，**所有 AI 请求由浏览器直连 DeepSeek**
- 写作内容、API Key、偏好设置全部保存在用户本地（localStorage）
- 卸载 App 或清空浏览器数据 = 完全销毁

如需多设备同步，建议自行接 iCloud Drive / OneDrive / 私有 WebDAV，不要使用任何不受信任的第三方同步服务。

---

## 🤝 贡献

欢迎 PR。提交前请确保：

1. 不要 commit `node_modules/`、`platforms/`、`plugins/` 等 Cordova 生成物
2. 不要把任何真实 API Key、签名证书写进仓库
3. UI 改动尽量复用 [tokens.css](www/css/tokens.css) 中已有的 CSS 变量

---

## 📄 License

MIT © 文舒团队

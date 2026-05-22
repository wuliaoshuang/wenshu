# 发版说明

## GitHub Release

推送版本 tag 会自动构建 Web 产物并创建 GitHub Release：

```sh
git tag v5.13
git push origin v5.13
```

工作流会上传 `wenshu-web-<version>.zip`，内容来自 `npm run build` 生成的 `dist/`。

## Android APK

默认不构建 Android。需要在 GitHub 仓库中配置：

- Repository variable: `BUILD_ANDROID=true`
- Secret: `ANDROID_KEYSTORE_BASE64`
- Secret: `ANDROID_KEYSTORE_PASSWORD`
- Secret: `ANDROID_KEY_ALIAS`
- Secret: `ANDROID_KEY_PASSWORD`

生成 keystore 的 base64：

```sh
base64 -i release.keystore | pbcopy
```

配置后，推送 `v*` tag 时会额外上传 `wenshu-android-<version>.apk`。

Android 平台版本固定为 `cordova-android@13.0.0`，不要在 CI 里使用 `android@latest`，否则可能拉到需要更新 Android SDK 常量的预发行/新版本平台，导致 `BAKLAVA`、`VANILLA_ICE_CREAM` 等编译符号找不到。

Cordova Android 13 的 release 默认可能产出 AAB，因此 CI 在 `build.android.json` 里显式设置 `packageType: "apk"`，并额外透传 `-- --packageType=apk` 来生成 GitHub Release 可直接下载的 APK。

## 版本规则

发版前保持这些位置一致：

- `package.json`
- `package-lock.json`
- `config.xml`
- 关于页版本展示

tag 使用 `v` 前缀，例如当前版本 `5.13` 对应 `v5.13`。

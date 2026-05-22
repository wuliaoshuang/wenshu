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

## 版本规则

发版前保持这些位置一致：

- `package.json`
- `package-lock.json`
- `config.xml`
- 关于页版本展示

tag 使用 `v` 前缀，例如当前版本 `5.13` 对应 `v5.13`。

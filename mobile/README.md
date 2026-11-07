# 交通线 v1.2.7 安卓试玩工程

手机端适配在此维护；上传源码不代表线上网页已重新发布。

## 已固定的内容

- 包名 `com.transitatlas.playtest`；名称“交通线试玩”；版本 `1.2.7-playtest`，versionCode 12008。
- Capacitor Core / Android / CLI 8.6.0，App 8.1.2；依赖已锁定。
- 声明最低 Android 7.0（API 24），编译／目标 API 36；要求 Android System WebView 或 Chrome 内核至少108。此为声明要求，不等于这些机型均已实测。
- 游戏内置本地运行，不使用远程游戏服务器；在线Google字体引用只在APK副本移除，使用系统字体。
- 安卓 App 的 pause、appStateChange、resume 接到v1.2中断锁；返回键依次取消未提交报价、关闭弹窗／详情、返回选图，选图页再次返回则最小化。
- 更新说明在游戏内只读窗口打开，防止网页跳转丢失原生事件监听。
- APK和网页来源不同，存档彼此独立；卸载APK会丢失其本地存档。本工程没有跨端导入或云存档。
- 不含广告、登录和TapTap ADN。

## 本机重建

需要完整 JDK21（包含javac）、Android SDK Platform36与Build Tools，以及Node22以上。首次下载依赖需要网络。

1. 在本目录运行 `npm ci`。
2. 运行 `npm run sync:android`、`npm run verify`。
3. 用Android Studio打开android目录，或设置ANDROID_HOME、JAVA_HOME后运行 `python3 scripts/build-android.py`（Linux）；Windows可在android目录运行 `gradlew.bat assembleDebug lintDebug`。
4. APK位于 `android/app/build/outputs/apk/debug/app-debug.apk`。

默认测试图标尚未替换。私人升级签名 `signing/playtest.keystore` 不入库；缺少时使用本机 Android 调试签名，自行构建的不同签名 APK 无法覆盖已分发试玩包。请使用单独测试设备或环境。`inspect-apk.py` 的固定签名断言只适用于原分发包。

`www` 为生成文件，不入库。保留同级 `dist/test04` 和 `dist/updates`，运行 `npm run sync:android` 生成资源；随后运行 `node ../tests/native-mobile.cjs`。

## 最新更新

竖屏及安全区适配、建造确认栏、手动桥梁连续连接、删路虚影与连回教学、启动遮罩、自动暂停保存、保存并返回本局、中级及以上居住城市农田与首次提示。

验证记录对应 v1.2.7 已分发包，文件中的上传状态为当时的历史状态；不代表本次源码上传状态。

## 验证边界

编译、签名、静态检查及事件适配逻辑检查不能证明Android真机兼容性。当前环境没有连接的安卓设备，也没有可用KVM，未宣称已经安装启动或验证真实锁屏／来电／后台杀进程／双指操作／后期帧率。

## PR #3 合并后的平台边界

网页的旋转地图和三个中心使用PR界面；APK保留v1.2.7五按钮、原方向和实际触摸操作。`web-base127` 固定5个与镜头/输入/入口有关的基线文件，在 prepare:web 时覆盖对应网页文件，其余玩法与扩展仍从 dist/test04 读取。后续修改这5个文件时须明确检查网页与APK两端，禁止直接把旧海岸旋转逻辑覆盖安卓操作层。

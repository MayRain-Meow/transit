# 交通线 v1.2.8 安卓试玩工程

版本 1.2.8-playtest，versionCode 12009，包名 com.transitatlas.playtest。以 GitHub 29f586a7 网页内容为基础，保留 v1.2.7 原生竖屏、手动桥梁拖动、删路与连回教学、保存返回和中断暂停功能。

本次加入单卡分页与固定底部操作、仅向持仓用户弹收益简报、农田解锁软提示、拉线原位支付地震维修、新局平滑且相接的河网。旧存档保留原有物理河道和桥头坐标。

安卓输入/镜头的五个基线文件继续由 web-base127 保留；web128.js、river128.js 在原生覆盖层之后加载，android128.js/css 负责平台冲突消解。不能直接删除该加载次序。

## 构建

完整 JDK21、Android SDK36 与 Build Tools35/36、Node22以上。进入 mobile 后运行 npm ci、npm run sync:android、npm run verify，然后在 android 内运行 bash gradlew assembleDebug lintDebug。

产物 android/app/build/outputs/apk/debug/app-debug.apk。本次分发包使用原试玩签名，签名私钥不包含在本源码包，也不上传 GitHub；缺少原私钥时本地构建会使用新的调试签名，不能覆盖原分发包。

锁定竖屏，minSdk24，WebView108以上；没有广告/登录/TapTap ADN。游戏本地运行，无跨端云存档。不要卸载旧应用，卸载会清除本地存档。

## 验证边界

编译、Android lint、签名与资源逐字节核对、打包脚本执行的交互/生命周期回归检查，不代表安卓真机兼容性已通过。本轮没有安卓设备或模拟器验收；本地浏览器渲染尝试受运行环境限制，未计为通过。网页此前已做360/390/430宽度卡牌排版检查。

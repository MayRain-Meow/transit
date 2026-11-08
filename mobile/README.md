# 交通线 v1.2.9 安卓试玩工程

版本 1.2.9-playtest，versionCode 12010，包名 com.transitatlas.playtest。沿用原试玩签名，可覆盖原1.2.7/1.2.8分发包；不要卸载旧应用，卸载会清除本地存档。

## 本次更新

采用PR前端的目标、建造、资金三入口、城市设施与线路面板，按原生可用视口适配竖屏。服务合同入口及账本占位、重复关闭按钮、进图选图入口与旧方向建议不再出现。

教程第一步介绍城市里的候车、任务和建筑入口，使用简短指令和实际DOM按钮定位。保留删路、连回、手动架桥和雾/气象站教学。建筑介绍完成后一次发1600，再从建立第二条线路开始，教共用城市中选择指定线路、延长到第三座城市、应用修改后结束。余额不足可取消预览、先赚票款，不再额外发钱。旧教程完成后不会强迫在进行中的游戏重播；新东部开局可体验新版教程。

## 平台边界

web-base127仅保留game.js/world.js两份已经验证的输入与世界底层。PR的index.html/style.css/ux.js直接读取dist/test04，不再由旧安卓界面覆盖。portrait-config提供不旋转坐标转换；portrait-layout和update129负责竖屏及教学。原始手动选桥、回拉越过上一站删路、连回途经点、保存并继续和中断暂停保留。

## 构建与验证

需要JDK21、Android SDK36、Build Tools35/36、Node22以上。进入mobile，npm ci、npm run sync:android、npm run verify；然后设置JAVA_HOME/ANDROID_HOME并运行python3 scripts/build-android.py。也可在android内运行bash gradlew assembleDebug lintDebug。

APK输出android/app/build/outputs/apk/debug/app-debug.apk。原签名私钥不入库；缺少时本地Android调试签名不能覆盖原分发包。APK和私钥均不上传GitHub。

node tests/native-mobile.cjs（在项目根目录）验证原生交互与生命周期；node tests/native128.cjs验证1.2.8功能；node tests/native129-dom.cjs使用真实DOM和打包脚本顺序验证三入口、建筑引导、一次补助、存取档、视频中的多线选择/延长和确认完成。DOM模拟器不提供真实排版引擎或Android运行环境。没有Android真机/模拟器验收，不宣称所有机型兼容或真实帧率已通过。

游戏内置本地运行，最低Android7/API24，WebView108以上，无登录/广告/TapTap ADN，无跨端云存档。

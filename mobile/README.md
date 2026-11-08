# 交通线 v1.2.10 安卓试玩工程

版本 1.2.10-playtest，versionCode 12011，包名 com.transitatlas.playtest。沿用原试玩签名，可覆盖原1.2.7/1.2.8分发包；不要卸载旧应用，卸载会清除本地存档。

## 本次更新

新手引导使用最终按钮位置计算高亮；指向引导内按钮时不再切换上下位置。保留城市介绍、手动架桥、回拉删路、连回途经点、气象站及一次1600补助后的第二条线教学。恢复常驻交通网络标题、折叠列表和新建线路按钮。

公交可由三座及以上城市闭合为环线，按原方向循环，首尾寻路和上下客一致；其他交通不可闭合。编辑预览可解除环线。普通乘客仍按颜色、形状及目标城市圈匹配；学校、卡牌、演唱会乘客严格指定目的城市。队列小标记分别为书本、星、音符，返程追加箭头；车辆列表可定位目的城市。

卡牌保持一页一张，星级与奖励不进入通用规则折叠；预计客流和完成目标区分显示。增加翻牌阴影、纸纹、旋转及高星光效，并尊重减少动态效果设置。

可建设提示按存档仅通知一次，拉线或其他窗口期间排队；恢复活动卡弹窗和三个入口的小红点。农田需中级居民城市；闲置农田无收获简报。理财/股票只有实际持仓且日盈亏达到一分钱显示精度时才弹收益简报。演唱会和卡牌乘客不直接计入满员扣命；游戏结束后的后续tick不再推进。

## 验证范围

新增 tests/native130-dom.cjs：三个高度下360次引导布局稳定、单卡奖励/星级保护、公交环线正反方向边界、定向寻路、实际送达只计一次、存取档、400次实际tick运行、非公交闭环拒绝、同色同形与城市圈限制、特殊目的地、拥堵180秒边界与回落、特殊活动客流不扣命、死亡后停止推进、农田通知排队且不重复。既有桥梁/删路/第二线路教程和原生中断/保存测试保留。

DOM使用jsdom，几何矩形是合成值，不能替代真实渲染或真机触控；尚无Android真机/模拟器验收。没有重新拟合400天经济存活率。

## 平台边界

web-base127仅保留game.js/world.js两份已经验证的输入与世界底层。PR的index.html/style.css/ux.js直接读取dist/test04，不再由旧安卓界面覆盖。portrait-config提供不旋转坐标转换；portrait-layout和update129负责竖屏及教学。原始手动选桥、回拉越过上一站删路、连回途经点、保存并继续和中断暂停保留。

## 构建与验证

需要JDK21、Android SDK36、Build Tools35/36、Node22以上。进入mobile，npm ci、npm run sync:android、npm run verify；然后设置JAVA_HOME/ANDROID_HOME并运行python3 scripts/build-android.py。也可在android内运行bash gradlew assembleDebug lintDebug。

APK输出android/app/build/outputs/apk/debug/app-debug.apk。原签名私钥不入库；缺少时本地Android调试签名不能覆盖原分发包。APK和私钥均不上传GitHub。

node tests/native-mobile.cjs（在项目根目录）验证原生交互与生命周期；node tests/native128.cjs验证1.2.8功能；node tests/native129-dom.cjs使用真实DOM和打包脚本顺序验证三入口、建筑引导、一次补助、存取档、视频中的多线选择/延长和确认完成。DOM模拟器不提供真实排版引擎或Android运行环境。没有Android真机/模拟器验收，不宣称所有机型兼容或真实帧率已通过。

游戏内置本地运行，最低Android7/API24，WebView108以上，无登录/广告/TapTap ADN，无跨端云存档。

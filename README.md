# transit

# 交通线 · 东岸

以拖动拉线为核心的浏览器交通经营游戏。地形采用伪3D表现，车辆与线路采用2D绘制；无需安装前端依赖或执行构建。

## 在线试玩

- [0.4：学校、城市服务与月底经营](https://transit-atlas-coast.kkxxwwk321.chatgpt.site/test04/)
- [0.3：桥梁、天气与运行方案](https://transit-atlas-coast.kkxxwwk321.chatgpt.site/test03/)
- [0.2：城市成长与交通经营](https://transit-atlas-coast.kkxxwwk321.chatgpt.site/test/)
- [正式版](https://transit-atlas-coast.kkxxwwk321.chatgpt.site/)
- [0.2—0.4 更新说明](dist/updates/changelog.txt)

## 0.4 功能

- 四类城市、六阶段交通任务、成长奖励、票款、商演与运输合同。
- 大巴、动车、高铁、飞机；车辆区间与快车方案；动车与高铁进出站加减速。
- 手动桥梁建设、共用桥梁、桥面拓宽、道路与铁路升级、限量枢纽。
- 雾雨、气象站、南向北移动的季节台风、后期地震与路段维修。
- 中大城市学校、学生上学与返程、按实际服务表现发放的月底教育补贴。
- 城市服务评价、长期差评预警与降级、服务改善后恢复。
- 月底道路维护费、共享设施去重、预计支出、欠费补缴、闲置道路拆除。

## 本地运行

在仓库根目录打开终端，使用 Python 3：

```sh
python -m http.server 8000 --directory dist
```

打开 `http://localhost:8000/test04/` 玩0.4。正式版为 `/`，0.2为 `/test/`，0.3为 `/test03/`，更新说明为 `/updates/`。

各版本使用独立的浏览器本地存档。存档保存在当前浏览器与域名下，不会跟随GitHub仓库同步；从线上切换到本地也不会自动迁移进度。

## 文件结构

| 目录 | 内容 |
| --- | --- |
| `dist/` | 正式版入口与静态资源 |
| `dist/test/` | 0.2测试版 |
| `dist/test03/` | 0.3测试版 |
| `dist/test04/` | 0.4测试版 |
| `dist/updates/` | 网页与TXT更新说明 |
| `tests/` | 纯Node.js功能测试 |

0.4脚本按 `game.js` → `progression.js` → `world.js` → `economy.js` 顺序加载。当前为原生HTML/CSS/JavaScript项目。

## 验证

安装Node.js 18或更新版本，在仓库根目录运行：

```sh
node tests/city-economy.cjs
node tests/world03.cjs
node tests/world04.cjs
node tests/portrait-layout.cjs
```

测试覆盖经济任务、商演、桥梁复用与拆除、天气、运行方案、学校、服务降级恢复、维护结算和列车长短途速度差异。测试使用模拟浏览器环境；界面仍需通过浏览器试玩检查。

0.4 竖屏界面的回归记录、已检查交互与截图见[竖屏验收说明](.agents/notes/implemented/bug-fix/2026-11-04-portrait-acceptance.md)。

## 版本与使用

当前备份版本为0.4测试版，日期2026-11-04。价格、费率、客流和评价参数仍在试玩调整。

本仓库备份源码不会改变现有试玩站的发布状态；上传GitHub也不会自动部署到GitHub Pages。仓库可见性与现有试玩站的访问权限分别管理。

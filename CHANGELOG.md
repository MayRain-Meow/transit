# 1.6.0 — 双洋大陆与港航

- 第三图：东南三城、东西海岸、中央平原、西部山地、五大湖，独立存档。8000元开局，第一年6月1日，日期显示年份。
- 第4/5/6城：第10/20/30天；第7—12城每8天，第13—24城每10天，之后每12天。沿海优先，再中央平原、北方。第10城固定拉斯维加斯，选址随机。
- 港口1500；小轮船2800/60人，速度20；大轮渡10000/250人，速度12，与飞机实际解锁条件同步。海路建线与航行免费，绕开陆地；五大湖禁港，海洋禁桥。
- 到港先下后上，逐人核销。小船下8/上20人每秒，大轮渡下20/上50；不等满员。旅程目的地符合港口城市时直接完成，否则正常换乘。
- 第一年无台风；以后夏季3—4次，范围内轮船速度−10%。12—2月寒潮北向南，空间边缘及时间后期渐弱，持续4.8—7.2天；公交受影响最大，动车高铁较轻，轮船不受寒潮影响。
- 科研与天气并排，6所大学解锁。现有研究保留，新增两种船的速度研究（＋15%），无船舶容量研究。
- 拉斯维加斯保留旅游属性与正常客流，使用球体城市外观，顶级免费获得一级枢纽。
- 赌城造价100，每10天开放1个游戏日，可选参加；自选带入和下注，最多10次，可提前退出。触屏下拉拉杆，有机械感及中奖声音。七种符号独立等概率；恰好一对总返还2倍，三同柠檬/大巴/动车/轮船/飞机/金币/C分别3/4/5/6/8/12/30倍，理论返还率320/343。资金和结果在动画前一起保存，刷新不重抽。
- 大巴同一线路同一路段双向合计上限8/12/16辆；不同线路独立。车辆页新增回收、库存出售，原价60%，整列包括加装车厢。
- 新增3项海运成就、3项股票实际累计买入金额成就、8架飞机同时飞行成就；旧成就保留。
- 普通城拥挤160秒/旅游205秒，低于容量渐恢复，80%以下双倍恢复，活动乘客不计压力。活动罚款按星级上限800/1000/1200/1600/2000/2400，保护活动保留较低处罚，按缺口扣款。
- 修复城市触控圈被临近线路抢占、理财入口卡在收益记录；图二第4城出现后20天出第5城。地形缓存包含边界、面片边缘补绘，河网绘制改为版本键与路径缓存。

验证：旧地图交通、触摸、生命周期、地形、音效、金融回归；10组第三图300天城市布局；海洋路径、逐人结算、真实建线/读档、道路名额、出售及赌城概率/余额持久化。
上述布局验证不是新版本完整经营存活率回测。默认船速、装卸速度、科研费用和寒潮参数沿用最近讨论方案，仍需真机试玩检验体感。

# v1.5.14 — Four financial return achievements

Add gold stock achievements 幸运儿 (+15% held return) and 险些腰斩 (30% held loss), plus silver wealth achievements 靠谱的经理 (+15% per-lot return) and 打水漂 (30% per-lot loss). Each uses the current position cost or original lot principal, requires an actual holding, unlocks without sale/redemption, and persists across runs under the existing achievement key. Daily settlement and pre-transaction synchronization retain threshold crossings. Existing music and sound behavior remain unchanged.

# v1.5.13 — Felicity background music

Use the uploaded Felicity MP3 in one looping player shared by map selection and gameplay. Start after a user interaction, keep playback position across screens, and pause in background/native interruptions. Add separate remembered music on/off and volume controls alongside existing effects.

# v1.5.12 — Join interior ridges to the basin rim

Extend the outward end of each of the five interior mountain groups until its physical footprint overlaps an outer mountain ridge. Choose junctions away from river valleys, preserve the inner tips, broad intervening valleys and the expanded outer ring. Rendering, city exclusion and tunnel calculation share the same polygons. Terrain revision 3 applies to new western games; earlier saves retain their exact terrain and construction.

# v1.5.11 — Quiet card flip and rarity effects

Play a short paper flip only when an unrevealed activity card is actually revealed. Five- and six-star cards get a quiet delayed chime. Opening or revisiting cards, accepting and failed activities remain silent. Reveal-all softly staggers the flips and plays at most one rarity chime. Card sounds use 30% of the existing effects volume, share its mute switch, and stop/cancel pending chimes on background interruptions. Original generated WAV assets, no external music or audio dependency.

# v1.5.10 — Restore the interior mountain groups

Restore all five interior ridges within the expanded western basin. Four are spaced farther apart, keeping broad intervening plains; the original opening ridge and the expanded outer mountain ring are unchanged. The drawing, city collision and tunnel quote use the same restored footprints. New western games use terrain revision 2; older saves retain their exact terrain and existing construction.

# v1.5.9 — Tutorial circles follow visible roads

Deletion demonstrations follow the rounded lane geometry from the end city through the prior city and slightly along the remaining road. Reconnection circles sit on the actual drawn road outside station hit areas, replacing the midpoint of the invisible straight chord. Both cues share the same road geometry used by rendering and interaction, and follow camera pan/zoom. Tutorial steps and construction behavior are unchanged.

# v1.5.8 — Western basin, regional disasters and clearer controls

New western games use an expanded mountain ring with fewer internal ridges. Existing western saves retain their original terrain, cities and construction. Full-bounds terrain tiles display the expanded footprint, and path caches clear on geometry changes. West has no typhoons (including previously scheduled events); eligible daily earthquake probability is 2%, versus east 0.8%, retaining day 150, rail, six connected cities and the 80-day cooldown.

Simultaneous facility unlocks share one notification with individual destinations. Rain and fog have bounded animated effects clipped to their actual circular influence, using simulation time and no simulation RNG. The exit sheet offers Continue or Save and return to maps; continuing restores the prior pause state and honors background interruption.

# v1.5.7 — Sound on city snap

Move the connection effect from construction confirmation to the accepted city snap while dragging. New lines and either-end extensions sound as each city joins the draft. Hover repeats, pointer release over the same city, bridge endpoints, rejected snaps, removal, cancellation and construction confirmation do not produce an extra sound. Effects settings and background protection are retained; music remains deferred.

# v1.5.6 — Connection feedback, music deferred

Successful new routes and extensions play the previously auditioned 0.24-second soft connection sound once after construction commits. Quotes, cancellation, insufficient funds, invalid routes, unchanged edits and stop removal are silent. Sound effects have their own toggle and volume in a compact settings sheet, remembered across both maps and reloads. Hidden pages and native background transitions stop playback; playback/storage failures cannot interrupt construction. Background music and its MP3 are excluded from this release.

Validation: complete existing gameplay suite plus successful/failed commit sound, preference persistence, rejected playback, touch/pan/zoom and interruption save/resume checks. Browser QA is recorded separately; no APK in this release.

# v1.5.4 — Both-map river rendering hotfix

Reproduced an inward extrapolation caused by endpoint spline overshoot: the first two nearby samples can point opposite the outward river heading. East tributaries that should extend eastward instead extended across the whole map to the west; the same estimator affected western paths. The heading now uses a meaningful 96-unit span and must point outward. Exactly recognized v1.5.3 additions are removed from saved geometry before safe extrapolation; all original centerline samples remain unchanged. Regression coverage reproduces the old reversed east tributary and checks both maps, including a genuinely constructed bridge and route through repair and save/load.

Moved the complete river network into one final drawing pass shared by both maps. Cached terrain tiles now contain land, hills, trees and valley clearance only; the scenic apron no longer draws a second water network. The final pass reads exactly the active main and tributary coordinates used by saved river paths and collision segments. Each tributary has a separate subpath and all bank/water layers are painted across the entire network in order.

Terrain caches are also keyed by map identity, bounds and river coordinates, preventing a cached tile from a previous geometry or map from surviving a load or switch. No city, line, bridge, terrain collision, economy or stored river coordinate is relocated by this rendering patch.

Validation: recorded Canvas calls on both east and west assert exactly one visible water pass, no cached water, correct separate subpaths, matching active coordinates, save/load preservation, cache reuse on unchanged geometry and automatic replacement on geometry changes. Existing gameplay regressions retained. Browser checks cover both maps in portrait. Web only; no APK.

# v1.5.3 — Portrait map and continuous drawing revision

Expanded the western spawn bounds to (-1300,-450)–(1500,1650), chiefly adding outer and southern plains. Central mountains, initial three cities, 7000 opening funds and the 5670 first-route quote are unchanged. Extended every open river end beyond the full movable scenic apron on both maps, preserving existing centerline coordinates and confluences for saved bridges.

Minimum zoom now retains vertical as well as horizontal pan room. Camera clamping uses the same scenic bounds as rendering, and same-width browser toolbar height changes no longer reset the player camera. Outer scenery fills the entire visible view; cached tree positions avoid repeated river-distance work on every frame.

New city groups must have usable width and two-dimensional spread rather than merely enough candidate towns in a narrow row. Local additions favor filling the group's short axis, retaining spacing, terrain, ownership, initial spawn dates and existing east/west maturity requirements. Existing towns are not relocated.

Continuous gestures retain each newly attached stop when extending either end of an existing line. A direct pass through a station center attaches immediately; the broader touch halo retains its dwell guard. Bridge selection and route confirmation rules remain unchanged.

Validation: full transport, opening costs, save/load, 400-day geometry growth, finance briefs, onboarding, map selection, runtime recovery and continuous pointer-drag regression suite. Browser QA at 390×844 covers portrait rendering and native vertical panning. No APK or survival-rate fitting in this revision.

# v1.5.2 hotfix

Reproduced a four-town opening with no valid short-range local spawn candidates (seed 10, fourth town -80,740). Only when the standard initial-circle pool is empty, widen the same-circle local search from 330 to 460 units, then at most 600 with center radius 760 if that pool is also empty; prefer the nearest valid sites, retaining buildability, city spacing, bridge/tunnel cost tier and region ownership checks. Existing trapped saves can continue; nominal spawn dates are unchanged.

The selector now handles raw TouchEvents from start to finish and suppresses the browser's default gesture in this area. Horizontal dragging and vertical card scrolling are both direction-locked; pointercancel from a companion pointer stream cannot discard a TouchEvent swipe. Mouse/pen, buttons and keyboard selection remain available.

# v1.5.1 hotfix

Fixed the construction preview crash introduced when PR #4 called the missing orientation helper `uprightHere` in the fixed-portrait integration. Removed that redundant orientation call; the camera remains unrotated. Reproduced the original ReferenceError before the fix. Added actual pointer-drag, preview/frame, build and save/load regression coverage on both maps.

Added explicit map-selector horizontal pointer dragging, directional lock, snap on release, post-drag click suppression and cancellation cleanup. Vertical card scrolling remains native. Confirmed both directions using browser mouse drags; real mobile touch remains a device-test limit.

No save clearing or economic changes.

# v1.5.0 — Web preview

Integrated PR #4 (a10aef5) presentation, route service commit, camera and state-scoped drawing cache changes with the deployed 25068a1 basin/transport branch. The portrait shell and actual mountain/tunnel collisions remain authoritative. PR #4 remains separate from the public repository merge workflow.

Investment and farm results now use one nonblocking bottom brief above the current network tray. The slot coalesces results, defers during gestures and construction drafts, expires after four wall-clock seconds, retains an unread funds badge, and stores up to 80 report records. Details remain available in the funds ledger. Empty holdings and zero profit do not generate earnings briefs. Explicit construction unlocks and activity offers retain their existing notification rules. Farm credits settle exactly once with no pending acknowledgement gate. Clicking details pauses; closing restores the prior running state, except after a real background interruption.

Preserved: west 7000 opening, east 5000, central basin/southeast gap/outer plains, paid tunnels, gradual city clusters, interchangeable normal destinations, exact special passengers, necessary transfers, directed bus loops, six-star card scrolling and fixed actions. No economy, returns, event chances or passenger growth tuning in this release. No APK built.

Validation: deterministic full-script transport, basin opening/paid quote/save/load/growth, real finance and farm settlement, brief merging/expiry/defer/pause restoration, PR route commit and map-switch drawing cache regressions. Browser checks at 390×844 and 360×740; mouse-driven checks do not replace physical-device touch testing.

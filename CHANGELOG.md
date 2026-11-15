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

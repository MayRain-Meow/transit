"use strict";
let finishingEdit131 = false, committingEdit131 = false;
function dismissRouteDetails131() {
  if (selected?.type === "line" || selected?.type === "stop") selected = null;
  if (!$("details").hidden) $("details").hidden = true;
}
const detailsBefore131 = showDetails;
showDetails = function(...a) {
  if ((draft?.original || finishingEdit131 || committingEdit131) && selected?.type === "line") {
    dismissRouteDetails131();
    return;
  }
  return detailsBefore131(...a);
};
const finishBefore131 = finishPointer;
finishPointer = function(e) {
  let editing = !!draft?.original, fromPicker = !!gesture?.junctionDrag131;
  finishingEdit131 = editing;
  try {
    return finishBefore131(e);
  } finally {
    finishingEdit131 = false;
    if (editing) {
      dismissRouteDetails131();
      if (fromPicker && draft && draft.original && S.lines.find((l) => l.id === draft.original)?.stops.join(",") === draft.stops.join(",")) cancelDraft(false);
    }
    if (typeof tutorialUI123 === "function") tutorialUI123();
  }
};
const extFinishBefore131 = uxExtFinish;
uxExtFinish = function(...a) {
  let editing = !!draft?.original;
  finishingEdit131 = editing;
  try {
    return extFinishBefore131(...a);
  } finally {
    finishingEdit131 = false;
    if (editing) dismissRouteDetails131();
    if (typeof tutorialUI123 === "function") tutorialUI123();
  }
};
const commitBefore131 = commitDraft;
commitDraft = function(...a) {
  let editing = !!draft?.original;
  committingEdit131 = editing;
  try {
    return commitBefore131(...a);
  } finally {
    committingEdit131 = false;
    if (editing) dismissRouteDetails131();
    if (typeof tutorialUI123 === "function") tutorialUI123();
  }
};
const cancelBefore131 = cancelDraft;
cancelDraft = function(...a) {
  let editing = !!draft?.original, r = cancelBefore131(...a);
  if (editing) dismissRouteDetails131();
  return r;
};
if (typeof tutorialUI123 === "function") tutorialUI123();

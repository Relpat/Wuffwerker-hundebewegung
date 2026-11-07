import { CONTOUR } from './contour.js';
import { skinContour } from './skin.js';

/** The whole outline is skinned to the whole-body rig (skin.js). */
export function contourAt(pose) {
  if (pose.mode === 'stand' && !pose.tail?.enabled) return CONTOUR;
  const cmds = skinContour(pose.joints);
  const out = pose.correctives ? applyCorrectives(cmds, pose.correctives) : cmds;
  // Floor poses: skin pressed onto the floor stays on it (pads, hock, rump).
  if (Number.isFinite(pose.floor)) for (const c of out) for (let k = 2; k < c.length; k += 2) c[k] = Math.min(c[k], pose.floor);
  return out;
}

const end = c => ({ x: c[c.length - 2], y: c[c.length - 1] });
/** Pose-space corrections for deep folds (e.g. the hind leg in the sit), where
 * linear blend skinning alone folds the outline over itself. Each entry moves
 * one anchor (with its two neighbouring handles) towards a point on the line
 * between two other, already skinned anchors: {cmd, from, to, t, dy, weight},
 * or towards a fixed point (e.g. taken from a posed joint): {cmd, point, weight}.
 * An entry with only {cmd, weight} just relaxes that curve; `relax` (0…1,
 * default 1) scales how much the touched curves are straightened. */
function applyCorrectives(cmds, list) {
  for (const { cmd, from, to, t, dy = 0, point, weight } of list) {
    if (!(weight > 0) || (from === undefined && !point)) continue; // entry only straightens
    const c = end(cmds[cmd]);
    let goal;
    if (point) goal = { x: point.x, y: point.y + dy };
    else {
      const a = end(cmds[from]), b = end(cmds[to]);
      goal = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t + dy };
    }
    const dx = (goal.x - c.x) * weight;
    const dyy = (goal.y - c.y) * weight;
    const shift = (i, k) => { cmds[i][k + 1] += dx; cmds[i][k + 2] += dyy; };
    shift(cmd, 2); shift(cmd, 4);
    if (cmds[cmd + 1]?.[0] === 'C') shift(cmd + 1, 0);
  }
  // Curves touching a corrected anchor relax towards straight lines, so their
  // handles (still oriented as in the stand) cannot form small loops.
  const touched = new Set(list.filter(c => c.weight > 0).flatMap(c => [c.cmd, c.cmd + 1]));
  for (const i of touched) {
    const c = cmds[i];
    if (c[0] !== 'C') continue;
    const w = Math.max(...list.filter(e => e.cmd === i || e.cmd + 1 === i).map(e => e.weight * (e.relax ?? 1)));
    const a = end(cmds[i - 1]), b = end(c);
    for (const [k, t] of [[1, 1 / 3], [3, 2 / 3]]) {
      c[k] += (a.x + (b.x - a.x) * t - c[k]) * w;
      c[k + 1] += (a.y + (b.y - a.y) * t - c[k + 1]) * w;
    }
  }
  return cmds;
}

import { CONTOUR } from './contour.js';
import { skinner } from './skin.js';
import { torsoDelta } from '../animation/body.js';
import { headDelta } from '../animation/head.js';
import { tailDelta } from '../animation/tail.js';

/** Trunk, neck/head and tail use the shared pose-space fields (no seam);
 * the leg regions use weighted skinning on the A1 bones (see skin.js).
 */
export function contourAt(pose) {
  if (pose.mode === 'stand' && !pose.tail?.enabled) return CONTOUR;
  const skin = skinner(pose.joints);
  const cmds = CONTOUR.map(([op,...p],i)=>{
    // Commands 0–1 and the last three before Z run along the tail; no separate tail mesh.
    const isTail=i<=1||(i>=CONTOUR.length-4);
    if (op==='Z') return [op];
    const coords=[];
    for(let k=0;k<p.length;k+=2) {
      const x=p[k],y=p[k+1];
      const b=torsoDelta(x,y,pose.body);
      const h=headDelta(x,y,pose.head);
      const t=isTail?tailDelta(x,pose.tail):{x:0,y:0};
      const trunk={x:x+b.x+h.x+t.x,y:y+b.y+h.y+t.y};
      const skinned=skin(i,k,{x,y},trunk);
      const q=skinned||trunk;
      coords.push(q.x,q.y);
    }
    return [op,...coords];
  });
  const out = pose.correctives ? applyCorrectives(cmds, pose.correctives) : cmds;
  // Floor poses: skin pressed onto the floor stays on it (pads, hock, rump).
  if (Number.isFinite(pose.floor)) for (const c of out) for (let k = 2; k < c.length; k += 2) c[k] = Math.min(c[k], pose.floor);
  return out;
}

const end = c => ({ x: c[c.length - 2], y: c[c.length - 1] });
/** Pose-space corrections for deep folds (e.g. the hind leg in the sit), where
 * linear blend skinning alone folds the outline over itself. Each entry moves
 * one anchor (with its two neighbouring handles) towards a point on the line
 * between two other, already skinned anchors: {cmd, from, to, t, dy, weight}.
 * An entry with only {cmd, weight} just relaxes that curve. */
function applyCorrectives(cmds, list) {
  for (const { cmd, from, to, t, dy = 0, weight } of list) {
    if (!(weight > 0) || from === undefined) continue; // entry only straightens
    const a = end(cmds[from]), b = end(cmds[to]), c = end(cmds[cmd]);
    const dx = (a.x + (b.x - a.x) * t - c.x) * weight;
    const dyy = (a.y + (b.y - a.y) * t + dy - c.y) * weight;
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
    const w = Math.max(...list.filter(e => e.cmd === i || e.cmd + 1 === i).map(e => e.weight));
    const a = end(cmds[i - 1]), b = end(c);
    for (const [k, t] of [[1, 1 / 3], [3, 2 / 3]]) {
      c[k] += (a.x + (b.x - a.x) * t - c[k]) * w;
      c[k + 1] += (a.y + (b.y - a.y) * t - c[k + 1]) * w;
    }
  }
  return cmds;
}

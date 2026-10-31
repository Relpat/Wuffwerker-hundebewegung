/** Gait timing and two-bone IK adapted from the approved v7.5.1 study.
 * This first motion pass animates the two visible limbs only. It is not yet
 * the original four-leg gait system or production skinning.
 */
import { JOINTS } from '../skeleton/stand.js';
import { torsoAt, torsoDelta } from './body.js';
import { headAt, headDelta } from './head.js';
import { tailAt, tailDelta } from './tail.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smooth = x => { const t = clamp(x, 0, 1); return t*t*(3 - 2*t); };

export const GAITS = Object.freeze({
  stand: { label: 'Stand', period: 1, stride: 0, stance: 1, lift: 0, hind: 0, front: 0 },
  walk: { label: 'Gehen', period: 1.30, stride: 58, stance: .72, lift: 20, hind: 0, front: .75 },
  trot: { label: 'Trab', period: .80, stride: 74, stance: .52, lift: 25, hind: 0, front: .50 },
  run: { label: 'Laufen', period: .76, stride: 100, stance: .43, lift: 15, hind: 0, front: .515 },
  pace: { label: 'Passgang', period: 1.00, stride: 62, stance: .57, lift: 21, hind: 0, front: 0 },
});

/** Fixed-length two-bone solver, preserving the requested bend side. */
export function solveLeg(root, target, upper, lower, bend) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const distance = Math.hypot(dx, dy);
  const nx = distance > 1e-8 ? dx / distance : 0;
  const ny = distance > 1e-8 ? dy / distance : 1;
  const reachable = clamp(distance, Math.abs(upper - lower) + 0.001, upper + lower - 0.001);
  const foot = { x: root.x + nx*reachable, y: root.y + ny*reachable };
  const projected = (upper*upper - lower*lower + reachable*reachable)/(2*reachable);
  const height = Math.sqrt(Math.max(0, upper*upper - projected*projected));
  const knee = { x: root.x + nx*projected - ny*height*bend,
                 y: root.y + ny*projected + nx*height*bend };
  return { root, knee, foot, error: Math.hypot(target.x-foot.x, target.y-foot.y), upper, lower };
}

/** Foot x stays fixed in world space during stance if the body translates at stride/period.
 * In the local stage, this appears as a backwards-moving foot; swing returns forward.
 */
export function pawPath(time, gait, offset) {
  if (!gait.stride) return { x: 0, y: 0, support: true };
  const phase = ((time/gait.period + offset) % 1 + 1) % 1;
  const reach = gait.stance*gait.stride / 2;
  if (phase < gait.stance) {
    return { x: reach - phase*gait.stride, y: 0, support: true };
  }
  const u = (phase - gait.stance) / (1 - gait.stance);
  return { x: -reach + 2*reach*smooth(u), y: -gait.lift*Math.sin(Math.PI*u), support: false };
}

export function poseAt(mode = 'stand', time = 0, { bodyMotion = true, headMotion = true, tailMotion = true, tailExpression = 'auto' } = {}) {
  const gait = GAITS[mode];
  if (!gait) throw new Error(`Unknown gait: ${mode}`);
  const joints = Object.fromEntries(Object.entries(JOINTS).map(([key, xy]) => [key, { x: xy[0], y: xy[1] }]));
  const body = torsoAt(mode, time, gait.period, bodyMotion);
  const head = headAt(mode, time, gait.period, body, headMotion);
  const tail = tailAt(mode, time, {enabled:tailMotion, expression:tailExpression});
  if (mode === 'stand') {
    if (tail.enabled) {
      for (const key of ['tailTip','tailRoot']) {
        const p=joints[key],d=tailDelta(p.x,tail);p.x+=d.x;p.y+=d.y;
      }
    }
    return { mode, time, joints, body, head, tail, support: { front: true, hind: true }, targetError: 0 };
  }

  // Root landmarks and their attached neck/head/tail move in one continuous field.
  // Distal limb joints below are then solved against paw targets on the floor.
  for (const [name, p] of Object.entries(joints)) {
    if (['elbow', 'carpus', 'frontPaw', 'stifle', 'hock', 'hindPaw'].includes(name)) continue;
    const d = torsoDelta(p.x, p.y, body);
    const h=headDelta(p.x,p.y,head);
    const t=(name==='tailTip'||name==='tailRoot')?tailDelta(p.x,tail):{x:0,y:0};
    p.x += d.x+h.x+t.x;
    p.y += d.y+h.y+t.y;
  }

  const fp = pawPath(time, gait, gait.front);
  const hp = pawPath(time, gait, gait.hind);
  const requestedFront = { x: JOINTS.frontPaw[0] + fp.x, y: JOINTS.frontPaw[1] + fp.y };
  // The rear foot is linked to the hock by a fixed metatarsal offset (v7.5.1).
  const requestedHock = { x: JOINTS.hock[0] + hp.x, y: JOINTS.hock[1] + hp.y };
  const front = solveLeg(joints.shoulder, requestedFront, 80, 94, +1);
  const hind = solveLeg(joints.hip, requestedHock, 77, 70, -1);
  joints.elbow = front.knee;
  joints.frontPaw = front.foot;
  joints.carpus = { x: front.knee.x + (front.foot.x-front.knee.x)*.79,
                   y: front.knee.y + (front.foot.y-front.knee.y)*.79 };
  joints.stifle = hind.knee;
  joints.hock = hind.foot;
  joints.hindPaw = { x: hind.foot.x + 17, y: hind.foot.y + 48 };
  return { mode, time, joints, body, head, tail, support: { front: fp.support, hind: hp.support },
    targetError: Math.max(front.error, hind.error) };
}

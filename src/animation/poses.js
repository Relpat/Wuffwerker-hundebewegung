/** Stage A6 (first pose): sitting, built on the A1 skeleton and the A2 skin.
 *
 * Real sit (tuck sit): the forelegs stay straight and vertical, the trunk
 * turns rump-down about the shoulders, the hind legs fold completely – femur
 * forwards, tibia back, the metatarsus lies on the floor with the point of the
 * hock touching it, and the hind paws come forward under the body. The
 * pantograph (femur ∥ metatarsus, Fischer & Lilje) holds in this pose too:
 * femur and metatarsus both end up roughly horizontal.
 * `amount` 0…1 blends from the neutral stand into the sit (for transitions).
 */
import { JOINTS, FAR_BIND as DEFAULT_FAR_BIND } from '../skeleton/stand.js';
import { solveFront, solveHind } from '../skeleton/limbs.js';
import { trunkPose } from './body.js';
import { posedTrunk } from './assemble.js';
import { ARTBOARD, CONTOUR_REGIONS } from '../geometry/contour.js';

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const P = xy => ({ x: xy[0], y: xy[1] });

export const SIT = Object.freeze({
  label: 'Sitz',
  tilt: -44 * DEG,        // trunk turns rump-down about the shoulders
  lumbar: -20 * DEG,      // loin rounds, pelvis tucks under
  rise: 4,                // chest stays high enough for straight forelegs
  pivot: Object.freeze({ x: 560, y: 300 }), // trunk turns about the shoulders
  frontPawBack: -20,      // forepaws stay a little in front (negative = forward), elbows ≈ 130°
  // tail joints (root … tail5): first down to the floor, then along it
  tailAngles: Object.freeze([21, 35, 41, 17, 7, 6].map(d => d * DEG)),
  pawAhead: 70,           // hind paw (MTP) in front of the hip, hock on the floor
  pawY: 470,              // pad height, as in the stand
  cervical: -.16,         // neck a bit more upright
  cranium: .10,           // nose level again
});

const LIMBS = {
  front: ['scapula', 'shoulder', 'elbow', 'carpus', 'frontPaw', 'frontToe'],
  hind: ['hip', 'stifle', 'hock', 'hindPaw', 'hindToe'],
};
const far = n => 'far' + n[0].toUpperCase() + n.slice(1);

export function sitPose(amount = 1, { farBind: FAR_BIND = DEFAULT_FAR_BIND, params = SIT } = {}) {
  const s = smooth(amount);
  const body = { enabled: true, hipY: 0, shoulderY: 0, spineFlex: 0,
    pivot: params.pivot, tilt: params.tilt * s, lumbar: params.lumbar * s, thoracolumbar: (params.thoracolumbar || 0) * s, tuck: (params.tuck || 0) * s, rise: params.rise * s, tailAngles: params.tailAngles.map(a => a * s) };
  const head = { enabled: true, cervical: params.cervical * s, cranium: params.cranium * s };
  const trunk = trunkPose(body, head, null);
  const joints = posedTrunk(trunk, FAR_BIND);
  let error = 0;
  for (const side of ['', 'far']) {
    const n = k => side ? far(k) : k;
    const B = side ? { frontPaw: P(FAR_BIND.farFrontPaw), hindPaw: P(FAR_BIND.farHindPaw) }
      : { frontPaw: P(JOINTS.frontPaw), hindPaw: P(JOINTS.hindPaw) };
    const fr = solveFront(joints[n('scapula')], { x: B.frontPaw.x - params.frontPawBack * s, y: B.frontPaw.y });
    const hip = joints[n('hip')];
    const paw = { x: lerp(B.hindPaw.x, hip.x + params.pawAhead, s), y: lerp(B.hindPaw.y, params.pawY, s) };
    const hi = solveHind(hip, paw);
    for (const k of LIMBS.front) joints[n(k)] = fr[k];
    for (const k of LIMBS.hind) joints[n(k)] = hi[k];
    error = Math.max(error, fr.error, hi.error);
  }
  // The folded hind leg: Achilles/gaskin and the front of the hock tuck in
  // under the thigh instead of folding the outline over itself.
  const fold = smooth((amount - .2) / .5);
  const h = CONTOUR_REGIONS.hind[0];
  const e = CONTOUR_REGIONS.front[1]; // point of the elbow
  const settle = smooth(amount / .6);
  const f = CONTOUR_REGIONS.front[0]; // front of the upper arm
  const st = joints.sternum;
  const correctives = [
    // the brisket stays in front of the forelegs: the outline runs down the
    // sternum (a skin's width in front of it) before it turns to the forearm
    // throat stays smooth when the neck comes up
    { cmd: CONTOUR_REGIONS.throat[0] + 1, from: CONTOUR_REGIONS.throat[0], to: CONTOUR_REGIONS.throat[0] + 2, t: .55, weight: settle * .8, relax: .5 },
    { cmd: f, point: { x: st.x + 9, y: st.y + 8 }, weight: settle, relax: .35 },
    // elbow tucks against the chest instead of poking out below it
    { cmd: e, from: e - 1, to: e + 1, t: .3, weight: settle },
    // flank fold lies between belly and stifle
    { cmd: h, from: h - 1, to: h + 1, t: .5, weight: settle },
    { cmd: h + 1, weight: fold },
    { cmd: h + 2, from: h + 1, to: h + 4, t: .5, dy: 4, weight: fold },
    // back of the thigh runs from the hock on the floor to the buttock
    { cmd: h + 11, from: h + 10, to: h + 14, t: .25, weight: fold },
    { cmd: h + 12, from: h + 10, to: h + 14, t: .5, weight: fold },
    { cmd: h + 13, from: h + 10, to: h + 14, t: .75, weight: fold },
  ];
  return { mode: 'sit', time: 0, joints, trunk, body, head, tail: { enabled: false }, correctives, floor: ARTBOARD.groundY,
    support: { front: true, hind: true, frontFar: true, hindFar: true }, targetError: error, farBind: FAR_BIND };
}

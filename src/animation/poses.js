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
import { torsoDelta } from './body.js';
import { ARTBOARD } from '../geometry/contour.js';
import { headDelta } from './head.js';

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const P = xy => ({ x: xy[0], y: xy[1] });

export const SIT = Object.freeze({
  label: 'Sitz',
  tilt: -6 * DEG,         // trunk angle, rump down
  lumbar: -52 * DEG,      // loin rounds, pelvis tucks under
  pivot: Object.freeze({ x: 578, y: 300 }),
  rise: 20,               // front lifts a little (chest up)
  tailAngle: 58 * DEG,    // tail rests on the floor behind the dog
  pawAhead: 38,           // hind paw (MTP) in front of the hip
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
    tilt: params.tilt * s, lumbar: params.lumbar * s, pivot: params.pivot, rise: params.rise * s, tailAngle: params.tailAngle * s };
  const head = { enabled: true, cervical: params.cervical * s, cranium: params.cranium * s };
  const joints = Object.fromEntries(Object.entries({ ...JOINTS, ...FAR_BIND }).map(([k, v]) => [k, P(v)]));
  const limb = new Set([...LIMBS.front, ...LIMBS.hind].flatMap(n => [n, far(n)]));
  const roots = new Set(['scapula', 'hip', 'farScapula', 'farHip']);
  for (const [name, p] of Object.entries(joints)) {
    if (limb.has(name) && !roots.has(name)) continue;
    const d = torsoDelta(p.x, p.y, body);
    const h = roots.has(name) ? { x: 0, y: 0 } : headDelta(p.x, p.y, head);
    p.x += d.x + h.x; p.y += d.y + h.y;
  }
  let error = 0;
  for (const side of ['', 'far']) {
    const n = k => side ? far(k) : k;
    const B = side ? { frontPaw: P(FAR_BIND.farFrontPaw), hindPaw: P(FAR_BIND.farHindPaw) }
      : { frontPaw: P(JOINTS.frontPaw), hindPaw: P(JOINTS.hindPaw) };
    const fr = solveFront(joints[n('scapula')], B.frontPaw);
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
  const correctives = [
    { cmd: 29, weight: fold },
    { cmd: 30, from: 29, to: 31, t: .5, dy: 4, weight: fold },
    { cmd: 37, from: 36, to: 39, t: 1 / 3, dy: -2, weight: fold },
    { cmd: 38, from: 36, to: 39, t: 2 / 3, dy: -3, weight: fold },
  ];
  return { mode: 'sit', time: 0, joints, body, head, tail: { enabled: false }, correctives, floor: ARTBOARD.groundY,
    support: { front: true, hind: true, frontFar: true, hindFar: true }, targetError: error, farBind: FAR_BIND };
}

/** Stage G1 – pose generator.
 *
 * A pose is described by a small set of plain parameters (a "spec") instead
 * of hand-placed joints. The generator turns a spec into a full rig pose
 * (same shape as poseAt/sitPose, so contourAt, farContours and svg.mjs work
 * unchanged):
 *
 *   trunk  vorn / hinten  height change of the shoulder pivot (scapula) and the
 *                         hip in px (positive = up). The trunk root and pitch
 *                         are solved so both pivots land exactly there.
 *          vor            shift of the shoulder pivot forwards in px.
 *          lende, ruecken, becken
 *                         flexion of the loin (lumbar), the thoracolumbar spine
 *                         and the pelvis (tuck), in degrees.
 *   head   hals, kopf     neck and skull rotation in degrees (positive = down,
 *                         the dog faces right, y points down); the neck keeps
 *                         its carriage when the trunk pitches. maul = jaw opening.
 *   tail   rute           one of the tail expressions of tail.js (calm, happy,
 *                         fearful …) or six joint angles in degrees.
 *   legs   beine.vorn / hinten (+ vornFern / hintenFern, default = near side)
 *          { pfote: [dx, dy] }       IK: paw target relative to the bind paw
 *          { vorPivot: dx, y }       IK: paw dx in front of its pivot at height y
 *          { winkel: [deg …] }       FK: absolute segment directions
 *                                    (0° = forward, 90° = down), for poses the
 *                                    pantograph does not describe (forearm on
 *                                    the floor in the down and the play bow).
 *          beugen / zehen / heben    carpal flex, toe flex (deg), swing lift (px)
 *
 * `amount` 0…1 blends every number from the neutral stand to the spec, so a
 * preset doubles as a transition (lying down, sitting up …).
 */
import { JOINTS, FAR_BIND as DEFAULT_FAR_BIND } from '../skeleton/stand.js';
import { trunkFK } from '../skeleton/rig.js';
import { FRONT, HIND, LIMB_BIND, solveFront, solveHind } from '../skeleton/limbs.js';
import { posedTrunk } from '../animation/assemble.js';
import { tailAt, tailAngles, EXPRESSIONS } from '../animation/tail.js';
import { ARTBOARD } from '../geometry/contour.js';

const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smooth = x => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const P = xy => ({ x: xy[0], y: xy[1] });
const dir = d => ({ x: Math.cos(d * DEG), y: Math.sin(d * DEG) });
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) / DEG;
/** Shortest-way angle blend in degrees. */
const lerpAngle = (a, b, t) => a + (((b - a + 540) % 360) - 180) * t;

export const TAIL_JOINTS = Object.freeze(['tailRoot', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5']);
const LIMBS = Object.freeze({
  front: ['scapula', 'shoulder', 'elbow', 'carpus', 'frontPaw', 'frontToe'],
  hind: ['hip', 'stifle', 'hock', 'hindPaw', 'hindToe'],
});
const SEG_LENGTHS = Object.freeze({
  front: [FRONT.La, FRONT.Lb, FRONT.Lc, FRONT.meta, FRONT.toe],
  hind: [HIND.La, HIND.Lb, HIND.Lc, HIND.toe],
});
/** Segment directions of the bind (stand) pose, in degrees. */
export const BIND_DIRS = Object.freeze(Object.fromEntries(Object.entries(LIMBS).map(([kind, names]) => {
  const B = LIMB_BIND[kind];
  return [kind, Object.freeze(names.slice(1).map((n, i) => ang(P(B[names[i]]), P(B[n]))))];
})));
const far = n => 'far' + n[0].toUpperCase() + n.slice(1);

/** Tail joint angles (radians) for an expression name or an array in degrees. */
export function tailFor(rute) {
  if (!rute) return TAIL_JOINTS.map(() => 0);
  if (Array.isArray(rute)) return TAIL_JOINTS.map((_, i) => (rute[i] || 0) * DEG);
  if (!EXPRESSIONS[rute]) throw new Error('Unbekannter Rutenausdruck: ' + rute);
  const a = tailAngles(tailAt('stand', 0, { expression: rute }));
  return TAIL_JOINTS.map((_, i) => a[i] || 0);
}

/** Trunk (root offset + pitch) such that the scapula pivot sits at `scap`
 * and the hip pivot at height `hipY`. Three equations, three unknowns,
 * a few Newton steps with a numerical Jacobian. */
function solveTrunk(angles, scap, hipY) {
  let v = [0, 0, 0];
  const f = ([x, y, pitch]) => {
    const { joints: j } = trunkFK({ x, y, pitch, angles });
    return [j.scapula.x - scap.x, j.scapula.y - scap.y, j.hip.y - hipY];
  };
  for (let it = 0; it < 12; it++) {
    const r = f(v);
    if (Math.hypot(...r) < 1e-6) break;
    const J = [0, 1, 2].map(k => { const h = k === 2 ? 1e-5 : 1e-3; const w = [...v]; w[k] += h; return f(w).map((q, i) => (q - r[i]) / h); });
    // columns J[k]; solve J·d = -r (Cramer)
    const M = [[J[0][0], J[1][0], J[2][0]], [J[0][1], J[1][1], J[2][1]], [J[0][2], J[1][2], J[2][2]]];
    const det = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(M);
    const d = [0, 1, 2].map(k => det(M.map((row, i) => row.map((c, j) => j === k ? -r[i] : c))) / D);
    v = v.map((q, k) => q + d[k]);
  }
  return { x: v[0], y: v[1], pitch: v[2] };
}

/** FK leg from its pivot along absolute segment directions (degrees). */
function fkLeg(kind, root, dirs) {
  const names = LIMBS[kind], out = { [names[0]]: root };
  let p = root;
  names.slice(1).forEach((n, i) => { const d = dir(dirs[i]); p = { x: p.x + d.x * SEG_LENGTHS[kind][i], y: p.y + d.y * SEG_LENGTHS[kind][i] }; out[n] = p; });
  return { ...out, error: 0 };
}

function solveLeg(kind, root, spec = {}, bindPaw, s) {
  if (spec.winkel) {
    const dirs = BIND_DIRS[kind].map((b, i) => lerpAngle(b, spec.winkel[i] ?? b, s));
    return fkLeg(kind, root, dirs);
  }
  let target = { ...bindPaw };
  if (spec.pfote) target = { x: bindPaw.x + spec.pfote[0] * s, y: bindPaw.y + spec.pfote[1] * s };
  if (spec.vorPivot !== undefined) target = { x: lerp(bindPaw.x, root.x + spec.vorPivot, s), y: lerp(bindPaw.y, spec.y ?? bindPaw.y, s) };
  const opts = { carpalFlex: (spec.beugen || 0) * DEG * s, toeFlex: (spec.zehen || 0) * DEG * s, lift: (spec.heben || 0) * s };
  return kind === 'front' ? solveFront(root, target, opts) : solveHind(root, target, opts);
}

/** Builds the rig pose for a spec at `amount` (0 = stand, 1 = full pose). */
export function generatePose(spec = {}, amount = 1, { farBind: FAR_BIND = DEFAULT_FAR_BIND } = {}) {
  const s = smooth(amount);
  const t = spec.rumpf || {}, k = spec.kopf || {}, legs = spec.beine || {};
  const angles = {};
  const add = (j, v) => { if (v) angles[j] = (angles[j] || 0) + v; };
  add('lumbar', (t.lende || 0) * DEG * s);
  add('spine', (t.ruecken || 0) * DEG * s);
  add('pelvis', (t.becken || 0) * DEG * s);
  const tail = tailFor(spec.rute), tail0 = tailFor(null);
  TAIL_JOINTS.forEach((j, i) => add(j, lerp(tail0[i], tail[i], s)));
  const scap = { x: JOINTS.scapula[0] + (t.vor || 0) * s, y: JOINTS.scapula[1] - (t.vorn || 0) * s };
  const hipY = JOINTS.hip[1] - (t.hinten || 0) * s;
  // Solve without the neck first (the neck does not move the pivots), then
  // let the neck keep its carriage against the trunk pitch.
  const root = solveTrunk(angles, scap, hipY);
  add('withers', -root.pitch + (k.hals || 0) * DEG * s);
  add('occiput', (k.kopf || 0) * DEG * s);
  const trunk = { ...root, angles, jawOpen: (k.maul || 0) * DEG * s };
  const joints = posedTrunk(trunk, FAR_BIND);
  let error = 0;
  for (const side of ['', 'far']) {
    const n = j => side ? far(j) : j;
    const bind = side ? { front: P(FAR_BIND.farFrontPaw), hind: P(FAR_BIND.farHindPaw) } : { front: P(JOINTS.frontPaw), hind: P(JOINTS.hindPaw) };
    for (const kind of ['front', 'hind']) {
      const key = (kind === 'front' ? 'vorn' : 'hinten') + (side ? 'Fern' : '');
      const legSpec = legs[key] ?? legs[kind === 'front' ? 'vorn' : 'hinten'];
      const solved = solveLeg(kind, joints[n(LIMBS[kind][0])], legSpec, bind[kind], s);
      for (const j of LIMBS[kind]) joints[n(j)] = solved[j];
      error = Math.max(error, solved.error);
    }
  }
  const correctives = typeof spec.korrekturen === 'function' ? spec.korrekturen(joints, amount) : [];
  return {
    mode: 'pose', preset: spec.name, time: 0, joints, trunk, body: { enabled: true }, head: { enabled: true },
    tail: { enabled: false }, correctives, floor: ARTBOARD.groundY, targetError: error, farBind: FAR_BIND,
    support: { front: true, hind: true, frontFar: true, hindFar: true },
    render: { ...(spec.darstellung || {}) },
  };
}

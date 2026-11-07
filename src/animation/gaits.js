/** Gait timing adapted from the v7.5.1 study; limbs use the stage A1
 * pantograph skeleton (scapula pivot, three-segment legs, flexing paws).
 * Gait amplitudes are recalibrated in stage A3. Not yet weighted skinning.
 */
import { JOINTS, FAR_BIND as DEFAULT_FAR_BIND } from '../skeleton/stand.js';
import { solveFront, solveHind } from '../skeleton/limbs.js';
import { torsoAt, trunkPose } from './body.js';
import { headAt } from './head.js';
import { tailAt } from './tail.js';
import { posedTrunk } from './assemble.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smooth = x => { const t = clamp(x, 0, 1); return t*t*(3 - 2*t); };

/** Contact-phase offsets follow v7.5.1 exactly. The reduced run stride
 * (100 instead of 240) preserves reachability in this smaller, unapproved rig.
 * Prior `front` and `hind` aliases are retained for existing callers/tests.
 */
export const GAITS = Object.freeze({
  stand: { label:'Stand',carpalFlex:0,period:1,stride:0,stance:1,lift:0,hind:0,front:0,
    offsets:{hindNear:0,frontNear:0,hindFar:0,frontFar:0},order:'Vierpunktstand' },
  walk: { label:'Gehen',carpalFlex:100,period:1.30,stride:58,stance:.72,lift:20,hind:0,front:.75,
    offsets:{hindNear:0,frontNear:.75,hindFar:.50,frontFar:.25},order:'HL → VL → HR → VR' },
  trot: { label:'Trab',carpalFlex:110,period:.80,stride:74,stance:.52,lift:25,hind:0,front:.50,
    offsets:{hindNear:0,frontNear:.50,hindFar:.50,frontFar:0},order:'HL + VR → HR + VL' },
  run: { label:'Laufen',carpalFlex:120,period:.76,stride:100,stance:.43,lift:15,hind:0,front:.515,
    offsets:{hindNear:0,frontNear:.515,hindFar:.035,frontFar:.55},order:'Hinterhand → Vorderhand' },
  pace: { label:'Passgang',carpalFlex:100,period:1.00,stride:62,stance:.57,lift:21,hind:0,front:0,
    offsets:{hindNear:0,frontNear:0,hindFar:.50,frontFar:.50},order:'HL + VL → HR + VR' },
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
  if (!gait.stride) return { x: 0, y: 0, support: true, u: 0 };
  const phase = ((time/gait.period + offset) % 1 + 1) % 1;
  const reach = gait.stance*gait.stride / 2;
  if (phase < gait.stance) {
    return { x: reach - phase*gait.stride, y: 0, support: true, u: 0 };
  }
  const u = (phase - gait.stance) / (1 - gait.stance);
  return { x: -reach + 2*reach*smooth(u), y: -gait.lift*Math.sin(Math.PI*u), support: false, u };
}

const DEG = Math.PI/180;
/** Swing-phase flexion profile: carpus folds early in swing and opens before touchdown. */
export function swingFlex(u) {
  if (!(u > 0 && u < 1)) return 0;
  return Math.sin(Math.PI*Math.pow(u, .75));
}

const LIMB_NAMES = {
  front: ['scapula','shoulder','elbow','carpus','frontPaw','frontToe'],
  hind: ['hip','stifle','hock','hindPaw','hindToe'],
};
const far = name => 'far'+name[0].toUpperCase()+name.slice(1);
const P = xy => ({x:xy[0],y:xy[1]});

function placeLimbs(joints, gait, paths, FAR_BIND) {
  // Stance centre: by default the bind paw; with `gait.center` the paw sweeps
  // around a point at that horizontal offset from its own pivot (scapula/hip).
  const flexFront = path => ({ carpalFlex: (gait.carpalFlex||0)*DEG*swingFlex(path.u), toeFlex: 10*DEG*swingFlex(path.u), lift: -path.y });
  const ground = path => ({ ...path, y: 0 });
  // Hind swing: smaller lift and toe curl keep stifle/hock flexion in the
  // measured range (stifle ≥ ~90° included angle in trot swing).
  const flexHind = path => ({ toeFlex: 10*DEG*swingFlex(path.u) });
  const hindPath = path => ({ ...path, y: path.y*.7 });
  const target = (paw, pivot, offset, path) => ({
    x: (gait.center ? pivot[0] + offset : paw[0]) + path.x, y: paw[1] + path.y });
  const c = gait.center || { front: 0, hind: 0 };
  const legs = [
    [false, 'front', solveFront(joints.scapula, target(JOINTS.frontPaw, JOINTS.scapula, c.front, ground(paths.frontNear)), flexFront(paths.frontNear))],
    [false, 'hind', solveHind(joints.hip, target(JOINTS.hindPaw, JOINTS.hip, c.hind, hindPath(paths.hindNear)), flexHind(paths.hindNear))],
    [true, 'front', solveFront(joints.farScapula, target(FAR_BIND.farFrontPaw, FAR_BIND.farScapula, c.front, ground(paths.frontFar)), flexFront(paths.frontFar))],
    [true, 'hind', solveHind(joints.farHip, target(FAR_BIND.farHindPaw, FAR_BIND.farHip, c.hind, hindPath(paths.hindFar)), flexHind(paths.hindFar))],
  ];
  let error = 0;
  for (const [isFar, kind, solved] of legs) {
    for (const name of LIMB_NAMES[kind]) joints[isFar ? far(name) : name] = solved[name];
    error = Math.max(error, solved.error);
  }
  return error;
}

/** Four driven limbs on the A1 pantograph skeleton, hanging from the
 * whole-body rig: the trunk (spine, neck, head, pelvis, tail) is posed by
 * forward kinematics, the scapula and hip pivots ride on it.
 */
export function poseAt(mode = 'stand', time = 0, { bodyMotion = true, headMotion = true, tailMotion = true, tailExpression = 'auto', gait: override = null, farBind: FAR_BIND = DEFAULT_FAR_BIND } = {}) {
  if (!GAITS[mode]) throw new Error(`Unknown gait: ${mode}`);
  // `gait` overrides single gait values (tuning, tests).
  const gait = override ? { ...GAITS[mode], ...override } : GAITS[mode];
  const body = torsoAt(mode,time,gait.period,bodyMotion);
  const head = headAt(mode,time,gait.period,body,headMotion);
  const tail = tailAt(mode,time,{enabled:tailMotion,expression:tailExpression});
  const trunk = trunkPose(body, head, tail);
  const joints = posedTrunk(trunk, FAR_BIND);
  const paths=Object.fromEntries(Object.entries(gait.offsets).map(([key,offset])=>[key,pawPath(time,gait,offset)]));
  const targetError = placeLimbs(joints, gait, paths, FAR_BIND);
  const support = {front:paths.frontNear.support,hind:paths.hindNear.support,
    frontFar:paths.frontFar.support,hindFar:paths.hindFar.support};
  return {mode,time,joints,trunk,body,head,tail,support,targetError,farBind:FAR_BIND};
}

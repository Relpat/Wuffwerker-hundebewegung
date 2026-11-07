/** Gaits on the A1 pantograph skeleton (scapula pivot, three-segment legs,
 * flexing paws); timing and strides after Maes et al. 2008 (stage A3).
 */
import { JOINTS, FAR_BIND as DEFAULT_FAR_BIND } from '../skeleton/stand.js';
import { solveFront, solveHind } from '../skeleton/limbs.js';
import { torsoAt, torsoDelta } from './body.js';
import { headAt, headDelta } from './head.js';
import { tailAt, tailDelta } from './tail.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smooth = x => { const t = clamp(x, 0, 1); return t*t*(3 - 2*t); };

/** Stage A3 – gaits after Maes et al. (2008, J Exp Biol 211, 5 Malinois,
 * 486 sequences): lateral walk, trot, pace, transverse and rotary gallop.
 *
 * `touchdown` = moment each paw lands, as a fraction of the stride (near hind = 0).
 * Internally `offsets` = 1 − touchdown, because pawPath uses (t/T + offset).
 * Walk: ipsilateral fore lands 25 % after the hind (lateral sequence).
 * Transverse gallop: hind pair 20 %, fore pair 29 % apart, same lead side.
 * Rotary gallop: fore pair ~20 %, the hind pair changes order (circular
 * sequence near hind → far hind → far fore → near fore).
 * Duty factors: walk > 0.6, trot ~0.45, gallops 0.25–0.33 (flight phases).
 * Strides are the largest the A1 skeleton reaches with elbow ≤ 162° and
 * stifle ≤ 164.5° (see tests/limbs.test.js); gallops gain reach from the
 * flexing and extending spine (`TORSO_PARAMS.gallop/rotary` in body.js).
 * `center` = stance centre as horizontal offset from each pivot (scapula/hip).
 */
const fromTouchdown = t => Object.freeze(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, +((1 - v) % 1).toFixed(3)])));
export const GAITS = Object.freeze({
  stand: { label:'Stand',carpalFlex:0,period:1,stride:0,stance:1,lift:0,hind:0,front:0,
    offsets:{hindNear:0,frontNear:0,hindFar:0,frontFar:0},order:'Vierpunktstand' },
  walk: { label:'Gehen',carpalFlex:100,period:1.0,stride:190,stance:.66,lift:22,center:{front:-15,hind:-5},
    touchdown:{hindNear:0,frontNear:.25,hindFar:.5,frontFar:.75},order:'HL → VL → HR → VR (lateral)' },
  trot: { label:'Trab',carpalFlex:110,period:.62,stride:250,stance:.45,lift:30,center:{front:-20,hind:5},
    touchdown:{hindNear:0,frontFar:0,hindFar:.5,frontNear:.5},order:'HL + VR → HR + VL' },
  pace: { label:'Passgang',carpalFlex:100,period:.75,stride:220,stance:.55,lift:26,center:{front:-25,hind:0},
    touchdown:{hindNear:0,frontNear:0,hindFar:.5,frontFar:.5},order:'HL + VL → HR + VR' },
  gallop: { label:'Galopp (transvers)',carpalFlex:120,period:.50,stride:400,stance:.33,lift:34,center:{front:-20,hind:20},
    touchdown:{hindNear:0,hindFar:.20,frontNear:.52,frontFar:.81},order:'HL → HR → VL → VR' },
  rotary: { label:'Renngalopp (rotatorisch)',carpalFlex:125,period:.42,stride:560,stance:.27,lift:36,center:{front:-30,hind:30},
    touchdown:{hindNear:0,hindFar:.16,frontFar:.50,frontNear:.70},order:'HL → HR → VR → VL' },
});
for (const g of Object.values(GAITS)) {
  if (g.touchdown) g.offsets = fromTouchdown(g.touchdown);
  g.hind = g.offsets.hindNear; g.front = g.offsets.frontNear;
  Object.freeze(g);
}

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

/** Four driven limbs on the A1 pantograph skeleton. Paw (MCP/MTP) points are the
 * IK targets; the scapula and hip pivots follow the torso deformation field.
 */
export function poseAt(mode = 'stand', time = 0, { bodyMotion = true, headMotion = true, tailMotion = true, tailExpression = 'auto', gait: override = null, torso = null, farBind: FAR_BIND = DEFAULT_FAR_BIND } = {}) {
  if (!GAITS[mode]) throw new Error(`Unknown gait: ${mode}`);
  // `gait` / `torso` override single gait or trunk values (for tuning and tests).
  const gait = override ? { ...GAITS[mode], ...override } : GAITS[mode];
  const joints = Object.fromEntries(Object.entries({...JOINTS,...FAR_BIND}).map(([key,xy]) => [key,P(xy)]));
  const body = torsoAt(mode,time,gait.period,bodyMotion,torso);
  const head = headAt(mode,time,gait.period,body,headMotion);
  const tail = tailAt(mode,time,{enabled:tailMotion,expression:tailExpression});
  const limbJoints = new Set([...LIMB_NAMES.front, ...LIMB_NAMES.hind].flatMap(n => [n, far(n)]));
  const roots = new Set(['scapula','hip','farScapula','farHip']);
  for(const [name,p] of Object.entries(joints)) {
    if(limbJoints.has(name) && !roots.has(name)) continue;
    const d=torsoDelta(p.x,p.y,body);
    // Limb pivots follow only the trunk; neck rotation must not drag the scapula.
    const h=roots.has(name)?{x:0,y:0}:headDelta(p.x,p.y,head);
    const t=(name==='tailTip'||name==='tailRoot')?tailDelta(p.x,tail):{x:0,y:0};
    p.x+=d.x+h.x+t.x;p.y+=d.y+h.y+t.y;
  }
  const paths=Object.fromEntries(Object.entries(gait.offsets).map(([key,offset])=>[key,pawPath(time,gait,offset)]));
  const targetError = placeLimbs(joints, gait, paths, FAR_BIND);
  const support = {front:paths.frontNear.support,hind:paths.hindNear.support,
    frontFar:paths.frontFar.support,hindFar:paths.hindFar.support};
  return {mode,time,joints,body,head,tail,support,targetError,farBind:FAR_BIND};
}

/** Gait timing and four-leg timing and two-bone IK adapted from the approved v7.5.1 study.
 * Four phase tracks now drive two near and two occluded far legs.
 * It is not yet production weighted skinning.
 */
import { JOINTS, FAR_BIND } from '../skeleton/stand.js';
import { torsoAt, torsoDelta } from './body.js';
import { headAt, headDelta } from './head.js';
import { tailAt, tailDelta } from './tail.js';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smooth = x => { const t = clamp(x, 0, 1); return t*t*(3 - 2*t); };

/** Contact-phase offsets follow v7.5.1 exactly. The reduced run stride
 * (100 instead of 240) preserves reachability in this smaller, unapproved rig.
 * Prior `front` and `hind` aliases are retained for existing callers/tests.
 */
export const GAITS = Object.freeze({
  stand: { label:'Stand',period:1,stride:0,stance:1,lift:0,hind:0,front:0,
    offsets:{hindNear:0,frontNear:0,hindFar:0,frontFar:0},order:'Vierpunktstand' },
  walk: { label:'Gehen',period:1.30,stride:58,stance:.72,lift:20,hind:0,front:.75,
    offsets:{hindNear:0,frontNear:.75,hindFar:.50,frontFar:.25},order:'HL → VL → HR → VR' },
  trot: { label:'Trab',period:.80,stride:74,stance:.52,lift:25,hind:0,front:.50,
    offsets:{hindNear:0,frontNear:.50,hindFar:.50,frontFar:0},order:'HL + VR → HR + VL' },
  run: { label:'Laufen',period:.76,stride:100,stance:.43,lift:15,hind:0,front:.515,
    offsets:{hindNear:0,frontNear:.515,hindFar:.035,frontFar:.55},order:'Hinterhand → Vorderhand' },
  pace: { label:'Passgang',period:1.00,stride:62,stance:.57,lift:21,hind:0,front:0,
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
  if (!gait.stride) return { x: 0, y: 0, support: true };
  const phase = ((time/gait.period + offset) % 1 + 1) % 1;
  const reach = gait.stance*gait.stride / 2;
  if (phase < gait.stance) {
    return { x: reach - phase*gait.stride, y: 0, support: true };
  }
  const u = (phase - gait.stance) / (1 - gait.stance);
  return { x: -reach + 2*reach*smooth(u), y: -gait.lift*Math.sin(Math.PI*u), support: false };
}

/** Four driven limbs. Front paws are IK targets; rear hocks are IK targets
 * with a constant metatarsal offset to the paw, exactly as in the near-leg
 * prototype. Support flags reflect each independently phased foot trajectory.
 */
export function poseAt(mode = 'stand', time = 0, { bodyMotion = true, headMotion = true, tailMotion = true, tailExpression = 'auto' } = {}) {
  const gait = GAITS[mode];
  if (!gait) throw new Error(`Unknown gait: ${mode}`);
  const joints = Object.fromEntries(Object.entries({...JOINTS,...FAR_BIND}).map(([key,xy]) => [key,{x:xy[0],y:xy[1]}]));
  const body = torsoAt(mode,time,gait.period,bodyMotion);
  const head = headAt(mode,time,gait.period,body,headMotion);
  const tail = tailAt(mode,time,{enabled:tailMotion,expression:tailExpression});
  const support = {front:true,hind:true,frontFar:true,hindFar:true};
  if(mode==='stand') {
    if(tail.enabled) for(const key of ['tailTip','tailRoot']) {
      const p=joints[key],d=tailDelta(p.x,tail);p.x+=d.x;p.y+=d.y;
    }
    // The near neutral bind pose is preserved byte-for-byte. Far limbs get
    // solved from their static targets, so all four bone lengths are exact.
    const frontFar=solveLeg(joints.farShoulder,joints.farFrontPaw,80,94,+1);
    const hindFar=solveLeg(joints.farHip,joints.farHock,77,70,-1);
    joints.farElbow=frontFar.knee;
    joints.farFrontPaw=frontFar.foot;
    joints.farCarpus={x:frontFar.knee.x+(frontFar.foot.x-frontFar.knee.x)*.79,
                     y:frontFar.knee.y+(frontFar.foot.y-frontFar.knee.y)*.79};
    joints.farStifle=hindFar.knee;
    joints.farHock=hindFar.foot;
    joints.farHindPaw={x:hindFar.foot.x+17,y:hindFar.foot.y+48};
    return {mode,time,joints,body,head,tail,support,targetError:0};
  }

  const limbEnds = new Set(['elbow','carpus','frontPaw','stifle','hock','hindPaw',
    'farElbow','farCarpus','farFrontPaw','farStifle','farHock','farHindPaw']);
  for(const [name,p] of Object.entries(joints)) {
    if(limbEnds.has(name))continue;
    const d=torsoDelta(p.x,p.y,body), h=headDelta(p.x,p.y,head);
    const t=(name==='tailTip'||name==='tailRoot')?tailDelta(p.x,tail):{x:0,y:0};
    p.x+=d.x+h.x+t.x;p.y+=d.y+h.y+t.y;
  }

  const footPaths=Object.fromEntries(Object.entries(gait.offsets).map(([key,offset])=>[
    key,pawPath(time,gait,offset)
  ]));
  const target=(name,path)=>({x:name[0]+path.x,y:name[1]+path.y});
  const front=solveLeg(joints.shoulder,target(JOINTS.frontPaw,footPaths.frontNear),80,94,+1);
  const hind=solveLeg(joints.hip,target(JOINTS.hock,footPaths.hindNear),77,70,-1);
  const frontFar=solveLeg(joints.farShoulder,target(FAR_BIND.farFrontPaw,footPaths.frontFar),80,94,+1);
  const hindFar=solveLeg(joints.farHip,target(FAR_BIND.farHock,footPaths.hindFar),77,70,-1);
  for(const [isFar,frontLeg,hindLeg] of [[false,front,hind],[true,frontFar,hindFar]]) {
    const prefix=isFar?'far':'';
    const elbow=prefix? 'farElbow':'elbow',carpus=prefix?'farCarpus':'carpus';
    const frontPaw=prefix?'farFrontPaw':'frontPaw';
    const stifle=prefix?'farStifle':'stifle',hock=prefix?'farHock':'hock';
    const hindPaw=prefix?'farHindPaw':'hindPaw';
    joints[elbow]=frontLeg.knee;joints[frontPaw]=frontLeg.foot;
    joints[carpus]={x:frontLeg.knee.x+(frontLeg.foot.x-frontLeg.knee.x)*.79,
                    y:frontLeg.knee.y+(frontLeg.foot.y-frontLeg.knee.y)*.79};
    joints[stifle]=hindLeg.knee;joints[hock]=hindLeg.foot;
    joints[hindPaw]={x:hindLeg.foot.x+17,y:hindLeg.foot.y+48};
  }
  support.front=footPaths.frontNear.support;support.hind=footPaths.hindNear.support;
  support.frontFar=footPaths.frontFar.support;support.hindFar=footPaths.hindFar.support;
  return {mode,time,joints,body,head,tail,support,
    targetError:Math.max(front.error,hind.error,frontFar.error,hindFar.error)};
}

/** Geometric occlusion of the far-side legs, drawn *behind* the existing
 * one-piece torso/neck/head/tail/near-leg silhouette. Separate limb contours
 * are required to represent four distinct legs in a two-dimensional view;
 * no patches cover a seam in the torso. No production weighted mesh yet.
 * Silhouette widths and paw footprints match the existing NEAR side at natural
 * scale; apparent depth comes from draw order and a muted color, NOT shrinking.
 */
import { FRONT, HIND } from '../skeleton/limbs.js';
import { FAR_BIND } from '../skeleton/stand.js';
const bindAngle=(B,from,to)=>Math.atan2(B[to][1]-B[from][1],B[to][0]-B[from][0]);
// Heel/carpal pad follow the metapodium, measured against the far bind pose.
const add=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const normal=(a,b,w)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
  return {x:-dy*w/l,y:dx*w/l};};
const xy=p=>[p.x,p.y];
/** Joint normal: bisector of both segment normals, so outlines do not
 * overshoot (and self-intersect) on strongly bent joints. */
const blend=(n1,n2,w)=>{const x=n1.x+n2.x,y=n1.y+n2.y,l=Math.hypot(x,y)||1;return {x:x*w/l,y:y*w/l};};
const off=(p,n,sign=1)=>[p.x+n.x*sign,p.y+n.y*sign];

/** Outline has one M and one Z; ends are capped with a rounded toe.
 * Upper section is intentionally hidden by the main body when composited.
 */
/** Sole points rotate with the toe bone (flat in stance, curled in swing). */
const sole=(paw,toeJoint,bindAngle,dx,dy)=>{
  const t=Math.atan2(toeJoint.y-paw.y,toeJoint.x-paw.x)-bindAngle,c=Math.cos(t),s=Math.sin(t);
  // A folded paw (swing) is drawn more compact, so it does not read as a hook.
  const k=1-.5*Math.min(1,Math.abs(Math.atan2(s,c))/(Math.PI/2));
  return {x:paw.x+k*(dx*c-dy*s),y:paw.y+k*(dx*s+dy*c)};
};
function frontOutline(root,elbow,carpus,paw,toeJoint,FRONT_HEEL) {
  // Full-size foreleg: near-side lower limb ~38px across, paw ~67px wide.
  const a=normal(root,elbow,23),b=normal(elbow,carpus,19),c=normal(carpus,paw,16);
  const toe=sole(paw,toeJoint,FRONT.toeAngle,30,15);
  const back=sole(paw,carpus,FRONT_HEEL,-38,15);
  return [
    ['M',...off(root,a,-1)],
    ['C',...off(add(root,elbow,.45),a,-1),...off(elbow,b,-1),...off(elbow,b,-1)],
    ['C',...off(add(elbow,carpus,.55),b,-1),...off(carpus,c,-1),...off(paw,c,-1)],
    ['C',...xy(sole(paw,toeJoint,FRONT.toeAngle,4,3)),toe.x,toe.y,toe.x,toe.y],
    ['L',back.x,back.y],
    ['C',...xy(sole(paw,carpus,FRONT_HEEL,-41,11)),...off(paw,c,1),...off(paw,c,1)],
    ['C',...off(carpus,c,1),...off(add(elbow,carpus,.6),b,1),...off(elbow,b,1)],
    ['C',...off(elbow,b,1),...off(add(root,elbow,.45),a,1),...off(root,a,1)],
    ['Z'],
  ];
}
function hindOutline(hip,stifle,hock,paw,toeJoint,HIND_HEEL) {
  // Full-size hind leg: near-side paw about 73px wide in neutral stance.
  const a=normal(hip,stifle,29),b=normal(stifle,hock,18),c=normal(hock,paw,15);
  const k=blend(a,b,20);
  const toe=sole(paw,toeJoint,HIND.toeAngle,42,13);
  const heel=sole(paw,hock,HIND_HEEL,-31,13);
  return [
    ['M',...off(hip,a,-1)],
    ['C',...off(add(hip,stifle,.55),a,-1),...off(stifle,k,-1),...off(stifle,k,-1)],
    ['C',...off(add(stifle,hock,.5),b,-1),...off(hock,c,-1),...off(hock,c,-1)],
    ['C',...off(add(hock,paw,.55),c,-1),...off(paw,c,-1),toe.x,toe.y],
    ['L',heel.x,heel.y],
    ['C',...xy(sole(paw,hock,HIND_HEEL,-33,9)),...off(paw,c,1),...off(paw,c,1)],
    ['C',...off(hock,c,1),...off(add(stifle,hock,.5),b,1),...off(stifle,k,1)],
    ['C',...off(stifle,k,1),...off(add(hip,stifle,.55),a,1),...off(hip,a,1)],
    ['Z'],
  ];
}
export function farContours(pose) {
  const j=pose.joints, B=pose.farBind||FAR_BIND;
  return {
    hind:hindOutline(j.farHip,j.farStifle,j.farHock,j.farHindPaw,j.farHindToe,bindAngle(B,'farHindPaw','farHock')),
    front:frontOutline(j.farShoulder,j.farElbow,j.farCarpus,j.farFrontPaw,j.farFrontToe,bindAngle(B,'farFrontPaw','farCarpus')),
  };
}

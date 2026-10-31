import { CONTOUR } from './contour.js';
import { JOINTS } from '../skeleton/stand.js';
import { torsoDelta } from '../animation/body.js';

const lerp = (a,b,t) => a+(b-a)*t;
const delta = (p, base) => ({x:p.x-base[0], y:p.y-base[1]});
const clamp01 = t => Math.max(0,Math.min(1,t));
/** The same torso field is applied to every control point, so there is no seam.
 * Limb transition weights connect moving attachment roots to ground-driven IK
 * joints. This is NOT a triangulated skinning mesh or inverse-bind system.
 */
export function contourAt(pose) {
  if (pose.mode === 'stand') return CONTOUR;
  const j = pose.joints;
  const body = pose.body;
  const front = [
    [333, null],  // moving shoulder/forechest field at the limb attachment
    [390, delta(j.elbow, JOINTS.elbow)],
    [459, delta(j.frontPaw, JOINTS.frontPaw)],
    [490, delta(j.frontPaw, JOINTS.frontPaw)],
  ];
  const hind = [
    [328, null],  // pelvis / haunch attachment
    [369, delta(j.stifle, JOINTS.stifle)],
    [428, delta(j.hock, JOINTS.hock)],
    [465, delta(j.hindPaw, JOINTS.hindPaw)],
    [490, delta(j.hindPaw, JOINTS.hindPaw)],
  ];
  function deform(x,y,anchors) {
    const base = torsoDelta(x,y,body);
    if (!anchors || y <= anchors[0][0]) return [x+base.x,y+base.y];
    let previous=base;
    for(let i=1;i<anchors.length;i++) {
      const next=anchors[i][1];
      if (y <= anchors[i][0]) {
        const t=clamp01((y-anchors[i-1][0])/(anchors[i][0]-anchors[i-1][0]));
        // Only the first interval uses torso motion at the attachment.
        const from=i===1 ? base : previous;
        return [x+lerp(from.x,next.x,t),y+lerp(from.y,next.y,t)];
      }
      previous=next;
    }
    return [x+previous.x,y+previous.y];
  }
  return CONTOUR.map(([op,...p],i)=>{
    const anchors=i>=15&&i<=21?front:i>=24&&i<=34?hind:null;
    if (op==='Z') return [op];
    const coords=[];
    for(let k=0;k<p.length;k+=2) coords.push(...deform(p[k],p[k+1],anchors));
    return [op,...coords];
  });
}

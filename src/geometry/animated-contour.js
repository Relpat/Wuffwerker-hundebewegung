import { CONTOUR } from './contour.js';
import { JOINTS } from '../skeleton/stand.js';

const lerp = (a,b,t) => a+(b-a)*t;
const delta = (p, base) => ({x:p.x-base[0], y:p.y-base[1]});
/** Deforms the outer outline continuously; no second mesh or overpainting is added.
 * An interim pose-space interpolation, NOT weighted mesh skinning. The silhouette
 * stays a single closed path. We freeze shoulders and hips at the torso boundary.
 */
export function contourAt(pose) {
  if (pose.mode === 'stand') return CONTOUR;
  const j = pose.joints;
  const front = [
    [333, {x:0,y:0}],
    [390, delta(j.elbow, JOINTS.elbow)],
    [459, delta(j.frontPaw, JOINTS.frontPaw)],
    [490, delta(j.frontPaw, JOINTS.frontPaw)],
  ];
  const hind = [
    [328, {x:0,y:0}],
    [369, delta(j.stifle, JOINTS.stifle)],
    [428, delta(j.hock, JOINTS.hock)],
    [465, delta(j.hindPaw, JOINTS.hindPaw)],
    [490, delta(j.hindPaw, JOINTS.hindPaw)],
  ];
  function deform(x,y,anchors) {
    let current=anchors[0][1];
    for(let i=1;i<anchors.length;i++) {
      if (y <= anchors[i][0]) {
        const t = Math.max(0, Math.min(1,(y-anchors[i-1][0])/(anchors[i][0]-anchors[i-1][0])));
        const next = anchors[i][1];
        return [x + lerp(current.x,next.x,t), y + lerp(current.y,next.y,t)];
      }
      current = anchors[i][1];
    }
    return [x+current.x,y+current.y];
  }
  return CONTOUR.map(([op,...p],i)=>{
    // Stand contour command positions, preserved in exact order.
    // 15–21: outside/inside of visible foreleg. 24–34: visible hindleg.
    const anchors=i>=15&&i<=21?front:i>=24&&i<=34?hind:null;
    if (!anchors || op === 'Z') return [op,...p];
    const shifted = [];
    for(let k=0;k<p.length;k+=2) shifted.push(...deform(p[k],p[k+1],anchors));
    return [op,...shifted];
  });
}

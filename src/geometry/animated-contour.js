import { CONTOUR } from './contour.js';
import { skinner } from './skin.js';
import { torsoDelta } from '../animation/body.js';
import { headDelta } from '../animation/head.js';
import { tailDelta } from '../animation/tail.js';

/** Trunk, neck/head and tail use the shared pose-space fields (no seam);
 * the leg regions use weighted skinning on the A1 bones (see skin.js).
 */
export function contourAt(pose) {
  if (pose.mode === 'stand' && !pose.tail?.enabled) return CONTOUR;
  const skin = skinner(pose.joints);
  return CONTOUR.map(([op,...p],i)=>{
    // Commands 0–1 and 36–38 run along the tail; no separate tail mesh.
    const isTail=i<=1||(i>=36&&i<=38);
    if (op==='Z') return [op];
    const coords=[];
    for(let k=0;k<p.length;k+=2) {
      const x=p[k],y=p[k+1];
      const b=torsoDelta(x,y,pose.body);
      const h=headDelta(x,y,pose.head);
      const t=isTail?tailDelta(x,pose.tail):{x:0,y:0};
      const trunk={x:x+b.x+h.x+t.x,y:y+b.y+h.y+t.y};
      const skinned=skin(i,k,{x,y},trunk);
      const q=skinned||trunk;
      coords.push(q.x,q.y);
    }
    return [op,...coords];
  });
}

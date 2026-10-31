/** Conservative neck and cranium compensation, not a final anatomical head rig.
 * A continuous pose-space field fixes the shoulder attachment and gains rotation
 * smoothly through the cervical region and skull (no separate pasted shape).
 */
const clamp01 = v => Math.max(0, Math.min(1, v));
const smoothstep = v => { const u=clamp01(v); return u*u*(3-2*u); };

export function headAt(mode, time, period, body, enabled=true) {
  if (!enabled || mode==='stand') return {enabled:false, cervical:0, cranium:0};
  const phase=2*Math.PI*time/period;
  const slope=Math.atan2(body?.shoulderY-body?.hipY || 0, 287);
  const amount=mode==='run'?1.2:mode==='trot'?1:mode==='walk'?.7:.78;
  return {
    enabled:true,
    cervical:-.65*slope+amount*.032*Math.sin(phase+.8),
    cranium:-.6*slope+amount*.017*Math.sin(phase+1.45),
  };
}

function rotateDelta(x,y,px,py,angle) {
  const dx=x-px,dy=y-py,c=Math.cos(angle),s=Math.sin(angle);
  return {x:dx*(c-1)-dy*s,y:dx*s+dy*(c-1)};
}

export function headDelta(x,y,head) {
  if (!head?.enabled) return {x:0,y:0};
  // Zero at withers x<=562; full neck at occiput. Head rotates additionally
  // around the skull pivot with a fade-in at the cranio-cervical junction.
  const nw=smoothstep((x-562)/130);
  const cw=smoothstep((x-675)/53);
  const vertical=smoothstep((305-y)/65); // Exclude the foreleg/shoulder below the throat.
  const neck=rotateDelta(x,y,562,257,head.cervical*nw*vertical);
  const skull=rotateDelta(x,y,705,177,head.cranium*cw*vertical);
  return {x:neck.x+skull.x,y:neck.y+skull.y};
}

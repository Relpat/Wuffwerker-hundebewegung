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


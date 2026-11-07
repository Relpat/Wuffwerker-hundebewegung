/** Lightweight torso motion tied to the leg gait clock.
 * Based on the v7.5.1 torso model's two-cycle bob and localized spine flexion,
 * with deliberately conservative amplitudes for the new one-contour profile.
 * This is a pose-space field, NOT a weighted skinning rig or anatomical proof.
 */

export const TORSO_PARAMS = Object.freeze({
  stand: Object.freeze({ bob: 0, pitch: 0, flex: 0 }),
  walk: Object.freeze({ bob: 3.0, pitch: 1.8, flex: 1.7 }),
  trot: Object.freeze({ bob: 4.5, pitch: 1.5, flex: 3.4 }),
  // Gallops: spine flexes while the hind paws reach forward under the body
  // and extends when they push off (Maes 2008; Fischer & Lilje). `lumbar` in
  // degrees (negative = flexed), `shift` = forward travel of the hindquarters
  // at full flexion, `flexAt` = stride fraction of maximal flexion, `flightAt`
  // = highest point of the trunk (flight phase).
  gallop: Object.freeze({ bob: 6, pitch: 4, flex: 4, lumbar: 8, shift: 20, flexAt: .15, flightAt: .43 }),
  rotary: Object.freeze({ bob: 8, pitch: 5, flex: 5, lumbar: 8, shift: 35, flexAt: .05, flightAt: .45 }),
  pace: Object.freeze({ bob: 3.4, pitch: 2.0, flex: 2.3 }),
});

const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp01(value); return t*t*(3 - 2*t); };

/** Body root movement in the same local coordinate system as the contour. */
export function torsoAt(mode = 'stand', time = 0, period = 1, enabled = true, override = null) {
  if (!TORSO_PARAMS[mode]) throw new Error(`Unknown gait: ${mode}`);
  if (!Number.isFinite(time)) throw new Error('Non-finite gait time');
  const params = override ? { ...TORSO_PARAMS[mode], ...override } : TORSO_PARAMS[mode];
  if (!enabled || mode === 'stand') {
    return { hipY: 0, shoulderY: 0, spineFlex: 0, enabled: false };
  }
  const phase = 2*Math.PI*(time / period);
  if (params.lumbar) {
    // One main flight per stride: trunk highest in flight, lowest in support.
    const flex = Math.cos(phase - 2*Math.PI*params.flexAt); // 1 = fully flexed
    const up = Math.cos(phase - 2*Math.PI*params.flightAt);
    const pitch = params.pitch * Math.sin(phase - 2*Math.PI*params.flexAt);
    return {
      hipY: -params.bob*up + pitch,
      shoulderY: -params.bob*up - pitch,
      spineFlex: params.flex*flex,                 // back arches when flexed
      lumbar: -params.lumbar*flex*Math.PI/180,
      shift: params.shift*flex,
      enabled: true,
    };
  }
  // Double-frequency torso bob, plus opposite hip/shoulder roll in profile.
  const bob = params.bob * Math.sin(2*phase);
  const pitch = params.pitch * Math.sin(phase + .45);
  return {
    hipY: bob + pitch,
    shoulderY: bob - pitch,
    spineFlex: params.flex * Math.sin(phase + .25),
    enabled: true,
  };
}

/** Smooth deformation field shared by the body silhouette and torso landmarks.
 * The head and tail inherit their anchors' movement without independent motion.
 */
export function torsoDelta(x, y, body) {
  if (!body?.enabled) return { x: 0, y: 0 };
  if (body.tilt || body.tailAngle) return tiltDelta(x, y, body);
  const longitudinal = smooth((x - 275) / (562 - 275));
  const rootY = body.hipY*(1-longitudinal) + body.shoulderY*longitudinal;
  const spineEnvelope = Math.exp(-.5*((x - 439)/105)**2);
  const dorsalWeight = smooth((390-y)/180);
  const dy = rootY - body.spineFlex*spineEnvelope*dorsalWeight;
  if (!body.lumbar && !body.shift) return { x: 0, y: dy };
  // Gallop: the pelvis turns about the lumbosacral joint, so the hips swing
  // forwards (flexion) and back (extension) rather than up and down.
  const p = tiltPoint(x, y + dy, { pivot: GALLOP_PIVOT, tilt: 0, lumbar: body.lumbar, shift: body.shift, lumbarPivot: LUMBOSACRAL });
  return { x: p.x - x, y: p.y - y };
}

function rotateAbout(p, c, angle) {
  const cs = Math.cos(angle), sn = Math.sin(angle), dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx*cs - dy*sn, y: c.y + dx*sn + dy*cs };
}

/** Pose field for floor poses (sit, later down): the trunk behind the
 * shoulders turns as one block about `body.pivot` (negative `tilt` = rump
 * down), fading out between the withers and the neck so neck and head are not
 * turned. `lumbar` additionally bends the loin and croup about the lumbar
 * spine (the back rounds and the pelvis tucks under, as in a real sit).
 * `rise` lifts the front, `tailAngle` turns the tail about its moved root. */
const GALLOP_PIVOT = Object.freeze({ x: 578, y: 300 });
const LUMBOSACRAL = Object.freeze({ x: 320, y: 250 });
function tiltPoint(x, y, body) {
  const front = smooth((x - 430) / 132);
  const rear = 1 - smooth((x - 330) / 130);
  let p = { x: x + (body.shift || 0) * rear, y: y - (body.rise || 0) * front };
  p = rotateAbout(p, body.pivot, body.tilt * (1 - smooth((x - 540) / 110)));
  if (body.lumbar) {
    const lumbarPivot = rotateAbout(body.lumbarPivot || { x: 430, y: 285 }, body.pivot, body.tilt);
    p = rotateAbout(p, lumbarPivot, body.lumbar * rear);
  }
  return p;
}
function tiltDelta(x, y, body) {
  let p = tiltPoint(x, y, body);
  if (body.tailAngle) p = rotateAbout(p, tiltPoint(243, 250, body), body.tailAngle * smooth((250 - x) / 30));
  return { x: p.x - x, y: p.y - y };
}

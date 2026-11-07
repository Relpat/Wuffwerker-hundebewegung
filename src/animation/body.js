/** Lightweight torso motion tied to the leg gait clock.
 * Based on the v7.5.1 torso model's two-cycle bob and localized spine flexion,
 * with deliberately conservative amplitudes for the new one-contour profile.
 * This is a pose-space field, NOT a weighted skinning rig or anatomical proof.
 */

export const TORSO_PARAMS = Object.freeze({
  stand: Object.freeze({ bob: 0, pitch: 0, flex: 0 }),
  walk: Object.freeze({ bob: 3.0, pitch: 1.8, flex: 1.7 }),
  trot: Object.freeze({ bob: 4.5, pitch: 1.5, flex: 3.4 }),
  run: Object.freeze({ bob: 5.5, pitch: 3.1, flex: 5.8 }),
  pace: Object.freeze({ bob: 3.4, pitch: 2.0, flex: 2.3 }),
});

const clamp01 = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp01(value); return t*t*(3 - 2*t); };

/** Body root movement in the same local coordinate system as the contour. */
export function torsoAt(mode = 'stand', time = 0, period = 1, enabled = true) {
  if (!TORSO_PARAMS[mode]) throw new Error(`Unknown gait: ${mode}`);
  if (!Number.isFinite(time)) throw new Error('Non-finite gait time');
  const params = TORSO_PARAMS[mode];
  if (!enabled || mode === 'stand') {
    return { hipY: 0, shoulderY: 0, spineFlex: 0, enabled: false };
  }
  const phase = 2*Math.PI*(time / period);
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
  if (body.tilt) return tiltDelta(x, y, body);
  const longitudinal = smooth((x - 275) / (562 - 275));
  const rootY = body.hipY*(1-longitudinal) + body.shoulderY*longitudinal;
  const spineEnvelope = Math.exp(-.5*((x - 439)/105)**2);
  const dorsalWeight = smooth((390-y)/180);
  return { x: 0, y: rootY - body.spineFlex*spineEnvelope*dorsalWeight };
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
function tiltPoint(x, y, body) {
  const front = smooth((x - 430) / 132);
  let p = { x, y: y - (body.rise || 0) * front };
  p = rotateAbout(p, body.pivot, body.tilt * (1 - smooth((x - 540) / 110)));
  if (body.lumbar) {
    const lumbarPivot = rotateAbout({ x: 430, y: 285 }, body.pivot, body.tilt);
    p = rotateAbout(p, lumbarPivot, body.lumbar * (1 - smooth((x - 330) / 130)));
  }
  return p;
}
function tiltDelta(x, y, body) {
  let p = tiltPoint(x, y, body);
  if (body.tailAngle) p = rotateAbout(p, tiltPoint(243, 250, body), body.tailAngle * smooth((250 - x) / 30));
  return { x: p.x - x, y: p.y - y };
}

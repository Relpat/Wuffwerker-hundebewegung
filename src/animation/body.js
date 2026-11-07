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

import { tailAngles } from './tail.js';

/** Trunk part of a pose for the whole-body rig (rig.js): root offset, pitch
 * and joint rotations, from the gait's trunk motion (`body`), the neck/head
 * compensation (`head`) and the tail kernel (`tail`). Floor poses (sit) add
 * `tilt` (rump down), `lumbar` (loin rounds), `rise` (front up) and
 * `tailAngles` (per tail joint) to the body. */
const HIP_X = 350, SCAPULA_X = 548, THORAX_X = 505, THORAX = [505, 256];
const TILT_PIVOT = Object.freeze({ x: 560, y: 300 });
export function trunkPose(body, head, tail) {
  const angles = {};
  const add = (k, v) => { if (v) angles[k] = (angles[k] || 0) + v; };
  let x = 0, y = 0, pitch = 0;
  if (body?.enabled) {
    const w = (THORAX_X - HIP_X) / (SCAPULA_X - HIP_X);
    y = body.hipY * (1 - w) + body.shoulderY * w;
    pitch = -Math.atan2(body.hipY - body.shoulderY, SCAPULA_X - HIP_X);
    // Dorsal arch: the loin bends, the croup drops a little, the back rises.
    add('spine', -(body.spineFlex || 0) / 120);
    y -= (body.spineFlex || 0) * .3;
    add('lumbar', body.lumbar || 0);
    add('spine', body.thoracolumbar || 0);
    add('pelvis', body.tuck || 0);
    if (body.tilt) {
      // Floor poses turn the trunk about the shoulders, not about the root.
      const pv = body.pivot || TILT_PIVOT, dx = THORAX[0] - pv.x, dy = THORAX[1] - pv.y;
      const c = Math.cos(body.tilt), s = Math.sin(body.tilt);
      x += pv.x + dx * c - dy * s - THORAX[0];
      y += pv.y + dx * s + dy * c - THORAX[1];
      pitch += body.tilt;
    }
    y -= body.rise || 0;
    (body.tailAngles || []).forEach((a, i) => add(TAIL_JOINTS[i], a));
  }
  // The neck keeps its carriage when the trunk pitches; head.js adds the
  // gait's own neck and skull compensation on top.
  add('withers', -pitch);
  if (head?.enabled) { add('withers', head.cervical); add('occiput', head.cranium); }
  if (tail?.enabled) tailAngles(tail).forEach((a, i) => add(TAIL_JOINTS[i], a));
  return { x, y, pitch, angles };
}
const TAIL_JOINTS = ['tailRoot', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5'];

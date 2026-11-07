/** Stride preview for the A1/A2 skeleton (not yet the app default; A3 calibrates).
 *
 * Strides are the largest values for which, over the whole cycle, every IK
 * target is reached and the joints stay inside measured ranges: elbow ≤ 162°
 * and stifle ≤ 164° included angle (stifle flexion in trot ≈ 16–89°,
 * Brunel gait study of GSD/Labrador). Roughly 0.65 (walk) to 1.7 (run) ×
 * withers height per cycle; the stance length itself stays ~100 px in every
 * gait, as it is limited by the leg sweep, while swing time grows with speed.
 * `center` = stance centre as horizontal offset from each pivot (scapula/hip).
 */
export const PREVIEW_GAITS = Object.freeze({
  walk: Object.freeze({ stride: 150, stance: .66, lift: 22, center: { front: 0, hind: -15 } }),
  trot: Object.freeze({ stride: 240, stance: .45, lift: 30, center: { front: 5, hind: 0 } }),
  pace: Object.freeze({ stride: 210, stance: .55, lift: 26, center: { front: -5, hind: -5 } }),
  run: Object.freeze({ stride: 390, stance: .30, lift: 34, center: { front: -10, hind: 0 } }),
});

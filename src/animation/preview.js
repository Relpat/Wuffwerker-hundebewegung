/** Stride preview for the A1/A2 skeleton (not yet the app default; A3 calibrates).
 *
 * Strides are the largest values for which, over the whole cycle, every IK
 * target is reached and the joints stay inside measured ranges: elbow ≤ 162°
 * and stifle ≤ 164° included angle (stifle flexion in trot ≈ 16–89°,
 * Brunel gait study of GSD/Labrador). Roughly 0.85 (walk) to 1.7 (run) ×
 * withers height per cycle; the stance length itself stays ~100 px in every
 * gait, as it is limited by the leg sweep, while swing time grows with speed.
 * `center` = stance centre as horizontal offset from each pivot (scapula/hip).
 */
export const PREVIEW_GAITS = Object.freeze({
  walk: Object.freeze({ stride: 190, stance: .66, lift: 22, center: { front: -15, hind: -5 } }),
  trot: Object.freeze({ stride: 250, stance: .45, lift: 30, center: { front: -20, hind: 5 } }),
  pace: Object.freeze({ stride: 220, stance: .55, lift: 26, center: { front: -25, hind: 0 } }),
  run: Object.freeze({ stride: 390, stance: .30, lift: 34, center: { front: -30, hind: 0 } }),
});

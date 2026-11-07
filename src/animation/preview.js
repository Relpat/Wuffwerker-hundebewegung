/** Stride preview for the A1 limb skeleton (not yet the app default).
 *
 * The old strides (58–100 px per cycle at ~226 px withers height) were limited
 * by the missing scapula pivot. With the pantograph forelimb the paw can sweep
 * about ±80 px around the scapula pivot, so stance lengths of ~150 px (≈0.65×
 * withers height) are reachable. Values are rough literature-based targets
 * (Maes et al. 2008: duty factor < 50 % above ~2 m/s; stride grows with speed);
 * stage A3 calibrates them properly, incl. a real gallop.
 * `center` = stance centre as horizontal offset from each pivot (scapula/hip).
 */
export const PREVIEW_GAITS = Object.freeze({
  walk: Object.freeze({ stride: 220, stance: .66, lift: 24, center: { front: 8, hind: 0 } }),
  trot: Object.freeze({ stride: 330, stance: .45, lift: 34, center: { front: 8, hind: 0 } }),
  pace: Object.freeze({ stride: 280, stance: .55, lift: 28, center: { front: 8, hind: 0 } }),
  run: Object.freeze({ stride: 400, stance: .30, lift: 38, center: { front: 8, hind: 0 } }),
});

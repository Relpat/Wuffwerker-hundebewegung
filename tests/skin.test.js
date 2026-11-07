import test from 'node:test';
import assert from 'node:assert/strict';
import { BINDINGS, SKIN_REGIONS } from '../src/geometry/skin.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, CONTOUR_REGIONS } from '../src/geometry/contour.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { PREVIEW_GAITS } from '../src/animation/preview.js';

// Samples the outline and remembers the command each sample belongs to.
function samples(cmds, steps = 4) {
  const pts = []; let from;
  cmds.forEach(([op, ...a], ci) => {
    if (op === 'M' || op === 'L') { from = { x: a[0], y: a[1] }; pts.push({ ...from, ci }); }
    if (op === 'C') {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, q = 1 - t;
        pts.push({ ci, x: q*q*q*from.x + 3*q*q*t*a[0] + 3*q*t*t*a[2] + t*t*t*a[4], y: q*q*q*from.y + 3*q*q*t*a[1] + 3*q*t*t*a[3] + t*t*t*a[5] });
      }
      from = { x: a[4], y: a[5] };
    }
  });
  return pts;
}
const inRegion = (name, i) => i >= CONTOUR_REGIONS[name][0] && i <= CONTOUR_REGIONS[name][1];
/** First crossing of the outline with itself. Front leg over hind leg is a
 * real overlap of two legs in side view (long strides), not a fold. */
function crossing(points) {
  const o = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const x = (a, b, c, d) => o(a, b, c) * o(a, b, d) < -1e-8 && o(c, d, a) * o(c, d, b) < -1e-8;
  for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
    if (i === 0 && j === points.length - 1) continue;
    const ci = points[i].ci, cj = points[j].ci;
    if ((inRegion('front', ci) && inRegion('hind', cj)) || (inRegion('hind', ci) && inRegion('front', cj))) continue;
    if (x(points[i], points[(i + 1) % points.length], points[j], points[(j + 1) % points.length])) return [ci, cj];
  }
  return null;
}

test('every skinned point has normalised, finite, non-negative weights (bound once)', () => {
  assert.equal(BINDINGS.length, CONTOUR.length);
  BINDINGS.forEach((b, i) => {
    if (CONTOUR[i][0] === 'Z') return assert.equal(b, null);
    assert.ok(SKIN_REGIONS[b.region], `cmd ${i} region`);
    assert.equal(b.weights.length, (CONTOUR[i].length - 1) / 2);
    for (const w of b.weights) {
      assert.equal(w.length, b.bones.length);
      assert.ok(w.every(v => Number.isFinite(v) && v >= 0), `cmd ${i}`);
      assert.ok(Math.abs(w.reduce((s, v) => s + v, 0) - 1) < 1e-12, `cmd ${i}`);
    }
  });
  assert.ok(Object.isFrozen(BINDINGS) && Object.isFrozen(SKIN_REGIONS));
});

test('every region of the outline is bound to bones of its own body part', () => {
  const uses = (region, joint) => SKIN_REGIONS[region].some(([a, b]) => a === joint || b === joint);
  assert.ok(uses('tail', 'tailTip') && uses('tailUnder', 'tailTip'));
  assert.ok(uses('head', 'nose') && uses('jaw', 'chin'));
  assert.ok(uses('front', 'frontToe') && !uses('front', 'hindToe'));
  assert.ok(uses('hind', 'hindToe') && !uses('hind', 'frontToe'));
  assert.ok(!uses('back', 'frontPaw') && !uses('belly', 'hindPaw'));
});

test('skin reproduces the bind contour when leg bones do not move', () => {
  // Stand with a tail expression runs the full skinning path, but no leg bone moves.
  const stand = poseAt('stand', 0, { tailExpression: 'calm' });
  const c = contourAt(stand);
  for (let i = 2; i <= 40; i++) assert.deepEqual(c[i].map(v => typeof v === 'number' ? +v.toFixed(6) : v), CONTOUR[i], `cmd ${i}`);
});

test('preview strides: skinned outline stays one finite closed path without crossings', () => {
  for (const [mode, override] of Object.entries(PREVIEW_GAITS)) {
    for (let n = 0; n < 24; n++) {
      const cmds = contourAt(poseAt(mode, n * GAITS[mode].period / 24, { gait: override }));
      assert.equal(cmds.length, CONTOUR.length);
      for (const [, ...c] of cmds) assert.ok(c.every(Number.isFinite));
      const hit = crossing(samples(cmds, 4));
      assert.equal(hit, null, `${mode} frame ${n}: crossing ${hit}`);
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { BINDINGS, SKIN_REGIONS } from '../src/geometry/skin.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, sampleContour } from '../src/geometry/contour.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { PREVIEW_GAITS } from '../src/animation/preview.js';

function crossing(points) {
  const o = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const x = (a, b, c, d) => o(a, b, c) * o(a, b, d) < -1e-8 && o(c, d, a) * o(c, d, b) < -1e-8;
  for (let i = 0; i < points.length; i++) for (let j = i + 2; j < points.length; j++) {
    if (i === 0 && j === points.length - 1) continue;
    if (x(points[i], points[(i + 1) % points.length], points[j], points[(j + 1) % points.length])) return [i, j];
  }
  return null;
}

test('every skinned point has normalised, finite, non-negative weights (bound once)', () => {
  for (const { region, points } of BINDINGS) {
    assert.ok(points.size > 15, region.name);
    for (const [key, w] of points) {
      assert.equal(w.length, region.bones.length + 1);
      assert.ok(w.every(v => Number.isFinite(v) && v >= 0), key);
      assert.ok(Math.abs(w.reduce((s, v) => s + v, 0) - 1) < 1e-12, key);
    }
  }
  assert.ok(Object.isFrozen(BINDINGS) && SKIN_REGIONS.every(Object.isFrozen));
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
      const hit = crossing(sampleContour(cmds, 4));
      assert.equal(hit, null, `${mode} frame ${n}: crossing ${hit}`);
    }
  }
});

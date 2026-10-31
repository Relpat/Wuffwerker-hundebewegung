import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTBOARD, CONTOUR, sampleContour } from '../src/geometry/contour.js';
import { JOINTS, BONES } from '../src/skeleton/stand.js';

test('one closed contour, no patches or disconnected outline shapes', () => {
  assert.equal(CONTOUR[0][0], 'M');
  assert.equal(CONTOUR.at(-1)[0], 'Z');
  assert.equal(CONTOUR.filter(item => item[0] === 'M').length, 1);
  assert.equal(CONTOUR.filter(item => item[0] === 'Z').length, 1);
  for (const [op, ...p] of CONTOUR) {
    assert.equal(p.length, { M: 2, C: 6, L: 2, Z: 0 }[op]);
    assert.ok(p.every(Number.isFinite));
  }
});

test('sampled outline stays inside artboard, with nonzero signed area', () => {
  const points = sampleContour();
  assert.ok(points.length > 300);
  for (const {x, y} of points) {
    assert.ok(x >= 0 && x <= ARTBOARD.width, `x ${x}`);
    assert.ok(y >= 0 && y <= ARTBOARD.height, `y ${y}`);
  }
  const signedArea = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p.x*q.y - q.x*p.y;
  }, 0) / 2;
  assert.ok(Math.abs(signedArea) > 30000);
});

test('skeleton bones reference finite, existing joints', () => {
  for (const [from, to] of BONES) {
    assert.ok(Object.hasOwn(JOINTS, from));
    assert.ok(Object.hasOwn(JOINTS, to));
  }
  for (const p of Object.values(JOINTS)) {
    assert.equal(p.length, 2);
    assert.ok(p.every(Number.isFinite));
  }
});

test('flattened contour has no crossing nonadjacent edges', () => {
  const points = sampleContour();
  const orient = (a,b,c) => (b.x-a.x)*(c.y-a.y) - (b.y-a.y)*(c.x-a.x);
  const crossing = (a,b,c,d) => orient(a,b,c)*orient(a,b,d) < -1e-8
    && orient(c,d,a)*orient(c,d,b) < -1e-8;
  for (let i=0; i<points.length; i++) {
    for (let j=i+2; j<points.length; j++) {
      if (i===0 && j===points.length-1) continue;
      assert.equal(crossing(points[i],points[(i+1)%points.length],
        points[j],points[(j+1)%points.length]), false,
        `self-intersection between segments ${i} and ${j}`);
    }
  }
});

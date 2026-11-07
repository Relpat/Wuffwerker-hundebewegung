import test from 'node:test';
import assert from 'node:assert/strict';
import { sitPose } from '../src/animation/poses.js';
import { poseAt } from '../src/animation/gaits.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, ARTBOARD, sampleContour } from '../src/geometry/contour.js';
import { SEGMENTS } from '../src/skeleton/limbs.js';
import { JOINTS } from '../src/skeleton/stand.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angle = (a, b, c) => {
  const u = { x: a.x - b.x, y: a.y - b.y }, v = { x: c.x - b.x, y: c.y - b.y };
  return Math.acos((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))) * 180 / Math.PI;
};

test('sit at amount 0 is the neutral stand', () => {
  const sit = sitPose(0), stand = poseAt('stand');
  for (const [k, p] of Object.entries(stand.joints)) assert.ok(dist(sit.joints[k], p) < 1e-6, k);
  const c = contourAt(sit);
  CONTOUR.forEach((cmd, i) => cmd.slice(1).forEach((v, k) => assert.ok(Math.abs(c[i][k + 1] - v) < 1e-6, `cmd ${i}`)));
});

test('sit: bones keep their length, all IK targets reached, paws on the floor', () => {
  for (let i = 0; i <= 20; i++) {
    const p = sitPose(i / 20), j = p.joints;
    assert.ok(p.targetError < .01, `amount ${i / 20}: IK ${p.targetError}`);
    for (const [a, b, l] of SEGMENTS) assert.ok(Math.abs(dist(j[a], j[b]) - l) < .01, `${a}/${b}`);
    assert.ok(Math.abs(j.frontPaw.y - JOINTS.frontPaw[1]) < .01 && Math.abs(j.hindPaw.y - JOINTS.hindPaw[1]) < .01);
  }
});

test('sit is anatomically a sit (Fischer & Lilje pantograph, folded hind leg)', () => {
  const j = sitPose(1).joints;
  const back = Math.atan2(j.pelvis.y - j.withers.y, j.withers.x - j.pelvis.x) * 180 / Math.PI;
  assert.ok(back > 30 && back < 50, `back line ${back}°`);
  assert.ok(ARTBOARD.groundY - j.hip.y > 25 && ARTBOARD.groundY - j.hip.y < 60, 'hip just above the floor');
  assert.ok(j.hock.y > 460, 'point of hock rests on the floor');
  assert.ok(j.stifle.x > j.hip.x + 40, 'stifle points forward');
  assert.ok(angle(j.hip, j.stifle, j.hock) < 50, 'stifle fully flexed');
  assert.ok(angle(j.elbow, j.carpus, j.frontPaw) > 150 && angle(j.shoulder, j.elbow, j.carpus) > 120, 'forelegs straight');
  // femur ∥ metatarsus (pantograph) within the bind offset (12° in the stand)
  const fem = Math.atan2(j.stifle.y - j.hip.y, j.stifle.x - j.hip.x), met = Math.atan2(j.hindPaw.y - j.hock.y, j.hindPaw.x - j.hock.x);
  assert.ok(Math.abs(fem - met) < 15 * Math.PI / 180);
});

test('sit transition keeps one closed contour without crossings, above the floor', () => {
  const o = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const crosses = (a, b, c, d) => o(a, b, c) * o(a, b, d) < -1e-8 && o(c, d, a) * o(c, d, b) < -1e-8;
  for (let n = 0; n <= 20; n++) {
    const cmds = contourAt(sitPose(n / 20));
    assert.equal(cmds.length, CONTOUR.length);
    const pts = sampleContour(cmds, 6);
    for (const p of pts) assert.ok(p.y < ARTBOARD.groundY + 3, `amount ${n / 20}: below floor ${p.y}`);
    for (let i = 0; i < pts.length; i++) for (let j = i + 2; j < pts.length; j++) {
      if (i === 0 && j === pts.length - 1) continue;
      assert.equal(crosses(pts[i], pts[(i + 1) % pts.length], pts[j], pts[(j + 1) % pts.length]), false, `amount ${n / 20}: ${i}/${j}`);
    }
  }
});

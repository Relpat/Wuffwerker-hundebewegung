import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, pose, presetSpec } from '../src/poses/presets.js';
import { generatePose } from '../src/poses/generator.js';
import { poseAt } from '../src/animation/gaits.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, ARTBOARD, sampleContour } from '../src/geometry/contour.js';
import { SEGMENTS } from '../src/skeleton/limbs.js';
import { JOINTS } from '../src/skeleton/stand.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const NAMES = Object.keys(PRESETS);
const far = n => 'far' + n[0].toUpperCase() + n.slice(1);
const FLOOR = ARTBOARD.groundY;

test('every preset at amount 0 is the neutral stand', () => {
  const stand = poseAt('stand');
  for (const n of NAMES) {
    const p = pose(n, 0);
    for (const [k, q] of Object.entries(stand.joints)) assert.ok(dist(p.joints[k], q) < 1e-4, `${n}: ${k}`);
    const c = contourAt(p);
    CONTOUR.forEach((cmd, i) => cmd.slice(1).forEach((v, k) => assert.ok(Math.abs(c[i][k + 1] - v) < 1e-3, `${n}: cmd ${i}`)));
  }
});

test('bones keep their length and every IK target is reached, on both sides', () => {
  for (const n of NAMES) for (let i = 0; i <= 10; i++) {
    const p = pose(n, i / 10), j = p.joints;
    assert.ok(p.targetError < .01, `${n} ${i / 10}: IK ${p.targetError}`);
    for (const [a, b, l] of SEGMENTS) {
      assert.ok(Math.abs(dist(j[a], j[b]) - l) < .01, `${n} ${i / 10}: ${a}/${b}`);
      assert.ok(Math.abs(dist(j[far(a)], j[far(b)]) - l) < .01, `${n} ${i / 10}: far ${a}/${b}`);
    }
  }
});

test('the trunk lands where the spec puts shoulder and hip', () => {
  const spec = { rumpf: { vorn: -30, hinten: 20, vor: 12, lende: -8 } };
  const j = generatePose(spec).joints;
  assert.ok(Math.abs(j.scapula.x - (JOINTS.scapula[0] + 12)) < .01);
  assert.ok(Math.abs(j.scapula.y - (JOINTS.scapula[1] + 30)) < .01);
  assert.ok(Math.abs(j.hip.y - (JOINTS.hip[1] - 20)) < .01);
});

test('standing presets keep all four paws on the floor; nothing sinks into it', () => {
  for (const n of ['locker', 'starr', 'angst', 'schnueffeln', 'wegsehen', 'spielverbeugung']) {
    const j = pose(n).joints;
    for (const k of ['hindPaw', 'farHindPaw']) assert.ok(Math.abs(j[k].y - JOINTS.hindPaw[1]) < .5, `${n}: ${k}`);
  }
  for (const n of ['locker', 'starr', 'angst', 'schnueffeln', 'wegsehen']) {
    const j = pose(n).joints;
    for (const k of ['frontPaw', 'farFrontPaw']) assert.ok(Math.abs(j[k].y - JOINTS.frontPaw[1]) < .5, `${n}: ${k}`);
  }
  for (const n of NAMES) {
    const j = pose(n).joints;
    for (const [k, q] of Object.entries(j)) if (!k.startsWith('tail')) assert.ok(q.y < FLOOR + 6, `${n}: ${k} under the floor (${q.y})`);
  }
});

test('the presets show what they say', () => {
  const j = n => pose(n).joints;
  const stand = poseAt('stand').joints;
  // down and sleep: chest and elbows on the floor, hip low, forepaws in front
  for (const n of ['platz', 'schlafen']) {
    const p = j(n);
    assert.ok(p.sternum.y > FLOOR - 20 && p.elbow.y > FLOOR - 30, `${n}: chest/elbow on the floor`);
    assert.ok(p.hip.y > FLOOR - 90, `${n}: hip low`);
    assert.ok(p.frontPaw.x > p.elbow.x + 80 && p.frontPaw.y > FLOOR - 25, `${n}: forearm along the floor`);
  }
  assert.ok(j('schlafen').nose.y > j('platz').nose.y + 60, 'sleep: head down on the paws');
  // give paw: near forepaw high in front, far forepaw still on the floor
  const pf = j('pfote');
  assert.ok(pf.frontPaw.y < FLOOR - 70 && pf.frontPaw.x > pf.carpus.x - 5, 'paw lifted forwards');
  assert.ok(Math.abs(pf.farFrontPaw.y - JOINTS.frontPaw[1]) < .5, 'other paw on the floor');
  // play bow: front down, rear up, tail up
  const pv = j('spielverbeugung');
  assert.ok(pv.sternum.y > FLOOR - 50 && pv.hip.y < stand.hip.y + 5, 'front down, rear up');
  assert.ok(pv.tailTip.y < pv.tailRoot.y, 'tail up');
  // sniff: nose at the floor
  assert.ok(j('schnueffeln').nose.y > FLOOR - 30, 'nose at the floor');
  // stiff: head and tail high, weight forward; fear: low, weight back, tail tucked
  const st = j('starr'), an = j('angst');
  assert.ok(st.nose.y < stand.nose.y - 20 && st.tailTip.y < stand.tailRoot.y && st.scapula.x > stand.scapula.x, 'stiff');
  assert.ok(an.withers.y > stand.withers.y + 30 && an.scapula.x < stand.scapula.x && an.tailTip.y > stand.tailTip.y + 40, 'fear');
});

test('one closed outline without crossings at every step of every preset', () => {
  const o = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const crosses = (a, b, c, d) => o(a, b, c) * o(a, b, d) < -1e-8 && o(c, d, a) * o(c, d, b) < -1e-8;
  for (const n of NAMES) for (let s = 0; s <= 10; s++) {
    const cmds = contourAt(pose(n, s / 10));
    assert.equal(cmds.length, CONTOUR.length);
    const pts = sampleContour(cmds, 6);
    for (let i = 0; i < pts.length; i++) for (let k = i + 2; k < pts.length; k++) {
      if (i === 0 && k === pts.length - 1) continue;
      assert.equal(crosses(pts[i], pts[(i + 1) % pts.length], pts[k], pts[(k + 1) % pts.length]), false, `${n} ${s / 10}: ${i}/${k}`);
    }
  }
});

test('overrides change single values, unknown names fail loudly', () => {
  assert.equal(presetSpec('angst', { rute: 'happy' }).rute, 'happy');
  assert.equal(presetSpec('angst', { kopf: { hals: 0 } }).kopf.kopf, -4);
  assert.throws(() => pose('fliegen'));
  assert.throws(() => pose('locker', 1, { rute: 'quatsch' }));
});

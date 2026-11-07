import test from 'node:test';
import assert from 'node:assert/strict';
import { FRONT, HIND, LIMB_BIND, SEGMENTS, solveFront, solveHind, reach } from '../src/skeleton/limbs.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { PREVIEW_GAITS } from '../src/animation/preview.js';
import { ARTBOARD } from '../src/geometry/contour.js';
import { WITHERS_PX } from '../src/skeleton/measures.js';

const P = xy => ({ x: xy[0], y: xy[1] });
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const F = LIMB_BIND.front, H = LIMB_BIND.hind;

test('bind pose is reproduced exactly by the pantograph solvers', () => {
  const f = solveFront(P(F.scapula), P(F.frontPaw));
  const h = solveHind(P(H.hip), P(H.hindPaw));
  for (const k of Object.keys(F)) assert.ok(Math.hypot(f[k].x - F[k][0], f[k].y - F[k][1]) < 1e-6, k);
  for (const k of Object.keys(H)) assert.ok(Math.hypot(h[k].x - H[k][0], h[k].y - H[k][1]) < 1e-6, k);
});

test('Lenny 45 cm: joint heights follow the measures, scapula is the forelimb pivot', () => {
  const height = y => (ARTBOARD.groundY - y) / WITHERS_PX;
  // FCI 298: elbow (point) at ~56 % of the withers height; the joint itself sits a little lower.
  assert.ok(height(F.elbow[1]) >= .45 && height(F.elbow[1]) <= .56, `elbow ${height(F.elbow[1])}`);
  // shoulder and hip joint both at roughly two thirds to four fifths of the height
  for (const [k, y] of [['shoulder', F.shoulder[1]], ['hip', H.hip[1]]]) assert.ok(height(y) >= .62 && height(y) <= .84, `${k} ${height(y)}`);
  // hock at about a quarter of the withers height
  assert.ok(height(H.hock[1]) >= .2 && height(H.hock[1]) <= .3, `hock ${height(H.hock[1])}`);
  // the scapula ends under the withers skin
  assert.ok(F.scapula[1] > ARTBOARD.groundY - WITHERS_PX);
  assert.ok(F.scapula[1] < F.shoulder[1]);
  const share = FRONT.La / (FRONT.La + FRONT.Lb + FRONT.Lc + FRONT.meta + FRONT.toe);
  assert.ok(share >= .24 && share <= .34, `scapula share ${share.toFixed(2)}`);
});

test('pantograph angle (scapula↔forearm, femur↔metatarsus) stays constant in every gait and preview', () => {
  for (const [mode, gait] of Object.entries(GAITS)) for (const override of [null, PREVIEW_GAITS[mode]]) {
    for (let i = 0; i < 60; i++) {
      const j = poseAt(mode, gait.period * i / 60, { gait: override }).joints;
      for (const pre of ['', 'far']) {
        const n = k => pre ? pre + k[0].toUpperCase() + k.slice(1) : k;
        const fd = wrap(ang(j[n('elbow')], j[n('carpus')]) - ang(j[n('scapula')], j[n('shoulder')]));
        const hd = wrap(ang(j[n('hock')], j[n('hindPaw')]) - ang(j[n('hip')], j[n('stifle')]));
        assert.ok(Math.abs(fd - FRONT.delta) < 1e-6, `${mode} front ${fd}`);
        assert.ok(Math.abs(hd - HIND.delta) < 1e-6, `${mode} hind ${hd}`);
      }
    }
  }
});

test('preview strides are reachable, keep bone lengths and never push paws or toes below ground', () => {
  for (const [mode, override] of Object.entries(PREVIEW_GAITS)) {
    const gait = GAITS[mode];
    for (let i = 0; i < 120; i++) {
      const p = poseAt(mode, gait.period * i / 120, { gait: override });
      assert.ok(p.targetError < .5, `${mode} ${i}: ${p.targetError}`);
      for (const [a, b, l] of SEGMENTS) assert.ok(Math.abs(Math.hypot(p.joints[a].x - p.joints[b].x, p.joints[a].y - p.joints[b].y) - l) < 1e-6);
      for (const k of ['frontPaw', 'frontToe', 'hindPaw', 'hindToe', 'farFrontToe', 'farHindToe'])
        assert.ok(p.joints[k].y <= ARTBOARD.groundY + .5, `${mode} ${i} ${k} ${p.joints[k].y}`);
    }
  }
});

test('leg sweep around scapula and hip covers the longest preview stance', () => {
  const f = reach('front'), h = reach('hind');
  const stance = Math.max(...Object.values(PREVIEW_GAITS).map(g => g.stride * g.stance));
  assert.ok(f.back + f.forward >= stance, JSON.stringify(f));
  assert.ok(h.back + h.forward >= stance, JSON.stringify(h));
});

test('joint angles stay inside measured ranges (stifle ≤ 164°, elbow ≤ 162°, stifle swing ≥ 85°)', () => {
  const inc = (a, b, c) => {
    const u = { x: a.x - b.x, y: a.y - b.y }, v = { x: c.x - b.x, y: c.y - b.y };
    return Math.acos((u.x * v.x + u.y * v.y) / Math.hypot(u.x, u.y) / Math.hypot(v.x, v.y)) * 180 / Math.PI;
  };
  for (const [mode, override] of Object.entries(PREVIEW_GAITS)) for (let i = 0; i < 80; i++) {
    const j = poseAt(mode, GAITS[mode].period * i / 80, { gait: override }).joints;
    const stifle = inc(j.hip, j.stifle, j.hock), elbow = inc(j.shoulder, j.elbow, j.carpus);
    assert.ok(stifle <= 164.5 && stifle >= 85, `${mode} ${i} stifle ${stifle.toFixed(1)}`);
    assert.ok(elbow <= 162.5, `${mode} ${i} elbow ${elbow.toFixed(1)}`);
  }
  // Standing: stifle flexion ~30–45° (included ~135–150°), hock ~125–150°.
  const s = poseAt('stand').joints;
  const st = inc(s.hip, s.stifle, s.hock), ho = inc(s.stifle, s.hock, s.hindPaw);
  assert.ok(st >= 130 && st <= 152, `stand stifle ${st}`);
  assert.ok(ho >= 125 && ho <= 152, `stand hock ${ho}`);
});

test('carpus folds and the paw lifts during front swing', () => {
  let folded = false;
  for (let i = 0; i < 80; i++) {
    const p = poseAt('trot', GAITS.trot.period * i / 80);
    if (p.support.front) continue;
    const metaTurn = wrap(ang(p.joints.carpus, p.joints.frontPaw) - FRONT.metaAngle);
    folded ||= metaTurn > 60 * Math.PI / 180;
  }
  assert.ok(folded);
});

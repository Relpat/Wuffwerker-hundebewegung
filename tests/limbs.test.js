import test from 'node:test';
import assert from 'node:assert/strict';
import { FRONT, HIND, LIMB_BIND, SEGMENTS, solveFront, solveHind, reach } from '../src/skeleton/limbs.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { PREVIEW_GAITS } from '../src/animation/preview.js';
import { ARTBOARD } from '../src/geometry/contour.js';

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

test('Fischer & Lilje: shoulder joint sits clearly above the hip joint, scapula is the forelimb pivot', () => {
  assert.ok(F.shoulder[1] < H.hip[1] - 10);
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

test('forelimb reach around the scapula is large enough for the preview stance lengths', () => {
  const f = reach('front'), h = reach('hind');
  const pivotOffset = F.frontPaw[0] - F.scapula[0];
  const half = Math.max(...Object.values(PREVIEW_GAITS).map(g => g.stride * g.stance / 2));
  assert.ok(f.back - pivotOffset + 8 >= half && f.forward + pivotOffset - 8 >= half, JSON.stringify(f));
  assert.ok(h.back >= half && h.forward >= half);
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

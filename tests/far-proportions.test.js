import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { FAR_BIND, JOINTS } from '../src/skeleton/stand.js';
import { CONTOUR, ARTBOARD, sampleContour } from '../src/geometry/contour.js';
import { farContours } from '../src/geometry/far-limbs.js';

const size = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
const approx = (a, b, epsilon = .02) => assert.ok(Math.abs(a-b) < epsilon, `${a} differs from ${b}`);
const width = pts => Math.max(...pts.map(p=>p.x)) - Math.min(...pts.map(p=>p.x));

test('far-side hip and shoulder use the same anatomical elevation as near side, not miniature limb roots', () => {
  approx(FAR_BIND.farHip[1], JOINTS.hip[1], 1e-8);
  approx(FAR_BIND.farShoulder[1], JOINTS.shoulder[1], 1e-8);
  assert.ok(Math.abs(FAR_BIND.farHip[0]-JOINTS.hip[0]) <= 30);
  assert.ok(Math.abs(FAR_BIND.farShoulder[0]-JOINTS.shoulder[0]) <= 30);
});

test('far paws have the same footprint width and ground elevation as existing near paws', () => {
  const stand = poseAt('stand');
  const foreground = sampleContour(CONTOUR, 30);
  for (const [name, side, pred] of [
    ['front', 'frontPaw', p => p.x > 540],
    ['hind', 'hindPaw', p => p.x < 420],
  ]) {
    const nearPaw = foreground.filter(p => pred(p) && p.y >= 472);
    const farPaw = sampleContour(farContours(stand)[name], 30).filter(p => p.y >= 472);
    assert.ok(farPaw.length > 4);
    const fraction = width(farPaw)/width(nearPaw);
    assert.ok(fraction >= .95 && fraction <= 1.15, `${name} footprint ratio ${fraction.toFixed(2)}`);
    approx(Math.max(...farPaw.map(p => p.y)), ARTBOARD.groundY);
    approx(Math.max(...nearPaw.map(p => p.y)), ARTBOARD.groundY);
  }
});

test('far legs retain exactly the same anatomical IK lengths as their near counterparts over all gaits', () => {
  for (const [mode, gait] of Object.entries(GAITS)) {
    for(let i=0; i<48; i++) {
      const p = poseAt(mode, gait.period*i/48), j = p.joints;
      const pairs = [
        ['shoulder','elbow','farShoulder','farElbow'],
        ['elbow','frontPaw','farElbow','farFrontPaw'],
        ['hip','stifle','farHip','farStifle'],
        ['stifle','hock','farStifle','farHock'],
        ['hock','hindPaw','farHock','farHindPaw'],
      ];
      for(const [a,b,c,d] of pairs) {
        const nearLength = size(j[a],j[b]);
        const farLength = size(j[c],j[d]);
        // Original near-side stand is a drawn reference, not an IK-solved pose.
        if(mode !== 'stand') approx(nearLength,farLength);
        assert.ok(farLength > 45, `${mode} ${c}/${d} collapses`);
      }
      assert.ok(p.targetError < .01, `${mode} phase ${i}: unreachable target`);
      for(const c of Object.values(farContours(p))) {
        const points = sampleContour(c, 7);
        assert.ok(points.every(({x,y})=>Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<ARTBOARD.width&&y>0&&y<=ARTBOARD.height));
      }
    }
  }
});

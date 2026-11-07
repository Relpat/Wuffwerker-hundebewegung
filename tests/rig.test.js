import test from 'node:test';
import assert from 'node:assert/strict';
import { MEASURES_CM, PX_PER_CM, WITHERS_CM, WITHERS_PX, px } from '../src/skeleton/measures.js';
import { FRONT, HIND, LIMB_BIND } from '../src/skeleton/limbs.js';
import { trunkFK, BIND, ATTACH, FRONT_CHAIN, REAR_CHAIN, NEUTRAL } from '../src/skeleton/rig.js';
import { BONES, JOINTS } from '../src/skeleton/stand.js';
import { ARTBOARD, CONTOUR, CONTOUR_REGIONS } from '../src/geometry/contour.js';

const P = xy => ({ x: xy[0], y: xy[1] });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const F = LIMB_BIND.front, H = LIMB_BIND.hind;

test('Lenny measures: 45 cm withers = 278 px, every segment converts cm → px', () => {
  assert.equal(WITHERS_CM, 45);
  assert.ok(Math.abs(PX_PER_CM - WITHERS_PX / WITHERS_CM) < 1e-12);
  for (const [name, [cm, note]] of Object.entries(MEASURES_CM)) {
    assert.ok(cm > 0 && typeof note === 'string', name);
    assert.ok(Math.abs(px(name) - cm * PX_PER_CM) < 1e-9, name);
  }
  // withers skin top sits exactly 278 px above the floor
  const withers = CONTOUR[CONTOUR_REGIONS.back[1]];
  assert.ok(Math.abs(withers.at(-1) - (ARTBOARD.groundY - WITHERS_PX)) <= 3, `withers skin at ${withers.at(-1)}`);
});

test('leg bones in the bind pose have exactly their measured lengths', () => {
  const pairs = [
    [F.scapula, F.shoulder, 'scapula'], [F.shoulder, F.elbow, 'humerus'], [F.elbow, F.carpus, 'forearm'],
    [F.carpus, F.frontPaw, 'metacarpus'], [F.frontPaw, F.frontToe, 'frontToes'],
    [H.hip, H.stifle, 'femur'], [H.stifle, H.hock, 'tibia'], [H.hock, H.hindPaw, 'metatarsus'], [H.hindPaw, H.hindToe, 'hindToes'],
  ];
  for (const [a, b, name] of pairs) assert.ok(Math.abs(dist(P(a), P(b)) - px(name)) < .02, name);
  assert.ok(Math.abs(FRONT.La - px('scapula')) < .02 && Math.abs(HIND.La - px('femur')) < .02);
});

test('measured proportions stay in the published ranges (FCI 298, Beagle study)', () => {
  const cm = n => MEASURES_CM[n][0];
  // forelimb shares of scapula+humerus+forearm+manus (Beagle 28/25/27.5/19.6 %)
  const fore = cm('scapula') + cm('humerus') + cm('forearm') + cm('metacarpus') + cm('frontToes');
  assert.ok(cm('scapula') / fore > .23 && cm('scapula') / fore < .30);
  assert.ok(cm('humerus') / fore > .22 && cm('humerus') / fore < .29);
  // hind: femur ≈ tibia (FCI 35/36 %, Beagle 36/34 %)
  assert.ok(Math.abs(cm('femur') - cm('tibia')) / cm('tibia') < .1);
  // FCI: head 40 % of the withers height, forearm a third, body square
  assert.equal(cm('head'), .4 * WITHERS_CM);
  assert.equal(cm('forearm'), WITHERS_CM / 3);
  assert.ok(Math.abs(cm('bodyLength') - WITHERS_CM) / WITHERS_CM < .06);
});

test('trunk FK: neutral pose is the bind pose, rotations keep every bone length', () => {
  const { joints } = trunkFK(NEUTRAL);
  for (const k of Object.keys(BIND)) assert.ok(dist(joints[k], P(BIND[k])) < 1e-9, k);
  const pose = { x: 7, y: -4, pitch: .1, angles: { withers: -.2, neckMid: .15, spine: .08, lumbar: -.12, pelvis: .1, tailRoot: .4, tail2: -.3 } };
  const moved = trunkFK(pose).joints;
  for (const chain of [FRONT_CHAIN, REAR_CHAIN]) for (let i = 1; i < chain.length; i++) {
    const a = chain[i - 1], b = chain[i];
    assert.ok(Math.abs(dist(moved[a], moved[b]) - dist(P(BIND[a]), P(BIND[b]))) < 1e-9, `${a}/${b}`);
  }
  // attachments ride rigidly on their segment
  for (const [name, [a]] of Object.entries(ATTACH)) {
    if (name === 'chin') continue;
    assert.ok(Math.abs(dist(moved[name], moved[a]) - dist(P(BIND[name]), P(BIND[a]))) < 1e-9, name);
  }
  // the jaw opens about the jaw joint
  const open = trunkFK({ ...NEUTRAL, jawOpen: .3 }).joints;
  assert.ok(Math.abs(dist(open.chin, open.jaw) - dist(P(BIND.chin), P(BIND.jaw))) < 1e-9);
  assert.ok(open.chin.y > joints.chin.y);
});

test('the skeleton lists every bone once and all joints exist', () => {
  const keys = new Set(BONES.map(([a, b]) => [a, b].sort().join('|')));
  assert.equal(keys.size, BONES.length);
  for (const [a, b] of BONES) assert.ok(JOINTS[a] && JOINTS[b], `${a}/${b}`);
  assert.ok(BONES.length >= 25, `${BONES.length} bones`);
});

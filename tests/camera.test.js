import test from 'node:test';
import assert from 'node:assert/strict';
import { projector } from '../src/render/camera.js';
import { poseAt } from '../src/animation/gaits.js';
import { TRUE_FAR_BIND, LEGACY_FAR_BIND, JOINTS } from '../src/skeleton/stand.js';

test('camera without angles is the identity (side view unchanged)', () => {
  const p = projector({});
  for (const [x, y] of [[0, 0], [480, 483], [700, 166]]) assert.deepEqual(p(x, y, 50), { x, y });
});

test('looking from above lifts farther points; far paws stand higher than near paws', () => {
  const p = projector({ pitch: 12 * Math.PI / 180 });
  const near = p(JOINTS.frontPaw[0], 483, 0), far = p(JOINTS.frontPaw[0], 483, 65);
  assert.ok(far.y < near.y - 10);
  assert.ok(Math.abs(far.x - near.x) < 1e-9);
});

test('true far bind has no fake offsets and keeps all targets reachable', () => {
  assert.equal(TRUE_FAR_BIND.farHip[0], JOINTS.hip[0]);
  assert.equal(TRUE_FAR_BIND.farScapula[0], JOINTS.scapula[0]);
  assert.notEqual(LEGACY_FAR_BIND.farHip[0], JOINTS.hip[0]);
  for (const mode of ['walk', 'trot', 'pace', 'run'])
    for (let i = 0; i < 40; i++) assert.ok(poseAt(mode, i / 40, { farBind: TRUE_FAR_BIND }).targetError < .01, mode);
});

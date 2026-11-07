import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, pose } from '../src/poses/presets.js';
import { lennyLayers, lennyGroup, LENNY_FARBEN } from '../src/render/lenny.js';
import { wolke } from '../src/render/formen.js';

const NAMES = Object.keys(PRESETS);
const nums = d => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);

test('Lenny look: finite paths, no strokes (no outlines), depth order', () => {
  for (const n of NAMES) {
    const { layers, kopf } = lennyLayers(pose(n));
    const order = layers.map(l => l.name);
    // shadow → far legs → body → near-leg shading; the head comes last
    assert.deepEqual(order.slice(0, 4), ['schatten', 'fern-hind', 'fern-front', 'koerper'], n);
    assert.ok(order.indexOf('nah-front') > order.indexOf('koerper'), n);
    for (const l of layers) if (l.d) assert.ok(nums(l.d).every(Number.isFinite) && nums(l.d).length > 20, `${n}: ${l.name}`);
    const svg = lennyGroup(pose(n), { id: n });
    assert.ok(!/stroke=/.test(svg.replace(/<g transform[\s\S]*$/, '')), `${n}: body has no stroke`);
    assert.ok(Number.isFinite(kopf.x) && Number.isFinite(kopf.y) && kopf.s > .3 && kopf.s < .7, `${n}: head anchor`);
  }
});

test('far legs are darker than the body; the head carries the mimik of the pose', () => {
  const { layers, kopf } = lennyLayers(pose('angst'));
  assert.equal(layers.find(l => l.name === 'fern-front').fill, LENNY_FARBEN.fellFern);
  assert.equal(layers.find(l => l.name === 'koerper').fill, LENNY_FARBEN.fell);
  assert.equal(kopf.mimik, 'angst');
  assert.equal(lennyLayers(pose('schlafen')).kopf.mimik, 'schlafen');
  assert.equal(lennyLayers(pose('angst', 1, { darstellung: { mimik: 'freude' } })).kopf.mimik, 'freude');
});

test('head sits on the nose and turns back when looking away', () => {
  const p = pose('locker'), a = lennyLayers(p).kopf;
  assert.equal(a.spiegeln, true);
  assert.ok(Math.abs(a.x - p.joints.nose.x) < 20, 'head at the nose');
  const w = lennyLayers(pose('wegsehen')).kopf;
  assert.equal(w.spiegeln, false);
  assert.ok(w.x < p.joints.occiput.x, 'nose points backwards');
});

test('the head function gets the anchor (wuffwerk draws its own Lenny head)', () => {
  let got;
  const svg = lennyGroup(pose('sitz'), { kopf: a => { got = a; return '<g id="kopf"/>'; } });
  assert.ok(svg.includes('<g id="kopf"/>') && got.mimik === 'freundlich');
});

test('wolke port matches the Baukasten output', () => {
  // same input as Lenny's beard in bausteine.mjs; checked against wuffwerk formen.mjs
  const d = wolke([[-14, 8], [30, 0], [84, 8], [128, 26], [146, 54], [118, 76], [62, 76], [12, 60], [-14, 34]], 26);
  assert.ok(d.startsWith('M-14 8A16.1 16.1 0 0 1 ') && d.endsWith('Z'));
});

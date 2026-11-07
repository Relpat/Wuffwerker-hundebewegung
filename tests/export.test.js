import test from 'node:test';
import assert from 'node:assert/strict';
import { exportPosen } from '../scripts/export-baukasten.mjs';
import { PRESETS } from '../src/poses/presets.js';

test('Baukasten export: every preset, plain data, both coats', () => {
  const e = exportPosen();
  assert.deepEqual(Object.keys(e.posen), Object.keys(PRESETS));
  assert.ok(e.massstab > 0 && e.kopfFaktor >= 1 && e.ursprung.length === 2);
  assert.ok(e.farben.lenny.fell && e.farben.dunkel.fell);
  for (const [n, p] of Object.entries(e.posen)) {
    assert.ok(p.label && p.layers.some(l => l.name === 'koerper'), n);
    assert.ok(['x', 'y', 's', 'dreh', 'spiegeln', 'mimik'].every(k => k in p.kopf), n);
    JSON.stringify(p); // serialisable
  }
});

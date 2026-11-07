/** Writes the A1 acceptance pictures (pure SVG) to docs/abnahme/a1/. */
import fs from 'node:fs';
import { poseAt, GAITS } from '../src/animation/gaits.js';
import { poseSvg } from './svg.mjs';

const out = new URL('../docs/abnahme/a1/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const write = (name, svg) => fs.writeFileSync(new URL(name + '.svg', out), svg);
write('stand', poseSvg(poseAt('stand'), { title: 'Stand: Beinskelett A1' }));
for (const mode of ['walk', 'trot', 'gallop', 'rotary', 'pace']) {
  for (let k = 0; k < 8; k++) {
    write(`${mode}-${k + 1}`, poseSvg(poseAt(mode, GAITS[mode].period * k / 8), { title: `${GAITS[mode].label} ${k + 1}/8` }));
  }
}
console.log('A1-Abnahmebilder geschrieben:', out.pathname);

/** Writes the G1 acceptance pictures (pure SVG) to docs/abnahme/g1/:
 * every preset with and without skeleton, transitions: video in the project files. */
import fs from 'node:fs';
import { PRESETS, pose } from '../src/poses/presets.js';
import { poseSvg } from './svg.mjs';

const out = new URL('../docs/abnahme/g1/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const write = (name, svg) => fs.writeFileSync(new URL(name + '.svg', out), svg);
const view = [180, 100, 680, 400];
for (const [name, p] of Object.entries(PRESETS)) {
  write(name, poseSvg(pose(name), { skeleton: false, title: p.label, view }));
  write(name + '-skelett', poseSvg(pose(name), { title: p.label, view }));
}
console.log('G1-Abnahmebilder geschrieben:', out.pathname);

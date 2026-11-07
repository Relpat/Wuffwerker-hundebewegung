/** Lenny-look SVGs of all presets (stage G2).
 *   node scripts/lenny.mjs [pfad/zu/wuffwerk]
 * With the path to a wuffwerk checkout the real Baukasten head (with mimik)
 * is used, otherwise the simple stand-in head. Writes docs/abnahme/g2/. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PRESETS, pose } from '../src/poses/presets.js';
import { lennyGroup } from '../src/render/lenny.js';

export async function baukastenKopf(wuffwerk) {
  if (!wuffwerk) return undefined;
  const { bausteine, lennyBewegung } = await import(pathToFileURL(path.resolve(wuffwerk, 'site/illustrationen/bausteine.mjs')));
  const kopf = a => bausteine.lenny(a);
  kopf.css = lennyBewegung;
  return kopf;
}

export function lennySvg(p, { kopf, title = '', view = [180, 90, 700, 410], hintergrund = '#FBF6EE', boden = '#EFE5D5', id = 'l' } = {}) {
  const [vx, vy, vw, vh] = view;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(' ')}">`;
  s += `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${hintergrund}"/><rect x="${vx}" y="470" width="${vw}" height="${vy + vh - 470}" fill="${boden}"/>`;
  s += lennyGroup(p, { kopf, id });
  if (title) s += `<text x="${vx + 14}" y="${vy + 30}" font-family="sans-serif" font-size="24" font-weight="700" fill="#26334a">${title}</text>`;
  return s + '</svg>';
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const kopf = await baukastenKopf(process.argv[2]);
  const out = new URL('../docs/abnahme/g2/', import.meta.url);
  fs.mkdirSync(out, { recursive: true });
  for (const [name, p] of Object.entries(PRESETS)) fs.writeFileSync(new URL(name + '.svg', out), lennySvg(pose(name), { kopf, title: p.label, id: name }));
  console.log('G2-Bilder geschrieben:', out.pathname, kopf ? '(Baukasten-Kopf)' : '(Ersatzkopf)');
}

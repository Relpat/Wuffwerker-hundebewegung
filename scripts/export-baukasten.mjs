/** Stage G3 – exports every preset in the Lenny look for the wuffwerk
 * Baukasten (Baustein "hund"):
 *   node scripts/export-baukasten.mjs ../wuffwerk
 * writes ../wuffwerk/site/illustrationen/generiert/hund-posen.json.
 *
 * The file holds plain data only (paths, colours, head anchor), so the
 * website needs no rig code. Coordinates stay in rig space; `ursprung` is
 * the point the Baustein places at its x/y (front of the chest on the
 * ground, as before) and `massstab` scales the rig to the old Baustein size.
 * The rig dog faces right; the Baustein mirrors it (faces left by default).
 */
import fs from 'node:fs';
import path from 'node:path';
import { PRESETS, pose } from '../src/poses/presets.js';
import { lennyLayers, LENNY_FARBEN, DUNKEL_FARBEN } from '../src/render/lenny.js';
import { JOINTS } from '../src/skeleton/stand.js';
import { ARTBOARD } from '../src/geometry/contour.js';

export function exportPosen() {
  const posen = {};
  for (const [name, p] of Object.entries(PRESETS)) {
    const { layers, kopf } = lennyLayers(pose(name));
    posen[name] = { label: p.label, gruppe: p.gruppe, text: p.text, layers, kopf };
  }
  return {
    hinweis: 'Erzeugt von Relpat/Wuffwerker-hundebewegung (scripts/export-baukasten.mjs). Nicht von Hand ändern.',
    // forechest of the stand on the ground line
    ursprung: [Math.round(JOINTS.manubrium[0] + 18), ARTBOARD.groundY],
    // rig (Widerrist 278 px) → old Baustein size (Widerrist ≈ 280 px like before)
    massstab: 0.82,
    // the Baukasten head is drawn a little larger than anatomical (Lenny stays cute)
    kopfFaktor: 1.25,
    farben: { lenny: LENNY_FARBEN, dunkel: DUNKEL_FARBEN },
    posen,
  };
}

const ziel = process.argv[2];
if (ziel) {
  const datei = path.resolve(ziel, 'site/illustrationen/generiert/hund-posen.json');
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, JSON.stringify(exportPosen()) + '\n');
  console.log('geschrieben:', datei, Math.round(fs.statSync(datei).size / 1024), 'KB');
}

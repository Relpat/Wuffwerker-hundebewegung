/** Copies Lenny's Baukasten head (with mimik) from the wuffwerk repo, so the
 * generator page shows exactly the head of wuffwerker.de:
 *   node scripts/sync-baukasten.mjs ../wuffwerk
 * Files: site/illustrationen/{stil,formen,lenny}.mjs → src/vendor/baukasten/. */
import fs from 'node:fs';
import path from 'node:path';

const quelle = process.argv[2];
if (!quelle) { console.error('Pfad zum wuffwerk-Repo fehlt'); process.exit(1); }
const ziel = new URL('../src/vendor/baukasten/', import.meta.url);
fs.mkdirSync(ziel, { recursive: true });
for (const datei of ['stil.mjs', 'formen.mjs', 'lenny.mjs']) {
  const text = fs.readFileSync(path.resolve(quelle, 'site/illustrationen', datei), 'utf8');
  fs.writeFileSync(new URL(datei, ziel), `// Kopie aus Relpat/wuffwerk site/illustrationen/${datei} (scripts/sync-baukasten.mjs). Nicht hier ändern.\n` + text);
}
console.log('Baukasten-Kopf übernommen nach', ziel.pathname);

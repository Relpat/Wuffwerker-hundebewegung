// Kopie aus Relpat/wuffwerk site/illustrationen/stil.mjs (scripts/sync-baukasten.mjs). Nicht hier ändern.
// Der Wuffwerk-Bildstil an einer Stelle. Alle Illustrationen entstehen aus diesen Werten,
// eine Änderung hier (z. B. Konturstärke) gilt beim nächsten Build für alle Bilder.

export const format = { breite: 640, hoehe: 590, boden: 440 }

// Farben: dieselben wie auf der Seite (main.css), ergänzt um wenige Materialtöne.
export const farben = {
  navy: '#26334A',
  rot: '#BF452C',
  rotHell: '#E07A5F',
  limette: '#DCEB81',
  limetteDunkel: '#B9CC4E',
  creme: '#FFFBF2',
  holz: '#DDB283',
  holzDunkel: '#B9885A',
  metall: '#B4BCC7',
  metallDunkel: '#8994A3',
  stoff: '#A797C9',
  stoffDunkel: '#8676AD',
  salbei: '#86A672',
  haut: '#F2D3C4',
  leckerli: '#A8662F',
  leckerliHell: '#E2B07A',
  kuerbis: '#E58A3A',
  schoko: '#5E3423',
  schokoHell: '#7C4A32',
  traube: '#7E5A9B',
  traubeHell: '#A487C0',
  kuerbisDunkel: '#C46A22',
  wasser: '#8EB4CF',
  wasserDunkel: '#6E96B4',
  nacht: '#34406A',
  // Lenny, nach dem Foto vom echten Lenny
  fell: '#F6EBDB',
  fellOhr: '#EBCFA8',
  fellOhrDunkel: '#D9B48A',
  fellBart: '#D2A374',
  nase: '#6B3B32',
  maul: '#5A2E2A',
  zunge: '#E9837A',
}

// Jedes Thema hat einen Hintergrund und eine etwas dunklere Bodenfläche.
// Die Hintergründe passen zu den Schritt-Karten und Themen-Etiketten der Seite.
export const themen = {
  Schnüffeln: { grund: '#EEF5C8', boden: '#D8E79C' },
  Selbermachen: { grund: '#F8E3D8', boden: '#EDC6B2' },
  Denken: { grund: '#EDE7F2', boden: '#D8CDE6' },
  Ruhe: { grund: '#E5E8F3', boden: '#CBD1E7' },
  Draußen: { grund: '#E1ECD8', boden: '#BFD5AD' },
  // Für Seiten ohne Idee: Ratgeber und Wissen, Nacht (z. B. Silvester).
  Wissen: { grund: '#F6EFE2', boden: '#E8D9BF' },
  Nacht: { grund: '#3A4672', boden: '#2C365C' },
}

// Linien und Formen
export const linie = { kontur: 6, detail: 4 }
export const radius = { klein: 10, mittel: 18, gross: 28 }

// Kontur an oder aus: ein Schalter für den ganzen Bildbestand. Entscheidung Patrick 29.10.2026: ohne Kontur.
export const stil = { kontur: false }

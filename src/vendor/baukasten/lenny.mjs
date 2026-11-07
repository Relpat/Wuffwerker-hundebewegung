// Kopie aus Relpat/wuffwerk site/illustrationen/lenny.mjs (scripts/sync-baukasten.mjs). Nicht hier ändern.
// Lennys Kopf mit Mimik (Baustein lenny), ohne Abhängigkeiten außer Stil und Formen.
// Eigene Datei, damit auch das Hunde-Rig (Relpat/Wuffwerker-hundebewegung) denselben Kopf im Browser zeigen kann.
import { farben as f } from './stil.mjs'
import { wolke, rund } from './formen.mjs'

const lage = (x, y, dreh = 0, s = 1, spiegeln = false) => `transform="translate(${x} ${y})${dreh ? ` rotate(${dreh})` : ''}${s !== 1 || spiegeln ? ` scale(${spiegeln ? -s : s} ${s})` : ''}"`

// Lennys Mimik, nur am Kopf, angelehnt an die Forschung zur Hundemimik (DogFACS):
// Ohren nach vorn = aufmerksam, angelegt = Angst; Augen zusammengekniffen = Freude, Weiß sichtbar = Stress;
// Brauen innen hochgezogen = „Hundeblick“; Maul offen mit Zunge = froh, eng geschlossen = angespannt.
export const mimiken = {
  freundlich: { ohr: 0, auge: 'rund', braue: 'weich', maul: 'laecheln', text: 'Grundgesicht' },
  freude: { ohr: 14, auge: 'lachen', braue: 'hoch', maul: 'offen', text: 'Spiel, Lob, Erfolg' },
  neugierig: { ohr: -22, auge: 'gross', braue: 'eine', maul: 'zu', text: 'Neues, Zuschauen, Erkunden' },
  hundeblick: { ohr: 8, auge: 'glanz', braue: 'sorge', maul: 'zu', text: 'Bitten, Warten, etwas fehlt' },
  konzentriert: { ohr: -12, auge: 'halb', braue: 'tief', maul: 'zu', text: 'Schnüffeln, Suchen, Denken' },
  angst: { ohr: 62, auge: 'angst', braue: 'sorge', maul: 'eng', text: 'Silvester, Gewitter, Stress' },
  schlafen: { ohr: 4, auge: 'zu', braue: 'weich', maul: 'laecheln', text: 'Ruhe, Schlaf, Entspannung' },
  // Für Hundebegegnungen: Fixieren (große Augen, tiefe Brauen, Maul fest zu, blinzelt nicht) und Wegsehen (Augen halb zu, entspannt).
  starr: { ohr: -24, auge: 'gross', braue: 'tief', maul: 'eng', text: 'Fixieren, angespannt' },
  wegsehen: { ohr: 20, auge: 'halb', braue: 'weich', maul: 'zu', text: 'Wegsehen, beschwichtigen' },
}

// Kleine Bewegungen je Mimik: blinzeln, Nase rümpfen, Ohren zucken. Nur in bewegten Bildern
// und nur ohne „Bewegung reduzieren“, die Standbilder zeigen das Gesicht in Ruhe.
const lennyKeys = {
  'l-blinzeln': '0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.1)}',
  'l-schnuppern': '0%,30%,100%{transform:none}4%,12%,20%{transform:translate(-1px,-3px) scale(1.07,.95)}8%,16%,24%{transform:none}',
  'l-ohr-zucken': '0%,70%,86%,100%{transform:none}74%{transform:rotate(-7deg)}78%{transform:rotate(4deg)}82%{transform:rotate(-3deg)}',
  'l-ohr-wippen': '0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}',
  'l-ohr-spitzen': '0%,55%,100%{transform:none}62%,82%{transform:translate(-2px,-7px) rotate(-6deg)}',
  'l-ohr-zittern': '0%,100%{transform:rotate(0)}25%{transform:rotate(1.6deg)}75%{transform:rotate(-1.6deg)}',
  'l-ohr-sinken': '0%,100%{transform:none}50%{transform:rotate(3deg)}',
  'l-zunge': '0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.18)}',
  'l-nicken': '0%,100%{transform:none}50%{transform:translate(0,-4px)}',
  'l-neigen': '0%,30%,100%{transform:none}40%,75%{transform:rotate(-6deg)}',
  'l-atmen': '0%,100%{transform:scale(1)}50%{transform:scale(1.025)}',
  'l-zittern': '0%,100%{transform:none}25%{transform:translate(1px,0)}75%{transform:translate(-1px,0)}',
  'l-blick': '0%,35%,100%{transform:none}42%,62%{transform:translate(-5px,1px)}70%,92%{transform:translate(2px,-1px)}',
  'l-braue-heben': '0%,100%{transform:none}50%{transform:translate(0,-4px)}',
  'l-braue-zucken': '0%,55%,100%{transform:none}60%,85%{transform:translate(0,-5px)}',
  'l-wedeln': '0%,100%{transform:rotate(-8deg)}50%{transform:rotate(10deg)}',
}
const lennyRegeln = {
  '.l-kopf': 'transform-box:fill-box;transform-origin:0% 60%',
  '.l-augen,.l-pupille,.l-nase': 'transform-box:fill-box;transform-origin:center',
  '.l-ohr': 'transform-box:fill-box;transform-origin:50% 0%',
  '.l-zunge': 'transform-box:fill-box;transform-origin:50% 0%',
  '.h-rute': 'transform-box:fill-box;transform-origin:0% 100%',
  // freundlich: blinzelt, rümpft ab und zu die Nase, zuckt mit dem Ohr
  '.l-a-freundlich,.l-a-neugierig,.l-a-konzentriert': 'animation:l-blinzeln 4.6s infinite',
  '.l-n-freundlich': 'animation:l-schnuppern 5.2s 1s infinite',
  '.l-o-freundlich': 'animation:l-ohr-zucken 6.4s 2s infinite',
  // freude: Ohren wippen, Zunge hechelt, Kopf nickt leicht
  '.l-o-freude': 'animation:l-ohr-wippen .9s ease-in-out infinite',
  '.l-k-freude .l-zunge': 'animation:l-zunge .45s ease-in-out infinite',
  '.l-k-freude': 'animation:l-nicken .9s ease-in-out infinite',
  // neugierig: Kopf neigt sich, Ohr hebt sich, Braue zuckt, Nase schnuppert
  '.l-k-neugierig': 'animation:l-neigen 5s ease-in-out infinite',
  '.l-o-neugierig': 'animation:l-ohr-spitzen 5s ease-in-out infinite',
  '.l-b-neugierig': 'animation:l-braue-zucken 5s ease-in-out infinite',
  '.l-n-neugierig': 'animation:l-schnuppern 3s .5s infinite',
  // hundeblick: langsames Blinzeln, Brauen heben sich bittend
  '.l-a-hundeblick': 'animation:l-blinzeln 6s infinite',
  '.l-b-hundeblick': 'animation:l-braue-heben 2.6s ease-in-out infinite',
  // konzentriert: Nase arbeitet ständig, Ohren nach vorn
  '.l-n-konzentriert': 'animation:l-schnuppern 1.2s infinite',
  '.l-o-konzentriert': 'animation:l-ohr-zucken 3.2s infinite',
  // angst: Ohren zittern angelegt, Blick huscht umher, Kopf bebt, schnelles Blinzeln
  '.l-o-angst': 'animation:l-ohr-zittern .3s linear infinite',
  '.l-a-angst .l-pupille': 'animation:l-blick 3s ease-in-out infinite',
  '.l-k-angst': 'animation:l-zittern .35s linear infinite',
  '.l-a-angst': 'animation:l-blinzeln 2.2s infinite',
  // wegsehen: langsames Blinzeln. starr blinzelt absichtlich nicht (Fixieren).
  '.l-a-wegsehen': 'animation:l-blinzeln 5s infinite',
    // schlafen: ruhiges Atmen, Ohr sinkt nach
  '.l-k-schlafen': 'animation:l-atmen 4s ease-in-out infinite',
  '.l-o-schlafen': 'animation:l-ohr-sinken 4s ease-in-out infinite',
}
// Lenny bewegt sich ein paar Sekunden lang und kommt dann zur Ruhe. Endlose Animationen lassen den Browser
// jedes Bild neu zeichnen, das ruckelt am Handy (Patrick 30.10.2026). Wird ein Bild wieder sichtbar, spielt es neu.
const begrenzt = r => r.replace(/(\d*\.?\d+)s([^,]*?)infinite/, (_, dauer, rest) => `${dauer}s${rest}${Math.max(2, Math.round(6 / Number(dauer)))}`)
for (const sel of Object.keys(lennyRegeln)) lennyRegeln[sel] = begrenzt(lennyRegeln[sel])
export const lennyBewegung = Object.entries(lennyKeys).map(([n, k]) => `@keyframes ${n}{${k}}`).join('')
  + Object.entries(lennyRegeln).filter(([sel, r]) => !r.startsWith('animation')).map(([sel, r]) => `${sel}{${r}}`).join('')
  + `@media (prefers-reduced-motion:no-preference){${Object.entries(lennyRegeln).filter(([, r]) => r.startsWith('animation')).map(([sel, r]) => `${sel}{${r}}`).join('')}}`

// Lenny, der Wuffwerk-Hund: erscheint als Kopf im Halbprofil, der ins Bild schaut.
// Vorbild ist der echte Lenny (Lagotto Romagnolo): wolliges, helles Fell, helles Apricot-Schlappohr, rostbrauner Bart, braune Nase.
// Zeigt nach links (mit spiegeln nach rechts), x/y ist die Nasenspitze, dreh dreht um die Nase.
// mimik: siehe mimiken unten (Ohren, Augen, Brauen, Maul je Gefühl), augen: "zu" heißt wie bisher "schlafen".
// halsband: true mit Ring für die Leine (Ring liegt bei Nase + 298/62 mal s, gespiegelt -298).
// Bewegung: Teile tragen Klassen (l-…), die Keyframes stehen in lennyBewegung und laufen nur in bewegten Bildern.
export function lennyKopf({ x, y, dreh = 0, s = 1, spiegeln = false, mimik = 'freundlich', augen, halsband = false }) {
  const name = augen === 'zu' ? 'schlafen' : mimiken[mimik] ? mimik : 'freundlich'
  const m = mimiken[name]
  const rund0 = 'stroke-linecap="round" fill="none"'
  const kopf = [[-14, -26], [40, -50], [96, -80], [118, -128], [168, -166], [236, -170], [292, -138], [326, -82], [330, -20], [308, 34], [258, 66], [190, 76], [128, 72], [66, 70], [14, 54], [-18, 22]]
  const bart = [[-14, 8], [30, 0], [84, 8], [128, 26], [146, 54], [118, 76], [62, 76], [12, 60], [-14, 34]]
  // Ohr hängt bei (240/-116). Positiv = nach hinten angelegt (Angst), negativ = gespitzt und angehoben (Neugier).
  const ohrLage = m.ohr < 0 ? `translate(252 ${-116 + m.ohr * 1.4}) rotate(${-m.ohr * 0.35}) scale(1 .9)` : `translate(240 -116) rotate(${-m.ohr})${m.ohr > 40 ? ' scale(.88 .74)' : ''}`
  const ohr = `<g class="l-ohr l-o-${name}"><g transform="${ohrLage}"><path d="${wolke([[-26, -6], [10, -14], [38, 20], [46, 80], [36, 150], [6, 176], [-30, 160], [-46, 100], [-44, 40]], 22)}" fill="${f.fellOhr}"/>`
    + `<path d="${rund([[-8, 30], [20, 40], [24, 110], [0, 150], [-22, 120], [-26, 60]])}" fill="${f.fellOhrDunkel}" fill-opacity=".55"/></g></g>`
  const auge = ([cx, cy], g) => {
    const rx = 15 * g
    const ry = 17 * g
    const pupille = (px, py, r, glanz) => `<g class="l-pupille"><circle cx="${px}" cy="${py}" r="${r}" fill="${f.navy}"/><circle cx="${px + r * 0.3}" cy="${py - r * 0.45}" r="${glanz * g}" fill="${f.creme}"/></g>`
    switch (m.auge) {
      case 'zu': return `<path d="M${cx - rx} ${cy}q${rx} ${ry * 0.8} ${rx * 2} 0" stroke="${f.navy}" stroke-width="${5 * g}" ${rund0}/>`
      case 'lachen': return `<path d="M${cx - rx} ${cy + 4}q${rx} ${-ry * 1.3} ${rx * 2} 0" stroke="${f.navy}" stroke-width="${6 * g}" ${rund0}/>`
      case 'halb': return `<ellipse cx="${cx}" cy="${cy + 3}" rx="${rx}" ry="${ry * 0.85}" fill="${f.navy}"/><path d="M${cx - rx - 3} ${cy - 2}h${rx * 2 + 6}V${cy - ry - 6}H${cx - rx - 3}Z" fill="${f.fell}"/><path d="M${cx - rx - 2} ${cy - 1}h${rx * 2 + 4}" stroke="${f.navy}" stroke-width="${4 * g}" ${rund0}/>`
      // Angst: Weiß im Auge sichtbar, Blick zur Seite („Walauge“).
      case 'angst': return `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 1.15}" ry="${ry * 1.15}" fill="#FFFFFF"/>` + pupille(cx + rx * 0.35, cy + 2, rx * 0.72, 3.5)
      default: {
        const gross = m.auge === 'glanz' ? 1.25 : m.auge === 'gross' ? 1.12 : 1
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx * gross}" ry="${ry * gross}" fill="${f.navy}"/><circle cx="${cx + rx * 0.35}" cy="${cy - ry * 0.4}" r="${(m.auge === 'glanz' ? 7 : 5.5) * g}" fill="${f.creme}"/><circle cx="${cx - rx * 0.35}" cy="${cy + ry * 0.4}" r="${(m.auge === 'glanz' ? 4 : 2.6) * g}" fill="${f.creme}"/>`
      }
    }
  }
  // Brauen sind Fellbüschel. Höhe innen (Richtung Nase), Mitte, außen relativ zum Auge.
  const braue = ([cx, cy], g, nah) => {
    const [i, mi, a] = { weich: [0, -4, 0], hoch: [-4, -10, -4], eine: nah ? [-6, -14, -2] : [0, -2, 2], sorge: [-14, -4, 8], tief: [4, 2, 4] }[m.braue]
    const w = 18 * g
    const h = cy - 26 * g
    return `<path d="M${cx - w} ${h + i}Q${cx} ${h + mi - 6} ${cx + w} ${h + a}" stroke="${f.fellOhrDunkel}" stroke-width="${8 * g}" ${rund0}/>`
  }
  const maul = {
    laecheln: `<path d="M4 22q4 16 22 14q16 -2 26 -14" stroke="${f.maul}" stroke-width="4.5" ${rund0}/>`,
    zu: `<path d="M6 24q14 8 34 2" stroke="${f.maul}" stroke-width="4.5" ${rund0}/>`,
    eng: `<path d="M10 26q10 -4 24 0" stroke="${f.maul}" stroke-width="4.5" ${rund0}/>`,
    offen: `<path d="M2 22Q8 64 40 60Q66 56 70 24Q36 34 2 22Z" fill="${f.maul}"/><g class="l-zunge"><path d="M14 46Q24 76 44 70Q58 64 56 44Q36 54 14 46Z" fill="${f.zunge}"/></g>`,
  }[m.maul]
  return `<g ${lage(x, y, dreh, s, spiegeln)}><g class="l-kopf l-k-${name}">`
    + `<path d="${wolke(kopf, 28)}" fill="${f.fell}"/>`
    + (halsband ? `<path d="M236 62C262 84 300 74 314 40" stroke="${f.rot}" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="298" cy="62" r="10" fill="none" stroke="${f.metallDunkel}" stroke-width="6"/>` : '')
    + `<path d="${wolke(bart, 26)}" fill="${f.fellBart}" fill-opacity=".42"/>`
    + `<ellipse cx="168" cy="-22" rx="17" ry="10" fill="${f.rotHell}" fill-opacity=".3"/>`
    + `<g class="l-augen l-a-${name}">${auge([92, -68], 0.75)}${auge([156, -64], 1)}</g>`
    + `<g class="l-brauen l-b-${name}">${braue([92, -68], 0.75, false)}${braue([156, -64], 1, true)}</g>`
    + maul
    + `<g class="l-nase l-n-${name}"><ellipse cx="2" cy="-6" rx="27" ry="22" fill="${f.nase}"/><ellipse cx="-6" cy="-14" rx="9" ry="5" fill="#FFFFFF" fill-opacity=".45"/></g>`
    + ohr
    + '</g></g>'
}

// Kopie aus Relpat/wuffwerk site/illustrationen/formen.mjs (scripts/sync-baukasten.mjs). Nicht hier ändern.
// Formen, die sich aus wenigen Stützpunkten ergeben: weiche Umrisse und lockige Fellkanten.

// Glatte Kurve durch Stützpunkte (geschlossene Catmull-Rom-Kurve) als dichte Punktliste.
function glatt(punkte, schritte = 12) {
  const n = punkte.length
  const aus = []
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map(d => punkte[(i + d + n) % n])
    for (let t = 0; t < 1; t += 1 / schritte) {
      const t2 = t * t
      const t3 = t2 * t
      aus.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)))
    }
  }
  return aus
}

// Punkte im gleichen Abstand entlang der Kurve.
function verteilen(punkte, abstand) {
  const aus = [punkte[0]]
  let rest = 0
  for (let i = 1; i <= punkte.length; i++) {
    const a = punkte[i - 1]
    const b = punkte[i % punkte.length]
    const d = Math.hypot(b[0] - a[0], b[1] - a[1])
    let pos = 0
    while (rest + d - pos >= abstand) {
      pos += abstand - rest
      rest = 0
      aus.push([a[0] + (b[0] - a[0]) * pos / d, a[1] + (b[1] - a[1]) * pos / d])
    }
    rest += d - pos
  }
  return aus.slice(0, -1)
}

const r1 = v => Math.round(v * 10) / 10

// Wolkiger Umriss: kleine Bögen nach außen. So wirkt Fell lockig, ohne einzelne Kringel.
// Stützpunkte im Uhrzeigersinn, bogen = Abstand der Bögen.
export function wolke(stuetz, bogen = 26) {
  const p = verteilen(glatt(stuetz), bogen)
  const r = r1(bogen * 0.62)
  return `M${r1(p[0][0])} ${r1(p[0][1])}` + p.slice(1).concat([p[0]]).map(q => `A${r} ${r} 0 0 1 ${r1(q[0])} ${r1(q[1])}`).join('') + 'Z'
}

// Weicher, glatter Umriss durch die Stützpunkte.
export const rund = stuetz => 'M' + glatt(stuetz, 8).map(q => q.map(r1).join(' ')).join('L') + 'Z'

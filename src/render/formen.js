/** Curly coat edge, ported 1:1 from the wuffwerk Baukasten
 * (site/illustrationen/formen.mjs, "wolke"), so the generated dog has the
 * same fur edge as Lenny's head on wuffwerker.de. */
function glatt(punkte, schritte = 12) {
  const n = punkte.length, aus = [];
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [-1, 0, 1, 2].map(d => punkte[(i + d + n) % n]);
    for (let t = 0; t < 1; t += 1 / schritte) {
      const t2 = t * t, t3 = t2 * t;
      aus.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return aus;
}

/** Points at equal distance along a closed polyline. */
export function verteilen(punkte, abstand) {
  const aus = [punkte[0]];
  let rest = 0;
  for (let i = 1; i <= punkte.length; i++) {
    const a = punkte[i - 1], b = punkte[i % punkte.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let pos = 0;
    while (rest + d - pos >= abstand) {
      pos += abstand - rest; rest = 0;
      aus.push([a[0] + (b[0] - a[0]) * pos / d, a[1] + (b[1] - a[1]) * pos / d]);
    }
    rest += d - pos;
  }
  return aus.slice(0, -1);
}

const r1 = v => Math.round(v * 10) / 10;

/** Curly outline: small arcs bulging outwards (points clockwise on screen).
 * `glaetten` false keeps dense input points as they are (already smooth). */
export function wolke(stuetz, bogen = 26, { glaetten = true } = {}) {
  const p = verteilen(glaetten ? glatt(stuetz) : stuetz, bogen);
  const r = r1(bogen * 0.62);
  return `M${r1(p[0][0])} ${r1(p[0][1])}` + p.slice(1).concat([p[0]]).map(q => `A${r} ${r} 0 0 1 ${r1(q[0])} ${r1(q[1])}`).join('') + 'Z';
}

/** Signed area (screen coordinates): > 0 means clockwise on screen. */
export const flaeche = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;

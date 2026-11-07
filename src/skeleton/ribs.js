/** Ribs for the skeleton view (drawing only; the outline does not use them).
 *
 * 13 rib pairs in the dog: ribs 1–9 reach the breastbone through their costal
 * cartilage, 10–12 join the costal arch, 13 ends free. Shown here are 8
 * representative ribs: each starts at the thoracic spine (withers T1 …
 * spine T13), runs down and slightly back, and turns forward to the
 * breastbone (manubrium → sternum → xiphoid) or the costal arch. The ribs ride
 * rigidly on the thorax, like the breastbone.
 */
import { TRUNK_BIND } from './rig.js';

const P = xy => ({ x: xy[0], y: xy[1] });
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const along = (pts, t) => { // point at t (0…1) along a polyline, by length
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  let d = t * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) return lerp(pts[i], pts[i + 1], Math.min(1, d / seg[i])); d -= seg[i]; }
};
const B = TRUNK_BIND;
const SPINE = [P([552, 256]), P(B.thorax), P([466, 259])];
const STERNUM = [P(B.manubrium), P(B.sternum), P(B.xiphoid)];
const ARCH = [P(B.xiphoid), P([478, 330]), P([468, 312]), P([461, 296])];

/** Bind-pose ribs as quadratic curves [start, control, end]. */
export const RIBS_BIND = Object.freeze(Array.from({ length: 8 }, (_, i) => {
  const t = i / 7;
  const v = along(SPINE, t);
  const end = i < 5 ? along(STERNUM, .12 + .88 * i / 4) : along(ARCH, (i - 4) / 3);
  const mid = lerp(v, end, .5);
  const c = { x: mid.x - 20 + 6 * t, y: mid.y + 4 };
  return Object.freeze([v, c, end]);
}));

/** Ribs in the posed skeleton: rigid with the thorax (thorax → withers). */
export function ribsAt(joints) {
  const a0 = P(B.thorax), b0 = P(B.withers), a = joints.thorax, b = joints.withers;
  const t = Math.atan2(b.y - a.y, b.x - a.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);
  const c = Math.cos(t), s = Math.sin(t);
  const map = p => ({ x: a.x + c * (p.x - a0.x) - s * (p.y - a0.y), y: a.y + s * (p.x - a0.x) + c * (p.y - a0.y) });
  return RIBS_BIND.map(r => r.map(map));
}

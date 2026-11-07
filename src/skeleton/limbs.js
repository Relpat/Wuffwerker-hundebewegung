/** Stage A1 – limb skeleton after Fischer & Lilje (2011, "Dogs in Motion").
 *
 * Forelimb:  scapula → humerus → forearm (radius/ulna) → metacarpus → toes.
 *   The pivot of the forelimb is the upper scapula, not the shoulder joint.
 *   Scapula and forearm move like a pantograph: their angle difference stays
 *   constant, so the three proximal segments are solved together.
 * Hindlimb:  femur → tibia → metatarsus → toes.
 *   Femur and metatarsus form the hind pantograph (constant angle difference).
 *
 * A three-segment pantograph chain reduces to an exact two-bone problem:
 *   end = root + La·u + Lb·v + Lc·R(δ)·u = root + (La + Lc·e^{iδ})·u + Lb·v
 * so the virtual first bone has length |La + Lc·e^{iδ}| and a fixed angular
 * offset φ. Bone lengths and the pantograph offset are derived ONCE from the
 * bind pose and never recomputed per frame.
 */
import { px, STAND_DIRECTIONS } from "./measures.js";
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
const scale = (a, s) => ({ x: a.x * s, y: a.y * s });
const len = a => Math.hypot(a.x, a.y);
const angle = a => Math.atan2(a.y, a.x);
const dir = t => ({ x: Math.cos(t), y: Math.sin(t) });
const rot = (a, t) => ({ x: a.x * Math.cos(t) - a.y * Math.sin(t), y: a.x * Math.sin(t) + a.y * Math.cos(t) });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P = xy => ({ x: xy[0], y: xy[1] });

function twoBone(root, target, upper, lower, bend) {
  const d = sub(target, root);
  const raw = len(d);
  const n = raw > 1e-9 ? scale(d, 1 / raw) : { x: 0, y: 1 };
  const reach = clamp(raw, Math.abs(upper - lower) + 1e-3, upper + lower - 1e-3);
  const proj = (upper * upper - lower * lower + reach * reach) / (2 * reach);
  const h = Math.sqrt(Math.max(0, upper * upper - proj * proj));
  const knee = { x: root.x + n.x * proj - n.y * h * bend, y: root.y + n.y * proj + n.x * h * bend };
  return { knee, end: add(root, scale(n, reach)), error: Math.abs(raw - reach) };
}

/** Builds a pantograph limb definition from four bind points p0..p3
 * (p0 = pivot, p1/p2 = middle joints, p3 = distal end of the pantograph). */
export function pantograph(p0, p1, p2, p3) {
  const a = sub(p1, p0), b = sub(p2, p1), c = sub(p3, p2);
  const La = len(a), Lb = len(b), Lc = len(c);
  const delta = angle(c) - angle(a);
  const v = add({ x: La, y: 0 }, scale(dir(delta), Lc));
  const def = { La, Lb, Lc, delta, Lv: len(v), phi: angle(v), bend: 1 };
  // Choose the bend side that reproduces the bind pose.
  const err = bend => {
    const s = solvePantograph(def, p0, p3, bend);
    return len(sub(s.j1, p1)) + len(sub(s.j2, p2));
  };
  def.bend = err(1) <= err(-1) ? 1 : -1;
  return Object.freeze(def);
}

export function solvePantograph(def, root, target, bend = def.bend) {
  const { knee, error } = twoBone(root, target, def.Lv, def.Lb, bend);
  const w = angle(sub(knee, root)) - def.phi; // direction of the proximal segment
  const j1 = add(root, scale(dir(w), def.La));
  // Middle segment points from the virtual knee towards the target.
  const v = sub(target, knee);
  const j2 = add(j1, scale(v, def.Lb / (len(v) || 1)));
  const j3 = add(j2, scale(dir(w + def.delta), def.Lc));
  return { j1, j2, j3, error };
}

/** Bind landmarks (neutral stand) of one side, built from Lenny's measures
 * in cm (measures.js) and the standing segment directions. Each limb is laid
 * out from the paw pad upwards, so the pads sit exactly on their heights and
 * the pivot lands where the bones end. Units: artboard pixels. */
function layLimb(pivotX, padY, names, measures) {
  const dir = m => STAND_DIRECTIONS[m] * Math.PI / 180;
  const body = measures.slice(0, -1);
  let y = padY;
  for (const m of body) y -= px(m) * Math.sin(dir(m));
  let x = pivotX;
  const out = { [names[0]]: [x, y] };
  body.forEach((m, i) => { x += px(m) * Math.cos(dir(m)); y += px(m) * Math.sin(dir(m)); out[names[i + 1]] = [x, y]; });
  const t = measures.at(-1);
  out[names.at(-1)] = [x + px(t) * Math.cos(dir(t)), y + px(t) * Math.sin(dir(t))];
  return Object.freeze(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.freeze(v.map(c => +c.toFixed(2)))])));
}
export const LIMB_BIND = Object.freeze({
  front: layLimb(548, 471, ['scapula', 'shoulder', 'elbow', 'carpus', 'frontPaw', 'frontToe'],
    ['scapula', 'humerus', 'forearm', 'metacarpus', 'frontToes']),
  hind: layLimb(350, 470, ['hip', 'stifle', 'hock', 'hindPaw', 'hindToe'],
    ['femur', 'tibia', 'metatarsus', 'hindToes']),
});

const F = LIMB_BIND.front, H = LIMB_BIND.hind;
export const FRONT = Object.freeze({
  ...pantograph(P(F.scapula), P(F.shoulder), P(F.elbow), P(F.carpus)),
  meta: len(sub(P(F.frontPaw), P(F.carpus))),
  metaAngle: angle(sub(P(F.frontPaw), P(F.carpus))),
  carpusOffset: angle(sub(P(F.frontPaw), P(F.carpus))) - angle(sub(P(F.carpus), P(F.elbow))),
  toe: len(sub(P(F.frontToe), P(F.frontPaw))),
  toeAngle: angle(sub(P(F.frontToe), P(F.frontPaw))),
});
export const HIND = Object.freeze({
  ...pantograph(P(H.hip), P(H.stifle), P(H.hock), P(H.hindPaw)),
  metaAngle: angle(sub(P(H.hindPaw), P(H.hock))),
  toe: len(sub(P(H.hindToe), P(H.hindPaw))),
  toeAngle: angle(sub(P(H.hindToe), P(H.hindPaw))),
});

/** Extra downward reach of the toe tip when toes curl by `flex` (≥0 px). */
function toeDrop(limb, flex) {
  return Math.max(0, limb.toe * (Math.sin(limb.toeAngle + flex) - Math.sin(limb.toeAngle)));
}

/** Forelimb. `paw` is the paw (MCP) point on its ground track; `lift` (px, ≥0)
 * is the swing height. In swing the carpus rises only by half the lift; the
 * rest comes from folding the metacarpus backwards (`carpalFlex`, radians),
 * as in a real dog, so the elbow is not pulled up into the chest. The fold
 * never lets the toes sink below their stance level minus half the lift. */
export function solveFront(root, paw, { carpalFlex = 0, toeFlex = 0, lift = 0 } = {}) {
  const ta = FRONT.toeAngle;
  // In stance the carpus keeps its bind angle: the metacarpus turns with the
  // forearm while the pad stays on the ground (a few fixed-point iterations).
  let ma = FRONT.metaAngle, s, carpusTarget;
  for (let it = 0; it < 8; it++) {
    const x = paw.x - FRONT.meta * Math.cos(ma);
    let y = paw.y - FRONT.meta * Math.sin(ma) - lift / 2;
    const toeTip = y + FRONT.meta * Math.sin(ma + carpalFlex) + FRONT.toe * Math.sin(ta + carpalFlex + toeFlex);
    y -= Math.max(0, toeTip - (paw.y + FRONT.toe * Math.sin(ta) - lift / 2));
    carpusTarget = { x, y };
    s = solvePantograph(FRONT, root, carpusTarget);
    ma = angle(sub(s.j3, s.j2)) + FRONT.carpusOffset;
  }
  const frontPaw = add(s.j3, scale(dir(ma + carpalFlex), FRONT.meta));
  const frontToe = add(frontPaw, scale(dir(ta + carpalFlex + toeFlex), FRONT.toe));
  return { scapula: root, shoulder: s.j1, elbow: s.j2, carpus: s.j3, frontPaw, frontToe,
    error: len(sub(s.j3, carpusTarget)) };
}

/** Hindlimb: target is the paw (MTP) point; the metatarsus is part of the pantograph. */
export function solveHind(root, pawTarget, { toeFlex = 0 } = {}) {
  const paw = { x: pawTarget.x, y: pawTarget.y - toeDrop(HIND, toeFlex) };
  const s = solvePantograph(HIND, root, paw);
  const hindToe = add(s.j3, scale(dir(HIND.toeAngle + toeFlex), HIND.toe));
  return { hip: root, stifle: s.j1, hock: s.j2, hindPaw: s.j3, hindToe, error: len(sub(s.j3, paw)) };
}

/** Maximal horizontal paw range around the pivot at ground height (for stride checks). */
export function reach(kind) {
  const solve = kind === 'front' ? (r, p) => solveFront(r, p) : (r, p) => solveHind(r, p);
  const B = kind === 'front' ? LIMB_BIND.front : LIMB_BIND.hind;
  const root = P(kind === 'front' ? B.scapula : B.hip);
  const paw = P(kind === 'front' ? B.frontPaw : B.hindPaw);
  const range = [0, 0];
  for (const sign of [-1, 1]) {
    let ok = 0;
    for (let dx = 0; dx <= 260; dx += 1) {
      if (solve(root, { x: paw.x + sign * dx, y: paw.y }).error > .05) break;
      ok = dx;
    }
    range[sign < 0 ? 0 : 1] = ok;
  }
  return { back: range[0], forward: range[1] };
}

/** Fixed segment lengths per limb, for checks and documentation. */
export const SEGMENTS = Object.freeze([
  ['scapula', 'shoulder', FRONT.La], ['shoulder', 'elbow', FRONT.Lb], ['elbow', 'carpus', FRONT.Lc],
  ['carpus', 'frontPaw', FRONT.meta], ['frontPaw', 'frontToe', FRONT.toe],
  ['hip', 'stifle', HIND.La], ['stifle', 'hock', HIND.Lb], ['hock', 'hindPaw', HIND.Lc],
  ['hindPaw', 'hindToe', HIND.toe],
]);

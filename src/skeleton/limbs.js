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

/** Bind landmarks (neutral stand) of one side. Units: artboard pixels. */
export const LIMB_BIND = Object.freeze({
  front: Object.freeze({
    scapula: [583, 240],  // dorsal scapula = functional pivot of the forelimb
    shoulder: [640, 298], // shoulder joint (point of shoulder)
    elbow: [620, 352],    // at brisket level
    carpus: [626, 446],
    frontPaw: [634, 468], // metacarpophalangeal joint, pad centre
    frontToe: [665, 476],
  }),
  hind: Object.freeze({
    hip: [283, 317],
    stifle: [354, 369],
    hock: [303, 428],
    hindPaw: [318, 470],  // metatarsophalangeal joint, pad centre
    hindToe: [349, 477],
  }),
});

const F = LIMB_BIND.front, H = LIMB_BIND.hind;
export const FRONT = Object.freeze({
  ...pantograph(P(F.scapula), P(F.shoulder), P(F.elbow), P(F.carpus)),
  meta: len(sub(P(F.frontPaw), P(F.carpus))),
  metaAngle: angle(sub(P(F.frontPaw), P(F.carpus))),
  toe: len(sub(P(F.frontToe), P(F.frontPaw))),
  toeAngle: angle(sub(P(F.frontToe), P(F.frontPaw))),
});
export const HIND = Object.freeze({
  ...pantograph(P(H.hip), P(H.stifle), P(H.hock), P(H.hindPaw)),
  toe: len(sub(P(H.hindToe), P(H.hindPaw))),
  toeAngle: angle(sub(P(H.hindToe), P(H.hindPaw))),
});

/** Extra downward reach of the toe tip when toes curl by `flex` (≥0 px). */
function toeDrop(limb, flex) {
  return Math.max(0, limb.toe * (Math.sin(limb.toeAngle + flex) - Math.sin(limb.toeAngle)));
}

/** Forelimb: target is the paw (MCP) point of the extended foot. The carpus is
 * placed where it would be for that paw in stance; `carpalFlex` (radians, ≥0)
 * then folds the metacarpus backwards and upwards about the carpus, as in the
 * swing phase, so the paw trails the carpus. `toeFlex` curls the toes. */
export function solveFront(root, pawTarget, { carpalFlex = 0, toeFlex = 0 } = {}) {
  // Folding must never push paw or toes through the ground: lift by the extra drop.
  const paw = { x: pawTarget.x, y: pawTarget.y - toeDrop(FRONT, carpalFlex + toeFlex) };
  const carpusTarget = { x: paw.x - FRONT.meta * Math.cos(FRONT.metaAngle),
    y: paw.y - FRONT.meta * Math.sin(FRONT.metaAngle + carpalFlex) };
  const s = solvePantograph(FRONT, root, carpusTarget);
  const frontPaw = add(s.j3, scale(dir(FRONT.metaAngle + carpalFlex), FRONT.meta));
  const frontToe = add(frontPaw, scale(dir(FRONT.toeAngle + carpalFlex + toeFlex), FRONT.toe));
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

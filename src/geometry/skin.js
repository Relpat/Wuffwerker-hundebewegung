/** Stage A2 – weighted skinning of the leg regions of the single contour.
 *
 * Every control point of the near front and hind leg is bound ONCE (at module
 * load) to the leg bones of the A1 skeleton plus a "trunk" pseudo-bone. Weights
 * are normalised inverse distances to the bind bones (sum = 1). Per frame each
 * bone contributes a rigid transform (bind → current), and the point is the
 * weighted blend of those transforms (linear blend skinning). The trunk
 * pseudo-bone carries the existing torso/head deformation field, so the leg
 * skin joins the body without a seam.
 */
import { CONTOUR } from './contour.js';
import { JOINTS } from '../skeleton/stand.js';

const P = k => ({ x: JOINTS[k][0], y: JOINTS[k][1] });

/** Leg regions: contour command ranges, bones, and the trunk attachment line. */
export const SKIN_REGIONS = Object.freeze([
  Object.freeze({ name: 'front', commands: [15, 26], attachY: 345,
    bones: [['shoulder', 'elbow'], ['elbow', 'carpus'], ['carpus', 'frontPaw'], ['frontPaw', 'frontToe']] }),
  Object.freeze({ name: 'hind', commands: [27, 40], attachY: 305,
    bones: [['hip', 'stifle', 28], ['stifle', 'hock'], ['hock', 'hindPaw'], ['hindPaw', 'hindToe']] }),
]);

const EXP = 3, EPS = 3;
function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

/** Bind weights per region point: [{cmd, coord, weights:[trunk, bone0, …]}]. */
export function bindWeights(p, region) {
  const trunkDist = Math.max(0, p.y - region.attachY);
  // A bone may carry a muscle radius (third entry): skin within it follows that
  // bone, e.g. the whole thigh follows the femur (needed for sit and down).
  const ds = [trunkDist, ...region.bones.map(([a, b, r = 0]) => Math.max(0, segDist(p, P(a), P(b)) - r))];
  const raw = ds.map(d => 1 / (d + EPS) ** EXP);
  const sum = raw.reduce((s, v) => s + v, 0);
  return raw.map(v => v / sum);
}

/** Anchor points get distance weights; Bézier handles inherit the weights of
 * their own anchor (first handle → previous end point, second handle → this
 * end point), so handles move rigidly with their anchors and curves cannot
 * loop over themselves at strongly bent joints. */
export const BINDINGS = Object.freeze(SKIN_REGIONS.map(region => {
  const points = new Map();
  const at = i => { const c = CONTOUR[i]; return { x: c[c.length - 2], y: c[c.length - 1] }; };
  for (let i = region.commands[0]; i <= region.commands[1]; i++) {
    const [op, ...c] = CONTOUR[i];
    const end = bindWeights(at(i), region);
    if (op === 'C') {
      points.set(`${i}:0`, bindWeights(at(i - 1), region));
      points.set(`${i}:2`, end);
      points.set(`${i}:4`, end);
    } else {
      points.set(`${i}:0`, end);
    }
  }
  return { region, points };
}));

/** Rigid transform of bone a→b from bind to current joints. */
function boneTransform(joints, a, b) {
  const A = P(a), B = P(b), A2 = joints[a], B2 = joints[b];
  const t = Math.atan2(B2.y - A2.y, B2.x - A2.x) - Math.atan2(B.y - A.y, B.x - A.x);
  const c = Math.cos(t), s = Math.sin(t);
  return p => ({ x: A2.x + c * (p.x - A.x) - s * (p.y - A.y), y: A2.y + s * (p.x - A.x) + c * (p.y - A.y) });
}

/** Returns a function (cmdIndex, coordIndex, bindPoint, trunkPoint) → skinned point,
 * or null for points outside the leg regions. */
export function skinner(joints) {
  const transforms = BINDINGS.map(({ region }) => region.bones.map(([a, b]) => boneTransform(joints, a, b)));
  return (i, k, p, trunk) => {
    for (let r = 0; r < BINDINGS.length; r++) {
      const w = BINDINGS[r].points.get(`${i}:${k}`);
      if (!w) continue;
      let x = w[0] * trunk.x, y = w[0] * trunk.y;
      transforms[r].forEach((f, b) => { const q = f(p); x += w[b + 1] * q.x; y += w[b + 1] * q.y; });
      return { x, y };
    }
    return null;
  };
}

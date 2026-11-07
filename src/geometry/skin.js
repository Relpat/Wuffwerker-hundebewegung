/** Stage B1 – linear blend skinning of the whole outline on the whole-body rig.
 *
 * Every anchor of the single contour is bound ONCE to the bones its region
 * may follow (inverse-distance weights, normalised to 1). Per frame every
 * bone contributes a rigid transform (bind → current) taken from its two
 * joints; a point is the weighted blend of those transforms. Bézier handles
 * inherit the weights of their own anchor, so they move rigidly with it.
 */
import { CONTOUR, CONTOUR_REGIONS } from './contour.js';
import { JOINTS } from '../skeleton/stand.js';

const P = k => ({ x: JOINTS[k][0], y: JOINTS[k][1] });

const TRUNK = [['thorax', 'withers'], ['spine', 'thorax'], ['lumbar', 'spine'], ['pelvis', 'lumbar'], ['manubrium', 'sternum']];
const PELVIS = [['pelvis', 'tailRoot'], ['ilium', 'ischium']];
const NECK = [['withers', 'neckBase'], ['neckBase', 'neckMid'], ['neckMid', 'occiput']];
const SKULL = [['occiput', 'nose']];
const JAW = [['jaw', 'chin']];
const TAIL = [['tailRoot', 'tail1'], ['tail1', 'tail2'], ['tail2', 'tail3'], ['tail3', 'tail4'], ['tail4', 'tail5'], ['tail5', 'tailTip']];
// A bone may carry a muscle radius (third entry): skin within it follows
// that bone fully, e.g. the whole thigh follows the femur (needed for the sit).
const FORELEG = [['scapula', 'shoulder'], ['shoulder', 'elbow'], ['elbow', 'carpus'], ['carpus', 'frontPaw'], ['frontPaw', 'frontToe']];
const HINDLEG = [['hip', 'stifle', 26], ['stifle', 'hock'], ['hock', 'hindPaw'], ['hindPaw', 'hindToe']];

/** Region → bones it may follow. */
export const SKIN_REGIONS = Object.freeze({
  tail: [...TAIL, ...PELVIS.slice(0, 1)],
  back: [...TRUNK.slice(0, 4), ...PELVIS, ['withers', 'neckBase']],
  neck: [['thorax', 'withers'], ...NECK, ...SKULL],
  head: [['neckMid', 'occiput'], ...SKULL],
  jaw: [...SKULL, ...JAW],
  throat: [...NECK, ...JAW, ['thorax', 'withers'], ['manubrium', 'sternum'], ['scapula', 'shoulder']],
  front: [...FORELEG, ['manubrium', 'sternum']],
  belly: [...TRUNK],
  hind: [...HINDLEG, ...PELVIS, ['pelvis', 'lumbar']],
  tailUnder: [...TAIL, ...PELVIS],
});

const EXP = 3, EPS = 3;
function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export function bindWeights(p, bones) {
  const raw = bones.map(([a, b, r = 0]) => 1 / (Math.max(0, segDist(p, P(a), P(b)) - r) + EPS) ** EXP);
  const sum = raw.reduce((s, v) => s + v, 0);
  return raw.map(v => v / sum);
}

const regionOf = i => Object.entries(CONTOUR_REGIONS).find(([, [a, b]]) => i >= a && i <= b)?.[0];
const end = i => { const c = CONTOUR[i]; return { x: c[c.length - 2], y: c[c.length - 1] }; };

/** Per command: {region, weights per coordinate pair}. The first handle of a
 * curve inherits the weights of the previous anchor (bound with this
 * command's region), the second handle those of this anchor. */
export const BINDINGS = Object.freeze(CONTOUR.map(([op], i) => {
  if (op === 'Z') return null;
  const region = regionOf(i), bones = SKIN_REGIONS[region];
  const own = bindWeights(end(i), bones);
  if (op !== 'C') return { region, bones, weights: [own] };
  const prev = i > 0 ? bindWeights(end(i - 1), bones) : own;
  return { region, bones, weights: [prev, own, own] };
}));

function boneTransform(joints, a, b) {
  const A = P(a), B = P(b), A2 = joints[a], B2 = joints[b];
  const t = Math.atan2(B2.y - A2.y, B2.x - A2.x) - Math.atan2(B.y - A.y, B.x - A.x);
  const c = Math.cos(t), s = Math.sin(t);
  return p => ({ x: A2.x + c * (p.x - A.x) - s * (p.y - A.y), y: A2.y + s * (p.x - A.x) + c * (p.y - A.y) });
}

/** Skinned contour commands for the posed joints. */
export function skinContour(joints) {
  const cache = new Map();
  const tf = (a, b) => { const k = a + '>' + b; if (!cache.has(k)) cache.set(k, boneTransform(joints, a, b)); return cache.get(k); };
  return CONTOUR.map(([op, ...c], i) => {
    if (op === 'Z') return [op];
    const { bones, weights } = BINDINGS[i];
    const out = [];
    for (let k = 0; k < c.length; k += 2) {
      const w = weights[k / 2], p = { x: c[k], y: c[k + 1] };
      let x = 0, y = 0;
      bones.forEach(([a, b], n) => { if (w[n] < 1e-6) return; const q = tf(a, b)(p); x += w[n] * q.x; y += w[n] * q.y; });
      out.push(x, y);
    }
    return [op, ...out];
  });
}

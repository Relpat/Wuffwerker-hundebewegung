/** Whole-body rig (stage B1): every bone of the trunk, neck, head, jaw,
 * pelvis and tail is a segment of a forward-kinematic chain; the legs hang
 * from it (scapula pivot on the thorax, hip on the pelvis) and are solved by
 * the A1 pantograph IK. All lengths follow Lenny's measures (measures.js).
 *
 * Chain from the root (mid thorax, T8):
 *   forwards:  thorax → withers (T2) → neckBase (C7) → neckMid (C4) → occiput (C1) → nose
 *   (the cervical spine runs in the lower half of the neck: C7 sits low at the
 *   thoracic inlet, the crest above it is muscle and the nuchal ligament)
 *   backwards: thorax → spine (T13) → lumbar (L4) → pelvis (lumbosacral) → tailRoot (sacrum end)
 *              → tail1 … tail5 → tailTip
 * Rigid attachments: scapula pivot, manubrium and sternum ride on the
 * thorax→withers segment; hip, ischium and ilium on the pelvis (sacrum)
 * segment; jaw joint and chin on the skull (plus the jaw opening).
 *
 * A pose is a set of joint rotations (radians, screen orientation: positive =
 * clockwise on screen because y points down) plus a root offset and pitch.
 */
import { LIMB_BIND } from './limbs.js';

export const TRUNK_BIND = Object.freeze({
  thorax: [505, 256], withers: [550, 252], neckBase: [584, 266], neckMid: [606, 226],
  occiput: [640, 176], nose: [748, 203], jaw: [657, 201], chin: [726, 222],
  spine: [463, 257], lumbar: [425, 255], pelvis: [386, 249], tailRoot: [357, 243],
  tail1: [331, 248], tail2: [308, 259], tail3: [289, 276], tail4: [274, 297], tail5: [262, 319], tailTip: [252, 342],
  ilium: [396, 236], ischium: [326, 274], manubrium: [603, 300], sternum: [540, 350],
});

export const FRONT_CHAIN = Object.freeze(['thorax', 'withers', 'neckBase', 'neckMid', 'occiput', 'nose']);
export const REAR_CHAIN = Object.freeze(['thorax', 'spine', 'lumbar', 'pelvis', 'tailRoot', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tailTip']);
/** Rigid attachments: point → the chain segment [from, to] it rides on. */
export const ATTACH = Object.freeze({
  scapula: ['thorax', 'withers'], manubrium: ['thorax', 'withers'], sternum: ['thorax', 'withers'],
  hip: ['pelvis', 'tailRoot'], ischium: ['pelvis', 'tailRoot'], ilium: ['pelvis', 'tailRoot'],
  jaw: ['occiput', 'nose'], chin: ['occiput', 'nose'],
});

export const BIND = Object.freeze({ ...TRUNK_BIND, scapula: LIMB_BIND.front.scapula, hip: LIMB_BIND.hind.hip });

const P = xy => ({ x: xy[0], y: xy[1] });
const rot = (v, a) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) });

/** Neutral pose parameters. Joint angles are keyed by the joint the
 * rotation happens at (it turns everything distal to it). */
export const NEUTRAL = Object.freeze({ x: 0, y: 0, pitch: 0, angles: Object.freeze({}), jawOpen: 0 });

/** Forward kinematics: returns the posed trunk landmarks {name: {x,y}} and,
 * per segment, the frame rotation (for skinning and attachments). */
export function trunkFK(pose = NEUTRAL) {
  const A = pose.angles || {};
  const root = P(BIND.thorax);
  const origin = { x: root.x + (pose.x || 0), y: root.y + (pose.y || 0) };
  const out = { thorax: origin };
  const frame = {}; // segment "a>b" → { rot, from: posed a, bindFrom: bind a }
  for (const chain of [FRONT_CHAIN, REAR_CHAIN]) {
    let r = pose.pitch || 0;
    for (let i = 1; i < chain.length; i++) {
      const a = chain[i - 1], b = chain[i];
      r += A[a] || 0; // rotation at joint a turns segment a→b and beyond
      const v = rot({ x: BIND[b][0] - BIND[a][0], y: BIND[b][1] - BIND[a][1] }, r);
      out[b] = { x: out[a].x + v.x, y: out[a].y + v.y };
      frame[`${a}>${b}`] = { rot: r, from: out[a], bindFrom: P(BIND[a]) };
    }
  }
  for (const [name, [a, b]] of Object.entries(ATTACH)) {
    const f = frame[`${a}>${b}`];
    let rr = f.rot;
    let base = f.from, bindBase = f.bindFrom;
    const v0 = { x: BIND[name][0] - bindBase.x, y: BIND[name][1] - bindBase.y };
    let p = (() => { const v = rot(v0, rr); return { x: base.x + v.x, y: base.y + v.y }; })();
    if ((name === 'chin') && pose.jawOpen) {
      // the jaw opens about the jaw joint
      const j = out.jaw || (() => { const v = rot({ x: BIND.jaw[0] - bindBase.x, y: BIND.jaw[1] - bindBase.y }, rr); return { x: base.x + v.x, y: base.y + v.y }; })();
      const d = rot({ x: p.x - j.x, y: p.y - j.y }, pose.jawOpen);
      p = { x: j.x + d.x, y: j.y + d.y };
    }
    out[name] = p;
  }
  return { joints: out, frame };
}

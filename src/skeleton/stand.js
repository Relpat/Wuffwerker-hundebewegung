/** Landmarks of the whole-body rig in the neutral stand (bind pose).
 * Trunk, neck, head, pelvis and tail come from rig.js; the limbs from
 * limbs.js (Fischer & Lilje pantograph legs). All sizes follow Lenny's
 * measures in cm (measures.js).
 */
import { LIMB_BIND, solveFront, solveHind } from './limbs.js';
import { TRUNK_BIND, FRONT_CHAIN, REAR_CHAIN } from './rig.js';

const round = p => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];

export const JOINTS = Object.freeze({
  ...TRUNK_BIND,
  ...LIMB_BIND.front,
  ...LIMB_BIND.hind,
});

const chainBones = c => c.slice(1).map((b, i) => [c[i], b]);
export const BONES = Object.freeze([
  ...chainBones(FRONT_CHAIN), ...chainBones(REAR_CHAIN),
  ['occiput', 'jaw'], ['jaw', 'chin'], ['ilium', 'ischium'], ['manubrium', 'sternum'],
  ['pelvis', 'hip'], ['hip', 'stifle'], ['stifle', 'hock'], ['hock', 'hindPaw'], ['hindPaw', 'hindToe'],
  ['withers', 'scapula'], ['scapula', 'shoulder'], ['shoulder', 'elbow'], ['elbow', 'carpus'],
  ['carpus', 'frontPaw'], ['frontPaw', 'frontToe'],
]);

/** Far-side limbs: same bones as the near side; the camera (render/camera.js)
 * gives them their depth, so they share the pivots of the near legs.
 * LEGACY_FAR_OFFSET is the old fake side-view offset, kept for comparison. */
export const FAR_OFFSET = Object.freeze({
  front: Object.freeze({ root: 0, paw: 0 }),
  hind: Object.freeze({ root: 0, paw: 0 }),
});
export const LEGACY_FAR_OFFSET = Object.freeze({
  front: Object.freeze({ root: -20, paw: -70 }),
  hind: Object.freeze({ root: 27, paw: 15 }),
});

const F = LIMB_BIND.front, H = LIMB_BIND.hind;
export function makeFarBind(offset = FAR_OFFSET) {
  const farFront = solveFront({ x: F.scapula[0] + offset.front.root, y: F.scapula[1] },
    { x: F.frontPaw[0] + offset.front.paw, y: F.frontPaw[1] });
  const farHind = solveHind({ x: H.hip[0] + offset.hind.root, y: H.hip[1] },
    { x: H.hindPaw[0] + offset.hind.paw, y: H.hindPaw[1] });
  return Object.freeze({
    farScapula: round(farFront.scapula), farShoulder: round(farFront.shoulder), farElbow: round(farFront.elbow),
    farCarpus: round(farFront.carpus), farFrontPaw: round(farFront.frontPaw), farFrontToe: round(farFront.frontToe),
    farHip: round(farHind.hip), farStifle: round(farHind.stifle), farHock: round(farHind.hock),
    farHindPaw: round(farHind.hindPaw), farHindToe: round(farHind.hindToe),
  });
}
export const FAR_BIND = makeFarBind(FAR_OFFSET);
export const TRUE_FAR_BIND = FAR_BIND;
export const LEGACY_FAR_BIND = makeFarBind(LEGACY_FAR_OFFSET);

export const FAR_BONES = Object.freeze([
  ['pelvis', 'farHip'], ['farHip', 'farStifle'], ['farStifle', 'farHock'], ['farHock', 'farHindPaw'], ['farHindPaw', 'farHindToe'],
  ['withers', 'farScapula'], ['farScapula', 'farShoulder'], ['farShoulder', 'farElbow'], ['farElbow', 'farCarpus'],
  ['farCarpus', 'farFrontPaw'], ['farFrontPaw', 'farFrontToe'],
]);

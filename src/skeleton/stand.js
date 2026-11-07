/** Landmarks in the contour's neutral bind space (stage A1 limb skeleton).
 * Limb joints come from LIMB_BIND (see limbs.js, after Fischer & Lilje 2011):
 * scapula pivot → shoulder → elbow → carpus → paw → toe, and
 * hip → stifle → hock → paw → toe. Trunk/head/tail landmarks are unchanged.
 */
import { LIMB_BIND, solveFront, solveHind } from './limbs.js';

const round = p => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100];

export const JOINTS = Object.freeze({
  tailTip: [133, 276], tailRoot: [243, 250],
  pelvis: [275, 258],
  spine: [439, 267], withers: [562, 257],
  neckBase: [645, 214], occiput: [700, 166], jaw: [739, 206],
  ...LIMB_BIND.front,
  ...LIMB_BIND.hind,
});

export const BONES = Object.freeze([
  ['tailTip', 'tailRoot'], ['tailRoot', 'pelvis'],
  ['pelvis', 'spine'], ['spine', 'withers'],
  ['withers', 'neckBase'], ['neckBase', 'occiput'], ['occiput', 'jaw'],
  ['pelvis', 'hip'], ['hip', 'stifle'], ['stifle', 'hock'], ['hock', 'hindPaw'], ['hindPaw', 'hindToe'],
  ['withers', 'scapula'], ['scapula', 'shoulder'], ['shoulder', 'elbow'], ['elbow', 'carpus'],
  ['carpus', 'frontPaw'], ['frontPaw', 'frontToe'],
]);

/** Far-side limbs: same bone lengths as the near side (no miniaturisation).
 * Since the camera (src/render/camera.js) gives the far side real depth, the
 * far legs need no horizontal fake offset any more (Patrick, 07.11.2026).
 * LEGACY_FAR_OFFSET is the old pure side-view offset, kept for comparison.
 */
export const FAR_OFFSET = Object.freeze({
  front: Object.freeze({ root: 0, paw: 0 }),
  hind: Object.freeze({ root: 0, paw: 0 }),
});
export const LEGACY_FAR_OFFSET = Object.freeze({
  front: Object.freeze({ root: -20, paw: -70 }),
  hind: Object.freeze({ root: 27, paw: 15 }),
});

const F = LIMB_BIND.front, H = LIMB_BIND.hind;
/** Far-side bind for given horizontal offsets. With a camera (src/render/camera.js)
 * the far legs need no fake offset: use TRUE_FAR_BIND and give them depth. */
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

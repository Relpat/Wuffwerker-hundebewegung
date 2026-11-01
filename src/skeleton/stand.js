/** Landmarks in the contour's neutral bind space. Static pose and four-leg gait guides.
 * Connections are anatomical guides, not a working IK rig or skinned bones.
 */
export const JOINTS = Object.freeze({
  tailTip: [133, 276], tailRoot: [243, 250],
  pelvis: [275, 258], hip: [283, 317],
  spine: [439, 267], withers: [562, 257],
  neckBase: [645, 214], occiput: [700, 166], jaw: [739, 206],
  shoulder: [620, 314], elbow: [629, 390], carpus: [632, 457], frontPaw: [649, 474],
  stifle: [354, 369], hock: [311, 424], hindPaw: [328, 472],
});

export const BONES = Object.freeze([
  ['tailTip', 'tailRoot'], ['tailRoot', 'pelvis'],
  ['pelvis', 'spine'], ['spine', 'withers'],
  ['withers', 'neckBase'], ['neckBase', 'occiput'], ['occiput', 'jaw'],
  ['pelvis', 'hip'], ['hip', 'stifle'], ['stifle', 'hock'], ['hock', 'hindPaw'],
  ['withers', 'shoulder'], ['shoulder', 'elbow'], ['elbow', 'carpus'], ['carpus', 'frontPaw'],
]);

/** Far-side appendages are deeper in the image; only their unoccluded parts
 * are drawn behind the united near-side silhouette. These points are guides,
 * not four separate torso outlines or a weighted skinning mesh.
 * Horizontal offsets make the far feet distinguishable in side view, but the
 * roots share the near-side heights and the same full-sized bone lengths.
 * Distal landmarks approximate the neutral pose from solveLeg (not scaled mini-limbs).
 */
export const FAR_BIND = Object.freeze({
  farHip: [310,317], farStifle: [374.42,359.18], farHock: [348,424], farHindPaw: [365,472],
  farShoulder: [595,314], farElbow: [551.68,381.26], farCarpus: [563.78,454.52], farFrontPaw: [567,474],
});
export const FAR_BONES = Object.freeze([
  ['pelvis','farHip'],['farHip','farStifle'],['farStifle','farHock'],['farHock','farHindPaw'],
  ['withers','farShoulder'],['farShoulder','farElbow'],['farElbow','farCarpus'],['farCarpus','farFrontPaw'],
]);

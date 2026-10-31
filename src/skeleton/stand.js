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
 * Offsets make the hind/far and front/far feet distinguishable in side view.
 */
export const FAR_BIND = Object.freeze({
  farHip: [298,317], farStifle: [345,368], farHock: [348,424], farHindPaw: [365,472],
  farShoulder: [606,314], farElbow: [595,394], farCarpus: [590,456], farFrontPaw: [590,474],
});
export const FAR_BONES = Object.freeze([
  ['pelvis','farHip'],['farHip','farStifle'],['farStifle','farHock'],['farHock','farHindPaw'],
  ['withers','farShoulder'],['farShoulder','farElbow'],['farElbow','farCarpus'],['farCarpus','farFrontPaw'],
]);

/** Static, neutral reference contour. +x = forward, +y = down, in a 960x560 artboard.
 * A single closed outline includes tail, haunches, visible legs, torso, neck, and head.
 * This is NOT a skinned mesh: no bone weights, deformation, or animation yet.
 */
export const ARTBOARD = Object.freeze({ width: 960, height: 560, groundY: 483 });

export const CONTOUR = Object.freeze([
  ['M', 128, 269],
  ['C', 164, 254, 201, 243, 248, 235], // tail upper edge → pelvis
  ['C', 270, 216, 295, 211, 332, 217],
  ['C', 392, 218, 465, 217, 535, 215], // back
  ['C', 565, 211, 583, 201, 598, 192], // withers
  ['C', 626, 185, 639, 169, 654, 156], // upper neck
  ['C', 668, 146, 681, 136, 702, 139], // occiput
  ['C', 728, 132, 745, 139, 761, 152], // cranium
  ['C', 775, 154, 795, 155, 819, 162], // muzzle
  ['C', 829, 165, 834, 170, 835, 179],
  ['C', 836, 188, 829, 195, 816, 196],
  ['C', 798, 200, 786, 204, 772, 208],
  ['C', 758, 223, 744, 226, 727, 221], // lower jaw
  ['C', 699, 221, 681, 237, 671, 258], // throat
  // Forelimb (A2.3, shaped after the muscles over the A1 bones):
  ['C', 664, 276, 652, 292, 648, 306], // forechest → point of shoulder
  ['C', 642, 322, 618, 345, 609, 368], // front of the upper arm (biceps/brachiocephalicus)
  ['C', 607, 382, 608, 398, 606, 412], // forearm front: extensor bulge
  ['C', 604, 426, 601, 438, 602, 446], // tapers to the carpus (tendons only)
  ['C', 603, 454, 607, 461, 612, 464], // front of the pastern
  ['C', 622, 466, 636, 469, 640, 476], // toes
  ['C', 643, 481, 640, 483, 632, 483], // toe tip
  ['L', 586, 483],                     // main pad on the ground
  ['C', 579, 483, 577, 479, 579, 474],
  ['C', 581, 467, 579, 458, 574, 452], // back of the pastern
  ['C', 571, 447, 573, 438, 573, 430], // carpal pad (accessory carpal bone)
  ['C', 573, 410, 568, 388, 566, 372], // forearm back: flexors widen towards the elbow
  ['C', 564, 352, 530, 347, 495, 346], // point of the elbow (olecranon) → triceps → brisket
  ['C', 474, 347, 441, 340, 406, 330], // tuck-up
  // Hindlimb:
  ['C', 392, 334, 368, 342, 352, 358], // flank fold to the stifle
  ['C', 343, 366, 340, 374, 339, 384], // stifle (patella), most forward point
  ['C', 337, 398, 324, 418, 316, 436], // front of the lower thigh (slim, tibia)
  ['C', 313, 446, 322, 458, 330, 462], // front of the hock and metatarsus
  ['C', 340, 466, 352, 469, 360, 473], // toes
  ['C', 368, 477, 366, 483, 356, 483], // toe tip
  ['L', 308, 483],                     // pads on the ground
  ['C', 298, 483, 294, 479, 297, 471],
  ['C', 299, 462, 292, 448, 288, 438], // back of the metatarsus → point of hock
  ['C', 286, 431, 291, 424, 290, 414], // Achilles tendon (narrow)
  ['C', 289, 402, 281, 392, 279, 378], // gaskin (gastrocnemius) bulge
  ['C', 276, 358, 262, 338, 252, 318], // back of the thigh (semitendinosus)
  ['C', 245, 302, 243, 293, 244, 284], // point of the buttock
  ['C', 240, 276, 233, 269, 221, 270], // tail underside
  ['C', 193, 273, 164, 282, 135, 286],
  ['C', 122, 289, 119, 280, 128, 269],
  ['Z'],
]);

export function traceContour(graphics, commands = CONTOUR) {
  for (const [op, ...p] of commands) {
    if (op === 'M') graphics.moveTo(...p);
    else if (op === 'L') graphics.lineTo(...p);
    else if (op === 'C') graphics.bezierCurveTo(...p);
    else if (op === 'Z') graphics.closePath();
    else throw new Error(`Unknown contour command: ${op}`);
  }
  return graphics;
}

/** Flatten the path for geometry checks. This is not used to render the outline. */
export function sampleContour(commands = CONTOUR, steps = 16) {
  const points = [];
  let from;
  for (const [op, ...a] of commands) {
    if (op === 'M') { from = { x: a[0], y: a[1] }; points.push(from); }
    if (op === 'L') { from = { x: a[0], y: a[1] }; points.push(from); }
    if (op === 'C') {
      const [x1,y1,x2,y2,x3,y3] = a;
      const prev = from;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, q = 1 - t;
        points.push({
          x: q*q*q*prev.x + 3*q*q*t*x1 + 3*q*t*t*x2 + t*t*t*x3,
          y: q*q*q*prev.y + 3*q*q*t*y1 + 3*q*t*t*y2 + t*t*t*y3,
        });
      }
      from = { x: x3, y: y3 };
    }
  }
  return points;
}

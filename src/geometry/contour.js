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
  ['C', 660, 284, 652, 305, 650, 333], // forechest
  ['C', 650, 368, 647, 414, 647, 456], // front foreleg
  ['C', 647, 467, 657, 471, 668, 471],
  ['C', 678, 473, 679, 483, 668, 483], // forepaw
  ['L', 618, 483],
  ['C', 611, 483, 607, 479, 610, 471],
  ['C', 614, 449, 618, 416, 615, 388],
  ['C', 610, 366, 606, 354, 592, 339],
  ['C', 571, 343, 545, 346, 513, 345], // chest → abdomen
  ['C', 474, 347, 441, 340, 406, 330], // tuck-up
  ['C', 392, 335, 382, 343, 377, 354],
  ['C', 366, 371, 372, 387, 359, 400], // stifle
  ['C', 351, 413, 337, 421, 321, 431], // hock
  ['C', 325, 446, 329, 457, 331, 465],
  ['C', 338, 471, 350, 472, 360, 473],
  ['C', 369, 477, 367, 483, 356, 483], // hind paw
  ['L', 309, 483],
  ['C', 293, 481, 290, 477, 293, 464],
  ['L', 291, 428],
  ['C', 290, 408, 288, 396, 280, 381],
  ['C', 274, 365, 269, 349, 263, 328],
  ['C', 258, 315, 251, 299, 248, 287], // haunch
  ['C', 239, 275, 233, 269, 221, 270], // tail underside
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

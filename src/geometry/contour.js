/** Static, neutral reference contour. +x = forward, +y = down, in a 960x560 artboard.
 * A single closed outline includes tail, haunches, visible legs, torso, neck, and head.
 * It is skinned to the whole-body rig in skin.js.
 */
export const ARTBOARD = Object.freeze({ width: 960, height: 560, groundY: 483 });

/** Outline parts in drawing order. Each part names the skin region that
 * binds it to the whole-body rig (see skin.js). Stage B1: drawn around the
 * skeleton built from Lenny's measures (Lagotto, 45 cm, nearly square body). */
export const CONTOUR_PARTS = Object.freeze([
  ['tail', [
    ['M', 249, 350],
    ['C', 244, 333, 253, 305, 266, 290],   // outer edge of the hanging tail
    ['C', 279, 272, 290, 258, 302, 250],
    ['C', 318, 239, 336, 232, 356, 230],   // tail set
  ]],
  ['back', [
    ['C', 372, 222, 385, 216, 400, 214],   // croup
    ['C', 430, 212, 470, 212, 505, 209],   // loin and back
    ['C', 525, 207, 540, 204, 553, 203],   // withers
  ]],
  ['neck', [
    ['C', 575, 199, 598, 186, 615, 170],   // crest of the neck
    ['C', 625, 160, 633, 154, 643, 151],   // poll
  ]],
  ['head', [
    ['C', 656, 143, 683, 142, 698, 156],   // rounded skull
    ['C', 704, 162, 709, 168, 718, 172],   // moderate stop
    ['C', 732, 177, 745, 182, 755, 189],   // muzzle, straight bridge
    ['C', 762, 194, 763, 204, 756, 208],   // nose
    ['C', 750, 212, 744, 214, 740, 215],   // upper lip
  ]],
  ['jaw', [
    ['C', 736, 221, 730, 226, 721, 227],   // chin (beard)
    ['C', 705, 230, 688, 231, 676, 228],   // lower jaw
  ]],
  ['throat', [
    ['C', 660, 230, 646, 236, 637, 246],   // throat
    ['C', 627, 258, 620, 272, 619, 285],   // underside of the neck
    ['C', 619, 294, 623, 303, 621, 311],   // forechest in front of the point of shoulder
  ]],
  ['front', [
    ['C', 617, 325, 590, 342, 572, 356],   // front of the upper arm
    ['C', 566, 364, 568, 378, 567, 392],   // forearm front, extensor bulge
    ['C', 566, 410, 561, 426, 560, 438],   // tapers to the carpus
    ['C', 560, 448, 565, 457, 572, 462],   // pastern front
    ['C', 581, 466, 591, 469, 597, 474],   // toes
    ['C', 601, 478, 599, 483, 592, 483],   // toe tip
    ['L', 553, 483],                       // main pad
    ['C', 547, 483, 545, 479, 547, 474],
    ['C', 548, 467, 545, 457, 540, 451],   // back of the pastern
    ['C', 536, 446, 537, 438, 538, 430],   // carpal pad
    ['C', 538, 410, 533, 388, 531, 372],   // forearm back (flexors)
    ['C', 530, 362, 528, 357, 520, 356],   // point of the elbow
  ]],
  ['belly', [
    ['C', 500, 357, 478, 354, 460, 349],   // brisket → belly
    ['C', 445, 345, 433, 336, 424, 330],   // tuck-up
  ]],
  ['hind', [
    ['C', 418, 328, 413, 327, 410, 331],   // flank fold to the stifle
    ['C', 393, 348, 387, 359, 378, 372],   // stifle (patella), front of the lower thigh
    ['C', 367, 388, 356, 402, 351, 414],   // lower thigh, slim front
    ['C', 348, 426, 354, 440, 356, 452],   // front of hock and metatarsus
    ['C', 358, 459, 364, 463, 370, 465],
    ['C', 377, 467, 384, 471, 387, 476],   // toes
    ['C', 389, 481, 386, 483, 380, 483],   // toe tip
    ['L', 340, 483],                       // pads
    ['C', 333, 483, 331, 479, 333, 473],
    ['C', 334, 462, 329, 439, 328, 423],   // back of the metatarsus
    ['C', 327, 417, 325, 413, 325, 408],   // point of hock (calcaneus)
    ['C', 326, 399, 333, 391, 333, 379],   // Achilles tendon → gaskin
    ['C', 333, 363, 331, 345, 325, 329],   // gaskin, back of the thigh
    ['C', 318, 313, 315, 302, 315, 287],   // thigh (semitendinosus)
  ]],
  ['tailUnder', [
    ['C', 317, 280, 320, 271, 326, 264],   // point of the buttock (follows the pelvis)
    ['C', 321, 262, 315, 265, 310, 268],   // tail meets the rump
    ['C', 298, 277, 287, 291, 279, 306],   // inner edge of the tail
    ['C', 271, 321, 263, 337, 256, 349],
    ['C', 254, 354, 250.5, 355, 249, 350],   // tip (smooth into the outer edge)
  ]],
]);

export const CONTOUR = Object.freeze([...CONTOUR_PARTS.flatMap(([, cmds]) => cmds), ['Z']]);
/** Command index range [first, last] of each part. */
export const CONTOUR_REGIONS = Object.freeze((() => {
  const out = {}; let i = 0;
  for (const [name, cmds] of CONTOUR_PARTS) { out[name] = Object.freeze([i, i + cmds.length - 1]); i += cmds.length; }
  return out;
})());

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

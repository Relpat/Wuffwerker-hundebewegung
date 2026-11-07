/** Lenny's body measures in centimetres and their conversion to pixels.
 *
 * Lenny is a Lagotto Romagnolo, about 45 cm at the withers (FCI standard:
 * males 43–48 cm, females 41–46 cm). The artboard shows the withers at
 * 278 px above the floor, so 1 cm = 278 / 45 ≈ 6.18 px.
 *
 * Sources and how the values were chosen (checked 07.11.2026):
 *  - FCI standard No. 298 (Lagotto Romagnolo): height 43–48 cm, square body,
 *    head 40 % of the withers height, forearm ≈ 1/3, elbow at ≈ 56 % (elbow
 *    point), scapula 52–55° laid back, shoulder 110–115°, pastern 75–80°,
 *    stifle 130–135°, hock ≈ 140°. Its "shoulder blade 30 %", "upper thigh
 *    35 %" and "lower thigh 36 %" are judging measures on the live dog
 *    between palpable points, not bone lengths: taken literally the hind leg
 *    could not fit under the hip, so they are only used as an upper bound.
 *  - Fischer & Lilje, "Dogs in Motion" (327 dogs, 32 breeds): forelimb
 *    proportions are nearly identical across breeds, humerus ≈ 27 %.
 *  - Ontogenetic allometry of the Beagle (Fischer et al., adult 44–52 cm):
 *    forelimb sc/br/ab/ma = 28/25/27.5/19.6 %, hindlimb fe/cr/pes =
 *    36/34/30 %.
 *  - Mounted dog skeleton photo (Patrick, 07.11.2026) for the remaining
 *    segments, normalised to 45 cm.
 * The scapula was lengthened (11.5 → 13 cm) and femur ≈ tibia set as a
 * middle between FCI and the Beagle data.
 */
export const WITHERS_CM = 45;
export const WITHERS_PX = 278;
export const PX_PER_CM = WITHERS_PX / WITHERS_CM;
export const GROUND_Y = 483;

/** Segment lengths in cm (name: [cm, note]). */
export const MEASURES_CM = Object.freeze({
  scapula:    [13.0, 'Schulterblatt (oberer Rand → Schultergelenk)'],
  humerus:    [12.6, 'Oberarm (Schultergelenk → Ellbogen)'],
  forearm:    [15.0, 'Unterarm, Elle/Speiche (Ellbogen → Handwurzel)'],
  metacarpus: [5.2,  'Vordermittelfuß (Handwurzel → Ballen)'],
  frontToes:  [4.9,  'Zehen vorn (Ballen → Zehenspitze)'],
  femur:      [14.0, 'Oberschenkel (Hüfte → Knie)'],
  tibia:      [14.5, 'Unterschenkel (Knie → Sprunggelenk)'],
  metatarsus: [8.7,  'Fußwurzel + Mittelfuß (Sprunggelenk → Ballen)'],
  hindToes:   [5.0,  'Zehen hinten (Ballen → Zehenspitze)'],
  head:       [18.0, 'Kopf (Hinterhaupt → Nasenspitze), 40 % der Widerristhöhe'],
  neck:       [11.0, 'Halswirbelsäule (Atlas → 7. Halswirbel)'],
  back:       [26.0, 'Brust- und Lendenwirbelsäule (Widerrist → Kreuzbein)'],
  tail:       [25.0, 'Rute'],
  bodyLength: [47.0, 'Körperlänge (Bugspitze → Sitzbeinhöcker), ≈ Widerristhöhe'],
  chestDepth: [22.5, 'Brusttiefe (Widerrist → Brustbein), ≈ 50 %'],
});

export const px = name => MEASURES_CM[name][0] * PX_PER_CM;

/** Standing directions of the limb segments in degrees (0° = forward,
 * 90° = straight down; screen y points down). */
export const STAND_DIRECTIONS = Object.freeze({
  scapula: 55, humerus: 125, forearm: 87, metacarpus: 75, frontToes: 14,
  femur: 68, tibia: 116, metatarsus: 80, hindToes: 13,
});

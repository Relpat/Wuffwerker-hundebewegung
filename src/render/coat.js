/** Coat layer: Lenny's curly Lagotto coat as an even layer around the
 * muscle silhouette. It is drawn, not skinned: the outline is stroked with
 * twice the coat thickness in the coat colour (round joins), so the coat
 * follows every pose without new geometry and can never fold. Below the
 * floor the stroke is clipped, the pads stand on the ground.
 * Patrick chose 1.5 cm (07.11.2026); 0 shows the bare anatomical shape. */
import { PX_PER_CM } from '../skeleton/measures.js';

export const COAT_CM = 1.5;
export const MAX_COAT_CM = 3;
/** Coat thickness in artboard pixels. */
export const coatPx = (cm = COAT_CM) => Math.max(0, Math.min(MAX_COAT_CM, cm)) * PX_PER_CM;

/** Builds a full pose: whole-body FK for the trunk (rig.js), then the four
 * legs by pantograph IK from the posed scapula and hip pivots. */
import { JOINTS, FAR_BIND as DEFAULT_FAR_BIND } from '../skeleton/stand.js';
import { trunkFK } from '../skeleton/rig.js';

const P = xy => ({ x: xy[0], y: xy[1] });

/** Joints with the trunk posed and the leg pivots placed (legs still in bind). */
export function posedTrunk(trunk, FAR_BIND = DEFAULT_FAR_BIND) {
  const joints = Object.fromEntries(Object.entries({ ...JOINTS, ...FAR_BIND }).map(([k, v]) => [k, P(v)]));
  const { joints: t } = trunkFK(trunk);
  Object.assign(joints, t);
  // Far pivots ride with the near ones (plus any legacy fake offset).
  for (const [far, near] of [['farScapula', 'scapula'], ['farHip', 'hip']]) {
    joints[far] = { x: t[near].x + FAR_BIND[far][0] - JOINTS[near][0], y: t[near].y + FAR_BIND[far][1] - JOINTS[near][1] };
  }
  return joints;
}

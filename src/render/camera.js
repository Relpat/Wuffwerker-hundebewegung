/** Simple orthographic camera for the side-view rig.
 *
 * World: x forward, y down, z away from the viewer (near side z = 0, far side
 * z = depth ≈ body width). `pitch` tilts the camera down (looking from above),
 * `yaw` turns it towards the dog's front. Farther points appear higher on
 * screen (the floor recedes) — as in the wuffwerk scenes with horizon and
 * vanishing point. Origin: body centre on the ground line.
 */
export const DEFAULT_CAMERA = Object.freeze({ pitch: 0, yaw: 0, depth: 0, origin: [480, 483] });

export function projector({ pitch = 0, yaw = 0, origin = DEFAULT_CAMERA.origin } = {}) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const [ox, oy] = origin;
  return (x, y, z = 0) => {
    const X = x - ox, Y = y - oy;
    const sx = X * cy + z * sy;
    const depth = -X * sy + z * cy;
    return { x: ox + sx, y: oy + Y * cp - depth * sp };
  };
}

export const projectCommands = (cmds, project, z = 0) => cmds.map(([op, ...p]) => {
  const out = [];
  for (let k = 0; k < p.length; k += 2) { const q = project(p[k], p[k + 1], z); out.push(q.x, q.y); }
  return [op, ...out];
});

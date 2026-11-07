/** Pure SVG output of a pose (no PixiJS). Seed of the later SVG generator. */
import { contourAt } from '../src/geometry/animated-contour.js';
import { farContours } from '../src/geometry/far-limbs.js';
import { BONES, FAR_BONES } from '../src/skeleton/stand.js';

const r = v => +v.toFixed(1);
export const pathData = cmds => cmds.map(([op, ...p]) => op + p.map(r).join(' ')).join('');

export function poseSvg(pose, { skeleton = true, skin = true, title = '', view = [60, 120, 840, 380] } = {}) {
  const [vx, vy, vw, vh] = view;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(' ')}">`;
  s += `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#f6f1ea"/>`;
  s += `<line x1="${vx + 10}" x2="${vx + vw - 10}" y1="483" y2="483" stroke="#c3b7a6" stroke-width="2"/>`;
  if (skin) {
    const far = farContours(pose);
    for (const c of [far.hind, far.front]) s += `<path d="${pathData(c)}" fill="#956b50" opacity="${skeleton ? .35 : 1}"/>`;
    s += `<path d="${pathData(contourAt(pose))}" fill="#a87554" opacity="${skeleton ? .35 : 1}"/>`;
  }
  if (skeleton) {
    const line = (list, color, w) => list.map(([a, b]) => {
      const p = pose.joints[a], q = pose.joints[b];
      return `<line x1="${r(p.x)}" y1="${r(p.y)}" x2="${r(q.x)}" y2="${r(q.y)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    }).join('');
    s += line(FAR_BONES, '#7d93a6', 6) + line(BONES, '#26334a', 7);
    for (const [name, p] of Object.entries(pose.joints)) {
      const isFar = name.startsWith('far');
      s += `<circle cx="${r(p.x)}" cy="${r(p.y)}" r="${isFar ? 3.5 : 4.5}" fill="${isFar ? '#dfe7ee' : '#e1ec93'}" stroke="#26334a" stroke-width="1"/>`;
    }
  }
  if (title) s += `<text x="${vx + 14}" y="${vy + 30}" font-family="sans-serif" font-size="24" font-weight="700" fill="#26334a">${title}</text>`;
  return s + '</svg>';
}

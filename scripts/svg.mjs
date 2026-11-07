/** Pure SVG output of a pose (no PixiJS). Seed of the later SVG generator. */
import { contourAt } from '../src/geometry/animated-contour.js';
import { farContours } from '../src/geometry/far-limbs.js';
import { BONES, FAR_BONES } from '../src/skeleton/stand.js';
import { projector, projectCommands, DEFAULT_VIEW } from '../src/render/camera.js';
import { coatPx, COAT_CM } from '../src/render/coat.js';

const r = v => +v.toFixed(1);
export const pathData = cmds => cmds.map(([op, ...p]) => op + p.map(r).join(' ')).join('');

export function poseSvg(pose, { skeleton = true, skin = true, title = '', view = [60, 120, 840, 380], camera = DEFAULT_VIEW, coat = COAT_CM } = {}) {
  const depth = camera?.depth || 0;
  const project = projector(camera || {});
  // Far legs at full depth, the spine/head/tail on the midline, near legs in front.
  const zOf = name => name.startsWith('far') ? depth : /^(tail|pelvis|spine|withers|neck|occiput|jaw|thorax|lumbar|nose|chin|ilium|ischium|manubrium|sternum)/.test(name) ? depth / 2 : 0;
  const J = Object.fromEntries(Object.entries(pose.joints).map(([n, p]) => [n, project(p.x, p.y, zOf(n))]));
  const [vx, vy, vw, vh] = view;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view.join(' ')}">`;
  s += `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#f6f1ea"/>`;
  if (camera) {
    const a = project(vx + 10, 483, -12), b = project(vx + vw - 10, 483, -12), c = project(vx + vw - 10, 483, depth + 12), d = project(vx + 10, 483, depth + 12);
    s += `<path d="M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}L${r(c.x)} ${r(c.y)}L${r(d.x)} ${r(d.y)}Z" fill="#ebe2d4"/>`;
  }
  { const a = project(vx + 10, 483, 0), b = project(vx + vw - 10, 483, 0);
    s += `<line x1="${r(a.x)}" x2="${r(b.x)}" y1="${r(a.y)}" y2="${r(b.y)}" stroke="#c3b7a6" stroke-width="2"/>`; }
  if (skin) {
    const far = farContours(pose);
    const c = coatPx(coat);
    // Coat: the outline stroked with twice the coat thickness, clipped at the
    // layer's own ground line so the pads stay on the floor.
    const groundAt = z => { const a = project(vx, 483, z), b = project(vx + vw, 483, z); return Math.min(a.y, b.y); };
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    s += `<defs><clipPath id="${id}f"><rect x="${vx}" y="${vy}" width="${vw}" height="${r(groundAt(depth) - vy)}"/></clipPath><clipPath id="${id}n"><rect x="${vx}" y="${vy}" width="${vw}" height="${r(groundAt(0) - vy)}"/></clipPath></defs>`;
    const shape = (d, color, clip) => `<path d="${d}" fill="${color}"${c > 0 ? ` stroke="${color}" stroke-width="${r(2 * c)}" stroke-linejoin="round"` : ''} clip-path="url(#${clip})"/>`;
    const op = skeleton ? .35 : 1;
    s += `<g opacity="${op}">`;
    for (const k of [far.hind, far.front]) s += shape(pathData(projectCommands(k, project, depth)), '#956b50', id + 'f');
    s += shape(pathData(projectCommands(contourAt(pose), project, 0)), '#a87554', id + 'n');
    s += '</g>';
  }
  if (skeleton) {
    const line = (list, color, w) => list.map(([a, b]) => {
      const p = J[a], q = J[b];
      return `<line x1="${r(p.x)}" y1="${r(p.y)}" x2="${r(q.x)}" y2="${r(q.y)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
    }).join('');
    s += line(FAR_BONES, '#7d93a6', 6) + line(BONES, '#26334a', 7);
    for (const [name, p] of Object.entries(J)) {
      const isFar = name.startsWith('far');
      s += `<circle cx="${r(p.x)}" cy="${r(p.y)}" r="${isFar ? 3.5 : 4.5}" fill="${isFar ? '#dfe7ee' : '#e1ec93'}" stroke="#26334a" stroke-width="1"/>`;
    }
  }
  if (title) s += `<text x="${vx + 14}" y="${vy + 30}" font-family="sans-serif" font-size="24" font-weight="700" fill="#26334a">${title}</text>`;
  return s + '</svg>';
}

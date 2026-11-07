/** Stage G2 – Lenny look: the rig pose drawn in the wuffwerk style.
 *
 * Style rules of the wuffwerk Baukasten (docs/08, bildstil):
 *   - no outlines; shapes are flat fills, depth comes from draw order and a
 *     slightly darker colour for everything on the far side,
 *   - curly coat edge ("wolke", same as Lenny's head on wuffwerker.de),
 *   - depth order: shadow → far legs → far ear side … → body (with the near
 *     legs) → near-leg shading → head → ear (near ear is part of the head).
 *   - the head is Lenny's Baukasten head (half profile with mimik, "Kopf A").
 *     This module only computes where it sits (`kopfAnker`); the caller
 *     draws it (wuffwerk: bausteine.lenny). A simple stand-in head is used
 *     when no head function is given (tests, rig previews without wuffwerk).
 *
 * Output: layers as plain data (paths + fills), so the website can store
 * them as JSON and draw them without any rig code (stage G3).
 */
import { contourAt } from '../geometry/animated-contour.js';
import { sampleContour } from '../geometry/contour.js';
import { farContours, nearContours } from '../geometry/far-limbs.js';
import { projector, projectCommands, DEFAULT_VIEW } from './camera.js';
import { wolke, flaeche } from './formen.js';
import { ARTBOARD } from '../geometry/contour.js';

/** Lenny's colours, same values as wuffwerk site/illustrationen/stil.mjs. */
export const LENNY_FARBEN = Object.freeze({
  fell: '#F6EBDB', fellFern: '#E6D3B8', fellSchatten: '#ECDDC8',
  fellOhr: '#EBCFA8', fellOhrDunkel: '#D9B48A', fellBart: '#D2A374',
  nase: '#6B3B32', navy: '#26334A', creme: '#FFFBF2',
});
/** Second dog (dark coat), same as Baustein hund fell "dunkel". */
export const DUNKEL_FARBEN = Object.freeze({
  ...LENNY_FARBEN, fell: '#9A7A62', fellFern: '#7E6250', fellSchatten: '#8A6C56',
  fellOhr: '#6E5444', fellOhrDunkel: '#5A4436', fellBart: '#5A4436',
});

/** Mimik per preset (Baukasten mimiken), unless the pose says otherwise. */
const MIMIK = Object.freeze({
  locker: 'freundlich', sitz: 'freundlich', platz: 'freundlich', pfote: 'freude',
  spielverbeugung: 'freude', schnueffeln: 'konzentriert', starr: 'starr', angst: 'angst',
  wegsehen: 'wegsehen', schlafen: 'schlafen',
});

const r1 = v => Math.round(v * 10) / 10;
const GROUND = ARTBOARD.groundY;

/** Contour commands → dense point list (clockwise on screen). */
function points(cmds, steps = 8) {
  const pts = sampleContour(cmds, steps).map(p => [p.x, p.y]);
  return flaeche(pts) < 0 ? pts.reverse() : pts;
}

/** Bumpy coat outline around a contour. `bogen` = distance of the curls. */
const fell = (cmds, bogen) => wolke(points(cmds), bogen, { glaetten: false });
/** Plain SVG path data of contour commands; `reverse` is not needed for
 * evenodd, the flag only documents that the second path cuts the first. */
const pathData = cmds => cmds.map(([op, ...p]) => op + p.map(r1).join(' ')).join('');

/** Where the Baukasten head sits: nose tip, rotation, scale. The Baukasten
 * head faces left with its nose at (0,0), ~250 units from nose to the back
 * of the skull; Lenny here faces right, so it is mirrored. */
export function headAnchor(pose, project) {
  const j = pose.joints;
  const z = (DEFAULT_VIEW.depth || 0) / 2;
  const o = project(j.occiput.x, j.occiput.y, z), n = project(j.nose.x, j.nose.y, z);
  const len = Math.hypot(n.x - o.x, n.y - o.y);
  const ang = Math.atan2(n.y - o.y, n.x - o.x) * 180 / Math.PI;
  const zurueck = !!pose.render?.kopfZurueck;
  const s = len / 250;
  if (!zurueck) return { x: r1(n.x + 4), y: r1(n.y + 2), dreh: r1(ang - 12), s: +s.toFixed(3), spiegeln: true };
  // Looking back over the shoulder: the head turns to the far side and
  // points backwards; the back of the skull stays where the neck ends.
  return { x: r1(o.x + 30 - 300 * s), y: r1(n.y - 6), dreh: 4, s: +s.toFixed(3), spiegeln: false };
}

/** Simple stand-in head (no wuffwerk): cloud skull, beard, eye, nose, ear. */
export function ersatzKopf({ x, y, dreh = 0, s = 1, spiegeln = false, mimik = 'freundlich' }, F = LENNY_FARBEN) {
  const zu = mimik === 'schlafen';
  const auge = zu ? `<path d="M140 -66q16 12 32 0" stroke="${F.navy}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="156" cy="-64" rx="15" ry="17" fill="${F.navy}"/><circle cx="161" cy="-71" r="5" fill="${F.creme}"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${dreh}) scale(${spiegeln ? -s : s} ${s})">`
    + `<path d="${wolke([[-14, -26], [40, -50], [96, -80], [118, -128], [168, -166], [236, -170], [292, -138], [326, -82], [330, -20], [308, 34], [258, 66], [190, 76], [128, 72], [66, 70], [14, 54], [-18, 22]], 28)}" fill="${F.fell}"/>`
    + `<path d="${wolke([[-14, 8], [30, 0], [84, 8], [128, 26], [146, 54], [118, 76], [62, 76], [12, 60], [-14, 34]], 26)}" fill="${F.fellBart}" fill-opacity=".42"/>`
    + auge + `<ellipse cx="2" cy="-6" rx="27" ry="22" fill="${F.nase}"/>`
    + `<g transform="translate(240 -116)"><path d="${wolke([[-26, -6], [10, -14], [38, 20], [46, 80], [36, 150], [6, 176], [-30, 160], [-46, 100], [-44, 40]], 22)}" fill="${F.fellOhr}"/></g>`
    + '</g>';
}

/** Lenny look as layers (data). */
export function lennyLayers(pose, { camera = DEFAULT_VIEW, farben = LENNY_FARBEN, bogen = 34 } = {}) {
  const F = farben;
  const depth = camera?.depth || 0;
  const project = projector(camera || {});
  const far = farContours(pose), near = nearContours(pose);
  const body = projectCommands(contourAt(pose), project, 0);
  const layers = [];
  // Soft ground shadow under the body, between the paws.
  const xs = points(body).map(p => p[0]);
  const g = project(0, GROUND, depth / 2);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  layers.push({ name: 'schatten', ellipse: { cx: r1((minX + maxX) / 2), cy: r1(g.y), rx: r1((maxX - minX) / 2 + 10), ry: 14 }, fill: F.navy, opacity: .12 });
  // Far legs: same shape as the near ones, darker coat (depth by colour, not size).
  for (const k of ['hind', 'front']) layers.push({ name: 'fern-' + k, d: fell(projectCommands(far[k], project, depth), bogen * .7), fill: F.fellFern });
  layers.push({ name: 'koerper', d: fell(body, bogen), fill: F.fell });
  // Near legs: a soft shade along their back edge, inside the body only,
  // so legs folded against the chest or belly stay readable without a line.
  // Near legs: a soft shade behind the lower leg (below elbow / stifle),
  // inside the body only, so legs folded against chest or belly stay
  // readable – a shadow, not an outline.
  const J = pose.joints, z0 = p => project(p.x, p.y, 0).y;
  for (const [k, joint] of [['hind', 'stifle'], ['front', 'elbow']]) {
    const leg = projectCommands(near[k], project, 0);
    const shade = leg.map(([op, ...p]) => [op, ...p.map((v, i) => i % 2 ? v + 2 : v - 8)]);
    const ab = r1(z0(J[joint]) - 6);
    layers.push({ name: 'nah-' + k + '-schatten', d: pathData(shade), fill: F.fellSchatten, clip: 'koerper', ab });
    layers.push({ name: 'nah-' + k, d: pathData(leg), fill: F.fell, clip: 'koerper', ab });
  }
  const mimik = pose.render?.mimik || MIMIK[pose.preset] || 'freundlich';
  return { layers, kopf: { ...headAnchor(pose, project), mimik } };
}

/** Lenny look as SVG <g> (no <svg> wrapper). `kopf` draws the head from the
 * anchor (wuffwerk: a => bausteine.lenny(a)); default is the stand-in head. */
export function lennyGroup(pose, { kopf = ersatzKopf, farben = LENNY_FARBEN, id = 'l', ...opts } = {}) {
  const { layers, kopf: anker } = lennyLayers(pose, { farben, ...opts });
  const body = layers.find(l => l.name === 'koerper');
  let s = `<defs><clipPath id="${id}-koerper"><path d="${body.d}"/></clipPath></defs><g>`;
  for (const l of layers) {
    if (l.ellipse) { s += `<ellipse cx="${l.ellipse.cx}" cy="${l.ellipse.cy}" rx="${l.ellipse.rx}" ry="${l.ellipse.ry}" fill="${l.fill}" fill-opacity="${l.opacity}"/>`; continue; }
    let p = `<path d="${l.d}" fill="${l.fill}"/>`;
    // `ab`: only below this height (a second clip inside the body clip)
    // (soft: a mask fading in over 40 px, no hard edge).
    if (l.ab !== undefined) {
      const c = `${id}-${l.name}`;
      s += `<linearGradient id="${c}-v" gradientUnits="userSpaceOnUse" x1="0" y1="${l.ab}" x2="0" y2="${r1(l.ab + 40)}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>`
        + `<mask id="${c}"><rect x="-2000" y="${l.ab}" width="6000" height="3000" fill="url(#${c}-v)"/></mask>`;
      p = `<g mask="url(#${c})">${p}</g>`;
    }
    s += l.clip ? `<g clip-path="url(#${id}-${l.clip})">${p}</g>` : p;
  }
  return s + kopf(anker, farben) + '</g>';
}

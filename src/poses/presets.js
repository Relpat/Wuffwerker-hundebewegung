/** Stage G1 – pose presets for Lenny (names as used on wuffwerker.de).
 * Every preset is a plain spec for generatePose (generator.js); `pose(name,
 * amount, overrides)` builds it. Overrides are merged one level deep, so a
 * scene can say e.g. { rute: 'happy' } or { kopf: { hals: 20 } }.
 */
import { generatePose } from './generator.js';
import { sitPose } from '../animation/poses.js';
import { CONTOUR_REGIONS } from '../geometry/contour.js';

const smooth = x => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };

/** Folded hind leg (sit, down): same pose-space corrections as the sit. */
function hindFold(amount) {
  const fold = smooth((amount - .2) / .5), settle = smooth(amount / .6);
  const h = CONTOUR_REGIONS.hind[0];
  return [
    { cmd: h, from: h - 1, to: h + 1, t: .5, weight: settle },
    { cmd: h + 1, weight: fold },
    { cmd: h + 2, from: h + 1, to: h + 4, t: .5, dy: 4, weight: fold },
    { cmd: h + 11, from: h + 10, to: h + 14, t: .25, weight: fold },
    { cmd: h + 12, from: h + 10, to: h + 14, t: .5, weight: fold },
    { cmd: h + 13, from: h + 10, to: h + 14, t: .75, weight: fold },
  ];
}

/** Foreleg folded on the floor (down, play bow): the front of the upper arm
 * and the brisket stay between forechest and forearm instead of folding. */
function foreFold(amount) {
  const w = smooth(amount / .7), f = CONTOUR_REGIONS.front[0], b = CONTOUR_REGIONS.belly[0];
  return [
    { cmd: f, from: f - 1, to: f + 1, t: .5, weight: w },
    { cmd: f + 11, from: f + 10, to: b, t: .5, weight: w },
    { cmd: b, from: f + 11, to: b + 1, t: .5, weight: w },
    { cmd: b + 1, from: b, to: b + 2, t: .5, weight: w },
  ];
}

/** Pulls single outline anchors onto the line between their neighbours
 * (for small folds at the end of a pose). */
const relax = (amount, cmds) => cmds.map(cmd => ({ cmd, from: cmd - 1, to: cmd + 1, t: .5, weight: smooth((amount - .4) / .6) }));
const R = CONTOUR_REGIONS;

export const PRESETS = Object.freeze({
  locker: {
    label: 'Locker stehen', gruppe: 'Grundposen',
    text: 'Entspannt, Gewicht gleich verteilt, Rute locker.',
    rute: 'calm',
  },
  sitz: { label: 'Sitz', gruppe: 'Grundposen', text: 'Gerader Sitz, Vorderbeine senkrecht.', basis: 'sitz' },
  platz: {
    label: 'Platz', gruppe: 'Grundposen', text: 'Sphinx-Platz: Brust und Ellbogen am Boden, Hinterbeine untergeschlagen.',
    rumpf: { vorn: -122, hinten: -152, vor: -10, lende: -6 },
    kopf: { hals: -6, kopf: 6 },
    rute: [18, 28, 30, 12, 4, 2],
    beine: {
      vorn: { winkel: [62, 142, 2, 8, 12] },
      hinten: { vorPivot: 74, y: 470 },
    },
    korrekturen: (j, a) => [...hindFold(a), ...foreFold(a), ...relax(a, [R.belly[0], R.belly[1], R.hind[0], R.hind[0] + 1])],
  },
  pfote: {
    label: 'Pfote geben', gruppe: 'Tricks', text: 'Aus dem Sitz hebt Lenny die nahe Vorderpfote nach vorn.', basis: 'sitz',
    beine: { vorn: { winkel: [60, 75, -5, 15, 30] } },
  },
  spielverbeugung: {
    label: 'Spielverbeugung', gruppe: 'Körpersprache', text: 'Vorne tief, Po hoch, Rute wedelt: Lass uns spielen!',
    rumpf: { vorn: -120, hinten: 0, vor: -24 },
    kopf: { hals: -4, kopf: 8, maul: 8 },
    rute: 'happy',
    beine: {
      vorn: { winkel: [70, 150, -4, -2, 8] },
      vornFern: { winkel: [70, 146, 2, 0, 10] },
    },
    korrekturen: (j, a) => [...foreFold(a), ...relax(a, [R.throat[1], R.front[0] + 1])],
  },
  schnueffeln: {
    label: 'Schnüffeln', gruppe: 'Körpersprache', text: 'Nase am Boden, Rute locker.',
    rumpf: { vorn: -48, vor: 14 },
    kopf: { hals: 70, kopf: -14 },
    korrekturen: (j, a) => relax(a, [R.throat[0], R.throat[0] + 1]),
    rute: 'calm',
  },
  starr: {
    label: 'Starr, fixierend', gruppe: 'Körpersprache', text: 'Steif, Gewicht nach vorn, Kopf hoch, Rute hoch und steif.',
    rumpf: { vorn: 6, vor: 12 },
    kopf: { hals: -18, kopf: 4 },
    rute: [64, 6, 2, 0, -2, -2],
    beine: { vorn: { pfote: [-6, 0] }, hinten: { pfote: [-18, 0] } },
  },
  angst: {
    label: 'Angst, geduckt', gruppe: 'Körpersprache', text: 'Geduckt mit gebeugten Beinen, Gewicht nach hinten, Rute eingeklemmt.',
    rumpf: { vorn: -46, hinten: -62, vor: -18, lende: -10, becken: 10 },
    kopf: { hals: 22, kopf: -4 },
    rute: 'fearful',
    korrekturen: (j, a) => relax(a, [R.belly[1], R.hind[0]]),
    beine: { vorn: { pfote: [8, 0] }, hinten: { pfote: [16, 0] } },
    darstellung: { mimik: 'angst' },
  },
  wegsehen: {
    label: 'Wegsehen', gruppe: 'Körpersprache', text: 'Beschwichtigen: Kopf abgewandt, Körper ruhig.',
    kopf: { hals: 8 },
    rute: 'calm',
    darstellung: { kopfZurueck: true, mimik: 'wegsehen' },
  },
  schlafen: {
    label: 'Schlafen', gruppe: 'Ruhe', text: 'Im Platz, Kopf auf den Pfoten, Augen zu.',
    basis: 'platz',
    kopf: { hals: 30, kopf: -18 },
    darstellung: { mimik: 'schlafen' },
  },
});

const merge = (a = {}, b = {}) => {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = v && typeof v === 'object' && !Array.isArray(v) && typeof a[k] === 'object' && !Array.isArray(a[k]) ? { ...a[k], ...v } : v;
  return out;
};

/** Full spec of a preset (base preset resolved, overrides merged). */
export function presetSpec(name, overrides = {}) {
  const p = PRESETS[name];
  if (!p) throw new Error('Unbekannte Pose: ' + name);
  const base = p.basis && p.basis !== 'sitz' ? presetSpec(p.basis) : {};
  const { basis, ...own } = p;
  const spec = merge(merge(base, own), overrides);
  spec.name = name;
  spec.basis = p.basis === 'sitz' ? 'sitz' : undefined;
  if (base.korrekturen && !own.korrekturen) spec.korrekturen = base.korrekturen;
  return spec;
}

/** Builds a preset pose. The sit and poses built on it use the approved
 * sitPose (A2.3) and only change what the preset adds. */
export function pose(name, amount = 1, overrides = {}) {
  const spec = presetSpec(name, overrides);
  if (spec.basis !== 'sitz') return generatePose(spec, amount);
  const p = sitPose(amount);
  p.mode = 'pose'; p.preset = name; p.render = { ...(spec.darstellung || {}) };
  return applyOnSit(p, spec, amount);
}

import { BIND_DIRS } from './generator.js';
const DEG = Math.PI / 180;
const LEG = ['scapula', 'shoulder', 'elbow', 'carpus', 'frontPaw', 'frontToe'];
const LEN = (j, a, b) => Math.hypot(j[b].x - j[a].x, j[b].y - j[a].y);
/** Changes on top of the sit: near foreleg by FK directions (paw), head. */
function applyOnSit(p, spec, amount) {
  const s = smooth(amount);
  const j = p.joints;
  const w = spec.beine?.vorn?.winkel;
  if (w) {
    const cur = LEG.slice(1).map((n, i) => Math.atan2(j[n].y - j[LEG[i]].y, j[n].x - j[LEG[i]].x) / DEG);
    const lens = LEG.slice(1).map((n, i) => LEN(j, LEG[i], n));
    let q = j.scapula;
    LEG.slice(1).forEach((n, i) => {
      const d = (cur[i] + (((w[i] - cur[i] + 540) % 360) - 180) * s) * DEG;
      q = { x: q.x + Math.cos(d) * lens[i], y: q.y + Math.sin(d) * lens[i] };
      j[n] = q;
    });
  }
  return p;
}
export { BIND_DIRS };

/** G4 – Posen-Generator im Browser: Presets, Regler, Lenny-Look, SVG-Download.
 * Reines DOM + SVG, kein PixiJS. Der Kopf ist der Baukasten-Kopf von
 * wuffwerker.de (src/vendor/baukasten, scripts/sync-baukasten.mjs). */
import { PRESETS, pose, presetSpec } from './poses/presets.js';
import { EXPRESSIONS } from './animation/tail.js';
import { lennyGroup, LENNY_FARBEN, DUNKEL_FARBEN } from './render/lenny.js';
import { poseSvg } from '../scripts/svg.mjs';
import { lennyKopf, mimiken, lennyBewegung } from './vendor/baukasten/lenny.mjs';
import { farben as baukastenFarben } from './vendor/baukasten/stil.mjs';
import './style.css';

const $ = s => document.querySelector(s);
const VIEW = [180, 90, 700, 410];
const SITZ = new Set(['sitz', 'pfote']);
const RUTE = { calm: 'Entspannt', happy: 'Fröhlich', excited: 'Aufgeregt', alert: 'Aufmerksam', unsure: 'Unsicher', fearful: 'Ängstlich', tense: 'Angespannt' };

/** Regler: Bereich, Schlüssel im Spec, Beschriftung, Einheit, Grenzen. */
const REGLER = [
  ['rumpf', 'vorn', 'Schulter hoch', 'px', -170, 50],
  ['rumpf', 'hinten', 'Hüfte hoch', 'px', -200, 60],
  ['rumpf', 'vor', 'Gewicht vor', 'px', -40, 40],
  ['rumpf', 'lende', 'Lende', '°', -30, 30],
  ['rumpf', 'becken', 'Becken', '°', -20, 30],
  ['kopf', 'hals', 'Hals runter', '°', -60, 100],
  ['kopf', 'kopf', 'Kopf runter', '°', -50, 50],
  ['kopf', 'maul', 'Maul auf', '°', 0, 30],
];

let name = 'locker';
let aenderungen = {};
let anteil = 1;

/** Werte des Presets plus Änderungen, für die Regler. */
const wert = (bereich, key) => aenderungen[bereich]?.[key] ?? presetSpec(name)[bereich]?.[key] ?? 0;

function baueRegler() {
  for (const [bereich, key, text, einheit, min, max] of REGLER) {
    const id = `pg-${bereich}-${key}`;
    const zeile = document.createElement('label');
    zeile.className = 'pg-regel';
    zeile.htmlFor = id;
    zeile.innerHTML = `<span>${text}</span><input id="${id}" type="range" min="${min}" max="${max}" step="1"><output></output>`;
    const input = zeile.querySelector('input');
    input.addEventListener('input', () => {
      aenderungen[bereich] = { ...(aenderungen[bereich] || {}), [key]: +input.value };
      zeichne();
    });
    $(`#pg-${bereich}`).append(zeile);
  }
  const presets = $('#pg-presets');
  for (const [n, p] of Object.entries(PRESETS)) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.pose = n; b.textContent = p.label;
    b.addEventListener('click', () => waehle(n));
    presets.append(b);
  }
  $('#pg-rute').innerHTML = '<option value="">wie die Pose</option>' + Object.keys(EXPRESSIONS).map(k => `<option value="${k}">${RUTE[k] || k}</option>`).join('');
  $('#pg-mimik').innerHTML = '<option value="">wie die Pose</option>' + Object.entries(mimiken).map(([k, m]) => `<option value="${k}">${k} – ${m.text}</option>`).join('');
  $('#pg-rute').addEventListener('change', e => { setze('rute', e.target.value); });
  $('#pg-mimik').addEventListener('change', e => { setze('darstellung', e.target.value ? { ...(presetSpec(name).darstellung || {}), mimik: e.target.value } : undefined); });
  for (const id of ['#pg-fell', '#pg-skelett']) $(id).addEventListener('change', zeichne);
  $('#pg-anteil').addEventListener('input', e => { anteil = +e.target.value; zeichne(); });
  $('#pg-zurueck').addEventListener('click', () => waehle(name));
  $('#pg-svg').addEventListener('click', herunterladen);
  $('#pg-kopieren').addEventListener('click', kopieren);
  $('#pg-abspielen').addEventListener('click', abspielen);
}

function setze(key, v) {
  if (v === undefined || v === '') delete aenderungen[key]; else aenderungen[key] = v;
  zeichne();
}

function waehle(n) {
  name = n; aenderungen = {}; anteil = 1;
  $('#pg-anteil').value = 1; $('#pg-rute').value = ''; $('#pg-mimik').value = '';
  zeichne();
}

/** Kopf aus dem Baukasten; für den dunklen Hund mit dessen Fellfarben. */
const kopf = dunkel => a => {
  let k = lennyKopf(a);
  if (dunkel) k = k.replaceAll(baukastenFarben.fell, DUNKEL_FARBEN.fell).replaceAll(baukastenFarben.fellOhrDunkel, DUNKEL_FARBEN.fellOhrDunkel)
    .replaceAll(baukastenFarben.fellOhr, DUNKEL_FARBEN.fellOhr).replaceAll(baukastenFarben.fellBart, DUNKEL_FARBEN.fellBart);
  return k;
};

function svgText() {
  const p = pose(name, anteil, aenderungen);
  if ($('#pg-skelett').checked) return poseSvg(p, { view: VIEW });
  const dunkel = $('#pg-fell').value === 'dunkel';
  const [vx, vy, vw, vh] = VIEW;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEW.join(' ')}"><style>${lennyBewegung}</style>`
    + `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#FBF6EE"/><rect x="${vx}" y="470" width="${vw}" height="${vy + vh - 470}" fill="#EFE5D5"/>`
    + lennyGroup(p, { kopf: kopf(dunkel), farben: dunkel ? DUNKEL_FARBEN : LENNY_FARBEN, id: 'pg' }) + '</svg>';
}

function zeichne() {
  const sitz = SITZ.has(name);
  for (const [bereich, key, , einheit] of REGLER) {
    const input = $(`#pg-${bereich}-${key}`);
    const v = wert(bereich, key);
    input.value = v; input.disabled = sitz && bereich === 'rumpf';
    input.nextElementSibling.textContent = `${Math.round(v)} ${einheit}`;
  }
  $('#pg-sitz-hinweis').hidden = !sitz;
  for (const b of document.querySelectorAll('[data-pose]')) b.setAttribute('aria-pressed', String(b.dataset.pose === name));
  $('#pg-titel').textContent = PRESETS[name].label.toUpperCase();
  $('#pg-text').textContent = PRESETS[name].text;
  $('#pg-anteil-wert').textContent = `${Math.round(anteil * 100)} %`;
  $('#pg-stage').innerHTML = svgText();
}

function herunterladen() {
  const blob = new Blob([svgText()], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `lenny-${name}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function kopieren() {
  const text = `pose('${name}', ${anteil}, ${JSON.stringify(aenderungen)})`;
  const knopf = $('#pg-kopieren');
  try { await navigator.clipboard.writeText(text); knopf.textContent = 'Kopiert ✓'; }
  catch { window.prompt('Werte zum Kopieren:', text); }
  setTimeout(() => { knopf.textContent = 'Werte kopieren'; }, 1600);
}

/** Übergang aus dem Stand in die Pose (Überblendung, kein echter Ablauf). */
function abspielen() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { anteil = 1; $('#pg-anteil').value = 1; zeichne(); return; }
  const start = performance.now(), dauer = 1600;
  const schritt = t => {
    anteil = Math.min(1, (t - start) / dauer);
    $('#pg-anteil').value = anteil;
    zeichne();
    if (anteil < 1) requestAnimationFrame(schritt);
  };
  requestAnimationFrame(schritt);
}

baueRegler();
waehle('locker');

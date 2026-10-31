import { Application } from 'pixi.js';
import { createScene } from './render/scene.js';
import './style.css';

const stage = document.querySelector('#stage');
const status = document.querySelector('#renderer-status');
const toggle = document.querySelector('#skeleton-toggle');

async function start() {
  const app = new Application();
  await app.init({ width: stage.clientWidth, height: stage.clientHeight, autoStart: false,
    backgroundAlpha: 0, antialias: true,
    autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 2), preference: 'webgl' });
  stage.appendChild(app.canvas);
  const scene = createScene();
  app.stage.addChild(scene.root);
  const redraw = () => { scene.fit(app.screen.width, app.screen.height); app.render(); };
  toggle.addEventListener('change', () => {
    scene.skeleton.visible = toggle.checked;
    app.render();
  });
  // Static pose: no animation loop. Render only on resize or a control change.
  const resizeObserver = new ResizeObserver(() => {
    app.renderer.resize(stage.clientWidth, stage.clientHeight);
    redraw();
  });
  resizeObserver.observe(stage);
  redraw();
  status.textContent = 'PixiJS 8 · statische Bind-Pose';
  document.documentElement.dataset.ready = 'true';
  window.addEventListener('pagehide', () => { resizeObserver.disconnect(); app.destroy(true); }, { once: true });
}

start().catch(error => {
  console.error('PixiJS initialization failed', error);
  status.textContent = 'PixiJS konnte nicht gestartet werden. Konsole prüfen.';
});

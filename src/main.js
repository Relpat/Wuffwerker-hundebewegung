import { Application } from 'pixi.js';
import { createScene } from './render/scene.js';
import { GAITS, poseAt } from './animation/gaits.js';
import './style.css';

const stage=document.querySelector('#stage');
const status=document.querySelector('#renderer-status');
const toggle=document.querySelector('#skeleton-toggle');
const bodyToggle=document.querySelector('#body-toggle');
const headToggle=document.querySelector('#head-toggle');
const tailToggle=document.querySelector('#tail-toggle');
const tailExpression=document.querySelector('#tail-expression');
const gaitButtons=[...document.querySelectorAll('[data-gait]')];
const pauseButton=document.querySelector('#pause');
const speed=document.querySelector('#speed');
const speedOutput=document.querySelector('#speed-output');
const hint=document.querySelector('#gait-hint');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode=reducedMotion?'stand':'walk';
let paused=false;
let playTime=0;

async function start() {
  const app=new Application();
  await app.init({width:stage.clientWidth,height:stage.clientHeight,autoStart:false,
    backgroundAlpha:0,antialias:true,autoDensity:true,
    resolution:Math.min(devicePixelRatio||1,2),preference:'webgl'});
  stage.appendChild(app.canvas);
  const scene=createScene();
  app.stage.addChild(scene.root);
  const draw=()=>{scene.setPose(poseAt(mode,playTime,{bodyMotion:bodyToggle.checked,headMotion:headToggle.checked,tailMotion:tailToggle.checked,tailExpression:tailExpression.value}));app.render();};
  const resizeObserver=new ResizeObserver(()=>{
    app.renderer.resize(stage.clientWidth,stage.clientHeight);
    scene.fit(app.screen.width,app.screen.height);
    draw();
  });
  resizeObserver.observe(stage);
  scene.fit(app.screen.width,app.screen.height);
  const syncControls=()=>{
    gaitButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.gait===mode)));
    pauseButton.textContent=paused?'Weiter':'Pause';
    pauseButton.disabled=mode==='stand' && !(tailToggle.checked && tailExpression.value!=='auto');
    speedOutput.textContent=`${Number(speed.value).toFixed(2).replace('.',',')} ×`;
    hint.textContent=mode==='stand'&&tailExpression.value==='auto'?'Statische anatomische Vergleichspose.':
      `${GAITS[mode].label}: ${bodyToggle.checked?'Rumpf aktiv.':'Rumpf aus.'} ${headToggle.checked?'Kopfausgleich aktiv.':'Kopfausgleich aus.'} ${tailToggle.checked?'Rute: '+(tailExpression.selectedOptions[0]?.textContent||'automatisch')+'.':'Rute aus.'} Noch kein Vierbein-Skinning.`;
  };
  gaitButtons.forEach(button=>button.addEventListener('click',()=>{
    mode=button.dataset.gait;
    playTime=0;
    paused=false;
    syncControls();
    draw();
  }));
  pauseButton.addEventListener('click',()=>{paused=!paused;syncControls();});
  speed.addEventListener('input',syncControls);
  toggle.addEventListener('change',()=>{scene.skeleton.visible=toggle.checked;draw();});
  bodyToggle.addEventListener('change',()=>{syncControls();draw();});
  for (const control of [headToggle,tailToggle,tailExpression]) control.addEventListener('change',()=>{syncControls();draw();});
  let last=0,raf=0;
  const tick=(now)=>{
    const delta=last?Math.min((now-last)/1000,.05):0;
    last=now;
    if(!paused && (mode!=='stand' || (tailToggle.checked && tailExpression.value!=='auto'))){
      playTime+=delta*Number(speed.value);
      draw();
    }
    raf=requestAnimationFrame(tick);
  };
  syncControls(); draw();
  raf=requestAnimationFrame(tick);
  status.textContent='PixiJS 8 · Kopf/Hals/Rute · Bewegungsstudie';
  document.documentElement.dataset.ready='true';
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);resizeObserver.disconnect();app.destroy(true);},{once:true});
}
start().catch(error=>{
  console.error('PixiJS initialization failed',error);
  status.textContent='PixiJS konnte nicht gestartet werden. Konsole prüfen.';
});

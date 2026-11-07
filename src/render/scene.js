import { Container, Graphics } from 'pixi.js';
import { ARTBOARD, traceContour } from '../geometry/contour.js';
import { contourAt } from '../geometry/animated-contour.js';
import { poseAt } from '../animation/gaits.js';
import { BONES, FAR_BONES } from '../skeleton/stand.js';
import { farContours } from '../geometry/far-limbs.js';
import { projector, projectCommands, DEFAULT_VIEW } from './camera.js';
import { coatPx, COAT_CM } from './coat.js';
import { ribsAt } from '../skeleton/ribs.js';

const project = projector(DEFAULT_VIEW);
const MID = /^(tail|pelvis|spine|withers|neck|occiput|jaw|thorax|lumbar|nose|chin|ilium|ischium|manubrium|sternum|xiphoid)/;
const zOf = name => name.startsWith('far') ? DEFAULT_VIEW.depth : MID.test(name) ? DEFAULT_VIEW.depth / 2 : 0;

export function createScene() {
  const root = new Container();
  // Floor strip as seen by the default camera (12° from above).
  const g0 = ARTBOARD.groundY, d = DEFAULT_VIEW.depth;
  const corners = [project(82, g0, -12), project(886, g0, -12), project(886, g0, d + 12), project(82, g0, d + 12)];
  const floor = new Graphics().poly(corners.flatMap(p => [p.x, p.y])).fill({ color: 0xebe2d4 });
  const n0 = project(82, g0, 0), n1 = project(886, g0, 0);
  floor.moveTo(n0.x, n0.y).lineTo(n1.x, n1.y).stroke({ color: 0xc3b7a6, width: 1.4 });
  const farLegs = new Graphics();
  const silhouette = new Graphics();
  // Coat stroke must not reach under the floor: clip each layer at its own ground line.
  const clip = z => { const a = project(0, g0, z), b = project(ARTBOARD.width, g0, z);
    return new Graphics().rect(0, -200, ARTBOARD.width, Math.min(a.y, b.y) + 200).fill({ color: 0xffffff }); };
  const farClip = clip(d), nearClip = clip(0);
  farLegs.mask = farClip; silhouette.mask = nearClip;
  let coat = COAT_CM;
  const skeleton = new Graphics();
  skeleton.visible = false;
  root.addChild(floor, farClip, nearClip, farLegs, silhouette, skeleton);
  // Body outline: dark edge outside the coat, coat stroke, then the fill.
  const body = (g, cmds, color, edge) => {
    const c = coatPx(coat);
    if (c > 0) {
      traceContour(g, cmds).stroke({ color: 0x293b50, width: 2 * c + edge, join: 'round' });
      traceContour(g, cmds).stroke({ color, width: 2 * c, join: 'round' });
      traceContour(g, cmds).fill({ color });
    } else traceContour(g, cmds).fill({ color }).stroke({ color: 0x293b50, width: edge, join: 'round' });
  };
  let current = poseAt('stand', 0);
  function setPose(pose) {
    current = pose;
    farLegs.clear();
    const far=farContours(pose);
    for(const commands of [far.hind,far.front]) {
      body(farLegs, projectCommands(commands, project, d), 0x956b50, 2.1);
    }
    silhouette.clear();
    body(silhouette, projectCommands(contourAt(pose), project, 0), 0xa87554, 2.6);
    skeleton.clear();
    const J=Object.fromEntries(Object.entries(pose.joints).map(([n,p])=>[n,project(p.x,p.y,zOf(n))]));
    for (const [a,b] of FAR_BONES) {
      const from=J[a],to=J[b];
      skeleton.moveTo(from.x,from.y).lineTo(to.x,to.y)
        .stroke({color:0x345c74,width:1.8,alpha:.65});
    }
    // Ribs (drawing only), at the depth of the breastbone.
    for (const [p0,c,p1] of ribsAt(pose.joints)) {
      const q0=project(p0.x,p0.y,d/2),qc=project(c.x,c.y,d/2),q1=project(p1.x,p1.y,d/2);
      skeleton.moveTo(q0.x,q0.y).quadraticCurveTo(qc.x,qc.y,q1.x,q1.y)
        .stroke({color:0x26334a,width:1.4,alpha:.45});
    }
    for (const [a,b] of BONES) {
      const from=J[a],to=J[b];
      skeleton.moveTo(from.x,from.y).lineTo(to.x,to.y)
        .stroke({ color: 0x26334a, width: 2.3, alpha: .73 });
    }
    for (const [name,p] of Object.entries(J)) {
      skeleton.circle(p.x,p.y,name==='pelvis'||name==='withers'?5:3.5)
        .fill({ color: 0xe1ec93 }).stroke({ color: 0x26334a, width: 1 });
    }
  }
  setPose(current);
  return { root, farLegs, skeleton, silhouette, setPose,
    setCoat(cm) { coat = cm; setPose(current); },
    fit(width,height) {
      const s=Math.min(width/ARTBOARD.width,height/ARTBOARD.height);
      root.scale.set(s);
      root.position.set((width-ARTBOARD.width*s)/2,(height-ARTBOARD.height*s)/2);
    }
  };
}

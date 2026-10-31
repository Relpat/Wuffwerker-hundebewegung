import { Container, Graphics } from 'pixi.js';
import { ARTBOARD, traceContour } from '../geometry/contour.js';
import { contourAt } from '../geometry/animated-contour.js';
import { poseAt } from '../animation/gaits.js';
import { BONES, FAR_BONES } from '../skeleton/stand.js';
import { farContours } from '../geometry/far-limbs.js';

export function createScene() {
  const root = new Container();
  const floor = new Graphics().moveTo(82, ARTBOARD.groundY + 2)
    .lineTo(886, ARTBOARD.groundY + 2)
    .stroke({ color: 0xc3b7a6, width: 1.4 });
  const farLegs = new Graphics();
  const silhouette = new Graphics();
  const skeleton = new Graphics();
  skeleton.visible = false;
  root.addChild(floor, farLegs, silhouette, skeleton);
  let current = poseAt('stand', 0);
  function setPose(pose) {
    current = pose;
    farLegs.clear();
    const far=farContours(pose);
    for(const commands of [far.hind,far.front]) {
      traceContour(farLegs,commands)
        .fill({color:0x956b50})
        .stroke({color:0x293b50,width:2.1,join:'round'});
    }
    silhouette.clear();
    traceContour(silhouette, contourAt(pose))
      .fill({ color: 0xa87554 })
      .stroke({ color: 0x293b50, width: 2.6, join: 'round' });
    skeleton.clear();
    for (const [a,b] of FAR_BONES) {
      const from=pose.joints[a],to=pose.joints[b];
      skeleton.moveTo(from.x,from.y).lineTo(to.x,to.y)
        .stroke({color:0x345c74,width:1.8,alpha:.65});
    }
    for (const [a,b] of BONES) {
      const from=pose.joints[a],to=pose.joints[b];
      skeleton.moveTo(from.x,from.y).lineTo(to.x,to.y)
        .stroke({ color: 0x26334a, width: 2.3, alpha: .73 });
    }
    for (const [name,p] of Object.entries(pose.joints)) {
      skeleton.circle(p.x,p.y,name==='pelvis'||name==='withers'?5:3.5)
        .fill({ color: 0xe1ec93 }).stroke({ color: 0x26334a, width: 1 });
    }
  }
  setPose(current);
  return { root, farLegs, skeleton, silhouette, setPose,
    fit(width,height) {
      const s=Math.min(width/ARTBOARD.width,height/ARTBOARD.height);
      root.scale.set(s);
      root.position.set((width-ARTBOARD.width*s)/2,(height-ARTBOARD.height*s)/2);
    }
  };
}

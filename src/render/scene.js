import { Container, Graphics } from 'pixi.js';
import { ARTBOARD, traceContour } from '../geometry/contour.js';
import { contourAt } from '../geometry/animated-contour.js';
import { poseAt } from '../animation/gaits.js';
import { BONES } from '../skeleton/stand.js';

export function createScene() {
  const root = new Container();
  const floor = new Graphics().moveTo(82, ARTBOARD.groundY + 2)
    .lineTo(886, ARTBOARD.groundY + 2)
    .stroke({ color: 0xc3b7a6, width: 1.4 });
  const silhouette = new Graphics();
  const skeleton = new Graphics();
  skeleton.visible = false;
  root.addChild(floor, silhouette, skeleton);
  let current = poseAt('stand', 0);
  function setPose(pose) {
    current = pose;
    silhouette.clear();
    traceContour(silhouette, contourAt(pose))
      .fill({ color: 0xa87554 })
      .stroke({ color: 0x293b50, width: 2.6, join: 'round' });
    skeleton.clear();
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
  return { root, skeleton, silhouette, setPose,
    fit(width,height) {
      const s=Math.min(width/ARTBOARD.width,height/ARTBOARD.height);
      root.scale.set(s);
      root.position.set((width-ARTBOARD.width*s)/2,(height-ARTBOARD.height*s)/2);
    }
  };
}

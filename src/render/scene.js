import { Container, Graphics } from 'pixi.js';
import { ARTBOARD, CONTOUR, traceContour } from '../geometry/contour.js';
import { BONES, JOINTS } from '../skeleton/stand.js';

export function createScene() {
  const root = new Container();
  const floor = new Graphics().moveTo(82, ARTBOARD.groundY + 2)
    .lineTo(886, ARTBOARD.groundY + 2)
    .stroke({ color: 0xc3b7a6, width: 1.4 });
  const silhouette = traceContour(new Graphics(), CONTOUR)
    .fill({ color: 0xa87554 })
    .stroke({ color: 0x293b50, width: 2.6, join: 'round' });
  const skeleton = new Graphics();
  for (const [start, end] of BONES) {
    skeleton.moveTo(...JOINTS[start]).lineTo(...JOINTS[end])
      .stroke({ color: 0x26334a, width: 2.3, alpha: 0.73 });
  }
  for (const [name, [x, y]] of Object.entries(JOINTS)) {
    skeleton.circle(x, y, name === 'pelvis' || name === 'withers' ? 5 : 3.5)
      .fill({ color: 0xe1ec93 }).stroke({ color: 0x26334a, width: 1 });
  }
  skeleton.visible = false;
  root.addChild(floor, silhouette, skeleton);
  return {
    root,
    skeleton,
    silhouette,
    fit(width, height) {
      const scale = Math.min(width / ARTBOARD.width, height / ARTBOARD.height);
      root.scale.set(scale);
      root.position.set((width - ARTBOARD.width * scale) / 2,
                        (height - ARTBOARD.height * scale) / 2);
    },
  };
}

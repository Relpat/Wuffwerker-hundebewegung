/** Geometric occlusion of the far-side legs, drawn *behind* the existing
 * one-piece torso/neck/head/tail/near-leg silhouette. Separate limb contours
 * are required to represent four distinct legs in a two-dimensional view;
 * no patches cover a seam in the torso. No production weighted mesh yet.
 * Silhouette widths and paw footprints match the existing NEAR side at natural
 * scale; apparent depth comes from draw order and a muted color, NOT shrinking.
 */
const add=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const normal=(a,b,w)=>{const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;
  return {x:-dy*w/l,y:dx*w/l};};
const off=(p,n,sign=1)=>[p.x+n.x*sign,p.y+n.y*sign];

/** Outline has one M and one Z; ends are capped with a rounded toe.
 * Upper section is intentionally hidden by the main body when composited.
 */
function frontOutline(root,elbow,carpus,paw) {
  // Full-size foreleg: near-side lower limb ~38px across, paw ~67px wide.
  const a=normal(root,elbow,23),b=normal(elbow,carpus,19),c=normal(carpus,paw,16);
  const toe={x:paw.x+26,y:paw.y+9};
  const back={x:paw.x-42,y:paw.y+9};
  return [
    ['M',...off(root,a,-1)],
    ['C',...off(add(root,elbow,.45),a,-1),...off(elbow,b,-1),...off(elbow,b,-1)],
    ['C',...off(add(elbow,carpus,.55),b,-1),...off(carpus,c,-1),...off(paw,c,-1)],
    ['C',paw.x+4,paw.y+3,toe.x,toe.y,toe.x,toe.y],
    ['L',back.x,back.y],
    ['C',back.x-3,back.y-4,...off(paw,c,1),...off(paw,c,1)],
    ['C',...off(carpus,c,1),...off(add(elbow,carpus,.6),b,1),...off(elbow,b,1)],
    ['C',...off(elbow,b,1),...off(add(root,elbow,.45),a,1),...off(root,a,1)],
    ['Z'],
  ];
}
function hindOutline(hip,stifle,hock,paw) {
  // Full-size hind leg: near-side paw about 73px wide in neutral stance.
  const a=normal(hip,stifle,29),b=normal(stifle,hock,18),c=normal(hock,paw,15);
  const toe={x:paw.x+42,y:paw.y+11};
  const heel={x:paw.x-31,y:paw.y+11};
  return [
    ['M',...off(hip,a,-1)],
    ['C',...off(add(hip,stifle,.55),a,-1),...off(stifle,b,-1),...off(stifle,b,-1)],
    ['C',...off(add(stifle,hock,.5),b,-1),...off(hock,c,-1),...off(hock,c,-1)],
    ['C',...off(add(hock,paw,.55),c,-1),...off(paw,c,-1),toe.x,toe.y],
    ['L',heel.x,heel.y],
    ['C',heel.x-2,heel.y-4,...off(paw,c,1),...off(paw,c,1)],
    ['C',...off(hock,c,1),...off(add(stifle,hock,.5),b,1),...off(stifle,b,1)],
    ['C',...off(stifle,b,1),...off(add(hip,stifle,.55),a,1),...off(hip,a,1)],
    ['Z'],
  ];
}
export function farContours(pose) {
  const j=pose.joints;
  return {
    hind:hindOutline(j.farHip,j.farStifle,j.farHock,j.farHindPaw),
    front:frontOutline(j.farShoulder,j.farElbow,j.farCarpus,j.farFrontPaw),
  };
}

/** v6.6 tail expression kernel, adapted to the new single-contour side view.
 * Numeric expression targets, segment pitch/yaw, bend and projection follow
 * reference/v6.6/Wuffwerker-PixiJS-Rutenhaltung-v6.6.html. The reference is
 * immutable; its full family of tail meshes is NOT ported yet. This stage uses
 * only its 'natural' tail to deform the existing united body outline.
 */
export const EXPRESSIONS = Object.freeze({
  calm: {spread:8,hz:.55,flex:.78},
  alert: {spread:6,hz:.55,flex:.36},
  happy: {spread:45,hz:2.0,flex:1.0},
  excited: {spread:32,hz:3.25,flex:.82},
  unsure: {spread:9,hz:1.0,flex:.40},
  fearful: {spread:1.5,hz:.38,flex:.10},
  tense: {spread:4,hz:1.8,flex:.12},
});

export const NATURAL_TAIL = Object.freeze({
  name:'Neutral', widths:[17,15,12,9,5,1.6], lengths:[20,18,17,15,12],
  rootPitch:0,curl:0,rootYOffset:0,curlExp:1.22,distalCurl:0,
});
const AUTO_EXPRESSION=Object.freeze({walk:'calm',trot:'excited',run:'excited',pace:'calm',stand:'calm'});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;

/** The target law from the approved v6.6, including downward fearful carriage. */
export function tailExpressionTargets(type,expression='calm',intensity=1) {
  if (!EXPRESSIONS[expression]) throw new Error('Unknown expression: '+expression);
  const strength=clamp(intensity,0,1.6);
  const resting=type.rootPitch||0;
  const shift={calm:0,alert:19,happy:10,excited:28,unsure:-25,tense:37};
  const target=expression==='fearful' ? -76
    :expression==='unsure' ? Math.min(10,resting-25)
    :resting+(shift[expression]||0);
  const rootPitch=clamp(lerp(resting,target,strength),-87,85);
  const ring=type.name==='Gerollt', sickle=type.name==='Sichel';
  let curlGoal=1;
  if(expression==='fearful') curlGoal=ring?.07:(sickle?.30:.72);
  else if(expression==='unsure') curlGoal=ring?.22:(sickle?.62:.91);
  else if(expression==='happy') curlGoal=ring?1.04:1;
  else if(expression==='alert') curlGoal=ring?1.06:1;
  else if(expression==='excited') curlGoal=ring?1.13:1.04;
  else if(expression==='tense') curlGoal=ring?1.13:1.03;
  const curlFactor=clamp(lerp(1,curlGoal,strength),0,1.45);
  const tuck=expression==='fearful' ? -53*strength
    :expression==='unsure' ? -7*strength :0;
  return {rootPitch,curlFactor,tuck,strength};
}

export function buildNaturalTail(time,expression='calm') {
  const type=NATURAL_TAIL, preset=EXPRESSIONS[expression];
  if (!preset || !Number.isFinite(time)) throw new Error('Invalid tail input');
  const posture=tailExpressionTargets(type,expression,1);
  const phase=time*2*Math.PI*preset.hz;
  // Baseline root of the side-view contour: (248,261) between y235 and y287.
  // 1.36 scales v6.6's 82-unit tail to the current 112-unit neutral outline.
  const lengths=type.lengths.map(v=>v*1.36);
  const points=[{x:248,y:261,z:0}];
  let {x,y,z}=points[0];
  for(let i=0;i<lengths.length;i++) {
    const q=lengths.length===1?1:i/(lengths.length-1);
    const sway=Math.sin(phase-i*.38)*(preset.spread*Math.PI/180)*posture.strength;
    const yaw=sway*(.82+.18*q)+Math.sin(phase*.52-i*.4)*.045*preset.flex*posture.strength;
    const anatomicalBend=((type.curl||0)*Math.pow(q,type.curlExp||1.22)
      +(type.distalCurl||0)*Math.pow(q,2.15))*posture.curlFactor;
    const expressiveFlex=(i-2)*2.1*preset.flex*posture.strength;
    const pitch=(posture.rootPitch+anatomicalBend+posture.tuck*Math.pow(q,1.6)+expressiveFlex)*Math.PI/180;
    x+=-Math.cos(pitch)*Math.cos(yaw)*lengths[i];
    y+=-Math.sin(pitch)*lengths[i];
    z+=Math.cos(pitch)*Math.sin(yaw)*lengths[i];
    points.push({x,y,z});
  }
  return {points,expression,posture};
}

function sample(tail,t) {
  const n=tail.points.length-1, u=clamp(t,0,1)*n;
  const i=Math.min(n-1,Math.floor(u)),a=tail.points[i],b=tail.points[i+1],r=u-i;
  return {x:lerp(a.x,b.x,r),y:lerp(a.y,b.y,r),z:lerp(a.z,b.z,r)};
}
function projection(p){return {x:p.x+p.z*.10,y:p.y-p.z*.075};}

/** Displacement of an existing outline point, zero at the tail root.
 * The v6.6 side projection is reused so lateral wag has subtle 2D travel.
 * Normalized longitudinal distance is based on the undeformed neutral path.
 */
export function tailDelta(x,tail) {
  if(!tail?.enabled) return {x:0,y:0};
  const t=clamp((248-x)/120,0,1);
  if(t===0) return {x:0,y:0};
  const now=projection(sample(tail.current,t)),rest=projection(sample(tail.reference,t));
  // Avoid a hard transverse cusp where tail merges into rump.
  const attachment=t*t*(3-2*t);
  // Side-view projection guard: extreme fearful pitch can put the tip under
  // the root in 3D. Constrain only its foreshortening to avoid folding the
  // 2D silhouette back across itself; keep the downward carriage visible.
  const rawX=(now.x-rest.x)*attachment;
  const maxX=48*t;
  const visibleX=maxX>1e-9?maxX*Math.tanh(rawX/maxX):0;
  return {x:visibleX,y:(now.y-rest.y)*attachment};
}

export function tailAt(mode,time,{enabled=true,expression='auto'}={}) {
  const name=expression==='auto' ? AUTO_EXPRESSION[mode] : expression;
  if(!name) throw new Error('Unknown gait for tail: '+mode);
  if(!EXPRESSIONS[name]) throw new Error('Unknown tail expression: '+name);
  // Stand with automatic neutral expression exactly preserves the bind pose.
  const active=Boolean(enabled && (mode!=='stand'||expression!=='auto'));
  return {
    enabled:active,
    expression:name,
    current:active?buildNaturalTail(time,name):null,
    reference:active?buildNaturalTail(0,'calm'):null,
  };
}

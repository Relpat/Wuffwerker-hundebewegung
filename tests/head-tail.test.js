import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { headAt } from '../src/animation/head.js';
import { EXPRESSIONS, NATURAL_TAIL, buildNaturalTail, tailExpressionTargets, tailAt, tailAngles } from '../src/animation/tail.js';
import { JOINTS } from '../src/skeleton/stand.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, CONTOUR_REGIONS, sampleContour } from '../src/geometry/contour.js';
const D = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const V = v=>Object.values(v).every(Number.isFinite);

test('neutral stand unchanged; selected tail expression can animate in stand',()=>{
  assert.strictEqual(contourAt(poseAt('stand',9)),CONTOUR);
  assert.strictEqual(contourAt(poseAt('stand',9,{tailMotion:false,tailExpression:'happy'})),CONTOUR);
  const happy=poseAt('stand',.23,{tailExpression:'happy'});
  assert.notStrictEqual(contourAt(happy),CONTOUR);
  const back=CONTOUR_REGIONS.back[1];
  assert.deepEqual(contourAt(happy)[back].map(v=>typeof v==='number'?+v.toFixed(6):v),CONTOUR[back]);
});

test('v6.6 natural-tail pitch targets and expression presets are retained',()=>{
  assert.equal(Object.keys(EXPRESSIONS).length,7);
  assert.deepEqual(NATURAL_TAIL.lengths,[20,18,17,15,12]);
  const calm=tailExpressionTargets(NATURAL_TAIL,'calm');
  assert.equal(calm.rootPitch,0);
  assert.ok(tailExpressionTargets(NATURAL_TAIL,'alert').rootPitch>calm.rootPitch);
  assert.ok(tailExpressionTargets(NATURAL_TAIL,'excited').rootPitch>calm.rootPitch);
  assert.ok(tailExpressionTargets(NATURAL_TAIL,'fearful').rootPitch<-70);
  assert.ok(tailExpressionTargets(NATURAL_TAIL,'unsure').rootPitch<calm.rootPitch);
  assert.equal(buildNaturalTail(0,'happy').points.length,NATURAL_TAIL.lengths.length+1);
});

test('tail root stays attached and expression angles remain continuous',()=>{
  const bind=Math.hypot(JOINTS.tailRoot[0]-JOINTS.pelvis[0],JOINTS.tailRoot[1]-JOINTS.pelvis[1]);
  for(const expression of Object.keys(EXPRESSIONS)){
    for(const time of [0,.08,.22,.45,1.05]){
      const t=tailAt('walk',time,{expression});
      const a=tailAngles(t),b=tailAngles(tailAt('walk',time+.001,{expression}));
      assert.equal(a.length,6);
      assert.ok(a.every(Number.isFinite));
      assert.ok(a.every((v,i)=>Math.abs(v-b[i])<.05),expression);
      const j=poseAt('walk',time,{tailExpression:expression}).joints;
      assert.ok(Math.abs(D(j.tailRoot,j.pelvis)-bind)<1e-8);
    }
  }
  const tip=expression=>poseAt('stand',.125,{tailExpression:expression}).joints.tailTip;
  assert.ok(tip('happy').y<tip('fearful').y);
  assert.ok(tailAngles(tailAt('trot',.2,{enabled:false})).every(v=>v===0));
});

test('head compensation moves the skull without moving the shoulder joint',()=>{
  for(const [mode,g] of Object.entries(GAITS)){
    const p=poseAt(mode,.23*g.period),base=poseAt(mode,.23*g.period,{headMotion:false});
    for(const k of ['shoulder','scapula','withers','thorax'])assert.deepEqual(p.joints[k],base.joints[k],k);
    if(mode==='stand')assert.deepEqual(p.joints.occiput,base.joints.occiput);
    else assert.ok(D(p.joints.occiput,base.joints.occiput)>.05,mode);
    assert.ok(V(p.joints.nose));
  }
  assert.equal(headAt('stand',.3,1,{},true).enabled,false);
});

test('all tail expressions keep a single closed contour without sampled crossings',()=>{
  const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const crosses=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&orient(c,d,a)*orient(c,d,b)<-1e-8;
  for(const [mode,gait] of Object.entries(GAITS)){
    for(const expression of ['auto','calm','happy','excited','alert','unsure','fearful','tense']){
      for(let n=0;n<14;n++){
        const pose=poseAt(mode,n*gait.period/13,{tailExpression:expression});
        const contour=contourAt(pose);
        assert.equal(contour.filter(c=>c[0]==='M').length,1);
        assert.equal(contour.filter(c=>c[0]==='Z').length,1);
        assert.equal(contour.length,CONTOUR.length);
        for(const c of contour)assert.ok(c.slice(1).every(Number.isFinite),mode+'/'+expression+'/'+n);
        const pts=sampleContour(contour,7);
        for(let i=0;i<pts.length;i++)for(let j=i+2;j<pts.length;j++){
          if(i===0&&j===pts.length-1)continue;
          assert.equal(crosses(pts[i],pts[(i+1)%pts.length],pts[j],pts[(j+1)%pts.length]),false,
            'cross '+mode+'/'+expression+'/'+n+' at '+i+','+j);
        }
        assert.ok(V(pose.joints.occiput));
        assert.ok(V(pose.joints.tailTip));
      }
    }
  }
});

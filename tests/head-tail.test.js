import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { headAt, headDelta } from '../src/animation/head.js';
import { EXPRESSIONS, NATURAL_TAIL, buildNaturalTail, tailExpressionTargets, tailAt, tailDelta } from '../src/animation/tail.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { CONTOUR, sampleContour } from '../src/geometry/contour.js';
const D = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const V = v=>Object.values(v).every(Number.isFinite);

test('neutral stand unchanged; selected tail expression can animate in stand',()=>{
  assert.strictEqual(contourAt(poseAt('stand',9)),CONTOUR);
  assert.strictEqual(contourAt(poseAt('stand',9,{tailMotion:false,tailExpression:'happy'})),CONTOUR);
  const happy=poseAt('stand',.23,{tailExpression:'happy'});
  assert.notStrictEqual(contourAt(happy),CONTOUR);
  assert.deepEqual(contourAt(happy)[2],CONTOUR[2]);
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

test('tail root stays attached and expression displacements remain continuous',()=>{
  for(const expression of Object.keys(EXPRESSIONS)){
    for(const time of [0,.08,.22,.45,1.05]){
      const t=tailAt('walk',time,{expression});
      assert.deepEqual(tailDelta(248,t),{x:0,y:0});
      assert.ok(V(tailDelta(128,t)));
      assert.ok(D(tailDelta(128,t),tailDelta(128.001,t))<.1);
    }
  }
  const happy=tailAt('stand',.125,{expression:'happy'});
  const fear=tailAt('stand',.125,{expression:'fearful'});
  assert.ok(tailDelta(128,happy).y<tailDelta(128,fear).y);
  assert.deepEqual(tailDelta(128,tailAt('trot',.2,{enabled:false})),{x:0,y:0});
});

test('head compensation moves the skull without moving the shoulder joint',()=>{
  for(const [mode,g] of Object.entries(GAITS)){
    const p=poseAt(mode,.23*g.period),base=poseAt(mode,.23*g.period,{headMotion:false});
    assert.deepEqual(headDelta(562,257,p.head),{x:0,y:0});
    assert.deepEqual(headDelta(620,314,p.head),{x:0,y:0});
    assert.deepEqual(p.joints.shoulder,base.joints.shoulder);
    if(mode==='stand')assert.deepEqual(p.joints.occiput,base.joints.occiput);
    else assert.ok(D(p.joints.occiput,base.joints.occiput)>.05,mode);
    assert.ok(V(headDelta(730,170,p.head)));
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

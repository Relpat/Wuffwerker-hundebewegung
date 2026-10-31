import test from 'node:test';
import assert from 'node:assert/strict';
import { GAITS, poseAt, pawPath } from '../src/animation/gaits.js';
import { FAR_BIND, FAR_BONES, JOINTS } from '../src/skeleton/stand.js';
import { farContours } from '../src/geometry/far-limbs.js';
import { CONTOUR, sampleContour } from '../src/geometry/contour.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { torsoDelta } from '../src/animation/body.js';

const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const point=xy=>({x:xy[0],y:xy[1]});
const near=(a,b,eps=.015)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);

test('all four touchdown offsets reproduce v7.5.1 exactly',()=>{
  assert.deepEqual(GAITS.walk.offsets,{hindNear:0,frontNear:.75,hindFar:.50,frontFar:.25});
  assert.deepEqual(GAITS.trot.offsets,{hindNear:0,frontNear:.50,hindFar:.50,frontFar:0});
  assert.deepEqual(GAITS.run.offsets,{hindNear:0,frontNear:.515,hindFar:.035,frontFar:.55});
  assert.deepEqual(GAITS.pace.offsets,{hindNear:0,frontNear:0,hindFar:.50,frontFar:.50});
  for(const gait of Object.values(GAITS)){
    assert.equal(Object.keys(gait.offsets).length,4);
    assert.ok(Object.values(gait.offsets).every(v=>v>=0&&v<1));
  }
});

test('four independent paw target phases, with correct trot and pace pairs',()=>{
  const t=.125;
  const trot=GAITS.trot;
  const tp=Object.fromEntries(Object.entries(trot.offsets).map(([leg,o])=>[leg,pawPath(t*trot.period,trot,o)]));
  assert.deepEqual(tp.hindNear,tp.frontFar);
  assert.deepEqual(tp.hindFar,tp.frontNear);
  assert.notDeepEqual(tp.hindNear,tp.hindFar);
  const pace=GAITS.pace;
  const pp=Object.fromEntries(Object.entries(pace.offsets).map(([leg,o])=>[leg,pawPath(t*pace.period,pace,o)]));
  assert.deepEqual(pp.hindNear,pp.frontNear);
  assert.deepEqual(pp.hindFar,pp.frontFar);
  assert.notDeepEqual(pp.hindNear,pp.hindFar);
  const walk=GAITS.walk;
  assert.equal(new Set(Object.values(walk.offsets)).size,4);
});

test('far-side legs obey fixed bone lengths and all four feet reach their cycle targets',()=>{
  for(const [mode,gait] of Object.entries(GAITS)){
    for(let i=0;i<80;i++){
      const t=i*gait.period/80,p=poseAt(mode,t),j=p.joints;
      assert.ok(p.targetError<.01,`${mode} ${i} error ${p.targetError}`);
      for(const [a,b,l] of [
        ['farShoulder','farElbow',80],['farElbow','farFrontPaw',94],
        ['farHip','farStifle',77],['farStifle','farHock',70],
        ['farHock','farHindPaw',Math.hypot(17,48)],
      ]) near(len(j[a],j[b]),l,.02);
      for(const name of ['front','hind','frontFar','hindFar'])assert.equal(typeof p.support[name],'boolean');
      if(p.support.frontFar)near(j.farFrontPaw.y,FAR_BIND.farFrontPaw[1]);
      if(p.support.hindFar)near(j.farHindPaw.y,FAR_BIND.farHindPaw[1]);
      for(const [a,b] of FAR_BONES)assert.ok(j[a]&&j[b],`missing far bone ${a}/${b}`);
    }
  }
});

test('far hips/shoulders attach to the same torso deformation field',()=>{
  for(const [mode,gait] of Object.entries(GAITS)){
    const p=poseAt(mode,.21*gait.period);
    for(const name of ['farHip','farShoulder']) {
      const at=point(FAR_BIND[name]);
      const d=torsoDelta(at.x,at.y,p.body);
      near(p.joints[name].x,at.x+d.x);
      near(p.joints[name].y,at.y+d.y);
    }
  }
});

test('far legs are two finite closed paths, and neutral near-side outline never changes',()=>{
  const stand=poseAt('stand',0);
  assert.strictEqual(contourAt(stand),CONTOUR);
  for(const [mode,gait] of Object.entries(GAITS)){
    for(let i=0;i<40;i++){
      const p=poseAt(mode,i*gait.period/40);
      const contours=farContours(p);
      for(const name of ['front','hind']){
        const cmds=contours[name];
        assert.equal(cmds.filter(c=>c[0]==='M').length,1);
        assert.equal(cmds.filter(c=>c[0]==='Z').length,1);
        assert.ok(cmds.every(c=>c.slice(1).every(Number.isFinite)));
        const points=sampleContour(cmds,8);
        assert.ok(points.every(v=>v.x>80&&v.x<880&&v.y>190&&v.y<500),`${name} ${mode} ${i}`);
      }
    }
  }
});


test('far-leg paths have no sampled self-intersections at 100 phases per gait',()=>{
  const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const cross=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8 && orient(c,d,a)*orient(c,d,b)<-1e-8;
  for(const [mode,gait] of Object.entries(GAITS)) {
    for(let n=0;n<100;n++){
      const shapes=farContours(poseAt(mode,n*gait.period/100));
      for(const [name,cmds] of Object.entries(shapes)) {
        const pts=sampleContour(cmds,10);
        for(let i=0;i<pts.length;i++)for(let j=i+2;j<pts.length;j++){
          if(i===0&&j===pts.length-1)continue;
          assert.equal(cross(pts[i],pts[(i+1)%pts.length],pts[j],pts[(j+1)%pts.length]),false,
            `${mode}/${name} phase ${n} segments ${i}/${j}`);
        }
      }
    }
  }
});

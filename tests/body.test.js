import test from 'node:test';
import assert from 'node:assert/strict';
import { TORSO_PARAMS, torsoAt, torsoDelta } from '../src/animation/body.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { CONTOUR, sampleContour } from '../src/geometry/contour.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { JOINTS } from '../src/skeleton/stand.js';

const modes = Object.keys(GAITS).filter(mode => mode !== 'stand');
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const standJoint = key => ({x:JOINTS[key][0],y:JOINTS[key][1]});

test('static pose remains byte-for-byte identical to the baseline', () => {
  for(const enabled of [true,false]) {
    const pose = poseAt('stand',17,{bodyMotion:enabled});
    assert.strictEqual(contourAt(pose),CONTOUR);
    assert.deepEqual(pose.joints.pelvis,standJoint('pelvis'));
  }
});

test('body motion is periodic, mode-specific, and disabled explicitly',()=>{
  for(const mode of modes){
    const gait=GAITS[mode];
    const once=torsoAt(mode,.13*gait.period,gait.period);
    const next=torsoAt(mode,1.13*gait.period,gait.period);
    for(const k of ['hipY','shoulderY','spineFlex']) assert.ok(Math.abs(once[k]-next[k])<1e-8,`${mode} ${k}`);
    const disabled=torsoAt(mode,.13*gait.period,gait.period,false);
    assert.equal(disabled.enabled,false);
    assert.deepEqual(torsoDelta(450,230,disabled),{x:0,y:0});
    assert.ok(TORSO_PARAMS[mode].bob>0);
    assert.ok(Math.abs(once.hipY)+Math.abs(once.shoulderY)>0);
  }
});

test('pelvis/withers/spine are linked to the same deformation field used by the outline',()=>{
  for(const mode of modes){
    const gait=GAITS[mode];
    let moved=false;
    for(let i=0;i<32;i++){
      const pose=poseAt(mode,i*gait.period/32);
      for(const key of ['pelvis','withers','spine','neckBase','tailRoot']){
        const original=standJoint(key), delta=torsoDelta(original.x,original.y,pose.body);
        assert.ok(dist(pose.joints[key],{x:original.x+delta.x,y:original.y+delta.y})<1e-8,`${mode} ${key}`);
      }
      moved ||= Math.abs(pose.joints.spine.y-JOINTS.spine[1])>2;
    }
    assert.ok(moved,`${mode}: missing spine motion`);
  }
});

test('feet remain on their ground targets in stance while shoulder/hip move',()=>{
  for(const mode of modes){
    const gait=GAITS[mode];
    for(let i=0;i<64;i++){
      const pose=poseAt(mode,i*gait.period/64);
      assert.ok(pose.targetError<.01, `${mode} IK target error ${pose.targetError}`);
      if(pose.support.front)assert.ok(Math.abs(pose.joints.frontPaw.y-JOINTS.frontPaw[1])<.01);
      if(pose.support.hind)assert.ok(Math.abs(pose.joints.hindPaw.y-JOINTS.hindPaw[1])<.01);
      assert.ok(Math.abs(dist(pose.joints.shoulder,pose.joints.elbow)-80)<.01);
      assert.ok(Math.abs(dist(pose.joints.elbow,pose.joints.frontPaw)-94)<.01);
      assert.ok(Math.abs(dist(pose.joints.hip,pose.joints.stifle)-77)<.01);
      assert.ok(Math.abs(dist(pose.joints.stifle,pose.joints.hock)-70)<.01);
    }
  }
});

test('turning body motion off restores static torso without removing leg cycles',()=>{
  const pose=poseAt('run',.17,{bodyMotion:false});
  for(const key of ['hip','shoulder','spine','pelvis','neckBase','occiput'])
    assert.deepEqual(pose.joints[key],standJoint(key));
  assert.deepEqual(contourAt(pose).slice(0,15),CONTOUR.slice(0,15));
  assert.notDeepEqual(pose.joints.frontPaw,standJoint('frontPaw'));
});

test('moving body keeps a single finite contour with no sampled crossings',()=>{
  const orientation=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  const crosses=(a,b,c,d)=>orientation(a,b,c)*orientation(a,b,d)<-1e-8 && orientation(c,d,a)*orientation(c,d,b)<-1e-8;
  for(const mode of modes){
    const gait=GAITS[mode];
    for(let n=0;n<32;n++){
      const cmds=contourAt(poseAt(mode,n*gait.period/32));
      assert.equal(cmds.length,CONTOUR.length);
      assert.equal(cmds.filter(c=>c[0]==='M').length,1);
      assert.equal(cmds.filter(c=>c[0]==='Z').length,1);
      for(const c of cmds)assert.ok(c.slice(1).every(Number.isFinite),`${mode} ${n}`);
      const pts=sampleContour(cmds,5);
      for(let i=0;i<pts.length;i++)for(let j=i+2;j<pts.length;j++){
        if(i===0 && j===pts.length-1)continue;
        assert.equal(crosses(pts[i],pts[(i+1)%pts.length],pts[j],pts[(j+1)%pts.length]),false,
          `${mode} frame ${n}: crossed at ${i},${j}`);
      }
    }
  }
});

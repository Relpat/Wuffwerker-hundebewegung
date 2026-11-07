import test from 'node:test';
import assert from 'node:assert/strict';
import { TORSO_PARAMS, torsoAt, trunkPose } from '../src/animation/body.js';
import { trunkFK, FRONT_CHAIN, REAR_CHAIN } from '../src/skeleton/rig.js';
import { GAITS, poseAt } from '../src/animation/gaits.js';
import { CONTOUR, sampleContour } from '../src/geometry/contour.js';
import { contourAt } from '../src/geometry/animated-contour.js';
import { JOINTS } from '../src/skeleton/stand.js';
import { SEGMENTS } from '../src/skeleton/limbs.js';

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
    const still=trunkPose(disabled,{enabled:false},null);
    assert.equal(still.x,0); assert.equal(still.y,0); assert.equal(still.pitch,0);
    assert.ok(Object.values(still.angles).every(a=>a===0));
    assert.ok(TORSO_PARAMS[mode].bob>0);
    assert.ok(Math.abs(once.hipY)+Math.abs(once.shoulderY)>0);
  }
});

test('spine, neck and tail joints are posed by one forward-kinematics chain (bone lengths kept)',()=>{
  const chainLengths=chain=>chain.slice(1).map((k,i)=>[chain[i],k]);
  for(const mode of modes){
    const gait=GAITS[mode];
    let moved=false;
    for(let i=0;i<32;i++){
      const pose=poseAt(mode,i*gait.period/32);
      const {joints}=trunkFK(pose.trunk);
      for(const key of [...FRONT_CHAIN,...REAR_CHAIN])
        assert.ok(dist(pose.joints[key],joints[key])<1e-8,`${mode} ${key}`);
      for(const [a,b] of [...chainLengths(FRONT_CHAIN),...chainLengths(REAR_CHAIN)])
        assert.ok(Math.abs(dist(pose.joints[a],pose.joints[b])-dist(standJoint(a),standJoint(b)))<1e-6,`${mode} ${a}/${b}`);
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
      for(const [a,b,l] of SEGMENTS) assert.ok(Math.abs(dist(pose.joints[a],pose.joints[b])-l)<.01,`${mode} ${a}/${b}`);
    }
  }
});

test('turning body motion off restores static torso without removing leg cycles',()=>{
  const pose=poseAt('run',.17,{bodyMotion:false,headMotion:false,tailMotion:false});
  for(const key of ['hip','scapula','spine','pelvis','neckBase','occiput'])
    assert.deepEqual(pose.joints[key],standJoint(key));
  contourAt(pose).slice(0,15).forEach((c,i)=>c.slice(1).forEach((v,k)=>assert.ok(Math.abs(v-CONTOUR[i][k+1])<1e-9,`cmd ${i}`)));
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

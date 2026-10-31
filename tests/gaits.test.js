import test from 'node:test';
import assert from 'node:assert/strict';
import {GAITS, poseAt, pawPath} from '../src/animation/gaits.js';
import {CONTOUR, sampleContour} from '../src/geometry/contour.js';
import {contourAt} from '../src/geometry/animated-contour.js';
import {JOINTS} from '../src/skeleton/stand.js';
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// A cheap sampled geometric check, independent of WebGL or browser animations.
function intersects(points){
 const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 const cross=(a,b,c,d)=>orient(a,b,c)*orient(a,b,d)<-1e-8&&orient(c,d,a)*orient(c,d,b)<-1e-8;
 for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){
  if(i===0&&j===points.length-1)continue;
  if(cross(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))return [i,j];
 }
 return null;
}

test('standing pose reproduces original silhouette, without drift',()=>{
 assert.strictEqual(contourAt(poseAt('stand',5)),CONTOUR);
});

test('near-leg IK lengths remain constant over the full gait cycles',()=>{
 for(const [mode,g] of Object.entries(GAITS)){
  for(let n=0;n<=32;n++){
   const p=poseAt(mode,n*g.period/32).joints;
   const pts=[p.frontPaw,p.elbow,p.shoulder,p.hindPaw,p.hock,p.stifle,p.hip];
   for(const pt of pts)assert.ok(Number.isFinite(pt.x)&&Number.isFinite(pt.y));
   if(mode==='stand')continue;
   assert.ok(Math.abs(length(p.shoulder,p.elbow)-80)<1e-5);
   assert.ok(Math.abs(length(p.elbow,p.frontPaw)-94)<1e-5);
   assert.ok(Math.abs(length(p.hip,p.stifle)-77)<1e-5);
   assert.ok(Math.abs(length(p.stifle,p.hock)-70)<1e-5);
   assert.ok(Math.abs(length(p.hock,p.hindPaw)-Math.hypot(17,48))<1e-5);
  }
 }
});

test('foot trajectories are continuous over stance-to-swing and cycle boundary',()=>{
 for(const g of Object.values(GAITS))if(g.stride){
  for(const offset of [g.front,g.hind]){
   const before=pawPath((g.stance-offset-1e-6)*g.period,g,offset);
   const after=pawPath((g.stance-offset+1e-6)*g.period,g,offset);
   assert.ok(Math.abs(before.x-after.x)<.0015);
   assert.ok(Math.abs(before.y-after.y)<.0015);
   const a=pawPath((-offset-1e-6)*g.period,g,offset);
   const b=pawPath((-offset+1e-6)*g.period,g,offset);
   assert.ok(Math.abs(a.x-b.x)<.0015);
   assert.ok(Math.abs(a.y-b.y)<.0015);
  }
 }
});

test('animated outline stays closed and finite with no separated limb meshes',()=>{
 for(const [mode,g] of Object.entries(GAITS)){
  for(let n=0;n<=16;n++){
   const commands=contourAt(poseAt(mode,n*g.period/16));
   assert.equal(commands[0][0],'M');assert.equal(commands.at(-1)[0],'Z');
   assert.equal(commands.length,CONTOUR.length);
   for(const [op,...coords] of commands){assert.ok(coords.every(Number.isFinite),`${mode}: ${op}`);}
   const points=sampleContour(commands,4);
   const crossed=intersects(points);
   assert.equal(crossed,null,`${mode} frame ${n}: crossing ${crossed}`);
  }
 }
});

test('switching torso movement off preserves the previous fixed-body contour',()=>{
 const moving=contourAt(poseAt('trot',.2,{bodyMotion:false,headMotion:false,tailMotion:false}));
 for(let i=0;i<=14;i++)assert.deepEqual(moving[i],CONTOUR[i]);
});

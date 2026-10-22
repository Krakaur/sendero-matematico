import test from 'node:test';
import assert from 'node:assert/strict';
import {CircuitView,courseGeometry,coursePoint} from '../web/circuit.js';

function bare(id,roomScene=false){
  return Object.assign(Object.create(CircuitView.prototype),{
    course:courseGeometry(id),roomScene,markerLayer:null,markerSeats:[],projectedMarkers:[]
  });
}
const cases=[{w:280,h:180,boat:64},{w:350,h:250,boat:64},{w:1100,h:340,boat:84}];

test('C11: each observed seat stays in view on three courses in both motion modes',()=>{
  for(const id of ['bosque','islas','cascada'])for(const size of cases)
    for(const reduced of [false,true])for(let seat=0;seat<4;seat++)for(let step=0;step<=16;step++){
      const v=bare(id,true),progress=step/16,cam=v.camera(progress,size.w,size.h,reduced,seat);
      const point=v.project(progress,seat,cam,size.w,size.h,size.boat);
      assert.equal(point.edge,'',JSON.stringify({id,...size,reduced,seat,progress,point}));
      assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y)&&Number.isFinite(point.angle));
      assert.equal(cam.followSeat,seat);
    }
});

test('C11: shared overview is fixed and keeps all seats visible without changing lane progress',()=>{
  for(const id of ['bosque','islas','cascada'])for(const size of cases){
    const v=bare(id,true),a=v.camera(0,size.w,size.h,false,null),b=v.camera(1,size.w,size.h,false,null);
    assert.deepEqual([a.x,a.y,a.scale,a.angle],[b.x,b.y,b.scale,b.angle]);
    assert.equal(a.followSeat,null);
    for(let seat=0;seat<4;seat++)for(let step=0;step<=16;step++){
      const progress=step/16,before=coursePoint(id,progress,seat);
      assert.equal(v.project(progress,seat,a,size.w,size.h,size.boat).edge,'');
      assert.deepEqual(coursePoint(id,progress,seat),before);
    }
  }
});

test('C11: individual default remains explicitly equivalent to seat zero',()=>{
  for(const id of ['bosque','islas','cascada'])for(const reduced of [false,true]){
    const v=bare(id),cam=v.camera(.375,350,250,reduced);
    assert.deepEqual(cam,v.camera(.375,350,250,reduced,0));
    if(id==='cascada'&&!reduced){
      assert.equal(cam.anchorY,250*.46);
      assert.equal(cam.x,coursePoint(id,.375,0).x);
      assert.equal(cam.y,coursePoint(id,.375,0).y);
    }
  }
});

class Element {
  constructor(tag='div'){
    this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.className='';
    this.style={setProperty:(k,v)=>{this.attributes[k]=v;}};
    const classes=new Set();
    this.classList={add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x)),contains:v=>classes.has(v)};
    this.ctx=new Proxy({}, {get:()=>()=>{}});
  }
  append(...children){this.children.push(...children);for(const c of children)c.parentElement=this;}
  setAttribute(k,v){this.attributes[k]=String(v);}
  querySelector(selector){return selector==='.circuit-legend'?this.children.find(c=>c.className==='circuit-legend')||null:null;}
  getContext(){return this.ctx;}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
}
function fixture(seats,room=true){
  const scene=new Element();scene.classList.add(room?'room-scene':'curved-regatta');
  const boats=seats.map(seat=>{
    const boat=new Element();boat.dataset[room?'roomRacer':'racer']=String(seat);
    boat.querySelector=()=>({textContent:['Luma','Nube','Rayo','Chispa'][seat]});
    return boat;
  });
  scene.querySelectorAll=()=>boats;
  const canvas=new Element('canvas');canvas.closest=()=>scene;scene.append(canvas);
  class View extends CircuitView {paintWorld(){}}
  return {view:new View(canvas,'cascada'),scene,boats};
}
function withDOM(run){
  const originals=new Map(['document','Image','devicePixelRatio'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
  Object.defineProperty(globalThis,'document',{configurable:true,writable:true,value:{
    createElement:tag=>new Element(tag),createElementNS:(_ns,tag)=>new Element(tag)
  }});
  Object.defineProperty(globalThis,'Image',{configurable:true,writable:true,value:class {complete=false;naturalWidth=0;}});
  Object.defineProperty(globalThis,'devicePixelRatio',{configurable:true,writable:true,value:1});
  try{return run();}finally{for(const [key,d]of originals){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}}
}

test('C11: two, three and four participants retain seat identity in any DOM/projection order',()=>withDOM(()=>{
  for(const seats of [[3,1],[2,0,3],[3,1,0,2]]){
    const {view:v,scene,boats}=fixture(seats);
    assert.deepEqual(v.markerSeats,[...seats].sort((a,b)=>a-b));
    assert.equal(v.markerNodes.filter(Boolean).length,seats.length);
    assert.equal(v.legend.children.length,seats.length);
    for(const boat of boats)assert.equal(boat.dataset.circuitKey,['L','N','R','C'][Number(boat.dataset.roomRacer)]);
    const cam=v.draw(.5,280,180,false,seats[0]);
    for(const seat of seats)v.project(.5,seat,cam,280,180,64);
    for(const seat of seats)assert.ok(v.markerNodes[seat].lastTransform);
    v.dispose();
    assert.equal(scene.classList.contains('circuit-has-callouts'),false);
  }
}));

test('C11: identity keys separate a clustered group and do not reuse stale frame positions',()=>withDOM(()=>{
  const {view:v}=fixture([0,1,2,3]);
  for(const seat of v.markerSeats)v.projectedMarkers[seat]={x:140,y:90,edge:''};
  v.paintMarkers(280,180,64);
  const points=v.markerSeats.map(seat=>v.labelPlacements[seat]);
  for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)
    assert.ok(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)>=26);
  const previous=v.markerNodes.map(n=>n.lastTransform);
  const cam=v.draw(.8,280,180,false,2);
  v.project(.8,2,cam,280,180,64);
  assert.deepEqual(v.markerNodes.map(n=>n.lastTransform),previous);
  assert.equal(v.projectedMarkers.filter(Boolean).length,1);
}));

test('C11: individual legend preserves the learner key and three known opponents',()=>withDOM(()=>{
  const {view:v,boats}=fixture([0,1,2,3],false);
  assert.equal(boats[0].dataset.circuitKey,'T');
  assert.equal(v.legend.children[0].children[1].textContent,'Tú');
  assert.deepEqual(v.markerSeats,[0,1,2,3]);
}));

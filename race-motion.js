// Presentation only. Earned distance, response timing and finish order live in race.js.
import {CircuitView,coursePoint} from './circuit.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Exact critically damped response: continuous velocity across new impulses,
// independent of frame rate. Waiting never earns unearned distance.
export function advanceBoat(position,velocity,target,seconds,omega=1.05) {
  const dt=Math.max(0,seconds),goal=clamp(target,position,1);
  if(!dt)return {position,velocity};
  const a=position-goal,b=velocity+omega*a,e=Math.exp(-omega*dt);
  const next=goal+(a+b*dt)*e,v=(velocity-omega*b*dt)*e;
  return {position:clamp(next,position,goal),velocity:next>=goal?0:Math.max(0,v)};
}
export function projectCourse(progress,player,width,boatWidth) {
  const span=width*2.1,start=width*.17,camera=clamp(start+player*span-width*.38,0,width*1.45);
  const worldX=start+progress*span-camera;
  return {x:clamp(worldX,boatWidth*.55,width-boatWidth*.55),camera,
    edge:worldX<boatWidth*.55?'behind':worldX>width-boatWidth*.55?'ahead':''};
}
export class RiverMotion {
  constructor(scene,progress=0) {
    this.scene=scene;this.stage=scene.querySelector('.race-stage');
    this.circuit=new CircuitView(scene.querySelector('.circuit-canvas'),scene.dataset.circuit||'bosque');
    this.boats=[...scene.querySelectorAll('[data-racer]')];
    this.dots=[...scene.querySelectorAll('[data-map-racer]')];
    this.map=scene.querySelector('.course-map');
    this.segment=scene.querySelector('#route-segment');this.steps=scene.querySelector('#route-steps');
    this.pearls=[...scene.querySelectorAll('.route-pearl')];this.lastSteps=-1;this.lastSegment=null;
    this.background=scene.querySelector('.river-panorama');
    this.glints=scene.querySelector('.river-glints');this.foreground=scene.querySelector('.river-foreground');
    this.wake=this.boats[0].querySelector('.boat-wake');
    this.ribbon=scene.querySelector('.finish-ribbon');
    this.position=progress;this.velocity=0;this.lastElapsed=null;this.flow=0;
    this.width=this.stage.clientWidth;this.boatWidth=this.boats[0].offsetWidth;
    this.mapWidth=this.map.clientWidth;
    this.dots.forEach(dot=>dot.style.left='0');
    this.resize=new ResizeObserver(()=>{this.width=this.stage.clientWidth;this.boatWidth=this.boats[0].offsetWidth;this.mapWidth=this.map.clientWidth;});
    this.resize.observe(this.stage);
  }
  draw(stats,elapsed,reduced=false,arriving=false) {
    const dt=this.lastElapsed===null?0:Math.max(0,(elapsed-this.lastElapsed)/1000);
    this.lastElapsed=elapsed;
    if(reduced){this.position=stats.progress;this.velocity=0;}
    else Object.assign(this,advanceBoat(this.position,this.velocity,stats.progress,dt,arriving?10:1.05));
    const positions=[this.position,...stats.bots],w=this.width;
    if(!w)return;
    const cam=this.circuit.draw(this.position,w,this.stage.clientHeight,reduced);
    this.boats.forEach((boat,i)=>{
      const projected=this.circuit.project(positions[i],i,cam,w,this.stage.clientHeight,this.boatWidth);
      boat.style.transform=`translate3d(${projected.x.toFixed(2)}px,${projected.y.toFixed(2)}px,0)`;
      boat.querySelector('.canoe-art').style.rotate=`${projected.angle.toFixed(2)}deg`;
      if(boat.dataset.edge!==projected.edge)boat.dataset.edge=projected.edge;
      boat.dataset.progress=positions[i].toFixed(5);
      const point=coursePoint(this.circuit.course.id,positions[i],i);
      this.dots[i].style.transform=`translate3d(${point.x/3200*this.mapWidth-3.5}px,${point.y/this.circuit.course.height*this.map.clientHeight-2}px,0)`;
    });
    const speed=clamp(this.velocity*20,0,1);
    // Keep per-frame values on the affected leaf, not inherited by every sprite.
    // Rewriting root custom properties invalidates the entire scene in Firefox.
    this.wake.style.setProperty('--boat-speed',speed.toFixed(3));
    const moving=speed>.03?'true':'false';
    if(this.scene.dataset.moving!==moving)this.scene.dataset.moving=moving;
    this.flow+=dt*(10+speed*120);
    this.ribbon.style.opacity='0';
    const segment=this.position<.34?'El bosque de luz':this.position<.7?'El jardín del río':'Rumbo a la cascada',steps=Math.round(stats.progress*8);
    if(segment!==this.lastSegment){this.segment.textContent=segment;this.lastSegment=segment;}
    if(steps!==this.lastSteps){this.steps.textContent=`${steps} / 8`;this.pearls.forEach((el,i)=>el.classList.toggle('passed',i<steps));this.lastSteps=steps;}
    return 1+stats.bots.filter(p=>p>this.position).length;
  }
  dispose(){this.resize.disconnect();this.circuit.dispose();}
}

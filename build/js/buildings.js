// =====================================================
//  Aurora Skylines — Buildings (Remodelled)
// =====================================================
'use strict';

// ── Helpers ───────────────────────────────────────
function _box(w,h,d,col,opt={}){
  const m=new THREE.MeshPhongMaterial({color:col,flatShading:true,shininess:opt.sh||12,...(opt.em?{emissive:opt.em,emissiveIntensity:opt.ei||0}:{})});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  if(opt.win){mesh.userData.isWindow=true;mesh.userData.winRnd=0.7+Math.random()*0.6;}
  if(opt.lamp){mesh.userData.isLamp=true;}
  if(opt.shadow!==false){mesh.castShadow=true;mesh.receiveShadow=true;}
  return mesh;
}
function _cyl(rt,rb,h,seg,col,opt={}){
  const m=new THREE.MeshPhongMaterial({color:col,flatShading:true,shininess:opt.sh||12,...(opt.em?{emissive:opt.em,emissiveIntensity:opt.ei||0}:{})});
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);
  if(opt.win){mesh.userData.isWindow=true;mesh.userData.winRnd=0.7+Math.random()*0.6;}
  if(opt.lamp){mesh.userData.isLamp=true;}
  if(opt.shadow!==false){mesh.castShadow=true;mesh.receiveShadow=true;}
  return mesh;
}
function _add(g,mesh,x,y,z,rx,ry,rz){
  mesh.position.set(x,y,z);
  if(rx)mesh.rotation.x=rx;
  if(ry)mesh.rotation.y=ry;
  if(rz)mesh.rotation.z=rz;
  g.add(mesh);
  return mesh;
}
function rnd(a,b,gx,gz,s){return a+seededRandom(gx,gz,s)*(b-a);}

// ── House ─────────────────────────────────────────
function makeHouse(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const wallH=rnd(.55,.7,gx,gz,2);
  const wallC=new THREE.Color().setHSL(rnd(.04,.14,gx,gz,3),.42,.68);
  const roofC=new THREE.Color().setHSL(rnd(0,.08,gx,gz,4),.55,.32);
  const acC=0x94a3b8;

  if(v===0){
    // Classic cottage with peaked roof
    _add(g,_box(1.1,wallH,1.05,wallC),0,wallH/2+.12,0);
    const rh=rnd(.45,.65,gx,gz,5);
    const roof=_cyl(0,.72,rh,4,roofC);roof.rotation.y=Math.PI/4;
    _add(g,roof,0,wallH+.12+rh/2-.04,0);
    _add(g,_box(.13,.38,.13,0x5c3d2e),0,wallH+.12+rh*.3,.28); // chimney
    _add(g,_box(.22,.3,.06,0x5c3d2e,{shadow:false}),0,.26,.55); // door
    _add(g,_box(.28,.22,.05,0xfff5cc,{win:true,em:0xffaa44,ei:0,sh:80}),.0,wallH*.6,.55); // window
    // garden fence posts
    for(let i=-1;i<=1;i+=2){
      _add(g,_box(.05,.24,.05,0xc8b89a),i*.38,.23,.74);
      _add(g,_box(.05,.24,.05,0xc8b89a),i*.38,.23,.55);
    }
    _add(g,_box(.82,.04,.06,0xc8b89a),0,.28,.74); // fence rail
    _add(g,_box(.12,.02,.36,0x94a3b8,{shadow:false}),0,.13,.7); // path
  } else if(v===1){
    // Modern flat-roof townhouse
    const h=rnd(.8,1.1,gx,gz,2);
    _add(g,_box(1.25,h,1.1,wallC),0,h/2+.12,0);
    _add(g,_box(1.32,.12,1.17,0x1e293b),.0,h+.18,0); // parapet
    _add(g,_box(.72,.36,.06,0xbae6fd,{win:true,em:0x0ea5e9,ei:0,sh:120}),0,h*.5,.56); // big window
    _add(g,_box(.22,.34,.06,0x222222,{shadow:false}),-.3,.28,.56); // door
    // Garage
    _add(g,_box(.65,h*.7,.8,wallC),.48,h*.35+.12,-.08);
    _add(g,_box(.5,h*.58,.04,0xe2e8f0,{shadow:false}),.48,h*.29+.12,.36); // garage door
    _add(g,_box(.4,.06,.4,acC),0,h+.28,-.2); // rooftop AC
  } else {
    // Bungalow with porch
    const h=rnd(.6,.75,gx,gz,2);
    _add(g,_box(1.4,h,1.0,wallC),-.05,h/2+.12,0);
    // Hip roof (layered boxes)
    _add(g,_box(1.5,.16,1.1,roofC),-.05,h+.20,0);
    _add(g,_box(1.2,.14,.8,roofC),-.05,h+.34,0);
    _add(g,_box(.7,.12,.4,roofC),-.05,h+.46,0);
    // Porch slab
    _add(g,_box(.9,.08,.5,0x94a3b8,{shadow:false}),.35,.13,.55);
    // Porch pillars
    _add(g,_cyl(.04,.04,h*.8,5,0xd4d4d4),.15,h*.4+.12,.55);
    _add(g,_cyl(.04,.04,h*.8,5,0xd4d4d4),.52,h*.4+.12,.55);
    _add(g,_box(.22,.28,.05,0x5c3d2e,{shadow:false}),.33,.24,.57); // door
    _add(g,_box(.3,.2,.05,0xfff5cc,{win:true,em:0xffaa44,ei:0}),-.25,h*.55,.54); // window
  }
  return g;
}

// ── Apartment ─────────────────────────────────────
function makeApartment(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const floors=3+Math.floor(rnd(0,5,gx,gz,2));
  const fh=.52;
  const cols=[0x3b82f6,0x22c55e,0xf97316,0x8b5cf6,0x0ea5e9,0x64748b];
  const fc=cols[Math.floor(rnd(0,cols.length,gx,gz,3))];
  const wm={win:true,em:0xfef3c7,ei:0,sh:100};

  if(v===0){
    // Art-deco stepped tower
    const bh=floors*fh;
    _add(g,_box(1.3,bh,1.2,fc),0,bh/2+.12,0);
    _add(g,_box(1.0,fh*.8,.9,fc),0,bh+.12+fh*.4,0);
    _add(g,_box(.6,fh*.6,.5,fc),0,bh+fh*.8+.12+fh*.3,0);
    for(let f=0;f<floors;f++){
      [-1,0,1].forEach(s=>{
        const w=_box(.2,.22,.05,0xfef3c7,wm);
        _add(g,w,s*.38,.12+f*fh+.26,.63);
      });
    }
    // Rooftop
    _add(g,_box(1.38,.12,1.28,0x1e293b),0,bh+.18,0);
    _add(g,_cyl(.08,.12,.3,8,0x64748b),-.3,bh+.27,.3);// water tower
    _add(g,_cyl(.16,.16,.18,5,0x475569),.25,bh+.21,-.2);// AC
  } else if(v===1){
    // Slim modern tower with balconies
    const bh=floors*fh;
    _add(g,_box(1.0,bh,.95,fc),0,bh/2+.12,0);
    for(let f=0;f<floors;f++){
      // Balcony slab
      _add(g,_box(1.1,.06,.32,0xf1f5f9),0,.12+f*fh+.46,.66);
      // Windows
      const w=_box(.7,.32,.05,0xbae6fd,{win:true,em:0x0ea5e9,ei:0,sh:120});
      _add(g,w,0,.12+f*fh+.26,.5);
    }
    _add(g,_box(1.08,.12,1.03,0x0f172a),0,bh+.18,0);
    _add(g,_cyl(.05,.05,.45,4,0xf1f5f9),0,bh+.4,0);// antenna
  } else {
    // Brutalist block
    const bh=floors*fh;
    _add(g,_box(1.5,bh,1.15,0xc8c8c4),0,bh/2+.12,0);
    for(let f=0;f<floors;f++){
      [-1,1].forEach(s=>{
        // Balcony
        _add(g,_box(.6,.08,.38,0xb0b0ac,{shadow:false}),s*.45,.12+f*fh+.44,s>.0?.58:-.58);
        const w=_box(.35,.28,.05,0xfef3c7,wm);
        _add(g,w,s*.45,.12+f*fh+.28,s>0?.58:-.58);
      });
    }
    _add(g,_box(1.6,.22,1.25,0xa0a09c),0,bh+.23,0);// rooftop plant
    _add(g,_box(.5,.4,.5,0x888884),.4,bh+.32,-.3);// stairwell box
  }
  return g;
}

// ── Shop ──────────────────────────────────────────
function makeShop(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const glassM={win:true,em:0x0ea5e9,ei:0,sh:140};

  if(v===0){
    // Boutique
    _add(g,_box(1.4,.72,1.0,0xfde8d8),0,.48,0);
    _add(g,_box(1.5,.1,1.1,0x1e293b),0,.96,0);// parapet
    // Awning
    const awn=_box(1.5,.07,.48,0xe11d48);awn.rotation.x=-.22;
    _add(g,awn,0,.8,.56);
    _add(g,_box(1.0,.28,.05,0xbae6fd,glassM),0,.42,.53);// storefront glass
    _add(g,_box(.72,.2,.06,0xfbbf24,{em:0xf59e0b,ei:0,sh:60}),.0,.65,.53);// sign
    _add(g,_cyl(.06,.07,.22,5,0x333333),-.55,.23,.6);// bin
    _add(g,_box(.14,.24,.14,0x9ca3af,{shadow:false}),.6,.24,.58);// flower pot
  } else if(v===1){
    // Strip mall 3 bays
    _add(g,_box(1.9,.62,.88,0xf8f5f0),0,.43,0);
    _add(g,_box(2.0,.1,.98,0x374151),0,.79,0);
    const bayX=[-0.58,0,.58];
    bayX.forEach((bx,i)=>{
      _add(g,_box(.52,.36,.05,0xbae6fd,glassM),bx,.38,.46);
      const awn=_box(.54,.06,.3,new THREE.Color().setHSL(i*.33,.8,.45));awn.rotation.x=-.18;
      _add(g,awn,bx,.6,.48);
      _add(g,_box(.42,.16,.05,0xfbbf24,{em:0xf59e0b,ei:0}),bx,.64,.46);
    });
  } else {
    // Dark modern corner store
    _add(g,_box(1.3,.85,1.25,0x1a2030),0,.55,0);
    _add(g,_box(1.1,.62,.05,0xbae6fd,{win:true,em:0x7dd3fc,ei:0,sh:150}),0,.46,.64);
    _add(g,_box(1.4,.1,1.35,0xf0f5f8),0,1.0,0);
    _add(g,_box(.9,.22,.06,0x22d3ee,{em:0x06b6d4,ei:0,sh:80}),0,.78,.65);// neon sign
  }
  return g;
}

// ── Park ──────────────────────────────────────────
function makePark(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const pad=_box(CELL-.16,.14,CELL-.16,0x1a7a48);pad.position.y=.19;g.add(pad);

  function addTree(tx,tz,h,salt){
    const trunk=_cyl(.06,.09,.42,5,0x78350f);_add(g,trunk,tx,.42+.21,tz);
    const shade=new THREE.Color().setHSL(.32+rnd(0,.08,gx,gz,salt),.68,.3);
    const top=_cyl(0,.38,h,6,shade);_add(g,top,tx,.42+.42+h/2-.04,tz);
    const top2=_cyl(0,.28,h*.7,6,new THREE.Color().setHSL(.34+rnd(0,.06,gx,gz,salt+1),.72,.4));
    _add(g,top2,tx,.42+.42+h*.15+h*.7/2,tz);
  }
  function bench(bx,bz,ry){
    const seat=_box(.6,.06,.22,0x8b6a3a);seat.rotation.y=ry;_add(g,seat,bx,.32,bz);
    [-1,1].forEach(s=>{const l=_box(.05,.3,.05,0x8b6a3a);l.rotation.y=ry;_add(g,l,bx+Math.cos(ry)*s*.22,.2,bz+Math.sin(ry)*s*.22);});
  }

  if(v===0){
    for(let i=0;i<10;i++) addTree(rnd(-.92,.92,gx,gz,2+i),rnd(-.92,.92,gx,gz,12+i),rnd(.5,.95,gx,gz,22+i),30+i);
    bench(-.55,.55,0);bench(.55,-.55,Math.PI/2);
  } else if(v===1){
    // Pond park
    _add(g,_cyl(.62,.62,.15,10,0x0ea5e9,{em:0x0284c7,ei:.15}),.0,.2,0);
    addTree(-.78,-.78,.85,2);addTree(.78,.78,.75,3);addTree(-.78,.78,.9,4);addTree(.78,-.78,.8,5);
    bench(-.15,.88,0);
    _add(g,_cyl(.06,.06,.8,5,0x5a5e72),-.5,.58,.88);// lamp
    const lh=_cyl(.1,.1,.05,5,0xffdd88,{lamp:true,em:0xffaa22,ei:0});_add(g,lh,-.5,.98,.88);
  } else {
    // Plaza
    _add(g,_box(1.3,.14,1.3,0x9ba8b5,{shadow:false}),0,.2,0);
    _add(g,_cyl(.18,.22,.12,8,0x94a3b8),.0,.26,0);
    _add(g,_cyl(.08,.08,.42,6,0x64748b),.0,.52,0);// fountain base
    _add(g,_cyl(.22,.12,.12,8,0x7dd3fc,{em:0x38bdf8,ei:.1}),.0,.68,0);// water top
    addTree(-.88,-.88,.7,2);addTree(.88,-.88,.7,3);addTree(-.88,.88,.7,4);addTree(.88,.88,.7,5);
    bench(.0,.65,0);bench(.65,.0,Math.PI/2);
  }
  return g;
}

// ── Wind Turbine ──────────────────────────────────
function makeWindTurbine(gx,gz){
  const g=new THREE.Group();
  _add(g,_cyl(.22,.28,.24,8,0x64748b),.0,.12,0);
  _add(g,_cyl(.05,.13,2.6,8,0x94a3b8),.0,1.42,0);
  const nacelle=_box(.28,.2,.44,0xf1f5f9);_add(g,nacelle,.0,2.72,.12);
  _add(g,_cyl(.09,.09,.08,6,0xe2e8f0),.0,2.72,.35);
  const rotor=new THREE.Group();rotor.position.set(0,2.72,.38);
  for(let i=0;i<3;i++){
    const blade=_box(.055,1.1,.09,0xfafafa);
    blade.position.y=.55;
    const pv=new THREE.Group();pv.add(blade);pv.rotation.z=(i*Math.PI*2)/3;
    rotor.add(pv);
  }
  g.add(rotor);g.userData.rotor=rotor;
  // Warning light
  const wl=_cyl(.06,.06,.04,5,0xff4444,{lamp:true,em:0xff0000,ei:.8});_add(g,wl,0,2.9,0);
  return g;
}

// ── Solar Farm ────────────────────────────────────
function makeSolar(gx,gz){
  const g=new THREE.Group();
  _add(g,_box(2.1,.07,2.1,0x78716c),.0,.04,0);
  _add(g,_box(.35,.44,.35,0x374151),.82,.3,.82);
  _add(g,_box(.12,.06,.12,0x22c55e,{em:0x16a34a,ei:.5}),.82,.54,.82);// status light
  const pMat=new THREE.MeshPhongMaterial({color:0x1e3a8a,flatShading:true,shininess:130});
  const fMat=new THREE.MeshPhongMaterial({color:0x9ca3af,flatShading:true});
  const pos=[[-0.62,-0.62],[-0.0,-0.62],[0.62,-0.62],[-0.62,0],[0,0],[0.62,0],[-0.62,.62],[0,.62],[0.62,.62]];
  pos.forEach(([px,pz])=>{
    const s=_cyl(.022,.022,.3,4,0x9ca3af);_add(g,s,px,.2,pz);
    const p=new THREE.Mesh(new THREE.BoxGeometry(.46,.04,.38),pMat);
    p.position.set(px,.36,pz);p.rotation.x=-.48;p.castShadow=true;g.add(p);
  });
  return g;
}

// ── Nuclear Plant ─────────────────────────────────
function makeNuclear(gx,gz){
  const g=new THREE.Group();
  const cMat=new THREE.MeshPhongMaterial({color:0x9ca3af,flatShading:true});
  // Reactor building
  _add(g,_box(1.3,.85,1.1,0xd1d5db),-.12,.53,0);
  _add(g,_cyl(.48,.48,.5,10,0xe5e7eb,{sh:20}),-.12,.9,0);// dome half
  // Two cooling towers
  [[.72,0],[.72,.42]].forEach(([tx,tz])=>{
    _add(g,new THREE.Mesh(new THREE.CylinderGeometry(.28,.4,.95,10),cMat),tx,.58,tz);
    _add(g,new THREE.Mesh(new THREE.CylinderGeometry(.36,.28,.85,10),cMat),tx,1.43,tz);
    _add(g,_cyl(.38,.36,.06,10,0x475569),tx,1.87,tz);
    // Steam
    _add(g,_cyl(.2,.2,.22,6,0xffffff,{sh:0}),tx,2.06,tz).material.transparent=true,g.children[g.children.length-1].material.opacity=.45;
  });
  _add(g,_cyl(.06,.06,.06,5,0xff4444,{em:0xff0000,ei:.9}),-.12,1.32,0);// red light
  // Fence
  [-1,1].forEach(s=>{
    _add(g,_box(2.2,.28,.04,0x64748b),0,.24,s*.88);
    _add(g,_box(.04,.28,1.82,0x64748b),s*1.1,.24,0);
  });
  return g;
}

// ── Factory ───────────────────────────────────────
function makeFactory(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const bMat=new THREE.MeshPhongMaterial({color:0x94a3b8,flatShading:true,shininess:20});

  if(v===0){
    _add(g,_box(1.65,.92,1.3,0x94a3b8),.0,.58,0);
    _add(g,_box(.85,.75,.9,0x7a8899),-.5,.49,.15);// annex
    [-.45,0,.45].forEach((cx,i)=>{
      _add(g,_cyl(.09,.13,.75+i*.15,6,0x475569),cx,1.42,0);// chimneys
    });
    _add(g,_box(1.1,.04,1.35,0x475569),.0,1.06,0);// roof strip
  } else if(v===1){
    _add(g,_box(1.65,.65,1.55,0x94a3b8),.0,.44,0);
    [-0.5,0,.5].forEach(z=>{
      _add(g,new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,1.65,3),bMat),0,.88,z).rotation.z=Math.PI/2;
    });
    _add(g,_box(.5,.5,.38,0x64748b),.65,.37,-.55);// loading dock
  } else {
    _add(g,_box(1.85,.22,1.4,bMat.color),0,.22,0);
    [-0.5,.5].forEach(cx=>{
      _add(g,_cyl(.38,.38,.7,8,0xe2e8f0,{sh:60}),cx,.65,0);// tanks
      _add(g,_cyl(.04,.04,.5,4,0xf59e0b),0,.46,cx*0.65).rotation.z=Math.PI/2;// pipe
    });
    _add(g,_box(.1,.5,.1,0x475569),0,.57,-.65);// vent
    _add(g,_cyl(.04,.04,.22,5,0x6ee7b7,{em:0x34d399,ei:.5}),0,.8,-.65);// green light
  }
  return g;
}

// ── Registry ──────────────────────────────────────
const FACTORIES={
  road:null,
  house:makeHouse,apartment:makeApartment,shop:makeShop,park:makePark,
  windturbine:makeWindTurbine,solar:makeSolar,nuclear:makeNuclear,factory:makeFactory
};

function getRoadFacingAngle(gx, gz) {
  // Camera is at (28,28,28) → top-right isometric view.
  // Building front (+Z local) appears pointing bottom-left on screen.
  //
  // To face road at South (+gz): rotate 180° so front faces +Z world = bottom-left screen
  //   but road is at +gz which IS +Z → need front (+Z) to point toward +gz → angle 0
  // To face road at North (-gz): need front to point -Z → angle PI
  // To face road at East (+gx): need front to point +X → angle -PI/2
  // To face road at West (-gx): need front to point -X → angle PI/2
  //
  // HOWEVER: the isometric camera means "facing the road" visually =
  //   the building front should point AWAY from center of city toward road.
  //   Since all buildings already face +Z by default (no rotation),
  //   we just need correct rotation per road side.

  const N = state.grid[key(gx,   gz-1)]?.type === 'road';
  const S = state.grid[key(gx,   gz+1)]?.type === 'road';
  const E = state.grid[key(gx+1, gz  )]?.type === 'road';
  const W = state.grid[key(gx-1, gz  )]?.type === 'road';

  const count = (N?1:0)+(S?1:0)+(E?1:0)+(W?1:0);

  // Single road neighbor – always face it
  if (count === 1) {
    if (S) return 0;
    if (N) return Math.PI;
    if (E) return -Math.PI / 2;
    if (W) return Math.PI / 2;
  }

  // Multiple roads: prefer non-opposing road (corner/T building faces the unique side)
  if (S && !N) return 0;
  if (N && !S) return Math.PI;
  if (E && !W) return -Math.PI / 2;
  if (W && !E) return Math.PI / 2;

  // No adjacent road: look 2 tiles out
  if (state.grid[key(gx,   gz+2)]?.type === 'road') return 0;
  if (state.grid[key(gx,   gz-2)]?.type === 'road') return Math.PI;
  if (state.grid[key(gx+2, gz  )]?.type === 'road') return -Math.PI / 2;
  if (state.grid[key(gx-2, gz  )]?.type === 'road') return Math.PI / 2;

  // Stable seeded fallback — never random spin
  return [0, Math.PI, -Math.PI/2, Math.PI/2][Math.floor(seededRandom(gx, gz, 99) * 4)];
}


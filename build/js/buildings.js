// =====================================================
//  Aurora Skylines — Buildings (Remodelled)
// =====================================================
'use strict';

// ── Helpers ───────────────────────────────────────
const _matCache = {};
function _getMat(col, opt) {
  const key = col + '_' + (opt.sh||12) + '_' + (opt.em||0) + '_' + (opt.ei||0) + '_' + (opt.transparent||false) + '_' + (opt.opacity||1);
  if (!_matCache[key]) {
    _matCache[key] = new THREE.MeshPhongMaterial({
      color: col,
      flatShading: true,
      shininess: opt.sh||12,
      ...(opt.em?{emissive:opt.em,emissiveIntensity:opt.ei||0}:{}),
      ...(opt.transparent?{transparent:true, opacity:opt.opacity}:{})
    });
  }
  return _matCache[key];
}

// ── Optimizer ─────────────────────────────────────
function optimizeBuildingGroup(g) {
  if (!window.THREE.BufferGeometryUtils) return g;
  const matKeys = {};
  g.children.forEach(obj => {
    // If it's a group (like a lamp post), we should traverse it!
    obj.traverse(child => {
      if (child.isMesh) {
        const mat = child.material;
        const key = mat.uuid + '_' + child.castShadow + '_' + (child.userData.isWindow||false) + '_' + (child.userData.isLamp||false) + '_' + (child.userData.isLampLight||false);
        if (!matKeys[key]) matKeys[key] = { mat: mat, geoms: [], shadow: child.castShadow, win: child.userData.isWindow, lamp: child.userData.isLamp, lampLight: child.userData.isLampLight, winRnd: child.userData.winRnd };
        const geom = child.geometry.clone();
        child.updateMatrixWorld(true); // MUST use MatrixWorld because child might be inside a Group (like lampGroup)
        geom.applyMatrix4(child.matrixWorld);
        matKeys[key].geoms.push(geom);
      }
    });
  });
  const newG = new THREE.Group();
  for (let k in matKeys) {
    const data = matKeys[k];
    if (data.geoms.length > 0) {
      const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(data.geoms, false);
      const mesh = new THREE.Mesh(merged, data.mat);
      mesh.castShadow = data.shadow; mesh.receiveShadow = data.shadow;
      if (data.win) { mesh.userData.isWindow = true; mesh.userData.winRnd = data.winRnd; }
      if (data.lamp) { mesh.userData.isLamp = true; }
      if (data.lampLight) { mesh.userData.isLampLight = true; }
      newG.add(mesh);
    }
  }
  return newG;
}

function _box(w,h,d,col,opt={}){
  const m=_getMat(col, opt);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  if(opt.win){mesh.userData.isWindow=true;mesh.userData.winRnd=0.7+Math.random()*0.6;}
  if(opt.lamp){mesh.userData.isLamp=true;}
  if(opt.shadow!==false){mesh.castShadow=true;mesh.receiveShadow=true;}
  return mesh;
}
function _cyl(rt,rb,h,seg,col,opt={}){
  const m=_getMat(col, opt);
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

  // Curated colour palettes per variant — warm, inviting tones
  const wallPalettes=[
    [0xf5e6d0,0xecd5b0,0xfaedd8,0xe8d5b7], // warm cream/sand
    [0xdde8f0,0xccd9e8,0xe2ecf5,0xc8d8e8], // cool slate blue
    [0xe8d8d0,0xf0e0d8,0xddd0c8,0xf8e8e0], // dusty rose/mauve
  ];
  const roofPalettes=[
    [0x8b4513,0x6b3410,0xa0522d,0x7a3c1a], // warm terracotta/brown
    [0x374151,0x2d3748,0x4a5568,0x1a202c], // dark slate
    [0x5c4033,0x4a3028,0x6b4c3b,0x3d2b22], // deep mahogany
  ];
  const pi=Math.floor(rnd(0,wallPalettes[v].length,gx,gz,8));
  const wallC=wallPalettes[v][pi];
  const roofC=roofPalettes[v][Math.floor(rnd(0,roofPalettes[v].length,gx,gz,9))];
  const trimC=0x2d2d2d; // dark trim / window frames
  const winC=0xb8d4e8;  // window glass (light blue)
  const winOpt={win:true,em:0x88bbdd,ei:0,sh:120};
  const winOptW={win:true,em:0xffcc88,ei:0,sh:80}; // warm glass variant

  // Helper: add a framed window at position, on a given face (axis='z' or axis='x')
  function win(x,y,z,wr,wh,axis){
    const fThick=0.06; // frame thickness
    const gThick=0.04; // glass thickness (recessed to prevent z-fighting)
    const fw=axis==='z'?wr+0.06:fThick;
    const fd=axis==='z'?fThick:wr+0.06;
    // Frame (dark)
    _add(g,_box(fw,wh+0.06,fd,trimC,{shadow:false}),x,y,z);
    // Glass
    const gw=axis==='z'?wr:gThick;
    const gd=axis==='z'?gThick:wr;
    _add(g,_box(gw,wh,gd,winC,winOpt),x,y,z);
  }
  function winW(x,y,z,wr,wh,axis){ // warm glass
    const fThick=0.06;
    const gThick=0.04;
    const fw=axis==='z'?wr+0.06:fThick;
    const fd=axis==='z'?fThick:wr+0.06;
    _add(g,_box(fw,wh+0.06,fd,trimC,{shadow:false}),x,y,z);
    const gw=axis==='z'?wr:gThick;
    const gd=axis==='z'?gThick:wr;
    _add(g,_box(gw,wh,gd,winC,winOptW),x,y,z);
  }

  if(v===0){
    // ── Variant 0: Craftsman Cottage ──────────────────────────
    // Warm cream walls, terracotta roof, wide overhanging eaves, stone foundation
    const wH=rnd(.62,.78,gx,gz,2);
    const rH=rnd(.38,.52,gx,gz,5);

    // Stone foundation strip
    _add(g,_box(1.18,.1,1.12,0x8a8070),0,.06,0);
    // Main walls
    _add(g,_box(1.1,wH,1.05,wallC),0,wH/2+.12,0);

    // Wide hip roof with overhanging eaves (layered for depth)
    _add(g,_box(1.28,.08,1.22,roofC),0,wH+.12,0);           // eave slab
    const roof=_cyl(0,.75,rH,4,roofC); roof.rotation.y=Math.PI/4;
    _add(g,roof,0,wH+.16+rH/2,0);
    // Chimney (offset to side)
    _add(g,_box(.11,.42,.11,0x786050),-.28,wH+.12+rH*.35,.12);
    _add(g,_box(.14,.04,.14,0x5a4030),-.28,wH+.12+rH*.35+.21,.12); // cap

    // Front face (+Z)
    _add(g,_box(.18,.36,.05,trimC,{shadow:false}),0,.26+.12,.55);  // door frame
    _add(g,_box(.14,.3,.04,0x4a3520,{shadow:false}),0,.26+.12,.56); // door panel
    _add(g,_box(.03,.04,.04,0xd4a800,{shadow:false}),.05,.24+.12,.57); // door knob
    winW(.3,wH*.62,.55,.26,.2,'z');    // right window front
    winW(-.3,wH*.62,.55,.26,.2,'z');   // left window front
    // Flower box under front windows
    _add(g,_box(.62,.06,.1,0x8b5e3c,{shadow:false}),0,wH*.62-.14,.55);
    _add(g,_box(.58,.05,.09,0x6ab04c,{shadow:false}),0,wH*.62-.1,.55); // greenery

    // Side face (+X - always visible from camera)
    win(.55,wH*.6,.0,.28,.22,'x');
    win(.55,wH*.6,-.3,.2,.18,'x');

    // Back face (-Z - visible when facing north/camera)
    winW(-.25,wH*.62,-.55,.22,.18,'z');
    winW(.25,wH*.62,-.55,.22,.18,'z');

    // Front porch step
    _add(g,_box(.52,.05,.16,0xa09080,{shadow:false}),0,.05,.6);
    // Small garden path
    _add(g,_box(.14,.01,.38,0xb0a090,{shadow:false}),0,.13,.82);
    // Two bushes flanking door
    _add(g,_cyl(.1,.12,.18,5,0x3d8b2a),-.22,.21,.62);
    _add(g,_cyl(.1,.12,.18,5,0x3d8b2a),.22,.21,.62);

  } else if(v===1){
    // ── Variant 1: Modern Suburban ────────────────────────────
    // Clean lines, dark slate roof, big windows, attached garage, slight L-shape
    const h=rnd(.78,1.0,gx,gz,2);
    const gH=h*.68; // garage height

    // Main body
    _add(g,_box(1.1,h,1.0,wallC),-.08,h/2+.1,0);
    // Roof with slight overhang
    _add(g,_box(1.18,.07,1.08,roofC),-.08,h+.135,0);   // flat top
    const rSlope=_cyl(0,.82,rnd(.3,.44,gx,gz,5),4,roofC);
    rSlope.rotation.y=Math.PI/4;
    _add(g,rSlope,-.08,h+.17+rnd(.15,.22,gx,gz,5)/2,0);
    // Dark parapet accent
    _add(g,_box(1.2,.08,1.1,trimC),-.08,h+.1,0);

    // Attached garage (protruding slightly)
    _add(g,_box(.7,gH,.8,new THREE.Color(wallC).offsetHSL(0,0,-.06)),.48,gH/2+.1,-.04);
    _add(g,_box(.76,.05,.85,roofC),.48,gH+.12,-.04); // garage roof
    // Garage door (panelled)
    _add(g,_box(.54,gH*.76,.04,0xe0e0e0,{shadow:false}),.48,gH*.38+.1,.4);
    for(let i=0;i<3;i++) _add(g,_box(.52,.04,.04,0xcccccc,{shadow:false}),.48,gH*.2+i*gH*.22+.1,.41);

    // Front face (+Z): large picture window + door
    _add(g,_box(.32,.42,.05,trimC,{shadow:false}),-.28,.34+.1,.52);
    _add(g,_box(.28,.38,.04,0x3a2a1a,{shadow:false}),-.28,.34+.1,.53); // door
    _add(g,_box(.03,.06,.04,0xd4a800,{shadow:false}),-.14,.3+.1,.54); // knob
    win(.22,h*.56,.51,.44,.3,'z');   // picture window front
    // Side face (+X)
    win(.56,h*.55,.15,.3,.24,'x');
    win(.56,h*.55,-.25,.24,.2,'x');
    // Back face (-Z)
    win(-.08,h*.55,-.51,.46,.28,'z');
    win(-.08,h*.55,-.51,.46,.28,'z');

    // Small deck/patio front
    _add(g,_box(.8,.06,.3,0xb08040,{shadow:false}),-.18,.08,.64);
    // Deck railing posts
    for(let i=-1;i<=1;i++) _add(g,_box(.03,.12,.03,0x9a7030),i*.3,.14,.78);
    _add(g,_box(.68,.03,.03,0x9a7030),-.18,.2,.78); // top rail
    // Shrubs
    _add(g,_cyl(.08,.1,.16,6,0x2d7a22),.3,.16,.62);
    _add(g,_cyl(.1,.13,.2,6,0x2d7a22),-.42,.18,.62);

  } else {
    // ── Variant 2: Nordic Chalet ──────────────────────────────
    // Steep A-frame inspired, warm wood tones, prominent overhangs
    const h=rnd(.6,.75,gx,gz,2);
    const rH=rnd(.55,.72,gx,gz,5); // tall steep roof

    // Foundation
    _add(g,_box(1.24,.12,1.18,0x706050),0,.06,0);
    // Main walls (shorter — roof is dominant)
    _add(g,_box(1.1,h,.95,wallC),0,h/2+.12,0);

    // Steep 4-sided hip roof with wide eaves
    _add(g,_box(1.3,.1,1.16,roofC),0,h+.12,0);        // wide eave slab
    _add(g,_box(1.32,.06,1.18,new THREE.Color(roofC).offsetHSL(0,0,.04)),0,h+.14,0); // lighter trim
    const roof=_cyl(0,.78,rH,4,roofC); roof.rotation.y=Math.PI/4;
    _add(g,roof,0,h+.18+rH/2,0);

    // Chimney (stone look)
    _add(g,_box(.16,.5,.16,0x786050),.3,h+.18+rH*.28,-.12);
    _add(g,_box(.19,.05,.19,0x5a4030),.3,h+.18+rH*.28+.25,-.12);

    // Front (+Z): arched/gabled window + door
    _add(g,_box(.2,.38,.05,trimC,{shadow:false}),0,.26+.12,.49);   // door frame
    _add(g,_box(.16,.34,.04,0x5c3d2e,{shadow:false}),0,.26+.12,.5);// door
    _add(g,_box(.06,.06,.06,0xd4a800,{shadow:false}),.06,.28+.12,.51); // knob
    winW(-.3,h*.62,.49,.22,.2,'z');
    winW(.3,h*.62,.49,.22,.2,'z');
    // Gable window (triangular hint - small square at peak of front)
    _add(g,_box(.2,.14,.04,winC,winOpt),0,h+.12+rH*.48,.52);
    _add(g,_box(.22,.04,.05,trimC,{shadow:false}),0,h+.12+rH*.55,.52);

    // Side face (+X)
    win(.56,h*.58,.15,.28,.22,'x');
    win(.56,h*.58,-.22,.22,.18,'x');

    // Back face (-Z)
    winW(-.28,h*.62,-.49,.22,.2,'z');
    winW(.28,h*.62,-.49,.22,.2,'z');

    // Front step
    _add(g,_box(.42,.06,.2,0x908070,{shadow:false}),0,.1,.56);
    // Wood porch (front)
    _add(g,_box(.9,.05,.45,0x8b6914,{shadow:false}),0,.12,.66);
    // Porch posts (timber look)
    _add(g,_cyl(.04,.04,h*.7,4,0x6b4c1a),-.3,h*.35+.12,.66);
    _add(g,_cyl(.04,.04,h*.7,4,0x6b4c1a),.3,h*.35+.12,.66);
    _add(g,_box(.72,.06,.06,0x6b4c1a),0,h*.7+.12,.66); // beam
    // Firewood stack (side detail)
    _add(g,_box(.28,.14,.12,0x7a5c2e),-.42,.18,.0);
  }
  return optimizeBuildingGroup(g);
}


// ── Apartment ─────────────────────────────────────
function makeApartment(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));
  const floors=3+Math.floor(rnd(0,4,gx,gz,2));
  const trimC=0x222222; 
  
  // Helpers
  function win(x,y,z,wr,wh,axis,glassC,glassOpt){
    const fThick=0.06;
    const gThick=0.04;
    const fw=axis==='z'?wr+0.06:fThick;
    const fd=axis==='z'?fThick:wr+0.06;
    _add(g,_box(fw,wh+0.06,fd,trimC,{shadow:false}),x,y,z);
    const gw=axis==='z'?wr:gThick;
    const gd=axis==='z'?gThick:wr;
    // Disable shadow on glass to prevent aggressive z-fighting acne on the walls
    _add(g,_box(gw,wh,gd,glassC,{...glassOpt, shadow:false}),x,y,z);
  }

  if(v===0){
    // ── Variant 0: High-End Glass Skyscraper ──
    const h=floors*0.6;
    const baseC=0x1e293b;
    const glassC=0x38bdf8;
    const gOpt={win:true,em:0x0ea5e9,ei:0,sh:150}; // shadows handled by helper
    
    // Lobby
    _add(g,_box(1.3,0.4,1.3,baseC),0,0.2,0);
    // Lobby entrance
    _add(g,_box(0.5,0.3,0.05,0xd1d5db,{shadow:false}),0,0.15,0.66); // awning
    _add(g,_box(0.4,0.3,0.06,glassC,{...gOpt, shadow:false}),0,0.15,0.65); // doors
    
    // Tower core
    _add(g,_box(1.0,h,1.0,0x0f172a),0,0.4+h/2,0);
    
    // Floor plates and glass facades
    for(let f=0;f<floors;f++){
      const fy = 0.4 + f*0.6 + 0.3;
      // Metal floor band
      _add(g,_box(1.05,0.06,1.05,0x475569),0,fy+0.27,0);
      // Continuous glass on all 4 sides (shadow disabled to prevent acne)
      [-0.51, 0.51].forEach(pos => {
        _add(g,_box(0.9, 0.45, 0.05, glassC, {...gOpt, shadow:false}), 0, fy, pos); // Z faces
        _add(g,_box(0.05, 0.45, 0.9, glassC, {...gOpt, shadow:false}), pos, fy, 0); // X faces
      });
    }
    
    // Roof
    const roofY = 0.4 + h;
    _add(g,_box(1.05,0.1,1.05,baseC),0,roofY+0.05,0);
    // Helipad
    _add(g,_cyl(0.3,0.3,0.02,12,0x333333),0,roofY+0.12,0);
    _add(g,_box(0.2,0.01,0.04,0xeab308,{shadow:false}),0,roofY+0.13,0); // H
    _add(g,_box(0.04,0.01,0.2,0xeab308,{shadow:false}),-0.08,roofY+0.13,0);
    _add(g,_box(0.04,0.01,0.2,0xeab308,{shadow:false}),0.08,roofY+0.13,0);
    // Antenna
    _add(g,_cyl(0.02,0.04,0.6,4,0x94a3b8),0.3,roofY+0.4,-0.3);
    _add(g,_cyl(0.04,0.04,0.04,5,0xff0000,{lamp:true,em:0xff0000,ei:0.8}),0.3,roofY+0.7,-0.3); // warning light

  } else if(v===1){
    // ── Variant 1: Classic Brick Tenement ──
    const h=floors*0.55;
    const bCols=[0x8b3a3a,0x9c5a3c,0x733c3c];
    const wallC=bCols[Math.floor(rnd(0,bCols.length,gx,gz,5))];
    const glassC=0xbae6fd;
    const gOpt={win:true,em:0x38bdf8,ei:0,sh:80};
    
    // Stone foundation
    _add(g,_box(1.25,0.2,1.25,0x57534e),0,0.1,0);
    // Main brick body
    _add(g,_box(1.2,h,1.2,wallC),0,0.2+h/2,0);
    
    // Front door and stairs
    _add(g,_box(0.3,0.05,0.2,0x78716c,{shadow:false}),0,0.05,0.68);
    _add(g,_box(0.2,0.3,0.05,0x292524,{shadow:false}),0,0.25,0.6);
    // Awning
    const awn = _add(g,_box(0.4,0.05,0.3,0x15803d),0,0.45,0.7);
    awn.rotation.x = -0.15;
    
    // Punched windows on all 4 faces
    for(let f=0;f<floors;f++){
      const fy = 0.2 + f*0.55 + 0.3;
      // Front and back (+Z, -Z)
      [-0.35, 0, 0.35].forEach(wx => {
        win(wx,fy,0.6, 0.16, 0.22, 'z', glassC, gOpt);
        win(wx,fy,-0.6, 0.16, 0.22, 'z', glassC, gOpt);
      });
      // Sides (+X, -X)
      [-0.35, 0, 0.35].forEach(wz => {
        win(0.6,fy,wz, 0.16, 0.22, 'x', glassC, gOpt);
        win(-0.6,fy,wz, 0.16, 0.22, 'x', glassC, gOpt);
      });
    }
    
    // Roof details
    const roofY = 0.2 + h;
    _add(g,_box(1.25,0.1,1.25,trimC),0,roofY+0.05,0); // parapet
    _add(g,_box(1.15,0.02,1.15,0x444444),0,roofY+0.1,0); // flat roof
    // Water tower (wood on legs)
    _add(g,_box(0.4,0.3,0.4,0x444444),-0.3,roofY+0.25,0.3); // stairbox
    _add(g,_cyl(0.18,0.18,0.25,8,0x78350f),0.3,roofY+0.35,-0.3); // tank
    _add(g,_cyl(0.2,0.2,0.04,8,0x3f3f46),0.3,roofY+0.48,-0.3); // tank lid
    // Legs
    [-1,1].forEach(lx=>[-1,1].forEach(lz=>_add(g,_cyl(0.02,0.02,0.2,4,0x000000),0.3+lx*0.12,roofY+0.2,-0.3+lz*0.12)));

  } else {
    // ── Variant 2: Luxury Stepped Condo ──
    const wallC=0xf8fafc; // pure white / modern cream
    const glassC=0x7dd3fc;
    const gOpt={win:true,em:0x0ea5e9,ei:0,sh:120};
    
    // Base floor (widest)
    _add(g,_box(1.4,0.5,1.4,wallC),0,0.25,0);
    // Base windows
    win(0,0.25,0.7,0.8,0.3,'z',glassC,gOpt);
    win(0,0.25,-0.7,0.8,0.3,'z',glassC,gOpt);
    win(0.7,0.25,0,0.8,0.3,'x',glassC,gOpt);
    win(-0.7,0.25,0,0.8,0.3,'x',glassC,gOpt);
    
    let curW = 1.2;
    let curY = 0.5;
    
    // Stepped floors
    for(let f=0;f<floors;f++){
      const fh = 0.5;
      _add(g,_box(curW,fh,curW,wallC),0,curY+fh/2,0);
      
      // Balcony / Terrace floor outside the new block
      _add(g,_box(curW+0.2,0.05,curW+0.2,0xcbd5e1),0,curY+0.025,0);
      
      // Plants on terraces (fixed clipping: height 0.06, center y+0.08 -> bottom y+0.05 aligns with balcony)
      _add(g,_box(curW,0.06,0.1,0x22c55e,{shadow:false}),0,curY+0.08,curW/2+0.05); // front planter
      _add(g,_box(0.1,0.06,curW,0x22c55e,{shadow:false}),curW/2+0.05,curY+0.08,0); // right planter
      
      // Glass railings (opaque to fix transparency sorting glitch, lengths adjusted to prevent corner intersection)
      const rL = curW + 0.16;
      const sL = curW + 0.20;
      const rOpt = {sh: 150, shadow: false};
      _add(g,_box(rL, 0.15, 0.02, 0xbae6fd, rOpt),0,curY+0.1,curW/2+0.09);
      _add(g,_box(rL, 0.15, 0.02, 0xbae6fd, rOpt),0,curY+0.1,-curW/2-0.09);
      _add(g,_box(0.02, 0.15, sL, 0xbae6fd, rOpt),curW/2+0.09,curY+0.1,0);
      _add(g,_box(0.02, 0.15, sL, 0xbae6fd, rOpt),-curW/2-0.09,curY+0.1,0);

      // Huge floor-to-ceiling windows
      const wSize = curW*0.6;
      win(0,curY+fh/2,curW/2,wSize,0.35,'z',glassC,gOpt);
      win(0,curY+fh/2,-curW/2,wSize,0.35,'z',glassC,gOpt);
      win(curW/2,curY+fh/2,0,wSize,0.35,'x',glassC,gOpt);
      win(-curW/2,curY+fh/2,0,wSize,0.35,'x',glassC,gOpt);
      
      curY += fh;
      curW -= 0.15; // get narrower
    }
    
    // Roof pool
    _add(g,_box(curW+0.1,0.06,curW+0.1,0x94a3b8),0,curY+0.03,0);
    _add(g,_box(curW*0.6,0.02,curW*0.6,0x38bdf8,{em:0x0ea5e9,ei:0.2,shadow:false}),0,curY+0.07,0); // pool water
  }
  return optimizeBuildingGroup(g);
}

// ── Shop ──────────────────────────────────────────
function makeShop(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));

  function win(x,y,z,wr,wh,axis,glassC,glassOpt){
    const trimC = 0x222222;
    const fThick=0.06;
    const gThick=0.04;
    const fw=axis==='z'?wr+0.06:fThick;
    const fd=axis==='z'?fThick:wr+0.06;
    _add(g,_box(fw,wh+0.06,fd,trimC,{shadow:false}),x,y,z);
    const gw=axis==='z'?wr:gThick;
    const gd=axis==='z'?gThick:wr;
    _add(g,_box(gw,wh,gd,glassC,{...glassOpt, shadow:false}),x,y,z);
  }

  if(v===0){
    // ── Variant 0: Corner Bodega ──
    const wallC=0x8b3a3a; // red brick
    const glassC=0xbae6fd;
    const gOpt={win:true,em:0x0ea5e9,ei:0,sh:120};
    
    _add(g,_box(1.2,0.8,1.2,wallC),0,0.4,0);
    _add(g,_box(1.3,0.1,1.3,0x444444),0,0.85,0); // roof parapet
    
    // Roof AC unit
    _add(g,_box(0.4,0.3,0.4,0x737373),-0.3,0.95,0.2); 
    _add(g,_cyl(0.1,0.1,0.1,6,0x222222),-0.3,1.1,0.2); // fan
    
    // Front window and door
    win(0.25, 0.35, 0.6, 0.4, 0.4, 'z', glassC, gOpt);
    // Door
    _add(g,_box(0.3, 0.5, 0.05, 0xd4d4d8), -0.3, 0.25, 0.61);
    
    // Angled Awning over window
    const awn = _add(g,_box(1.2, 0.05, 0.4, 0xef4444), 0, 0.6, 0.7);
    awn.rotation.x = -0.2;
    
    // Neon sign above awning
    _add(g,_box(0.6, 0.2, 0.05, 0xfcd34d, {em:0xf59e0b, ei:0}), 0, 0.75, 0.65);
    
    // Side dumpster in the back
    _add(g,_box(0.3, 0.25, 0.4, 0x166534), 0.75, 0.125, -0.2);

  } else if(v===1){
    // ── Variant 1: Modern Supermarket / Retail ──
    const wallC=0xf8fafc;
    const glassC=0x38bdf8;
    const gOpt={win:true,em:0x0284c7,ei:0,sh:150};
    
    _add(g,_box(1.8, 0.6, 1.4, wallC), 0, 0.3, 0);
    _add(g,_box(1.9, 0.15, 1.5, 0x94a3b8), 0, 0.675, 0); // Flat overhanging roof
    
    // Front glass facade (3 large panels)
    for(let i=0; i<3; i++) {
      win(-0.5 + i*0.5, 0.3, 0.7, 0.3, 0.4, 'z', glassC, gOpt);
    }
    
    // Flat blue canopy over entrance
    _add(g,_box(1.6, 0.05, 0.5, 0x3b82f6), 0, 0.55, 0.85);
    // 2 support poles for canopy
    _add(g,_cyl(0.02, 0.02, 0.55, 4, 0x64748b), -0.7, 0.275, 1.05);
    _add(g,_cyl(0.02, 0.02, 0.55, 4, 0x64748b), 0.7, 0.275, 1.05);
    
    // Shopping cart return corral
    _add(g,_box(0.4, 0.2, 0.05, 0x64748b), -0.5, 0.1, 1.2);
    _add(g,_box(0.05, 0.2, 0.3, 0x64748b), -0.7, 0.1, 1.05);
    _add(g,_box(0.05, 0.2, 0.3, 0x64748b), -0.3, 0.1, 1.05);

  } else {
    // ── Variant 2: Artisan Cafe / Bakery ──
    const wallC=0xfae8ff; // pastel pinkish
    const woodC=0x78350f;
    const glassC=0xfde047;
    const gOpt={win:true,em:0xeab308,ei:0,sh:120}; // warm inviting glow
    
    // 2 story narrow building
    _add(g,_box(1.0, 0.5, 1.0, wallC), 0, 0.25, 0);
    _add(g,_box(1.0, 0.5, 1.0, wallC), 0, 0.75, 0);
    
    // Steep gable roof
    const roof = _add(g,_cyl(0, 0.75, 0.6, 4, 0x0f172a), 0, 1.3, 0);
    roof.rotation.y = Math.PI/4;
    
    // Lower front window
    win(-0.2, 0.25, 0.5, 0.4, 0.3, 'z', glassC, gOpt);
    // Door
    _add(g,_box(0.25, 0.4, 0.05, woodC), 0.25, 0.2, 0.51);
    
    // Round cafe awning over window
    const awn = _add(g,_cyl(0.25, 0.25, 0.5, 16, 0xf43f5e), -0.2, 0.45, 0.5);
    awn.rotation.z = Math.PI/2;
    
    // Outdoor table seating
    _add(g,_cyl(0.15, 0.15, 0.02, 12, 0xffffff), -0.3, 0.15, 0.8);
    _add(g,_cyl(0.02, 0.02, 0.15, 4, 0x111111), -0.3, 0.075, 0.8);
    // Chairs
    _add(g,_box(0.1, 0.1, 0.1, 0x3b82f6), -0.15, 0.05, 0.8);
    _add(g,_box(0.1, 0.1, 0.1, 0x3b82f6), -0.45, 0.05, 0.8);
    
    // Upstairs window
    win(0, 0.75, 0.5, 0.5, 0.3, 'z', glassC, gOpt);
    // Flower box on upstairs window
    _add(g,_box(0.6, 0.08, 0.1, 0x854d0e), 0, 0.55, 0.55);
    _add(g,_box(0.5, 0.08, 0.05, 0x22c55e), 0, 0.6, 0.55);
  }
  return optimizeBuildingGroup(g);
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
  return optimizeBuildingGroup(g);
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
  return optimizeBuildingGroup(g);
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
  return optimizeBuildingGroup(g);
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
  return optimizeBuildingGroup(g);
}

// ── Factory ───────────────────────────────────────
function makeFactory(gx,gz){
  const g=new THREE.Group();
  const v=Math.floor(rnd(0,3,gx,gz,1));

  function win(x,y,z,wr,wh,axis,glassC,glassOpt){
    const trimC = 0x333333;
    const fThick=0.08;
    const gThick=0.04;
    const fw=axis==='z'?wr+0.08:fThick;
    const fd=axis==='z'?fThick:wr+0.08;
    _add(g,_box(fw,wh+0.08,fd,trimC,{shadow:false}),x,y,z);
    const gw=axis==='z'?wr:gThick;
    const gd=axis==='z'?gThick:wr;
    _add(g,_box(gw,wh,gd,glassC,{...glassOpt, shadow:false}),x,y,z);
  }

  if(v===0){
    // ── Variant 0: Classic Red-Brick Foundry ──
    const brick=0x7f1d1d;
    const roofC=0x3f3f46;
    const glassC=0xfef08a; // warm yellow glow inside
    const gOpt={win:true,em:0xca8a04,ei:0,sh:80};
    
    _add(g,_box(1.8, 0.8, 1.2, brick), 0, 0.4, 0);
    
    // Sawtooth roof (3 teeth with skylights)
    for(let i=0; i<3; i++) {
      const tx = -0.55 + i*0.55;
      const t = _add(g,_cyl(0, 0.4, 0.4, 4, roofC), tx, 1.0, 0);
      t.rotation.y = Math.PI/4;
      t.scale.set(1, 1, 1.5);
    }
    
    // Tall classic smokestack
    _add(g,_box(0.4, 0.4, 0.4, brick), 1.1, 0.2, -0.6);
    _add(g,_cyl(0.1, 0.15, 1.8, 8, brick), 1.1, 1.3, -0.6);
    _add(g,_cyl(0.12, 0.12, 0.1, 8, 0x1c1917), 1.1, 2.2, -0.6); // top rim
    
    // Tall Arched windows on front
    for(let i=0; i<3; i++) {
      const wx = -0.55 + i*0.55;
      win(wx, 0.35, 0.6, 0.2, 0.5, 'z', glassC, gOpt);
      // Arch top above the window
      const arch = _add(g,_cyl(0.14, 0.14, 0.05, 8, glassC, gOpt), wx, 0.64, 0.6);
      arch.rotation.x = Math.PI/2;
    }

  } else if(v===1){
    // ── Variant 1: Modern Tech Manufacturing ──
    const wallC=0xe2e8f0;
    const trimC=0x2563eb;
    const glassC=0xbae6fd;
    const gOpt={win:true,em:0x38bdf8,ei:0,sh:150};
    
    _add(g,_box(1.6, 0.6, 1.6, wallC), 0, 0.3, 0);
    _add(g,_box(1.7, 0.05, 1.7, trimC), 0, 0.625, 0); // blue corporate trim ring
    _add(g,_box(1.2, 0.4, 1.2, wallC), -0.2, 0.8, -0.2); // second tier office
    
    // Glass corner office wrap
    win(0.5, 0.4, 0.8, 0.2, 0.4, 'z', glassC, gOpt);
    win(0.8, 0.4, 0.5, 0.2, 0.4, 'x', glassC, gOpt);
    
    // Large loading dock shutter (yellow)
    _add(g,_box(0.6, 0.4, 0.02, 0xfacc15, {shadow:false}), -0.4, 0.2, 0.81);
    for(let i=0; i<8; i++) {
      _add(g,_box(0.6, 0.01, 0.04, 0xca8a04, {shadow:false}), -0.4, 0.05 + i*0.05, 0.81);
    }
    
    // Modern smooth white silo attached
    _add(g,_cyl(0.3, 0.3, 1.2, 12, 0xf8fafc), 1.0, 0.6, -0.4);
    _add(g,_cyl(0.3, 0.3, 0.1, 12, trimC), 1.0, 1.25, -0.4); // trim on silo

  } else {
    // ── Variant 2: Heavy Industrial Plant ──
    const metalC=0x475569;
    const rustC=0x9a3412;
    
    _add(g,_box(1.6, 0.4, 1.4, 0x334155), 0, 0.2, 0); // dark base
    
    // Two massive spherical/cylindrical tanks
    _add(g,_cyl(0.4, 0.4, 1.0, 12, metalC), -0.4, 0.7, 0);
    _add(g,_cyl(0.4, 0.4, 1.0, 12, metalC), 0.4, 0.7, 0);
    // Tank domes (cones)
    _add(g,_cyl(0, 0.4, 0.2, 12, metalC), -0.4, 1.3, 0);
    _add(g,_cyl(0, 0.4, 0.2, 12, metalC), 0.4, 1.3, 0);
    
    // Catwalk bridge between them
    _add(g,_box(0.4, 0.02, 0.2, rustC), 0, 1.1, 0);
    // Simple railings
    _add(g,_box(0.4, 0.1, 0.02, rustC), 0, 1.15, 0.1);
    _add(g,_box(0.4, 0.1, 0.02, rustC), 0, 1.15, -0.1);
    
    // Pipes winding around
    _add(g,_cyl(0.05, 0.05, 1.4, 6, rustC), -0.85, 0.7, 0.2, Math.PI/2); // rx
    _add(g,_cyl(0.05, 0.05, 0.8, 6, rustC), -0.45, 1.45, 0.2, 0, 0, Math.PI/2); // rz
    _add(g,_cyl(0.05, 0.05, 0.8, 6, rustC), 0.45, 1.45, 0.2, 0, 0, Math.PI/2); // rz
    
    // Flare vent stack (tall skinny pipe)
    _add(g,_cyl(0.06, 0.06, 1.8, 6, 0x1e293b), 0, 0.9, -0.5);
    // Flare flame (glows bright orange)
    _add(g,_cyl(0.08, 0.02, 0.2, 4, 0xffedd5, {lamp:true, em:0xf97316, ei:1.5}), 0, 1.9, -0.5);
    
    // Some small glowing control panels
    _add(g,_box(0.1, 0.1, 0.02, 0x10b981, {em:0x059669, ei:1.0}), -0.4, 0.2, 0.71);
  }
  return optimizeBuildingGroup(g);
}

// ── Registry ──────────────────────────────────────
const FACTORIES={
  road:null,
  house:makeHouse,apartment:makeApartment,shop:makeShop,park:makePark,
  windturbine:makeWindTurbine,solar:makeSolar,nuclear:makeNuclear,factory:makeFactory
};

function getRoadFacingAngle(gx, gz) {
  const N = state.grid[key(gx,   gz-1)]?.type === 'road';
  const S = state.grid[key(gx,   gz+1)]?.type === 'road';
  const E = state.grid[key(gx+1, gz  )]?.type === 'road';
  const W = state.grid[key(gx-1, gz  )]?.type === 'road';

  // Priority: face the road that is on a unique side (not through-road)
  // Camera-visible angles first (0 = face +Z, -PI/2 = face +X) to prefer visible windows
  // Then hidden angles (PI = face -Z, PI/2 = face -X) for roads behind building

  // Single road neighbor
  if (S && !N && !E && !W) return 0;           // road south  → face south   (+Z visible)
  if (E && !N && !S && !W) return -Math.PI/2;  // road east   → face east    (+X visible)
  if (N && !S && !E && !W) return Math.PI;     // road north  → face north   (-Z, faces road)
  if (W && !N && !S && !E) return Math.PI/2;   // road west   → face west    (-X, faces road)

  // Multiple roads: prefer camera-visible sides (south/east) over hidden (north/west)
  if (S && !N) return 0;
  if (E && !W) return -Math.PI/2;
  if (N && !S) return Math.PI;
  if (W && !E) return Math.PI/2;

  // Straight through-road or 4-way: pick camera-facing direction
  if (S || N) return 0;
  if (E || W) return -Math.PI/2;

  // No adjacent road — look 2 tiles out
  if (state.grid[key(gx,   gz+2)]?.type === 'road') return 0;
  if (state.grid[key(gx+2, gz  )]?.type === 'road') return -Math.PI/2;
  if (state.grid[key(gx,   gz-2)]?.type === 'road') return Math.PI;
  if (state.grid[key(gx-2, gz  )]?.type === 'road') return Math.PI/2;

  // Seeded stable fallback
  return seededRandom(gx, gz, 99) > 0.5 ? 0 : -Math.PI/2;
}





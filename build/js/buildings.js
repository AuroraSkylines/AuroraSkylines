// =====================================================
//  Aurora Skylines — Buildings
// =====================================================
'use strict';

function makeHouse(gx, gz) {
  const g = new THREE.Group();
  const rnd = (a, b, salt) => a + seededRandom(gx, gz, salt) * (b - a);
  const variant = Math.floor(rnd(0, 3, 1));
  const wallCol = new THREE.Color().setHSL(rnd(.04,.14, 2), .5, .62);
  const roofCol = new THREE.Color().setHSL(rnd(0,.07, 3), .58, .36);
  
  if (variant === 0) {
    const h = rnd(.72, 1.08, 4);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), new THREE.MeshPhongMaterial({color:wallCol, flatShading:true, shininess:18}));
    body.position.y = h/2 + .11; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const rh = rnd(.45, .72, 5);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(.82, rh, 4), new THREE.MeshPhongMaterial({color:roofCol, flatShading:true, shininess:25}));
    roof.rotation.y = Math.PI/4; roof.position.y = body.position.y + h/2 + rh/2 - .04; roof.castShadow = true; g.add(roof);
    const chim = new THREE.Mesh(new THREE.BoxGeometry(.15, .4, .15), new THREE.MeshPhongMaterial({color:0x5c3d2e}));
    chim.position.set(.25, body.position.y + h/2 + rh/2, 0); g.add(chim);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.18, .28, .06), new THREE.MeshPhongMaterial({color:0x5c3d2e}));
    door.position.set(0, .25, .53); g.add(door);
    const path = new THREE.Mesh(new THREE.BoxGeometry(.2, .02, .4), new THREE.MeshPhongMaterial({color:0x94a3b8}));
    path.position.set(0, .12, .75); g.add(path);
  } else if (variant === 1) {
    const h = rnd(.8, 1.2, 4);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, h, 1), new THREE.MeshPhongMaterial({color:wallCol, flatShading:true, shininess:18}));
    body.position.y = h/2 + .11; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(1.24, .15, 1.04), new THREE.MeshPhongMaterial({color:0x1e293b}));
    parapet.position.y = h + .11 + .075; g.add(parapet);
    const win = new THREE.Mesh(new THREE.BoxGeometry(.8, .3, .06), new THREE.MeshPhongMaterial({color:0xfff5cc, emissive:0xffaa44, emissiveIntensity:.2}));
    win.position.set(0, h/2 + .2, .53); g.add(win);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.2, .3, .06), new THREE.MeshPhongMaterial({color:0x111111}));
    door.position.set(-.3, .26, .53); g.add(door);
  } else {
    const h = rnd(1.0, 1.3, 4);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.9), new THREE.MeshPhongMaterial({color:wallCol, flatShading:true, shininess:18}));
    body.position.set(-0.2, h/2 + .11, 0); body.castShadow = true; body.receiveShadow = true; g.add(body);
    const gh = rnd(0.5, 0.6, 5);
    const garage = new THREE.Mesh(new THREE.BoxGeometry(0.6, gh, 0.8), new THREE.MeshPhongMaterial({color:wallCol, flatShading:true}));
    garage.position.set(0.5, gh/2 + .11, 0.05); garage.castShadow = true; garage.receiveShadow = true; g.add(garage);
    const gDoor = new THREE.Mesh(new THREE.BoxGeometry(0.4, gh - 0.1, 0.06), new THREE.MeshPhongMaterial({color:0xe2e8f0}));
    gDoor.position.set(0.5, (gh-0.1)/2 + .11, 0.46); g.add(gDoor);
    const rh = rnd(.3, .5, 6);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(.75, rh, 4), new THREE.MeshPhongMaterial({color:roofCol, flatShading:true, shininess:25}));
    roof.rotation.y = Math.PI/4; roof.position.set(-0.2, body.position.y + h/2 + rh/2 - .04, 0); roof.castShadow = true; g.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.18, .28, .06), new THREE.MeshPhongMaterial({color:0x5c3d2e}));
    door.position.set(-0.2, .25, .48); g.add(door);
    const win = new THREE.Mesh(new THREE.BoxGeometry(.3, .25, .06), new THREE.MeshPhongMaterial({color:0xfff5cc, emissive:0xffaa44, emissiveIntensity:.2}));
    win.position.set(-0.2, h - 0.2, .48); g.add(win);
  }
  return g;
}

function makeApartment(gx, gz) {
  const g = new THREE.Group();
  const rnd = (a, b, salt) => a + seededRandom(gx, gz, salt) * (b - a);
  const variant = Math.floor(rnd(0, 3, 1));
  const floors = 2 + Math.floor(rnd(0, 5, 2));
  const fh = .5;
  const cols = [0x3b82f6, 0x22c55e, 0xf97316, 0x8b5cf6, 0xec4899, 0x0ea5e9];
  const col = cols[Math.floor(rnd(0, cols.length, 3))];
  const mat = new THREE.MeshPhongMaterial({color:col, flatShading:true, shininess:40});
  const winMat = new THREE.MeshPhongMaterial({color:0xfff5cc, emissive:0xffaa44, emissiveIntensity:.35, shininess:90});

  if (variant === 0) {
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.2, floors*fh, 1.2), mat);
    body.position.y=(floors*fh)/2+.11; body.castShadow=true; body.receiveShadow=true; g.add(body);
    for(let f=0;f<floors;f++) for(let w=-1;w<=1;w+=2){
      const win=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,.06), winMat);
      win.position.set(w*.36, .11+f*fh+.25, .63); g.add(win);
    }
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.3, .1, 1.3), new THREE.MeshPhongMaterial({color:0x1e293b, flatShading:true}));
    cap.position.y=floors*fh+.16; cap.castShadow=true; g.add(cap);
    const ac=new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.3), new THREE.MeshPhongMaterial({color:0x94a3b8}));
    ac.position.set(.2, floors*fh+.3, -.2); g.add(ac);
  } else if (variant === 1) {
    const body1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, floors*fh, .8), mat);
    body1.position.set(0, (floors*fh)/2+.11, -.2); body1.castShadow=true; body1.receiveShadow=true; g.add(body1);
    const body2 = new THREE.Mesh(new THREE.BoxGeometry(.8, floors*fh, 1.6), mat);
    body2.position.set(.4, (floors*fh)/2+.11, 0); body2.castShadow=true; body2.receiveShadow=true; g.add(body2);
    for(let f=0;f<floors;f++) {
      const win1=new THREE.Mesh(new THREE.BoxGeometry(.8, .2, .06), winMat);
      win1.position.set(-.2, .11+f*fh+.25, .23); g.add(win1);
      const win2=new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .8), winMat);
      win2.position.set(-.03, .11+f*fh+.25, .4); g.add(win2);
    }
  } else {
    const bMat = new THREE.MeshPhongMaterial({color:0x1e293b});
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, .6, 1.2), bMat);
    base.position.y = .41; base.castShadow=true; g.add(base);
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(.6, floors*fh, .6), mat);
    t1.position.set(-.5, (floors*fh)/2+.71, 0); t1.castShadow=true; g.add(t1);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(.6, floors*fh, .6), mat);
    t2.position.set(.5, (floors*fh)/2+.71, 0); t2.castShadow=true; g.add(t2);
    for(let f=0;f<floors;f++) {
      const w1=new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .06), winMat);
      w1.position.set(-.5, .71+f*fh+.25, .33); g.add(w1);
      const w2=new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .06), winMat);
      w2.position.set(.5, .71+f*fh+.25, .33); g.add(w2);
    }
  }
  return g;
}

function makeShop(gx, gz) {
  const g = new THREE.Group();
  const rnd = (a, b, salt) => a + seededRandom(gx, gz, salt) * (b - a);
  const variant = Math.floor(rnd(0, 3, 1));
  const mat = new THREE.MeshPhongMaterial({color:0xfbcfe8, flatShading:true, shininess:28});
  const glass = new THREE.MeshPhongMaterial({color:0xbae6fd, emissive:0x0284c7, emissiveIntensity:.2, shininess:90});

  if (variant === 0) {
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.4,.7,1), mat);
    body.position.y=.46; body.castShadow=true; body.receiveShadow=true; g.add(body);
    const awn=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,.45),new THREE.MeshPhongMaterial({color:0xe11d48,flatShading:true,shininess:50}));
    awn.position.set(0,.76,.55); awn.rotation.x=-.2; awn.castShadow=true; g.add(awn);
    const sign=new THREE.Mesh(new THREE.BoxGeometry(.68,.22,.06),new THREE.MeshPhongMaterial({color:0xfbbf24,emissive:0xf59e0b,emissiveIntensity:.45,shininess:60}));
    sign.position.set(0,.6,.53); g.add(sign);
    const trash = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .25, 6), new THREE.MeshPhongMaterial({color:0x333333}));
    trash.position.set(-.5, .235, .6); g.add(trash);
  } else if (variant === 1) {
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,.6,.8), mat);
    body.position.y=.41; body.castShadow=true; body.receiveShadow=true; g.add(body);
    [-.5, 0, .5].forEach(dx => {
      const awn=new THREE.Mesh(new THREE.BoxGeometry(.4,.06,.3),new THREE.MeshPhongMaterial({color:0x3b82f6,flatShading:true}));
      awn.position.set(dx,.6,.45); awn.rotation.x=-.2; awn.castShadow=true; g.add(awn);
      const win = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .06), glass);
      win.position.set(dx, .35, .43); g.add(win);
    });
  } else {
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.2,.8,1.2), new THREE.MeshPhongMaterial({color:0x1e293b}));
    body.position.y=.51; body.castShadow=true; body.receiveShadow=true; g.add(body);
    const front = new THREE.Mesh(new THREE.BoxGeometry(1.1,.7,.06), glass);
    front.position.set(0, .46, .62); g.add(front);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.4,.1,1.4), new THREE.MeshPhongMaterial({color:0xf8fafc}));
    roof.position.set(0, .96, .1); roof.castShadow=true; g.add(roof);
  }
  return g;
}

function makePark(gx, gz) {
  const g = new THREE.Group();
  const rnd = (a, b, salt) => a + seededRandom(gx, gz, salt) * (b - a);
  const variant = Math.floor(rnd(0, 3, 1));
  const padMat = new THREE.MeshPhongMaterial({color:0x16a34a, flatShading:true, shininess:15});
  const pad = new THREE.Mesh(new THREE.BoxGeometry(CELL-.2, .12, CELL-.2), padMat);
  pad.position.y = .17; pad.receiveShadow = true; g.add(pad);
  
  const addTree = (tx, tz, h) => {
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.38,5),new THREE.MeshPhongMaterial({color:0x78350f,flatShading:true}));
    trunk.position.set(tx,.42,tz); g.add(trunk);
    const crown=new THREE.Mesh(new THREE.ConeGeometry(.34,h,6),new THREE.MeshPhongMaterial({color:new THREE.Color().setHSL(.32+rnd(0,.06,tx*10),.65,.34),flatShading:true}));
    crown.position.set(tx,.42+.19+h/2,tz); crown.castShadow=true; g.add(crown);
  };

  if (variant === 0) {
    for(let i=0; i<8; i++) {
      addTree(rnd(-.8, .8, 2+i), rnd(-.8, .8, 3+i), rnd(.5, .9, 4+i));
    }
  } else if (variant === 1) {
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .14, 8), new THREE.MeshPhongMaterial({color:0x0ea5e9}));
    pond.position.y = .18; g.add(pond);
    addTree(-.7, -.7, .8); addTree(.7, .7, .7); addTree(-.7, .7, .9);
  } else {
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(1.2, .14, 1.2), new THREE.MeshPhongMaterial({color:0x94a3b8}));
    plaza.position.y = .18; plaza.receiveShadow=true; g.add(plaza);
    const mon = new THREE.Mesh(new THREE.BoxGeometry(.2, .6, .2), new THREE.MeshPhongMaterial({color:0xfde047}));
    mon.position.y = .5; mon.castShadow=true; g.add(mon);
    addTree(-.8, -.8, .6); addTree(.8, -.8, .6); addTree(-.8, .8, .6); addTree(.8, .8, .6);
  }
  return g;
}

function makeWindTurbine(gx, gz) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhongMaterial({color:0x94a3b8, flatShading:true, shininess:35});
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .22, 8), new THREE.MeshPhongMaterial({color:0x64748b, flatShading:true}));
  base.position.y = .11; base.receiveShadow=true; g.add(base);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.06, .14, 2.2, 8), mat);
  pillar.position.y = 1.32; pillar.castShadow=true; g.add(pillar);
  const nacelle = new THREE.Mesh(new THREE.BoxGeometry(.22, .16, .36), new THREE.MeshPhongMaterial({color:0xf1f5f9, flatShading:true}));
  nacelle.position.set(0, 2.45, .1); g.add(nacelle);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 6), new THREE.MeshPhongMaterial({color:0xe2e8f0}));
  hub.position.set(0, 2.45, .3); g.add(hub);
  const rotor = new THREE.Group();
  rotor.position.set(0, 2.45, .32);
  for(let i=0; i<3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(.05, 1.0, .08),
      new THREE.MeshPhongMaterial({color:0xfafafa, flatShading:true})
    );
    blade.position.y = .5;
    const pivot = new THREE.Group();
    pivot.add(blade);
    pivot.rotation.z = (i * Math.PI * 2) / 3;
    rotor.add(pivot);
  }
  g.add(rotor);
  g.userData.rotor = rotor; 
  return g;
}

function makeSolar(gx, gz) {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(2.0, .08, 2.0), new THREE.MeshPhongMaterial({color:0x78716c, flatShading:true}));
  pad.position.y = .04; pad.receiveShadow=true; g.add(pad);
  const box = new THREE.Mesh(new THREE.BoxGeometry(.3, .4, .3), new THREE.MeshPhongMaterial({color:0x374151, flatShading:true}));
  box.position.set(.8, .3, .8); box.castShadow=true; g.add(box);
  const pMat = new THREE.MeshPhongMaterial({color:0x1e3a8a, flatShading:true, shininess:120});
  const frameMat = new THREE.MeshPhongMaterial({color:0x9ca3af, flatShading:true});
  const positions = [[-0.55,-0.55],[0,-.55],[0.55,-.55],[-0.55,0],[0,0],[0.55,0],[-0.55,.55],[0,.55],[0.55,.55]];
  positions.forEach(([px, pz]) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.28,4), frameMat);
    stand.position.set(px, .18, pz); g.add(stand);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(.44, .04, .36), pMat);
    panel.position.set(px, .34, pz);
    panel.rotation.x = -.45;
    g.add(panel);
  });
  return g;
}

function makeNuclear(gx, gz) {
  const g = new THREE.Group();
  const concMat = new THREE.MeshPhongMaterial({color:0x9ca3af, flatShading:true});
  const darkMat = new THREE.MeshPhongMaterial({color:0x374151, flatShading:true});
  const reactor = new THREE.Mesh(new THREE.BoxGeometry(1.4, .8, 1.2), new THREE.MeshPhongMaterial({color:0xd1d5db, flatShading:true}));
  reactor.position.set(-.1, .5, 0); reactor.castShadow=true; reactor.receiveShadow=true; g.add(reactor);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshPhongMaterial({color:0xe5e7eb, flatShading:true}));
  dome.position.set(-.1, .9, 0); dome.castShadow=true; g.add(dome);
  const towerBot = new THREE.Mesh(new THREE.CylinderGeometry(.3, .42, .9, 10), concMat);
  towerBot.position.set(.7, .55, 0); towerBot.castShadow=true; g.add(towerBot);
  const towerTop = new THREE.Mesh(new THREE.CylinderGeometry(.38, .3, .8, 10), concMat);
  towerTop.position.set(.7, 1.35, 0); towerTop.castShadow=true; g.add(towerTop);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.38, .04, 4, 12), darkMat);
  rim.rotation.x = Math.PI/2; rim.position.set(.7, 1.76, 0); g.add(rim);
  const steam = new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 6), new THREE.MeshPhongMaterial({color:0xffffff, transparent:true, opacity:.55}));
  steam.position.set(.7, 2.0, 0); g.add(steam);
  const light = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 6), new THREE.MeshPhongMaterial({color:0xff4444, emissive:0xff0000, emissiveIntensity:.8}));
  light.position.set(-.1, 1.42, 0); g.add(light);
  return g;
}

function makeFactory(gx, gz) {
  const g = new THREE.Group();
  const rnd = (a, b, salt) => a + seededRandom(gx, gz, salt) * (b - a);
  const variant = Math.floor(rnd(0, 3, 1));
  const bodyMat = new THREE.MeshPhongMaterial({color:0x94a3b8, flatShading:true, shininess:25});

  if (variant === 0) {
    const body=new THREE.Mesh(new THREE.BoxGeometry(1.6,.9,1.3), bodyMat);
    body.position.y=.56; body.castShadow=true; body.receiveShadow=true; g.add(body);
    [-.4, .4].forEach(cx => {
      const ch=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.8,6),new THREE.MeshPhongMaterial({color:0x475569,flatShading:true}));
      ch.position.set(cx, 1.4, 0); ch.castShadow=true; g.add(ch);
    });
  } else if (variant === 1) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, .6, 1.6), bodyMat);
    body.position.y = .41; body.castShadow=true; body.receiveShadow=true; g.add(body);
    for(let z=-.5; z<=.5; z+=.5) {
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 1.6, 3), new THREE.MeshPhongMaterial({color:0x64748b, flatShading:true}));
      roof.rotation.z = Math.PI/2;
      roof.rotation.x = Math.PI/6;
      roof.position.set(0, .81, z);
      roof.castShadow=true;
      g.add(roof);
    }
  } else {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, .2, 1.4), bodyMat);
    base.position.y = .21; base.receiveShadow=true; g.add(base);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.2, 6), new THREE.MeshPhongMaterial({color:0xf59e0b}));
    pipe.rotation.z = Math.PI/2; pipe.position.set(0, .4, 0); g.add(pipe);
    [-.5, .5].forEach(cx => {
      const tank = new THREE.Mesh(new THREE.SphereGeometry(.4, 8, 8), new THREE.MeshPhongMaterial({color:0xe2e8f0, flatShading:true, shininess:50}));
      tank.position.set(cx, .6, 0); tank.castShadow=true; g.add(tank);
    });
  }
  return g;
}

const FACTORIES={road:null,house:makeHouse,apartment:makeApartment,shop:makeShop,park:makePark,windturbine:makeWindTurbine,solar:makeSolar,nuclear:makeNuclear,factory:makeFactory};

function getRoadFacingAngle(gx, gz) {
  const checks = [
    [gx, gz + 1, Math.PI],
    [gx, gz - 1, 0],
    [gx + 1, gz,  Math.PI/2],
    [gx - 1, gz, -Math.PI/2],
  ];
  for (const [nx, nz, angle] of checks) {
    if (state.grid[key(nx, nz)]?.type === 'road') return angle;
  }
  return seededRandom(gx, gz, 99) * Math.PI * 2;
}

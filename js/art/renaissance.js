/* =========================================================================
   NOUVEAUX GRAPHISMES — RENAISSANCE
   Collines toscanes au couchant, ville à coupole, fort bastionné.
   Fournit les projectiles communs « bullet » et « cannonball ».
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, SKIN, IVORY, WOOD, WOOD_D, WOOD_L, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, helm, hairShort, arm, fist, swing, thrust, aim, muzzle, wheel, puffs, flame, halo, backdrop, sky, hills, clouds, flock, soil, ridge, range, mounted, cypress, olive } = K;
  const STEEL = '#b4bac2', STEEL_D = '#7d838b', GOLD = '#d9a93a', BRONZE = '#b8893a', WALL = '#cdb88c', WALL_D = '#a8926a', WALL_L = '#e3d2a8', TILE = '#b8583a';

  /* ------------------------------------------------------------------ unités */
  function plumeHat(c, a, color, plume) {
    const { hx, hy } = a;
    blob(c, plume, () => { c.moveTo(hx - 2, hy - 7); c.quadraticCurveTo(hx - 12, hy - 17, hx - 16, hy - 5); c.quadraticCurveTo(hx - 9, hy - 9, hx - 3, hy - 5); }, 1);
    blob(c, color, () => { c.moveTo(hx - 5, hy - 3.4); c.quadraticCurveTo(hx - 4.4, hy - 11, hx + 1, hy - 10.6); c.quadraticCurveTo(hx + 5.8, hy - 10, hx + 5, hy - 3.6); }, 1.1);
    limb(c, [hx - 10, hy - 2.6, hx + 9.5, hy - 4.2], 1.7, color);
  }
  function goatee(c, a, color) { blob(c, color, () => { c.moveTo(a.hx + 1.6, a.hy + 4.2); c.lineTo(a.hx + 5, a.hy + 4.4); c.lineTo(a.hx + 3.6, a.hy + 8.2); }, 0.9); line(c, [a.hx + 2.4, a.hy + 2.4, a.hx + 6.4, a.hy + 1.6], color, 1.3); }
  function ruff(c, a) { c.fillStyle = '#f6f2e6'; c.strokeStyle = INK; c.lineWidth = 0.8; for (const dx of [-3.4, -0.4, 2.6, 5.4]) { c.beginPath(); c.arc(dx * a.k, -33 + a.ty, 2, 0, TAU); c.fill(); c.stroke(); } }
  function saber(ctx, len, gold) {
    blob(ctx, '#e3e7ee', () => { ctx.moveTo(-1.4, -3); ctx.quadraticCurveTo(-0.5, -len * 0.6, 3.4, -len); ctx.quadraticCurveTo(3.2, -len * 0.5, 1.4, -3); }, 0.9);
    ctx.strokeStyle = gold || GOLD; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(1.2, -1.4, 3.6, -1.7, 1.5); ctx.stroke(); disc(ctx, 0, 2.2, 1.3, gold || GOLD, 0.8);
  }
  // Bretteur : pourpoint d'équipe à crevés, fraise, chapeau à plume, rapière.
  A.units.bretteur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, skirt: team, skirtLen: 4.5, belt: '#3a2a22', legs: '#3f3a44', boots: '#6a4426', sleeve: team,
      over(c, a) { c.strokeStyle = IVORY; c.lineWidth = 1.3; c.beginPath(); for (const x of [-2.6, 0.6, 3.8]) { c.moveTo(x * a.k, -29.6 + a.ty); c.lineTo((x - 0.8) * a.k, -22.4 + a.ty); } c.stroke(); disc(c, 5 * a.k, -19.4 + a.ty, 1.4, GOLD, 0.7); ruff(c, a); },
      head(c, a) { goatee(c, a, '#3a2618'); plumeHat(c, a, '#3a2a22', IVORY); },
      arm(c, a) { thrust(c, a, cc => {
        line(cc, [1, 0, 27, -0.6], INK, 2.6); line(cc, [1, 0, 27, -0.6], '#e3e7ee', 1.2);
        cc.strokeStyle = GOLD; cc.lineWidth = 1.5; cc.beginPath(); cc.arc(1.5, 0, 3.6, -1.8, 1.8); cc.stroke();
      }, { sleeve: team, x: 4, y: 3, reach: 8, rot: -0.12, glove: '#6a4426' }); },
    }, R);
  } };
  // Arquebusier : morion, plastron d'acier, écharpe d'équipe, arquebuse.
  function longGun(cc, k, len, stock, metal) {
    blob(cc, stock, () => { cc.moveTo(-10, -1.4); cc.lineTo(5, -1.8); cc.lineTo(5, 1.7); cc.lineTo(-6, 3.4); cc.lineTo(-10.5, 4.6); }, 1);
    rect(cc, 4, -2.1, len, 2.5, metal, 0.9); rect(cc, 4 + len * 0.5, 0.4, len * 0.46, 1.3, stock);
    disc(cc, 2, -2, 1.3, metal, 0.7);
    muzzle(cc, len + 6.5, -0.9, k);
    if (k > 0.25) { cc.fillStyle = `rgba(235,235,235,${k * 0.6})`; cc.beginPath(); cc.arc(len + 9 + (1 - k) * 6, -4 - (1 - k) * 5, 3 + (1 - k) * 4, 0, TAU); cc.fill(); }
  }
  K.longGun = longGun; K.plumeHat = plumeHat; K.goatee = goatee; K.ruff = ruff; K.saber = saber;
  function morion(c, a, plume) {
    const { hx, hy } = a;
    if (plume) blob(c, plume, () => { c.moveTo(hx - 3, hy - 7); c.quadraticCurveTo(hx - 12, hy - 15, hx - 13, hy - 4); c.quadraticCurveTo(hx - 8, hy - 8, hx - 2, hy - 5.6); }, 1);
    blob(c, STEEL_D, () => { c.moveTo(hx - 5.4, hy - 6); c.quadraticCurveTo(hx, hy - 13.4, hx + 5.6, hy - 6); c.lineTo(hx + 4.4, hy - 5.4); c.quadraticCurveTo(hx, hy - 10.4, hx - 4.4, hy - 5.2); }, 1);
    helm(c, a, STEEL, { neck: 0 });
    c.beginPath(); c.moveTo(hx - 9, hy - 4.6); c.quadraticCurveTo(hx, hy - 0.4, hx + 9.4, hy - 5.4);
    c.strokeStyle = INK; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = STEEL; c.lineWidth = 1.6; c.stroke();
  }
  A.units.arquebusier = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: STEEL, skirt: team, skirtLen: 5, belt: '#3a2a22', legs: team, boots: '#4a3626', sleeve: team,
      over(c, a) { line(c, [-5.2 * a.k, -30.6 + a.ty, 6 * a.k, -21 + a.ty], team, 2.6); line(c, [-4.4, -27 + a.ty, -1.6, -31.6 + a.ty], 'rgba(255,255,255,0.55)', 1.1); },
      head(c, a) { morion(c, a); },
      arm(c, a) { aim(c, a, (cc, k) => longGun(cc, k, 22, '#7a5230', '#55524c'), { sleeve: team, y: 3.5 }); },
    }, R);
  } };
  // Grenadier (élite) : haut bonnet, habit d'équipe à baudriers blancs, grenade allumée.
  A.units.grenadier = { h: 46, top: 66, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, skirt: team, skirtLen: 8, belt: IVORY, legs: '#e6dfd0', boots: '#2a2420', sleeve: team,
      over(c, a) { line(c, [-5.2 * a.k, -31 + a.ty, 6 * a.k, -20.6 + a.ty], IVORY, 1.8); line(c, [5.4 * a.k, -31 + a.ty, -5.4 * a.k, -20.4 + a.ty], IVORY, 1.8); disc(c, 0.2, -25.6 + a.ty, 1.5, GOLD, 0.7); },
      head(c, a) {
        blob(c, '#1e1a18', () => { c.moveTo(a.hx - 6.2, a.hy - 2.6); c.quadraticCurveTo(a.hx - 7.6, a.hy - 20, a.hx, a.hy - 21.5); c.quadraticCurveTo(a.hx + 7.4, a.hy - 20, a.hx + 6, a.hy - 3.4); }, 1.3);
        blob(c, GOLD, () => { c.moveTo(a.hx + 0.4, a.hy - 4.2); c.lineTo(a.hx + 5.9, a.hy - 4.4); c.lineTo(a.hx + 5.4, a.hy - 10.4); c.lineTo(a.hx + 2.6, a.hy - 13); }, 0.9);
        blob(c, team, () => { c.moveTo(a.hx - 5, a.hy - 17.5); c.quadraticCurveTo(a.hx - 9.5, a.hy - 23, a.hx - 4.6, a.hy - 25.5); c.quadraticCurveTo(a.hx - 3, a.hy - 21, a.hx - 2.4, a.hy - 19.6); }, 0.9);
        line(c, [a.hx + 2.2, a.hy + 2.2, a.hx + 6.2, a.hy + 1.4], '#3a2618', 1.4);
      },
      arm(c, a) { swing(c, a, (cc, pr) => {
        if (pr > 0.5) return;
        disc(cc, 0, -4, 3.5, '#2f2e2c', 1); rect(cc, -0.9, -9.4, 1.8, 2.4, '#8a7a5a');
        halo(cc, 0, -11, 4.5, '255,190,80', 0.8); disc(cc, 0, -11, 1.3, '#ffe9a8');
      }, { sleeve: team, rest: [0.3, 5.5, 6.5], back: [-1.5, -1, -7], hit: [1.6, 9.5, -1] }); },
    }, R);
  } };
  function burgonet(c, a, team) {
    blob(c, team, () => { c.moveTo(a.hx - 3, a.hy - 7); c.quadraticCurveTo(a.hx - 13, a.hy - 16, a.hx - 14, a.hy - 3); c.quadraticCurveTo(a.hx - 8, a.hy - 8, a.hx - 2, a.hy - 5.6); }, 1);
    helm(c, a, STEEL, { neck: 3.2, brim: 9 });
    blob(c, STEEL, () => { c.moveTo(a.hx - 0.6, a.hy + 0.6); c.lineTo(a.hx + 2.6, a.hy + 1.2); c.lineTo(a.hx + 1.6, a.hy + 5.6); c.lineTo(a.hx - 2.4, a.hy + 4.4); }, 0.9);
  }
  // Cuirassier : cuirasse d'acier, bourguignotte à panache, sabre.
  A.units.cuirassier = { h: 66, draw(ctx, u, team, dark, atk, R) {
    mounted(ctx, u, team, dark, atk, {
      coat: '#6a4630', body: STEEL, leg: '#3f3a44',
      over(c, b) { line(c, [-6.2, -53.6 + b, 6, -44 + b], team, 2.8); line(c, [-4.6, -50 + b, -2, -55.6 + b], 'rgba(255,255,255,0.6)', 1.2); },
      head(c, a) { burgonet(c, a, team); },
      arm(c, a) { swing(c, a, cc => saber(cc, 22), { sleeve: team, glove: '#6a4426', rest: [0.5, 6, 5], hit: [1.9, 10.5, 4] }); },
    }, R);
  } };
  // Condottiere (champion) : destrier noir bardé d'or, armure dorée, cape, couronne.
  A.units.condottiere = { h: 66, draw(ctx, u, team, dark, atk, R) {
    mounted(ctx, u, team, dark, atk, {
      coat: '#3a342e', mane: '#1e1a18', armor: GOLD, body: GOLD, leg: '#3f3a44', cape: team, crown: true,
      over(c, b) { line(c, [-6.2, -53.6 + b, 6, -44 + b], team, 2.6); line(c, [-0.2, -57 + b, 0.2, -41.4 + b], dk(GOLD, 0.75), 1.1); },
      head(c, a) { hairShort(c, a, '#2a1e16'); goatee(c, a, '#2a1e16'); },
      arm(c, a) { swing(c, a, cc => saber(cc, 26), { sleeve: GOLD, glove: dk(GOLD, 0.8), rest: [0.5, 6, 5], hit: [1.9, 10.5, 4] }); },
    }, R);
  } };

  /* ------------------------------------------------------ base : fort bastionné */
  A.bases.fort = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // tour de guet à toit de tuiles
    rect(ctx, 2, G - 150, 36, 60, WALL, 1.5); rect(ctx, 30, G - 150, 8, 60, 'rgba(90,60,20,0.2)');
    for (const x of [9, 24]) blob(ctx, '#3a2a1e', () => { ctx.moveTo(x - 3.4, G - 116); ctx.lineTo(x - 3.4, G - 128); ctx.quadraticCurveTo(x, G - 134, x + 3.4, G - 128); ctx.lineTo(x + 3.4, G - 116); }, 1.1);
    rect(ctx, -1, G - 110, 42, 4, WALL_L, 1.1);
    poly(ctx, [-4, G - 150, 20, G - 172, 44, G - 150], TILE, 1.5); poly(ctx, [20, G - 172, 44, G - 150, 28, G - 150], 'rgba(60,20,10,0.25)');
    ctx.strokeStyle = dk(TILE, 0.75); ctx.lineWidth = 1; ctx.beginPath(); for (const k of [0.3, 0.55, 0.8]) { ctx.moveTo(20 - 24 * k, G - 172 + 22 * k); ctx.lineTo(20 + 24 * k, G - 172 + 22 * k); } ctx.stroke();
    // courtine en talus, cordon, embrasures
    const wall = [-14, G, -14, G - 92, 70, G - 92, 82, G];
    poly(ctx, wall, WALL); poly(ctx, [56, G - 92, 70, G - 92, 82, G, 62, G], 'rgba(90,60,20,0.2)');
    ctx.strokeStyle = 'rgba(90,60,20,0.2)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = G - 70, i = 0; y < G - 4; y += 13, i++) { const xr = 70 + (y - (G - 92)) * 0.13; ctx.moveTo(-14, y); ctx.lineTo(xr, y); for (let x = -14 + (i % 2 ? 9 : 19); x < xr - 4; x += 20) { ctx.moveTo(x, y); ctx.lineTo(x, y + 13); } }
    ctx.stroke();
    poly(ctx, wall, null, 1.6);
    rect(ctx, -16, G - 84, 90, 5, WALL_L, 1.2);
    for (let i = 0; i < 4; i++) rect(ctx, -12 + i * 21, G - 104, 13, 12.5, WALL, 1.4);
    rect(ctx, -16, G - 93.5, 88, 3.6, WALL_D, 1);
    for (const x of [8, 56]) { oval(ctx, x, G - 66, 6.5, 5, '#2a1e16', 1.2); rect(ctx, x - 1, G - 68.4, 10, 4.6, '#55524c', 0.9); disc(ctx, x + 9.4, G - 66.1, 2.6, '#3a3834', 0.9); }
    // porte
    blob(ctx, WOOD_D, () => { ctx.moveTo(22, G); ctx.lineTo(22, G - 34); ctx.quadraticCurveTo(33, G - 50, 44, G - 34); ctx.lineTo(44, G); }, 1.8);
    line(ctx, [33, G - 42, 33, G], INK, 1.2); line(ctx, [27.5, G - 38, 27.5, G], WOOD, 1); line(ctx, [38.5, G - 38, 38.5, G], WOOD, 1);
    rect(ctx, 22.5, G - 26, 21, 2.4, '#3a3834'); rect(ctx, 22.5, G - 10, 21, 2.4, '#3a3834'); disc(ctx, 30.5, G - 18, 1.4, GOLD); disc(ctx, 35.5, G - 18, 1.4, GOLD);
    blob(ctx, team, () => { ctx.moveTo(26, G - 80); ctx.lineTo(40, G - 80); ctx.lineTo(40, G - 60); ctx.lineTo(33, G - 54); ctx.lineTo(26, G - 60); }, 1.2);
    disc(ctx, 33, G - 69, 3.4, GOLD, 0.8);
    // tour des tourelles en brique, consoles de pierre
    rect(ctx, 80, G - 140, 26, 140, '#c08a62', 1.5); rect(ctx, 100, G - 140, 6, 140, 'rgba(70,30,10,0.22)');
    ctx.strokeStyle = 'rgba(70,30,10,0.22)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = G - 131; y < G - 2; y += 9) { ctx.moveTo(80, y); ctx.lineTo(106, y); } ctx.stroke();
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; poly(ctx, [98, y + 3, 106, y + 3, 106, y + 11], WALL_D, 1); rect(ctx, 76, y - 1, 34, 4.4, WALL_L, 1.2); }
    for (let i = 0; i < 3; i++) rect(ctx, 79 + i * 10, G - 150, 7, 10, '#c08a62', 1.3);
    // bannière
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [20, G - 172, 20, G - 191], 1.6, WOOD_D);
    blob(ctx, team, () => { ctx.moveTo(20, G - 190); ctx.quadraticCurveTo(32, G - 192 + wv, 43, G - 188 + wv); ctx.lineTo(43, G - 176 + wv * 0.5); ctx.quadraticCurveTo(32, G - 174 + wv * 0.5, 20, G - 177); });
    line(ctx, [20, G - 183.5, 43, G - 182 + wv * 0.7], IVORY, 1.8);
    // boulets et tonneau
    for (const [x, y] of [[62, G - 3.4], [69, G - 3.4], [65.5, G - 9.4]]) disc(ctx, x, y, 3.6, '#3a3834', 1);
    rect(ctx, -10, G - 15, 11, 15, WOOD, 1.2); line(ctx, [-10, G - 11, 1, G - 11], '#3a3834', 1.4); line(ctx, [-10, G - 4, 1, G - 4], '#3a3834', 1.4);
  };

  /* --------------------------------------------------------------- tourelles */
  function carriage(ctx, team) { blob(ctx, WOOD, () => { ctx.moveTo(-12, 3); ctx.lineTo(8, -1); ctx.lineTo(10, 3); ctx.lineTo(-10, 8); }, 1.1); line(ctx, [-9, 4.6, 6, 1.6], team, 2); wheel(ctx, 1, 4.4, 5, 0.3, '#3a2a1a', '#a07a4a', 3); }
  A.turrets.fauconneau = function (ctx, a, team) {
    carriage(ctx, team);
    ctx.save(); ctx.translate(-a * 3.5, 0); ctx.rotate(-0.14);
    blob(ctx, BRONZE, () => { ctx.moveTo(-10, -9.5); ctx.lineTo(18, -8.2); ctx.lineTo(18, -3.4); ctx.lineTo(-10, -2.4); ctx.quadraticCurveTo(-13.5, -6, -10, -9.5); });
    rect(ctx, 17, -9.4, 3, 7.2, dk(BRONZE, 0.75), 0.9); rect(ctx, 2, -9.3, 2, 6.6, dk(BRONZE, 0.75)); disc(ctx, -12.6, -6, 1.7, BRONZE, 0.9);
    line(ctx, [-8, -8.3, 15, -7.2], 'rgba(255,255,255,0.45)', 1);
    ctx.restore();
    muzzle(ctx, 22 - a * 3.5, -8.6, a);
  };
  A.turrets.mortier = function (ctx, a, team) {
    rect(ctx, -12, 1, 24, 6.5, WOOD, 1.2); rect(ctx, -12, 3.2, 24, 2, team);
    ctx.save(); ctx.translate(-1, 0); ctx.rotate(-0.95);
    blob(ctx, BRONZE, () => { ctx.moveTo(-3, -6.5); ctx.lineTo(15 - a * 3, -7.5); ctx.lineTo(15 - a * 3, 7.5); ctx.lineTo(-3, 6.5); ctx.quadraticCurveTo(-7, 0, -3, -6.5); });
    rect(ctx, 13 - a * 3, -8.4, 3.2, 16.8, dk(BRONZE, 0.75), 0.9);
    ctx.restore();
    if (a > 0.3) { ctx.fillStyle = `rgba(235,235,235,${a * 0.6})`; ctx.beginPath(); ctx.arc(10, -18 - (1 - a) * 8, 4 + (1 - a) * 6, 0, TAU); ctx.fill(); }
    muzzle(ctx, 8.5, -13.5, a);
  };
  A.turrets.orgue = function (ctx, a, team) {
    carriage(ctx, team);
    ctx.save(); ctx.translate(-a * 2, 0);
    rect(ctx, -9, -13, 6, 12, WOOD_D, 1.1);
    for (let i = 0; i < 4; i++) rect(ctx, -6, -13.2 + i * 3, 25, 2, '#55524c', 0.7);
    rect(ctx, 6, -14, 2.4, 13, BRONZE, 0.8);
    ctx.restore();
    if (a > 0.45) for (let i = 0; i < 4; i++) disc(ctx, 21 + (i % 2) * 2, -12.2 + i * 3, 1.6 + a * 1.4, `rgba(255,214,110,${a})`);
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.bullet = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,236,170,0.5)'; ctx.beginPath(); ctx.moveTo(0, -1.6); ctx.lineTo(-16, 0); ctx.lineTo(0, 1.6); ctx.closePath(); ctx.fill();
    oval(ctx, 0, 0, 2.6, 1.6, '#fff0b8');
  };
  A.projectiles.cannonball = function (ctx, p, dir) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(60,56,52,0.25)'; ctx.beginPath(); ctx.moveTo(0, -4.6); ctx.lineTo(-18, 0); ctx.lineTo(0, 4.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    disc(ctx, p.x, p.y, 5, '#3a3834', 1); disc(ctx, p.x - 1.6, p.y - 1.8, 1.5, 'rgba(255,255,255,0.4)');
  };
  A.projectiles.mortar = function (ctx, p) {
    disc(ctx, p.x, p.y, 5.8, '#2f2e2c', 1); disc(ctx, p.x - 1.8, p.y - 2, 1.6, 'rgba(255,255,255,0.35)');
    rect(ctx, p.x - 1, p.y - 8.6, 2, 3, '#8a7a5a');
    halo(ctx, p.x, p.y - 10, 5.5, '255,190,80', 0.9); disc(ctx, p.x + Math.sin(p.x * 0.4), p.y - 10, 1.4, '#fff3c0');
  };
  A.drops.cannonball = function (ctx, d) {
    ctx.fillStyle = 'rgba(70,64,58,0.25)'; ctx.beginPath(); ctx.moveTo(d.x - 7, d.y - 2); ctx.lineTo(d.x - 1.5, d.y - 60); ctx.lineTo(d.x + 1.5, d.y - 60); ctx.lineTo(d.x + 7, d.y - 2); ctx.closePath(); ctx.fill();
    disc(ctx, d.x, d.y - 2, 8.6, '#3a3834', 1.2); disc(ctx, d.x - 2.8, d.y - 5, 2.4, 'rgba(255,255,255,0.4)');
  };

  /* -------------------------------------------------------------------- décor */
  A.backdrops.renaissance = backdrop('renaissance', 1503, (g, r) => {
    sky(g, [[0, '#5a78b8'], [0.36, '#b9a0c0'], [0.62, '#f2b78a'], [0.86, '#f9d99a'], [1, '#fbe9bc']]);
    halo(g, 880, 400, 330, '255,236,180', 0.85); disc(g, 880, 400, 54, '#fff3cf');
    range(g, ridge(r, 486, 96, 90, 170), 486, '#9f95b8', 'rgba(60,48,90,0.16)', false);
    const gr = g.createLinearGradient(0, 410, 0, 530); gr.addColorStop(0, 'rgba(251,226,180,0)'); gr.addColorStop(1, 'rgba(251,226,180,0.9)');
    g.fillStyle = gr; g.fillRect(-40, 410, W + 80, 220);
  }, (f, r) => {
    const h1 = x => 508 - Math.sin(x * 0.0044 + 0.2) * 30 - Math.sin(x * 0.013 + 2.2) * 8;
    const h2 = x => 564 - Math.sin(x * 0.0064 + 3.7) * 16 - Math.sin(x * 0.017 + 0.5) * 6;
    let gr = f.createLinearGradient(0, 470, 0, GROUND); gr.addColorStop(0, '#c9bd76'); gr.addColorStop(1, '#a9a45e');
    hills(f, h1, 0, gr);
    // ville à coupole sur la colline
    const cx = 250, cy = h1(250) + 4;
    f.fillStyle = '#e6cfa6'; f.fillRect(cx - 80, cy - 20, 170, 20);
    for (let i = 0; i < 9; i++) f.fillRect(cx - 80 + i * 19.4, cy - 25, 11, 6);
    for (const [x, w, hh, roof] of [[cx - 62, 22, 30, 1], [cx - 34, 18, 22, 1], [cx + 40, 24, 26, 1], [cx + 68, 16, 34, 1]]) { f.fillStyle = '#ecdcb8'; f.fillRect(x, cy - 20 - hh, w, hh); f.fillStyle = TILE; f.beginPath(); f.moveTo(x - 2, cy - 20 - hh); f.lineTo(x + w / 2, cy - 20 - hh - 8); f.lineTo(x + w + 2, cy - 20 - hh); f.fill(); }
    f.fillStyle = '#f1e3c2'; f.fillRect(cx - 12, cy - 56, 44, 36);
    f.fillStyle = TILE; f.beginPath(); f.ellipse(cx + 10, cy - 56, 23, 25, 0, Math.PI, 0); f.fill();
    f.strokeStyle = '#f1e3c2'; f.lineWidth = 1.6; for (const dx of [-12, 0, 12]) { f.beginPath(); f.moveTo(cx + 10 + dx, cy - 56); f.quadraticCurveTo(cx + 10 + dx * 0.6, cy - 74, cx + 10, cy - 81); f.stroke(); }
    f.fillStyle = '#f1e3c2'; f.fillRect(cx + 7, cy - 90, 6, 10); f.fillStyle = '#ecdcb8'; f.fillRect(cx - 44, cy - 96, 13, 76);
    f.fillStyle = TILE; f.beginPath(); f.moveTo(cx - 46, cy - 96); f.lineTo(cx - 37.5, cy - 110); f.lineTo(cx - 29, cy - 96); f.fill();
    f.fillStyle = 'rgba(110,70,30,0.2)'; f.fillRect(cx + 22, cy - 56, 10, 36); f.fillRect(cx - 35, cy - 96, 4, 76);
    // vignes et allée de cyprès
    f.strokeStyle = 'rgba(80,100,40,0.35)'; f.lineWidth = 2.4;
    for (let k = 0; k < 6; k++) { f.beginPath(); for (let x = 560; x <= 800; x += 12) { const y = h1(x) + 12 + k * 8; if (x === 560) f.moveTo(x + k * 5, y); else f.lineTo(x + k * 5, y); } f.stroke(); }
    for (let i = 0; i < 7; i++) { const x = 880 + i * 34; cypress(f, x, h1(x) + 3, 0.9 + (i % 3) * 0.12); }
    for (const [x, s] of [[40, 1.1], [70, 0.85], [470, 1], [500, 1.2], [1200, 1.1], [1232, 0.85]]) cypress(f, x, h1(x) + 3, s);
    f.fillStyle = '#ecdcb8'; f.fillRect(1110, h1(1120) - 16, 30, 18); f.fillStyle = TILE; f.beginPath(); f.moveTo(1106, h1(1120) - 16); f.lineTo(1125, h1(1120) - 28); f.lineTo(1144, h1(1120) - 16); f.fill();
    hills(f, h2, 0, '#9aa552');
    gr = f.createLinearGradient(0, 548, 0, GROUND); gr.addColorStop(0, '#8f9a4c'); gr.addColorStop(1, '#7b8540');
    hills(f, h2, 5, gr);
    for (const [x, s] of [[150, 1.3], [420, 1.15], [700, 1.4], [1010, 1.2], [1180, 1.35]]) olive(f, x, h2(x) + 6, s);
    for (const [x, s] of [[300, 1.5], [330, 1.2], [860, 1.6], [1100, 1.3]]) cypress(f, x, h2(x) + 8, s);
    soil(f, r, { top: '#b98f58', bottom: '#86633a', pebbles: ['#a59886', '#c2b49c'], nPebbles: 30, tufts: ['#b9a55a', '#8f9a52'], band: '#9aa552', bandLight: '#bcc46c', blade: '#7f8a40' });
  }, (ctx, t, dt, R) => {
    clouds(ctx, R, dt, 'rgba(240,170,140,0.7)', 'rgba(255,232,206,0.92)');
    flock(ctx, t, dt, 'renaissance', '#4a3a44', 5);
  });
})();

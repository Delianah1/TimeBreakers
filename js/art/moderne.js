/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE MODERNE
   Champ de bataille sous un ciel plombé, ville en ruine, bunker de béton.
   Fournit le projectile commun « rocket » (repris au Post-apo).
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, SKIN, IVORY, WOOD, WOOD_D, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, helm, arm, fist, thrust, aim, muzzle, puffs, flame, halo, backdrop, sky, hills, clouds, flock, soil, longGun } = K;
  const OLIVE = '#6a7a4a', OLIVE_D = '#4f5c38', OLIVE_L = '#86965e', GUN = '#3b3f45', CONC = '#9a9c94', CONC_D = '#74766f', CONC_L = '#b6b8b0';

  /* ------------------------------------------------------------------ unités */
  function steelHelmet(c, a, team) { helm(c, a, OLIVE, { neck: 0.8, brim: 7.6, shine: false }); line(c, [a.hx - 5.6, a.hy - 3.6, a.hx + 5, a.hy - 4.2], team, 1.8); line(c, [a.hx - 4.4, a.hy - 5.6, a.hx - 2.6, a.hy - 8.2], OLIVE_L, 1.1); }
  function pack(c, a) { rect(c, -11, -32 + a.ty, 6.5, 12, OLIVE_D, 1.1); rect(c, -11, -27.5 + a.ty, 6.5, 1.6, '#3a2c22'); rect(c, -10.4, -35.4 + a.ty, 5.4, 3.6, '#8a7a5a', 0.9); }
  function webbing(c, a) { line(c, [-5.2 * a.k, -30.6 + a.ty, 6 * a.k, -20.4 + a.ty], OLIVE_D, 1.8); rect(c, 1.4 * a.k, -18.6 + a.ty, 4, 3.6, OLIVE_D, 0.8); rect(c, -4.4 * a.k, -18.4 + a.ty, 4, 3.6, OLIVE_D, 0.8); }
  // Sapeur : vareuse d'équipe, casque d'acier, fusil à baïonnette.
  A.units.sapeur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: OLIVE, boots: '#2a2622', belt: '#3a2c22', sleeve: team, back: pack, over: webbing,
      head(c, a) { steelHelmet(c, a, team); },
      arm(c, a) { thrust(c, a, cc => {
        blob(cc, '#6a4a2c', () => { cc.moveTo(-10, -1.2); cc.lineTo(6, -1.8); cc.lineTo(6, 1.8); cc.lineTo(-6, 3.4); cc.lineTo(-10.5, 4.8); }, 1);
        rect(cc, 5, -2, 17, 2.4, GUN, 0.8); blob(cc, '#e3e7ee', () => { cc.moveTo(21.5, -1.6); cc.lineTo(32, -0.8); cc.lineTo(21.5, 0.4); }, 0.8);
      }, { sleeve: team, x: 3, y: 4.5, reach: 8, rot: -0.07 }); },
    }, R);
  } };
  // Tireur d'élite : chapeau de brousse, foulard, long fusil à lunette.
  A.units.tireur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: OLIVE_D, boots: '#2a2622', belt: '#3a2c22', sleeve: team, over: webbing,
      head(c, a) { blob(c, OLIVE_L, () => { c.moveTo(a.hx - 6.4, a.hy + 3.6); c.quadraticCurveTo(a.hx - 1, a.hy + 8.4, a.hx + 5, a.hy + 4.4); c.lineTo(a.hx + 3.6, a.hy + 2.6); c.lineTo(a.hx - 5.6, a.hy + 1.6); }, 1);
        blob(c, OLIVE, () => { c.moveTo(a.hx - 5, a.hy - 3.6); c.quadraticCurveTo(a.hx - 4.6, a.hy - 10, a.hx + 0.6, a.hy - 9.8); c.quadraticCurveTo(a.hx + 5.4, a.hy - 9.6, a.hx + 5, a.hy - 3.8); }, 1.1);
        limb(c, [a.hx - 10, a.hy - 2.4, a.hx + 9.6, a.hy - 4.6], 1.7, OLIVE); line(c, [a.hx - 4.8, a.hy - 4.6, a.hx + 4.8, a.hy - 5], team, 1.6); },
      arm(c, a) { aim(c, a, (cc, k) => {
        longGun(cc, k, 25, '#4a3d2c', GUN); rect(cc, 3, -5.6, 11, 2.8, '#24262a', 0.8); disc(cc, 14, -4.2, 1.2, '#9fd0d8');
        line(cc, [20, 0.4, 22.5, 6], GUN, 1.2);
      }, { sleeve: team, y: 3.5, glove: '#3a2c22' }); },
    }, R);
  } };
  // Lance-flammes (élite) : masque à gaz, réservoirs dorsaux, jet de feu.
  A.units['lance-flammes'] = { h: 46, top: 52, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: OLIVE, boots: '#2a2622', belt: '#3a2c22', sleeve: team, face: false, headColor: '#4c4f48',
      back(c, a) { for (const x of [-13, -8.4]) { rect(c, x, -35 + a.ty, 4.6, 16, '#7a6a4a', 1.1); rect(c, x, -30 + a.ty, 4.6, 2, '#c0392b'); } rect(c, -12, -37.4 + a.ty, 7.4, 2.6, GUN, 0.9); },
      over: webbing,
      head(c, a) { steelHelmet(c, a, team); disc(c, a.hx + 1.6, a.hy - 0.4, 2.2, '#9fd0d8', 0.9); disc(c, a.hx + 5, a.hy - 0.6, 1.7, '#9fd0d8', 0.9); rect(c, a.hx + 3.4, a.hy + 2.2, 5.6, 4, '#2f322c', 0.9); disc(c, a.hx + 9, a.hy + 4.2, 2.2, '#6a6a62', 0.9); },
      arm(c, a) { aim(c, a, (cc, k) => {
        line(cc, [-3, 2, -11, 5, -15, -2], '#2a2a26', 1.6);
        rect(cc, -5, -2.4, 12, 5.4, '#4a4a40', 1); rect(cc, 6, -1.4, 16, 3, GUN, 0.9); rect(cc, 20, -2.4, 3, 5, '#24262a', 0.8);
        if (k > 0.12) {
          const L = 14 + k * 16, f = Math.sin(now() * 40) * 1.5;
          cc.fillStyle = `rgba(255,110,30,${0.5 + k * 0.5})`; cc.beginPath(); cc.moveTo(23, 0); cc.quadraticCurveTo(23 + L * 0.5, -9 - f, 23 + L, -5 + f); cc.quadraticCurveTo(23 + L + 5, 1, 23 + L - 2, 6 - f); cc.quadraticCurveTo(23 + L * 0.5, 8, 23, 0.6); cc.fill();
          cc.fillStyle = '#ffd36a'; cc.beginPath(); cc.moveTo(23, 0); cc.quadraticCurveTo(23 + L * 0.4, -4.5, 23 + L * 0.7, -1 + f * 0.5); cc.quadraticCurveTo(23 + L * 0.4, 4, 23, 0.6); cc.fill();
        } else { cc.fillStyle = '#ff9a3c'; cc.beginPath(); cc.moveTo(23, -1.4); cc.lineTo(27, 0); cc.lineTo(23, 1.6); cc.fill(); }
      }, { sleeve: team, y: 5, kick: 1, glove: '#3a2c22' }); },
    }, R);
  } };

  // Char d'assaut. o : hull (couleur), crown (chef de char couronné, canon plus long)
  function tank(ctx, u, team, dark, atk, o, R) {
    const mv = u.moving, roll = mv ? u.walk * 3 : 0, jolt = mv ? Math.sin(u.walk * 2) * 0.5 : 0;
    const C1 = o.hull, C2 = dk(C1, 0.74), C3 = dk(C1, 1.22);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    puffs(ctx, -31, -21, { n: 3, speed: mv ? 1.2 : 0.5, rise: 14, drift: -14, r0: 2.4, r1: 6, rgb: '70,70,66', a: 0.45, seed: u.x * 0.01 });
    blob(ctx, '#2f2f2c', () => { ctx.moveTo(-30, -13.5); ctx.lineTo(28, -13.5); ctx.quadraticCurveTo(35.5, -12, 33, -5); ctx.quadraticCurveTo(30, 0, 24, 0); ctx.lineTo(-24, 0); ctx.quadraticCurveTo(-31, 0, -33, -6); ctx.quadraticCurveTo(-34.5, -12.5, -30, -13.5); }, 1.4);
    for (let i = 0; i < 5; i++) { const x = -22 + i * 11; disc(ctx, x, -6.4, 4.5, '#5f5f56', 0.9); line(ctx, [x + Math.cos(roll) * 4, -6.4 + Math.sin(roll) * 4, x - Math.cos(roll) * 4, -6.4 - Math.sin(roll) * 4], '#34342f', 1.1); disc(ctx, x, -6.4, 1.5, '#2f2f2c'); }
    ctx.strokeStyle = '#191917'; ctx.lineWidth = 1.4; ctx.beginPath(); const off = ((roll * 4) % 6 + 6) % 6;
    for (let x = -28 + off; x < 28; x += 6) { ctx.moveTo(x, -13.2); ctx.lineTo(x, -11.6); ctx.moveTo(x - 2, -0.3); ctx.lineTo(x - 2, -1.9); } ctx.stroke();
    blob(ctx, C1, () => { ctx.moveTo(-31.5, -13.5); ctx.lineTo(-27, -25.5 + jolt); ctx.lineTo(22, -25.5 + jolt); ctx.lineTo(33.5, -17.5); ctx.lineTo(33.5, -13.5); }, 1.5);
    poly(ctx, [-26.6, -25.2 + jolt, 22, -25.2 + jolt, 24.6, -23.4 + jolt, -26, -23.4 + jolt], C3);
    poly(ctx, [22, -25.2 + jolt, 33.2, -17.4, 33.2, -14, 22, -14], C2);
    rect(ctx, -14, -22 + jolt, 20, 6, team, 0.9); R.star(ctx, -4, -19 + jolt, 2.6, IVORY, 0);
    for (const x of [-24, -19, 11, 16]) disc(ctx, x, -17 + jolt, 0.9, C2);
    const rx = -atk * 5, L = o.crown ? 32 : 27;
    rect(ctx, 9 + rx, -35 + jolt, L, 4.8, C2, 1.1); rect(ctx, 7 + L + rx, -36.2 + jolt, 4.8, 7.2, '#34342f', 1);
    blob(ctx, C1, () => { ctx.moveTo(-15.5, -25.5 + jolt); ctx.lineTo(-11, -38 + jolt); ctx.lineTo(9, -38 + jolt); ctx.lineTo(15.5, -25.5 + jolt); }, 1.5);
    poly(ctx, [3, -37.6 + jolt, 9, -37.6 + jolt, 15, -26 + jolt, 9, -26 + jolt], C2); disc(ctx, 11, -32.6 + jolt, 3.4, C2, 1);
    line(ctx, [-10.4, -36 + jolt, 2, -36 + jolt], C3, 1.3);
    muzzle(ctx, 14 + L + rx, -32.6 + jolt, atk);
    line(ctx, [-9, -38 + jolt, -12.5, -54 + jolt], '#24241f', 1.1); poly(ctx, [-12.5, -54 + jolt, -4, -51.5 + jolt, -12, -48.6 + jolt], team, 0.8);
    if (o.crown) {
      oval(ctx, 0, -38 + jolt, 6, 2, C2, 1); rect(ctx, -3.4, -43 + jolt, 6.8, 5.4, team, 1); disc(ctx, 0, -46.4 + jolt, 4, SKIN, 1.2); disc(ctx, 1.9, -46.8 + jolt, 0.75, INK);
      R.crown(ctx, 0, -52.4 + jolt);
    } else oval(ctx, -1, -38 + jolt, 5.4, 1.8, C2, 1);
  }
  K.tank = tank;
  A.units.char = { h: 44, draw(ctx, u, team, dark, atk, R) { tank(ctx, u, team, dark, atk, { hull: OLIVE }, R); } };
  A.units.commandant = { h: 44, draw(ctx, u, team, dark, atk, R) { tank(ctx, u, team, dark, atk, { hull: '#5a6058', crown: true }, R); } };

  /* ------------------------------------------------------------ base : bunker */
  function sandbags(ctx, x, y, n, rows) {
    for (let r = 0; r < rows; r++) for (let i = 0; i < n - r; i++) oval(ctx, x + i * 11 + r * 5.5, y - r * 6.4, 6.2, 3.8, r % 2 ? '#a89668' : '#b9a878', 1);
  }
  A.bases.bunker = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // mât radio et antenne radar qui tourne
    limb(ctx, [10, G - 118, 10, G - 152], 1.6, GUN); line(ctx, [4, G - 132, 10, G - 140, 16, G - 132], GUN, 1.1); disc(ctx, 10, G - 153, 2.2, Math.sin(T * 4) > 0 ? '#ff5a4a' : '#7a2a24', 0.8);
    const sw = Math.cos(T * 1.4);
    limb(ctx, [36, G - 118, 36, G - 132], 2, GUN); oval(ctx, 36, G - 136, 2 + Math.abs(sw) * 9, 6, CONC_L, 1.2); line(ctx, [36, G - 136, 36 + sw * 8, G - 140], GUN, 1.3);
    // casemate de béton
    const sil = [-14, G, -14, G - 118, 54, G - 118, 72, G - 100, 78, G - 60, 78, G];
    poly(ctx, sil, CONC); poly(ctx, [-14, G - 118, 54, G - 118, 60, G - 112, -14, G - 112], CONC_L); poly(ctx, [54, G - 118, 72, G - 100, 78, G - 60, 78, G, 64, G, 64, G - 60, 60, G - 100], CONC_D);
    ctx.strokeStyle = 'rgba(30,30,26,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (const y of [G - 88, G - 58, G - 28]) { ctx.moveTo(-14, y); ctx.lineTo(64, y); } for (const x of [8, 34]) { ctx.moveTo(x, G - 112); ctx.lineTo(x, G); } ctx.stroke();
    line(ctx, [20, G - 110, 24, G - 96, 20, G - 84], 'rgba(30,30,26,0.35)', 1); line(ctx, [50, G - 54, 46, G - 40], 'rgba(30,30,26,0.35)', 1);
    poly(ctx, sil, null, 1.7);
    rect(ctx, -14, G - 106, 70, 6, team); line(ctx, [-12, G - 103, 54, G - 103], IVORY, 1.2);
    // meurtrière et canon, porte blindée
    rect(ctx, 22, G - 80, 38, 9, '#1c1d1a', 1.3); rect(ctx, 20, G - 83, 42, 3.4, CONC_D, 1); rect(ctx, 44, G - 77.5, 22, 3.6, GUN, 0.9);
    rect(ctx, 4, G - 50, 26, 50, '#4a4f48', 1.6); for (const y of [G - 40, G - 24, G - 8]) line(ctx, [6, y, 28, y], '#34382f', 1.3); disc(ctx, 24, G - 28, 2.4, '#8a8f84', 0.8);
    for (const [x, y] of [[7, G - 46], [27, G - 46], [7, G - 4], [27, G - 4]]) disc(ctx, x, y, 1, '#8a8f84');
    // filet de camouflage, sacs de sable, barbelés
    ctx.fillStyle = 'rgba(88,104,60,0.75)'; ctx.beginPath(); for (const [x, y, r] of [[-8, G - 118, 9], [6, G - 121, 8], [20, G - 119, 9], [-12, G - 108, 6]]) ell(ctx, x, y, r, r * 0.6); ctx.fill();
    sandbags(ctx, 34, G - 4, 4, 3);
    line(ctx, [-12, G - 12, -12, G], WOOD_D, 2); ctx.strokeStyle = '#5a5a56'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -12; x < 2; x += 4) ctx.arc(x + 2, G - 9, 2.6, 0, TAU); ctx.stroke();
    // pylône des tourelles en treillis d'acier
    limb(ctx, [81, G, 82, G - 138], 2.2, '#5a5f58'); limb(ctx, [106, G, 105, G - 138], 2.2, '#484c46');
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30;
      line(ctx, [82, y - 2, 105, y - 15, 82, y - 28], '#484c46', 1.4);
      rect(ctx, 76, y - 1, 34, 4.4, CONC_L, 1.2); rect(ctx, 76, y + 2, 34, 1.4, CONC_D);
    }
    // drapeau
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [54, G - 118, 54, G - 156], 1.6, GUN);
    blob(ctx, team, () => { ctx.moveTo(54, G - 155); ctx.quadraticCurveTo(66, G - 157 + wv, 78, G - 153 + wv); ctx.lineTo(78, G - 141 + wv * 0.5); ctx.quadraticCurveTo(66, G - 139 + wv * 0.5, 54, G - 142); });
    line(ctx, [54, G - 148.5, 78, G - 147 + wv * 0.7], IVORY, 2);
  };

  /* --------------------------------------------------------------- tourelles */
  function tripod(ctx) { limb(ctx, [0, -2, -9, 8], 1.8, GUN); limb(ctx, [0, -2, 8, 8], 1.8, GUN); limb(ctx, [0, -2, -1, 8], 1.6, '#2a2c30'); }
  A.turrets.mitrailleuse = function (ctx, a, team) {
    tripod(ctx);
    rect(ctx, -12, -4, 8, 6, OLIVE, 1); rect(ctx, -12, -1.4, 8, 1.6, team);
    ctx.save(); ctx.translate(-a * 2, 0);
    rect(ctx, -9, -10, 15, 6.5, GUN, 1.1); rect(ctx, 5, -8.6, 17, 3, '#2a2c30', 0.9); rect(ctx, 9, -9.6, 8, 5, '#4a4f55', 0.8);
    poly(ctx, [-2, -15, 3, -15, 4, -2, -3, -2], OLIVE_D, 1); line(ctx, [-9, -7, -13, -9, -14, -5], GUN, 1.5);
    ctx.restore();
    muzzle(ctx, 24 - a * 2, -7.2, a);
  };
  A.turrets.antichar = function (ctx, a, team) {
    limb(ctx, [-3, 3, -13, 8], 2, GUN); disc(ctx, 0, 4, 5.4, '#2a2c30', 1.1); disc(ctx, 0, 4, 2, '#6a6e66');
    ctx.save(); ctx.translate(-a * 4, 0);
    rect(ctx, -9, -8.4, 36, 4.2, GUN, 1.1); rect(ctx, 25, -9.6, 5, 6.6, '#24262a', 1); rect(ctx, -12, -9.6, 6, 6.6, '#4a4f55', 1);
    ctx.restore();
    poly(ctx, [-5, -17, 1, -17, 2.6, 1, -6, 1], OLIVE, 1.2); rect(ctx, -5, -10, 6.6, 2.4, team);
    muzzle(ctx, 33 - a * 4, -6.4, a);
  };
  A.turrets.roquettes = function (ctx, a, team) {
    rect(ctx, -9, -1, 18, 8.5, OLIVE_D, 1.2); rect(ctx, -9, 2.6, 18, 2, team);
    ctx.save(); ctx.translate(-1, -4); ctx.rotate(-0.5);
    rect(ctx, -8, -8, 25, 14, OLIVE, 1.3); line(ctx, [-8, -1, 17, -1], OLIVE_D, 1.2); line(ctx, [4.5, -8, 4.5, 6], OLIVE_D, 1.2);
    for (const [x, y] of [[17, -4.6], [17, 2.4]]) { oval(ctx, x, y, 1.6, 2.6, '#1c1d1a', 0.8); if (a < 0.5) disc(ctx, x + 0.4, y, 1.3, '#c0392b'); }
    if (a > 0.3) { ctx.fillStyle = `rgba(255,170,60,${a})`; ctx.beginPath(); ctx.arc(-10, -1, 3 + a * 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.shell = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,220,140,0.45)'; ctx.beginPath(); ctx.moveTo(-3, -2.4); ctx.lineTo(-26, 0); ctx.lineTo(-3, 2.4); ctx.closePath(); ctx.fill();
    blob(ctx, '#c8a24a', () => { ctx.moveTo(-5, -2.6); ctx.lineTo(3, -2.6); ctx.lineTo(8, 0); ctx.lineTo(3, 2.6); ctx.lineTo(-5, 2.6); }, 0.8);
    rect(ctx, -5, -2.6, 2, 5.2, '#8a6a2a');
  };
  A.projectiles.rocket = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(200,196,190,0.4)'; ctx.beginPath(); ctx.arc(-17, 0, 4, 0, TAU); ctx.arc(-25, 1, 5, 0, TAU); ctx.arc(-34, -1, 5.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(-8, -2.4); ctx.lineTo(-17 - Math.random() * 5, 0); ctx.lineTo(-8, 2.4); ctx.fill();
    ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.moveTo(-8, -1.2); ctx.lineTo(-12, 0); ctx.lineTo(-8, 1.2); ctx.fill();
    blob(ctx, OLIVE, () => { ctx.moveTo(-8, -2.8); ctx.lineTo(5, -2.8); ctx.lineTo(10, 0); ctx.lineTo(5, 2.8); ctx.lineTo(-8, 2.8); }, 0.9);
    poly(ctx, [-8, -2.8, -11, -5.6, -4, -2.8], OLIVE_D, 0.7); poly(ctx, [-8, 2.8, -11, 5.6, -4, 2.8], OLIVE_D, 0.7); rect(ctx, 3.6, -2.8, 1.8, 5.6, '#c0392b');
  };
  A.projectiles.flame = function (ctx, p) {
    const f = Math.random() * 3;
    halo(ctx, p.x, p.y, 13 + f, '255,120,30', 0.55);
    disc(ctx, p.x, p.y, 6 + f * 0.5, '#ff8a2a'); disc(ctx, p.x + 1, p.y, 3.2, '#ffd36a');
  };
  // Frappe aérienne : bombe à ailettes
  A.drops.bomb = function (ctx, d) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(d.x - 0.8, d.y - 58, 1.6, 34);
    ctx.save(); ctx.translate(d.x, d.y - 6);
    blob(ctx, GUN, () => { ctx.moveTo(0, 12); ctx.quadraticCurveTo(-6.5, 5, -5, -8); ctx.lineTo(5, -8); ctx.quadraticCurveTo(6.5, 5, 0, 12); }, 1.1);
    poly(ctx, [-5, -8, -8, -17, 0, -12, 8, -17, 5, -8], '#5a5f66', 1); rect(ctx, -5.4, -2, 10.8, 2.4, '#c8a24a'); line(ctx, [-2.4, 4, -1.6, -5], 'rgba(255,255,255,0.35)', 1.1);
    ctx.restore();
  };

  /* -------------------------------------------------------------------- décor */
  function ruin(g, x, base, w, hh, col, r) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, base + 40); g.lineTo(x, base - hh * (0.6 + r() * 0.4));
    for (let k = 1; k <= 5; k++) g.lineTo(x + w * k / 5, base - hh * (0.35 + r() * 0.65));
    g.lineTo(x + w, base + 40); g.closePath(); g.fill();
    g.fillStyle = 'rgba(20,24,28,0.45)'; for (let k = 0; k < 6; k++) g.fillRect(x + 5 + r() * (w - 14), base - 8 - r() * hh * 0.5, 5, 8);
  }
  function deadTree(g, x, y, s) {
    g.strokeStyle = '#3a3630'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y + 3); g.lineTo(x + 1.5 * s, y - 26 * s); g.stroke();
    g.lineWidth = 1.8 * s; g.beginPath(); g.moveTo(x + 1, y - 14 * s); g.lineTo(x + 10 * s, y - 24 * s); g.moveTo(x + 1, y - 19 * s); g.lineTo(x - 8 * s, y - 28 * s); g.moveTo(x + 1.4 * s, y - 26 * s); g.lineTo(x + 5 * s, y - 34 * s); g.stroke();
  }
  A.backdrops.moderne = backdrop('moderne', 1944, (g, r) => {
    sky(g, [[0, '#55626e'], [0.45, '#8f9aa2'], [0.8, '#c9cbc6'], [1, '#dcd8c8']]);
    halo(g, 900, 170, 230, '255,246,224', 0.45); disc(g, 900, 170, 30, 'rgba(255,250,236,0.7)');
    for (const [x, w, hh] of [[40, 130, 70], [230, 90, 96], [380, 160, 60], [620, 110, 104], [800, 150, 66], [1010, 100, 90], [1150, 150, 62]]) ruin(g, x, 486, w, hh, '#8a8f92', r);
    g.fillStyle = '#8a8f92'; g.fillRect(688, 486 - 150, 14, 150); g.beginPath(); g.moveTo(684, 486 - 150); g.lineTo(695, 486 - 186); g.lineTo(706, 486 - 150); g.fill();
    const gr = g.createLinearGradient(0, 400, 0, 530); gr.addColorStop(0, 'rgba(214,212,200,0)'); gr.addColorStop(1, 'rgba(214,212,200,0.85)');
    g.fillStyle = gr; g.fillRect(-40, 400, W + 80, 220);
  }, (f, r) => {
    const h1 = x => 512 - Math.sin(x * 0.0046 + 3.3) * 20 - Math.sin(x * 0.013 + 0.8) * 7;
    const h2 = x => 566 - Math.sin(x * 0.0066 + 1.4) * 13 - Math.sin(x * 0.019 + 2.5) * 5;
    let gr = f.createLinearGradient(0, 480, 0, GROUND); gr.addColorStop(0, '#7d8468'); gr.addColorStop(1, '#6a6f56');
    hills(f, h1, 0, gr);
    for (const [x, w, hh] of [[110, 90, 46], [470, 120, 40], [900, 100, 52]]) ruin(f, x, h1(x + w / 2) + 6, w, hh, '#5e625c', r);
    for (const [x, s] of [[60, 1], [300, 1.2], [420, 0.9], [760, 1.1], [1060, 1.2], [1220, 0.95]]) deadTree(f, x, h1(x) + 2, s);
    hills(f, h2, 0, '#5f6648');
    gr = f.createLinearGradient(0, 548, 0, GROUND); gr.addColorStop(0, '#666a4e'); gr.addColorStop(1, '#55573f');
    hills(f, h2, 5, gr);
    // hérissons antichars et barbelés
    f.strokeStyle = '#34342f'; f.lineWidth = 3;
    for (const x of [200, 236, 610, 646, 682, 1100]) { const y = h2(x) + 12; f.beginPath(); f.moveTo(x - 8, y); f.lineTo(x + 8, y - 16); f.moveTo(x + 8, y); f.lineTo(x - 8, y - 16); f.moveTo(x - 10, y - 8); f.lineTo(x + 10, y - 8); f.stroke(); }
    f.lineWidth = 2; for (let x = 780; x <= 960; x += 36) { const y = h2(x) + 12; f.beginPath(); f.moveTo(x, y); f.lineTo(x, y - 15); f.stroke(); }
    f.strokeStyle = '#4a4a44'; f.lineWidth = 1.1; f.beginPath(); for (let x = 780; x < 960; x += 6) { const y = h2(x) + 12; f.moveTo(x + 5, y - 10); f.arc(x + 2.5, y - 10, 2.6, 0, TAU); } f.stroke();
    soil(f, r, { top: '#6e6248', bottom: '#463e2c', pebbles: ['#7a756a', '#8f8a7c'], nPebbles: 26, tufts: ['#6a7048', '#555a3a'], band: '#5f6644', bandLight: '#7c845a', blade: '#4e5438' });
    // cratères et flaques
    for (let i = 0; i < 6; i++) { const x = 80 + r() * (W - 160), y = GROUND + 34 + r() * 60, s = 14 + r() * 16; f.fillStyle = 'rgba(30,26,18,0.35)'; f.beginPath(); f.ellipse(x, y, s, s * 0.3, 0, 0, TAU); f.fill(); f.fillStyle = 'rgba(150,170,180,0.3)'; f.beginPath(); f.ellipse(x + 2, y + 1, s * 0.6, s * 0.16, 0, 0, TAU); f.fill(); }
  }, (ctx, t, dt, R) => {
    puffs(ctx, 300, 420, { n: 6, speed: 0.06, rise: 190, drift: 120, r0: 12, r1: 44, rgb: '70,72,74', a: 0.45 });
    puffs(ctx, 1060, 430, { n: 6, speed: 0.05, rise: 170, drift: 100, r0: 10, r1: 40, rgb: '70,72,74', a: 0.4, seed: 0.5 });
    clouds(ctx, R, dt, 'rgba(96,104,112,0.5)', 'rgba(160,166,170,0.6)');
    flock(ctx, t, dt, 'moderne', '#3f454c', 4, (c, x, y, s) => {            // bombardiers
      c.beginPath(); c.ellipse(x, y, 12 * s, 2.2 * s, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - 2 * s, y); c.lineTo(x - 7 * s, y - 9 * s); c.lineTo(x - 3 * s, y - 9 * s); c.lineTo(x + 4 * s, y); c.lineTo(x - 3 * s, y + 9 * s); c.lineTo(x - 7 * s, y + 9 * s); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x - 11 * s, y); c.lineTo(x - 14 * s, y - 4 * s); c.lineTo(x - 9 * s, y); c.fill();
    });
  });
})();

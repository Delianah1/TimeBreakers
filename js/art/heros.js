/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE DES SUPER-HÉROS
   Grande ville en plein jour, gratte-ciel, dirigeable publicitaire, QG vitré.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, SKIN, IVORY, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, hairShort, hairWild, arm, fist, swing, thrust, puffs, halo, backdrop, sky, clouds, flock } = K;
  const GOLD = '#f2c230', GOLD_D = '#b8901c', STEEL = '#b9bec8', STEEL_D = '#7c828e', GLASS = '#7fb6e8';

  function star(ctx, x, y, r, color, rot, lw) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); if (lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function bolt(ctx, pts, glow, w) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = glow; ctx.lineWidth = (w || 1.6) * 3.2; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w || 1.6; ctx.stroke();
  }

  /* ------------------------------------------------------------------ unités */
  function cape(color) { return (c, a) => blob(c, color, () => { c.moveTo(-4 * a.k, -33 + a.ty); c.quadraticCurveTo(-15 * a.k - a.sw * 3 - (a.u.moving ? 4 : 0), -24 + a.ty, -13 * a.k - a.sw * 4 - (a.u.moving ? 6 : 0) + Math.sin(a.T * 4 + a.u.x) * 1.2, -7); c.lineTo(-7 * a.k, -11); c.lineTo(-4 * a.k, -6.5); c.lineTo(1, -15); c.lineTo(3 * a.k, -32 + a.ty); }); }
  function mask(c, a, color) { blob(c, color || '#1a1a24', () => { c.moveTo(a.hx - 3.4, a.hy - 2.6); c.lineTo(a.hx + 5.6, a.hy - 2.2); c.lineTo(a.hx + 5.2, a.hy + 0.8); c.lineTo(a.hx - 2.6, a.hy + 0.6); }, 0.8); disc(c, a.hx + 2.9, a.hy - 0.8, 1, '#fff'); }
  function trunks(c, a, color) { blob(c, color, () => { c.moveTo(-5.9 * a.k, -20 + a.ty); c.lineTo(6.5 * a.k, -20.6 + a.ty); c.lineTo(6.2 * a.k, -16 + a.ty); c.lineTo(0.4, -13 + a.ty); c.lineTo(-5.6 * a.k, -15.6 + a.ty); }, 1); }
  // coup de poing : gant qui part, étoile d'impact
  function punch(c, a, glove, big, sleeve) {
    thrust(c, a, (cc, k) => {
      if (k > 0.5) { cc.strokeStyle = `rgba(255,255,255,${k})`; cc.lineWidth = 1.2; cc.beginPath(); for (const dy of [-3.6, 0, 3.6]) { cc.moveTo(-10, dy); cc.lineTo(-18, dy); } cc.stroke(); star(cc, 6 + big * 2, 0, 5 + k * 3, `rgba(255,236,150,${k})`, k * 2); }
      disc(cc, 0, 0, 2.6 * big, glove, 1); line(cc, [0.6 * big, -1.6 * big, 0.6 * big, 1.6 * big], 'rgba(0,0,0,0.25)', 0.8);
    }, { sleeve, glove, x: 4, y: 3, reach: 11 });
  }
  // Justicier : collant d'équipe, cape, loup, étoile sur la poitrine.
  A.units.justicier = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: team, boots: IVORY, sleeve: team, belt: GOLD, back: cape(dark), brow: false,
      over(c, a) { trunks(c, a, GOLD); star(c, 0.6, -26.4 + a.ty, 3.4, GOLD, 0, 0.7); },
      head(c, a) { hairShort(c, a, '#2a1e16'); mask(c, a); },
      arm(c, a) { punch(c, a, IVORY, 1, team); },
    }, R);
  } };
  // Foudroyeur : cheveux d'éclairs, éclair d'or sur le torse, la foudre au bout des doigts.
  A.units.foudroyeur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: dark, boots: GOLD, sleeve: team, belt: GOLD, brow: false,
      over(c, a) { blob(c, GOLD, () => { c.moveTo(2.4, -32 + a.ty); c.lineTo(-2.6, -25 + a.ty); c.lineTo(0.6, -25 + a.ty); c.lineTo(-1.6, -19.6 + a.ty); c.lineTo(4.4, -27 + a.ty); c.lineTo(1.2, -27 + a.ty); c.lineTo(4, -32.2 + a.ty); }, 0.8); },
      head(c, a) { blob(c, '#ffe36a', () => { c.moveTo(a.hx - 5.9, a.hy + 1.6); c.lineTo(a.hx - 9.6, a.hy - 3); c.lineTo(a.hx - 6, a.hy - 3.6); c.lineTo(a.hx - 8.6, a.hy - 9.6); c.lineTo(a.hx - 3.4, a.hy - 7); c.lineTo(a.hx - 2.4, a.hy - 12.6); c.lineTo(a.hx + 1.4, a.hy - 7.4); c.lineTo(a.hx + 4.6, a.hy - 10.6); c.lineTo(a.hx + 4.6, a.hy - 4.6); c.lineTo(a.hx + 1.4, a.hy - 3.2); c.lineTo(a.hx - 3, a.hy - 1.6); c.lineTo(a.hx - 3.8, a.hy + 1.8); }, 1.1); mask(c, a, dark); },
      arm(c, a) {
        const hx = a.sx + 8.5 + atk * 2, hy = a.sy + 1.5, T = a.T, j = (n) => Math.sin(T * 31 + n * 7.3 + u.x) * 2.6;
        arm(c, a, hx, hy, team); fist(c, a, hx, hy, GOLD);
        halo(c, hx + 4, hy - 1, 7 + atk * 7, '170,225,255', 0.55 + atk * 0.4); disc(c, hx + 4, hy - 1, 2 + atk * 1.6, '#ffffff');
        bolt(c, [hx + 4, hy - 1, hx + 8 + j(1), hy - 6 + j(2), hx + 11 + j(3), hy - 2 + j(4)], 'rgba(150,215,255,0.55)', 1);
        if (atk > 0.2) bolt(c, [hx + 4, hy - 1, hx + 10, hy - 4 + j(5), hx + 15, hy + 2 + j(6), hx + 22, hy - 1 + j(7)], 'rgba(150,215,255,0.6)', 1.3);
      },
    }, R);
  } };
  // Colosse : montagne de muscles en maillot d'équipe, poings énormes.
  A.units.colosse = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      k: 1.42, body: SKIN, boots: dark, belt: GOLD,
      over(c, a) { blob(c, team, () => { c.moveTo(-3 * a.k, -32 + a.ty); c.lineTo(-1 * a.k, -26 + a.ty); c.lineTo(2.4 * a.k, -26.4 + a.ty); c.lineTo(4.2 * a.k, -32.4 + a.ty); c.lineTo(6.2 * a.k, -30 + a.ty); c.lineTo(6.4 * a.k, -17 + a.ty); c.lineTo(-5.8 * a.k, -16.5 + a.ty); c.lineTo(-5.6 * a.k, -29.6 + a.ty); }, 1.1); trunks(c, a, team); star(c, 0.6 * a.k, -23 + a.ty, 3.2, GOLD, 0, 0.7);
        line(c, [-1.4 * a.k, -31 + a.ty, 1.6 * a.k, -29.4 + a.ty], 'rgba(120,70,40,0.5)', 1); },
      head(c, a) { line(c, [a.hx - 1, a.hy + 5.4, a.hx + 5.4, a.hy + 5], 'rgba(120,70,40,0.5)', 1.2); mask(c, a, dark); line(c, [a.hx - 4.6, a.hy - 4, a.hx + 3.6, a.hy - 5.4], '#3a2618', 1.6); },
      arm(c, a) { punch(c, a, SKIN, 1.9, SKIN); },
    }, R);
  } };
  // Sismique (élite) : gantelets géants qui s'abattent sur le sol.
  A.units.sismique = { h: 46, top: 54, draw(ctx, u, team, dark, atk, R) {
    if (atk > 0.35) { ctx.strokeStyle = `rgba(255,220,130,${atk})`; ctx.lineWidth = 1.6; for (const k of [1, 1.7]) { ctx.beginPath(); ctx.ellipse(13, -1, (7 + (1 - atk) * 16) * k, (2 + (1 - atk) * 3) * k, 0, 0, TAU); ctx.stroke(); } }
    figure(ctx, u, team, dark, atk, {
      k: 1.12, body: team, legs: dark, boots: '#6a5a4a', sleeve: team, belt: GOLD, brow: false,
      over(c, a) { poly(c, [-4, -31 + a.ty, 4.6, -31.4 + a.ty, 0.4, -24 + a.ty], '#6a5a4a', 0.9); line(c, [-5.4 * a.k, -22.6 + a.ty, 6.2 * a.k, -23 + a.ty], '#6a5a4a', 1.6); },
      head(c, a) { hairWild(c, a, '#7a3a1c'); rect(c, a.hx - 2.4, a.hy - 2.8, 8.6, 3.4, '#3a2c22', 0.8); disc(c, a.hx + 1.6, a.hy - 1.1, 1.5, '#ffb04a'); disc(c, a.hx + 4.8, a.hy - 1.1, 1.3, '#ffb04a'); },
      arm(c, a) { swing(c, a, cc => {
        rect(cc, -5.4, -12, 10.8, 13, '#8a7a6a', 1.3); rect(cc, -5.4, -12, 10.8, 3.4, GOLD, 0.8); line(cc, [-2, -8, -2, 0.4], '#5a4c40', 1); line(cc, [2, -8, 2, 0.4], '#5a4c40', 1);
        halo(cc, 0, -10, 6, '255,200,90', 0.6);
      }, { sleeve: team, rest: [1.2, 5, 6], back: [-0.8, 0, -8], hit: [2.6, 9, 9] }); },
    }, R);
  } };
  // Capitaine Invincible (champion) : cape, grande étoile, couronne.
  A.units.capitaine = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      k: 1.24, body: team, legs: team, boots: GOLD, sleeve: team, belt: GOLD, back: cape(dark), crown: true, brow: false,
      over(c, a) { trunks(c, a, GOLD); disc(c, 0.6 * a.k, -26 + a.ty, 4.6, IVORY, 0.9); star(c, 0.6 * a.k, -26 + a.ty, 3.6, dark, 0); },
      head(c, a) { hairShort(c, a, '#d9a93a'); mask(c, a); line(c, [a.hx - 1, a.hy + 5.6, a.hx + 5.6, a.hy + 5], 'rgba(120,70,40,0.45)', 1.2); },
      arm(c, a) { punch(c, a, GOLD, 1.5, team); },
    }, R);
  } };

  /* -------------------------------------------------- base : quartier général */
  A.bases.herotower = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // antenne
    limb(ctx, [30, G - 196, 30, G - 226], 1.6, STEEL_D); line(ctx, [25, G - 208, 35, G - 208], STEEL_D, 1.2); disc(ctx, 30, G - 227, 2.2, Math.sin(T * 4) > 0 ? '#ff5a5a' : '#7a2a2a', 0.8);
    // tour vitrée
    const gl = ctx.createLinearGradient(0, G - 196, 0, G - 40); gl.addColorStop(0, '#a9d4f4'); gl.addColorStop(1, '#5f9ad0');
    rect(ctx, 2, G - 196, 56, 158, gl, 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = G - 180; y < G - 44; y += 15) { ctx.moveTo(2, y); ctx.lineTo(58, y); } for (const x of [16, 30, 44]) { ctx.moveTo(x, G - 196); ctx.lineTo(x, G - 40); } ctx.stroke();
    poly(ctx, [6, G - 190, 22, G - 190, 6, G - 150], 'rgba(255,255,255,0.3)'); rect(ctx, 48, G - 196, 10, 158, 'rgba(20,40,80,0.2)');
    rect(ctx, -2, G - 201, 64, 6, STEEL, 1.3);
    // emblème
    disc(ctx, 30, G - 160, 17, IVORY, 1.5); disc(ctx, 30, G - 160, 14, team); star(ctx, 30, G - 160, 9.6, IVORY, Math.sin(T * 0.8) * 0.08);
    // écran d'équipe et socle
    rect(ctx, 8, G - 124, 44, 22, '#1a2030', 1.3); rect(ctx, 10, G - 122, 40, 18, team); line(ctx, [14, G - 113, 46, G - 113], IVORY, 2.4); ctx.fillStyle = `rgba(255,255,255,${0.12 + 0.1 * Math.sin(T * 3)})`; ctx.fillRect(10, G - 122, 40, 18);
    rect(ctx, -14, G - 42, 92, 42, '#9aa3b2', 1.6); rect(ctx, -14, G - 42, 92, 6, STEEL); rect(ctx, 66, G - 36, 12, 36, 'rgba(20,30,50,0.2)');
    rect(ctx, 16, G - 30, 28, 30, '#24344e', 1.4); line(ctx, [30, G - 30, 30, G], '#9fc4e8', 1.2); rect(ctx, 12, G - 34, 36, 4.6, team, 1);
    for (const x of [-8, 54]) { rect(ctx, x, G - 26, 12, 14, GLASS, 1.1); line(ctx, [x, G - 19, x + 12, G - 19], IVORY, 1); }
    // balcons d'acier des tourelles
    rect(ctx, 82, G - 140, 22, 140, '#c9ced8', 1.5); rect(ctx, 98, G - 140, 6, 140, 'rgba(20,30,50,0.18)');
    for (let y = G - 128; y < G - 6; y += 14) rect(ctx, 86, y, 10, 7, GLASS, 0.8);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; rect(ctx, 76, y - 1, 34, 4.4, IVORY, 1.2); rect(ctx, 76, y + 2, 34, 1.4, team); }
    poly(ctx, [80, G - 140, 93, G - 150, 106, G - 140], STEEL, 1.3);
    // fanions
    const wv = Math.sin(T * 2.4 + side) * 2;
    for (const [x, y] of [[-10, G - 42], [72, G - 42]]) { limb(ctx, [x, y, x, y - 22], 1.4, STEEL_D); poly(ctx, [x, y - 21, x + 13, y - 18 + wv * 0.5, x, y - 13], team, 1); }
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets['lance-etoiles'] = function (ctx, a, team) {
    rect(ctx, -9, 1, 18, 7, STEEL, 1.2); rect(ctx, -9, 4, 18, 2, team);
    disc(ctx, -2, -4, 9.6, team, 1.3); disc(ctx, -2, -4, 6.4, '#1a2030'); disc(ctx, -2, -4, 2.2, STEEL);
    rect(ctx, 2, -6.4, 15 - a * 3, 4.8, STEEL_D, 1);
    if (a < 0.6) star(ctx, 15, -4, 6.4, GOLD, now() * 6, 0.9);
    else halo(ctx, 16, -4, 9, '255,236,150', a);
  };
  A.turrets['canon-sonique'] = function (ctx, a, team) {
    rect(ctx, -11, -10, 10, 18, '#3a3f4a', 1.2); rect(ctx, -11, -3, 10, 2.4, team); disc(ctx, -6, -6.4, 1.6, '#7ef0c8');
    blob(ctx, STEEL, () => { ctx.moveTo(-1, -6.4); ctx.lineTo(15, -14.5); ctx.lineTo(15, 6.5); ctx.lineTo(-1, -1.6); }, 1.2);
    oval(ctx, 15, -4, 2.6, 10.4, '#2a2e38', 1); oval(ctx, 15, -4, 1.2, 5, STEEL_D);
    ctx.strokeStyle = `rgba(190,215,255,${0.35 + a * 0.6})`; ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { const r = 6 + i * 5 + (1 - a) * 6; ctx.beginPath(); ctx.arc(14, -4, r, -0.8, 0.8); ctx.stroke(); }
  };
  A.turrets['tour-tesla'] = function (ctx, a, team) {
    const T = now();
    rect(ctx, -8, 1, 16, 7, '#5a5048', 1.2); rect(ctx, -8, 4, 16, 2, team);
    rect(ctx, -2, -17, 4, 18, STEEL_D, 0.9);
    for (let i = 0; i < 5; i++) rect(ctx, -5.4, -2 - i * 3.4, 10.8, 2.2, '#c97a3a', 0.7);
    halo(ctx, 0, -21.5, 9 + a * 9, '170,225,255', 0.5 + a * 0.4);
    oval(ctx, 0, -21.5, 7, 3.6, STEEL, 1.1); oval(ctx, 0, -22.4, 4, 1.4, '#e6f4ff');
    const j = n => Math.sin(T * 37 + n * 5.1) * 3;
    bolt(ctx, [5, -22, 10 + j(1), -27 + j(2), 13 + j(3), -21 + j(4)], 'rgba(150,215,255,0.5)', 0.9);
    if (a > 0) bolt(ctx, [-5, -22, -10 + j(5), -28 + j(6), -14 + j(7), -22 + j(8)], 'rgba(150,215,255,0.6)', 1.1);
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.star = function (ctx, p, dir) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,236,150,0.45)'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-22, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
    star(ctx, p.x, p.y, 7.4, GOLD, p.x * 0.12, 0.9); disc(ctx, p.x, p.y, 1.6, '#fff8dc');
  };
  A.projectiles.sonic = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = `rgba(200,222,255,${0.9 - i * 0.2})`; ctx.lineWidth = 2.4 - i * 0.4; ctx.beginPath(); ctx.arc(-i * 6, 0, 5 + i * 3.2, -1, 1); ctx.stroke(); }
  };
  A.projectiles.lightning = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    const j = n => Math.sin(p.x * 0.9 + n * 4.7) * 4.4;
    bolt(ctx, [-30, j(1), -23, j(2), -16, j(3), -9, j(4), 0, 0], 'rgba(150,215,255,0.55)', 1.6);
    halo(ctx, 0, 0, 8, '200,235,255', 0.8);
  };
  // Poings célestes : un poing d'or géant tombe du ciel.
  A.drops.fist = function (ctx, d) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const dx of [-10, -3.4, 3.4, 10]) { ctx.beginPath(); ctx.moveTo(d.x + dx, d.y - 30); ctx.lineTo(d.x + dx, d.y - 56 - Math.abs(dx)); ctx.stroke(); }
    halo(ctx, d.x, d.y - 8, 24, '255,226,110', 0.5);
    ctx.save(); ctx.translate(d.x, d.y - 8);
    rect(ctx, -8, -19, 16, 9, GOLD_D, 1.2);
    blob(ctx, GOLD, () => { ctx.moveTo(-11, -11); ctx.lineTo(11, -11); ctx.quadraticCurveTo(13.5, 2, 9.5, 9); ctx.lineTo(-9.5, 9); ctx.quadraticCurveTo(-13.5, 2, -11, -11); }, 1.4);
    for (const x of [-5.4, 0, 5.4]) line(ctx, [x, 1, x, 9], GOLD_D, 1.3);
    blob(ctx, GOLD, () => { ctx.moveTo(-13.5, -6); ctx.quadraticCurveTo(-17, 0, -12, 4); ctx.lineTo(-9.6, -2); }, 1.1);
    line(ctx, [-7, -8, 5, -8.6], 'rgba(255,255,255,0.6)', 1.6);
    ctx.restore();
  };

  /* -------------------------------------------------------------------- décor */
  function tower(g, x, base, w, hh, col, win, r, lit) {
    g.fillStyle = col; g.fillRect(x, base - hh, w, hh + 80);
    const top = r();
    if (top < 0.3) { g.fillRect(x + w * 0.2, base - hh - 14, w * 0.6, 14); g.fillRect(x + w * 0.46, base - hh - 40, 2.6, 26); }
    else if (top < 0.55) { g.beginPath(); g.moveTo(x, base - hh); g.lineTo(x + w / 2, base - hh - 26); g.lineTo(x + w, base - hh); g.fill(); g.fillRect(x + w / 2 - 1.2, base - hh - 46, 2.4, 22); }
    else if (top < 0.75) { g.fillRect(x + 6, base - hh - 9, 14, 9); g.beginPath(); g.ellipse(x + w - 14, base - hh - 9, 8, 7, 0, 0, TAU); g.fill(); g.fillRect(x + w - 20, base - hh - 5, 2, 6); g.fillRect(x + w - 10, base - hh - 5, 2, 6); }
    g.fillStyle = 'rgba(10,20,40,0.14)'; g.fillRect(x + w * 0.72, base - hh, w * 0.28, hh + 80);
    for (let yy = base - hh + 10; yy < base + 40; yy += 14) for (let xx = x + 6; xx < x + w - 8; xx += 11) { g.fillStyle = r() < lit ? 'rgba(255,240,170,0.8)' : win; g.fillRect(xx, yy, 6, 8); }
  }
  const BLIMP = { x: 200 };
  A.backdrops.heros = backdrop('heros', 1938, (g, r) => {
    sky(g, [[0, '#2f7fdc'], [0.55, '#86c0f2'], [0.9, '#d6ecfb'], [1, '#eef6fb']]);
    halo(g, 1090, 110, 240, '255,252,230', 0.75); disc(g, 1090, 110, 36, '#fffbe6');
    for (let x = -30; x < W + 40;) { const w = 44 + r() * 50, hh = 130 + r() * 190; tower(g, x, 520, w, hh, '#8fb0d8', 'rgba(255,255,255,0.3)', r, 0); x += w + 3 + r() * 10; }
    const gr = g.createLinearGradient(0, 380, 0, 540); gr.addColorStop(0, 'rgba(214,236,251,0)'); gr.addColorStop(1, 'rgba(214,236,251,0.8)');
    g.fillStyle = gr; g.fillRect(-40, 380, W + 80, 240);
  }, (f, r) => {
    for (let x = -40; x < W + 40;) { const w = 52 + r() * 60, hh = 60 + r() * 130; tower(f, x, GROUND - 6, w, hh, '#4f6f9c', 'rgba(170,205,240,0.5)', r, 0.22); x += w + 4 + r() * 12; }
    // panneau d'affichage
    f.fillStyle = '#2a3a54'; f.fillRect(498, GROUND - 190, 4, 60); f.fillRect(556, GROUND - 190, 4, 60);
    f.fillStyle = '#f2c230'; f.fillRect(482, GROUND - 228, 96, 42); f.fillStyle = '#2a3a54'; f.fillRect(486, GROUND - 224, 88, 34);
    star(f, 508, GROUND - 207, 12, '#f2c230', 0); f.fillStyle = '#f6f6f6'; f.fillRect(528, GROUND - 216, 38, 5); f.fillRect(528, GROUND - 205, 28, 5);
    // arbres en bac et lampadaires
    for (let x = 90; x < W; x += 210) { f.fillStyle = '#5a4030'; f.fillRect(x - 2, GROUND - 26, 4, 22); f.fillStyle = '#4f9a58'; f.beginPath(); ell(f, x, GROUND - 36, 14, 13); ell(f, x - 9, GROUND - 28, 9, 8); ell(f, x + 9, GROUND - 28, 9, 8); f.fill(); f.fillStyle = '#74bf78'; f.beginPath(); ell(f, x - 4, GROUND - 41, 7, 4.6); f.fill(); f.fillStyle = '#9aa3b2'; f.fillRect(x - 8, GROUND - 6, 16, 8); }
    for (let x = 190; x < W; x += 210) { f.strokeStyle = '#3a4250'; f.lineWidth = 3; f.beginPath(); f.moveTo(x, GROUND + 2); f.lineTo(x, GROUND - 52); f.quadraticCurveTo(x, GROUND - 60, x + 12, GROUND - 60); f.stroke(); f.fillStyle = '#e6f0fa'; f.fillRect(x + 8, GROUND - 60, 10, 4); }
    // chaussée
    let gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#565a66'); gr.addColorStop(1, '#30323a');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    for (let i = 0; i < 60; i++) { f.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.05})`; f.fillRect(r() * W, GROUND + 12 + r() * 96, 10 + r() * 30, 1.6); }
    f.fillStyle = '#f2c230'; for (let x = -20; x < W + 40; x += 64) f.fillRect(x, GROUND + 56, 36, 4);
    f.fillStyle = 'rgba(255,255,255,0.7)'; f.fillRect(-40, GROUND + 102, W + 80, 3);
    f.fillStyle = 'rgba(255,255,255,0.65)'; for (let k = 0; k < 7; k++) f.fillRect(600 + k * 15, GROUND + 14, 9, 84);
    for (const x of [250, 930]) { f.fillStyle = '#3a3c44'; f.beginPath(); f.ellipse(x, GROUND + 34, 16, 5, 0, 0, TAU); f.fill(); f.strokeStyle = '#6a6e7a'; f.lineWidth = 1.2; f.stroke(); }
    f.fillStyle = '#c4c8d0'; f.fillRect(-40, GROUND, W + 80, 8); f.fillStyle = '#e2e5ea'; f.fillRect(-40, GROUND, W + 80, 2.4);
    f.strokeStyle = 'rgba(60,66,80,0.45)'; f.lineWidth = 1; f.beginPath(); for (let x = -40; x < W + 40; x += 34) { f.moveTo(x, GROUND); f.lineTo(x, GROUND + 8); } f.stroke();
    // bouche d'incendie
    f.fillStyle = '#d6452a'; f.fillRect(404, GROUND - 13, 8, 14); f.fillRect(401, GROUND - 9, 14, 4); f.beginPath(); f.arc(408, GROUND - 13, 4, Math.PI, 0); f.fill();
  }, (ctx, t, dt, R) => {
    clouds(ctx, R, dt, 'rgba(206,226,244,0.85)', 'rgba(255,255,255,0.97)');
    BLIMP.x += 14 * (dt || 0); if (BLIMP.x > W + 120) BLIMP.x = -120;
    const x = BLIMP.x, y = 150 + Math.sin(t * 0.6) * 5;
    ctx.fillStyle = '#d6452a'; ctx.beginPath(); ctx.moveTo(x - 36, y - 4); ctx.lineTo(x - 54, y - 14); ctx.lineTo(x - 50, y); ctx.lineTo(x - 54, y + 13); ctx.lineTo(x - 36, y + 4); ctx.fill();
    ctx.fillStyle = '#f3f5f8'; ctx.beginPath(); ctx.ellipse(x, y, 46, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(40,60,100,0.16)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 44, 10, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#d6452a'; ctx.fillRect(x - 22, y - 4, 44, 8); star(ctx, x, y, 3.6, '#f2c230', 0);
    ctx.fillStyle = '#4a5466'; ctx.fillRect(x - 9, y + 14, 18, 5);
    flock(ctx, t, dt, 'heros', '#3a4660', 5);
  });
})();

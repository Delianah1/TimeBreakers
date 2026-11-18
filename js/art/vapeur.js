/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE DE LA VAPEUR
   Ville d'usines sous la fumée, viaduc et train, laiton et rivets.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, SKIN, IVORY, WOOD, WOOD_D, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, helm, hairShort, arm, fist, swing, aim, muzzle, wheel, puffs, flame, halo, backdrop, sky, hills, clouds, flock, longGun } = K;
  const BRASS = '#c9963f', BRASS_D = '#94692a', BRASS_L = '#e6bf6a', IRON = '#5a5650', IRON_D = '#3a3632', BRICK = '#8f4f3a', BRICK_D = '#6e3a2a';
  const steam = (ctx, x, y, o) => puffs(ctx, x, y, Object.assign({ rgb: '238,238,238', a: 0.55, speed: 0.8, rise: 22, r0: 3, r1: 6, n: 3 }, o));

  /* ------------------------------------------------------------------ unités */
  function goggles(c, x, y) { rect(c, x - 5.6, y - 1, 11.6, 2, '#3a2a22'); disc(c, x + 1.6, y, 2.1, BRASS, 0.8); disc(c, x + 1.6, y, 1.1, '#9fd0d8'); disc(c, x + 5.6, y, 1.8, BRASS, 0.8); disc(c, x + 5.6, y, 0.9, '#9fd0d8'); }
  // Mécano : salopette d'équipe, casquette et lunettes, clé à molette géante.
  A.units.mecano = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: '#e6dccb', legs: team, boots: '#3a2c22', belt: dark, sleeve: '#e6dccb',
      over(c, a) { blob(c, team, () => { c.moveTo(-4.4 * a.k, -27 + a.ty); c.lineTo(5 * a.k, -27.4 + a.ty); c.lineTo(6.4 * a.k, -17 + a.ty); c.lineTo(-5.8 * a.k, -16.5 + a.ty); }, 1);
        line(c, [-3.6, -27 + a.ty, -4, -32 + a.ty], team, 2); line(c, [4, -27.4 + a.ty, 4.4, -32 + a.ty], team, 2); disc(c, -3.6, -26.4 + a.ty, 0.9, BRASS); disc(c, 4, -26.8 + a.ty, 0.9, BRASS);
        disc(c, -2, -21 + a.ty, 1.6, 'rgba(40,30,20,0.35)'); },
      head(c, a) { line(c, [a.hx + 1.4, a.hy + 2, a.hx + 6.4, a.hy + 2.6], '#4a3020', 2);
        blob(c, '#5a4a3c', () => { c.moveTo(a.hx - 6.6, a.hy - 2.4); c.quadraticCurveTo(a.hx - 6, a.hy - 9.6, a.hx + 1, a.hy - 9); c.quadraticCurveTo(a.hx + 6, a.hy - 8.4, a.hx + 6.4, a.hy - 3.4); }, 1.2);
        limb(c, [a.hx + 3, a.hy - 3.4, a.hx + 10, a.hy - 3], 1.4, '#4a3c30'); goggles(c, a.hx - 1, a.hy - 6.4); },
      arm(c, a) { swing(c, a, cc => {
        limb(cc, [0, 3, 0, -15], 2.6, '#8a8f98');
        blob(cc, '#9aa0a8', () => { cc.moveTo(-5.4, -15); cc.quadraticCurveTo(-6.4, -23, -2.4, -24.5); cc.lineTo(-1.6, -19.5); cc.lineTo(1.6, -19.5); cc.lineTo(2.4, -24.5); cc.quadraticCurveTo(6.4, -23, 5.4, -15); }, 1.1);
        rect(cc, -1.8, 0.5, 3.6, 4.6, dk('#c0392b', 0.9), 0.8);
      }, { sleeve: '#e6dccb', glove: '#6a4426' }); },
    }, R);
  } };
  // Fusilier à vapeur : redingote d'équipe, haut-de-forme, fusil à réservoir de laiton.
  A.units['fusilier-vapeur'] = { h: 46, top: 64, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, skirt: team, skirtLen: 10, legs: '#4a4038', boots: '#2a2420', belt: '#3a2a22', sleeve: team,
      over(c, a) { line(c, [1 * a.k, -32.6 + a.ty, 1.6 * a.k, -10 + a.ty], dark, 1.2); for (const y of [-29, -25, -21]) disc(c, 3.4 * a.k, y + a.ty, 0.9, BRASS_L); blob(c, '#f3ead2', () => { c.moveTo(-1.5, -33.4 + a.ty); c.lineTo(4.5, -33.6 + a.ty); c.lineTo(1.6, -29 + a.ty); }, 0.8); },
      head(c, a) { line(c, [a.hx + 1.6, a.hy + 2.2, a.hx + 6.6, a.hy + 1.6], '#3a2618', 1.6); blob(c, '#3a2618', () => { c.moveTo(a.hx - 5.8, a.hy - 1); c.lineTo(a.hx - 4, a.hy + 4.6); c.lineTo(a.hx - 2.2, a.hy - 0.6); }, 0.9);
        rect(c, a.hx - 5, a.hy - 18.4, 10.4, 14, '#26201c', 1.2); rect(c, a.hx - 5, a.hy - 8.4, 10.4, 2.4, team); limb(c, [a.hx - 8.4, a.hy - 4.2, a.hx + 8.6, a.hy - 4.6], 1.6, '#26201c'); goggles(c, a.hx - 0.6, a.hy - 11.4); },
      arm(c, a) { aim(c, a, (cc, k) => {
        longGun(cc, 0, 21, '#6a4426', IRON);
        oval(cc, 12, 3.6, 6.5, 2.9, BRASS, 0.9); line(cc, [7.5, 2.6, 16, 2.6], BRASS_L, 0.9); line(cc, [3, 1.6, 6, 3.4], BRASS_D, 1.3);
        if (k > 0.2) { cc.fillStyle = `rgba(240,240,240,${k * 0.75})`; cc.beginPath(); cc.arc(29 + (1 - k) * 6, -1, 3 + (1 - k) * 5, 0, TAU); cc.arc(26, -4 - (1 - k) * 4, 2.4, 0, TAU); cc.fill(); }
      }, { sleeve: team, y: 3.5, glove: '#3a2a22' }); },
    }, R);
  } };

  // Automate : chaudière sur jambes à pistons. o : metal, crown
  function automaton(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving, ph = u.walk * 0.7, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.5 : -Math.sin(T * 1.8 + u.x * 0.04) * 0.5;
    const M = o.metal, MD = dk(M, 0.72), ML = dk(M, 1.25);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    steam(ctx, -17, -79 + b, { drift: -10, seed: u.x * 0.01 });
    rect(ctx, -20.5, -76 + b, 7, 24, IRON_D, 1.2); rect(ctx, -21.8, -78.5 + b, 9.6, 3.2, '#2a2420', 1);
    limb(ctx, [-9, -56 + b, -13 - st * 3, -44 + b, -11 - st * 5, -34 + b], 5, MD);
    const leg = (dir, col) => {
      const fx = dir * st * 6 + dir * 5, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 3 : 0, kx = fx * 0.6 + dir * 3 + 2, ky = -19 - lift * 0.5;
      limb(ctx, [dir * 5, -33 + b, kx, ky, fx, -5 - lift], 6, col);
      line(ctx, [dir * 5 + 1, -30 + b, kx + 1, ky], '#efe4c6', 1.6); disc(ctx, kx, ky, 2.6, ML, 1);
      blob(ctx, IRON, () => { ctx.moveTo(fx - 6, -lift); ctx.lineTo(fx - 5, -6 - lift); ctx.lineTo(fx + 5, -6 - lift); ctx.lineTo(fx + 8.5, -lift); }, 1.2);
    };
    leg(-1, MD); leg(1, M);
    rect(ctx, -9.5, -37.5 + b, 19, 6.5, MD, 1.2);
    oval(ctx, 0, -51 + b, 17.5, 17, M, 1.6);
    ctx.strokeStyle = ML; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -51 + b, 14, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    blob(ctx, team, () => { ctx.moveTo(-16.6, -56.5 + b); ctx.quadraticCurveTo(0, -62 + b, 16.6, -56.5 + b); ctx.lineTo(17.4, -50.5 + b); ctx.quadraticCurveTo(0, -56 + b, -17.4, -50.5 + b); }, 1);
    for (const [x, y] of [[-11, -63], [0, -66.4], [11, -63], [-14.4, -42.6], [14.4, -42.6]]) disc(ctx, x, y + b, 1.5, MD);
    rect(ctx, -6.5, -47.5 + b, 13, 9, '#24180f', 1.1);
    ctx.fillStyle = `rgba(255,${140 + Math.round(Math.sin(T * 7 + u.x) * 40)},40,0.95)`; ctx.fillRect(-5.5, -44 + b, 11, 5);
    ctx.strokeStyle = '#24180f'; ctx.lineWidth = 1.2; ctx.beginPath(); for (const x of [-2.2, 1.4, 5]) { ctx.moveTo(x - 1, -47 + b); ctx.lineTo(x - 1, -39 + b); } ctx.stroke();
    disc(ctx, 11.4, -45.4 + b, 3, '#f3ead2', 1); line(ctx, [11.4, -45.4 + b, 13 + Math.sin(T * 3) * 0.8, -47.4 + b], '#c0392b', 1);
    blob(ctx, M, () => { ctx.moveTo(-6, -66 + b); ctx.quadraticCurveTo(-6.6, -79 + b, 2, -79 + b); ctx.quadraticCurveTo(10.4, -79 + b, 10, -66 + b); }, 1.4);
    halo(ctx, 5.6, -72 + b, 7, '255,210,100', 0.7); disc(ctx, 5.6, -72 + b, 2.6, '#ffd36a', 1); disc(ctx, 6.2, -72.4 + b, 0.9, '#fff8dc');
    rect(ctx, 2, -68.6 + b, 7.4, 2, '#24180f'); line(ctx, [-4.6, -73 + b, -2.4, -77 + b], ML, 1.2);
    const px = atk * 11;
    limb(ctx, [9, -57 + b, 15 + px * 0.5, -50 + b, 20 + px, -47.5 + b], 5.5, M);
    rect(ctx, 19 + px, -54 + b, 10.5, 13.5, ML, 1.3); line(ctx, [22.5 + px, -54 + b, 22.5 + px, -40.5 + b], MD, 1); line(ctx, [26 + px, -54 + b, 26 + px, -40.5 + b], MD, 1);
    if (atk > 0.3) steam(ctx, 14, -52 + b, { n: 2, speed: 2, rise: 10, r0: 2, r1: 5 });
    if (o.crown) R.crown(ctx, 2, -85 + b);
  }
  K.goggles = goggles;
  A.units.automate = { h: 79, draw(ctx, u, team, dark, atk, R) { automaton(ctx, u, team, dark, atk, { metal: BRASS }, R); } };
  A.units['colosse-fonte'] = { h: 79, draw(ctx, u, team, dark, atk, R) { automaton(ctx, u, team, dark, atk, { metal: '#6a6a70', crown: true }, R); } };

  // Araignée mécanique : huit pattes articulées, mortier sur le dos.
  A.units.araignee = { h: 44, top: 55, draw(ctx, u, team, dark, atk) {
    const T = now(), mv = u.moving, ph = mv ? u.walk * 1.4 : 0;
    const b = mv ? Math.sin(ph * 2) * 0.8 : Math.sin(T * 2 + u.x * 0.05) * 0.4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const legs = (col, off) => {
      for (let k = 0; k < 4; k++) {
        const x0 = -10 + k * 7, dir = k < 2 ? -1 : 1, lift = mv ? Math.max(0, Math.sin(ph + k * 1.6 + off)) * 4 : 0, sx = mv ? Math.cos(ph + k * 1.6 + off) * 3 : 0;
        limb(ctx, [x0, -22 + b, x0 + dir * 11 + sx * 0.5, -36 + b - lift * 0.5, x0 + dir * 20 + sx, -1.5 - lift], 2.4, col);
        disc(ctx, x0 + dir * 11 + sx * 0.5, -36 + b - lift * 0.5, 1.8, BRASS_L, 0.8);
      }
    };
    legs('#6a5234', Math.PI);
    steam(ctx, -13, -36 + b, { n: 2, r0: 2, r1: 4, rise: 14, drift: -8, seed: u.x * 0.01 });
    rect(ctx, -15, -35 + b, 4.4, 9, IRON_D, 1);
    ctx.save(); ctx.translate(-1, -33 + b); ctx.rotate(-0.95);
    rect(ctx, -2 - atk * 3, -4.6, 15, 9.2, IRON, 1.2); rect(ctx, 11 - atk * 3, -5.6, 3.2, 11.2, IRON_D, 1);
    ctx.restore();
    if (atk > 0.3) { ctx.fillStyle = `rgba(238,238,238,${atk * 0.65})`; ctx.beginPath(); ctx.arc(9, -50 + b, 4 + atk * 4, 0, TAU); ctx.fill(); }
    oval(ctx, 0, -24 + b, 18, 10.5, BRASS, 1.5);
    ctx.strokeStyle = BRASS_L; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, -24 + b, 14, Math.PI * 1.15, Math.PI * 1.5); ctx.stroke();
    blob(ctx, team, () => { ctx.moveTo(-17.4, -27 + b); ctx.quadraticCurveTo(0, -31 + b, 17.4, -27 + b); ctx.lineTo(17.9, -23 + b); ctx.quadraticCurveTo(0, -27 + b, -17.9, -23 + b); }, 1);
    for (const x of [-11, -4, 4, 11]) disc(ctx, x, -17 + b + Math.abs(x) * 0.12, 1.2, BRASS_D);
    halo(ctx, 15, -24 + b, 6, '255,90,60', 0.7); disc(ctx, 15, -25.5 + b, 2, '#ff5a3a', 0.8); disc(ctx, 16.6, -21 + b, 1.5, '#ff5a3a', 0.7);
    legs('#8a6a44', 0);
  } };

  /* ------------------------------------------------------------- base : usine */
  A.bases.factory = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    puffs(ctx, 13, G - 172, { n: 5, speed: 0.2, rise: 46, drift: -20, r0: 6, r1: 13, rgb: '90,84,80', a: 0.5 });
    puffs(ctx, 44, G - 150, { n: 4, speed: 0.24, rise: 40, drift: -16, r0: 5, r1: 11, rgb: '90,84,80', a: 0.45, seed: 0.4 });
    // cheminées
    for (const [x, w, top] of [[6, 14, G - 168], [38, 12, G - 146]]) {
      rect(ctx, x, top, w, G - top - 96, BRICK_D, 1.4); rect(ctx, x - 2, top - 4, w + 4, 6, IRON_D, 1.1);
      rect(ctx, x, top + 14, w, 3, '#d6ccb4'); rect(ctx, x + w - 4, top + 2, 4, G - top - 98, 'rgba(30,14,8,0.25)');
    }
    // atelier de brique, toit en dents de scie vitré
    rect(ctx, -14, G - 96, 92, 96, BRICK);
    ctx.strokeStyle = 'rgba(40,16,8,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = G - 88, i = 0; y < G - 2; y += 8, i++) { ctx.moveTo(-14, y); ctx.lineTo(78, y); for (let x = -14 + (i % 2 ? 6 : 14); x < 76; x += 16) { ctx.moveTo(x, y); ctx.lineTo(x, y + 8); } }
    ctx.stroke();
    rect(ctx, 66, G - 96, 12, 96, 'rgba(30,14,8,0.22)');
    for (let i = 0; i < 3; i++) { const x = -14 + i * 30.6; poly(ctx, [x, G - 96, x, G - 118, x + 30.6, G - 96], IRON, 1.3); poly(ctx, [x + 2.4, G - 98.5, x + 2.4, G - 112.5, x + 21, G - 98.5], '#a9d0dc'); line(ctx, [x + 9, G - 98.5, x + 9, G - 107.6], IRON, 1); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(-14, G - 96, 92, 96);
    rect(ctx, -16, G - 99, 96, 4.6, IRON_D, 1.1);
    // verrières éclairées, enseigne d'équipe
    for (const x of [-6, 22]) { const gl = ctx.createLinearGradient(0, G - 84, 0, G - 60); gl.addColorStop(0, '#ffe29a'); gl.addColorStop(1, '#ff9a3c'); blob(ctx, gl, () => { ctx.moveTo(x, G - 60); ctx.lineTo(x, G - 78); ctx.quadraticCurveTo(x + 9, G - 88, x + 18, G - 78); ctx.lineTo(x + 18, G - 60); }, 1.3); line(ctx, [x + 9, G - 83, x + 9, G - 60], INK, 1.1); line(ctx, [x, G - 70, x + 18, G - 70], INK, 1.1); }
    rect(ctx, 46, G - 86, 26, 12, team, 1.3); line(ctx, [50, G - 80, 68, G - 80], IVORY, 2);
    // porte de fer, grande roue dentée, tuyaux
    rect(ctx, 16, G - 44, 30, 44, IRON_D, 1.6); ctx.strokeStyle = IRON; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = 21; x < 46; x += 6) { ctx.moveTo(x, G - 42); ctx.lineTo(x, G - 1); } ctx.stroke();
    rect(ctx, 16, G - 30, 30, 2.6, IRON); disc(ctx, 31, G - 18, 2.4, BRASS, 0.8);
    ctx.save(); ctx.translate(62, G - 34); ctx.rotate(T * 0.7);
    ctx.fillStyle = BRASS_D; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-3, -17, 6, 7); }
    disc(ctx, 0, 0, 12.5, BRASS, 1.3); disc(ctx, 0, 0, 8, BRASS_D); for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.fillStyle = BRASS; ctx.fillRect(-1.4, -8, 2.8, 16); }
    disc(ctx, 0, 0, 3, IRON_D, 0.9);
    ctx.restore();
    limb(ctx, [-8, G - 52, -8, G - 20, 8, G - 20, 8, G - 6], 2.6, BRASS); disc(ctx, -8, G - 36, 2.8, '#c0392b', 0.9);
    steam(ctx, 8, G - 6, { n: 2, speed: 0.6, rise: 14, drift: 8, r0: 2, r1: 5 });
    // charpente de fer rivetée pour les tourelles
    limb(ctx, [81, G, 82, G - 138], 2.6, IRON); limb(ctx, [106, G, 105, G - 138], 2.6, IRON_D);
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30;
      if (s < 3) line(ctx, [82, y - 2, 105, y - 28], IRON_D, 1.6);
      rect(ctx, 76, y - 1, 34, 4.4, IRON, 1.2); for (const x of [79, 86, 93, 100, 107]) disc(ctx, x, y + 1.2, 0.9, BRASS_L);
    }
    // drapeau sur la grande cheminée
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [13, G - 172, 13, G - 200], 1.6, IRON_D);
    blob(ctx, team, () => { ctx.moveTo(13, G - 199); ctx.quadraticCurveTo(26, G - 201 + wv, 38, G - 197 + wv); ctx.lineTo(38, G - 185 + wv * 0.5); ctx.quadraticCurveTo(26, G - 183 + wv * 0.5, 13, G - 186); });
    ctx.save(); ctx.translate(25, G - 192 + wv * 0.4); ctx.fillStyle = IVORY; for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-1, -5, 2, 3); } ctx.restore(); disc(ctx, 25, G - 192 + wv * 0.4, 3, IVORY); disc(ctx, 25, G - 192 + wv * 0.4, 1.3, team);
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets.manivelle = function (ctx, a, team) {
    const spin = a > 0 ? performance.now() / 35 : 0;
    limb(ctx, [-9, 8, -2, -3], 2.2, IRON_D); limb(ctx, [7, 8, -2, -3], 2.2, IRON_D);
    rect(ctx, -12, -11, 14, 9.5, BRASS, 1.2); rect(ctx, -12, -7.6, 14, 2.4, team);
    for (let i = 0; i < 4; i++) { const o = Math.sin(spin + i * 1.6) * 2.8; rect(ctx, 1, -7.4 + o, 19, 1.8, IRON, 0.6); }
    rect(ctx, 17.5, -11, 3, 9.5, IRON_D, 0.9); rect(ctx, 4, -11, 2.4, 9.5, IRON_D, 0.9);
    limb(ctx, [-12, -6, -16 + Math.cos(spin) * 3, -6 + Math.sin(spin) * 3], 1.4, IRON); disc(ctx, -16 + Math.cos(spin) * 3, -6 + Math.sin(spin) * 3, 1.5, WOOD, 0.7);
    rect(ctx, -8, -17, 7, 6, IRON_D, 1);
    muzzle(ctx, 23.5, -6.4, a);
  };
  A.turrets['canon-vapeur'] = function (ctx, a, team) {
    rect(ctx, -13, -2, 17, 9.5, IRON, 1.2); rect(ctx, -13, 2, 17, 2.2, team);
    disc(ctx, -8, -6.5, 6.4, BRASS, 1.2); disc(ctx, -8, -6.5, 2.8, '#f3ead2', 0.8); line(ctx, [-8, -6.5, -6.2 + a * 1.5, -8.4], '#c0392b', 1);
    if (a > 0) steam(ctx, -8, -14, { n: 2, speed: 2.4, rise: 16, r0: 3, r1: 6 });
    ctx.save(); ctx.translate(-a * 4, 0); ctx.rotate(-0.12);
    blob(ctx, BRASS, () => { ctx.moveTo(-3, -10); ctx.lineTo(23, -9); ctx.lineTo(23, -3); ctx.lineTo(-3, -2); });
    rect(ctx, 21, -10.6, 3.6, 9, BRASS_D, 0.9); rect(ctx, 6, -10.4, 2.4, 8.6, BRASS_D); line(ctx, [-1, -8.6, 19, -7.8], BRASS_L, 1.1);
    ctx.restore();
    muzzle(ctx, 27 - a * 4, -9.4, a, '#f6f6f6');
  };
  A.turrets['mortier-chaudieres'] = function (ctx, a, team) {
    oval(ctx, 0, 2, 12, 6.4, BRICK_D, 1.2); rect(ctx, -12, 0.6, 24, 2.4, team);
    flame(ctx, -8, 8, 6, 5, 2);
    ctx.save(); ctx.translate(-1, -3); ctx.rotate(-1.0);
    rect(ctx, -2, -6.5, 17 - a * 3, 13, IRON, 1.2); rect(ctx, 13 - a * 3, -7.6, 3.4, 15.2, BRASS, 1); rect(ctx, 3, -6.5, 2.2, 13, BRASS_D);
    ctx.restore();
    steam(ctx, -10, -9, { n: 2, speed: 0.7 + a * 2, rise: 14, r0: 2.4, r1: 5 });
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.rivet = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,150,70,0.5)'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-15, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    rect(ctx, -4, -1.2, 6, 2.4, '#ffb060', 0.7); rect(ctx, 1.4, -2.6, 2.6, 5.2, '#ffd9a0', 0.7);
  };
  function bomb(ctx, r) { disc(ctx, 0, 0, r, IRON_D, 1); rect(ctx, -r, -1.2, r * 2, 2.4, BRASS); disc(ctx, -r * 0.32, -r * 0.36, r * 0.26, 'rgba(255,255,255,0.4)'); }
  A.projectiles.steambomb = function (ctx, p) {
    ctx.fillStyle = 'rgba(240,240,240,0.5)'; ctx.beginPath(); ctx.arc(p.x - 5, p.y - 8, 3.6, 0, TAU); ctx.arc(p.x - 9, p.y - 12, 2.4, 0, TAU); ctx.fill();
    ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.04); bomb(ctx, 6);
  };
  A.projectiles.boiler = function (ctx, p) {
    ctx.fillStyle = 'rgba(240,240,240,0.5)'; ctx.beginPath(); ctx.arc(p.x - 6, p.y - 10, 4.6, 0, TAU); ctx.arc(p.x - 11, p.y - 15, 3, 0, TAU); ctx.fill();
    ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.03);
    rect(ctx, -7.5, -5.5, 15, 11, BRASS, 1); rect(ctx, -7.5, -5.5, 2.4, 11, BRASS_D); rect(ctx, 5.1, -5.5, 2.4, 11, BRASS_D);
    rect(ctx, -2.4, -2.4, 4.8, 4.8, '#ff8a3c', 0.7);
  };
  A.drops.steambomb = function (ctx, d) {
    ctx.fillStyle = 'rgba(235,235,235,0.3)'; ctx.beginPath(); ctx.moveTo(d.x - 5, d.y - 12); ctx.lineTo(d.x - 1.5, d.y - 46); ctx.lineTo(d.x + 1.5, d.y - 46); ctx.lineTo(d.x + 5, d.y - 12); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(d.x, d.y - 5);
    blob(ctx, IRON_D, () => { ctx.moveTo(0, 8); ctx.quadraticCurveTo(-7, 2, -5, -7); ctx.lineTo(5, -7); ctx.quadraticCurveTo(7, 2, 0, 8); }, 1);
    rect(ctx, -5.6, -3.4, 11.2, 2.4, BRASS); poly(ctx, [-5, -7, -7, -13, 0, -9.5, 7, -13, 5, -7], BRASS_D, 0.9);
    ctx.restore();
  };
  // Raid de dirigeable : enveloppe à nervures, nacelle de laiton, hélice.
  A.fx.airship = function (ctx, s, team, dark) {
    const x = s.x0 + (s.x1 - s.x0) * s.t / s.dur, y = 88 + Math.sin(s.t * 2) * 2;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, s.t / 0.3, (s.dur + 1.6 - s.t) / 0.4)); ctx.translate(x, y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    puffs(ctx, -30, 30, { n: 3, speed: 1.5, rise: 8, drift: -44, r0: 3, r1: 8, rgb: '110,100,95', a: 0.45 });
    poly(ctx, [-58, -6, -86, -26, -78, -2], team, 1.2); poly(ctx, [-58, 6, -86, 24, -78, 2], dark, 1.2);
    oval(ctx, 0, 0, 72, 21, '#c9b89a', 1.6);
    ctx.fillStyle = 'rgba(90,70,40,0.2)'; ctx.beginPath(); ctx.ellipse(0, 6, 70, 15, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#9a8a70'; ctx.lineWidth = 1.5;
    for (const dx of [-46, -22, 2, 26, 48]) { const hh = 21 * Math.sqrt(1 - (dx / 72) * (dx / 72)); ctx.beginPath(); ctx.moveTo(dx, -hh); ctx.quadraticCurveTo(dx + 6, 0, dx, hh); ctx.stroke(); }
    blob(ctx, team, () => { ctx.moveTo(-34, -4.5); ctx.lineTo(34, -4.5); ctx.lineTo(36, 4.5); ctx.lineTo(-36, 4.5); }, 1); line(ctx, [-30, 0, 30, 0], IVORY, 1.6);
    line(ctx, [-16, 19, -12, 27], IRON_D, 1.2); line(ctx, [16, 19, 12, 27], IRON_D, 1.2); line(ctx, [0, 21, 0, 27], IRON_D, 1.2);
    blob(ctx, BRASS, () => { ctx.moveTo(-19, 27); ctx.lineTo(19, 27); ctx.lineTo(15, 37); ctx.lineTo(-15, 37); }, 1.3);
    for (const wx of [-11, -3, 5]) rect(ctx, wx, 29.5, 5, 3.6, '#ffe29a', 0.7);
    rect(ctx, -4, 37, 8, 3.4, IRON_D, 0.9);
    const r = Math.abs(Math.cos(s.t * 40)) * 9 + 2; oval(ctx, -22, 32, 1.8, r, 'rgba(60,50,40,0.75)'); disc(ctx, -21, 32, 1.6, IRON_D);
    ctx.restore();
  };

  /* -------------------------------------------------------------------- décor */
  function works(g, x, base, w, hh, col, r) {     // silhouette d'usine : halle, sheds, cheminées
    g.fillStyle = col; g.fillRect(x, base - hh, w, hh + 60);
    for (let k = 0; k < Math.floor(w / 22); k++) { g.beginPath(); g.moveTo(x + k * 22, base - hh); g.lineTo(x + k * 22, base - hh - 12); g.lineTo(x + k * 22 + 22, base - hh); g.fill(); }
    for (let k = 0; k < 2; k++) { const cx = x + 8 + r() * (w - 24), ch = hh + 30 + r() * 60; g.fillRect(cx, base - ch, 8, ch); g.fillRect(cx - 1.5, base - ch - 3, 11, 4); }
  }
  const TRAIN = { x: 0 };
  A.backdrops.vapeur = backdrop('vapeur', 1851, (g, r) => {
    sky(g, [[0, '#7a6e72'], [0.4, '#b79a84'], [0.75, '#e6c79a'], [1, '#f0dbb4']]);
    halo(g, 330, 210, 260, '255,236,200', 0.6); disc(g, 330, 210, 40, 'rgba(255,244,220,0.85)');
    for (const [x, w, hh] of [[20, 120, 60], [190, 90, 84], [420, 150, 56], [640, 110, 92], [820, 140, 64], [1020, 100, 88], [1160, 140, 58]]) works(g, x, 474, w, hh, '#a08a7c', r);
    // viaduc
    g.fillStyle = '#8a7466'; g.fillRect(-40, 432, W + 80, 9);
    for (let x = -30; x < W + 40; x += 62) { g.fillRect(x, 441, 13, 70); g.beginPath(); g.moveTo(x + 13, 441); g.quadraticCurveTo(x + 37.5, 441 + 30, x + 62, 441); g.lineTo(x + 62, 448); g.quadraticCurveTo(x + 37.5, 448 + 16, x + 13, 448); g.fill(); }
    const gr = g.createLinearGradient(0, 380, 0, 520); gr.addColorStop(0, 'rgba(236,214,180,0)'); gr.addColorStop(1, 'rgba(236,214,180,0.8)');
    g.fillStyle = gr; g.fillRect(-40, 380, W + 80, 220);
  }, (f, r) => {
    for (const [x, w, hh] of [[-20, 150, 70], [170, 110, 96], [330, 170, 62], [560, 120, 104], [740, 180, 66], [960, 130, 98], [1130, 170, 70]]) works(f, x, 560, w, hh, '#6e5a4e', r);
    // fenêtres allumées
    f.fillStyle = 'rgba(255,206,120,0.75)';
    for (let i = 0; i < 90; i++) { const x = r() * W, y = 474 + r() * 70; f.fillRect(x, y, 5, 7); }
    // rangée de maisons ouvrières et réverbères
    for (let x = -30; x < W + 40; x += 46) { const hh = 26 + r() * 12; f.fillStyle = '#4e4038'; f.fillRect(x, GROUND - hh - 8, 44, hh + 12); f.beginPath(); f.moveTo(x - 2, GROUND - hh - 8); f.lineTo(x + 22, GROUND - hh - 22); f.lineTo(x + 46, GROUND - hh - 8); f.fill(); f.fillRect(x + 30, GROUND - hh - 30, 6, 16);
      f.fillStyle = 'rgba(255,206,120,0.85)'; f.fillRect(x + 8, GROUND - hh, 7, 9); if (r() < 0.6) f.fillRect(x + 26, GROUND - hh, 7, 9); }
    for (let x = 60; x < W; x += 170) { f.strokeStyle = '#2a2420'; f.lineWidth = 3; f.beginPath(); f.moveTo(x, GROUND + 2); f.lineTo(x, GROUND - 44); f.stroke(); f.fillStyle = '#2a2420'; f.fillRect(x - 5, GROUND - 54, 10, 10);
      const gl = f.createRadialGradient(x, GROUND - 49, 0, x, GROUND - 49, 24); gl.addColorStop(0, 'rgba(255,220,140,0.9)'); gl.addColorStop(1, 'rgba(255,220,140,0)'); f.fillStyle = gl; f.beginPath(); f.arc(x, GROUND - 49, 24, 0, TAU); f.fill(); f.fillStyle = '#ffe9b0'; f.fillRect(x - 3, GROUND - 52, 6, 6); }
    // pavés
    let gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#6a5a4e'); gr.addColorStop(1, '#3e342c');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    for (let row = 0; row < 9; row++) { const y = GROUND + 10 + row * 12.5, hh = 10.5; for (let x = -40 + (row % 2) * 13; x < W + 40; x += 26) { f.fillStyle = `rgba(${150 + Math.round(r() * 40)},${132 + Math.round(r() * 30)},${116 + Math.round(r() * 24)},${0.22 + r() * 0.2})`; f.beginPath(); f.ellipse(x + 12, y + hh / 2, 11.5, hh / 2, 0, 0, TAU); f.fill(); } }
    f.fillStyle = '#8a7a6c'; f.fillRect(-40, GROUND, W + 80, 7); f.fillStyle = '#a89888'; f.fillRect(-40, GROUND, W + 80, 2);
    f.strokeStyle = 'rgba(40,30,24,0.5)'; f.lineWidth = 1; f.beginPath(); for (let x = -40; x < W + 40; x += 30) { f.moveTo(x, GROUND); f.lineTo(x, GROUND + 7); } f.stroke();
    for (let i = 0; i < 12; i++) { const x = r() * W, y = GROUND + 30 + r() * 70; f.fillStyle = 'rgba(160,190,200,0.18)'; f.beginPath(); f.ellipse(x, y, 16 + r() * 16, 3 + r() * 2, 0, 0, TAU); f.fill(); }
  }, (ctx, t, dt, R) => {
    // train sur le viaduc
    TRAIN.x += 34 * (dt || 0); if (TRAIN.x > W + 260) TRAIN.x = -260;
    const x = TRAIN.x, y = 432;
    ctx.fillStyle = '#4a3e38';
    for (let k = 1; k <= 4; k++) ctx.fillRect(x - k * 38, y - 15, 34, 13);
    ctx.fillRect(x, y - 14, 34, 12); ctx.fillRect(x + 2, y - 22, 12, 9); ctx.fillRect(x + 24, y - 21, 5, 8); ctx.beginPath(); ctx.moveTo(x + 34, y - 8); ctx.lineTo(x + 41, y - 2); ctx.lineTo(x + 34, y - 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,206,120,0.8)'; for (let k = 1; k <= 4; k++) for (const dx of [5, 14, 23]) ctx.fillRect(x - k * 38 + dx, y - 12, 5, 4);
    puffs(ctx, x + 26, y - 24, { n: 5, speed: 0.5, rise: 26, drift: -70, r0: 4, r1: 10, rgb: '225,220,214', a: 0.6 });
    clouds(ctx, R, dt, 'rgba(120,108,104,0.5)', 'rgba(176,160,150,0.55)');
    flock(ctx, t, dt, 'vapeur', '#3a3230', 4);
  });
})();

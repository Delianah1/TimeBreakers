/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE FUTUR
   Mégapole de nuit, néons, planète aux anneaux, base sous bouclier.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, SKIN, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, arm, fist, swing, aim, puffs, halo, backdrop, sky, starfield } = K;
  const WHITE = '#e6eaf1', WHITE_D = '#aab2c2', DARK = '#3a3f4a', CYAN = '#4fd8ff', CYAN_L = '#c8f4ff', PLASMA = '#7ef0c8', ION = '#9c8cff';

  /* ------------------------------------------------------------------ unités */
  function visorHelm(c, a, team, fin) {
    const { hx, hy } = a;
    if (fin) blob(c, team, () => { c.moveTo(hx - 3, hy - 5.6); c.lineTo(hx - 8.6, hy - 11.6); c.lineTo(hx + 1.6, hy - 6.4); }, 1);
    disc(c, hx, hy, 6.3, WHITE, 1.4);
    blob(c, '#1c2434', () => { c.moveTo(hx - 0.6, hy - 3.4); c.lineTo(hx + 6, hy - 3); c.quadraticCurveTo(hx + 6.8, hy - 0.4, hx + 5.6, hy + 1.6); c.lineTo(hx - 0.6, hy + 1); }, 0.9);
    line(c, [hx + 0.6, hy - 1.4, hx + 5.4, hy - 1], CYAN, 1.6); line(c, [hx - 4.6, hy - 3, hx - 2.4, hy - 5.2], '#ffffff', 1.1);
    rect(c, hx - 6.6, hy + 0.6, 2.6, 3.4, WHITE_D, 0.8);
  }
  function plating(c, a, team) {
    blob(c, WHITE, () => { c.moveTo(-3.6 * a.k, -32 + a.ty); c.lineTo(5 * a.k, -32.4 + a.ty); c.lineTo(6.2 * a.k, -24 + a.ty); c.lineTo(1, -21.4 + a.ty); c.lineTo(-4.6 * a.k, -24 + a.ty); }, 1);
    halo(c, 1, -27 + a.ty, 4.6, '79,216,255', 0.7); disc(c, 1, -27 + a.ty, 1.6, CYAN_L);
    blob(c, WHITE, () => { c.moveTo(0.6, -31 + a.ty); c.quadraticCurveTo(5.6, -36 + a.ty, 9.6, -31 + a.ty); c.lineTo(8, -27.6 + a.ty); c.lineTo(2, -27.6 + a.ty); }, 1);
  }
  // Gardien : armure blanche sur combinaison d'équipe, lame d'énergie.
  A.units.gardien = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: WHITE, boots: DARK, belt: DARK, sleeve: team, face: false, headColor: WHITE,
      over(c, a) { plating(c, a, team); },
      head(c, a) { visorHelm(c, a, team, true); },
      arm(c, a) { swing(c, a, cc => {
        rect(cc, -1.6, -3, 3.2, 7, DARK, 0.8);
        cc.lineCap = 'round'; cc.strokeStyle = 'rgba(79,216,255,0.3)'; cc.lineWidth = 8; cc.beginPath(); cc.moveTo(0, -4); cc.lineTo(0, -24); cc.stroke();
        cc.strokeStyle = CYAN; cc.lineWidth = 3.6; cc.stroke(); cc.strokeStyle = '#ffffff'; cc.lineWidth = 1.4; cc.stroke();
      }, { sleeve: team, glove: WHITE }); },
    }, R);
  } };
  // Fusilier laser : sac à cellules, fusil à impulsions.
  A.units['fusilier-laser'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: DARK, boots: WHITE_D, belt: WHITE, sleeve: team, face: false, headColor: WHITE,
      back(c, a) { rect(c, -11.6, -33 + a.ty, 7, 13, WHITE, 1.1); rect(c, -10.2, -30.6 + a.ty, 4, 2, CYAN); rect(c, -10.2, -26.6 + a.ty, 4, 2, CYAN); },
      over(c, a) { line(c, [-5.2 * a.k, -30.6 + a.ty, 6 * a.k, -21 + a.ty], WHITE, 2); line(c, [-4.6, -32 + a.ty, 5, -32.4 + a.ty], WHITE, 1.8); },
      head(c, a) { visorHelm(c, a, team, false); line(c, [a.hx - 5, a.hy - 4.4, a.hx + 1, a.hy - 6.2], team, 1.8); },
      arm(c, a) { aim(c, a, (cc, k) => {
        rect(cc, -7, -2.6, 27, 5.4, WHITE, 1.1); rect(cc, -9, 1, 6, 4.6, DARK, 0.9); rect(cc, 17, -1.6, 7, 3.4, DARK, 0.9);
        rect(cc, 2, -1.2, 11, 2.4, k > 0.2 ? '#ffffff' : CYAN); rect(cc, -2, -4.6, 7, 2.2, DARK, 0.7);
        halo(cc, 25, 0, 4 + k * 9, '79,216,255', 0.4 + k * 0.6); if (k > 0.3) disc(cc, 25, 0, 2 + k * 2, '#ffffff');
      }, { sleeve: team, y: 4, kick: 1.5, glove: WHITE }); },
    }, R);
  } };

  // Marcheur de combat : nacelle sur pattes inversées, canon au poing. o : hull, trim, crown
  function mech(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving, ph = u.walk * 0.8, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.6 : -Math.sin(T * 1.8 + u.x * 0.04) * 0.6;
    const M = o.hull, MD = dk(M, 0.72), ML = dk(M, 1.12);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (dir, col) => {
      const fx = dir * st * 7 + dir * 6, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 3.4 : 0;
      limb(ctx, [dir * 6, -40 + b, fx - 8, -25 + b - lift * 0.4, fx + 1, -8 - lift], 6, col);
      disc(ctx, fx - 8, -25 + b - lift * 0.4, 3.2, o.trim || CYAN, 1); disc(ctx, dir * 6, -40 + b, 3.4, MD, 1);
      blob(ctx, DARK, () => { ctx.moveTo(fx - 7, -lift); ctx.lineTo(fx - 5, -7 - lift); ctx.lineTo(fx + 6, -7 - lift); ctx.lineTo(fx + 11, -lift); }, 1.2);
    };
    leg(-1, MD);
    // tuyères arrière
    halo(ctx, -21, -52 + b, 8, '79,216,255', 0.6); rect(ctx, -23, -58 + b, 6, 12, DARK, 1.1);
    limb(ctx, [-10, -62 + b, -15 - st * 2, -52 + b, -13 - st * 3, -44 + b], 5, MD);
    leg(1, M);
    // nacelle
    blob(ctx, M, () => { ctx.moveTo(-18, -44 + b); ctx.quadraticCurveTo(-21, -70 + b, -4, -73 + b); ctx.quadraticCurveTo(14, -74 + b, 19, -60 + b); ctx.quadraticCurveTo(21, -48 + b, 14, -42 + b); ctx.lineTo(-12, -40 + b); }, 1.6);
    poly(ctx, [-12, -40 + b, 14, -42 + b, 18, -47 + b, -17, -45.6 + b], MD);
    blob(ctx, team, () => { ctx.moveTo(-18.6, -56 + b); ctx.lineTo(4, -57.4 + b); ctx.lineTo(4, -51 + b); ctx.lineTo(-18, -49.6 + b); }, 1);
    line(ctx, [-16, -64 + b, -9, -70 + b], ML, 1.6);
    // verrière et pilote
    blob(ctx, '#16304a', () => { ctx.moveTo(3, -70.6 + b); ctx.quadraticCurveTo(14, -72 + b, 17.6, -60.6 + b); ctx.lineTo(6, -59 + b); ctx.quadraticCurveTo(2.6, -64 + b, 3, -70.6 + b); }, 1.2);
    disc(ctx, 9.6, -64.6 + b, 2.6, '#0c1a2a'); line(ctx, [5.6, -68.6 + b, 9.6, -69.6 + b], 'rgba(200,244,255,0.8)', 1.2); line(ctx, [6, -60 + b, 17, -61.4 + b], CYAN, 1.2);
    line(ctx, [-6, -73 + b, -8, -83 + b], DARK, 1.1); disc(ctx, -8, -83.6 + b, 1.4, Math.sin(T * 5) > 0 ? '#ff5a5a' : CYAN);
    // bras-canon
    const px = atk * 10;
    limb(ctx, [10, -56 + b, 15 + px * 0.4, -50 + b], 5.5, MD);
    rect(ctx, 12 + px, -55 + b, 21, 10, M, 1.3); rect(ctx, 31 + px, -56.4 + b, 4.6, 12.8, DARK, 1); rect(ctx, 16 + px, -51.6 + b, 11, 3, o.trim || CYAN);
    halo(ctx, 36 + px, -50 + b, 5 + atk * 9, '79,216,255', 0.4 + atk * 0.6);
    if (o.trim) { line(ctx, [-18, -44 + b, 14, -42 + b], o.trim, 1.6); line(ctx, [-18.6, -58 + b, 4, -59.4 + b], o.trim, 1.2); }
    if (o.crown) R.crown(ctx, 0, -79 + b);
  }
  A.units.marcheur = { h: 78, draw(ctx, u, team, dark, atk, R) { mech(ctx, u, team, dark, atk, { hull: WHITE }, R); } };
  A.units.titan = { h: 78, draw(ctx, u, team, dark, atk, R) { mech(ctx, u, team, dark, atk, { hull: '#566078', trim: '#f2c230', crown: true }, R); } };

  // Drone d'assaut (élite) : flotte au-dessus du sol, deux rotors, lance-plasma sous le ventre.
  A.units.drone = { h: 50, top: 56, draw(ctx, u, team, dark, atk) {
    const T = now(), bob = Math.sin(T * 3 + u.x * 0.05) * 3;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const g = ctx.createLinearGradient(0, -26 + bob, 0, 0); g.addColorStop(0, 'rgba(79,216,255,0.32)'); g.addColorStop(1, 'rgba(79,216,255,0)');
    poly(ctx, [-7, -26 + bob, 7, -26 + bob, 14, 0, -14, 0], g);
    ctx.save(); ctx.translate(0, bob);
    for (const d of [-1, 1]) { limb(ctx, [d * 11, -38, d * 19, -44], 2, WHITE_D); oval(ctx, d * 19, -45.4, Math.abs(Math.cos(T * 30 + d)) * 9 + 3, 1.8, 'rgba(210,225,245,0.7)'); disc(ctx, d * 19, -44.6, 1.5, DARK); }
    oval(ctx, 0, -34, 17, 8.6, WHITE, 1.5);
    blob(ctx, team, () => { ctx.moveTo(-16.4, -36.6); ctx.quadraticCurveTo(0, -41, 16.4, -36.6); ctx.lineTo(16.9, -33); ctx.quadraticCurveTo(0, -37.4, -16.9, -33); }, 1);
    halo(ctx, 11, -32.6, 6, '79,216,255', 0.7); disc(ctx, 11, -32.6, 3, CYAN, 0.9); disc(ctx, 11.8, -33.2, 1, '#ffffff');
    rect(ctx, -3 - atk * 2, -27.6, 13, 4.4, DARK, 1); halo(ctx, 11 - atk * 2, -25.4, 3 + atk * 6, '126,240,200', 0.5 + atk * 0.5); disc(ctx, 10.6 - atk * 2, -25.4, 1.8, PLASMA);
    ctx.restore();
  } };

  /* ---------------------------------------------------- base : tour sous bouclier */
  A.bases.dome = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // flèche centrale et balise
    halo(ctx, 34, G - 192, 16, '79,216,255', 0.5 + Math.sin(T * 3) * 0.2);
    poly(ctx, [26, G - 150, 34, G - 192, 42, G - 150], WHITE, 1.4); disc(ctx, 34, G - 193, 2.6, CYAN_L, 0.8);
    rect(ctx, 18, G - 150, 32, 92, WHITE, 1.5); rect(ctx, 42, G - 150, 8, 92, 'rgba(40,60,110,0.18)');
    for (let i = 0; i < 4; i++) { rect(ctx, 23, G - 142 + i * 21, 22, 9, '#16304a', 0.9); line(ctx, [24.4, G - 137.4 + i * 21, 43.6, G - 137.4 + i * 21], i % 2 ? CYAN : team, 2.4); }
    // anneaux qui flottent autour de la flèche
    for (const [yy, rx, ph] of [[G - 164, 22, 0], [G - 176, 15, 1.6]]) { const y = yy + Math.sin(T * 1.6 + ph) * 2.4; ctx.beginPath(); ctx.ellipse(34, y, rx, 4, 0, 0, TAU); ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.stroke(); ctx.strokeStyle = CYAN_L; ctx.lineWidth = 1.8; ctx.stroke(); }
    // socle lumineux, porte, emblème holographique d'équipe
    rect(ctx, -14, G - 60, 92, 60, DARK, 1.6); rect(ctx, -14, G - 60, 92, 5, '#566078'); rect(ctx, -14, G - 55.6, 92, 2.4, CYAN);
    rect(ctx, 66, G - 53, 12, 53, 'rgba(0,0,0,0.25)');
    for (const x of [-6, 56]) { rect(ctx, x, G - 44, 14, 9, '#16304a', 0.9); line(ctx, [x + 1.4, G - 39.6, x + 12.6, G - 39.6], CYAN, 1.8); }
    const dg = ctx.createLinearGradient(0, G - 40, 0, G); dg.addColorStop(0, '#c8f4ff'); dg.addColorStop(1, '#2f7fb4');
    blob(ctx, dg, () => { ctx.moveTo(22, G); ctx.lineTo(22, G - 30); ctx.quadraticCurveTo(34, G - 44, 46, G - 30); ctx.lineTo(46, G); }, 1.5); line(ctx, [34, G - 37, 34, G], 'rgba(22,48,74,0.6)', 1.2);
    ctx.globalAlpha = 0.7 + Math.sin(T * 4) * 0.15; disc(ctx, 34, G - 74 + Math.sin(T * 2) * 1.5, 8.6, team); ctx.globalAlpha = 1;
    poly(ctx, [34, G - 80 + Math.sin(T * 2) * 1.5, 39, G - 71 + Math.sin(T * 2) * 1.5, 29, G - 71 + Math.sin(T * 2) * 1.5], '#ffffff');
    // bouclier : dôme translucide et reflets
    const sg = ctx.createRadialGradient(34, G - 60, 30, 34, G - 60, 150); sg.addColorStop(0, 'rgba(79,216,255,0)'); sg.addColorStop(1, 'rgba(79,216,255,0.2)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(34, G, 62, 178, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = `rgba(160,236,255,${0.5 + Math.sin(T * 2.2) * 0.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(34, G, 62, 178, 0, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,236,255,0.22)'; ctx.lineWidth = 1; for (const rx of [22, 42]) { ctx.beginPath(); ctx.ellipse(34, G, rx, 178, 0, Math.PI, 0); ctx.stroke(); } for (const yy of [50, 100, 140]) { const rx = 62 * Math.sqrt(1 - (yy / 178) * (yy / 178)); ctx.beginPath(); ctx.ellipse(34, G - yy, rx, 5, 0, 0, Math.PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(34, G, 54, 166, 0, Math.PI * 1.12, Math.PI * 1.3); ctx.stroke();
    // plateformes flottantes des tourelles
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30 + Math.sin(T * 1.8 + s) * 0.6;
      halo(ctx, 93, y + 7, 14, '79,216,255', 0.5); oval(ctx, 93, y + 5.6, 11, 2, 'rgba(79,216,255,0.6)');
      blob(ctx, WHITE, () => { ctx.moveTo(76, y - 1); ctx.lineTo(110, y - 1); ctx.lineTo(105, y + 4); ctx.lineTo(81, y + 4); }, 1.2); line(ctx, [79, y + 0.4, 107, y + 0.4], team, 1.6);
    }
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets['tourelle-laser'] = function (ctx, a, team) {
    rect(ctx, -10, 1, 20, 6.6, WHITE, 1.2); rect(ctx, -10, 3.6, 20, 2, team);
    blob(ctx, WHITE, () => { ctx.moveTo(-9.6, 1); ctx.quadraticCurveTo(-9, -12, 0, -12.6); ctx.quadraticCurveTo(9, -12, 9.6, 1); }, 1.3); line(ctx, [-6, -5, -3, -10], '#ffffff', 1.2);
    rect(ctx, 4, -9, 15 - a * 2, 4.4, WHITE_D, 1); rect(ctx, 7, -8, 8, 2.4, CYAN);
    halo(ctx, 20 - a * 2, -6.8, 4 + a * 9, '79,216,255', 0.5 + a * 0.5); disc(ctx, 20 - a * 2, -6.8, 2.4 + a * 1.6, a > 0 ? '#ffffff' : CYAN, 0.8);
  };
  A.turrets['canon-ions'] = function (ctx, a, team) {
    rect(ctx, -11, -11, 14, 18, DARK, 1.2); rect(ctx, -11, -2, 14, 2.4, team); disc(ctx, -4, -6.6, 2.2, ION);
    ctx.save(); ctx.translate(-a * 3, 0);
    rect(ctx, 2, -9, 21, 7, WHITE, 1.1);
    for (let i = 0; i < 3; i++) { rect(ctx, 5.6 + i * 5.4, -11, 2.6, 11, ION, 0.8); }
    rect(ctx, 21.4, -10, 3.4, 9, DARK, 0.9);
    ctx.restore();
    halo(ctx, 26 - a * 3, -5.4, 4 + a * 10, '156,140,255', 0.4 + a * 0.6); if (a > 0.2) disc(ctx, 26 - a * 3, -5.4, 2 + a * 2.4, '#e6e0ff');
  };
  A.turrets['lance-plasma'] = function (ctx, a, team) {
    rect(ctx, -10, 0, 20, 7.6, DARK, 1.2); rect(ctx, -10, 3, 20, 2, team);
    ctx.save(); ctx.translate(-1, -3); ctx.rotate(-0.62);
    rect(ctx, -3, -5.6, 21 - a * 3, 11.2, WHITE, 1.2); rect(ctx, 2, -5.6, 2.6, 11.2, WHITE_D); rect(ctx, 9, -5.6, 2.6, 11.2, WHITE_D);
    halo(ctx, 19 - a * 3, 0, 6 + a * 8, '126,240,200', 0.55 + a * 0.4); disc(ctx, 19 - a * 3, 0, 3.6 + a * 1.6, PLASMA, 0.9); disc(ctx, 18 - a * 3, -1, 1.2, '#eafff6');
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.laser = function (ctx, p, dir) {
    const col = p.owner === 1 ? '110,230,255' : '255,110,150';
    ctx.translate(p.x, p.y); ctx.rotate(dir); ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(${col},0.3)`; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.stroke();
    halo(ctx, 0, 0, 7, col, 0.8);
  };
  A.projectiles.ion = function (ctx, p) {
    halo(ctx, p.x, p.y, 16, '156,140,255', 0.6);
    ctx.strokeStyle = 'rgba(214,206,255,0.8)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 3.6, p.x * 0.06, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 3.6, p.x * 0.06 + 1.57, 0, TAU); ctx.stroke();
    disc(ctx, p.x, p.y, 5, '#c8c0ff'); disc(ctx, p.x, p.y, 2.4, '#ffffff');
  };
  A.projectiles.plasma = function (ctx, p, dir) {
    halo(ctx, p.x, p.y, 16, '126,240,200', 0.6);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(126,240,200,0.5)'; ctx.beginPath(); ctx.moveTo(0, -5.6); ctx.lineTo(-20, 0); ctx.lineTo(0, 5.6); ctx.closePath(); ctx.fill();
    ctx.restore();
    disc(ctx, p.x, p.y, 6.4, PLASMA); disc(ctx, p.x - 1.4, p.y - 1.6, 2.6, '#eafff6');
  };
  // Frappe orbitale : colonne de lumière tombée de l'espace.
  A.drops.beam = function (ctx, d) {
    const r = d.radius * 0.4, f = 0.8 + Math.random() * 0.2;
    const g = ctx.createLinearGradient(d.x - r * 1.6, 0, d.x + r * 1.6, 0);
    g.addColorStop(0, 'rgba(79,216,255,0)'); g.addColorStop(0.5, `rgba(120,230,255,${0.5 * f})`); g.addColorStop(1, 'rgba(79,216,255,0)');
    ctx.fillStyle = g; ctx.fillRect(d.x - r * 1.6, -40, r * 3.2, d.y + 40);
    ctx.fillStyle = `rgba(200,244,255,${0.9 * f})`; ctx.fillRect(d.x - r * 0.42, -40, r * 0.84, d.y + 40);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(d.x - r * 0.16, -40, r * 0.32, d.y + 40);
    halo(ctx, d.x, d.y, r * 2.4, '160,236,255', 0.8);
  };

  /* -------------------------------------------------------------------- décor */
  function spire(g, x, base, w, hh, col, r, neon) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x, base + 80); g.lineTo(x, base - hh * 0.86); g.lineTo(x + w * 0.3, base - hh); g.lineTo(x + w * 0.7, base - hh * 0.94); g.lineTo(x + w, base - hh * 0.8); g.lineTo(x + w, base + 80); g.fill();
    g.fillRect(x + w * 0.3 - 1, base - hh - 22 - r() * 30, 2, 54);
    g.fillStyle = 'rgba(0,0,10,0.2)'; g.fillRect(x + w * 0.72, base - hh * 0.8, w * 0.28, hh + 80);
    for (let k = 0; k < 3; k++) { g.fillStyle = neon[Math.floor(r() * neon.length)]; g.fillRect(x + 4 + r() * (w - 12), base - hh * 0.8 + r() * 12, 2, hh * (0.3 + r() * 0.5)); }
    for (let yy = base - hh * 0.78; yy < base + 40; yy += 9) for (let xx = x + 5; xx < x + w - 6; xx += 8) if (r() < 0.36) { g.fillStyle = r() < 0.7 ? 'rgba(160,220,255,0.6)' : 'rgba(255,200,240,0.6)'; g.fillRect(xx, yy, 4, 3); }
  }
  const CARS = [];
  A.backdrops.futur = backdrop('futur', 2299, (g, r) => {
    sky(g, [[0, '#070b22'], [0.5, '#16205a'], [0.82, '#2f4c9a'], [1, '#3f86b8']]);
    starfield(g, r, 150, 420);
    // planète aux anneaux et petite lune
    halo(g, 960, 150, 130, '150,140,255', 0.35);
    g.strokeStyle = 'rgba(210,200,255,0.55)'; g.lineWidth = 4; g.beginPath(); g.ellipse(960, 150, 96, 18, -0.28, Math.PI, 0); g.stroke();
    let gr = g.createRadialGradient(940, 128, 6, 960, 150, 60); gr.addColorStop(0, '#c0b6ff'); gr.addColorStop(1, '#5a4cc0');
    g.fillStyle = gr; g.beginPath(); g.arc(960, 150, 56, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,70,190,0.6)'; g.lineWidth = 3; for (const dy of [-22, -4, 16]) { g.beginPath(); g.ellipse(960, 150 + dy, 55 * Math.sqrt(1 - (dy / 56) * (dy / 56)), 4, 0, 0, Math.PI); g.stroke(); }
    g.strokeStyle = 'rgba(226,218,255,0.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(960, 150, 96, 18, -0.28, 0, Math.PI); g.stroke();
    g.fillStyle = '#d6dcf2'; g.beginPath(); g.arc(250, 110, 16, 0, TAU); g.fill(); g.fillStyle = 'rgba(20,30,80,0.35)'; g.beginPath(); g.arc(256, 106, 14, 0, TAU); g.fill();
    for (let x = -30; x < W + 40;) { const w = 40 + r() * 46, hh = 150 + r() * 200; spire(g, x, 520, w, hh, '#1c2c66', r, ['rgba(79,216,255,0.5)', 'rgba(255,110,200,0.45)']); x += w + 6 + r() * 16; }
    gr = g.createLinearGradient(0, 400, 0, 560); gr.addColorStop(0, 'rgba(63,134,184,0)'); gr.addColorStop(1, 'rgba(63,134,184,0.55)');
    g.fillStyle = gr; g.fillRect(-40, 400, W + 80, 220);
  }, (f, r) => {
    for (let x = -40; x < W + 40;) { const w = 50 + r() * 60, hh = 70 + r() * 130; spire(f, x, GROUND - 6, w, hh, '#0f1838', r, ['rgba(79,216,255,0.85)', 'rgba(255,110,200,0.8)', 'rgba(126,240,200,0.8)']); x += w + 5 + r() * 14; }
    // pont de métal : plaques, joints lumineux, fuyantes
    let gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#2a3458'); gr.addColorStop(1, '#141a30');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    f.strokeStyle = 'rgba(79,216,255,0.2)'; f.lineWidth = 1.2;
    for (const yy of [22, 46, 76, 108]) { f.beginPath(); f.moveTo(-40, GROUND + yy); f.lineTo(W + 40, GROUND + yy); f.stroke(); }
    for (let x = -400; x < W + 400; x += 80) { f.beginPath(); f.moveTo(W / 2 + (x - W / 2) * 0.8, GROUND + 8); f.lineTo(W / 2 + (x - W / 2) * 1.5, H + 40); f.stroke(); }
    for (let i = 0; i < 26; i++) { f.fillStyle = `rgba(160,220,255,${0.06 + r() * 0.08})`; f.fillRect(r() * W, GROUND + 14 + r() * 92, 20 + r() * 50, 2); }
    f.fillStyle = '#3a4670'; f.fillRect(-40, GROUND, W + 80, 8);
    const sg = f.createLinearGradient(0, GROUND - 8, 0, GROUND + 14); sg.addColorStop(0, 'rgba(79,216,255,0)'); sg.addColorStop(0.5, 'rgba(79,216,255,0.35)'); sg.addColorStop(1, 'rgba(79,216,255,0)');
    f.fillStyle = sg; f.fillRect(-40, GROUND - 8, W + 80, 22); f.fillStyle = '#c8f4ff'; f.fillRect(-40, GROUND + 2, W + 80, 2.4);
  }, (ctx, t, dt) => {
    // circulation aérienne : traînées lumineuses sur deux couloirs
    if (!CARS.length) for (let i = 0; i < 12; i++) CARS.push({ x: Math.random() * W, lane: i % 2, v: 90 + Math.random() * 80 });
    for (const c of CARS) {
      const dir = c.lane ? -1 : 1; c.x += dir * c.v * (dt || 0); if (c.x > W + 60) c.x = -60; if (c.x < -60) c.x = W + 60;
      const y = c.lane ? 330 : 386, col = c.lane ? '255,110,200' : '79,216,255';
      const g = ctx.createLinearGradient(c.x - dir * 46, 0, c.x, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},0.85)`);
      ctx.fillStyle = g; ctx.fillRect(Math.min(c.x, c.x - dir * 46), y - 1, 46, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(c.x - 2, y - 1.5, 4, 3);
    }
  });
})();

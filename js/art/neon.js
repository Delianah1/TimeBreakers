/* =========================================================================
   GRAPHISMES — ÂGE CACHÉ DU NÉON (js/ages-caches.js pour les règles)
   Ville de nuit, gratte-ciel à enseignes roses et turquoise, sol en grille lumineuse.
   Art.phen.neon : les lumières qui grésillent sur le décor moderne, puis la surtension.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, now, blob, limb, dk, poly, line, rect, disc, oval, figure, swing, aim, halo, backdrop, sky, hills } = K;
  const ROSE = '#ff3ad8', CYAN = '#3afff0', VIOLET = '#8a3aff', JAUNE = '#ffe83a', NUIT = '#14101e', METAL = '#3a3448', METAL_L = '#5a5470';
  A.phen = A.phen || {};

  // trait lumineux : halo flou + cœur clair
  function neon(ctx, pts, col, w) {
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8;
    line(ctx, pts, col, (w || 2) + 1); ctx.restore();
    line(ctx, pts, '#ffffff', (w || 2) * 0.4);
  }
  // éclair en zigzag de (x0,y0) à (x1,y1)
  function zigzag(ctx, x0, y0, x1, y1, col, n, amp) {
    const pts = [x0, y0];
    for (let i = 1; i < n; i++) { const k = i / n; pts.push(x0 + (x1 - x0) * k + (Math.random() - 0.5) * amp, y0 + (y1 - y0) * k + (Math.random() - 0.5) * amp); }
    pts.push(x1, y1); neon(ctx, pts, col, 1.6);
  }
  K.neon = neon; K.zigzag = zigzag;

  /* ------------------------------------------------------------ unités */
  // Cyber-ninja : combinaison sombre à liseré d'équipe, visière lumineuse, lame néon.
  A.units['cyber-ninja'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    const T = now();
    figure(ctx, u, team, dark, atk, {
      skin: '#2a2436', body: '#2a2436', legs: '#1e1a28', boots: '#14101c', belt: team, headColor: '#2a2436', face: false,
      over(c, a) { line(c, [-5, -30 + a.ty, 6, -18 + a.ty], team, 1.6); },
      head(c, a) { neon(c, [a.hx - 1, a.hy - 1, a.hx + 6, a.hy - 1.4], CYAN, 2); const w = Math.sin(T * 6 + u.x) * 2; limb(c, [a.hx - 5, a.hy - 2, a.hx - 12, a.hy + w, a.hx - 16, a.hy + 3 + w], 1.4, team); },
      arm(c, a) { swing(c, a, cc => { limb(cc, [0, 3, 0, -2], 2, '#5a5470'); neon(cc, [0, -3, 0, -22], ROSE, 2.4); }, { sleeve: '#2a2436' }); },
    }, R);
  } };

  // Hacker : sweat à capuche d'équipe, écran holographique au poignet, lignes de code.
  A.units.hacker = { h: 46, draw(ctx, u, team, dark, atk, R) {
    const T = now();
    figure(ctx, u, team, dark, atk, {
      skin: '#e2b48a', body: team, legs: '#2a2a3a', boots: '#eaeaf2', belt: dark,
      head(c, a) {
        blob(c, team, () => { c.moveTo(a.hx - 7, a.hy + 5); c.quadraticCurveTo(a.hx - 9, a.hy - 9, a.hx + 1, a.hy - 9); c.quadraticCurveTo(a.hx + 7, a.hy - 8, a.hx + 6, a.hy - 2); c.lineTo(a.hx - 1, a.hy - 3); c.lineTo(a.hx - 2, a.hy + 6); }, 1.1);
        rect(c, a.hx + 1, a.hy - 2, 5, 2, '#1a1a22'); neon(c, [a.hx + 1.4, a.hy - 1, a.hx + 5.6, a.hy - 1], JAUNE, 1);
      },
      arm(c, a) { aim(c, a, (cc, k) => {
        cc.save(); cc.globalAlpha = 0.75; cc.fillStyle = 'rgba(58,255,240,0.25)'; cc.fillRect(4, -9, 12, 9); cc.strokeStyle = CYAN; cc.lineWidth = 1; cc.strokeRect(4, -9, 12, 9);
        cc.fillStyle = CYAN; cc.font = 'bold 4px monospace'; for (let i = 0; i < 3; i++) cc.fillText(((T * 7 + i * 3) | 0) % 2 ? '101' : '010', 5, -6 + i * 2.6);
        cc.restore();
        if (k > 0.3) halo(cc, 16, -4, 8, '58,255,240', k);
      }, { y: 2, kick: 1 }); },
    }, R);
  } };

  // Robot anti-émeute : carcasse noire, visière rose, bouclier d'équipe et matraque électrique.
  function robot(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, sw = mv ? Math.sin(u.walk * 0.8) : 0, k = o.k || 1;
    const bob = mv ? Math.abs(Math.cos(u.walk * 0.8)) * 1.4 : 0, ty = -bob;
    ctx.save(); ctx.scale(k, k);
    for (const d of [-1, 1]) { const fx = d * sw * 5; blob(ctx, d < 0 ? '#28222e' : METAL, () => { ctx.moveTo(d * 4 - 5, -30 + ty); ctx.lineTo(d * 4 + 5, -30 + ty); ctx.lineTo(fx + 5, -2); ctx.lineTo(fx - 5, -2); }, 1.3); rect(ctx, fx - 6, -4, 13, 4, '#1a1620', 1); }
    blob(ctx, METAL, () => { ctx.moveTo(-13, -30 + ty); ctx.lineTo(-15, -58 + ty); ctx.lineTo(13, -60 + ty); ctx.lineTo(14, -30 + ty); }, 1.5);
    poly(ctx, [-11, -54 + ty, 11, -56 + ty, 11, -48 + ty, -11, -46 + ty], METAL_L);
    neon(ctx, [-12, -36 + ty, 12, -37 + ty], team, 2);
    // tête
    rect(ctx, -6, -70 + ty, 14, 11, '#28222e', 1.3);
    neon(ctx, [-3, -65 + ty, 7, -65.6 + ty], o.oeil || ROSE, 2.2);
    if (o.crown) o.R.crown(ctx, 1, -76 + ty);
    // bouclier (bras arrière)
    blob(ctx, 'rgba(120,200,255,0.35)', () => { ctx.moveTo(14, -62 + ty); ctx.lineTo(24, -60 + ty); ctx.lineTo(24, -18 + ty); ctx.lineTo(14, -20 + ty); }, 1.3);
    line(ctx, [16, -56 + ty, 22, -56 + ty], team, 2);
    // matraque
    const hx = 10 + atk * 8, hy = -40 + ty - atk * 6;
    limb(ctx, [8, -54 + ty, 12, -46 + ty, hx, hy], 4.4, METAL_L);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.9 + atk * 1.4); neon(ctx, [0, 0, 0, -18], CYAN, 2.4); if (atk > 0.3) zigzag(ctx, 0, -18, 6, -26, CYAN, 3, 5); ctx.restore();
    ctx.restore();
  }
  A.units['robot-emeute'] = { h: 70, top: 76, draw(ctx, u, team, dark, atk, R) { robot(ctx, u, team, dark, atk, { R }); } };

  // Drone néon : coque en disque, anneau lumineux, rotors, il flotte et lance des arcs.
  A.units['drone-neon'] = { h: 44, top: 48, draw(ctx, u, team, dark, atk) {
    const T = now(), y = -26 + Math.sin(T * 3 + u.x * 0.05) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, -1, 14, 3, 0, 0, TAU); ctx.fill();
    for (const d of [-1, 1]) { line(ctx, [d * 6, y - 4, d * 16, y - 10], METAL_L, 2); oval(ctx, d * 16, y - 11, 8 * Math.abs(Math.sin(T * 30 + d)), 1.4, 'rgba(220,220,255,0.6)'); }
    blob(ctx, METAL, () => ctx.ellipse(0, y, 16, 7, 0, 0, TAU), 1.4);
    neon(ctx, [-14, y + 1, 14, y + 1], team, 1.8);
    disc(ctx, 0, y + 6, 4, '#1a1620', 1);
    halo(ctx, 0, y + 7, 10 + atk * 8, '58,255,240', 0.5 + atk * 0.5);
    disc(ctx, 0, y + 7, 2, CYAN);
  } };

  /* ------------------------------------------------------------ champions */
  A.units['ch-robot-geant'] = { h: 70, draw(ctx, u, team, dark, atk, R) { robot(ctx, u, team, dark, atk, { R, crown: true, oeil: JAUNE, k: 1 }); } };
  // IA rebelle : noyau flottant entouré d'anneaux, câbles qui pendent, un grand œil.
  A.units['ch-ia-rebelle'] = { h: 90, draw(ctx, u, team, dark, atk, R) {
    const T = now(), y = -52 + Math.sin(T * 1.6) * 3;
    for (let i = 0; i < 5; i++) { const x = -14 + i * 7; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x + Math.sin(T * 2 + i) * 6, y + 34, x + 2, -2); ctx.strokeStyle = i % 2 ? '#3a3448' : '#2a2436'; ctx.lineWidth = 2.4; ctx.stroke(); }
    halo(ctx, 0, y, 46, '255,58,216', 0.25 + atk * 0.2);
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(0, y); ctx.rotate(T * (0.6 + i * 0.4) * (i % 2 ? -1 : 1)); ctx.strokeStyle = [ROSE, CYAN, VIOLET][i]; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 30 - i * 4, 9 + i * 3, i * 0.8, 0, TAU); ctx.stroke(); ctx.restore(); }
    blob(ctx, METAL, () => ctx.arc(0, y, 18, 0, TAU), 1.6);
    blob(ctx, team, () => { ctx.arc(0, y, 18, Math.PI * 0.15, Math.PI * 0.85); ctx.lineTo(0, y + 8); }, 1);
    disc(ctx, 3, y - 2, 9, '#14101e', 1.2); halo(ctx, 3, y - 2, 12, '255,58,216', 0.8); disc(ctx, 4, y - 2, 3.4, ROSE); disc(ctx, 5, y - 3, 1, '#fff');
    R.crown(ctx, 0, y - 22);
  } };
  // Pirate holographique : silhouette translucide qui grésille, tricorne, sabre de lumière.
  A.units['ch-pirate-holo'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    const T = now(), gr = Math.random() < 0.06;
    ctx.save(); ctx.globalAlpha = gr ? 0.35 : 0.78; if (gr) ctx.translate((Math.random() - 0.5) * 4, 0);
    figure(ctx, u, team, dark, atk, {
      skin: '#9af8ff', body: team, legs: '#3a8a9a', boots: '#1a4a5a', belt: JAUNE, headColor: '#9af8ff', crown: true, crownUp: 15,
      back(c, a) { blob(c, 'rgba(58,255,240,0.4)', () => { c.moveTo(-4, -33 + a.ty); c.quadraticCurveTo(-16, -22 + a.ty, -14 + Math.sin(T * 3) * 2, -6 + a.ty); c.lineTo(-4, -14 + a.ty); }, 1); },
      head(c, a) { blob(c, '#1a2a3a', () => { c.moveTo(a.hx - 9, a.hy - 4); c.quadraticCurveTo(a.hx, a.hy - 14, a.hx + 9, a.hy - 4); c.quadraticCurveTo(a.hx, a.hy - 7, a.hx - 9, a.hy - 4); }, 1.1); rect(c, a.hx + 1, a.hy - 2.4, 4, 2.6, '#1a1a22'); },
      arm(c, a) { swing(c, a, cc => { limb(cc, [0, 3, 0, -2], 2, JAUNE); neon(cc, [0, -3, 0, -20], CYAN, 2.4); }, { sleeve: team }); },
    }, R);
    ctx.restore();
    ctx.globalAlpha = 0.25; for (let y = -46; y < 0; y += 4) line(ctx, [-12, y + (T * 30) % 4, 12, y + (T * 30) % 4], CYAN, 0.6); ctx.globalAlpha = 1;
  } };

  /* -------------------------------------------------------------- tourelles */
  A.turrets['tourelle-neon'] = function (ctx, a, team) {
    rect(ctx, -9, -1, 18, 9, METAL, 1.2); neon(ctx, [-8, 4, 8, 4], team, 1.6);
    ctx.save(); ctx.translate(0, -4); ctx.rotate(-0.08);
    rect(ctx, -6, -5, 12, 10, '#28222e', 1.2);
    rect(ctx, 5, -2, 14, 4, METAL_L, 1);
    neon(ctx, [6, 0, 18 - a * 3, 0], ROSE, 1.4);
    if (a > 0.4) halo(ctx, 21, 0, 9, '255,58,216', a);
    ctx.restore();
  };
  A.turrets['canon-plasma'] = function (ctx, a, team) {
    const T = now();
    rect(ctx, -11, 0, 22, 8, METAL, 1.2); neon(ctx, [-10, 4, 10, 4], team, 1.6);
    ctx.save(); ctx.translate(0, -6); ctx.rotate(-0.12);
    blob(ctx, '#28222e', () => { ctx.moveTo(-8, -6); ctx.lineTo(16, -4); ctx.lineTo(16, 4); ctx.lineTo(-8, 6); }, 1.3);
    for (const x of [-2, 4, 10]) neon(ctx, [x, -4.6, x, 4.6], VIOLET, 1.2);
    halo(ctx, 18, 0, 8 + a * 8, '138,58,255', 0.5 + a * 0.5 + 0.1 * Math.sin(T * 8));
    ctx.restore();
  };
  A.turrets['tour-surtension'] = function (ctx, a, team) {
    const T = now();
    rect(ctx, -8, -2, 16, 10, METAL, 1.2); neon(ctx, [-7, 3, 7, 3], team, 1.6);
    poly(ctx, [-5, -2, -3, -20, 3, -20, 5, -2], '#28222e', 1.2);
    for (const y of [-6, -11, -16]) neon(ctx, [-4, y, 4, y], CYAN, 1);
    disc(ctx, 0, -24, 5, METAL_L, 1.2); halo(ctx, 0, -24, 10 + a * 10, '58,255,240', 0.6 + a * 0.4);
    if (Math.sin(T * 13) > 0.6 || a > 0.3) zigzag(ctx, 0, -24, (Math.random() - 0.5) * 20, -36, CYAN, 3, 6);
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles['laser-neon'] = function (ctx, p, dir) { ctx.translate(p.x, p.y); ctx.rotate(dir); neon(ctx, [-16, 0, 4, 0], ROSE, 2); };
  A.projectiles['plasma-neon'] = function (ctx, p) { halo(ctx, p.x, p.y, 18, '138,58,255', 0.6); disc(ctx, p.x, p.y, 5, '#d8b0ff'); disc(ctx, p.x, p.y, 2.4, '#fff'); };
  A.projectiles['boule-neon'] = function (ctx, p) { halo(ctx, p.x, p.y, 16, '58,255,240', 0.6); disc(ctx, p.x, p.y, 5, CYAN); zigzag(ctx, p.x, p.y, p.x + (Math.random() - 0.5) * 18, p.y + (Math.random() - 0.5) * 18, '#ffffff', 3, 4); };
  A.projectiles['eclair-neon'] = function (ctx, p, dir) { ctx.translate(p.x, p.y); ctx.rotate(dir); zigzag(ctx, -18, 0, 4, 0, CYAN, 5, 6); };
  A.projectiles.code = function (ctx, p) {
    ctx.save(); ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = JAUNE; ctx.shadowColor = JAUNE; ctx.shadowBlur = 6;
    ctx.fillText(((p.x | 0) >> 3) % 2 ? '{01}' : '<10>', p.x, p.y + 3); ctx.restore();
  };
  A.drops['foudre-neon'] = function (ctx, d) {
    zigzag(ctx, d.x + (Math.random() - 0.5) * 30, d.y - 160, d.x, d.y, Math.random() < 0.5 ? ROSE : CYAN, 7, 16);
    halo(ctx, d.x, d.y, 20, '255,255,255', 0.5);
  };

  /* -------------------------------------------------------------------- base */
  // Tour de données : verre sombre, bandes néon, antenne, enseigne qui clignote.
  A.bases.neon = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    halo(ctx, 50, G - 90, 110, '255,58,216', 0.18);
    blob(ctx, '#1e1828', () => { ctx.moveTo(4, G); ctx.lineTo(8, G - 170); ctx.lineTo(70, G - 186); ctx.lineTo(96, G - 150); ctx.lineTo(100, G); }, 1.6);
    for (let y = G - 160; y < G - 10; y += 10) for (let x = 14; x < 92; x += 9) if (((x * 7 + y * 3) >> 3) % 3) rect(ctx, x, y, 5, 4, ((x + y + (T * 2 | 0)) % 7) ? 'rgba(58,255,240,0.35)' : 'rgba(255,58,216,0.6)');
    neon(ctx, [8, G - 170, 70, G - 186, 96, G - 150], team, 2.4);
    neon(ctx, [6, G - 60, 98, G - 60], ROSE, 1.6);
    line(ctx, [60, G - 184, 60, G - 230], METAL_L, 2.4); disc(ctx, 60, G - 232, 3, Math.sin(T * 4) > 0 ? ROSE : '#3a2a3a');
    // enseigne
    const on = Math.sin(T * 7) > -0.8;
    rect(ctx, 16, G - 130, 50, 16, '#14101e', 1.2);
    // le texte reste lisible sur la base ennemie (dessinée en miroir)
    ctx.save(); ctx.translate(41, G - 118); ctx.scale(side < 0 ? -1 : 1, 1); ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = on ? CYAN : '#2a4a4a'; if (on) { ctx.shadowColor = CYAN; ctx.shadowBlur = 8; } ctx.fillText('NEO', 0, 0); ctx.restore();
    // porte
    rect(ctx, 38, G - 34, 26, 34, '#0e0a14', 1.3); neon(ctx, [38, G - 34, 64, G - 34], CYAN, 1.4);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; poly(ctx, [78 - s * 2, y - 1, 106, y - 2.5, 110, y + 1, 106, y + 4.5, 78 - s * 2, y + 4.5], METAL, 1.3); }
    const wv = Math.sin(T * 2.4 + side) * 2;
    blob(ctx, team, () => { ctx.moveTo(60, G - 228); ctx.quadraticCurveTo(74, G - 230 + wv, 86, G - 224 + wv); ctx.lineTo(82, G - 216 + wv); ctx.quadraticCurveTo(70, G - 212 + wv, 60, G - 214); }, 1.2);
  };

  /* ------------------------------------------------------------------ décor */
  A.backdrops.neon = backdrop('neon', 5521, (g, r) => {
    sky(g, [[0, '#06040e'], [0.5, '#1a0a30'], [0.85, '#4a1458'], [1, '#7a2a6a']]);
    K.starfield(g, r, 40, 220, '255,200,255');
    halo(g, 1000, 170, 60, '255,120,220', 0.5); disc(g, 1000, 170, 34, '#ffb0e8');
    // gratte-ciel
    for (let l = 0; l < 2; l++) for (let i = 0; i < 16; i++) {
      const x = i * 86 + r() * 40 - 20 + l * 40, w = 40 + r() * 50, h = (l ? 200 : 290) * (0.5 + r() * 0.6), y = 560 - h;
      g.fillStyle = l ? '#1e1430' : '#140e22'; g.fillRect(x, y, w, h);
      for (let yy = y + 8; yy < 556; yy += 9) for (let xx = x + 4; xx < x + w - 4; xx += 7) if (r() < 0.35) { g.fillStyle = r() < 0.5 ? 'rgba(58,255,240,0.45)' : 'rgba(255,58,216,0.45)'; g.fillRect(xx, yy, 3, 4); }
      if (r() < 0.4) { g.fillStyle = r() < 0.5 ? ROSE : CYAN; g.fillRect(x + 4, y + 10 + r() * 30, w - 8, 3); }
    }
  }, (f, r) => {
    const sg = f.createLinearGradient(0, 556, 0, GROUND); sg.addColorStop(0, '#1a1228'); sg.addColorStop(1, '#241c30');
    f.fillStyle = sg; f.fillRect(-40, 556, W + 80, GROUND - 556);
    f.fillStyle = '#16121e'; f.fillRect(-40, GROUND, W + 80, 160);
    // sol en grille lumineuse
    f.strokeStyle = 'rgba(255,58,216,0.35)'; f.lineWidth = 1;
    for (let i = 0; i < 8; i++) { const y = GROUND + 8 + i * i * 2.2; f.beginPath(); f.moveTo(-40, y); f.lineTo(W + 40, y); f.stroke(); }
    for (let x = -40; x <= W + 40; x += 40) { f.beginPath(); f.moveTo(W / 2 + (x - W / 2) * 0.3, GROUND); f.lineTo(x * 1.6 - W * 0.3, GROUND + 160); f.stroke(); }
    f.fillStyle = CYAN; f.fillRect(-40, GROUND, W + 80, 2.4);
  }, (ctx) => {
    // enseignes qui clignotent au loin
    const T = now();
    for (let i = 0; i < 6; i++) { const on = Math.sin(T * (1 + i * 0.3) + i * 2) > -0.3; if (!on) continue; const x = 90 + i * 210, y = 330 + (i % 3) * 40; neon(ctx, [x, y, x + 40, y], i % 2 ? ROSE : CYAN, 2); }
  }, (ctx) => {
    const T = now();
    ctx.fillStyle = 'rgba(160,200,255,0.25)';
    for (let i = 0; i < 30; i++) { const k = (T * 0.5 + i * 0.37) % 1; ctx.fillRect((i * 151) % W, k * GROUND, 1, 10); }
  });

  /* ------------------------------------------------- le phénomène : la surtension */
  A.phen.neon = function (ctx, b, P, T) {
    const s = P.s;
    // la nuit tombe et les lumières grésillent
    ctx.fillStyle = `rgba(20,0,40,${0.12 * s})`; ctx.fillRect(0, 0, W, GROUND);
    for (let i = 0; i < 2 + s * 2; i++) { const on = Math.sin(T * (3 + i) + i * 1.7) > 0.2 || Math.random() < 0.1; if (!on) continue; const x = 60 + i * 157 % (W - 120), y = 280 + (i * 53) % 160; neon(ctx, [x, y, x + 50, y], i % 2 ? ROSE : CYAN, 2.2); }
    if (s >= 2 && Math.random() < 0.08 * s) zigzag(ctx, Math.random() * W, 0, Math.random() * W, 200 + Math.random() * 200, Math.random() < 0.5 ? ROSE : CYAN, 8, 40);
    neon(ctx, [-40, GROUND - 1, W + 40, GROUND - 1], `rgba(58,255,240,${0.3 + 0.2 * s})`, 1.4);
    // la surtension
    if (P.x != null) {
      const x0 = P.x, x1 = W - PA.CONFIG.world.baseWidth + 10, c = P.fin;
      ctx.globalAlpha = 1 - c * 0.7;
      for (let x = x0; x < x1; x += 30) neon(ctx, [x, GROUND - 2, x + 18, GROUND - 2 - ((x / 30 | 0) % 2) * 3], ROSE, 1.6);
      ctx.globalAlpha = 1;
      if (P.etat === 'vague') {
        halo(ctx, x0, GROUND - 30, 70, '58,255,240', 0.6);
        for (let i = 0; i < 4; i++) zigzag(ctx, x0 + (Math.random() - 0.5) * 20, GROUND - 120 - Math.random() * 60, x0 + (Math.random() - 0.5) * 30, GROUND, i % 2 ? ROSE : CYAN, 6, 20);
      }
    }
  };
})();

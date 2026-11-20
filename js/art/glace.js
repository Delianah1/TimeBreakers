/* =========================================================================
   GRAPHISMES — ÂGE CACHÉ DE LA GLACE (js/ages-caches.js pour les règles)
   Toundra blanche, glaciers bleus, aurores ; forteresse taillée dans la glace.
   Art.phen.glace : l'hiver qui tombe sur le décor médiéval, puis le blizzard.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, now, blob, limb, dk, poly, line, rect, disc, oval, figure, swing, thrust, aim, halo, backdrop, sky, hills } = K;
  const GLACE = '#bfe6ff', GLACE_L = '#eef9ff', GLACE_D = '#7ab8e0', BLEU = '#3a78b8', FOURRURE = '#e8e2d6', FOURRURE_D = '#bfb6a6';
  A.phen = A.phen || {};

  // éclat de glace (cristal) le long de -y
  function cristal(ctx, h, w) {
    blob(ctx, GLACE, () => { ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.8, -h * 0.7); ctx.lineTo(0, -h); ctx.lineTo(w * 0.8, -h * 0.7); ctx.lineTo(w, 0); }, 1);
    line(ctx, [0, -h, -w * 0.3, -h * 0.3], GLACE_L, 1);
  }
  // fourrure : bords en dents de scie
  function fourrure(ctx, pts, col) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) { const mx = (pts[i - 2] + pts[i]) / 2, my = (pts[i - 1] + pts[i + 1]) / 2; ctx.lineTo(mx + 1.6, my + 2.2); ctx.lineTo(pts[i], pts[i + 1]); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  }

  /* ------------------------------------------------------------ unités */
  // Guerrier du givre : manteau de fourrure, casque à cornes givrées, hache de glace.
  A.units['guerrier-givre'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      skin: '#e8c8b8', body: team, legs: '#5a6a7a', boots: FOURRURE_D, belt: '#5a4030',
      over(c, a) { fourrure(c, [-6, -33 + a.ty, 0, -35 + a.ty, 7, -33 + a.ty, 7, -29 + a.ty, -6, -29 + a.ty], FOURRURE); },
      head(c, a) {
        K.helm(c, a, '#9aa8b8', { neck: 2 });
        for (const d of [-1, 1]) blob(c, GLACE, () => { c.moveTo(a.hx + d * 3 - 1, a.hy - 5); c.quadraticCurveTo(a.hx + d * 10, a.hy - 9, a.hx + d * 9, a.hy - 15); c.lineTo(a.hx + d * 5 + 1, a.hy - 6); }, 1);
        blob(c, '#e8e0d0', () => { c.moveTo(a.hx + 1, a.hy + 2); c.quadraticCurveTo(a.hx + 3, a.hy + 10, a.hx + 7, a.hy + 2.6); }, 0.9);
      },
      arm(c, a) { swing(c, a, cc => {
        limb(cc, [0, 4, 0, -18], 1.8, '#6a4a30');
        blob(cc, GLACE, () => { cc.moveTo(0, -18); cc.quadraticCurveTo(9, -20, 10, -11); cc.quadraticCurveTo(5, -13, 0, -11); }, 1);
        line(cc, [2, -17, 8, -13], GLACE_L, 1);
      }, { sleeve: team }); },
    }, R);
  } };

  // Lanceur de glaçons : capuche bordée de fourrure, fronde à glaçons.
  A.units['lanceur-glace'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      skin: '#e8c8b8', body: team, skirt: team, skirtLen: 6, legs: '#6a5a4a', boots: FOURRURE_D, belt: '#5a4030',
      head(c, a) {
        blob(c, team, () => { c.moveTo(a.hx - 7, a.hy + 4); c.quadraticCurveTo(a.hx - 9, a.hy - 10, a.hx + 1, a.hy - 9); c.quadraticCurveTo(a.hx + 7, a.hy - 8, a.hx + 6, a.hy - 3); c.lineTo(a.hx - 2, a.hy - 2); c.lineTo(a.hx - 3, a.hy + 5); }, 1.1);
        fourrure(c, [a.hx - 2, a.hy - 2, a.hx + 1, a.hy - 6, a.hx + 6, a.hy - 3, a.hx + 6, a.hy - 1, a.hx - 1, a.hy], FOURRURE);
      },
      arm(c, a) { aim(c, a, (cc, k) => {
        limb(cc, [0, 0, 6, -2], 1.6, '#6a4a30');
        if (k < 0.3) { cc.save(); cc.translate(9, -2); cc.rotate(1.5); cristal(cc, 9, 2.2); cc.restore(); }
      }, { y: 2, kick: 3 }); },
    }, R);
  } };

  // Mammouth laineux : toison épaisse, défenses recourbées, tapis d'équipe, neige sur le dos.
  function mammouth(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, ph = u.walk * 0.6, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.2 : -Math.sin(T * 1.6 + u.x * 0.04) * 0.5;
    const C1 = o.col || '#8a5a3a', C2 = dk(C1, 0.72), C3 = dk(C1, 1.2);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const patte = (x, dir, col) => { const dx = dir * st * 3.5; blob(ctx, col, () => { ctx.moveTo(x - 6, -26); ctx.lineTo(x + 6, -26); ctx.lineTo(x + 6 + dx, -1); ctx.lineTo(x - 6 + dx, -1); }, 1.3); oval(ctx, x + dx, -1, 6.5, 2, dk(col, 0.7)); };
    patte(-14, -1, C2); patte(12, 1, C2);
    // corps en toison
    fourrure(ctx, [-30, -22 + b, -32, -40 + b, -22, -54 + b, -4, -60 + b, 14, -58 + b, 26, -50 + b, 30, -34 + b, 24, -20 + b, 0, -16 + b], C1);
    ctx.fillStyle = C3; ctx.beginPath(); ctx.ellipse(-8, -50 + b, 14, 4, -0.1, 0, TAU); ctx.fill();
    // neige sur le dos
    blob(ctx, '#ffffff', () => { ctx.moveTo(-22, -54 + b); ctx.quadraticCurveTo(-4, -64 + b, 14, -59 + b); ctx.quadraticCurveTo(0, -56 + b, -22, -52 + b); }, 0.8);
    patte(-22, 1, C1); patte(4, -1, C1);
    // tapis d'équipe
    blob(ctx, team, () => { ctx.moveTo(-18, -54 + b); ctx.lineTo(6, -57 + b); ctx.lineTo(8, -36 + b); ctx.lineTo(-17, -34 + b); }, 1.1);
    line(ctx, [-17, -40 + b, 7.6, -42 + b], '#f2d27a', 1.4);
    if (o.crown) o.R.crown(ctx, 22, -68 + b);
    // tête, trompe, défenses
    fourrure(ctx, [18, -56 + b, 30, -60 + b, 36, -46 + b, 34, -34 + b, 24, -30 + b], C1);
    disc(ctx, 29, -48 + b, 1.4, INK);
    const tx = 36 + atk * 5, ty = -14 + b - atk * 10;
    limb(ctx, [34, -38 + b, 38 + atk * 2, -26 + b, tx, ty], 5.4, C2);
    ctx.beginPath(); ctx.moveTo(30, -34 + b); ctx.quadraticCurveTo(48, -30 + b, 46 + atk * 3, -48 + b - atk * 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#f3ead2'; ctx.lineWidth = 3; ctx.stroke();
  }
  A.units['mammouth-laineux'] = { h: 64, top: 70, draw(ctx, u, team, dark, atk, R) { mammouth(ctx, u, team, dark, atk, { R }); } };

  // Yéti : grand corps de fourrure blanche, visage bleu, il soulève un bloc de neige.
  function yeti(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, sw = mv ? Math.sin(u.walk * 0.8) : 0, k = o.k || 1;
    const bob = mv ? Math.abs(Math.cos(u.walk * 0.8)) * 1.6 : Math.sin(T * 1.8 + u.x * 0.05) * 0.5, ty = -bob;
    const F = o.fur || '#f2f4f8', FD = dk(F, 0.82), PEAU = '#5a7ab8';
    ctx.save(); ctx.scale(k * 1.3, k);
    for (const d of [-1, 1]) { const fx = d * sw * 5; fourrure(ctx, [d * 4 - 5, -22 + ty, d * 4 + 5, -22 + ty, fx + 6, -1, fx - 6, -1], d < 0 ? FD : F); oval(ctx, fx + 2, -1, 6, 2, PEAU, 1); }
    // bras arrière
    limb(ctx, [-8, -46 + ty, -14 - sw * 2, -32 + ty, -12 - sw * 3, -20 + ty], 6, FD);
    fourrure(ctx, [-12, -20 + ty, -14, -44 + ty, -6, -56 + ty, 8, -56 + ty, 14, -44 + ty, 12, -20 + ty], F);
    blob(ctx, team, () => { ctx.moveTo(-12, -28 + ty); ctx.lineTo(12, -28 + ty); ctx.lineTo(12, -23 + ty); ctx.lineTo(-12, -23 + ty); }, 1);
    // tête
    fourrure(ctx, [-4, -54 + ty, 0, -66 + ty, 10, -66 + ty, 13, -56 + ty, 8, -50 + ty], F);
    blob(ctx, PEAU, () => { ctx.moveTo(2, -62 + ty); ctx.quadraticCurveTo(13, -65 + ty, 13.5, -56 + ty); ctx.quadraticCurveTo(11, -49.5 + ty, 3, -52 + ty); }, 1.1);
    line(ctx, [5, -61.5 + ty, 12, -61 + ty], dk(PEAU, 0.6), 1.6);                 // sourcils
    disc(ctx, 9, -58.5 + ty, 1.7, '#ffffff'); disc(ctx, 9.6, -58.5 + ty, 0.9, INK);
    poly(ctx, [6, -54 + ty, 12.5, -54.5 + ty, 11.5, -52 + ty, 6.5, -52 + ty], '#2a1a2a');
    for (const x of [7.4, 10.6]) poly(ctx, [x - 0.8, -54.2 + ty, x, -52.4 + ty, x + 0.8, -54.2 + ty], '#ffffff');
    if (o.crown) o.R.crown(ctx, 5, -70 + ty);
    // bras avant : bloc de neige levé, lancé à l'attaque
    const lance = atk > 0.1, hx = lance ? 18 : 6, hy = lance ? -50 + ty : -68 + ty;
    limb(ctx, [8, -48 + ty, lance ? 14 : 10, lance ? -50 + ty : -58 + ty, hx, hy], 6, F);
    if (!lance && !o.sansBloc) { disc(ctx, hx, hy - 6, 7, '#ffffff', 1.2); disc(ctx, hx - 2, hy - 8, 2.4, GLACE_L); }
    ctx.restore();
  }
  A.units.yeti = { h: 62, top: 72, draw(ctx, u, team, dark, atk, R) { yeti(ctx, u, team, dark, atk, { R }); } };

  /* ------------------------------------------------------------ champions */
  A.units['ch-yeti-roi'] = { h: 62, draw(ctx, u, team, dark, atk, R) {
    if (u.enrage) halo(ctx, 0, -36, 40, '120,180,255', 0.45);
    yeti(ctx, u, team, dark, atk, { R, crown: true, k: 1, fur: '#dfe8f4', sansBloc: true });
  } };
  // Reine des neiges : robe de glace, longue traîne, couronne de cristaux, sceptre.
  A.units['ch-reine-neiges'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    const T = now(), reflet = u.clone;
    if (reflet) ctx.globalAlpha = 0.6;
    halo(ctx, 0, -26, 30, '180,230,255', 0.35);
    figure(ctx, u, team, dark, atk, {
      skin: '#f4e4e8', body: GLACE, skirt: GLACE, skirtLen: 18, legs: GLACE, boots: GLACE_D, belt: team,
      back(c, a) { blob(c, 'rgba(200,240,255,0.7)', () => { c.moveTo(-4, -33 + a.ty); c.quadraticCurveTo(-18, -20 + a.ty, -22 + Math.sin(T * 2) * 2, 0); c.lineTo(-4, -2); }, 1); },
      hairBack(c, a) { blob(c, '#f8fbff', () => { c.moveTo(a.hx - 5, a.hy - 4); c.quadraticCurveTo(a.hx - 12, a.hy + 8, a.hx - 8, a.hy + 18); c.lineTo(a.hx - 3, a.hy + 4); c.lineTo(a.hx + 3, a.hy - 5); }, 1); },
      head(c, a) { for (const [dx, h] of [[-4, 7], [0, 10], [4, 7]]) { c.save(); c.translate(a.hx + dx, a.hy - 5); c.rotate(dx * 0.06); cristal(c, h, 1.6); c.restore(); } },
      arm(c, a) { thrust(c, a, cc => { limb(cc, [-6, 0, 14, 0], 1.4, GLACE_D); cc.save(); cc.translate(16, 0); cc.rotate(Math.PI / 2); cristal(cc, 8, 2.6); cc.restore(); halo(cc, 18, 0, 8, '200,240,255', 0.5 + atk * 0.5); }, { x: 3, y: 2, reach: 5, rot: -0.5 }); },
    }, R);
    ctx.globalAlpha = 1;
  } };
  // Dragon de givre : écailles bleues, ailes de glace, souffle blanc (champions.js).
  A.units['ch-dragon-givre'] = { h: 80, draw(ctx, u, team, dark, atk, R) {
    const T = now(), mv = u.moving, fl = Math.sin(T * 3), st = mv ? Math.sin(u.walk * 0.8) : 0;
    const C1 = '#6a9ad8', C2 = '#4a6aa8', C3 = '#cfe6ff';
    // aile arrière
    ctx.save(); ctx.translate(-6, -50); ctx.rotate(-0.3 + fl * 0.2);
    blob(ctx, 'rgba(190,230,255,0.75)', () => { ctx.moveTo(0, 0); ctx.lineTo(-30, -34); ctx.lineTo(-24, -14); ctx.lineTo(-40, -10); ctx.lineTo(-20, 4); }, 1.2);
    ctx.restore();
    for (const [x, d] of [[-16, -1], [10, 1]]) { const dx = d * st * 4; limb(ctx, [x, -24, x + dx - 2, -10, x + dx + 3, -1], 5, C2); }
    blob(ctx, C2, () => { ctx.moveTo(-26, -32); ctx.quadraticCurveTo(-46, -26 + fl * 2, -54, -12); ctx.quadraticCurveTo(-40, -20, -22, -24); }, 1.2);
    blob(ctx, C1, () => { ctx.moveTo(-28, -28); ctx.quadraticCurveTo(-26, -50, 0, -52); ctx.quadraticCurveTo(20, -50, 22, -34); ctx.quadraticCurveTo(14, -20, -4, -20); ctx.quadraticCurveTo(-24, -20, -28, -28); }, 1.5);
    ctx.fillStyle = C3; ctx.beginPath(); ctx.moveTo(-20, -25); ctx.quadraticCurveTo(0, -18, 18, -30); ctx.quadraticCurveTo(0, -24, -20, -25); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(-22 + i * 7, -50 + Math.abs(i - 3) * 0.8); cristal(ctx, 6 + (i % 2) * 3, 2); ctx.restore(); }
    blob(ctx, team, () => { ctx.moveTo(-6, -51); ctx.lineTo(2, -51); ctx.lineTo(3, -22); ctx.lineTo(-5, -21); }, 1);
    for (const [x, d] of [[-10, 1], [14, -1]]) { const dx = d * st * 4; limb(ctx, [x, -24, x + dx + 2, -10, x + dx + 6, -1], 5.5, C1); }
    // cou et tête
    limb(ctx, [14, -42, 26, -58, 34, -62], 9, C1);
    ctx.save(); ctx.translate(36, -62); ctx.rotate(0.15 + atk * 0.2);
    blob(ctx, C1, () => { ctx.moveTo(-6, -6); ctx.quadraticCurveTo(8, -10, 18, -3); ctx.lineTo(18, 1); ctx.quadraticCurveTo(6, 5, -6, 5); }, 1.3);
    blob(ctx, C2, () => { ctx.moveTo(-2, 2); ctx.lineTo(16, 2 + atk * 5); ctx.lineTo(14, 5 + atk * 5); ctx.lineTo(-2, 6); }, 1);
    disc(ctx, 6, -3, 1.8, '#e8f8ff', 0.8); disc(ctx, 6.4, -3, 0.8, INK);
    for (const d of [-1, 1]) blob(ctx, C3, () => { ctx.moveTo(-3, -5); ctx.lineTo(-10, -12 - d * 2); ctx.lineTo(-1, -3); }, 0.9);
    if (atk > 0.2) halo(ctx, 20, 2, 14, '220,245,255', atk);
    R.crown(ctx, 2, -13);
    ctx.restore();
    // aile avant
    ctx.save(); ctx.translate(-2, -48); ctx.rotate(-0.15 - fl * 0.25);
    blob(ctx, 'rgba(210,240,255,0.85)', () => { ctx.moveTo(0, 0); ctx.lineTo(-22, -40); ctx.lineTo(-16, -18); ctx.lineTo(-34, -16); ctx.lineTo(-14, 2); }, 1.3);
    line(ctx, [0, 0, -22, -40], GLACE_D, 1.4);
    ctx.restore();
  } };

  /* -------------------------------------------------------------- tourelles */
  A.turrets['baliste-givre'] = function (ctx, a, team) {
    blob(ctx, GLACE_D, () => { ctx.moveTo(-11, 8); ctx.lineTo(-7, -1); ctx.lineTo(7, -1); ctx.lineTo(11, 8); }, 1.2);
    line(ctx, [-9, 4, 9, 4], team, 2);
    ctx.save(); ctx.translate(0, -5);
    rect(ctx, -12, -2, 22, 4, '#8a6a4a', 1);
    ctx.beginPath(); ctx.moveTo(4, -12); ctx.quadraticCurveTo(-2 - a * 3, 0, 4, 12); ctx.strokeStyle = GLACE; ctx.lineWidth = 3.4; ctx.stroke();
    line(ctx, [4, -12, -8 + a * 10, 0, 4, 12], '#f3ead2', 0.8);
    if (a < 0.5) { ctx.save(); ctx.translate(12, 0); ctx.rotate(Math.PI / 2); cristal(ctx, 10, 2.4); ctx.restore(); }
    ctx.restore();
  };
  A.turrets['canon-neige'] = function (ctx, a, team) {
    rect(ctx, -11, 0, 22, 8, '#8a6a4a', 1.2); line(ctx, [-11, 4, 11, 4], team, 2);
    ctx.save(); ctx.translate(0, -2 + a * 2); ctx.rotate(-0.6);
    blob(ctx, GLACE_D, () => { ctx.moveTo(-6, 3); ctx.lineTo(-7, -16); ctx.lineTo(7, -16); ctx.lineTo(6, 3); }, 1.3);
    for (const y of [-13, -5]) line(ctx, [-7, y, 7, y], BLEU, 1.8);
    oval(ctx, 0, -16, 7, 2.2, '#ffffff', 1);
    ctx.restore();
    if (a > 0.3) K.puffs(ctx, 6, -16, { n: 3, speed: 1, rise: 10, drift: 8, r0: 2, r1: 5, rgb: '255,255,255', a: 0.7 * a });
  };
  A.turrets['souffle-polaire'] = function (ctx, a, team) {
    const T = now();
    rect(ctx, -9, -2, 18, 10, '#9aa8b8', 1.2); line(ctx, [-9, 3, 9, 3], team, 2);
    blob(ctx, GLACE, () => { ctx.moveTo(-8, -2); ctx.quadraticCurveTo(-10, -16, 0, -18); ctx.quadraticCurveTo(10, -16, 8, -2); }, 1.2);
    disc(ctx, 3, -10, 3, BLEU, 1);
    if (a > 0) K.puffs(ctx, 6, -10, { n: 4, speed: 1.4, rise: 4, drift: 22, r0: 2, r1: 7, rgb: '230,248,255', a: 0.8 * a });
    disc(ctx, -2 + Math.sin(T * 3), -14, 1, '#ffffff');
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.glacon = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir + Math.PI / 2);
    ctx.fillStyle = 'rgba(220,245,255,0.35)'; ctx.fillRect(-1.5, 3, 3, 14);
    cristal(ctx, 11, 2.6);
  };
  A.projectiles['boule-neige'] = function (ctx, p) {
    halo(ctx, p.x, p.y, 14, '220,240,255', 0.4);
    disc(ctx, p.x, p.y, 7, '#ffffff', 1.2); disc(ctx, p.x - 2, p.y - 2, 2.4, GLACE);
  };
  A.projectiles.givre = function (ctx, p) {
    K.puffs(ctx, p.x, p.y, { n: 3, speed: 1.5, rise: 4, drift: -10, r0: 3, r1: 6, rgb: '230,248,255', a: 0.8 });
    disc(ctx, p.x, p.y, 3, GLACE_L);
  };
  A.drops.grelon = function (ctx, d) {
    ctx.fillStyle = 'rgba(220,245,255,0.3)'; ctx.fillRect(d.x - 1.5, d.y - 40, 3, 36);
    ctx.save(); ctx.translate(d.x, d.y - 3); ctx.rotate(d.y * 0.05); K.stone(ctx, 5, GLACE, GLACE_L); ctx.restore();
  };
  A.drops.neige = function (ctx, d) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(d.x - 16, d.y); ctx.lineTo(d.x - 6, d.y - 80); ctx.lineTo(d.x + 6, d.y - 80); ctx.lineTo(d.x + 16, d.y); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(d.x, d.y - 8); ctx.rotate(d.y * 0.02); K.stone(ctx, 18, '#ffffff', GLACE); ctx.restore();
  };

  /* -------------------------------------------------------------------- base */
  // Forteresse de glace : tours de cristal, remparts de neige tassée, porte sombre, bannière.
  A.bases.glace = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    halo(ctx, 50, G - 90, 110, '200,235,255', 0.3);
    blob(ctx, '#e8f2fa', () => { ctx.moveTo(-4, G); ctx.lineTo(-4, G - 96); for (let x = -4; x <= 104; x += 12) { ctx.lineTo(x, G - 96); ctx.lineTo(x, G - 104); ctx.lineTo(x + 6, G - 104); ctx.lineTo(x + 6, G - 96); } ctx.lineTo(104, G); }, 1.5);
    for (let y = G - 80; y < G; y += 18) line(ctx, [-2, y, 102, y + 2], '#c8dcea', 1.2);
    // tours de cristal
    for (const [x, h, w] of [[10, 170, 14], [50, 198, 18], [88, 150, 13]]) {
      blob(ctx, GLACE, () => { ctx.moveTo(x - w, G - 90); ctx.lineTo(x - w * 0.8, G - h + 26); ctx.lineTo(x, G - h); ctx.lineTo(x + w * 0.8, G - h + 26); ctx.lineTo(x + w, G - 90); }, 1.5);
      poly(ctx, [x, G - h, x + w * 0.8, G - h + 26, x + w, G - 90, x + w * 0.3, G - 90], 'rgba(90,150,210,0.3)');
      line(ctx, [x - w * 0.4, G - h + 40, x - w * 0.5, G - 100], GLACE_L, 2);
    }
    halo(ctx, 50, G - 196, 22, '220,245,255', 0.6 + 0.2 * Math.sin(T * 2));
    // porte
    blob(ctx, '#1e3a5a', () => { ctx.moveTo(36, G); ctx.lineTo(36, G - 34); ctx.quadraticCurveTo(50, G - 52, 64, G - 34); ctx.lineTo(64, G); }, 1.4);
    for (const x of [40, 46, 54, 60]) poly(ctx, [x - 2, G - 38 + Math.abs(x - 50) * 0.5, x, G - 28, x + 2, G - 38 + Math.abs(x - 50) * 0.5], GLACE, 0.8);
    // stalactites sur les créneaux
    for (let x = 0; x < 100; x += 9) poly(ctx, [x, G - 96, x + 2, G - 86 - (x % 3) * 2, x + 4, G - 96], GLACE_L);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; poly(ctx, [78 - s * 2, y - 1, 106, y - 2.5, 110, y + 1, 106, y + 4.5, 78 - s * 2, y + 4.5], GLACE_D, 1.3); }
    const wv = Math.sin(T * 2.4 + side) * 2;
    line(ctx, [50, G - 198, 50, G - 236], INK, 4); line(ctx, [50, G - 198, 50, G - 236], '#c8d8e8', 2.2);
    blob(ctx, team, () => { ctx.moveTo(50, G - 234); ctx.quadraticCurveTo(64, G - 236 + wv, 76, G - 230 + wv); ctx.lineTo(72, G - 222 + wv); ctx.lineTo(78, G - 216 + wv); ctx.quadraticCurveTo(62, G - 212 + wv, 50, G - 214); }, 1.2);
  };

  /* ------------------------------------------------------------------ décor */
  A.backdrops.glace = backdrop('glace', 9127, (g, r) => {
    sky(g, [[0, '#4a6a9a'], [0.4, '#8ab0d8'], [0.85, '#d8eaf6'], [1, '#f2f8fc']]);
    // aurore boréale
    for (let i = 0; i < 3; i++) {
      const y0 = 90 + i * 40, gr = g.createLinearGradient(0, y0 - 40, 0, y0 + 60);
      gr.addColorStop(0, 'rgba(120,255,200,0)'); gr.addColorStop(0.5, `rgba(${i ? '150,200,255' : '120,255,200'},0.3)`); gr.addColorStop(1, 'rgba(120,255,200,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(-40, y0); for (let x = -40; x <= W + 40; x += 20) g.lineTo(x, y0 + Math.sin(x * 0.006 + i * 2) * 30); g.lineTo(W + 40, y0 + 80); g.lineTo(-40, y0 + 80); g.closePath(); g.fill();
    }
    // glaciers lointains
    const glacier = (x, w, h, col) => { poly(g, [x - w, 540, x - w * 0.4, 540 - h, x - w * 0.1, 540 - h * 0.85, x + w * 0.3, 540 - h * 1.05, x + w, 540], col); poly(g, [x + w * 0.3, 540 - h * 1.05, x + w, 540, x + w * 0.4, 540], 'rgba(60,110,170,0.22)'); };
    glacier(240, 200, 170, '#c8dcf0'); glacier(760, 280, 230, '#b8d0ea'); glacier(1160, 200, 150, '#c8dcf0');
  }, (f, r) => {
    const h1 = x => 545 - Math.sin(x * 0.005 + 1) * 20 - Math.sin(x * 0.016) * 7;
    const h2 = x => 574 - Math.sin(x * 0.008 + 2.2) * 12 - Math.sin(x * 0.02 + 1) * 4;
    hills(f, h1, 0, '#dce8f2');
    // sapins enneigés
    for (let i = 0; i < 24; i++) { const x = r() * W, y = h1(x) + 6, h = 22 + r() * 26; poly(f, [x - h * 0.3, y, x, y - h, x + h * 0.3, y], '#3a5a5a'); poly(f, [x - h * 0.18, y - h * 0.45, x, y - h, x + h * 0.18, y - h * 0.45], '#ffffff'); }
    hills(f, h2, 0, '#eaf2f8');
    const sg = f.createLinearGradient(0, GROUND, 0, GROUND + 120); sg.addColorStop(0, '#f4f8fb'); sg.addColorStop(1, '#c8d8e6');
    f.fillStyle = sg; f.fillRect(-40, GROUND, W + 80, 160);
    for (let i = 0; i < 26; i++) { const x = r() * W, y = GROUND + 16 + r() * 90; oval(f, x, y, 14 + r() * 22, 3, 'rgba(140,180,220,0.3)'); }
    for (let i = 0; i < 14; i++) { const x = r() * W, y = GROUND + 24 + r() * 80; f.save(); f.translate(x, y); cristal(f, 6 + r() * 6, 2); f.restore(); }
    f.fillStyle = '#ffffff'; f.fillRect(-40, GROUND, W + 80, 5);
    f.fillStyle = GLACE_D; f.fillRect(-40, GROUND + 5, W + 80, 1.2);
  }, null, (ctx) => {
    const T = now();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 40; i++) { const k = (T * 0.07 + i * 0.37) % 1; ctx.beginPath(); ctx.arc((i * 131 + Math.sin(T * 0.8 + i) * 24 + T * 10) % W, k * GROUND, 1.2 + (i % 3) * 0.6, 0, TAU); ctx.fill(); }
  });

  /* ------------------------------------------------- le phénomène : l'hiver tombe */
  A.phen.glace = function (ctx, b, P, T) {
    const s = P.s;
    ctx.fillStyle = `rgba(220,240,255,${0.08 * s})`; ctx.fillRect(0, 0, W, GROUND);
    // la neige recouvre le sol
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(-40, GROUND + 3);
    for (let x = -40; x <= W + 40; x += 18) ctx.lineTo(x, GROUND - s * 2 - Math.abs(Math.sin(x * 0.05)) * s * 1.5);
    ctx.lineTo(W + 40, GROUND + 3); ctx.closePath(); ctx.fill();
    // flocons, de plus en plus serrés et de travers
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 40 * s; i++) { const k = (T * (0.08 + s * 0.03) + i * 0.173) % 1; ctx.beginPath(); ctx.arc((i * 97 - T * 40 * s + Math.sin(T + i) * 10) % (W + 80) + 40, k * GROUND, 1 + (i % 3) * 0.7, 0, TAU); ctx.fill(); }
    // le blizzard
    if (P.x != null) {
      const x0 = P.x, x1 = W - PA.CONFIG.world.baseWidth + 10, c = P.fin;
      ctx.fillStyle = `rgba(235,248,255,${0.9 * (1 - c * 0.6)})`; ctx.beginPath(); ctx.moveTo(x0, GROUND + 4);
      for (let x = x0; x <= x1; x += 14) ctx.lineTo(x, GROUND - 7 - Math.abs(Math.sin(x * 0.04)) * 4);
      ctx.lineTo(x1, GROUND + 4); ctx.closePath(); ctx.fill();
      if (P.etat === 'vague') {
        const g = ctx.createLinearGradient(x0 - 30, 0, x0 + 160, 0);
        g.addColorStop(0, 'rgba(240,250,255,0)'); g.addColorStop(0.25, 'rgba(240,250,255,0.85)'); g.addColorStop(1, 'rgba(240,250,255,0.25)');
        ctx.fillStyle = g; ctx.fillRect(x0 - 30, GROUND - 200, 190, 200);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.4; ctx.beginPath();
        for (let i = 0; i < 30; i++) { const y = GROUND - (i * 37 + T * 90) % 200, x = x0 + (i * 53) % 170; ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 4); }
        ctx.stroke();
      }
    }
  };
})();

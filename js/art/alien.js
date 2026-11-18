/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE EXTRA-TERRESTRE
   Monde violet, géante gazeuse, champignons lumineux, ruche organique.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, IVORY, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, arm, fist, swing, aim, puffs, halo, backdrop, sky, hills, starfield, flock } = K;
  const GREEN = '#8fd6a0', GREY = '#b8c0c8', LILAC = '#c3a6e0', GLOW = '#8dff7a', CHITIN = '#4a2a5e', CHITIN_L = '#6a3f80', CHITIN_D = '#33193f', PSI = '#d49bff';

  /* ------------------------------------------------------------------ unités */
  function alienHead(c, a, color, big) {
    const { hx, hy } = a, s = big || 1;
    blob(c, color, () => { c.moveTo(hx - 6.4 * s, hy - 2 * s); c.quadraticCurveTo(hx - 7 * s, hy - 11 * s, hx + 0.6, hy - 11 * s); c.quadraticCurveTo(hx + 8 * s, hy - 10.4 * s, hx + 7.4 * s, hy - 1.6 * s); c.quadraticCurveTo(hx + 6.4 * s, hy + 4.6, hx + 2.6, hy + 6.4); c.quadraticCurveTo(hx - 3, hy + 5.6, hx - 6.4 * s, hy - 2 * s); }, 1.3);
    c.save(); c.translate(hx + 3.6 * s, hy - 1.2); c.rotate(0.42); oval(c, 0, 0, 3.7 * s, 2.1 * s, '#111018', 0.8); disc(c, -1 * s, -0.7 * s, 0.8 * s, 'rgba(255,255,255,0.8)'); c.restore();
    line(c, [hx + 3, hy + 3.6, hx + 5.2, hy + 3.4], 'rgba(20,10,30,0.6)', 0.9);
    line(c, [hx - 3.6 * s, hy - 6 * s, hx - 1 * s, hy - 9 * s], 'rgba(255,255,255,0.35)', 1.2);
  }
  // Rôdeur : carapace d'équipe, épines dorsales, griffes.
  A.units.rodeur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      skin: GREEN, body: team, boots: dk(GREEN, 0.7), sleeve: GREEN, face: false, headColor: GREEN,
      back(c, a) { for (const [x, y, r] of [[-5, -30, -0.9], [-5.6, -25, -1.2], [-5.6, -20, -1.5]]) { c.save(); c.translate(x * a.k, y + a.ty); c.rotate(r); poly(c, [-1.6, 0, 0, -6.4, 1.6, 0], dark, 0.9); c.restore(); } },
      over(c, a) { c.strokeStyle = dark; c.lineWidth = 1.2; c.beginPath(); for (const y of [-28, -24, -20]) { c.moveTo(-5 * a.k, y + a.ty); c.quadraticCurveTo(0.6, y + 2 + a.ty, 6 * a.k, y - 0.4 + a.ty); } c.stroke(); disc(c, 1, -30 + a.ty, 1.4, GLOW); },
      head(c, a) { alienHead(c, a, GREEN, 0.9); },
      arm(c, a) { swing(c, a, (cc, pr) => {
        for (const dx of [-2.4, 0, 2.4]) blob(cc, '#e6f6d0', () => { cc.moveTo(dx - 1, 0); cc.quadraticCurveTo(dx + 1.6, -6, dx + 0.4, -11.5); cc.quadraticCurveTo(dx + 2.6, -6, dx + 1.2, 0); }, 0.8);
        if (pr > 0.3 && pr < 0.75) { cc.strokeStyle = 'rgba(200,255,190,0.7)'; cc.lineWidth = 1.6; cc.beginPath(); cc.arc(0, 2, 13, -2.2, -0.9); cc.stroke(); }
      }, { sleeve: GREEN, rest: [0.6, 5, 5], back: [-1.1, 0.5, -6], hit: [2.0, 9.5, 3] }); },
    }, R);
  } };
  // Tireur gris : grosse tête, combinaison d'équipe, pistolet à rayons.
  A.units['tireur-gris'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      skin: GREY, body: team, legs: team, boots: dark, sleeve: team, belt: '#d6dce6', face: false, headColor: GREY,
      over(c, a) { poly(c, [-3.6, -32 + a.ty, 4.6, -32.4 + a.ty, 0.6, -26.6 + a.ty], '#d6dce6', 0.9); disc(c, 0.6, -22.6 + a.ty, 1.5, GLOW); },
      head(c, a) { alienHead(c, a, GREY, 1.12); },
      arm(c, a) { aim(c, a, (cc, k) => {
        rect(cc, -2, 0, 3.6, 6, '#5a5f6e', 0.8);
        blob(cc, '#d6dce6', () => { cc.moveTo(-5, -1.4); cc.quadraticCurveTo(4, -6, 12, -2.4); cc.lineTo(12, 1.4); cc.quadraticCurveTo(4, 4, -5, 1.6); }, 1);
        for (const x of [5.4, 8.6]) rect(cc, x, -3.6, 1.6, 6.4, GLOW);
        rect(cc, 12, -1.3, 6.4, 2.6, '#5a5f6e', 0.8); halo(cc, 19.5, 0, 3.6 + k * 8, '141,255,122', 0.5 + k * 0.5); disc(cc, 19.5, 0, 1.8 + k * 1.6, k > 0.2 ? '#ffffff' : GLOW, 0.7);
      }, { sleeve: team, y: 4, kick: 1.5, glove: GREY }); },
    }, R);
  } };
  // Psion (élite) : lévite, crâne énorme aux veines lumineuses, orbe psychique.
  A.units.psion = { h: 54, top: 66, draw(ctx, u, team, dark, atk) {
    const T = now(), bob = Math.sin(T * 2.4 + u.x * 0.05) * 2.4, y0 = -8 + bob, fl = Math.sin(T * 3 + u.x) * 1.6;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    halo(ctx, 0, -2, 14, '212,155,255', 0.35); oval(ctx, 0, -1, 9 - bob * 0.6, 2, 'rgba(212,155,255,0.45)');
    limb(ctx, [-3, -30 + y0, -8, -24 + y0, -9, -17 + y0], 2.4, dk(LILAC, 0.8));
    // robe d'équipe effilée
    blob(ctx, team, () => { ctx.moveTo(-6, -34 + y0); ctx.quadraticCurveTo(0, -37 + y0, 6.6, -34 + y0); ctx.quadraticCurveTo(9, -16 + y0, 5 + fl, -2 + y0); ctx.lineTo(1.6 + fl, -6 + y0); ctx.lineTo(-1.6 + fl, 0 + y0); ctx.lineTo(-4 + fl * 0.6, -6 + y0); ctx.quadraticCurveTo(-9, -16 + y0, -6, -34 + y0); });
    line(ctx, [0.4, -34 + y0, 0.8 + fl * 0.4, -8 + y0], dark, 1.2); poly(ctx, [-4, -35 + y0, 5, -35.4 + y0, 0.6, -28 + y0], '#f3e6ff', 0.9);
    rect(ctx, -1.2, -39 + y0, 3, 4.6, LILAC, 0.9);
    // crâne
    const hy = -50 + y0;
    halo(ctx, 0.6, hy - 2, 18 + atk * 6, '212,155,255', 0.3 + atk * 0.3);
    blob(ctx, LILAC, () => { ctx.moveTo(-7, hy + 4); ctx.quadraticCurveTo(-13, hy - 4, -9.6, hy - 12); ctx.quadraticCurveTo(-3, hy - 18.6, 5, hy - 16); ctx.quadraticCurveTo(13, hy - 12, 11.6, hy - 2); ctx.quadraticCurveTo(10, hy + 5.6, 4, hy + 8.6); ctx.quadraticCurveTo(-3, hy + 8.6, -7, hy + 4); }, 1.4);
    ctx.strokeStyle = `rgba(245,220,255,${0.6 + Math.sin(T * 5 + u.x) * 0.3})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-7.6, hy - 6); ctx.quadraticCurveTo(-3, hy - 9, -1, hy - 4); ctx.moveTo(-3, hy - 14); ctx.quadraticCurveTo(2, hy - 12, 2.6, hy - 7); ctx.moveTo(5.6, hy - 14); ctx.quadraticCurveTo(8.6, hy - 10, 6.4, hy - 6); ctx.stroke();
    ctx.save(); ctx.translate(6, hy + 0.6); ctx.rotate(0.42); oval(ctx, 0, 0, 3.8, 2.2, '#111018', 0.8); disc(ctx, -1, -0.7, 0.8, PSI); ctx.restore();
    // bras tendu et orbe
    const hx = 9 + atk * 3, hy2 = -30 + y0 - atk * 2;
    limb(ctx, [3.4, -31 + y0, 6.4, -28 + y0, hx, hy2], 2.4, LILAC);
    halo(ctx, hx + 4.6, hy2 - 3, 8 + atk * 9, '212,155,255', 0.55 + atk * 0.4); disc(ctx, hx + 4.6, hy2 - 3, 3.4 + atk * 2, '#f3e6ff', 0.8);
    ctx.strokeStyle = 'rgba(212,155,255,0.8)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(hx + 4.6, hy2 - 3, 6.4 + atk * 3, 2.4, T * 3, 0, TAU); ctx.stroke();
  } };

  // Tripode : coque en soucoupe sur trois longues pattes, œil-rayon. o : crown
  function tripod(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving, ph = u.walk * 0.6, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 2 : -Math.sin(T * 1.6 + u.x * 0.04) * 0.8;
    const M = o.crown ? '#5a3f72' : '#6a5a7a', MD = dk(M, 0.7), trim = o.crown ? '#f2c230' : GLOW;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (x0, fx, lift, col, w) => { const kx = (x0 + fx) / 2 + (fx > x0 ? 7 : -7), ky = -32 + b * 0.5 - lift; limb(ctx, [x0, -56 + b, kx, ky, fx, -lift], w, col); disc(ctx, kx, ky, 2.6, trim, 0.9); blob(ctx, MD, () => { ctx.moveTo(fx - 4.6, -lift); ctx.lineTo(fx, -5 - lift); ctx.lineTo(fx + 4.6, -lift); }, 1); };
    leg(2, 5 + st * 4, mv ? Math.max(0, Math.cos(ph + 2)) * 3 : 0, MD, 3.4);
    // câbles pendants
    for (const [x, len, k] of [[-10, 18, 1], [-4, 24, 2], [8, 20, 3]]) { ctx.strokeStyle = MD; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, -55 + b); ctx.quadraticCurveTo(x + Math.sin(T * 2 + k) * 4, -55 + b + len * 0.6, x + Math.sin(T * 2 + k + 1) * 5, -55 + b + len); ctx.stroke(); }
    leg(-8, -24 + st * 6, mv ? Math.max(0, -Math.cos(ph)) * 4 : 0, M, 4); leg(9, 22 - st * 6, mv ? Math.max(0, Math.cos(ph)) * 4 : 0, M, 4);
    // coque
    oval(ctx, 0, -60 + b, 27, 10.5, M, 1.6);
    ctx.fillStyle = MD; ctx.beginPath(); ctx.ellipse(0, -57 + b, 25, 7, 0, 0, Math.PI); ctx.fill();
    for (const x of [-18, -9, 0, 9, 18]) disc(ctx, x, -56.4 + b + Math.abs(x) * 0.06, 1.5, trim);
    blob(ctx, team, () => { ctx.moveTo(-15, -64 + b); ctx.quadraticCurveTo(-13, -78 + b, 0, -78.6 + b); ctx.quadraticCurveTo(13, -78 + b, 15, -64 + b); ctx.quadraticCurveTo(0, -60 + b, -15, -64 + b); }, 1.5);
    line(ctx, [-9, -71 + b, -4.6, -76 + b], 'rgba(255,255,255,0.5)', 1.6); line(ctx, [-14.6, -66.6 + b, 14.6, -66.6 + b], dark, 1.4);
    // bras-rayon
    const px = atk * 9;
    limb(ctx, [16, -58 + b, 24 + px * 0.5, -52 + b, 30 + px, -53 + b], 3.4, MD);
    halo(ctx, 33 + px, -53 + b, 6 + atk * 12, '141,255,122', 0.5 + atk * 0.5); disc(ctx, 33 + px, -53 + b, 3.4 + atk * 2, atk > 0.3 ? '#ffffff' : GLOW, 1);
    halo(ctx, 17, -61 + b, 7, '141,255,122', 0.6); disc(ctx, 17, -61 + b, 3.6, GLOW, 1); disc(ctx, 18, -61.6 + b, 1.3, '#111018');
    if (o.crown) R.crown(ctx, 0, -84 + b);
  }
  K.alienHead = alienHead;
  A.units.tripode = { h: 84, draw(ctx, u, team, dark, atk, R) { tripod(ctx, u, team, dark, atk, {}, R); } };
  A.units['tripode-imperial'] = { h: 84, draw(ctx, u, team, dark, atk, R) { tripod(ctx, u, team, dark, atk, { crown: true }, R); } };

  /* -------------------------------------------------------------- base : ruche */
  A.bases.hive = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // spores qui montent
    for (let i = 0; i < 6; i++) { const ph = (T * 0.12 + i / 6) % 1; halo(ctx, 10 + i * 12 + Math.sin(ph * 8 + i) * 5, G - 60 - ph * 150, 4, '141,255,122', 0.7 * (1 - ph)); }
    // bulbes de chitine
    blob(ctx, CHITIN_D, () => { ctx.moveTo(40, G); ctx.quadraticCurveTo(38, G - 80, 62, G - 86); ctx.quadraticCurveTo(84, G - 80, 80, G); }, 1.6);
    blob(ctx, CHITIN, () => { ctx.moveTo(-14, G); ctx.lineTo(-14, G - 110); ctx.quadraticCurveTo(-6, G - 168, 22, G - 186); ctx.quadraticCurveTo(26, G - 192, 30, G - 186); ctx.quadraticCurveTo(58, G - 166, 62, G - 100); ctx.quadraticCurveTo(66, G - 40, 58, G); }, 1.8);
    ctx.fillStyle = CHITIN_L; ctx.beginPath(); ctx.moveTo(-10, G - 110); ctx.quadraticCurveTo(-2, G - 160, 22, G - 180); ctx.quadraticCurveTo(6, G - 150, 2, G - 100); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,8,30,0.4)'; ctx.lineWidth = 1.3; for (const yy of [40, 76, 112, 146]) { ctx.beginPath(); ctx.moveTo(-14, G - yy - 6); ctx.quadraticCurveTo(24, G - yy + 8, 62 - yy * 0.06, G - yy - 4); ctx.stroke(); }
    // pores lumineux
    for (const [x, y, r] of [[4, G - 60, 3.6], [26, G - 96, 4.4], [46, G - 70, 3.4], [8, G - 124, 3], [40, G - 132, 3.6], [24, G - 156, 3], [66, G - 50, 3], [70, G - 26, 2.6], [50, G - 104, 2.6]]) { halo(ctx, x, y, r * 3, '141,255,122', 0.45 + Math.sin(T * 2 + x) * 0.15); disc(ctx, x, y, r, GLOW, 0.9); disc(ctx, x - r * 0.3, y - r * 0.3, r * 0.34, '#eaffe4'); }
    // entrée : membrane et crocs
    const mg = ctx.createRadialGradient(26, G - 10, 2, 26, G - 10, 40); mg.addColorStop(0, '#9cff5a'); mg.addColorStop(0.35, '#3f7a3a'); mg.addColorStop(1, '#140a1c');
    blob(ctx, mg, () => { ctx.moveTo(8, G); ctx.quadraticCurveTo(6, G - 46, 26, G - 50); ctx.quadraticCurveTo(46, G - 46, 44, G); }, 1.8);
    ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.8; for (const [x, y, r] of [[12, G - 38, 2.5], [20, G - 47, 2.9], [32, G - 47, 3.4], [40, G - 38, 3.9]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-2.4, 0); ctx.lineTo(0, -8); ctx.lineTo(2.4, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // sac lumineux aux couleurs de l'équipe, tentacules
    const pul = 1 + Math.sin(T * 2.6) * 0.06;
    halo(ctx, 26, G - 78, 20, '255,255,255', 0.18); oval(ctx, 26, G - 78, 11 * pul, 13 * pul, team, 1.5); oval(ctx, 22.6, G - 83, 3.4, 4.6, 'rgba(255,255,255,0.45)');
    ctx.strokeStyle = dark; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(18, G - 72); ctx.quadraticCurveTo(26, G - 66, 34, G - 73); ctx.stroke();
    for (const [x, len, k] of [[-10, 30, 1], [56, 26, 2], [70, 20, 3]]) { const sw = Math.sin(T * 1.6 + k) * 5; ctx.beginPath(); ctx.moveTo(x, G - 96 + k * 14); ctx.quadraticCurveTo(x + 10 + sw, G - 96 + k * 14 - len * 0.5, x + 4 + sw * 1.6, G - 96 + k * 14 - len); ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.stroke(); ctx.strokeStyle = CHITIN_L; ctx.lineWidth = 2.4; ctx.stroke(); }
    // consoles fongiques des tourelles
    limb(ctx, [93, G, 91, G - 60, 95, G - 138], 5, CHITIN);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; blob(ctx, CHITIN_L, () => { ctx.moveTo(76, y + 1); ctx.quadraticCurveTo(93, y - 5, 110, y + 1); ctx.quadraticCurveTo(93, y + 7, 76, y + 1); }, 1.2); for (const x of [82, 93, 104]) disc(ctx, x, y + 2.2, 1.1, GLOW); }
    // membrane-étendard au sommet
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [26, G - 188, 26, G - 222], 1.8, CHITIN_L);
    blob(ctx, team, () => { ctx.moveTo(26, G - 221); ctx.quadraticCurveTo(40, G - 223 + wv, 50, G - 214 + wv); ctx.quadraticCurveTo(42, G - 210 + wv * 0.6, 46, G - 202 + wv * 0.5); ctx.quadraticCurveTo(36, G - 200 + wv * 0.4, 26, G - 204); });
    disc(ctx, 35, G - 212 + wv * 0.4, 2.6, GLOW);
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets['tourelle-rayons'] = function (ctx, a, team) {
    blob(ctx, CHITIN_L, () => { ctx.moveTo(-11, 8); ctx.quadraticCurveTo(-11, -12, 0, -12.6); ctx.quadraticCurveTo(11, -12, 11, 8); }, 1.3);
    rect(ctx, -10.6, 1.6, 21.2, 2.4, team); disc(ctx, -5, -6, 1.3, GLOW); disc(ctx, -1, -9, 1, GLOW);
    rect(ctx, 5, -9, 14 - a * 2, 4.6, CHITIN_D, 1);
    halo(ctx, 20 - a * 2, -6.8, 4 + a * 10, '141,255,122', 0.5 + a * 0.5); disc(ctx, 20 - a * 2, -6.8, 2.6 + a * 1.6, a > 0 ? '#ffffff' : GLOW, 0.8);
  };
  A.turrets['canon-antimatiere'] = function (ctx, a, team) {
    rect(ctx, -11, -11, 13, 18, CHITIN_D, 1.2); rect(ctx, -11, -2, 13, 2.4, team);
    ctx.save(); ctx.translate(-a * 3, 0);
    rect(ctx, 1, -9, 22, 7.4, CHITIN, 1.1); for (let i = 0; i < 3; i++) rect(ctx, 5 + i * 5.4, -11, 2.4, 11.4, '#c08dff', 0.8);
    ctx.restore();
    halo(ctx, 25 - a * 3, -5.4, 5 + a * 9, '192,141,255', 0.5 + a * 0.5); disc(ctx, 25 - a * 3, -5.4, 3 + a * 1.4, '#1a0f26', 0.9); disc(ctx, 25 - a * 3, -5.4, 1.1, '#ffffff');
  };
  A.turrets['cracheur-spores'] = function (ctx, a, team) {
    limb(ctx, [-4, 8, -6, 0, -2, -3], 3.4, CHITIN); line(ctx, [-8.6, 4, -4.4, 3], team, 2.4);
    ctx.save(); ctx.translate(-1, -4); ctx.rotate(-0.62);
    oval(ctx, 7, 0, 12.6, 7.6 + a, '#6a3a7a', 1.3); for (const [x, y] of [[2, -3], [8, 3], [10, -3.4]]) disc(ctx, x, y, 1.2, GLOW);
    oval(ctx, 18.6, 0, 2.6 + a * 1.4, 4.6 + a, '#2a1436', 0.9); halo(ctx, 19, 0, 5 + a * 8, '156,255,90', 0.4 + a * 0.5);
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.ray = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(141,255,122,0.3)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.strokeStyle = GLOW; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#f4fff0'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.strokeStyle = 'rgba(141,255,122,0.8)'; ctx.lineWidth = 1.1; for (const x of [-8, -16]) { ctx.beginPath(); ctx.ellipse(x, 0, 1.6, 4.6, 0, 0, TAU); ctx.stroke(); }
  };
  A.projectiles.antimatter = function (ctx, p) {
    halo(ctx, p.x, p.y, 18, '192,141,255', 0.65);
    ctx.strokeStyle = 'rgba(226,200,255,0.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 4, p.x * 0.07, 0, TAU); ctx.stroke();
    disc(ctx, p.x, p.y, 6, '#170c22', 1); disc(ctx, p.x, p.y, 1.8, '#ffffff');
  };
  A.projectiles.spore = function (ctx, p) {
    halo(ctx, p.x, p.y, 14, '156,255,90', 0.5);
    disc(ctx, p.x, p.y, 6, '#6a3a7a', 1);
    for (let i = 0; i < 6; i++) { const an = i * 1.05 + p.x * 0.05; disc(ctx, p.x + Math.cos(an) * 6.6, p.y + Math.sin(an) * 6.6, 1.9, GLOW, 0.6); }
    disc(ctx, p.x - 1.6, p.y - 1.6, 1.6, 'rgba(255,255,255,0.4)');
  };
  A.projectiles.psi = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir); ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = `rgba(212,155,255,${0.95 - i * 0.2})`; ctx.lineWidth = 2.6 - i * 0.4; ctx.beginPath(); ctx.arc(-i * 7, 0, 5 + i * 3, -1.15, 1.15); ctx.stroke(); }
    halo(ctx, 3, 0, 7, '243,230,255', 0.8);
  };
  // Rayons d'abduction : la soucoupe et son faisceau.
  A.drops.saucer = function (ctx, d) {
    const r = d.radius * 0.42, y0 = 52;
    const g = ctx.createLinearGradient(0, y0, 0, d.y); g.addColorStop(0, 'rgba(141,255,122,0.5)'); g.addColorStop(1, 'rgba(141,255,122,0.12)');
    poly(ctx, [d.x - 9, y0, d.x + 9, y0, d.x + r, d.y, d.x - r, d.y], g);
    ctx.fillStyle = 'rgba(234,255,228,0.55)'; ctx.beginPath(); ctx.moveTo(d.x - 3, y0); ctx.lineTo(d.x + 3, y0); ctx.lineTo(d.x + r * 0.3, d.y); ctx.lineTo(d.x - r * 0.3, d.y); ctx.closePath(); ctx.fill();
    halo(ctx, d.x, d.y, r * 1.6, '141,255,122', 0.6);
    blob(ctx, '#7fe0a0', () => { ctx.moveTo(d.x - 12, y0 - 8); ctx.quadraticCurveTo(d.x, y0 - 24, d.x + 12, y0 - 8); }, 1.2);
    oval(ctx, d.x, y0 - 5, 28, 7.6, '#b8c0c8', 1.4); oval(ctx, d.x, y0 - 2.6, 18, 3, '#6a7078');
    for (const dx of [-18, -9, 0, 9, 18]) disc(ctx, d.x + dx, y0 - 5.6, 1.6, Math.sin(now() * 8 + dx) > 0 ? '#ffe36a' : GLOW);
  };

  /* -------------------------------------------------------------------- décor */
  function shroom(g, x, y, s, cap, glow) {
    g.strokeStyle = '#3a2452'; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(x, y + 4); g.quadraticCurveTo(x + 5 * s, y - 20 * s, x - 2 * s, y - 40 * s); g.stroke();
    const gl = g.createRadialGradient(x - 2 * s, y - 40 * s, 2, x - 2 * s, y - 40 * s, 40 * s); gl.addColorStop(0, `rgba(${glow},0.45)`); gl.addColorStop(1, `rgba(${glow},0)`);
    g.fillStyle = gl; g.beginPath(); g.arc(x - 2 * s, y - 40 * s, 40 * s, 0, TAU); g.fill();
    g.fillStyle = cap; g.beginPath(); g.moveTo(x - 24 * s, y - 38 * s); g.quadraticCurveTo(x - 2 * s, y - 70 * s, x + 20 * s, y - 38 * s); g.quadraticCurveTo(x - 2 * s, y - 32 * s, x - 24 * s, y - 38 * s); g.fill();
    g.fillStyle = `rgba(${glow},0.9)`; for (const [dx, dy, r] of [[-12, -44, 2.6], [-2, -52, 3.2], [8, -45, 2.4], [-6, -40, 1.8]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU); g.fill(); }
  }
  function crystal(g, x, base, w, hh, col, lit) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w / 2, base + 60); g.lineTo(x - w * 0.3, base - hh * 0.7); g.lineTo(x + w * 0.05, base - hh); g.lineTo(x + w * 0.4, base - hh * 0.62); g.lineTo(x + w / 2, base + 60); g.fill();
    g.fillStyle = lit; g.beginPath(); g.moveTo(x - w * 0.3, base - hh * 0.7); g.lineTo(x + w * 0.05, base - hh); g.lineTo(x - w * 0.04, base + 60); g.lineTo(x - w / 2, base + 60); g.fill();
  }
  A.backdrops.alien = backdrop('alien', 5151, (g, r) => {
    sky(g, [[0, '#0e0620'], [0.4, '#3a1560'], [0.72, '#8a3484'], [0.92, '#d6708a'], [1, '#f0a07a']]);
    starfield(g, r, 170, 400, '240,225,255');
    // géante gazeuse et ses lunes
    halo(g, 300, 180, 190, '120,240,150', 0.3);
    let gr = g.createRadialGradient(270, 150, 8, 300, 180, 96); gr.addColorStop(0, '#b6f0b0'); gr.addColorStop(0.6, '#5fc48a'); gr.addColorStop(1, '#2f7a6a');
    g.fillStyle = gr; g.beginPath(); g.arc(300, 180, 90, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(300, 180, 90, 0, TAU); g.clip();
    for (const [dy, hh, col] of [[-50, 12, 'rgba(47,122,106,0.5)'], [-18, 9, 'rgba(230,255,220,0.35)'], [14, 16, 'rgba(47,122,106,0.45)'], [48, 10, 'rgba(230,255,220,0.3)']]) { g.fillStyle = col; g.beginPath(); g.ellipse(300, 180 + dy, 96, hh, -0.12, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(14,6,32,0.4)'; g.beginPath(); g.arc(345, 210, 96, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#e6d6ff'; g.beginPath(); g.arc(470, 110, 14, 0, TAU); g.fill(); g.fillStyle = '#ffc9a8'; g.beginPath(); g.arc(1060, 230, 22, 0, TAU); g.fill(); g.fillStyle = 'rgba(14,6,32,0.3)'; g.beginPath(); g.arc(1068, 236, 20, 0, TAU); g.fill();
    // îles flottantes et aiguilles de cristal
    for (const [x, y, w] of [[690, 250, 90], [850, 190, 60], [1180, 300, 70]]) { g.fillStyle = '#5a2c78'; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); g.lineTo(x + w * 0.2, y + w * 0.5); g.lineTo(x - w * 0.1, y + w * 0.72); g.lineTo(x - w * 0.3, y + w * 0.36); g.fill(); g.fillStyle = '#7fe0a0'; g.fillRect(x - w / 2, y - 3, w, 4); }
    for (const [x, w, hh] of [[80, 70, 190], [180, 50, 130], [560, 80, 220], [640, 46, 150], [900, 70, 200], [990, 50, 120], [1230, 80, 210]]) crystal(g, x, 500, w, hh, '#5a2c78', '#7a3f9c');
    gr = g.createLinearGradient(0, 400, 0, 540); gr.addColorStop(0, 'rgba(240,160,122,0)'); gr.addColorStop(1, 'rgba(240,150,140,0.6)');
    g.fillStyle = gr; g.fillRect(-40, 400, W + 80, 220);
  }, (f, r) => {
    const h1 = x => 512 - Math.sin(x * 0.0044 + 5.1) * 26 - Math.sin(x * 0.013 + 1.9) * 8;
    const h2 = x => 566 - Math.sin(x * 0.0062 + 2.2) * 15 - Math.sin(x * 0.018 + 0.3) * 6;
    let gr = f.createLinearGradient(0, 480, 0, GROUND); gr.addColorStop(0, '#5a2a78'); gr.addColorStop(1, '#40205c');
    hills(f, h1, 0, gr);
    for (const [x, s, cap, glow] of [[60, 1.3, '#3fb8a0', '120,255,210'], [210, 0.9, '#b44ac0', '255,150,240'], [400, 1.1, '#3fb8a0', '120,255,210'], [760, 1.4, '#b44ac0', '255,150,240'], [1010, 1, '#3fb8a0', '120,255,210'], [1180, 1.2, '#b44ac0', '255,150,240']]) shroom(f, x, h1(x) + 2, s, cap, glow);
    hills(f, h2, 0, '#2fa890');
    gr = f.createLinearGradient(0, 550, 0, GROUND); gr.addColorStop(0, '#33184a'); gr.addColorStop(1, '#27123a');
    hills(f, h2, 4, gr);
    for (const [x, s, cap, glow] of [[140, 1.6, '#8dff7a', '160,255,140'], [520, 1.3, '#3fb8a0', '120,255,210'], [900, 1.7, '#8dff7a', '160,255,140'], [1250, 1.3, '#b44ac0', '255,150,240']]) shroom(f, x, h2(x) + 10, s, cap, glow);
    // tentacules-arbres
    f.strokeStyle = '#1e0e2e'; f.lineWidth = 4;
    for (const x of [330, 660, 1090]) for (const k of [-1, 0, 1]) { const y = h2(x) + 10; f.beginPath(); f.moveTo(x + k * 5, y); f.bezierCurveTo(x + k * 14, y - 20, x - k * 10, y - 34, x + k * 16, y - 52); f.stroke(); }
    // sol : chair violette, veines et pores lumineux
    gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#34184c'); gr.addColorStop(1, '#190a26');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    f.strokeStyle = 'rgba(141,255,122,0.22)'; f.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) { let x = r() * W, y = GROUND + 18 + r() * 84; f.beginPath(); f.moveTo(x, y); for (let k = 0; k < 3; k++) { x += 14 + r() * 22; y += (r() - 0.5) * 14; f.lineTo(x, y); } f.stroke(); }
    for (let i = 0; i < 34; i++) { const x = r() * W, y = GROUND + 18 + r() * 88, s = 1.6 + r() * 3; const gl = f.createRadialGradient(x, y, 0, x, y, s * 4); gl.addColorStop(0, 'rgba(141,255,122,0.55)'); gl.addColorStop(1, 'rgba(141,255,122,0)'); f.fillStyle = gl; f.beginPath(); f.arc(x, y, s * 4, 0, TAU); f.fill(); f.fillStyle = '#8dff7a'; f.beginPath(); f.ellipse(x, y, s, s * 0.6, 0, 0, TAU); f.fill(); }
    f.fillStyle = '#2fa890'; f.fillRect(-40, GROUND, W + 80, 7);
    f.beginPath(); for (let x = -40; x < W + 40; x += 9) { f.moveTo(x, GROUND + 6.5); f.lineTo(x + 4.5, GROUND + 10 + r() * 5); f.lineTo(x + 9, GROUND + 6.5); } f.fill();
    f.fillStyle = '#6fe0c0'; f.fillRect(-40, GROUND, W + 80, 2);
    f.strokeStyle = '#3fc8a8'; f.lineWidth = 1.4; f.beginPath(); for (let i = 0; i < 120; i++) { const x = r() * (W + 60) - 30, hh = 3 + r() * 6; f.moveTo(x, GROUND + 1); f.quadraticCurveTo(x + 3, GROUND - hh * 0.6, x + (r() - 0.5) * 6, GROUND - hh); } f.stroke();
  }, (ctx, t, dt) => {
    flock(ctx, t, dt, 'alien', '#b8c0c8', 4, (c, x, y, s, fl) => {           // soucoupes au loin
      c.fillStyle = 'rgba(141,255,122,0.8)'; c.beginPath(); c.ellipse(x, y - 3 * s, 6 * s, 5 * s, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#b8c0c8'; c.beginPath(); c.ellipse(x, y, 15 * s, 4 * s, 0, 0, TAU); c.fill();
      c.fillStyle = fl > 0 ? '#ffe36a' : '#8dff7a'; for (const dx of [-8, 0, 8]) { c.beginPath(); c.arc(x + dx * s, y + 0.5, 1.3 * s, 0, TAU); c.fill(); }
    });
  });
})();

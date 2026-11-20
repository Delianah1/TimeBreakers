/* =========================================================================
   GRAPHISMES — ÂGE CACHÉ DE L'ATLANTIDE (js/ages-caches.js pour les règles)
   Cité engloutie : dômes de nacre, colonnes de bronze vert, coraux, rayons de lumière.
   Art.phen.atlantide : la mer du fond qui envahit le décor de l'Antiquité, puis submerge le terrain.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, now, blob, limb, dk, poly, line, rect, disc, oval, figure, thrust, aim, arm, fist, halo, backdrop, sky, hills } = K;
  const NACRE = '#e8f2f0', NACRE_D = '#b8d0d0', BRONZE_V = '#5a9a84', BRONZE_VD = '#3a6a5a', OR = '#e8c45a';
  const CORAIL = '#ff7a6a', CORAIL_D = '#c84a4a', ALGUE = '#3a8a5a', EAU = '#2a8ab8', ECUME = '#e8fbff';
  A.phen = A.phen || {};

  // bulles qui montent
  function bulles(ctx, x, y, n, h, T, seed) {
    for (let i = 0; i < n; i++) {
      const k = (T * 0.5 + i / n + (seed || 0)) % 1;
      ctx.globalAlpha = 0.7 * (1 - k); ctx.beginPath(); ctx.arc(x + Math.sin(k * 8 + i * 2) * 3, y - k * h, 1 + i % 3 * 0.6, 0, TAU);
      ctx.strokeStyle = ECUME; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // trident : manche le long de +x, pointes au bout
  function trident(ctx, len, col) {
    limb(ctx, [-10, 0, len, 0], 1.6, col || OR);
    blob(ctx, col || OR, () => { ctx.moveTo(len, -5); ctx.lineTo(len + 8, -5.5); ctx.lineTo(len + 3, -3.4); ctx.lineTo(len + 9, 0); ctx.lineTo(len + 3, 3.4); ctx.lineTo(len + 8, 5.5); ctx.lineTo(len, 5); ctx.lineTo(len - 1.5, 0); }, 0.9);
  }
  // nageoire-crête sur la tête
  function crete(c, a, col) {
    blob(c, col, () => { c.moveTo(a.hx - 5, a.hy - 3); c.quadraticCurveTo(a.hx - 9, a.hy - 14, a.hx + 1, a.hy - 12); c.lineTo(a.hx - 1, a.hy - 8); c.lineTo(a.hx + 4, a.hy - 9); c.lineTo(a.hx + 3, a.hy - 5); }, 1);
    line(c, [a.hx - 5, a.hy - 6, a.hx - 4, a.hy - 11], dk(col, 0.7), 0.8);
  }
  const ecailles = (c, a, x0, x1, y0, y1, col) => { c.strokeStyle = col; c.lineWidth = 0.8; for (let y = y0; y < y1; y += 3.4) for (let x = x0 + ((y / 3.4) % 2) * 1.7; x < x1; x += 3.4) { c.beginPath(); c.arc(x, y + a.ty, 1.7, 0.2, Math.PI - 0.2); c.stroke(); } };

  /* ------------------------------------------------------------ unités */
  // Triton : peau vert d'eau, écailles d'équipe, crête de nageoire, trident.
  const triton = (o) => function (ctx, u, team, dark, atk, R) {
    const skin = o.skin || '#7ac8b0';
    figure(ctx, u, team, dark, atk, {
      k: o.k, skin, body: team, legs: dk(skin, 0.85), boots: BRONZE_V, belt: OR, crown: o.crown, crownUp: 13,
      back(c, a) { if (o.cape) blob(c, '#2a6a8a', () => { c.moveTo(-4, -33 + a.ty); c.quadraticCurveTo(-16 - (u.moving ? 4 : 0), -26 + a.ty, -14, -6 + a.ty); c.lineTo(-4, -12 + a.ty); }, 1.1); },
      over(c, a) { ecailles(c, a, -5, 6, -30, -18, dark); blob(c, BRONZE_V, () => { c.moveTo(-5, -32 + a.ty); c.lineTo(6, -32.5 + a.ty); c.lineTo(5, -28 + a.ty); c.lineTo(-4.5, -27.5 + a.ty); }, 0.9); },
      head(c, a) { crete(c, a, o.crete || '#3ab0a0'); if (o.barbe) blob(c, NACRE, () => { c.moveTo(a.hx + 1, a.hy + 2); c.quadraticCurveTo(a.hx + 4, a.hy + 12, a.hx + 7, a.hy + 3); }, 0.9); for (const d of [-1.6, 0, 1.6]) line(c, [a.hx - 3.6, a.hy + 1 + d, a.hx - 1.8, a.hy + 1.4 + d], dk(skin, 0.7), 0.7); },
      arm(c, a) { thrust(c, a, cc => trident(cc, o.long || 20), { x: 2.5, y: 0.5, reach: 9, rot: -0.05 }); },
    }, R);
  };
  A.units.triton = { h: 46, draw: triton({}) };

  // Sirène : longue queue écaillée, chevelure d'écume, conque qui souffle des bulles.
  A.units.sirene = { h: 46, top: 58, draw(ctx, u, team, dark, atk, R) {
    const T = now();
    figure(ctx, u, team, dark, atk, {
      skin: '#f0d0b8', body: team, legs: '#3ab0a0', boots: '#2a8a80', skirt: '#3ab0a0', skirtLen: 15,
      over(c, a) { ecailles(c, a, -6, 7, -19, -6, '#1a6a60'); disc(c, -1, -29 + a.ty, 2.2, NACRE, 0.8); disc(c, 4, -29 + a.ty, 2.2, NACRE, 0.8); },
      hairBack(c, a) { const w = Math.sin(T * 2 + u.x) * 2; blob(c, '#9ae8e0', () => { c.moveTo(a.hx - 5, a.hy - 5); c.quadraticCurveTo(a.hx - 14, a.hy + 4 + w, a.hx - 9, a.hy + 18 + w); c.lineTo(a.hx - 4, a.hy + 6); c.lineTo(a.hx + 3, a.hy - 5); }, 1); },
      head(c, a) { blob(c, '#9ae8e0', () => { c.moveTo(a.hx - 6, a.hy + 1); c.arc(a.hx, a.hy, 6.2, Math.PI * 0.9, Math.PI * 1.8); c.lineTo(a.hx + 2, a.hy - 3); c.lineTo(a.hx - 3, a.hy - 1); }, 1); disc(c, a.hx - 4, a.hy - 5, 1.8, CORAIL, 0.7); },
      arm(c, a) { aim(c, a, (cc, k) => {
        blob(cc, '#f4d8c0', () => { cc.moveTo(0, -3); cc.quadraticCurveTo(9, -6, 12, -1); cc.quadraticCurveTo(9, 4, 0, 3); }, 1);
        line(cc, [3, -3, 4, 2.6], '#d8a890', 0.8); line(cc, [7, -3.6, 7.6, 3], '#d8a890', 0.8);
        if (k > 0.15) for (let i = 0; i < 3; i++) { cc.beginPath(); cc.arc(14 + i * 4 + (1 - k) * 6, -1 - i * 1.5, 1.6 + i * 0.5, 0, TAU); cc.strokeStyle = ECUME; cc.lineWidth = 1; cc.stroke(); }
      }, { y: 3, kick: 1 }); },
    }, R);
  } };

  // Crabe géant : carapace large, pattes pointues, deux pinces (la grande frappe).
  function crabe(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, ph = u.walk * 1.6, s = o.s || 1;
    ctx.save(); ctx.scale(s, s);
    const C1 = o.col || CORAIL, C2 = dk(C1, 0.72);
    for (let i = 0; i < 3; i++) for (const d of [-1, 1]) {
      const sw = mv ? Math.sin(ph + i * 1.3 + (d > 0 ? 1.5 : 0)) * 3 : 0, x0 = -6 + i * 6 + d * 2;
      limb(ctx, [x0, -16, x0 + d * 0 - 10 + i * 2 + sw, -20, x0 - 14 + i * 5 + sw, -1], 2.2, d < 0 ? C2 : C1);
    }
    // carapace
    blob(ctx, C1, () => { ctx.moveTo(-24, -16); ctx.quadraticCurveTo(-22, -34, 0, -35); ctx.quadraticCurveTo(22, -34, 24, -16); ctx.quadraticCurveTo(0, -10, -24, -16); }, 1.5);
    ctx.fillStyle = dk(C1, 1.15); ctx.beginPath(); ctx.ellipse(-4, -28, 12, 3.4, -0.1, 0, TAU); ctx.fill();
    blob(ctx, team, () => { ctx.moveTo(-18, -20); ctx.quadraticCurveTo(0, -15, 18, -20); ctx.lineTo(17, -16.6); ctx.quadraticCurveTo(0, -12, -17, -16.6); }, 1);
    for (const [x, y] of [[-12, -27], [6, -30], [14, -24]]) disc(ctx, x, y, 1.4, C2);
    // yeux sur pédoncules
    for (const x of [12, 17]) { line(ctx, [x, -31, x + 1, -39 + Math.sin(T * 3 + x) * 0.8], INK, 1.6); disc(ctx, x + 1, -40 + Math.sin(T * 3 + x) * 0.8, 2.2, '#1a1a22', 0.8); disc(ctx, x + 1.6, -40.6, 0.7, '#fff'); }
    // petite pince (arrière) puis grande pince
    limb(ctx, [16, -22, 24, -28, 28, -26], 3, C2);
    blob(ctx, C2, () => { ctx.moveTo(27, -29); ctx.quadraticCurveTo(34, -32, 34, -26); ctx.lineTo(29, -24); }, 1);
    const p = atk, px = 30 + p * 8, py = -16 - p * 6;
    limb(ctx, [18, -18, 26, -12, px - 4, py + 2], 4, C1);
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.3 - p * 0.3);
    blob(ctx, C1, () => { ctx.moveTo(-5, -5); ctx.quadraticCurveTo(10, -10, 13, -3); ctx.lineTo(4, -1); ctx.lineTo(-5, 4); }, 1.3);
    ctx.rotate(0.45 + p * 0.55);
    blob(ctx, C2, () => { ctx.moveTo(-3, 0); ctx.quadraticCurveTo(8, 1, 11, 4); ctx.lineTo(1, 5); }, 1.1);
    ctx.restore();
    if (o.crown) o.R.crown(ctx, 0, -40);
    ctx.restore();
  }
  A.units['crabe-geant'] = { h: 40, draw(ctx, u, team, dark, atk) { crabe(ctx, u, team, dark, atk, {}); } };

  // Méduse géante : cloche translucide qui pulse, filaments, cœur lumineux.
  A.units.meduse = { h: 62, top: 66, draw(ctx, u, team, dark, atk) {
    const T = now(), pul = Math.sin(T * 3 + u.x * 0.03), fl = 4 + pul * 2, y0 = -34 - pul * 2;
    halo(ctx, 0, y0 - 6, 34, '150,220,255', 0.3 + atk * 0.3);
    for (let i = 0; i < 7; i++) {
      const x = -13 + i * 4.3, L = 26 + (i % 3) * 5, w = Math.sin(T * 2.6 + i) * 4;
      ctx.beginPath(); ctx.moveTo(x, y0 + 4); ctx.quadraticCurveTo(x + w + atk * 8, y0 + L * 0.5, x - w * 0.6 + atk * 14, y0 + L);
      ctx.strokeStyle = i % 2 ? 'rgba(200,160,255,0.85)' : 'rgba(150,230,255,0.85)'; ctx.lineWidth = 1.8; ctx.stroke();
    }
    ctx.globalAlpha = 0.85;
    blob(ctx, '#b8a0f0', () => { ctx.moveTo(-17 - fl * 0.3, y0 + 4); ctx.quadraticCurveTo(-18, y0 - 24, 0, y0 - 26); ctx.quadraticCurveTo(18, y0 - 24, 17 + fl * 0.3, y0 + 4); ctx.quadraticCurveTo(0, y0 - 2, -17 - fl * 0.3, y0 + 4); }, 1.4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-6, y0 - 16, 6, 3.2, -0.5, 0, TAU); ctx.fill();
    // bord d'équipe festonné
    ctx.beginPath(); for (let i = 0; i <= 8; i++) { const x = -17 + i * 4.25; ctx.lineTo(x, y0 + 3 + (i % 2) * 2.4); } ctx.strokeStyle = team; ctx.lineWidth = 2.6; ctx.stroke();
    halo(ctx, 0, y0 - 10, 9, '255,240,160', 0.6 + 0.3 * Math.sin(T * 5));
    disc(ctx, 0, y0 - 10, 2.6, '#fff4c0');
  } };

  /* ------------------------------------------------------------ champions */
  // Kraken : énorme manteau, gros yeux, tentacules qui frappent devant.
  A.units['ch-kraken'] = { h: 88, draw(ctx, u, team, dark, atk, R) {
    const T = now(), mv = u.moving, C1 = '#a84a6a', C2 = '#7a2a4a', C3 = '#e8a0b0';
    for (let i = 0; i < 6; i++) {
      const base = -30 + i * 9, w = Math.sin(T * 2.2 + i * 1.1 + (mv ? u.walk : 0)) * 6, avant = i > 3 ? atk * 24 : 0;
      const pts = [base, -24, base + 6 + w, -12, base + 14 + w + avant, -4 - avant * 0.6, base + 24 + avant, -10 - avant];
      limb(ctx, pts, 7 - i * 0.4, i % 2 ? C2 : C1);
      for (let j = 1; j < 3; j++) disc(ctx, pts[j * 2] + 1, pts[j * 2 + 1] + 2.4, 1.2, C3);
    }
    blob(ctx, C1, () => { ctx.moveTo(-30, -24); ctx.quadraticCurveTo(-40, -66, -8, -86); ctx.quadraticCurveTo(22, -94, 30, -62); ctx.quadraticCurveTo(34, -36, 24, -22); ctx.quadraticCurveTo(0, -14, -30, -24); }, 1.8);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(-8, -70, 12, 6, -0.6, 0, TAU); ctx.fill();
    for (const [x, y, r] of [[-14, -54, 3], [-2, -76, 2.4], [-22, -40, 2.2]]) disc(ctx, x, y, r, C2);
    blob(ctx, team, () => { ctx.moveTo(-28, -34); ctx.quadraticCurveTo(0, -26, 28, -34); ctx.lineTo(27, -28); ctx.quadraticCurveTo(0, -20, -28, -28); }, 1.1);
    for (const x of [10, 22]) { disc(ctx, x, -48, 6, '#ffe36a', 1.2); oval(ctx, x + 1, -48, 1.6, 4.4, INK); }
    R.crown(ctx, 0, -92);
  } };
  A.units['ch-roi-triton'] = { h: 46, draw: triton({ k: 1.15, crown: true, barbe: true, cape: true, skin: '#5aa890', crete: OR, long: 24 }) };
  // Grand requin des sables : corps fuselé, aileron, mâchoire qui s'ouvre.
  A.units['ch-grand-requin'] = { h: 50, draw(ctx, u, team, dark, atk, R) {
    const T = now(), ond = Math.sin(T * 5 + u.walk) * 3, C1 = '#7a8a9a', C2 = '#5a6a7a', V = '#e8eef2';
    blob(ctx, C2, () => { ctx.moveTo(-36, -24); ctx.lineTo(-48, -40 + ond); ctx.lineTo(-44, -24); ctx.lineTo(-50, -8 - ond); }, 1.3);
    blob(ctx, C1, () => { ctx.moveTo(-40, -22); ctx.quadraticCurveTo(-20, -40, 10, -38); ctx.quadraticCurveTo(36, -36, 46, -22); ctx.quadraticCurveTo(36, -10, 10, -8); ctx.quadraticCurveTo(-20, -8, -40, -22); }, 1.6);
    blob(ctx, V, () => { ctx.moveTo(-30, -16); ctx.quadraticCurveTo(0, -6, 40, -18); ctx.quadraticCurveTo(10, -12, -30, -16); }, 0);
    blob(ctx, C1, () => { ctx.moveTo(-6, -37); ctx.lineTo(2, -58); ctx.lineTo(12, -37); }, 1.3);
    blob(ctx, team, () => { ctx.moveTo(-10, -36); ctx.lineTo(-12, -10); ctx.lineTo(-6, -9); ctx.lineTo(-3, -37); }, 1);
    for (const x of [16, 20, 24]) line(ctx, [x, -30, x - 1, -22], C2, 1.2);
    // mâchoire
    const j = atk * 7;
    blob(ctx, '#4a1a22', () => { ctx.moveTo(30, -20); ctx.lineTo(46, -22); ctx.lineTo(44, -16 + j); ctx.lineTo(30, -16); }, 1);
    for (let i = 0; i < 4; i++) poly(ctx, [32 + i * 3.4, -21, 33.7 + i * 3.4, -18, 35.4 + i * 3.4, -21], '#fff');
    disc(ctx, 34, -28, 2, INK); disc(ctx, 34.6, -28.6, 0.6, '#fff');
    R.crown(ctx, 6, -60);
  } };

  /* -------------------------------------------------------------- tourelles */
  A.turrets['lance-harpons'] = function (ctx, a, team) {
    blob(ctx, BRONZE_VD, () => { ctx.moveTo(-10, 8); ctx.lineTo(-6, -2); ctx.lineTo(6, -2); ctx.lineTo(10, 8); }, 1.2);
    line(ctx, [-8, 4, 8, 4], team, 2);
    ctx.save(); ctx.translate(0, -5); ctx.rotate(-0.12);
    rect(ctx, -12, -2, 24, 4, BRONZE_V, 1);
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.quadraticCurveTo(2 - a * 3, 0, 6, 10); ctx.strokeStyle = CORAIL; ctx.lineWidth = 3; ctx.stroke();
    line(ctx, [6, -10, -6 + a * 8, 0, 6, 10], '#f3ead2', 0.8);
    if (a < 0.5) { limb(ctx, [-8, 0, 16, 0], 1.2, '#c8a060'); poly(ctx, [16, -2.4, 21, 0, 16, 2.4], NACRE, 0.8); }
    ctx.restore();
  };
  A.turrets.conque = function (ctx, a, team) {
    const T = now();
    rect(ctx, -6, 0, 12, 8, BRONZE_VD, 1.1); line(ctx, [-6, 4, 6, 4], team, 2);
    ctx.save(); ctx.translate(0, -8); ctx.rotate(-0.2);
    blob(ctx, '#f4d8c0', () => { ctx.moveTo(-12, 2); ctx.quadraticCurveTo(-10, -10, 2, -9); ctx.quadraticCurveTo(14, -7, 16, -2); ctx.lineTo(16, 5); ctx.quadraticCurveTo(0, 8, -12, 2); }, 1.3);
    ctx.beginPath(); for (let i = 0; i < 14; i++) { const r = 1 + i * 0.5, an = i * 0.9; ctx.lineTo(-6 + Math.cos(an) * r, -2 + Math.sin(an) * r); } ctx.strokeStyle = '#d8a890'; ctx.lineWidth = 1; ctx.stroke();
    oval(ctx, 16, 1.5, 2.4, 4, '#e8a0a0', 1);
    if (a > 0) halo(ctx, 20, 1, 12, '180,240,255', a);
    ctx.restore();
    bulles(ctx, 10, -12, 3, 14, T, 0.3);
  };
  A.turrets['geyser-abyssal'] = function (ctx, a) {
    const T = now();
    for (const [x, h, c] of [[-10, 14, CORAIL], [9, 10, '#ff9ab0'], [-3, 6, CORAIL_D]]) limb(ctx, [x, 8, x + 1, 8 - h, x + 4, 4 - h], 2.4, c);
    poly(ctx, [-12, 8, -6, -8, 6, -8, 12, 8], '#4a6a70', 1.3);
    oval(ctx, 0, -8, 6, 2.2, '#1a3a4a', 1);
    const r = 3 + a * 4;
    ctx.beginPath(); ctx.arc(0, -12 - a * 6, r, 0, TAU); ctx.fillStyle = 'rgba(180,240,255,0.35)'; ctx.fill(); ctx.strokeStyle = ECUME; ctx.lineWidth = 1.2; ctx.stroke();
    bulles(ctx, 0, -10, 4, 18, T);
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  const bulle = (ctx, x, y, r) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = 'rgba(160,230,255,0.35)'; ctx.fill();
    ctx.strokeStyle = ECUME; ctx.lineWidth = 1.2; ctx.stroke();
    disc(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, '#fff');
  };
  A.projectiles.bulle = function (ctx, p) { bulle(ctx, p.x, p.y, 4.5); bulle(ctx, p.x - 7, p.y + 2, 2); };
  A.projectiles['bulle-geante'] = function (ctx, p) { halo(ctx, p.x, p.y, 16, '160,230,255', 0.4); bulle(ctx, p.x, p.y, 9); };
  A.projectiles['harpon-corail'] = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    line(ctx, [-14, 0, 6, 0], '#c8a060', 1.6); poly(ctx, [6, -2.4, 12, 0, 6, 2.4], NACRE, 0.8);
  };
  A.projectiles.trombe = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    const g = ctx.createLinearGradient(-40, 0, 6, 0); g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(1, 'rgba(200,250,255,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-40, -2); ctx.quadraticCurveTo(0, -7, 6, 0); ctx.quadraticCurveTo(0, 7, -40, 2); ctx.closePath(); ctx.fill();
    disc(ctx, 3, 0, 3, ECUME);
  };
  A.drops.trident = function (ctx, d) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(200,250,255,0.35)'; ctx.fillRect(-60, -1.5, 46, 3);
    trident(ctx, 2); ctx.restore();
    halo(ctx, d.x, d.y, 14, '255,230,140', 0.5);
  };

  /* -------------------------------------------------------------------- base */
  // Temple de nacre : dôme, colonnes de bronze vert, cascade, coraux, bannière en voile.
  A.bases.atlantide = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    halo(ctx, 50, G - 80, 100, '120,220,255', 0.25);
    rect(ctx, 0, G - 30, 104, 30, NACRE_D, 1.4);
    rect(ctx, 2, G - 36, 100, 7, NACRE, 1.2);
    for (const x of [8, 30, 52, 74, 94]) { rect(ctx, x - 4, G - 120, 8, 84, BRONZE_V, 1.2); line(ctx, [x - 1.5, G - 118, x - 1.5, G - 38], dk(BRONZE_V, 1.25), 1.4); rect(ctx, x - 6, G - 124, 12, 5, BRONZE_VD, 1); }
    rect(ctx, -2, G - 132, 108, 10, NACRE, 1.3);
    blob(ctx, NACRE, () => { ctx.moveTo(6, G - 132); ctx.quadraticCurveTo(10, G - 186, 52, G - 190); ctx.quadraticCurveTo(94, G - 186, 98, G - 132); }, 1.5);
    ctx.fillStyle = 'rgba(160,220,230,0.6)'; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(6 + i * 19, G - 132); ctx.quadraticCurveTo(10 + i * 18, G - 170, 52, G - 188); ctx.lineWidth = 1; ctx.strokeStyle = NACRE_D; ctx.stroke(); }
    disc(ctx, 52, G - 194, 5, OR, 1.1);
    // porte et cascade
    blob(ctx, '#0e3a5a', () => { ctx.moveTo(38, G - 36); ctx.lineTo(38, G - 70); ctx.quadraticCurveTo(52, G - 86, 66, G - 70); ctx.lineTo(66, G - 36); }, 1.3);
    for (let i = 0; i < 5; i++) { const y = (T * 60 + i * 14) % 50; line(ctx, [42 + i * 5, G - 72 + y, 42 + i * 5, G - 64 + y], 'rgba(220,250,255,0.7)', 1.4); }
    // coraux au pied
    for (const [x, h, c] of [[2, 22, CORAIL], [16, 14, '#ff9ab0'], [86, 18, CORAIL_D], [100, 12, CORAIL]]) { limb(ctx, [x, G, x + 2, G - h, x + 6, G - h - 5], 3, c); limb(ctx, [x + 2, G - h * 0.5, x - 4, G - h * 0.8], 2.4, c); }
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; poly(ctx, [78 - s * 2, y - 1, 106, y - 2.5, 110, y + 1, 106, y + 4.5, 78 - s * 2, y + 4.5], BRONZE_VD, 1.3); }
    // voile-bannière
    const wv = Math.sin(T * 2 + side) * 3;
    line(ctx, [52, G - 196, 52, G - 238], INK, 3.6); line(ctx, [52, G - 196, 52, G - 238], OR, 2);
    blob(ctx, team, () => { ctx.moveTo(52, G - 236); ctx.quadraticCurveTo(70, G - 236 + wv, 80, G - 228 + wv); ctx.quadraticCurveTo(68, G - 220 + wv, 52, G - 214); }, 1.2);
    bulles(ctx, 20, G - 140, 4, 60, T, 0.2); bulles(ctx, 84, G - 120, 3, 50, T, 0.6);
  };

  /* ------------------------------------------------------------------ décor */
  A.backdrops.atlantide = backdrop('atlantide', 7731, (g, r) => {
    sky(g, [[0, '#06183a'], [0.45, '#0e3a6a'], [0.8, '#1a6a90'], [1, '#3aa0b0']]);
    // rayons de lumière depuis la surface
    for (let i = 0; i < 7; i++) { const x = 100 + i * 180 + r() * 60; const gr = g.createLinearGradient(x, -40, x + 80, 560); gr.addColorStop(0, 'rgba(200,250,255,0.22)'); gr.addColorStop(1, 'rgba(200,250,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 20, -40); g.lineTo(x + 30, -40); g.lineTo(x + 140, 560); g.lineTo(x + 40, 560); g.closePath(); g.fill(); }
    // cité engloutie au loin : dômes et colonnes
    const ruine = (x, s, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - 50 * s, 540); g.lineTo(x - 50 * s, 470 - 40 * s); g.quadraticCurveTo(x - 46 * s, 420 - 70 * s, x, 410 - 80 * s); g.quadraticCurveTo(x + 46 * s, 420 - 70 * s, x + 50 * s, 470 - 40 * s); g.lineTo(x + 50 * s, 540); g.fill(); for (let c = -2; c <= 2; c++) g.fillRect(x + c * 24 * s - 4 * s, 470 - 40 * s, 8 * s, 70 + 40 * s); };
    ruine(260, 1.1, '#1e4a6a'); ruine(760, 1.6, '#1a4060'); ruine(1110, 0.9, '#214e70');
    g.fillStyle = '#183c5a'; for (let i = 0; i < 9; i++) { const x = r() * W, h = 40 + r() * 80; g.fillRect(x, 540 - h, 10, h); g.fillRect(x - 4, 540 - h - 6, 18, 6); }
  }, (f, r) => {
    const h1 = x => 548 - Math.sin(x * 0.006 + 0.8) * 18 - Math.sin(x * 0.017) * 6;
    const h2 = x => 576 - Math.sin(x * 0.008 + 2) * 10 - Math.sin(x * 0.023 + 1) * 4;
    hills(f, h1, 0, '#1a4a5a');
    // forêts d'algues
    for (let i = 0; i < 30; i++) { const x = r() * W, h = 30 + r() * 70, y = h1(x) + 4; f.strokeStyle = r() < 0.5 ? '#2a7a5a' : '#3a8a4a'; f.lineWidth = 3; f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + 10, y - h * 0.5, x - 4, y - h); f.stroke(); }
    hills(f, h2, 0, '#2a5a5a');
    const sg = f.createLinearGradient(0, GROUND, 0, GROUND + 120); sg.addColorStop(0, '#5a8a80'); sg.addColorStop(1, '#2a4a4a');
    f.fillStyle = sg; f.fillRect(-40, GROUND, W + 80, 160);
    // sable, coquillages, dalles de nacre
    for (let i = 0; i < 14; i++) { const x = r() * W, y = GROUND + 20 + r() * 80; f.fillStyle = 'rgba(232,242,240,0.25)'; f.fillRect(x, y, 30 + r() * 30, 8); }
    for (let i = 0; i < 40; i++) { const x = r() * W, y = GROUND + 14 + r() * 92, s = 2 + r() * 3; oval(f, x, y, s, s * 0.6, r() < 0.5 ? '#f4d8c0' : '#ff9a8a'); }
    for (let i = 0; i < 12; i++) { const x = r() * W, y = GROUND + 30 + r() * 70; limb(f, [x, y, x + 2, y - 10, x + 6, y - 14], 2.4, r() < 0.5 ? CORAIL : '#ff9ab0'); }
    f.fillStyle = '#7ab0a0'; f.fillRect(-40, GROUND, W + 80, 5);
    f.fillStyle = 'rgba(232,251,255,0.6)'; f.fillRect(-40, GROUND + 5, W + 80, 1.2);
  }, (ctx, t, dt) => {
    // bancs de poissons
    K.flock(ctx, t, dt, 'atlantide', 'rgba(200,240,255,0.7)', 7, (c, x, y, s, fl) => { c.beginPath(); c.ellipse(x, y, 6 * s, 2.4 * s, 0, 0, TAU); c.moveTo(x - 6 * s, y); c.lineTo(x - 10 * s, y - 3 * s * fl); c.lineTo(x - 10 * s, y + 3 * s * fl); c.fill(); });
  }, (ctx) => {
    const T = now();
    for (let i = 0; i < 22; i++) { const k = (T * 0.06 + i * 0.29) % 1; ctx.globalAlpha = 0.5 * (1 - k * 0.5); ctx.beginPath(); ctx.arc((i * 173 + Math.sin(T + i) * 14) % W, GROUND - k * GROUND, 1.2 + (i % 3) * 0.8, 0, TAU); ctx.strokeStyle = ECUME; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.globalAlpha = 1;
  });

  /* ------------------------------------------------- le phénomène : la mer monte */
  A.phen.atlantide = function (ctx, b, P, T) {
    const s = P.s, et = P.etat;
    // La vraie mer du fond (bande y 462 du décor de l'Antiquité) déborde par étapes :
    //   stade 1 : elle monte un peu et envahit le désert (les collines du fond) ;
    //   stade 2 : elle noie les îles et tout le désert, jusqu'aux collines de devant ;
    //   stade 3 : elle monte encore, passe par-dessus les collines de devant et submerge le terrain.
    // haut = hauteur de la surface (plus petit = plus haut), avant = jusqu'où l'eau s'avance vers nous.
    const HAUT = [462, 466, 426, 412], AVANT = [462, 522, 600, 600];
    const cH = HAUT[Math.min(s, 3)] - (et === 'vague' || et === 'arrivee' ? 40 : 0), cA = AVANT[Math.min(s, 3)];
    const m = b._mer || (b._mer = { h: HAUT[Math.max(0, s - 1)], a: AVANT[Math.max(0, s - 1)], t: T, sol: 0 });
    const dt = Math.min(0.1, Math.max(0, T - m.t)); m.t = T;
    const k = Math.min(1, dt * 0.35);
    m.h += (cH - m.h) * (et === 'vague' ? Math.min(1, dt * 1.5) : k); m.a += (cA - m.a) * k;
    // le débordement sur le terrain suit la vague du moteur (P.k : 0 → 1)
    m.sol = et === 'arrivee' ? 1 : et === 'vague' ? (P.k || 0) : 0;
    const h2 = x => 566 - Math.sin(x * 0.0058 + 2.6) * 15 - Math.sin(x * 0.018 + 0.2) * 5;
    const surf = x => m.h + Math.sin(x * 0.02 + T * 1.6) * 2.2;
    const lim = x => { const y = h2(x) + 2; return y + (GROUND + 12 - y) * Math.min(1, m.sol * (1 + Math.sin(x * 0.02 + 1) * 0.12)); };
    const bord = x => Math.min(m.a + Math.sin(x * 0.013 + T * 1.1) * 7 + Math.sin(x * 0.041 - T * 2) * 3, lim(x));
    const pas = 16;
    ctx.fillStyle = `rgba(30,90,140,${0.05 * s})`; ctx.fillRect(0, 0, W, GROUND);
    if (m.a - m.h > 2) {
      const bas = Math.max(m.h + 40, m.sol > 0 ? GROUND : m.a);
      const g = ctx.createLinearGradient(0, m.h, 0, bas);
      g.addColorStop(0, 'rgba(63,143,192,0.96)'); g.addColorStop(0.45, 'rgba(80,160,200,0.86)'); g.addColorStop(1, 'rgba(50,130,180,0.72)');
      ctx.fillStyle = g; ctx.beginPath();
      for (let x = -40; x <= W + 40; x += pas) ctx.lineTo(x, surf(x));
      for (let x = W + 40; x >= -40; x -= pas) ctx.lineTo(x, Math.max(surf(x), bord(x)));
      ctx.closePath(); ctx.fill();
      // reflets sur l'eau
      ctx.strokeStyle = 'rgba(232,251,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let i = 0; i < 18; i++) { const x = (i * 97 + T * 12) % (W + 60) - 30, y = m.h + 8 + (i * 37) % Math.max(8, bas - m.h - 12); if (y < bord(x) - 4) { ctx.moveTo(x, y); ctx.lineTo(x + 18, y); } }
      ctx.stroke();
      // la surface
      ctx.strokeStyle = 'rgba(232,251,255,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (let x = -40; x <= W + 40; x += pas) ctx.lineTo(x, surf(x));
      ctx.stroke();
      // l'écume du front de mer qui avance (sur le sable, puis sur le terrain)
      ctx.strokeStyle = 'rgba(240,252,255,0.9)'; ctx.lineWidth = 2.6; ctx.beginPath();
      for (let x = -40; x <= W + 40; x += pas / 2) { const y = bord(x); if (y < GROUND + 8) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      // la cascade par-dessus les collines de devant pendant le débordement
      if (et === 'vague') {
        ctx.fillStyle = 'rgba(240,252,255,0.85)';
        for (let i = 0; i < 70; i++) {
          const x = (i * 19.3) % (W + 40) - 20, u = (T * 1.8 + i * 0.137) % 1, y0 = h2(x), y = y0 + (lim(x) - y0) * u;
          ctx.globalAlpha = 0.9 * (1 - u * 0.6); ctx.beginPath(); ctx.arc(x + Math.sin(T * 5 + i) * 3, y, 2 + (i % 3), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    // la pluie (stade 2 et plus)
    if (s >= 2) { ctx.strokeStyle = 'rgba(200,230,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < 50 * (s - 1); i++) { const x = (i * 97 + T * 300) % (W + 100) - 50, y = (i * 61 + T * 700) % GROUND; ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16); } ctx.stroke(); }
  };

  // Devant les unités et les bases : la grosse vague du stade 3. Elle se dresse derrière les collines,
  // monte plus haut que les bases, s'écrase sur tout le terrain, puis l'eau reste aux genoux des troupes.
  A.phenDevant = A.phenDevant || {};
  A.phenDevant.atlantide = function (ctx, b, P, T) {
    const et = P.etat;
    if (et !== 'vague' && et !== 'arrivee') return;
    const k = et === 'vague' ? (P.k || 0) : 1;
    const SOMMET = 300, RESTE = GROUND - 22;
    let top, a, houle;
    if (et === 'arrivee') { top = RESTE; a = 0.42; houle = 3; }
    else if (k < 0.55) { const u = k / 0.55; top = 590 - (590 - SOMMET) * Math.pow(u, 0.7); a = 0.55 + 0.35 * u; houle = 14; }
    else { const u = (k - 0.55) / 0.45; top = SOMMET + (RESTE - SOMMET) * Math.pow(u, 1.8); a = 0.9 - 0.4 * u; houle = 14 - 10 * u; }
    const y = x => top + Math.sin(x * 0.012 + T * 2.2) * houle + Math.sin(x * 0.045 - T * 3) * houle * 0.35;
    const g = ctx.createLinearGradient(0, top, 0, GROUND + 6);
    g.addColorStop(0, `rgba(70,165,210,${a})`); g.addColorStop(0.5, `rgba(30,110,170,${a})`); g.addColorStop(1, `rgba(20,80,140,${Math.min(1, a + 0.1)})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-40, GROUND + 6);
    for (let x = -40; x <= W + 40; x += 14) ctx.lineTo(x, y(x));
    ctx.lineTo(W + 40, GROUND + 6); ctx.closePath(); ctx.fill();
    // l'écume de la crête
    ctx.strokeStyle = `rgba(240,252,255,${et === 'vague' ? 0.95 : 0.7})`; ctx.lineWidth = et === 'vague' ? 5 : 2.4; ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 10) ctx.lineTo(x, y(x));
    ctx.stroke();
    if (et === 'vague') {
      // la crête qui s'enroule, et les embruns
      ctx.fillStyle = 'rgba(240,252,255,0.9)';
      for (let x = -20; x <= W + 20; x += 22) { const r = 6 + Math.abs(Math.sin(x * 0.09 + T * 4)) * 8; ctx.beginPath(); ctx.arc(x, y(x) - 2, r, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 60; i++) {
        const x = (i * 23.1) % (W + 40) - 20, u = (T * 1.6 + i * 0.173) % 1;
        ctx.globalAlpha = 0.85 * (1 - u); ctx.beginPath(); ctx.arc(x + Math.sin(i) * 10, y(x) - u * 70, 2 + (i % 3) * 1.5, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // reflets dans la masse d'eau
      ctx.strokeStyle = 'rgba(200,240,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 20; i++) { const x = (i * 71 + T * 30) % W, yy = top + 30 + (i * 43) % Math.max(20, GROUND - top - 30); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 20, yy - 6, x + 40, yy); }
      ctx.stroke();
    }
  };
})();

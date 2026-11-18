/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE JURASSIQUE
   Jungle au couchant, volcans, antre dans un crâne fossile. Voir js/art.js pour le principe.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, IVORY, now, blob, limb, ell, stone, dk, poly, line, disc, oval, puffs, halo, backdrop, sky, hills, clouds, flock, soil } = K;

  /* ------------------------------------------------------------ unités */

  // Théropode : raptor (crête de plumes), cracheur (collerette qui s'ouvre), roi tyran (grosse tête, couronne).
  function theropod(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving, ph = u.walk * (o.rex ? 0.75 : 1.2);
    const sw = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.4 : -Math.sin(T * 2.4 + u.x * 0.05) * 0.5;
    const C1 = o.body, C2 = o.belly, C3 = dk(o.body, 0.72), f = o.rex ? 1.3 : 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (dir, col) => {
      const fx = dir * sw * 7, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 3 : 0;
      limb(ctx, [dir * 1.5 - 1, -19 + b, fx + 4, -12 + b - lift * 0.4, fx - 2, -5 - lift, fx + 1, -1.5 - lift, fx + 5.5, -1.5 - lift], 3.2 * f, col);
      if (!o.rex) blob(ctx, IVORY, () => { ctx.moveTo(fx + 3, -2.5 - lift); ctx.quadraticCurveTo(fx + 6.5, -7 - lift, fx + 8, -3 - lift); ctx.lineTo(fx + 4.5, -1.6 - lift); }, 0.7);
    };
    leg(-1, C3);
    const tw = Math.sin(T * 3 + u.x * 0.03) * 2.2 + sw * 1.5;
    blob(ctx, C1, () => { ctx.moveTo(-6, -23 - 5 * f + b); ctx.quadraticCurveTo(-18, -27 + b + tw * 0.4, -30, -24 + b + tw); ctx.quadraticCurveTo(-18, -21 + b + tw * 0.4, -5, -23 + 6 * f + b); });
    if (o.sail) {                                                     // voile dorsale (Spinosaure, js/champions.js)
      const top = -23 - 6.5 * f + b;
      blob(ctx, o.sail, () => { ctx.moveTo(-11, top + 2); ctx.quadraticCurveTo(-9, top - 20, -1, top - 22); ctx.quadraticCurveTo(7, top - 20, 9, top + 1); }, 1.3);
      for (const x of [-7, -3.5, 0, 3.5, 6.5]) line(ctx, [x, top + 1, x * 0.75 - 1, top - 20 + Math.abs(x + 1) * 1.5], dk(o.sail, 0.7), 1.1);
      ctx.fillStyle = dk(o.sail, 1.2); ctx.beginPath(); ctx.moveTo(-9, top - 3); ctx.quadraticCurveTo(-7, top - 17, -1, top - 19); ctx.quadraticCurveTo(-5, top - 14, -6, top - 2); ctx.closePath(); ctx.fill();
    }
    blob(ctx, C1, () => {
      ctx.moveTo(-8, -23 - 4.5 * f + b); ctx.quadraticCurveTo(0, -23 - 8.5 * f + b, 8, -23 - 6.5 * f + b); ctx.quadraticCurveTo(12, -25 + b, 9, -23 + 4 * f + b);
      ctx.quadraticCurveTo(0, -23 + 8 * f + b, -8, -23 + 5 * f + b); ctx.quadraticCurveTo(-11, -22 + b, -8, -23 - 4.5 * f + b);
    });
    ctx.fillStyle = C2; ctx.beginPath(); ctx.moveTo(8.5, -23 + 2.5 * f + b); ctx.quadraticCurveTo(0, -23 + 6.8 * f + b, -7.5, -23 + 4.2 * f + b); ctx.quadraticCurveTo(0, -23 + 4 * f + b, 8.5, -23 + 0.5 * f + b); ctx.closePath(); ctx.fill();
    for (const x of [-5.5, -1.5, 2.5]) line(ctx, [x, -23 - 6.6 * f + b, x - 1.6, -23 - 2.4 * f + b], C3, 1.5);
    // harnais aux couleurs de l'équipe
    blob(ctx, team, () => { ctx.moveTo(-4, -23 - 6.9 * f + b); ctx.lineTo(4.5, -23 - 7.3 * f + b); ctx.lineTo(5, -24 + b); ctx.lineTo(0.5, -21.5 + b); ctx.lineTo(-4, -24 + b); }, 1);
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.arc(0.5, -25.5 + b - 2 * (f - 1), 1.1, 0, TAU); ctx.fill();
    leg(1, C1);
    // cou et tête : plongent à l'attaque
    ctx.save(); ctx.translate(7, -23 - 4 * f + b); ctx.rotate(-0.15 + atk * 0.5);
    if (o.rex) ctx.scale(1.5, 1.5);
    blob(ctx, C1, () => { ctx.moveTo(-2.5, -1); ctx.quadraticCurveTo(3, -7, 6, -11); ctx.lineTo(11, -8); ctx.quadraticCurveTo(7, -3, 4.5, 3.5); });
    if (o.frill) {
      const fr = 4 + atk * 5;
      blob(ctx, team, () => { ctx.moveTo(6.5, -7.5); ctx.quadraticCurveTo(-1, -11 - fr, 6, -15 - fr); ctx.quadraticCurveTo(11, -14 - fr * 0.4, 10.5, -9); }, 1);
      line(ctx, [7, -8.5, 3.5, -12 - fr * 0.8], dark, 1); line(ctx, [8, -9, 6.5, -14 - fr * 0.8], dark, 1);
    } else if (!o.rex) {
      blob(ctx, team, () => { ctx.moveTo(6, -12.5); ctx.lineTo(2.5, -17.5); ctx.lineTo(7.2, -15.2); ctx.lineTo(6.6, -20); ctx.lineTo(10.6, -15.4); }, 0.9);
    }
    blob(ctx, C1, () => { ctx.moveTo(5, -12); ctx.quadraticCurveTo(10, -16.5, 17, -13.5); ctx.lineTo(21.5, -11.5); ctx.lineTo(20.5, -9.3); ctx.lineTo(9, -7.4); ctx.quadraticCurveTo(5, -8.5, 5, -12); });
    ctx.save(); ctx.translate(9.5, -8.4); ctx.rotate(0.08 + atk * 0.55);
    blob(ctx, C3, () => { ctx.moveTo(0, -0.7); ctx.lineTo(10.5, -0.5); ctx.lineTo(9.2, 1.7); ctx.lineTo(0.5, 2.4); }, 1);
    ctx.restore();
    ctx.fillStyle = IVORY;
    for (const x of [11.5, 14, 16.5, 19]) { const y = -7.9 - (x - 9) * 0.165; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.8, y + 2); ctx.lineTo(x + 1.7, y - 0.2); ctx.closePath(); ctx.fill(); }
    disc(ctx, 12.6, -12.3, 1.5, o.eye || '#ffe36a', 0.7); disc(ctx, 13, -12.3, 0.6, INK);
    line(ctx, [10.6, -14.3, 14.6, -13.6], INK, 1.1);
    if (o.rex) { ctx.strokeStyle = team; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(7, -9.5); ctx.lineTo(9.5, -12.5); ctx.moveTo(4.5, -6); ctx.lineTo(7.5, -8); ctx.stroke(); }
    if (o.crown) R.crown(ctx, 10.5, -17.5);
    ctx.restore();
    limb(ctx, [7, -22 + b, 11, -19 + b, 13.5 + atk * 2, -20.5 + b], o.rex ? 1.3 : 1.6, C1);
  }
  K.theropod = theropod;
  A.units.raptor = { h: 40, draw(ctx, u, team, dark, atk, R) { theropod(ctx, u, team, dark, atk, { body: '#7f9a48', belly: '#d2d394' }, R); } };
  A.units.cracheur = { h: 40, draw(ctx, u, team, dark, atk, R) { theropod(ctx, u, team, dark, atk, { body: '#4f9486', belly: '#bfe0c8', frill: true, eye: '#c8ff6a' }, R); } };
  A.units['roi-tyran'] = { h: 46, draw(ctx, u, team, dark, atk, R) { theropod(ctx, u, team, dark, atk, { body: '#6f7a46', belly: '#cfc890', rex: true, crown: true, eye: '#ff9a3c' }, R); } };

  // pattes de pachyderme (tricératops, ankylosaure)
  function stump(ctx, x, top, dx, lift, col, w) {
    blob(ctx, col, () => { ctx.moveTo(x - w, top); ctx.lineTo(x + w, top); ctx.lineTo(x + w + dx, -3 - lift); ctx.quadraticCurveTo(x + w + 0.6 + dx, -lift, x + dx, -lift); ctx.quadraticCurveTo(x - w - 0.6 + dx, -lift, x - w + dx, -3 - lift); });
    ctx.fillStyle = IVORY; for (const o of [-1.8, 0.8, 3.4]) { ctx.beginPath(); ctx.arc(x + dx + o, -0.9 - lift, 1, Math.PI, 0); ctx.fill(); }
  }

  K.stump = stump;
  A.units.tricera = { h: 56, draw(ctx, u, team, dark, atk) {
    const T = now(), mv = u.moving, ph = u.walk * 0.7, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.1 : -Math.sin(T * 1.7 + u.x * 0.04) * 0.5;
    const C1 = '#a08f5a', C2 = '#7d6f45', C3 = '#d3c796';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (x, dir, col) => stump(ctx, x, -23, dir * st * 3.5, mv ? Math.max(0, dir * Math.cos(ph)) * 2.5 : 0, col, 5);
    leg(-12, -1, C2); leg(13, 1, C2);
    blob(ctx, C1, () => { ctx.moveTo(-22, -37 + b); ctx.quadraticCurveTo(-36, -31 + b, -42, -18 + b + st * 1.5); ctx.quadraticCurveTo(-32, -22 + b, -22, -22 + b); });
    blob(ctx, C1, () => {
      ctx.moveTo(-26, -24 + b); ctx.quadraticCurveTo(-29, -42 + b, -8, -45.5 + b); ctx.quadraticCurveTo(10, -46 + b, 20, -38 + b);
      ctx.quadraticCurveTo(24, -26 + b, 16, -17 + b); ctx.quadraticCurveTo(-6, -12 + b, -26, -24 + b);
    }, 1.6);
    ctx.fillStyle = C3; ctx.beginPath(); ctx.moveTo(15, -18.5 + b); ctx.quadraticCurveTo(-6, -13.6 + b, -24.5, -24.5 + b); ctx.quadraticCurveTo(-6, -18 + b, 16, -22 + b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C2; for (const [x, y] of [[-18, -34], [-9, -39], [1, -40], [10, -37], [-13, -29], [-3, -32], [7, -30]]) { ctx.beginPath(); ctx.ellipse(x, y + b, 2.2, 1.5, 0, 0, TAU); ctx.fill(); }
    blob(ctx, team, () => {
      ctx.moveTo(-13, -44.4 + b); ctx.quadraticCurveTo(-5, -46.4 + b, 3, -45.6 + b);
      ctx.lineTo(4, -32 + b); ctx.lineTo(0.5, -28.5 + b); ctx.lineTo(-3, -32 + b); ctx.lineTo(-6.5, -28.5 + b); ctx.lineTo(-10, -32 + b); ctx.lineTo(-13, -29.5 + b);
    });
    line(ctx, [-13, -35 + b, 4, -35.6 + b], dark, 1.5);
    leg(-20, 1, C1); leg(6, -1, C1);
    // tête : charge vers l'avant
    ctx.save(); ctx.translate(18 + atk * 6, -32 + b); ctx.rotate(atk * 0.16);
    blob(ctx, team, () => { ctx.moveTo(2, 9); ctx.quadraticCurveTo(-10, 2, -7, -12); ctx.quadraticCurveTo(-3, -23, 8, -21); ctx.quadraticCurveTo(13.5, -10, 8.5, 4); }, 1.5);
    ctx.fillStyle = dark; for (const [x, y] of [[-2.5, -11], [1.5, -3], [3.5, -16]]) { ctx.beginPath(); ctx.ellipse(x, y, 2.4, 3, 0.3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.7;
    for (const [x, y, r] of [[-7.6, -6, -1.4], [-6.6, -13.5, -1], [-2.5, -20.6, -0.4], [3.6, -22.4, 0.1]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(0, -3.6); ctx.lineTo(1.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    blob(ctx, C1, () => { ctx.moveTo(3.5, -10); ctx.quadraticCurveTo(14, -12.5, 20, -4.5); ctx.quadraticCurveTo(25, 0, 23.5, 5); ctx.lineTo(20, 8.5); ctx.quadraticCurveTo(10, 10.5, 3.5, 6.5); });
    blob(ctx, '#dcc88c', () => { ctx.moveTo(20.5, 0); ctx.quadraticCurveTo(27.5, 2, 25.5, 8.6); ctx.lineTo(20.5, 8); }, 1);
    blob(ctx, IVORY, () => { ctx.moveTo(6.5, -8.5); ctx.quadraticCurveTo(14, -19, 26, -22); ctx.quadraticCurveTo(16.5, -13, 11.5, -7); }, 1);
    blob(ctx, IVORY, () => { ctx.moveTo(18.2, -3.2); ctx.lineTo(23.2, -10.5); ctx.lineTo(21.6, -1.6); }, 1);
    disc(ctx, 13, -3, 1.6, INK); disc(ctx, 13.4, -3.5, 0.5, '#fff');
    ctx.restore();
  } };

  A.units.ankylosaure = { h: 40, top: 45, draw(ctx, u, team, dark, atk) {
    const T = now(), mv = u.moving, ph = u.walk * 0.7, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 0.9 : -Math.sin(T * 1.7 + u.x * 0.04) * 0.4;
    const C1 = '#8a8452', C2 = '#6a6540', C3 = '#b7ad76';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (x, dir, col) => stump(ctx, x, -15, dir * st * 3, mv ? Math.max(0, dir * Math.cos(ph)) * 2 : 0, col, 4.4);
    leg(-11, -1, C2); leg(15, 1, C2);
    // queue à massue : traîne au repos, passe par-dessus le dos pour frapper
    ctx.save(); ctx.translate(-23, -17 + b); ctx.rotate(0.12 + atk * 2.1);
    limb(ctx, [0, 0, -9, -1.5, -17, -2], 4.6, C1);
    blob(ctx, C3, () => { ctx.moveTo(-16, -6); ctx.quadraticCurveTo(-24, -9, -26, -2.5); ctx.quadraticCurveTo(-24, 4, -16, 2); }, 1.3);
    disc(ctx, -21.5, -3, 1.3, C2);
    ctx.restore();
    blob(ctx, C1, () => { ctx.moveTo(-27, -14 + b); ctx.quadraticCurveTo(-27, -30 + b, -4, -33 + b); ctx.quadraticCurveTo(19, -33 + b, 27, -20 + b); ctx.lineTo(26, -12 + b); ctx.quadraticCurveTo(0, -8.5 + b, -27, -14 + b); }, 1.6);
    ctx.fillStyle = C3; ctx.strokeStyle = C2; ctx.lineWidth = 0.8;
    for (const [x, y] of [[-17, -25], [-8, -28.5], [2, -29.5], [12, -27.5], [20, -22.5], [-13, -19.5], [-3, -22], [8, -21.5]]) { ctx.beginPath(); ctx.ellipse(x, y + b, 3.6, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.8;
    for (const [x, y, r] of [[-20, -29.5, -0.6], [-10, -32.4, -0.25], [1, -33.4, 0], [12, -32, 0.3], [21, -27, 0.7]]) { ctx.save(); ctx.translate(x, y + b); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-2, 0.6); ctx.lineTo(0, -5); ctx.lineTo(2, 0.6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    blob(ctx, team, () => { ctx.moveTo(-26.5, -17 + b); ctx.quadraticCurveTo(0, -12.5 + b, 26.5, -17.5 + b); ctx.lineTo(26, -13.5 + b); ctx.quadraticCurveTo(0, -9 + b, -26.6, -14 + b); }, 1);
    leg(-19, 1, C1); leg(8, -1, C1);
    ctx.save(); ctx.translate(26 + atk * 2, -17 + b);
    blob(ctx, C1, () => { ctx.moveTo(-2, -6); ctx.quadraticCurveTo(7, -8, 11, -1.5); ctx.quadraticCurveTo(11.5, 3.5, 6, 4.5); ctx.lineTo(-2, 4); });
    blob(ctx, IVORY, () => { ctx.moveTo(0.5, -5.6); ctx.lineTo(-2.5, -10.5); ctx.lineTo(3.5, -6.4); }, 0.9);
    disc(ctx, 5.5, -2.6, 1.2, INK);
    ctx.restore();
  } };

  /* ------------------------------------------------- base : volcan et antre */
  A.bases.volcano = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    puffs(ctx, 44, G - 178, { n: 5, speed: 0.15, rise: 62, drift: 30, r0: 8, r1: 17, rgb: '86,76,72', a: 0.5 });
    halo(ctx, 44, G - 172, 44, '255,120,40', 0.45 + Math.sin(T * 3) * 0.1);
    const sil = [-14, G, -14, G - 96, 8, G - 140, 26, G - 172, 34, G - 177, 44, G - 171, 54, G - 177, 62, G - 172, 74, G - 132, 86, G - 70, 94, G];
    poly(ctx, sil, '#5b463a');
    poly(ctx, [-14, G - 96, 8, G - 140, 26, G - 172, 34, G - 177, 30, G - 120, 10, G - 78], '#7a6252');
    poly(ctx, [54, G - 177, 62, G - 172, 74, G - 132, 86, G - 70, 94, G, 72, G, 66, G - 90], '#43322a');
    line(ctx, [30, G - 120, 10, G - 78, 14, G - 30], 'rgba(43,29,20,0.3)', 1.2);
    oval(ctx, 44, G - 173, 11, 3.4, '#ff8a2a'); oval(ctx, 44, G - 173, 6, 1.8, '#ffe08a');
    // coulées de lave : cœur clair qui scintille
    for (const [pts, w] of [[[40, G - 171, 30, G - 140, 38, G - 104, 26, G - 74], 5], [[49, G - 171, 60, G - 146, 56, G - 118, 68, G - 96], 4]]) {
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); ctx.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]);
      ctx.strokeStyle = '#a8321a'; ctx.lineWidth = w + 2.5; ctx.stroke(); ctx.strokeStyle = '#ff7a22'; ctx.lineWidth = w; ctx.stroke();
      ctx.setLineDash([5, 7]); ctx.lineDashOffset = -T * 16; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = w * 0.4; ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(sil[0], sil[1]); for (let i = 2; i < sil.length; i += 2) ctx.lineTo(sil[i], sil[i + 1]); ctx.stroke();

    // l'antre : la gueule d'un crâne fossile géant
    blob(ctx, '#e6dcc0', () => { ctx.moveTo(22, G); ctx.lineTo(22, G - 34); ctx.quadraticCurveTo(24, G - 66, 50, G - 72); ctx.quadraticCurveTo(76, G - 70, 80, G - 40); ctx.lineTo(80, G); }, 1.8);
    poly(ctx, [50, G - 72, 76, G - 66, 80, G - 40, 80, G, 70, G, 70, G - 44, 62, G - 62], 'rgba(120,100,70,0.3)');
    const glow = ctx.createRadialGradient(51, G - 6, 3, 51, G - 6, 50);
    glow.addColorStop(0, '#ff9a3c'); glow.addColorStop(0.3, '#8a3a16'); glow.addColorStop(1, '#170e0a');
    blob(ctx, glow, () => { ctx.moveTo(30, G); ctx.lineTo(30, G - 26); ctx.quadraticCurveTo(32, G - 46, 51, G - 48); ctx.quadraticCurveTo(70, G - 46, 72, G - 26); ctx.lineTo(72, G); }, 1.6);
    ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.9;
    for (const [x, hh] of [[34, 10], [41, 13], [48, 14.5], [55, 14.5], [62, 12.5], [68.5, 9]]) { const y = G - 46 + Math.abs(x - 51) * 0.32; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + hh); ctx.lineTo(x + 3, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const x of [33, 40, 62, 69]) { ctx.beginPath(); ctx.moveTo(x - 2.6, G); ctx.lineTo(x, G - 7); ctx.lineTo(x + 2.6, G); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    oval(ctx, 63, G - 58, 5, 4, '#2a1c14', 1); oval(ctx, 39, G - 60, 2.2, 1.6, '#2a1c14');
    line(ctx, [28, G - 56, 34, G - 50], 'rgba(43,29,20,0.4)', 1); line(ctx, [72, G - 28, 77, G - 22], 'rgba(43,29,20,0.4)', 1);

    // corniches des tourelles, étayées par des os
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30;
      limb(ctx, [103, y + 2, 90 - s * 3, y + 17], 1.8, IVORY);
      poly(ctx, [76 - s * 2, y - 1, 104, y - 2.5, 109, y + 1, 105, y + 4.5, 78 - s * 2, y + 4.5], '#6d5647', 1.3);
      line(ctx, [79 - s * 2, y - 0.2, 103, y - 1.4], '#8d7462', 1.2);
    }

    // bannière sur une grande côte ; œufs, fougères
    const wv = Math.sin(T * 2.4 + side) * 2;
    ctx.beginPath(); ctx.moveTo(4, G - 124); ctx.quadraticCurveTo(-2, G - 160, 8, G - 190);
    ctx.strokeStyle = INK; ctx.lineWidth = 4.8; ctx.stroke(); ctx.strokeStyle = IVORY; ctx.lineWidth = 2.8; ctx.stroke();
    blob(ctx, team, () => { ctx.moveTo(7, G - 187); ctx.quadraticCurveTo(22, G - 190 + wv, 34, G - 184 + wv); ctx.lineTo(30, G - 178 + wv * 0.8); ctx.lineTo(35, G - 172 + wv * 0.6); ctx.lineTo(29, G - 167 + wv * 0.4); ctx.quadraticCurveTo(18, G - 163 + wv * 0.4, 3.5, G - 165); });
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(13, G - 181 + wv * 0.4); ctx.lineTo(17, G - 170 + wv * 0.4); ctx.lineTo(21, G - 181 + wv * 0.4); ctx.closePath(); ctx.fill();
    for (const [x, y, r] of [[4, G - 8, -0.2], [15, G - 6, 0.25]]) {
      oval(ctx, x, y, 6.5, 8.5, '#efe6cf', 1.3, r);
      ctx.fillStyle = '#b9a886'; for (const [dx, dy] of [[-2, -3], [2, 1], [-1, 3], [2.5, -4]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 0.9, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = '#4f8a3a'; ctx.lineWidth = 2;
    for (const [x, dir] of [[-6, 1], [24, -1], [88, 1]]) for (const k of [0.5, 1, 1.5]) { ctx.beginPath(); ctx.moveTo(x, G); ctx.quadraticCurveTo(x + dir * 4 * k, G - 16, x + dir * 12 * k, G - 9 - 3 * k); ctx.stroke(); }
  };

  /* -------------------------------------------------------------- tourelles */
  // Lance-épines : bulbe carnivore hérissé d'épines d'os.
  A.turrets['lance-epines'] = function (ctx, a, team) {
    limb(ctx, [-5, 8, -7, 1, -2, -3], 3, '#4f7a34');
    line(ctx, [-8.4, 4, -4.6, 3], team, 2.2);
    for (let i = 0; i < 5; i++) {
      const an = -1.05 + i * 0.44, bx = 2 + Math.cos(an) * 8, by = -7 + Math.sin(an) * 6.8, L = 8.5 - a * 4;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(an);
      blob(ctx, IVORY, () => { ctx.moveTo(-1, -1.5); ctx.lineTo(L, 0); ctx.lineTo(-1, 1.5); }, 0.8);
      ctx.restore();
    }
    oval(ctx, 2, -7, 9, 7.6, '#6a9a3e', 1.3, -0.2);
    ctx.fillStyle = '#93bf55'; ctx.beginPath(); ctx.ellipse(-1, -10, 4, 2.4, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3f6a2a'; for (const [x, y] of [[-3, -4], [1, -2.5], [5, -5], [3, -10.5]]) { ctx.beginPath(); ctx.arc(x, y, 1, 0, TAU); ctx.fill(); }
    oval(ctx, 9.5, -7, 1.6 + a * 1.5, 3.2 + a, '#7a2a3a', 0.9);
  };
  // Canon à ambre : grande corne creuse, charge d'ambre qui luit à la culasse.
  A.turrets['canon-ambre'] = function (ctx, a, team) {
    blob(ctx, '#6d5647', () => { ctx.moveTo(-11, 8); ctx.lineTo(-8, 1); ctx.lineTo(7, 1); ctx.lineTo(10, 8); }, 1.2);
    line(ctx, [-8.5, 4, 8.5, 4], team, 2.2);
    ctx.save(); ctx.translate(-a * 3, 0); ctx.rotate(-0.12);
    blob(ctx, IVORY, () => { ctx.moveTo(-8, -11); ctx.quadraticCurveTo(6, -13, 21, -8); ctx.lineTo(21, -4); ctx.quadraticCurveTo(6, -1, -8, -1); });
    line(ctx, [-4, -10.4, -4, -1.4], '#b9a886', 1); line(ctx, [4, -11, 4, -1.6], '#b9a886', 1); line(ctx, [12, -10.4, 12, -2.6], '#b9a886', 1);
    oval(ctx, 21, -6, 1.6, 2.4, '#2a1c14');
    halo(ctx, -9, -6, 11, '255,180,60', 0.5 + a * 0.4);
    disc(ctx, -9, -6, 6, '#f2a93b', 1.2); disc(ctx, -11, -8, 1.9, 'rgba(255,255,255,0.65)');
    ctx.restore();
  };
  // Geyser de lave : cheminée de roche, la lave bouillonne et jaillit au tir.
  A.turrets.geyser = function (ctx, a) {
    const T = now();
    halo(ctx, 0, -13, 13, '255,110,40', 0.4 + a * 0.5);
    if (a > 0) { ctx.fillStyle = '#ff7a22'; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.quadraticCurveTo(-3, -22 - a * 10, 0, -26 - a * 14); ctx.quadraticCurveTo(3, -22 - a * 10, 4, -12); ctx.closePath(); ctx.fill(); disc(ctx, 0, -18 - a * 8, 2 + a, '#ffd36a'); }
    poly(ctx, [-13, 8, -5, -12, 5, -12, 13, 8], '#5b463a', 1.3);
    poly(ctx, [-13, 8, -5, -12, -1, -12, -5, 8], '#7a6252');
    oval(ctx, 0, -12, 5, 2 + a, '#ff8a2a', 1);
    disc(ctx, -1.5 + Math.sin(T * 5) * 1.5, -12.4, 1.1, '#ffe08a');
    line(ctx, [3, -9, 6, -1, 4, 6], '#ff7a22', 1.6);
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.venom = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(150,240,90,0.35)'; ctx.beginPath(); ctx.moveTo(0, -3.4); ctx.lineTo(-15, 0); ctx.lineTo(0, 3.4); ctx.closePath(); ctx.fill();
    disc(ctx, -7, 1.5, 1.1, '#9cff5a'); disc(ctx, -11, -1, 0.8, '#9cff5a');
    oval(ctx, 0, 0, 4.4, 3.4, '#8be04a', 0.9); disc(ctx, 0.8, -1, 1.1, '#e4ffb8');
  };
  A.projectiles.spike = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    blob(ctx, IVORY, () => { ctx.moveTo(6, 0); ctx.lineTo(-9, -2.2); ctx.lineTo(-7, 0); ctx.lineTo(-9, 2.2); }, 0.8);
  };
  A.projectiles.amber = function (ctx, p) {
    halo(ctx, p.x, p.y, 11, '255,180,60', 0.45);
    disc(ctx, p.x, p.y, 5.6, '#f2a93b', 1); disc(ctx, p.x - 1.8, p.y - 1.8, 1.8, 'rgba(255,255,255,0.7)');
    disc(ctx, p.x + 1.5, p.y + 1.2, 1, '#a8641a');
  };
  A.projectiles.lava = function (ctx, p, dir) {
    halo(ctx, p.x, p.y, 15, '255,110,40', 0.5);
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = '#ff7a22'; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(-16, 0); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill();
    ctx.rotate(p.x * 0.05); stone(ctx, 6.5, '#5a3326', '#ff8a3c');
    disc(ctx, 1.5, 1.5, 1.6, '#ffd36a');
  };
  // Pluie de météores : roche en feu et longue traînée.
  A.drops.meteor = function (ctx, d) {
    const g = ctx.createLinearGradient(d.x, d.y - 78, d.x, d.y);
    g.addColorStop(0, 'rgba(255,150,50,0)'); g.addColorStop(1, 'rgba(255,150,50,0.7)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(d.x - 10, d.y - 2); ctx.lineTo(d.x - 2, d.y - 78); ctx.lineTo(d.x + 2, d.y - 78); ctx.lineTo(d.x + 10, d.y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,150,0.8)'; ctx.beginPath(); ctx.moveTo(d.x - 4, d.y - 4); ctx.lineTo(d.x, d.y - 44); ctx.lineTo(d.x + 4, d.y - 4); ctx.closePath(); ctx.fill();
    halo(ctx, d.x, d.y - 2, 22, '255,120,40', 0.55);
    ctx.save(); ctx.translate(d.x, d.y - 2); ctx.rotate(d.y * 0.03 + d.x); stone(ctx, 10, '#5a3a2c', '#ff8a3c'); ctx.restore();
  };

  /* ------------------------------------------------------------------ décor */
  // Silhouettes à deux tons, sans contour. Une forme effilée le long d'une courbe (cou, queue, tronc).
  function effile(g, p0, p1, p2, r0, r1, col, n = 34) {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i <= n; i++) {
      const k = i / n, x = (1 - k) * (1 - k) * p0[0] + 2 * (1 - k) * k * p1[0] + k * k * p2[0], y = (1 - k) * (1 - k) * p0[1] + 2 * (1 - k) * k * p1[1] + k * k * p2[1], r = r0 + (r1 - r0) * k;
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }
  const plein = (g, x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  // Une palme : une feuille pleine, de sa base vers une pointe qui retombe.
  function palme(g, x, y, a, L, w, col) {
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.5 + L * 0.34, cx = x + Math.cos(a) * L * 0.55, cy = y + Math.sin(a) * L * 0.95 - L * 0.12;
    g.fillStyle = col; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy - w, ex, ey); g.quadraticCurveTo(cx, cy + w, x, y); g.fill();
  }
  // Fougère arborescente : tronc fin et courbe, grande couronne de palmes pleines qui retombent.
  function fougere(g, x, y, s, col, sombre) {
    const hx = x - 5 * s, hy = y - 62 * s;
    effile(g, [x, y + 4], [x + 9 * s, y - 30 * s], [hx, hy], 4.6 * s, 2.6 * s, sombre);
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * 1.04 + i * Math.PI * 1.08 / 10 + Math.sin(i * 1.7 + x) * 0.035, L = (34 + (i % 2) * 9 - Math.abs(i - 5) * 1.2) * s;
      palme(g, hx, hy, a, L, 6.5 * s, i % 2 ? sombre : col);
    }
    plein(g, hx, hy, 4.2 * s, 3.4 * s, sombre);
  }
  // Une jambe de sauropode : cuisse large qui part de l'intérieur du corps (y = haut), genou plus fin, pied posé à y = 0.
  function jambe(g, x, haut, w, col) {
    const k = haut * 0.3;
    g.fillStyle = col; g.beginPath(); g.moveTo(x - w * 0.6, haut);
    g.quadraticCurveTo(x - w * 0.56, haut * 0.55, x - w * 0.36, k); g.lineTo(x - w * 0.44, -2.5); g.quadraticCurveTo(x - w * 0.46, 0, x - w * 0.3, 0);
    g.lineTo(x + w * 0.42, 0); g.quadraticCurveTo(x + w * 0.56, 0, x + w * 0.5, -3); g.lineTo(x + w * 0.36, k);
    g.quadraticCurveTo(x + w * 0.56, haut * 0.55, x + w * 0.6, haut); g.closePath(); g.fill();
  }
  // Diplodocus : cou tendu à l'horizontale, longue queue en fouet. k = taille (le petit qui suit est à 0.46).
  function diplodocus(g, x, y, k, col, sombre, bal) {
    g.save(); g.translate(x, y); g.scale(k, k);
    jambe(g, -27, -42, 13, sombre); jambe(g, 13, -42, 13, sombre);
    effile(g, [-34, -40], [-90, -46 + bal * 0.5], [-150, -18 + bal], 11, 0.8, col, 48);
    plein(g, 0, -40, 42, 19, col);
    g.save(); g.beginPath(); g.ellipse(0, -40, 42, 19, 0, 0, TAU); g.clip(); g.fillStyle = sombre; g.fillRect(-50, -33, 100, 30); g.restore();
    jambe(g, -13, -44, 15, col); jambe(g, 25, -44, 15, col);
    effile(g, [34, -46], [78, -70 - bal * 0.4], [124, -66 - bal], 11, 4, col, 44);
    plein(g, 131, -65 - bal, 10, 5, col, 0.12);
    g.restore();
  }
  function volcanoFar(g, x, base, w, hh, col, lit) {
    poly(g, [x - w, base, x - w * 0.16, base - hh, x + w * 0.16, base - hh, x + w, base], col);
    poly(g, [x + w * 0.02, base - hh, x + w * 0.16, base - hh, x + w, base, x + w * 0.4, base], 'rgba(40,20,30,0.2)');
    if (lit) { halo(g, x, base - hh, 60, '255,120,50', 0.55); oval(g, x, base - hh, w * 0.16, 3, '#ffb04a'); line(g, [x - 4, base - hh, x - 12, base - hh * 0.62, x - 6, base - hh * 0.3], '#ff8a3c', 3); }
  }

  A.backdrops.jurassique = backdrop('jurassique', 7310, (g, r) => {
    sky(g, [[0, '#d9634f'], [0.38, '#f29a63'], [0.72, '#f9cf8f'], [1, '#fde9bd']]);
    halo(g, 300, 372, 330, '255,240,190', 0.75); disc(g, 300, 372, 62, '#fff3cf');
    volcanoFar(g, 930, 500, 250, 250, '#a8616a', true);
    volcanoFar(g, 560, 500, 200, 150, '#b87a78', false);
    volcanoFar(g, 1230, 500, 180, 130, '#b87a78', false);
    const gr = g.createLinearGradient(0, 400, 0, 540); gr.addColorStop(0, 'rgba(253,226,180,0)'); gr.addColorStop(1, 'rgba(253,226,180,0.9)');
    g.fillStyle = gr; g.fillRect(-40, 400, W + 80, 220);
  }, (f, r) => {
    const h1 = x => 500 - Math.sin(x * 0.0046 + 2.2) * 26 - Math.sin(x * 0.012 + 0.4) * 9;
    const h2 = x => 560 - Math.sin(x * 0.0062 + 0.9) * 18 - Math.sin(x * 0.019 + 3) * 6;
    hills(f, h1, 0, '#6f9a66');
    // diplodocus au loin, suivi de son petit
    const sy = h1(700) + 4;
    diplodocus(f, 622, sy, 0.46, '#5c8a5e', '#507c54', -2); diplodocus(f, 718, sy, 1, '#5c8a5e', '#507c54', 1);
    for (const [x, s] of [[70, 1.1], [150, 0.8], [330, 1], [470, 0.75], [1010, 1.05], [1090, 0.8], [1210, 1.15]]) fougere(f, x, h1(x), s, '#4f7f52', '#467349');
    let gr = f.createLinearGradient(0, 430, 0, 560); gr.addColorStop(0, 'rgba(253,226,180,0)'); gr.addColorStop(1, 'rgba(253,226,180,0.45)');
    f.fillStyle = gr; f.fillRect(-40, 430, W + 80, 140);
    hills(f, h2, 0, '#3f7a44');
    gr = f.createLinearGradient(0, 540, 0, GROUND); gr.addColorStop(0, '#356b3c'); gr.addColorStop(1, '#2c5a36');
    hills(f, h2, 5, gr);
    for (const [x, s] of [[30, 1.5], [230, 1.2], [560, 1.6], [880, 1.3], [1150, 1.5], [1255, 1.1]]) fougere(f, x, h2(x) + 8, s, '#27502f', '#204528');
    f.strokeStyle = '#2f6238'; f.lineWidth = 3;
    for (let i = 0; i < 26; i++) { const x = r() * W, y = h2(x) + 10 + r() * 20; for (const k of [-1, -0.4, 0.4, 1]) { f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + k * 8, y - 18, x + k * 20, y - 8); f.stroke(); } }
    soil(f, r, { top: '#5d4a2e', bottom: '#3a2c1a', pebbles: ['#6f6356', '#857868'], nPebbles: 26, tufts: ['#4f8a3a', '#6aa04a'], band: '#4f8a3a', bandLight: '#74b055', blade: '#3f7a30' });
  }, (ctx, t, dt, R) => {
    puffs(ctx, 930, 248, { n: 6, speed: 0.07, rise: 150, drift: 110, r0: 14, r1: 46, rgb: '120,96,104', a: 0.5 });
    clouds(ctx, R, dt, 'rgba(240,170,130,0.6)', 'rgba(255,226,196,0.85)');
    flock(ctx, t, dt, 'jurassique', '#5a3a3a', 4, (c, x, y, s, fl) => {      // ptérosaures
      c.beginPath(); c.moveTo(x - 16 * s, y - fl * 7 * s); c.quadraticCurveTo(x - 7 * s, y - 3 * s, x, y); c.quadraticCurveTo(x + 7 * s, y - 3 * s, x + 16 * s, y - fl * 7 * s);
      c.lineTo(x + 5 * s, y + 3 * s); c.lineTo(x - 5 * s, y + 3 * s); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x + 2 * s, y - 1); c.lineTo(x + 13 * s, y + 2 * s); c.lineTo(x + 3 * s, y + 3 * s); c.closePath(); c.fill();
    });
  });
})();

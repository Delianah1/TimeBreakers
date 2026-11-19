/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE CACHÉ DU MAGMA (js/magma.js pour les règles)
   Plateau de basalte noir, fissures rouges, volcan en éruption au fond.
   Voir js/art.js pour le principe.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, now, blob, limb, stone, dk, poly, line, disc, oval, puffs, flame, halo, backdrop, sky, hills } = K;
  const BASALTE = '#3a3236', BASALTE_L = '#5a4d52', BASALTE_D = '#241e22';
  const LAVE = '#ff6a22', LAVE_L = '#ffb44a', LAVE_C = '#ffe9a0', CROUTE = '#7a2a18';

  // Une fissure de lave qui palpite : trait sombre, cœur orange, éclat clair.
  function fissure(ctx, pts, w, T, ph) {
    const p = 0.75 + 0.25 * Math.sin(T * 3 + (ph || 0));
    line(ctx, pts, CROUTE, w + 1.6);
    ctx.globalAlpha = p; line(ctx, pts, LAVE, w); line(ctx, pts, LAVE_C, w * 0.35); ctx.globalAlpha = 1;
  }
  K.fissure = fissure;
  // Braises qui montent d'un point.
  function braises(ctx, x, y, n, h, T, seed) {
    for (let i = 0; i < n; i++) {
      const k = (T * 0.8 + i / n + (seed || 0)) % 1;
      ctx.globalAlpha = 1 - k; disc(ctx, x + Math.sin(k * 9 + i * 2) * 4, y - k * h, 1.4 * (1 - k) + 0.4, i % 2 ? LAVE_L : LAVE);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------ unités */
  // Salamandre ardente : longue, basse, dos crénelé, taches qui luisent, harnais d'équipe.
  function salamandre(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, ph = u.walk * 1.5, sw = mv ? Math.sin(ph) : 0, ond = Math.sin(T * 4 + u.x * 0.05);
    const C1 = o.body, C2 = dk(o.body, 0.7), s = o.s || 1;
    ctx.save(); ctx.scale(s, s);
    const patte = (x, dir, col) => { const f = dir * sw * 5; limb(ctx, [x, -8, x + f + 2, -4, x + f + 4, -0.6], 2.6, col); };
    patte(-9, -1, C2); patte(7, 1, C2);
    // queue qui ondule
    blob(ctx, C1, () => { ctx.moveTo(-10, -11); ctx.quadraticCurveTo(-22, -12 + ond * 3, -32, -6 + ond * 4); ctx.quadraticCurveTo(-22, -6 + ond * 2, -10, -5); });
    // corps
    blob(ctx, C1, () => { ctx.moveTo(-13, -8); ctx.quadraticCurveTo(-10, -16, 2, -15.5); ctx.quadraticCurveTo(12, -15, 14, -9); ctx.quadraticCurveTo(10, -4.5, 0, -4.5); ctx.quadraticCurveTo(-11, -4.5, -13, -8); });
    ctx.fillStyle = o.belly; ctx.beginPath(); ctx.moveTo(-11, -6.5); ctx.quadraticCurveTo(0, -3.6, 12, -7.5); ctx.quadraticCurveTo(0, -5.8, -11, -6.5); ctx.fill();
    // crête de flammes sur le dos
    for (let i = 0; i < 5; i++) flame(ctx, -9 + i * 4.5, -14.6 + Math.abs(i - 2) * 0.4, 5 + (i % 2) * 2 + atk * 3, 3.4, i * 1.7 + u.x);
    // taches qui luisent
    const p = 0.6 + 0.4 * Math.sin(T * 5 + u.x);
    ctx.globalAlpha = p; for (const [x, y, r] of [[-7, -10, 1.6], [-1, -12, 1.3], [5, -11, 1.5], [-18, -9 + ond * 1.5, 1.1]]) disc(ctx, x, y, r, LAVE_L);
    ctx.globalAlpha = 1;
    // harnais d'équipe
    blob(ctx, team, () => { ctx.moveTo(-3, -15.2); ctx.lineTo(2, -15.4); ctx.lineTo(3, -5); ctx.lineTo(-2, -4.8); }, 1);
    patte(-6, 1, C1); patte(10, -1, C1);
    // tête : la gueule s'ouvre à l'attaque
    ctx.save(); ctx.translate(13, -10); ctx.rotate(-0.1 - atk * 0.2);
    blob(ctx, C1, () => { ctx.moveTo(-2, -4); ctx.quadraticCurveTo(6, -6.5, 11, -2.5); ctx.lineTo(11, -0.5); ctx.quadraticCurveTo(5, 0.5, -2, 2); });
    ctx.save(); ctx.translate(1, 1); ctx.rotate(atk * 0.6);
    blob(ctx, C2, () => { ctx.moveTo(-2, 0); ctx.lineTo(9.5, -0.6); ctx.lineTo(8, 1.6); ctx.lineTo(-1, 2.4); }, 1);
    ctx.restore();
    if (atk > 0.2) flame(ctx, 12, -1, 4 + atk * 6, 3, u.x);
    disc(ctx, 4.5, -3.2, 1.5, '#ffe36a', 0.7); disc(ctx, 5, -3.2, 0.6, INK);
    if (o.crown) o.R.crown(ctx, 2, -7);
    ctx.restore();
    ctx.restore();
  }
  A.units.salamandre = { h: 22, draw(ctx, u, team, dark, atk) { salamandre(ctx, u, team, dark, atk, { body: '#c8402a', belly: '#f2a050' }); } };

  // Silhouette de basalte (cracheur, golem, titan) : un corps de roche taillé, fissures de lave.
  // o : k (carrure), eclat (carapace tombée), bouche (crache), crown, R
  function rocheux(ctx, u, team, dark, atk, o) {
    const T = now(), mv = u.moving, sw = mv ? Math.sin(u.walk * (o.lent ? 0.7 : 1)) : 0;
    const bob = mv ? Math.abs(Math.cos(u.walk)) * 1.2 : Math.sin(T * 1.8 + u.x * 0.05) * 0.4;
    const k = o.k || 1, ty = -bob, C1 = o.eclat ? '#4a2a22' : BASALTE_L, C2 = o.eclat ? '#2e1a16' : BASALTE;
    const jambe = (dir, col) => { const fx = dir * sw * 5 * k; blob(ctx, col, () => { ctx.moveTo(dir * 3 * k - 4 * k, -16 * k + ty); ctx.lineTo(dir * 3 * k + 4 * k, -16 * k + ty); ctx.lineTo(fx + 4.5 * k, 0); ctx.lineTo(fx - 4.5 * k, 0); }, 1.3); };
    jambe(-1, C2);
    // bras arrière
    limb(ctx, [-6 * k, -30 * k + ty, -9 * k - sw * 2, -22 * k + ty, -8 * k - sw * 3, -15 * k + ty], 4.4 * k, C2);
    jambe(1, C1);
    // tronc : bloc taillé
    blob(ctx, C1, () => { ctx.moveTo(-9 * k, -15 * k + ty); ctx.lineTo(-11 * k, -32 * k + ty); ctx.lineTo(-4 * k, -38 * k + ty); ctx.lineTo(7 * k, -37 * k + ty); ctx.lineTo(11 * k, -30 * k + ty); ctx.lineTo(9 * k, -15 * k + ty); });
    poly(ctx, [2 * k, -37 * k + ty, 7 * k, -37 * k + ty, 11 * k, -30 * k + ty, 9 * k, -15 * k + ty, 4 * k, -15 * k + ty], 'rgba(0,0,0,0.18)');
    // fissures du torse
    fissure(ctx, [-6 * k, -33 * k + ty, -2 * k, -27 * k + ty, -5 * k, -21 * k + ty], 1.6 * k, T, u.x);
    fissure(ctx, [4 * k, -34 * k + ty, 2 * k, -26 * k + ty, 6 * k, -18 * k + ty], 1.3 * k, T, u.x + 2);
    if (o.eclat) { halo(ctx, 0, -26 * k + ty, 16 * k, '255,120,40', 0.5); braises(ctx, 0, -36 * k + ty, 4, 22 * k, T, u.x); }
    // golem : éclats d'obsidienne plantés dans le dos et les épaules (ils tombent quand la carapace éclate)
    if (o.pics && !o.eclat) for (const [x, y, a, L] of [[-9, -34, -2.3, 9], [-4, -38, -1.9, 11], [3, -38.5, -1.4, 8], [-11, -26, -2.7, 7]]) {
      ctx.save(); ctx.translate(x * k, y * k + ty); ctx.rotate(a);
      blob(ctx, '#1e1a24', () => { ctx.moveTo(0, -2.4 * k); ctx.lineTo(L * k, 0); ctx.lineTo(0, 2.4 * k); }, 1);
      line(ctx, [1 * k, -0.8 * k, L * 0.7 * k, -0.2 * k], 'rgba(190,180,255,0.45)', 1);
      ctx.restore();
    }
    if (o.capuche) blob(ctx, '#4a4044', () => { ctx.moveTo(-9 * k, -30 * k + ty); ctx.quadraticCurveTo(-12 * k, -46 * k + ty, 1 * k, -51 * k + ty); ctx.quadraticCurveTo(9 * k, -50 * k + ty, 10 * k, -42 * k + ty); ctx.lineTo(-2 * k, -36 * k + ty); }, 1.2);
    // ceinture d'équipe
    blob(ctx, team, () => { ctx.moveTo(-10 * k, -19 * k + ty); ctx.lineTo(10 * k, -19.5 * k + ty); ctx.lineTo(9.5 * k, -15 * k + ty); ctx.lineTo(-9.5 * k, -14.6 * k + ty); }, 1);
    // tête
    const hx = 3 * k, hy = -43 * k + ty;
    blob(ctx, C1, () => { ctx.moveTo(hx - 6 * k, hy + 5 * k); ctx.lineTo(hx - 7 * k, hy - 3 * k); ctx.lineTo(hx - 1 * k, hy - 7 * k); ctx.lineTo(hx + 6 * k, hy - 4 * k); ctx.lineTo(hx + 7 * k, hy + 4 * k); });
    const yeux = 0.7 + 0.3 * Math.sin(T * 4 + u.x);
    ctx.globalAlpha = yeux; disc(ctx, hx + 3.2 * k, hy - 0.5 * k, 1.5 * k, LAVE_L); ctx.globalAlpha = 1;
    if (o.bouche) { const b = atk * 3 * k; poly(ctx, [hx + 1 * k, hy + 2.5 * k, hx + 6.5 * k, hy + 2 * k, hx + 6 * k, hy + 3.5 * k + b, hx + 1.5 * k, hy + 3.5 * k + b], '#2a0e08'); if (atk > 0.3) halo(ctx, hx + 7 * k, hy + 3 * k, 8 * k, '255,140,60', atk * 0.8); }
    else line(ctx, [hx + 1.5 * k, hy + 3 * k, hx + 6 * k, hy + 2.6 * k], LAVE, 1.2);
    if (o.cornes) for (const d of [-1, 1]) blob(ctx, BASALTE_D, () => { ctx.moveTo(hx + d * 3 * k - 1, hy - 6 * k); ctx.lineTo(hx + d * 7 * k, hy - 13 * k); ctx.lineTo(hx + d * 4 * k + 1.5, hy - 5 * k); }, 1);
    if (o.crown) o.R.crown(ctx, hx, hy - 9 * k);
    // bras avant : poing de pierre (le coup part vers l'avant)
    const px = 9 * k + atk * 6 * k, py = -24 * k + ty - atk * 3 * k;
    limb(ctx, [8 * k, -33 * k + ty, 11 * k, -27 * k + ty, px, py], 4.6 * k, C1);
    ctx.save(); ctx.translate(px + 1.5 * k, py); stone(ctx, 4.2 * k, C1, BASALTE_L); ctx.restore();
    if (o.eclat) for (const [x, y] of [[-8, -28], [9, -24]]) braises(ctx, x * k, y * k + ty, 2, 10, T, x);
  }

  A.units.cendreux = { h: 46, draw(ctx, u, team, dark, atk) {
    rocheux(ctx, u, team, dark, atk, { k: 0.95, bouche: true, capuche: true });
    puffs(ctx, 6, -48, { n: 3, speed: 0.5, rise: 16, drift: -6, r0: 1.5, r1: 3, rgb: '90,80,80', a: 0.5 });
  } };
  A.units['golem-obsidienne'] = { h: 58, draw(ctx, u, team, dark, atk) { ctx.save(); ctx.scale(1.25, 1); rocheux(ctx, u, team, dark, atk, { k: 1.2, lent: true, eclat: u.eclat, pics: true }); ctx.restore(); } };

  // Élémentaire de lave : un corps qui coule, sans jambes, bras en vagues ; la mini-version suit la même forme.
  function elementaire(ctx, u, team, dark, atk) {
    const T = now(), mv = u.moving, ond = Math.sin(T * 3 + u.x * 0.04), b = mv ? Math.sin(u.walk * 1.2) * 1.2 : 0;
    halo(ctx, 0, -20, 30, '255,110,40', 0.35);
    // flaque à la base
    oval(ctx, 0, -1.5, 15, 3.4, CROUTE); oval(ctx, 0, -2, 12, 2.4, LAVE);
    // corps en goutte
    blob(ctx, LAVE, () => { ctx.moveTo(-12, -2); ctx.quadraticCurveTo(-15 + ond, -18 + b, -8, -30 + b); ctx.quadraticCurveTo(0, -42 + b, 8, -31 + b); ctx.quadraticCurveTo(14 - ond, -18 + b, 12, -2); });
    // croûte de basalte par plaques
    for (const [x, y, r, a] of [[-6, -14, 4.5, 0.3], [5, -20, 4, -0.4], [-2, -27, 3.4, 0.8], [7, -9, 3.2, 0.1]]) { ctx.save(); ctx.translate(x, y + b); ctx.rotate(a); stone(ctx, r, BASALTE, BASALTE_L); ctx.restore(); }
    ctx.globalAlpha = 0.85; blob(ctx, LAVE_L, () => { ctx.moveTo(-5, -6); ctx.quadraticCurveTo(-8, -18 + b, -3, -28 + b); ctx.quadraticCurveTo(-1, -16 + b, -2, -6); }, 0); ctx.globalAlpha = 1;
    // écharpe d'équipe
    blob(ctx, team, () => { ctx.moveTo(-9, -24 + b); ctx.quadraticCurveTo(0, -20 + b, 9.5, -25 + b); ctx.lineTo(9, -21 + b); ctx.quadraticCurveTo(0, -16 + b, -9.5, -20 + b); }, 1);
    // tête : visage creusé
    disc(ctx, 3.5, -33 + b, 1.6, '#2a0e08'); disc(ctx, 8, -32.5 + b, 1.3, '#2a0e08');
    flame(ctx, 0, -37 + b, 9 + atk * 5, 8, u.x);
    // bras : vague qui frappe vers l'avant
    const px = 13 + atk * 9, py = -22 + b - atk * 4;
    limb(ctx, [5, -26 + b, 11, -26 + b + ond, px, py], 4.5, LAVE);
    disc(ctx, px, py, 3.6, LAVE_L, 1);
    limb(ctx, [-6, -25 + b, -12, -20 + b - ond, -13, -14 + b], 4, dk(LAVE, 0.85));
    braises(ctx, 0, -40 + b, 3, 16, T, u.x);
  }
  A.units['elementaire-lave'] = { h: 44, top: 46, draw: elementaire };
  A.units['petit-elementaire'] = { h: 44, draw: elementaire };

  /* ------------------------------------------------------------ champions */
  A.units['ch-titan-magma'] = { h: 64, draw(ctx, u, team, dark, atk, R) {
    halo(ctx, 0, -30, 44, '255,110,40', 0.3);
    rocheux(ctx, u, team, dark, atk, { k: 1.4, lent: true, cornes: true, crown: true, R, eclat: u.hp < u.maxHp * 0.5 });
    for (const [x, y] of [[-12, -50], [14, -46]]) flame(ctx, x, y, 9, 6, x);
  } };
  A.units['ch-reine-salamandres'] = { h: 30, draw(ctx, u, team, dark, atk, R) {
    ctx.save(); ctx.translate(-4, 0);
    salamandre(ctx, u, team, dark, atk, { body: '#a8281e', belly: '#ffc060', s: 1.25, crown: true, R });
    ctx.restore();
  } };
  // Phénix des cendres : grand oiseau de feu ; une fois relevé (cendres), il vire au gris brûlant.
  A.units['ch-phenix'] = { h: 40, draw(ctx, u, team, dark, atk, R) {
    const T = now(), fl = Math.sin(T * 6 + u.x * 0.02), cendre = u.cs && u.cs.mort;
    const C1 = cendre ? '#8a6a62' : '#ff7a22', C2 = cendre ? '#5a4440' : '#d8401a', C3 = cendre ? '#d8b0a0' : LAVE_C;
    halo(ctx, 0, -20, 40, cendre ? '255,160,120' : '255,140,40', 0.45);
    // ailes
    for (const [d, col] of [[-1, C2], [1, C1]]) {
      ctx.save(); ctx.translate(-2, -22); ctx.scale(1, d < 0 ? 0.85 : 1); ctx.rotate(-0.2 - fl * 0.5 * (d < 0 ? 0.8 : 1));
      blob(ctx, col, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-10, -22, -30, -26); ctx.lineTo(-24, -20); ctx.lineTo(-33, -17); ctx.lineTo(-24, -13); ctx.lineTo(-30, -7); ctx.quadraticCurveTo(-14, -4, 0, 4); });
      for (const [x, y] of [[-12, -16], [-20, -14], [-16, -8]]) flame(ctx, x, y, 6, 4, x + d);
      ctx.restore();
    }
    // traîne de flammes
    for (let i = 0; i < 4; i++) flame(ctx, -16 - i * 5, -16 + i * 2 + fl * 2, 10 - i * 1.5, 5, i * 3 + u.x);
    blob(ctx, C1, () => { ctx.moveTo(-12, -20); ctx.quadraticCurveTo(-6, -32, 6, -28); ctx.quadraticCurveTo(12, -22, 4, -14); ctx.quadraticCurveTo(-6, -12, -12, -20); });
    ctx.fillStyle = C3; ctx.beginPath(); ctx.moveTo(-6, -17); ctx.quadraticCurveTo(2, -15, 7, -21); ctx.quadraticCurveTo(2, -18, -6, -17); ctx.fill();
    // collier d'équipe
    blob(ctx, team, () => { ctx.moveTo(3, -28); ctx.lineTo(7.5, -26.5); ctx.lineTo(6.5, -23); ctx.lineTo(2, -24.5); }, 1);
    // tête, bec, aigrette
    blob(ctx, C1, () => ctx.arc(9, -31, 4.6, 0, TAU));
    blob(ctx, '#ffd23f', () => { ctx.moveTo(12.5, -32.5); ctx.lineTo(19 + atk * 2, -30.5); ctx.lineTo(12.5, -29); }, 1);
    for (let i = 0; i < 3; i++) flame(ctx, 6 - i * 2.5, -34.5, 7 + i, 3, i + u.x);
    disc(ctx, 10.5, -32, 1.1, INK);
    R.crown(ctx, 8, -38);
    // pattes repliées
    limb(ctx, [-2, -14, 0, -9, 3, -8], 1.4, '#3a2016');
    if (cendre) braises(ctx, 0, -10, 4, 26, T, u.x);
  } };

  /* -------------------------------------------------------------- tourelles */
  // Brasero : vasque de basalte sur trépied, les braises partent à chaque tir.
  A.turrets.brasero = function (ctx, a, team) {
    const T = now();
    for (const x of [-8, 0, 8]) limb(ctx, [x * 0.5, -4, x, 8], 2, BASALTE_D);
    line(ctx, [-7, 3, 7, 3], team, 2.2);
    halo(ctx, 0, -10, 15, '255,120,40', 0.45 + a * 0.4);
    flame(ctx, 0, -7, 12 + a * 8, 13, 3);
    blob(ctx, BASALTE, () => { ctx.moveTo(-11, -8); ctx.lineTo(11, -8); ctx.quadraticCurveTo(9, -1, 0, -1); ctx.quadraticCurveTo(-9, -1, -11, -8); }, 1.3);
    line(ctx, [-9, -6.5, 9, -6.5], BASALTE_L, 1.2);
    disc(ctx, -3 + Math.sin(T * 6), -9, 1.2, LAVE_C);
  };
  // Geyser de magma : cratère de basalte, jaillit en gerbe au tir.
  A.turrets['geyser-magma'] = function (ctx, a) {
    const T = now();
    halo(ctx, 0, -12, 15, '255,100,30', 0.45 + a * 0.5);
    if (a > 0) for (const d of [-1, 0, 1]) { ctx.fillStyle = d ? LAVE : LAVE_L; ctx.beginPath(); ctx.moveTo(-3 + d * 3, -10); ctx.quadraticCurveTo(d * 6, -24 - a * 12, d * 9, -30 - a * 12 + Math.abs(d) * 6); ctx.quadraticCurveTo(d * 4 + 2, -22, 3 + d * 3, -10); ctx.closePath(); ctx.fill(); }
    poly(ctx, [-14, 8, -7, -10, 7, -10, 14, 8], BASALTE, 1.3);
    poly(ctx, [-14, 8, -7, -10, -3, -10, -7, 8], BASALTE_L);
    oval(ctx, 0, -10, 7, 2.4 + a, LAVE, 1);
    disc(ctx, -2 + Math.sin(T * 5) * 2, -10.3, 1.2, LAVE_C);
    fissure(ctx, [4, -6, 7, 0, 5, 6], 1.4, T);
  };
  // Mortier à obsidienne : fût trapu de verre noir cerclé de cuivre.
  A.turrets['mortier-obsidienne'] = function (ctx, a, team) {
    blob(ctx, BASALTE_D, () => { ctx.moveTo(-12, 8); ctx.lineTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(12, 8); }, 1.3);
    line(ctx, [-9.5, 4, 9.5, 4], team, 2.2);
    ctx.save(); ctx.translate(0, -1 + a * 2); ctx.rotate(-0.75);
    blob(ctx, '#1e1a24', () => { ctx.moveTo(-5, 3); ctx.lineTo(-6, -14); ctx.lineTo(6, -14); ctx.lineTo(5, 3); }, 1.3);
    line(ctx, [-3.5, -12, -2.5, 0], 'rgba(200,190,255,0.35)', 1.4);
    for (const y of [-12, -4]) line(ctx, [-6, y, 6, y], '#c87a3a', 1.8);
    oval(ctx, 0, -14, 6, 2, '#0e0a10', 1);
    if (a > 0.3) halo(ctx, 0, -16, 10, '255,150,60', a);
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.braise = function (ctx, p) {
    halo(ctx, p.x, p.y, 10, '255,120,40', 0.55);
    disc(ctx, p.x, p.y, 3.4, LAVE, 0.8); disc(ctx, p.x - 0.8, p.y - 0.8, 1.3, LAVE_C);
  };
  A.projectiles.cendre = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(80,70,70,0.45)'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-16, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
    disc(ctx, 0, 0, 4, '#4a3e3e', 0.9); disc(ctx, 0.5, -0.5, 1.8, LAVE);
  };
  A.projectiles.obsidienne = function (ctx, p) {
    ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.04);
    halo(ctx, 0, 0, 12, '255,120,50', 0.35);
    stone(ctx, 6.5, '#1e1a24', '#5a5070');
    line(ctx, [-2, -3, 2, 1], LAVE, 1.3);
  };
  // Pluie de lave : bombe volcanique, traînée de fumée.
  A.drops.lavabomb = function (ctx, d) {
    ctx.fillStyle = 'rgba(70,60,60,0.45)'; ctx.beginPath(); ctx.moveTo(d.x - 8, d.y - 4); ctx.lineTo(d.x - 3, d.y - 70); ctx.lineTo(d.x + 3, d.y - 70); ctx.lineTo(d.x + 8, d.y - 4); ctx.closePath(); ctx.fill();
    halo(ctx, d.x, d.y - 2, 20, '255,100,30', 0.6);
    ctx.save(); ctx.translate(d.x, d.y - 2); ctx.rotate(d.y * 0.04); stone(ctx, 9, CROUTE, LAVE); line(ctx, [-5, -2, 0, 2, 4, -3], LAVE_C, 1.4); ctx.restore();
  };

  /* -------------------------------------------------------------------- base */
  // Forteresse de basalte : orgues de lave, douves rougeoyantes, bannière sur une colonne.
  A.bases.magma = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    halo(ctx, 50, G - 20, 90, '255,90,30', 0.3);
    // orgues de basalte (colonnes hexagonales)
    const cols = [[4, 150, 16], [20, 178, 17], [37, 196, 18], [55, 168, 17], [72, 140, 16], [88, 112, 15]];
    for (const [x, h, w] of cols) {
      blob(ctx, BASALTE, () => { ctx.moveTo(x, G); ctx.lineTo(x, G - h + 4); ctx.lineTo(x + w * 0.5, G - h); ctx.lineTo(x + w, G - h + 4); ctx.lineTo(x + w, G); }, 1.5);
      poly(ctx, [x, G - h + 4, x + w * 0.5, G - h, x + w, G - h + 4, x + w * 0.5, G - h + 8], BASALTE_L);
      poly(ctx, [x + w * 0.62, G - h + 7, x + w, G - h + 4, x + w, G, x + w * 0.62, G], 'rgba(0,0,0,0.22)');
      for (let y = G - h + 30; y < G - 10; y += 34) line(ctx, [x + 1, y, x + w - 1, y + 3], BASALTE_D, 1.2);
    }
    // coulées dans les joints
    for (const [pts, w, ph] of [[[37, G - 186, 34, G - 140, 38, G - 96, 33, G - 50], 3.4, 0], [[55, G - 160, 57, G - 120, 53, G - 80], 2.6, 1.5], [[20, G - 150, 18, G - 110, 22, G - 70], 2.4, 3]]) {
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.strokeStyle = CROUTE; ctx.lineWidth = w + 2.4; ctx.stroke(); ctx.strokeStyle = LAVE; ctx.lineWidth = w; ctx.stroke();
      ctx.setLineDash([5, 7]); ctx.lineDashOffset = -T * 14 - ph * 10; ctx.strokeStyle = LAVE_C; ctx.lineWidth = w * 0.4; ctx.stroke(); ctx.setLineDash([]);
    }
    // cratère au sommet de la grande colonne
    halo(ctx, 46, G - 198, 26, '255,120,40', 0.6);
    oval(ctx, 46, G - 197, 7, 2.2, LAVE_L);
    puffs(ctx, 46, G - 204, { n: 4, speed: 0.12, rise: 70, drift: -30, r0: 5, r1: 16, rgb: '70,60,64', a: 0.45 });
    // porte : gueule rougeoyante
    const glow = ctx.createRadialGradient(46, G - 6, 3, 46, G - 6, 40);
    glow.addColorStop(0, LAVE_L); glow.addColorStop(0.35, '#9a2a10'); glow.addColorStop(1, '#170a08');
    blob(ctx, glow, () => { ctx.moveTo(28, G); ctx.lineTo(28, G - 24); ctx.quadraticCurveTo(30, G - 44, 46, G - 46); ctx.quadraticCurveTo(62, G - 44, 64, G - 24); ctx.lineTo(64, G); }, 1.6);
    for (const x of [33, 41, 51, 59]) poly(ctx, [x - 3, G - 38 + Math.abs(x - 46) * 0.4, x, G - 28, x + 3, G - 38 + Math.abs(x - 46) * 0.4], '#2a2226', 0.9);
    // douves de lave au pied
    oval(ctx, 50, G + 1, 56, 4.5, CROUTE); oval(ctx, 50, G, 50, 3, LAVE);
    // corniches des tourelles
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30;
      poly(ctx, [76 - s * 2, y - 1, 106, y - 2.5, 110, y + 1, 106, y + 4.5, 78 - s * 2, y + 4.5], BASALTE_D, 1.3);
      line(ctx, [79 - s * 2, y - 0.2, 104, y - 1.4], BASALTE_L, 1.2);
    }
    // bannière
    const wv = Math.sin(T * 2.4 + side) * 2;
    ctx.beginPath(); ctx.moveTo(12, G - 150); ctx.lineTo(12, G - 212);
    ctx.strokeStyle = INK; ctx.lineWidth = 4.8; ctx.stroke(); ctx.strokeStyle = '#c87a3a'; ctx.lineWidth = 2.8; ctx.stroke();
    blob(ctx, team, () => { ctx.moveTo(12, G - 210); ctx.quadraticCurveTo(26, G - 212 + wv, 38, G - 206 + wv); ctx.lineTo(34, G - 200 + wv * 0.8); ctx.lineTo(39, G - 194 + wv * 0.6); ctx.lineTo(33, G - 189 + wv * 0.4); ctx.quadraticCurveTo(22, G - 186 + wv * 0.4, 12, G - 188); });
    flame(ctx, 24, G - 193 + wv * 0.5, 9, 6, side);
  };

  /* ------------------------------------------------------------------ décor */
  function volcan(g, x, base, w, hh, col) {
    poly(g, [x - w, base, x - w * 0.14, base - hh, x + w * 0.14, base - hh, x + w, base], col);
    poly(g, [x + w * 0.02, base - hh, x + w * 0.14, base - hh, x + w, base, x + w * 0.4, base], 'rgba(0,0,0,0.25)');
  }
  // Coulées sur les flancs du grand volcan (fond) : k = 0…1, longueur de la coulée.
  function couleesVolcan(ctx, x, top, base, k, T) {
    if (k <= 0) return;
    for (const [dx, cx, ph] of [[-0.5, -60, 0], [0.4, 50, 1.4], [-0.05, -14, 2.7]]) {
      const y1 = top + (base - top) * k, x1 = x + cx * k;
      ctx.beginPath(); ctx.moveTo(x + dx * 14, top + 2); ctx.quadraticCurveTo(x + cx * 0.4 + dx * 20, top + (y1 - top) * 0.5, x1, y1);
      ctx.strokeStyle = 'rgba(122,42,24,0.9)'; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = LAVE; ctx.lineWidth = 4.4; ctx.stroke();
      ctx.setLineDash([6, 9]); ctx.lineDashOffset = -T * 18 - ph * 10; ctx.strokeStyle = LAVE_C; ctx.lineWidth = 1.6; ctx.stroke(); ctx.setLineDash([]);
    }
  }
  K.couleesVolcan = couleesVolcan;

  A.backdrops.magma = backdrop('magma', 4417, (g, r) => {
    sky(g, [[0, '#2a1418'], [0.35, '#5a2420'], [0.7, '#b04a24'], [1, '#e88a3a']]);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,${120 + r() * 80 | 0},60,${0.25 + r() * 0.4})`; g.beginPath(); g.arc(r() * W, r() * 380, 0.6 + r() * 1.4, 0, TAU); g.fill(); }
    halo(g, 900, 250, 360, '255,90,30', 0.4);
    volcan(g, 900, 520, 300, 300, '#3e2a2e');
    volcan(g, 380, 520, 220, 170, '#4a3236');
    volcan(g, 1240, 520, 200, 150, '#4a3236');
    const gr = g.createLinearGradient(0, 420, 0, 560); gr.addColorStop(0, 'rgba(255,120,50,0)'); gr.addColorStop(1, 'rgba(255,120,50,0.35)');
    g.fillStyle = gr; g.fillRect(-40, 420, W + 80, 160);
  }, (f, r) => {
    const h1 = x => 528 - Math.sin(x * 0.005 + 1.2) * 22 - Math.sin(x * 0.014 + 0.4) * 8;
    const h2 = x => 570 - Math.sin(x * 0.007 + 2.1) * 14 - Math.sin(x * 0.021 + 3) * 5;
    hills(f, h1, 0, '#2e2428');
    // rivière de lave dans la plaine
    f.beginPath(); f.moveTo(-40, 556); for (let x = -40; x <= W + 40; x += 20) f.lineTo(x, 552 + Math.sin(x * 0.01) * 6); f.lineTo(W + 40, 566); for (let x = W + 40; x >= -40; x -= 20) f.lineTo(x, 562 + Math.sin(x * 0.01) * 6); f.closePath();
    f.fillStyle = LAVE; f.fill();
    // orgues et aiguilles de basalte
    for (let i = 0; i < 14; i++) { const x = r() * W, hh = 20 + r() * 60, w = 8 + r() * 10, y = h1(x) + 6; poly(f, [x, y, x, y - hh, x + w * 0.5, y - hh - 4, x + w, y - hh, x + w, y], '#241c20'); }
    hills(f, h2, 0, '#1e181c');
    const gr = f.createLinearGradient(0, 560, 0, GROUND); gr.addColorStop(0, '#2a2226'); gr.addColorStop(1, '#1a1418');
    hills(f, h2, 6, gr);
    // sol de basalte, fissures de lave
    const sg = f.createLinearGradient(0, GROUND, 0, GROUND + 120); sg.addColorStop(0, '#3a3034'); sg.addColorStop(1, '#1e181c');
    f.fillStyle = sg; f.fillRect(-40, GROUND, W + 80, 160);
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = GROUND + 16 + r() * 90, w = 20 + r() * 50;
      const pts = [x, y, x + w * 0.3, y + (r() - 0.5) * 8, x + w * 0.65, y + (r() - 0.5) * 8, x + w, y + (r() - 0.5) * 6];
      line(f, pts, '#2a0e08', 4); line(f, pts, i % 3 ? '#c8401a' : '#ff8a2a', 1.6);
    }
    for (let i = 0; i < 40; i++) { const x = r() * W, y = GROUND + 14 + r() * 92, s = 2 + r() * 4; oval(f, x, y, s, s * 0.6, r() < 0.5 ? '#4a4044' : '#2e262a'); }
    f.fillStyle = '#4a3e42'; f.fillRect(-40, GROUND, W + 80, 5);
    f.fillStyle = '#ff6a22'; f.fillRect(-40, GROUND + 5, W + 80, 1.5);
  }, (ctx, t) => {
    const T = now();
    halo(ctx, 900, 220, 70, '255,140,50', 0.5 + 0.15 * Math.sin(T * 2));
    couleesVolcan(ctx, 900, 222, 500, 1, T);
    puffs(ctx, 900, 210, { n: 7, speed: 0.06, rise: 190, drift: -160, r0: 18, r1: 60, rgb: '60,44,48', a: 0.6 });
    // bombes de lave qui retombent au loin
    for (let i = 0; i < 4; i++) {
      const k = (T * 0.25 + i / 4) % 1, x = 900 + (i % 2 ? 1 : -1) * (40 + i * 30) * k, y = 210 - 140 * Math.sin(k * Math.PI) + k * 80;
      disc(ctx, x, y, 3, LAVE); halo(ctx, x, y, 8, '255,120,40', 0.5 * (1 - k));
    }
  }, (ctx, t) => {
    // cendres qui tombent par-dessus tout
    const T = now();
    for (let i = 0; i < 24; i++) { const k = (T * 0.05 + i * 0.37) % 1; ctx.fillStyle = i % 4 ? 'rgba(90,80,80,0.5)' : 'rgba(255,140,60,0.7)'; ctx.beginPath(); ctx.arc((i * 151 + Math.sin(T + i) * 20) % W, k * GROUND, i % 4 ? 1.6 : 1.2, 0, TAU); ctx.fill(); }
  });
})();

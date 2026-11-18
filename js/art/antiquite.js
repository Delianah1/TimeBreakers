/* =========================================================================
   NOUVEAUX GRAPHISMES — ANTIQUITÉ
   Rivage méditerranéen, temple de marbre, bronze et crins de couleur.
   Fournit aussi K.horse (le cheval sert au Médiéval et à la Renaissance).
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, SKIN, IVORY, WOOD, WOOD_D, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, helm, hairShort, arm, fist, thrust, wheel, puffs, flame, halo, backdrop, sky, hills, clouds, flock, soil } = K;
  const BRONZE = '#c9963f', BRONZE_D = '#9a6e26', MARBLE = '#efe7cf', MARBLE_D = '#d2c7a8';

  /* ----------------------------------------------------------------- cheval */
  // o : coat (robe), mane, cloth (caparaçon), atk, armor (chanfrein de métal)
  function horse(ctx, u, o) {
    const T = now(), mv = u.moving, ph = u.walk * 1.1;
    const b = mv ? -Math.abs(Math.sin(ph)) * 1.6 : -Math.sin(T * 2 + u.x * 0.05) * 0.4;
    const coat = o.coat || '#8a5a3a', cd = dk(coat, 0.74), mane = o.mane || dk(coat, 0.5);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (hx, phs, col, front) => {
      const s = mv ? Math.sin(ph + phs) : 0, c = mv ? Math.cos(ph + phs) : 0;
      const fx = hx + s * 9, fy = -1.6 - Math.max(0, c) * 4;
      limb(ctx, [hx, -24 + b, hx + s * 4 + (front ? 2 : -1.5), -13 + b - Math.max(0, c) * 2, fx, fy], 3.4, col);
      limb(ctx, [fx - 0.6, fy, fx + 1.6, fy + 0.2], 3.4, '#2a2018');
    };
    leg(-13, 2.2, cd, false); leg(13, 0.6, cd, true);
    const sway = Math.sin(T * 3 + u.x * 0.04) * 2 + (mv ? 3 : 0);
    blob(ctx, mane, () => { ctx.moveTo(-20, -37 + b); ctx.quadraticCurveTo(-30 - sway, -33 + b, -29 - sway, -17 + b); ctx.quadraticCurveTo(-24, -24 + b, -20, -31 + b); }, 1.2);
    blob(ctx, coat, () => {
      ctx.moveTo(-21, -31 + b); ctx.quadraticCurveTo(-22, -40 + b, -10, -40.5 + b); ctx.lineTo(10, -40 + b); ctx.quadraticCurveTo(21, -38 + b, 21, -29 + b);
      ctx.quadraticCurveTo(12, -21 + b, 0, -21.5 + b); ctx.quadraticCurveTo(-14, -21 + b, -21, -31 + b);
    });
    if (o.cloth) {
      blob(ctx, o.cloth, () => {
        ctx.moveTo(-15, -40.7 + b); ctx.lineTo(10, -40.3 + b); ctx.lineTo(11.5, -24 + b); ctx.lineTo(7, -19.5 + b); ctx.lineTo(2.5, -24 + b);
        ctx.lineTo(-2, -19.5 + b); ctx.lineTo(-6.5, -24 + b); ctx.lineTo(-11, -19.5 + b); ctx.lineTo(-15.5, -24 + b);
      });
      line(ctx, [-15.2, -27.5 + b, 11.2, -27.2 + b], dk(o.cloth, 0.7), 1.5);
    }
    leg(-17, 0, coat, false); leg(17, 3.6, coat, true);
    ctx.save(); ctx.translate(15, -37 + b); ctx.rotate((mv ? Math.sin(ph) * 0.05 : 0) - (o.atk || 0) * 0.14);
    blob(ctx, coat, () => { ctx.moveTo(-4, 4); ctx.quadraticCurveTo(2, -10, 8.5, -19); ctx.lineTo(15.5, -15); ctx.quadraticCurveTo(10, -5, 8, 6.5); });
    blob(ctx, mane, () => { ctx.moveTo(-3.5, 2); ctx.quadraticCurveTo(1, -10, 8, -20); ctx.lineTo(5, -21); ctx.quadraticCurveTo(-3, -11, -6.5, 0); }, 1.1);
    blob(ctx, coat, () => { ctx.moveTo(9.5, -20.5); ctx.lineTo(10.6, -26); ctx.lineTo(13.4, -21); }, 1);
    blob(ctx, coat, () => { ctx.moveTo(8, -19.5); ctx.quadraticCurveTo(13, -23.5, 17, -18.5); ctx.lineTo(24.5, -11.5); ctx.quadraticCurveTo(25.5, -7.5, 21.5, -6.8); ctx.lineTo(13, -11.5); });
    if (o.armor) blob(ctx, o.armor, () => { ctx.moveTo(10, -21.5); ctx.quadraticCurveTo(14, -24, 17.5, -19); ctx.lineTo(24, -12.6); ctx.lineTo(21, -11.4); ctx.lineTo(13.5, -17); }, 1);
    disc(ctx, 15.6, -16.4, 1.05, INK); disc(ctx, 23, -9.6, 0.6, INK);
    line(ctx, [13.2, -11.8, 19.2, -15.4, 21.8, -7.6], o.cloth ? dk(o.cloth, 0.7) : '#3a2616', 1.3);
    ctx.restore();
  }
  K.horse = horse;

  /* ------------------------------------------------------------------ unités */
  function crest(ctx, A2, color, dark) {
    const { hx, hy } = A2;
    blob(ctx, color, () => { ctx.moveTo(hx - 8.8, hy - 1.5); ctx.quadraticCurveTo(hx - 4, hy - 17.5, hx + 7.4, hy - 8.6); ctx.lineTo(hx + 4.6, hy - 6.4); ctx.quadraticCurveTo(hx - 2, hy - 11.6, hx - 6, hy - 1); }, 1.1);
    ctx.strokeStyle = dark; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx - 5.6, hy - 6.5); ctx.lineTo(hx - 7.4, hy - 9); ctx.moveTo(hx - 2.2, hy - 9.6); ctx.lineTo(hx - 3, hy - 12.8); ctx.moveTo(hx + 2, hy - 9.2); ctx.lineTo(hx + 2.6, hy - 12); ctx.stroke();
  }
  function spear(ctx, len) {
    limb(ctx, [-12, 0.6, len, -1.4], 1.5, '#9a6a3a');
    blob(ctx, '#d6d9de', () => { ctx.moveTo(len - 0.5, -4); ctx.lineTo(len + 7.5, -1.5); ctx.lineTo(len - 0.5, 1.2); }, 0.9);
  }
  // Hoplite : cuirasse et casque de bronze, cimier et bouclier aux couleurs de l'équipe.
  A.units.hoplite = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: BRONZE, skirt: team, skirtLen: 7, belt: BRONZE_D, boots: BRONZE,
      over(c, a) { line(c, [0, -31 + a.ty, 0.4, -20.5 + a.ty], BRONZE_D, 1); ctx.strokeStyle = dark; ctx.lineWidth = 1; c.beginPath(); for (const x of [-3, 0, 3, 6]) { c.moveTo(x * a.k, -18.6 + a.ty); c.lineTo(x * a.k, -12.6 + a.ty); } c.stroke(); },
      head(c, a) { crest(c, a, team, dark); helm(c, a, BRONZE, { neck: 3.4 }); rect(c, a.hx + 4.6, a.hy - 2.4, 1.5, 4.6, BRONZE_D); },
      arm(c, a) {
        thrust(c, a, (cc) => spear(cc, 22), { x: 2.5, y: 0.5, reach: 9, rot: -0.04 });
        const sxh = a.sx + 2.2, syh = a.sy + 9.5;
        disc(c, sxh, syh, 8.8, BRONZE, 1.3); disc(c, sxh, syh, 6.6, team);
        line(c, [sxh - 3.4, syh + 3, sxh, syh - 3.6, sxh + 3.4, syh + 3], IVORY, 1.6);
      },
    }, R);
  } };
  // Archer : tunique d'équipe, carquois, arc bandé (la corde claque au tir).
  A.units.archer = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, skirt: team, skirtLen: 6, belt: '#6a4426', boots: '#8a6440',
      back(c, a) { blob(c, '#8a5a30', () => { c.moveTo(-8, -33 + a.ty); c.lineTo(-3.5, -34 + a.ty); c.lineTo(-5.5, -19 + a.ty); c.lineTo(-9, -19.5 + a.ty); }, 1.1); for (const dx of [-7.6, -6, -4.4]) { line(c, [dx, -34 + a.ty, dx - 0.6, -39 + a.ty], '#9a6a3a', 1); disc(c, dx - 0.7, -39.6 + a.ty, 1.1, IVORY); } },
      over(c, a) { line(c, [-5.4, -31 + a.ty, 6, -21 + a.ty], '#6a4426', 1.4); },
      head(c, a) { hairShort(c, a, '#3a2618'); rect(c, a.hx - 6, a.hy - 3.6, 9.6, 1.8, IVORY); },
      arm(c, a) {
        const hx = a.sx + 8.5, hy = a.sy + 1.5, loaded = atk < 0.1;
        arm(c, a, hx, hy);
        c.beginPath(); c.arc(hx - 4, hy, 11.5, -1.12, 1.12); c.strokeStyle = INK; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = '#8a5a30'; c.lineWidth = 1.8; c.stroke();
        const tx = hx - 4 + 11.5 * Math.cos(1.12), ty2 = 11.5 * Math.sin(1.12), sx2 = loaded ? hx - 8.5 : tx - atk * 1.5;
        line(c, [tx, hy - ty2, sx2, hy, tx, hy + ty2], '#f3ead2', 0.9);
        if (loaded) { line(c, [hx - 8.5, hy, hx + 10, hy], '#7a5230', 1.3); blob(c, '#d6d9de', () => { c.moveTo(hx + 9.5, hy - 1.8); c.lineTo(hx + 14, hy); c.lineTo(hx + 9.5, hy + 1.8); }, 0.7); }
        fist(c, a, hx, hy);
      },
    }, R);
  } };

  // Char de guerre : cheval au galop, caisse, roue à rayons armée d'une faux. o : gold, crown, coat
  function chariot(ctx, u, team, dark, atk, o, R) {
    const spin = u.moving ? u.walk * 0.8 : 0, T = now(), jolt = u.moving ? Math.sin(u.walk * 2.2) * 0.6 : 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(21, 0); ctx.scale(0.76, 0.76); horse(ctx, u, { coat: o.coat, cloth: team, atk }); ctx.restore();
    limb(ctx, [-4, -16 + jolt, 10, -22], 1.6, WOOD_D);
    const car = o.gold ? '#d9a93a' : '#a8743c';
    if (o.crown) blob(ctx, team, () => { ctx.moveTo(-17, -45 + jolt); ctx.quadraticCurveTo(-30 - (u.moving ? 4 : 0), -40 + jolt, -31 - (u.moving ? 5 : 0) + Math.sin(T * 4) * 1.5, -24 + jolt); ctx.lineTo(-21, -28 + jolt); });
    // aurige
    blob(ctx, o.gold ? '#d9a93a' : BRONZE, () => { ctx.moveTo(-19.5, -46 + jolt); ctx.lineTo(-9, -46.5 + jolt); ctx.lineTo(-8.5, -30 + jolt); ctx.lineTo(-20, -30 + jolt); });
    disc(ctx, -13.6, -51 + jolt, 5.2, SKIN, 1.3);
    disc(ctx, -11.2, -51.6 + jolt, 0.85, INK);
    if (o.crown) R.crown(ctx, -13.6, -58 + jolt);
    else { const a2 = { hx: -13.6, hy: -51 + jolt }; crest(ctx, a2, team, dark); helm(ctx, a2, BRONZE, { neck: 2.4 }); }
    // caisse du char, courbée vers l'avant
    blob(ctx, car, () => { ctx.moveTo(-28, -13 + jolt); ctx.lineTo(-27, -27 + jolt); ctx.quadraticCurveTo(-10, -30 + jolt, -3.5, -35 + jolt); ctx.quadraticCurveTo(-0.5, -24 + jolt, -2, -13 + jolt); });
    blob(ctx, team, () => { ctx.moveTo(-26.6, -24 + jolt); ctx.quadraticCurveTo(-10, -26.5 + jolt, -2.6, -29 + jolt); ctx.lineTo(-2, -23.5 + jolt); ctx.quadraticCurveTo(-12, -21 + jolt, -27, -19.4 + jolt); }, 1);
    line(ctx, [-27, -27 + jolt, -10, -30 + jolt, -3.5, -35 + jolt], '#f2d27a', 1.3);
    // bras et lance
    const hx = -8 + atk * 8, hy = -38 + jolt;
    limb(ctx, [-12, -43 + jolt, -10, -38.5 + jolt, hx, hy], 2.6, SKIN);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.1); spear(ctx, 24); ctx.restore();
    disc(ctx, hx, hy, 1.8, SKIN, 1);
    // roue et faux
    blob(ctx, '#d6d9de', () => { ctx.moveTo(-15, -12 + jolt); ctx.quadraticCurveTo(-27, -12.5 + jolt, -35, -7 + jolt); ctx.quadraticCurveTo(-25, -8.5 + jolt, -15, -7.6 + jolt); }, 0.9);
    wheel(ctx, -15, -9.6 + jolt, 9.6, spin, '#4a3020', o.gold ? '#e0b85a' : '#c09a62', 4);
  }
  A.units['char-guerre'] = { h: 56, draw(ctx, u, team, dark, atk, R) { chariot(ctx, u, team, dark, atk, { coat: '#8a5a3a' }, R); } };
  A.units.imperator = { h: 56, draw(ctx, u, team, dark, atk, R) { chariot(ctx, u, team, dark, atk, { coat: '#e9e2d4', gold: true, crown: true }, R); } };

  // Éléphant de guerre : frontal de bronze, tour de bois sur le dos, cornac à la lance.
  // o (champions, js/champions.js) : crown = le cornac porte la couronne au lieu du casque
  function elephant(ctx, u, team, dark, atk, R, o) {
    const T = now(), mv = u.moving, ph = u.walk * 0.6, st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.2 : -Math.sin(T * 1.6 + u.x * 0.04) * 0.5;
    const C1 = '#8e9098', C2 = '#6f7178', C3 = '#a9abb3';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const leg = (x, dir, col) => {
      const dx = dir * st * 3.5, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 2.5 : 0;
      blob(ctx, col, () => { ctx.moveTo(x - 5.5, -26); ctx.lineTo(x + 5.5, -26); ctx.lineTo(x + 5.4 + dx, -3 - lift); ctx.quadraticCurveTo(x + 6 + dx, -lift, x + dx, -lift); ctx.quadraticCurveTo(x - 6 + dx, -lift, x - 5.4 + dx, -3 - lift); });
      ctx.fillStyle = IVORY; for (const o of [-2, 0.8, 3.6]) { ctx.beginPath(); ctx.arc(x + dx + o, -0.9 - lift, 1.1, Math.PI, 0); ctx.fill(); }
    };
    leg(-12, -1, C2); leg(14, 1, C2);
    limb(ctx, [-27, -40 + b, -32, -30 + b, -31 + st, -20], 1.6, C2);
    blob(ctx, C1, () => {
      ctx.moveTo(-27, -22 + b); ctx.quadraticCurveTo(-31, -38 + b, -22, -47 + b); ctx.quadraticCurveTo(-6, -53 + b, 10, -50 + b);
      ctx.quadraticCurveTo(17, -57 + b, 25, -54 + b); ctx.quadraticCurveTo(33, -50 + b, 32, -40 + b); ctx.lineTo(29, -32 + b);
      ctx.quadraticCurveTo(26, -22 + b, 20, -18 + b); ctx.quadraticCurveTo(-4, -14 + b, -27, -22 + b);
    }, 1.6);
    ctx.strokeStyle = C3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-24, -43 + b); ctx.quadraticCurveTo(-8, -50 + b, 8, -47.6 + b); ctx.stroke();
    ctx.strokeStyle = C2; ctx.lineWidth = 1; for (const [x, y] of [[-18, -30], [-6, -24], [8, -26], [-12, -38]]) { ctx.beginPath(); ctx.arc(x, y + b, 4, 0.3, 1.6); ctx.stroke(); }
    leg(-20, 1, C1); leg(6, -1, C1);
    // caparaçon et tour
    blob(ctx, team, () => { ctx.moveTo(-21, -47 + b); ctx.quadraticCurveTo(-6, -53 + b, 8, -50.4 + b); ctx.lineTo(9, -33 + b); ctx.lineTo(4.5, -28.5 + b); ctx.lineTo(0, -33 + b); ctx.lineTo(-4.5, -28.5 + b); ctx.lineTo(-9, -33 + b); ctx.lineTo(-13.5, -28.5 + b); ctx.lineTo(-18, -33 + b); ctx.lineTo(-21.5, -30 + b); });
    line(ctx, [-21, -36.5 + b, 9, -37 + b], '#f2d27a', 1.6);
    const ty = b - 51;
    rect(ctx, -17, ty - 13, 24, 13, '#a8743c', 1.3);
    for (const x of [-17, -9, -1]) rect(ctx, x, ty - 17, 6, 4.5, '#a8743c', 1.2);
    rect(ctx, -17, ty - 8, 24, 3, team);
    line(ctx, [-11, ty - 12.6, -11, ty - 0.4], WOOD_D, 1); line(ctx, [-3, ty - 12.6, -3, ty - 0.4], WOOD_D, 1);
    disc(ctx, -5, ty - 20.5, 4, SKIN, 1.2);
    const a2 = { hx: -5, hy: ty - 20.5 };
    if (o && o.crown) { disc(ctx, -3.2, ty - 21, 0.8, INK); R.crown(ctx, -5, ty - 27.5); } else helm(ctx, a2, BRONZE, { neck: 1.6 });
    const px = atk * 6;
    limb(ctx, [-14 + px, ty - 22, 16 + px, ty - 14], 1.4, '#9a6a3a');
    blob(ctx, '#d6d9de', () => { ctx.moveTo(15.4 + px, ty - 16.6); ctx.lineTo(22.5 + px, ty - 12.4); ctx.lineTo(15.4 + px, ty - 11.6); }, 0.9);
    // tête : oreille, frontal de bronze, trompe, défenses à pointes de bronze
    oval(ctx, 17, -41 + b, 7.5, 10.5, C2, 1.2, 0.25);
    blob(ctx, BRONZE, () => { ctx.moveTo(20, -54.4 + b); ctx.quadraticCurveTo(31, -53 + b, 32, -41 + b); ctx.lineTo(26.5, -38 + b); ctx.quadraticCurveTo(26, -48 + b, 19, -51 + b); }, 1.1);
    disc(ctx, 27.5, -46 + b, 1.6, team);
    disc(ctx, 25, -40.5 + b, 1.4, INK); disc(ctx, 25.4, -41 + b, 0.5, '#fff');
    const p0 = [30, -35 + b], p1 = [36 + atk * 5, -22 + b - atk * 9], p2 = [31 + atk * 12, -8 - atk * 16 + b];
    const q = t => [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1]];
    const tr = []; for (let i = 0; i <= 6; i++) tr.push(q(i / 6));
    limb(ctx, [].concat(...tr.slice(0, 5)), 6.6, C1); limb(ctx, [].concat(...tr.slice(3)), 4.6, C1);
    ctx.strokeStyle = C2; ctx.lineWidth = 0.9; for (let i = 1; i < 6; i++) { const [x, y] = tr[i]; ctx.beginPath(); ctx.moveTo(x - 2.2, y); ctx.lineTo(x + 1.8, y + 0.6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(26, -31 + b); ctx.quadraticCurveTo(35, -22 + b, 42 + atk * 2, -27 + b - atk * 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = IVORY; ctx.lineWidth = 3; ctx.stroke();
    disc(ctx, 42 + atk * 2, -27 + b - atk * 2, 1.9, BRONZE, 0.9);
  }
  A.units.elephant = { h: 70, top: 76, draw: elephant };
  K.elephant = elephant; K.crest = crest; K.spear = spear;

  // Charge des éléphants (pouvoir) : halo doré et poussière.
  A.fx.sweep = function (ctx, s, team, dark) {
    ctx.save(); ctx.translate(s.x, GROUND);
    oval(ctx, 0, 1, 36, 4, 'rgba(0,0,0,0.22)');
    halo(ctx, 0, -32, 62, '255,215,106', 0.4);
    puffs(ctx, -34, -4, { n: 3, speed: 1.6, rise: 12, drift: -30, r0: 4, r1: 9, rgb: '200,180,140', a: 0.5, seed: s.walk * 0.01 });
    elephant(ctx, { moving: true, walk: s.walk, x: s.x }, team, dark, Math.max(0, Math.sin(s.walk * 0.45)) * 0.7);
    ctx.restore();
  };

  /* ----------------------------------------------------------- base : temple */
  A.bases.temple = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // soubassement à degrés, cella dans l'ombre
    rect(ctx, -14, G - 8, 92, 8, MARBLE_D, 1.4); rect(ctx, -14, G - 16, 86, 8, MARBLE, 1.4);
    rect(ctx, -14, G - 112, 80, 96, '#b9ac8a');
    const glow = ctx.createLinearGradient(0, G - 70, 0, G - 16); glow.addColorStop(0, '#3a2a1e'); glow.addColorStop(1, '#a8642a');
    rect(ctx, 28, G - 70, 24, 54, glow, 1.4); rect(ctx, 26, G - 73, 28, 3.5, BRONZE, 1);
    flame(ctx, 40, G - 17, 14, 10, side);
    // colonnes cannelées
    for (const x of [-10, 10, 58]) {
      rect(ctx, x, G - 108, 12, 92, MARBLE, 1.3);
      line(ctx, [x + 3.5, G - 106, x + 3.5, G - 18], MARBLE_D, 1); line(ctx, [x + 7, G - 106, x + 7, G - 18], MARBLE_D, 1); rect(ctx, x + 9.5, G - 107, 2, 90, 'rgba(120,100,70,0.25)');
      rect(ctx, x - 2.5, G - 113, 17, 5.5, MARBLE, 1.2); rect(ctx, x - 1.5, G - 19.5, 15, 3.5, MARBLE, 1.1);
    }
    // entablement, frise d'équipe, fronton
    rect(ctx, -14, G - 126, 90, 13.5, MARBLE, 1.4);
    rect(ctx, -14, G - 122.5, 90, 5, team);
    ctx.fillStyle = IVORY; for (let x = -9; x < 74; x += 11) ctx.fillRect(x, G - 122.5, 2.2, 5);
    poly(ctx, [-18, G - 126, 30, G - 158, 80, G - 126], MARBLE, 1.5);
    poly(ctx, [-4, G - 129, 30, G - 151.5, 66, G - 129], team);
    disc(ctx, 30, G - 137, 5.4, '#f2d27a', 1); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; line(ctx, [30 + Math.cos(an) * 6.6, G - 137 + Math.sin(an) * 6.6, 30 + Math.cos(an) * 9.4, G - 137 + Math.sin(an) * 9.4], '#f2d27a', 1.3); }
    for (const [x, y] of [[-18, G - 126], [80, G - 126], [30, G - 158]]) blob(ctx, BRONZE, () => { ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x, y - 9, x + 3, y); }, 1);
    // tour de marbre des tourelles, corniches de bronze
    rect(ctx, 80, G - 140, 26, 140, MARBLE, 1.5); rect(ctx, 100, G - 139, 5, 138, 'rgba(120,100,70,0.22)');
    for (let y = G - 126; y < G - 4; y += 15) line(ctx, [81, y, 105, y], MARBLE_D, 1);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; rect(ctx, 76, y - 1, 34, 4.5, MARBLE, 1.2); rect(ctx, 76, y - 1, 34, 1.6, BRONZE); }
    poly(ctx, [77, G - 140, 93, G - 150, 109, G - 140], MARBLE, 1.3);
    // étendard
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [30, G - 158, 30, G - 186], 1.8, BRONZE_D);
    blob(ctx, team, () => { ctx.moveTo(30, G - 185); ctx.quadraticCurveTo(44, G - 187 + wv, 55, G - 182 + wv); ctx.lineTo(55, G - 168 + wv * 0.5); ctx.quadraticCurveTo(44, G - 166 + wv * 0.5, 30, G - 169); });
    line(ctx, [35, G - 177 + wv * 0.3, 42, G - 181 + wv * 0.4, 49, G - 176 + wv * 0.5], IVORY, 1.6);
    disc(ctx, 30, G - 187.5, 2.4, '#f2d27a', 1);
    // amphores
    for (const [x, s] of [[70, 1], [-4, 0.8]]) { blob(ctx, '#b8683a', () => { ctx.moveTo(x - 4 * s, G - 12 * s); ctx.quadraticCurveTo(x - 7 * s, G - 5 * s, x - 2 * s, G); ctx.lineTo(x + 2 * s, G); ctx.quadraticCurveTo(x + 7 * s, G - 5 * s, x + 4 * s, G - 12 * s); ctx.lineTo(x + 2.4 * s, G - 16 * s); ctx.lineTo(x - 2.4 * s, G - 16 * s); }, 1.1); line(ctx, [x - 5 * s, G - 8 * s, x + 5 * s, G - 8 * s], '#2a1e18', 1.2); }
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets.scorpion = function (ctx, a, team) {
    limb(ctx, [-8, 8, -1, -5], 2.2, WOOD_D); limb(ctx, [6, 8, -1, -5], 2.2, WOOD_D);
    rect(ctx, -11, -9, 27, 4.5, WOOD, 1.1); rect(ctx, -6, -9, 5, 4.5, team);
    limb(ctx, [6, -6.5, -1 + a * 5, -17], 2, '#5a3d24'); limb(ctx, [6, -6.5, -1 + a * 5, 4], 2, '#5a3d24');
    line(ctx, [-1 + a * 5, -17, -10 + a * 12, -6.5, -1 + a * 5, 4], IVORY, 0.9);
    rect(ctx, 3, -10, 6.5, 7, BRONZE, 1);
    if (a < 0.5) { line(ctx, [-10, -6.6, 17, -6.6], '#6b4a2c', 1.5); blob(ctx, BRONZE, () => { ctx.moveTo(16.5, -8.6); ctx.lineTo(21.5, -6.6); ctx.lineTo(16.5, -4.6); }, 0.7); }
  };
  A.turrets.miroir = function (ctx, a, team) {
    rect(ctx, -6, -3, 12, 11, MARBLE, 1.2); rect(ctx, -7.5, -5, 15, 3, MARBLE, 1.1); rect(ctx, -6, 2, 12, 2.4, team);
    limb(ctx, [0, -5, 0, -12], 1.8, BRONZE_D);
    if (a > 0) halo(ctx, 5, -20, 12 + a * 10, '255,240,160', a * 0.8);
    ctx.save(); ctx.translate(2, -20); ctx.rotate(0.32);
    oval(ctx, 0, 0, 4.4, 12.5, BRONZE_D, 1.2); oval(ctx, 1.2, 0, 2.6, 10.6, a > 0 ? '#fffbe0' : '#f2d27a');
    line(ctx, [1.4, -7, 1.9, -1], 'rgba(255,255,255,0.8)', 1.1);
    ctx.restore();
  };
  A.turrets.onagre = function (ctx, a, team) {
    rect(ctx, -13, 1, 26, 6.5, WOOD, 1.2); rect(ctx, -13, 3.2, 26, 2, team);
    rect(ctx, 6, -15, 4.5, 16, WOOD_D, 1.1); rect(ctx, 4, -18, 8.5, 3.6, '#5a3d24', 1);
    disc(ctx, -6, 2, 3.8, BRONZE, 1);
    ctx.save(); ctx.translate(-6, 2); ctx.rotate(-1.2 + a * 1.5);
    limb(ctx, [0, 0, 0, -18], 2.2, '#9a6a3a');
    if (a < 0.3) { blob(ctx, '#b8683a', () => ctx.ellipse(0, -22, 3.6, 4.8, 0, 0, TAU), 1); rect(ctx, -1.4, -28.4, 2.8, 2.6, '#b8683a', 0.8); }
    ctx.restore();
  };

  /* ------------------------------------------------------------- projectiles */
  A.projectiles.arrow = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    line(ctx, [-15, 0, 0, 0], '#7a5230', 1.5);
    blob(ctx, '#d6d9de', () => { ctx.moveTo(4, 0); ctx.lineTo(-2, -2.2); ctx.lineTo(-2, 2.2); }, 0.7);
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-18, -2.4); ctx.lineTo(-12.5, -2.4); ctx.lineTo(-10.5, 0); ctx.lineTo(-12.5, 2.4); ctx.lineTo(-18, 2.4); ctx.closePath(); ctx.fill();
  };
  A.projectiles.dart = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-26, -0.6, 10, 1.2);
    line(ctx, [-18, 0, 0, 0], '#6b4a2c', 2.4);
    blob(ctx, BRONZE, () => { ctx.moveTo(6, 0); ctx.lineTo(-2, -3); ctx.lineTo(-2, 3); }, 0.8);
  };
  A.projectiles.sunbeam = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.strokeStyle = 'rgba(255,220,110,0.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(0, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,236,160,0.8)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#fffbe6'; ctx.lineWidth = 1.6; ctx.stroke();
    halo(ctx, 0, 0, 9, '255,248,210', 0.8);
  };
  A.projectiles.jar = function (ctx, p) {
    ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.04);
    blob(ctx, '#b8683a', () => { ctx.moveTo(-2.2, -8); ctx.lineTo(2.2, -8); ctx.lineTo(2.6, -5); ctx.quadraticCurveTo(7, 0, 3, 7.5); ctx.lineTo(-3, 7.5); ctx.quadraticCurveTo(-7, 0, -2.6, -5); }, 1);
    line(ctx, [-4.8, 0.5, 4.8, 0.5], '#2a1e18', 1.5); line(ctx, [-4, 3.4, 4, 3.4], IVORY, 0.9);
  };

  /* -------------------------------------------------------------------- décor */
  function cypress(g, x, y, s) {
    g.fillStyle = '#4a3a28'; g.fillRect(x - 1.2 * s, y - 4 * s, 2.4 * s, 6 * s);
    g.fillStyle = '#3f6a44'; g.beginPath(); g.moveTo(x, y - 46 * s); g.quadraticCurveTo(x + 8 * s, y - 20 * s, x + 4 * s, y - 2 * s); g.lineTo(x - 4 * s, y - 2 * s); g.quadraticCurveTo(x - 8 * s, y - 20 * s, x, y - 46 * s); g.fill();
    g.fillStyle = 'rgba(20,40,25,0.28)'; g.beginPath(); g.moveTo(x, y - 46 * s); g.quadraticCurveTo(x + 8 * s, y - 20 * s, x + 4 * s, y - 2 * s); g.lineTo(x, y - 2 * s); g.closePath(); g.fill();
  }
  function olive(g, x, y, s) {
    g.strokeStyle = '#6a5238'; g.lineWidth = 3.4 * s; g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x - 3 * s, y - 8 * s, x + 2 * s, y - 15 * s); g.stroke();
    g.fillStyle = '#8fa56a'; g.beginPath(); ell(g, x, y - 20 * s, 14 * s, 8 * s); ell(g, x + 10 * s, y - 16 * s, 9 * s, 6 * s); ell(g, x - 10 * s, y - 15 * s, 9 * s, 6 * s); g.fill();
    g.fillStyle = '#a9bd82'; g.beginPath(); ell(g, x - 3 * s, y - 23 * s, 8 * s, 3.4 * s); g.fill();
  }
  K.cypress = cypress; K.olive = olive;
  function templeFar(g, x, y, s, col) {
    g.fillStyle = col; g.fillRect(x - 4 * s, y - 5 * s, 98 * s, 5 * s);
    for (let i = 0; i < 7; i++) g.fillRect(x + (2 + i * 13.6) * s, y - 35 * s, 6 * s, 30 * s);
    g.fillRect(x - 2 * s, y - 42 * s, 94 * s, 7 * s);
    g.beginPath(); g.moveTo(x - 5 * s, y - 42 * s); g.lineTo(x + 45 * s, y - 60 * s); g.lineTo(x + 95 * s, y - 42 * s); g.fill();
  }

  A.backdrops.antiquite = backdrop('antiquite', 4407, (g, r) => {
    sky(g, [[0, '#2f7fc4'], [0.5, '#7fbbe6'], [0.82, '#d9ecf2'], [1, '#f6efd6']]);
    halo(g, 240, 150, 300, '255,250,220', 0.8); disc(g, 240, 150, 40, '#fffbe6');
    // îles au loin, puis la mer
    g.fillStyle = '#9fb7cf'; g.beginPath(); g.moveTo(420, 470); g.quadraticCurveTo(520, 408, 640, 440); g.quadraticCurveTo(700, 420, 790, 470); g.fill();
    g.fillStyle = '#b3c7da'; g.beginPath(); g.moveTo(960, 470); g.quadraticCurveTo(1080, 420, 1320, 470); g.fill();
    let gr = g.createLinearGradient(0, 462, 0, 540); gr.addColorStop(0, '#3f8fc0'); gr.addColorStop(1, '#69b5cf');
    g.fillStyle = gr; g.fillRect(-40, 462, W + 80, 120);
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1.4;
    for (let i = 0; i < 70; i++) { const x = r() * W, y = 468 + r() * 60, w = 6 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke(); }
    // trières
    for (const [x, y, s] of [[380, 486, 1], [860, 478, 0.7]]) {
      g.fillStyle = '#6a4a34'; g.beginPath(); g.moveTo(x - 26 * s, y); g.quadraticCurveTo(x, y + 9 * s, x + 26 * s, y - 2 * s); g.lineTo(x + 30 * s, y - 9 * s); g.lineTo(x + 22 * s, y - 3 * s); g.lineTo(x - 26 * s, y - 3 * s); g.closePath(); g.fill();
      g.fillStyle = '#f3ead2'; g.beginPath(); g.moveTo(x - 12 * s, y - 28 * s); g.quadraticCurveTo(x + 4 * s, y - 20 * s, x + 14 * s, y - 28 * s); g.lineTo(x + 14 * s, y - 8 * s); g.quadraticCurveTo(x + 2 * s, y - 2 * s, x - 12 * s, y - 8 * s); g.closePath(); g.fill();
      g.strokeStyle = '#c0392b'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x - 11 * s, y - 18 * s); g.lineTo(x + 13 * s, y - 18 * s); g.stroke();
    }
  }, (f, r) => {
    const h1 = x => 512 - Math.sin(x * 0.004 + 4.4) * 30 - Math.sin(x * 0.011 + 1.3) * 8 - (x < 330 ? (330 - x) * 0.12 : 0) - (x > 980 ? (x - 980) * 0.1 : 0);
    const h2 = x => 566 - Math.sin(x * 0.0058 + 2.6) * 15 - Math.sin(x * 0.018 + 0.2) * 5;
    let gr = f.createLinearGradient(0, 440, 0, GROUND); gr.addColorStop(0, '#d8c68e'); gr.addColorStop(1, '#bfa66a');
    hills(f, h1, 0, gr);
    templeFar(f, 96, h1(140) + 4, 1.15, '#f6f0dc'); templeFar(f, 1090, h1(1130) + 4, 0.8, '#f1ead4');
    f.fillStyle = 'rgba(120,100,60,0.18)'; f.fillRect(96 + 60, h1(140) - 46, 52, 44);
    for (const [x, s] of [[30, 1.1], [58, 0.8], [236, 1], [262, 1.25], [1020, 0.9], [1050, 1.15], [1212, 1], [1240, 0.8]]) cypress(f, x, h1(x) + 3, s);
    for (const [x, s] of [[330, 1], [1000 - 60, 0.9]]) olive(f, x, h1(x) + 3, s);
    hills(f, h2, 0, '#b9b46a');
    gr = f.createLinearGradient(0, 548, 0, GROUND); gr.addColorStop(0, '#cdb679'); gr.addColorStop(1, '#b89a5c');
    hills(f, h2, 5, gr);
    for (const [x, s] of [[190, 1.3], [470, 1.1], [760, 1.4], [1120, 1.2]]) olive(f, x, h2(x) + 6, s);
    // colonnes brisées
    for (const [x, hh] of [[600, 30], [622, 18], [905, 24]]) { const y = h2(x) + 8; f.fillStyle = '#efe7cf'; f.fillRect(x, y - hh, 10, hh); f.fillRect(x - 2, y - 3, 14, 3); f.fillStyle = 'rgba(120,100,70,0.25)'; f.fillRect(x + 7, y - hh, 3, hh); }
    soil(f, r, { top: '#cdb27a', bottom: '#9a8050', pebbles: ['#b9ad96', '#d6ccb4'], nPebbles: 34, tufts: ['#b9a55a', '#8f9a52'], band: '#bfb06a', bandLight: '#dccf8c', blade: '#9a9a4e' });
  }, (ctx, t, dt, R) => {
    clouds(ctx, R, dt, 'rgba(214,230,240,0.8)', 'rgba(255,255,255,0.95)');
    flock(ctx, t, dt, 'antiquite', '#f6f6f6', 5);
  });
})();

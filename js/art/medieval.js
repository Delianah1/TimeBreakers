/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE MÉDIÉVAL
   Campagne verte, village et moulin, château fort.
   Fournit aussi K.mounted (cavalier sur K.horse), repris à la Renaissance.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, GROUND, TAU, INK, SKIN, IVORY, WOOD, WOOD_D, WOOD_L, ROCK, ROCK_L, now, blob, limb, ell, stone, dk, poly, line, rect, disc, oval,
    figure, face, helm, hairShort, arm, fist, swing, thrust, aim, wheel, puffs, flame, halo, backdrop, sky, hills, clouds, flock, soil, ridge, range, horse } = K;
  const STEEL = '#aab0b8', STEEL_D = '#7d838b', GOLD = '#d9a93a', STONE = '#a3a39c', STONE_D = '#7f7f79', STONE_L = '#bdbdb4';

  // épée, dessinée le long de -y depuis la main
  function sword(ctx, len, gold) {
    blob(ctx, '#e3e7ee', () => { ctx.moveTo(-1.4, -3); ctx.lineTo(1.4, -3); ctx.lineTo(1.2, -len + 3); ctx.lineTo(0, -len); ctx.lineTo(-1.2, -len + 3); }, 0.9);
    line(ctx, [0, -4, 0, -len + 4], '#b8bec8', 0.8);
    rect(ctx, -4.2, -3.8, 8.4, 2, gold || '#8a6a3a', 0.8); disc(ctx, 0, 2.4, 1.5, gold || '#8a6a3a', 0.8);
  }
  K.sword = sword;
  // écu en amande aux couleurs de l'équipe
  function ecu(ctx, x, y, s, team) {
    blob(ctx, team, () => { ctx.moveTo(x - 5 * s, y - 7 * s); ctx.lineTo(x + 5 * s, y - 7 * s); ctx.quadraticCurveTo(x + 5.5 * s, y + 3 * s, x, y + 9 * s); ctx.quadraticCurveTo(x - 5.5 * s, y + 3 * s, x - 5 * s, y - 7 * s); }, 1.2);
    line(ctx, [x - 3.4 * s, y - 2 * s, x, y + 2.4 * s, x + 3.4 * s, y - 2 * s], IVORY, 1.5 * s);
  }

  /* ------------------------------------------------------------------ unités */
  // Fantassin : cotte de mailles, tabard d'équipe, chapel de fer, épée et écu.
  A.units.fantassin = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: STEEL, skirt: team, skirtLen: 7.5, belt: '#4a3020', legs: '#6a6058', boots: '#3a2c22', sleeve: STEEL,
      over(c, a) { blob(c, team, () => { c.moveTo(-3.6 * a.k, -32 + a.ty); c.lineTo(4.6 * a.k, -32.4 + a.ty); c.lineTo(6.2 * a.k, -19.5 + a.ty); c.lineTo(-5.6 * a.k, -19 + a.ty); }, 1); },
      head(c, a) { blob(c, STEEL_D, () => { c.moveTo(a.hx - 5.6, a.hy - 1); c.lineTo(a.hx - 6.2, a.hy + 5.4); c.lineTo(a.hx - 0.5, a.hy + 6.4); c.lineTo(a.hx - 1.6, a.hy - 1); }, 1); helm(c, a, STEEL, { neck: -0.6, brim: 8.4 }); },
      arm(c, a) { swing(c, a, cc => sword(cc, 21), { sleeve: STEEL, rest: [0.55, 5, 5.5] }); ecu(c, a.sx - 1.5, a.sy + 9.5, 1, team); },
    }, R);
  } };
  // Arbalétrier : gambison, chaperon d'équipe, arbalète (carreau en place tant qu'il n'a pas tiré).
  A.units.arbaletrier = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: '#a89468', skirt: '#a89468', skirtLen: 6, belt: '#4a3020', legs: '#6b5a44', boots: '#3a2c22', sleeve: '#a89468',
      over(c, a) { c.strokeStyle = '#8a7850'; c.lineWidth = 1; c.beginPath(); for (const x of [-2.5, 0.5, 3.5]) { c.moveTo(x * a.k, -31 + a.ty); c.lineTo(x * a.k, -13.5 + a.ty); } c.stroke();
        blob(c, team, () => { c.moveTo(-6.4, -32 + a.ty); c.quadraticCurveTo(0, -35.6 + a.ty, 7, -32 + a.ty); c.lineTo(6, -27.5 + a.ty); c.lineTo(3, -29.5 + a.ty); c.lineTo(0, -26.6 + a.ty); c.lineTo(-3, -29.4 + a.ty); c.lineTo(-6.6, -27 + a.ty); }, 1); },
      head(c, a) { blob(c, team, () => { c.moveTo(a.hx - 6, a.hy + 5); c.arc(a.hx, a.hy - 0.4, 6.5, Math.PI * 0.9, Math.PI * 1.86); c.lineTo(a.hx + 3.6, a.hy - 2.4); c.lineTo(a.hx - 2.6, a.hy - 1.6); c.lineTo(a.hx - 2.4, a.hy + 5.6); }, 1.2);
        blob(c, team, () => { c.moveTo(a.hx - 5.6, a.hy - 5); c.quadraticCurveTo(a.hx - 11, a.hy - 8, a.hx - 11.5, a.hy - 1); c.lineTo(a.hx - 6.4, a.hy - 2); }, 1); },
      arm(c, a) {
        aim(c, a, (cc, k) => {
          rect(cc, -7, -1.4, 21, 3.2, WOOD, 1); rect(cc, -8.5, -1.4, 4, 5.4, WOOD_D, 1);
          cc.beginPath(); cc.arc(8, 0.2, 8.6, -1.25, 1.25); cc.strokeStyle = INK; cc.lineWidth = 3.4; cc.stroke(); cc.strokeStyle = STEEL_D; cc.lineWidth = 1.7; cc.stroke();
          const tx = 8 + 8.6 * Math.cos(1.25), ty2 = 8.6 * Math.sin(1.25), loaded = k < 0.1;
          line(cc, [tx, 0.2 - ty2, loaded ? -1 : tx, 0.2, tx, 0.2 + ty2], IVORY, 0.9);
          if (loaded) { line(cc, [-1, 0.2, 16, 0.2], '#5a4630', 1.5); blob(cc, STEEL, () => { cc.moveTo(15.5, -1.8); cc.lineTo(19.5, 0.2); cc.lineTo(15.5, 2.2); }, 0.7); }
        }, { sleeve: '#a89468', y: 3 });
      },
    }, R);
  } };

  // Cavalier sur K.horse. o : coat, mane, cloth, armor, body, leg, cape, over(ctx, b), head(ctx, A2), arm(ctx, A2), face, crown
  function mounted(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving, ph = u.walk * 1.1;
    const b = mv ? -Math.abs(Math.sin(ph)) * 1.6 : -Math.sin(T * 2 + u.x * 0.05) * 0.4;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.cape) blob(ctx, o.cape, () => { ctx.moveTo(-5, -55 + b); ctx.quadraticCurveTo(-21 - (mv ? 5 : 0), -49 + b, -23 - (mv ? 7 : 0) + Math.sin(T * 4) * 1.5, -33 + b); ctx.lineTo(-8, -40 + b); });
    horse(ctx, u, { coat: o.coat, mane: o.mane, cloth: o.cloth === undefined ? team : o.cloth, atk, armor: o.armor });
    limb(ctx, [-1, -41 + b, 3, -33 + b, 1.5, -25 + b], 3.2, o.leg || STEEL);
    limb(ctx, [1.5, -25 + b, 4.6, -24.6 + b], 3.2, '#3a2c22');
    blob(ctx, o.body || STEEL, () => { ctx.moveTo(-6.5, -55 + b); ctx.quadraticCurveTo(0, -58.6 + b, 6, -55.5 + b); ctx.lineTo(6.2, -41 + b); ctx.lineTo(-6.6, -40.5 + b); });
    if (o.over) o.over(ctx, b);
    const A2 = { u, R, T, k: 1, ty: b, sw: 0, atk, team, dark, skin: SKIN, hx: 1.5, hy: -63 + b, sx: 3, sy: -54 + b };
    disc(ctx, A2.hx, A2.hy, 5.6, SKIN, 1.4);
    if (o.face !== false) face(ctx, A2, {});
    if (o.head) o.head(ctx, A2);
    if (o.crown) R.crown(ctx, A2.hx, A2.hy - 8.5);
    if (o.arm) o.arm(ctx, A2);
  }
  K.mounted = mounted; K.ecu = ecu;

  function greatHelm(c, a, team) {
    const { hx, hy } = a;
    blob(c, team, () => { c.moveTo(hx - 2, hy - 7); c.quadraticCurveTo(hx - 13, hy - 15, hx - 12, hy - 2); c.quadraticCurveTo(hx - 7, hy - 8, hx, hy - 6.4); }, 1);
    blob(c, STEEL, () => { c.moveTo(hx - 6, hy + 5.8); c.lineTo(hx - 6.3, hy - 3); c.quadraticCurveTo(hx, hy - 9.6, hx + 6.3, hy - 3); c.lineTo(hx + 6.5, hy + 5.8); }, 1.3);
    rect(c, hx + 0.4, hy - 1.9, 6, 1.7, INK); line(c, [hx + 3.3, hy - 6, hx + 3.3, hy + 5.4], STEEL_D, 1.2);
    disc(c, hx + 1.6, hy + 2.6, 0.6, INK); disc(c, hx + 5, hy + 2.6, 0.6, INK);
    line(c, [hx - 4.4, hy - 3.6, hx - 3, hy - 6], 'rgba(255,255,255,0.6)', 1.1);
  }
  // Chevalier : cheval caparaçonné, heaume à panache, lance couchée à fanion.
  A.units.chevalier = { h: 66, draw(ctx, u, team, dark, atk, R) {
    mounted(ctx, u, team, dark, atk, {
      coat: '#8a5a3a', armor: STEEL, face: false,
      over(c, b) { ecu(c, -2.5, -48 + b, 0.95, team); },
      head(c, a) { greatHelm(c, a, team); },
      arm(c, a) { thrust(c, a, cc => {
        limb(cc, [-16, 1.4, 34, -3], 1.8, '#d9d3c6');
        blob(cc, '#e3e7ee', () => { cc.moveTo(33.5, -5.6); cc.lineTo(41, -3.5); cc.lineTo(33.5, -0.6); }, 0.9);
        blob(cc, team, () => { cc.moveTo(30, -4); cc.lineTo(21, -10); cc.lineTo(23.5, -5.4); cc.lineTo(20, -3); }, 0.9);
        blob(cc, STEEL_D, () => { cc.moveTo(-3, -3.4); cc.lineTo(3, -2); cc.lineTo(-3, 3.6); }, 0.9);
      }, { sleeve: STEEL, glove: STEEL_D, x: 3, y: 7, reach: 9, rot: -0.03 }); },
    }, R);
  } };
  // Seigneur de guerre (champion) : destrier blanc, cape, couronne, grande épée.
  A.units.seigneur = { h: 66, draw(ctx, u, team, dark, atk, R) {
    mounted(ctx, u, team, dark, atk, {
      coat: '#e6dfd2', mane: '#b9ad9a', armor: GOLD, cape: team, crown: true,
      over(c, b) { line(c, [-6, -48 + b, 6, -48.6 + b], GOLD, 1.8); disc(c, 0, -52 + b, 1.8, team, 0.8); },
      head(c, a) { blob(c, '#6a4a2a', () => { c.moveTo(a.hx - 5.6, a.hy + 3); c.arc(a.hx, a.hy, 5.9, Math.PI * 0.86, Math.PI * 1.74); c.lineTo(a.hx - 1, a.hy - 2.4); c.lineTo(a.hx - 3, a.hy + 3.4); }, 1.1);
        blob(c, '#6a4a2a', () => { c.moveTo(a.hx - 1, a.hy + 3); c.lineTo(a.hx + 5, a.hy + 3.8); c.lineTo(a.hx + 3, a.hy + 8.4); c.lineTo(a.hx - 1.5, a.hy + 6.4); }, 1); },
      arm(c, a) { swing(c, a, cc => sword(cc, 26, GOLD), { sleeve: STEEL, glove: STEEL_D, rest: [0.5, 6, 5], hit: [1.9, 10.5, 4] }); },
    }, R);
  } };

  // Mangonneau : engin de siège sur roues, le bras bascule au tir.
  A.units.mangonneau = { h: 46, top: 54, draw(ctx, u, team, dark, atk) {
    const spin = u.moving ? u.walk * 0.5 : 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    limb(ctx, [12, -17, 2, -38], 2.8, WOOD_D);
    rect(ctx, -27, -18.5, 53, 6.5, WOOD, 1.3); rect(ctx, -27, -16.4, 53, 2.2, team);
    line(ctx, [-24, -13.4, 23, -13.4], WOOD_D, 1);
    limb(ctx, [-8, -17, 2, -38], 3, WOOD);
    ctx.save(); ctx.translate(2, -37.5); ctx.rotate(-0.45 + atk * 2.3);
    limb(ctx, [10, 0, -26, 0], 2.6, '#9a6a3a');
    rect(ctx, 6.5, -5, 9.5, 11, '#5a5048', 1.2); rect(ctx, 6.5, -1.2, 9.5, 2.4, team);
    blob(ctx, '#7a5230', () => { ctx.moveTo(-30.5, -0.8); ctx.quadraticCurveTo(-26.5, 6, -22.5, -0.8); }, 1);
    if (atk < 0.3) { ctx.save(); ctx.translate(-26.5, -3); stone(ctx, 4, ROCK, ROCK_L); ctx.restore(); }
    ctx.restore();
    line(ctx, [-0.6, -39.6, 4.6, -35.4], IVORY, 1.3); line(ctx, [-0.6, -35.4, 4.6, -39.6], IVORY, 1.3);
    wheel(ctx, -17, -7.4, 7.6, spin, '#3a2a1a', '#a07a4a', 4); wheel(ctx, 15, -7.4, 7.6, spin + 0.5, '#3a2a1a', '#a07a4a', 4);
  } };

  /* ------------------------------------------------------ base : château fort */
  function stonework(ctx, x, y, w, h, fill) {
    rect(ctx, x, y, w, h, fill);
    ctx.strokeStyle = 'rgba(43,29,20,0.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let yy = y + 11, i = 0; yy < y + h - 2; yy += 11, i++) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); for (let xx = x + (i % 2 ? 7 : 15); xx < x + w - 2; xx += 16) { ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 11); } }
    ctx.stroke();
  }
  A.bases.castle = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // donjon
    stonework(ctx, -14, G - 150, 62, 150, STONE); rect(ctx, 38, G - 150, 10, 150, 'rgba(40,36,30,0.22)');
    for (let i = 0; i < 4; i++) rect(ctx, -14 + i * 17.4, G - 162, 10.5, 12.5, STONE, 1.4);
    rect(ctx, -16, G - 152, 66, 5, STONE_L, 1.3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(-14, G - 150, 62, 150);
    for (const [x, y] of [[4, G - 126], [26, G - 126]]) { blob(ctx, '#ffd98a', () => { ctx.moveTo(x - 3.4, y + 9); ctx.lineTo(x - 3.4, y); ctx.quadraticCurveTo(x, y - 6.5, x + 3.4, y); ctx.lineTo(x + 3.4, y + 9); }, 1.2); line(ctx, [x, y - 4.5, x, y + 9], INK, 1); }
    rect(ctx, 14, G - 96, 2.6, 11, '#2a2018');
    // tenture aux couleurs de l'équipe
    blob(ctx, team, () => { ctx.moveTo(7, G - 108); ctx.lineTo(23, G - 108); ctx.lineTo(23, G - 78); ctx.lineTo(15, G - 71); ctx.lineTo(7, G - 78); }, 1.2);
    line(ctx, [10.5, G - 96, 15, G - 90, 19.5, G - 96], IVORY, 1.7); rect(ctx, 5.5, G - 110, 19, 2.6, WOOD_D, 0.9);
    // corps de garde, porte en ogive et herse
    stonework(ctx, 30, G - 86, 48, 86, STONE_L); for (let i = 0; i < 3; i++) rect(ctx, 30 + i * 18.6, G - 96, 10.8, 11, STONE_L, 1.4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(30, G - 86, 48, 86);
    blob(ctx, '#241a14', () => { ctx.moveTo(40, G); ctx.lineTo(40, G - 34); ctx.quadraticCurveTo(41, G - 54, 54, G - 60); ctx.quadraticCurveTo(67, G - 54, 68, G - 34); ctx.lineTo(68, G); }, 1.8);
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let x = 45; x < 68; x += 6) { ctx.moveTo(x, G - 44 - (Math.abs(x - 54) < 4 ? 10 : 4)); ctx.lineTo(x, G - 14); } ctx.moveTo(41, G - 30); ctx.lineTo(67, G - 30); ctx.stroke();
    ctx.fillStyle = '#6a5a4a'; for (let x = 45; x < 68; x += 6) { ctx.beginPath(); ctx.moveTo(x - 1.6, G - 14); ctx.lineTo(x, G - 9.5); ctx.lineTo(x + 1.6, G - 14); ctx.fill(); }
    for (const x of [34.5, 73.5]) { limb(ctx, [x, G - 50, x, G - 58], 1.8, WOOD_D); flame(ctx, x, G - 58, 9, 6, x); }
    // tour ronde des tourelles, hourds de bois, toit pointu
    stonework(ctx, 80, G - 140, 26, 140, STONE); rect(ctx, 99, G - 140, 7, 140, 'rgba(40,36,30,0.22)');
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(80, G - 140, 26, 140);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; limb(ctx, [103, y + 2, 96, y + 12], 1.8, WOOD_D); rect(ctx, 76, y - 1, 34, 4.4, WOOD, 1.2); line(ctx, [77, y + 0.2, 109, y + 0.2], WOOD_L, 1); }
    poly(ctx, [75, G - 140, 93, G - 172, 111, G - 140], dk('#5a6a8a', 1), 1.5); poly(ctx, [93, G - 172, 111, G - 140, 98, G - 140], 'rgba(20,24,40,0.25)');
    // bannière du donjon
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [17, G - 162, 17, G - 200], 1.8, WOOD_D);
    blob(ctx, team, () => { ctx.moveTo(17, G - 199); ctx.quadraticCurveTo(31, G - 201 + wv, 44, G - 196 + wv); ctx.lineTo(38, G - 190 + wv * 0.7); ctx.lineTo(44, G - 184 + wv * 0.5); ctx.quadraticCurveTo(31, G - 181 + wv * 0.5, 17, G - 184); });
    disc(ctx, 26, G - 191 + wv * 0.3, 2.6, IVORY);
    // lierre et pied de mur
    ctx.fillStyle = '#5f8a48'; ctx.beginPath(); for (const [x, y, r] of [[-10, G - 40, 6], [-6, G - 52, 5], [-11, G - 64, 4.4], [-4, G - 30, 5], [-9, G - 20, 6], [-2, G - 12, 5]]) ell(ctx, x, y, r, r * 0.9); ctx.fill();
    ctx.save(); ctx.translate(26, G - 4); stone(ctx, 5, STONE_D, STONE_L); ctx.restore();
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets.baliste = function (ctx, a, team) {
    limb(ctx, [-8, 8, 0, -4], 2.4, WOOD_D); limb(ctx, [7, 8, 0, -4], 2.4, WOOD_D);
    rect(ctx, -12, -9, 30, 4.8, WOOD, 1.1); rect(ctx, -7, -9, 5, 4.8, team);
    limb(ctx, [9, -6.6, 2 + a * 4, -18], 2.2, '#5a3d24'); limb(ctx, [9, -6.6, 2 + a * 4, 5], 2.2, '#5a3d24');
    line(ctx, [2 + a * 4, -18, -9 + a * 13, -6.6, 2 + a * 4, 5], IVORY, 1);
    rect(ctx, 6.5, -10.5, 5, 8, STEEL_D, 1);
    if (a < 0.5) { line(ctx, [-9, -6.6, 19, -6.6], '#5a4630', 1.8); blob(ctx, STEEL, () => { ctx.moveTo(18.5, -9); ctx.lineTo(24.5, -6.6); ctx.lineTo(18.5, -4.2); }, 0.8); }
  };
  A.turrets['catapulte-feu'] = function (ctx, a, team) {
    limb(ctx, [-13, 5, 13, 5], 3.2, WOOD);
    wheel(ctx, -9, 7.4, 3.8, 0, '#3a2a1a', '#a07a4a', 2); wheel(ctx, 9, 7.4, 3.8, 0.6, '#3a2a1a', '#a07a4a', 2);
    limb(ctx, [9, 4, 3, -13], 2.4, WOOD_D); limb(ctx, [-3, 4, 3, -13], 2.8, WOOD);
    line(ctx, [-12, 2, -5, 2], team, 2.2);
    ctx.save(); ctx.translate(3, -12.5); ctx.rotate(-0.37 + a * 2.45);
    limb(ctx, [6.5, 0, -19, 0], 2.2, '#9a6a3a'); rect(ctx, 4.6, -3, 7, 8, '#5a5048', 1);
    blob(ctx, '#3a3430', () => { ctx.moveTo(-24, -1); ctx.quadraticCurveTo(-20, 5.5, -16, -1); }, 1);
    if (a < 0.3) { disc(ctx, -20, -3, 3.3, '#3a2a1e', 0.9); flame(ctx, -20, -5, 9, 6, 3); }
    ctx.restore();
  };
  A.turrets.huile = function (ctx, a, team) {
    flame(ctx, 0, 8, 9, 12, 5);
    limb(ctx, [-11, 8, -8, -9], 1.8, STEEL_D); limb(ctx, [11, 8, 8, -9], 1.8, STEEL_D);
    ctx.save(); ctx.translate(0, -6); ctx.rotate(a * 0.7);
    blob(ctx, '#2f2e2c', () => { ctx.moveTo(-10, -3); ctx.lineTo(10, -3); ctx.quadraticCurveTo(10, 9, 0, 9.5); ctx.quadraticCurveTo(-10, 9, -10, -3); }, 1.2);
    rect(ctx, -11.5, -5, 23, 3, '#4a4844', 1); oval(ctx, 0, -3.6, 8.4, 1.6, '#5a3a1a');
    rect(ctx, -3, 1.5, 6, 2.6, team);
    if (a > 0.3) { ctx.fillStyle = '#3b2a1a'; ctx.beginPath(); ctx.moveTo(8, -4); ctx.quadraticCurveTo(16, -2, 15, 8); ctx.lineTo(12, 8); ctx.quadraticCurveTo(13, 0, 7, -2.4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.bolt = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    line(ctx, [-14, 0, 0, 0], '#5a4630', 2);
    blob(ctx, STEEL, () => { ctx.moveTo(4.5, 0); ctx.lineTo(-2, -2.6); ctx.lineTo(-2, 2.6); }, 0.7);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-15, -2, 4.5, 4);
  };
  A.projectiles.oil = function (ctx, p) {
    ctx.fillStyle = '#2f2418'; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y + 1); ctx.quadraticCurveTo(p.x - 5.5, p.y - 5, p.x, p.y - 9); ctx.quadraticCurveTo(p.x + 5.5, p.y - 5, p.x + 5, p.y + 1); ctx.quadraticCurveTo(p.x, p.y + 6.5, p.x - 5, p.y + 1); ctx.fill();
    disc(ctx, p.x - 1.6, p.y - 1.5, 1.4, 'rgba(255,255,255,0.3)');
  };
  // Volée de flèches (pouvoir)
  A.drops.arrow = function (ctx, d) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.PI / 2 + 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-34, -0.6, 16, 1.2);
    line(ctx, [-18, 0, 0, 0], '#7a5230', 1.8);
    blob(ctx, STEEL, () => { ctx.moveTo(4, 0); ctx.lineTo(-2, -2.6); ctx.lineTo(-2, 2.6); }, 0.7);
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-21.5, -2.6); ctx.lineTo(-15.5, -2.6); ctx.lineTo(-13.5, 0); ctx.lineTo(-15.5, 2.6); ctx.lineTo(-21.5, 2.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  /* -------------------------------------------------------------------- décor */
  function oak(g, x, y, s, c1, c2) {
    g.fillStyle = '#5a4030'; g.fillRect(x - 2 * s, y - 10 * s, 4 * s, 12 * s);
    g.fillStyle = c1 || '#4f8046'; g.beginPath(); ell(g, x, y - 22 * s, 15 * s, 13 * s); ell(g, x - 11 * s, y - 15 * s, 10 * s, 8 * s); ell(g, x + 11 * s, y - 15 * s, 10 * s, 8 * s); g.fill();
    g.fillStyle = c2 || '#6a9c58'; g.beginPath(); ell(g, x - 4 * s, y - 27 * s, 8 * s, 5 * s); ell(g, x - 12 * s, y - 18 * s, 5 * s, 3 * s); g.fill();
  }
  K.oak = oak;
  function cottage(g, x, y, s, roof) {
    g.fillStyle = '#e9dcc0'; g.fillRect(x, y - 12 * s, 20 * s, 12 * s);
    g.fillStyle = roof; g.beginPath(); g.moveTo(x - 3 * s, y - 12 * s); g.lineTo(x + 10 * s, y - 23 * s); g.lineTo(x + 23 * s, y - 12 * s); g.fill();
    g.fillStyle = '#5a4030'; g.fillRect(x + 8 * s, y - 7 * s, 4 * s, 7 * s); g.fillRect(x + 2.5 * s, y - 9 * s, 3 * s, 3 * s);
  }
  const MILL = [985, 0];
  A.backdrops.medieval = backdrop('medieval', 1215, (g, r) => {
    sky(g, [[0, '#4f93cf'], [0.5, '#9fc8e6'], [0.85, '#e3eff2'], [1, '#f2f1dc']]);
    halo(g, 1040, 130, 260, '255,252,225', 0.7); disc(g, 1040, 130, 38, '#fffbe6');
    range(g, ridge(r, 480, 150, 70, 130), 480, '#a9bfd6', 'rgba(70,95,140,0.18)', true);
    const gr = g.createLinearGradient(0, 400, 0, 530); gr.addColorStop(0, 'rgba(236,244,240,0)'); gr.addColorStop(1, 'rgba(236,244,240,0.9)');
    g.fillStyle = gr; g.fillRect(-40, 400, W + 80, 220);
  }, (f, r) => {
    const h1 = x => 506 - Math.sin(x * 0.0042 + 1.1) * 28 - Math.sin(x * 0.012 + 3.2) * 8;
    const h2 = x => 564 - Math.sin(x * 0.006 + 5.2) * 16 - Math.sin(x * 0.018 + 0.7) * 6;
    let gr = f.createLinearGradient(0, 470, 0, GROUND); gr.addColorStop(0, '#9cc47e'); gr.addColorStop(1, '#7fae66');
    hills(f, h1, 0, gr);
    // champs en lanières
    for (const [x0, x1, col] of [[330, 420, '#d9c46a'], [425, 500, '#86b060'], [505, 590, '#c9b85e'], [1090, 1180, '#d9c46a'], [1185, 1260, '#8ab866']]) {
      f.fillStyle = col; f.beginPath(); f.moveTo(x0, h1(x0) + 14); f.lineTo(x1, h1(x1) + 14); f.lineTo(x1 + 22, h1(x1) + 52); f.lineTo(x0 + 16, h1(x0) + 52); f.closePath(); f.fill();
      f.strokeStyle = 'rgba(60,70,30,0.18)'; f.lineWidth = 1; for (let k = 1; k < 5; k++) { f.beginPath(); f.moveTo(x0 + (x1 - x0) * k / 5, h1(x0) + 14); f.lineTo(x0 + 16 + (x1 + 6 - x0) * k / 5, h1(x0) + 52); f.stroke(); }
    }
    // château lointain sur sa butte
    const cx = 170, cy = h1(170) - 6;
    f.fillStyle = '#86a874'; f.beginPath(); f.moveTo(cx - 80, cy + 26); f.quadraticCurveTo(cx, cy - 26, cx + 80, cy + 26); f.fill();
    f.fillStyle = '#c9cdd0'; f.fillRect(cx - 34, cy - 40, 68, 32); f.fillRect(cx - 44, cy - 58, 16, 50); f.fillRect(cx + 28, cy - 52, 16, 44); f.fillRect(cx - 8, cy - 66, 18, 58);
    for (const [x, w, y] of [[cx - 44, 16, cy - 58], [cx + 28, 16, cy - 52], [cx - 8, 18, cy - 66]]) { f.fillStyle = '#7a8aa8'; f.beginPath(); f.moveTo(x - 2, y); f.lineTo(x + w / 2, y - 18); f.lineTo(x + w + 2, y); f.fill(); }
    f.fillStyle = 'rgba(60,70,90,0.22)'; f.fillRect(cx + 4, cy - 66, 6, 58); f.fillRect(cx + 38, cy - 52, 6, 44);
    // village et moulin
    for (const [x, s, roof] of [[690, 1, '#b8583a'], [716, 0.85, '#a84a32'], [738, 1.1, '#c0683e'], [770, 0.8, '#b8583a']]) cottage(f, x, h1(x + 10) + 4, s, roof);
    f.fillStyle = '#d6ccb4'; f.fillRect(747, h1(757) - 30, 7, 26); f.fillStyle = '#5a6a8a'; f.beginPath(); f.moveTo(745, h1(757) - 30); f.lineTo(750.5, h1(757) - 44); f.lineTo(756, h1(757) - 30); f.fill();
    MILL[1] = h1(985) - 30;
    f.fillStyle = '#e3d8c0'; f.beginPath(); f.moveTo(974, h1(985) + 4); f.lineTo(978, MILL[1] - 4); f.lineTo(992, MILL[1] - 4); f.lineTo(996, h1(985) + 4); f.fill();
    f.fillStyle = '#8a4a36'; f.beginPath(); f.moveTo(976, MILL[1] - 4); f.lineTo(985, MILL[1] - 16); f.lineTo(994, MILL[1] - 4); f.fill();
    for (const [x, s] of [[36, 1], [70, 1.25], [286, 1.1], [620, 0.95], [880, 1.15], [920, 0.9], [1040, 1.05]]) oak(f, x, h1(x) + 3, s);
    hills(f, h2, 0, '#6aa652');
    gr = f.createLinearGradient(0, 546, 0, GROUND); gr.addColorStop(0, '#5a9648'); gr.addColorStop(1, '#4c843e');
    hills(f, h2, 5, gr);
    for (const [x, s] of [[120, 1.5], [250, 1.2], [520, 1.6], [820, 1.3], [1010, 1.6], [1210, 1.35]]) oak(f, x, h2(x) + 8, s, '#3f6e3a', '#57904a');
    // clôture
    f.strokeStyle = '#7a5a3a'; f.lineWidth = 2.2;
    for (let x = 340; x < 470; x += 16) { const y = h2(x) + 8; f.beginPath(); f.moveTo(x, y); f.lineTo(x, y - 12); f.stroke(); }
    f.beginPath(); for (let x = 340; x <= 468; x += 16) { const y = h2(x) + 8; if (x === 340) f.moveTo(x, y - 9); else f.lineTo(x, y - 9); } f.stroke();
    soil(f, r, { top: '#8a6e42', bottom: '#5e4a2a', pebbles: ['#8f8478', '#a09482'], nPebbles: 30, tufts: ['#6aa652', '#8fbf6a'], band: '#5f9a48', bandLight: '#86c066', blade: '#4c8a3a' });
  }, (ctx, t, dt, R) => {
    clouds(ctx, R, dt, 'rgba(206,222,236,0.85)', 'rgba(255,255,255,0.96)');
    flock(ctx, t, dt, 'medieval', '#3a3a44', 5);
  }, (ctx, t) => {
    // ailes du moulin
    ctx.save(); ctx.translate(MILL[0], MILL[1] - 8); ctx.rotate(t * 0.5);
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#f3ead2'; ctx.fillRect(1, -3, 20, 6); ctx.strokeStyle = '#6a5238'; ctx.lineWidth = 1.2; ctx.strokeRect(1, -3, 20, 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(21, 0); ctx.stroke(); }
    ctx.restore();
  });
})();

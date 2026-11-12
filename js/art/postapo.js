/* =========================================================================
   NOUVEAUX GRAPHISMES — ÂGE POST-APOCALYPTIQUE
   Désert de poussière, tours éventrées, forteresse de ferraille.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, SKIN, IVORY, now, blob, limb, ell, dk, poly, line, rect, disc, oval,
    figure, hairWild, arm, fist, thrust, aim, muzzle, puffs, flame, halo, backdrop, sky, hills, clouds, flock, soil, longGun } = K;
  const RUST = '#a0522d', RUST_D = '#7a3c20', TOLE = '#7a6a5a', TOLE_D = '#5a4c40', TOLE_L = '#978674', IRON = '#4a4440', LEATHER = '#5a4030';

  /* ------------------------------------------------------------------ unités */
  function shoulderSpikes(c, a) { blob(c, IRON, () => { c.moveTo(-6.4 * a.k, -30 + a.ty); c.quadraticCurveTo(-3, -36 + a.ty, 2.6, -33 + a.ty); c.lineTo(1, -29.6 + a.ty); }, 1); for (const [x, r] of [[-4.6, -0.5], [-1.4, 0]]) { c.save(); c.translate(x, -34 + a.ty); c.rotate(r); poly(c, [-1.3, 0.6, 0, -4.6, 1.3, 0.6], IVORY, 0.7); c.restore(); } }
  // Pillard : crête rouge, épaulière à pointes, tronçonneuse.
  A.units.pillard = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: LEATHER, boots: '#2a2420', belt: IRON, sleeve: SKIN,
      over(c, a) { poly(c, [-5.4, -27 + a.ty, -1, -31.6 + a.ty, 1.6, -24 + a.ty], 'rgba(0,0,0,0.25)'); line(c, [-5.4 * a.k, -22 + a.ty, 6.2 * a.k, -25.6 + a.ty], LEATHER, 1.8); shoulderSpikes(c, a); },
      head(c, a) { line(c, [a.hx + 0.4, a.hy + 0.4, a.hx + 5.4, a.hy + 1.4], '#c0392b', 1.3);
        blob(c, '#d6452a', () => { c.moveTo(a.hx - 6, a.hy - 2); c.lineTo(a.hx - 7.6, a.hy - 9.4); c.lineTo(a.hx - 3.6, a.hy - 7); c.lineTo(a.hx - 3.4, a.hy - 13); c.lineTo(a.hx, a.hy - 8); c.lineTo(a.hx + 1.6, a.hy - 12.6); c.lineTo(a.hx + 3.4, a.hy - 7); c.lineTo(a.hx + 5.4, a.hy - 8.6); c.lineTo(a.hx + 4, a.hy - 4.6); c.lineTo(a.hx - 2, a.hy - 5.6); }, 1.1); },
      arm(c, a) { thrust(c, a, (cc) => {
        const jt = Math.sin(now() * 60) * 0.5;
        rect(cc, -5, -4 + jt, 11, 8.4, '#d6452a', 1.1); rect(cc, -3.4, -6.4 + jt, 5, 2.6, IRON, 0.8);
        rect(cc, 5.6, -2.4 + jt, 19, 4.8, '#b9bec8', 1); line(cc, [7, jt, 22, jt], '#7c828e', 1);
        cc.fillStyle = '#2a2420'; for (let x = 6 + ((now() * 40) % 3); x < 24; x += 3) { cc.fillRect(x, -3.6 + jt, 1.5, 1.3); cc.fillRect(x - 1, 2.4 + jt, 1.5, 1.3); }
      }, { x: 3.5, y: 5, reach: 7, rot: -0.1, glove: LEATHER }); puffs(c, a.sx + 2, a.sy + 2, { n: 2, speed: 1.4, rise: 12, drift: -8, r0: 1.6, r1: 4, rgb: '70,66,60', a: 0.4, seed: u.x * 0.01 }); },
    }, R);
  } };
  // Ferrailleur : capuche, masque à gaz, manteau rapiécé, fusil de récupération.
  A.units.ferrailleur = { h: 46, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, skirt: team, skirtLen: 8, legs: '#5a5248', boots: '#2a2420', belt: LEATHER, sleeve: team, face: false, headColor: '#5a5248',
      back(c, a) { rect(c, -11.5, -32 + a.ty, 7, 13, TOLE_D, 1.1); line(c, [-9, -32 + a.ty, -11, -44 + a.ty], IRON, 1.1); disc(c, -11, -44.6 + a.ty, 1.2, '#c0392b'); rect(c, -10.4, -25 + a.ty, 4.6, 3, RUST, 0.7); },
      over(c, a) { rect(c, -4 * a.k, -28 + a.ty, 4, 4.4, dark, 0.7); rect(c, 1.6 * a.k, -16 + a.ty, 3.6, 3.6, RUST, 0.7); line(c, [1, -32.6 + a.ty, 1.6, -11.4 + a.ty], dark, 1.1); },
      head(c, a) { blob(c, dark, () => { c.moveTo(a.hx - 6.4, a.hy + 5.6); c.arc(a.hx, a.hy - 0.4, 6.7, Math.PI * 0.9, Math.PI * 1.88); c.lineTo(a.hx + 2.6, a.hy - 3); c.lineTo(a.hx - 2.6, a.hy - 1.6); c.lineTo(a.hx - 2.6, a.hy + 5.6); }, 1.2);
        disc(c, a.hx + 1.4, a.hy - 0.6, 2.2, '#9fd0d8', 0.9); disc(c, a.hx + 5, a.hy - 0.8, 1.7, '#9fd0d8', 0.9); rect(c, a.hx + 3.2, a.hy + 2, 5.6, 4, '#2f2c28', 0.9); disc(c, a.hx + 9, a.hy + 4, 2.3, '#6a6a62', 0.9); },
      arm(c, a) { aim(c, a, (cc, k) => { longGun(cc, k, 16, LEATHER, '#55524c'); rect(cc, 4, 0.6, 14, 2, '#3a3834', 0.7); rect(cc, 9, -3.4, 3, 1.6, RUST); }, { sleeve: team, y: 4, glove: LEATHER }); },
    }, R);
  } };
  // Artificier (élite) : lunettes de soudeur, tube lance-roquettes sur l'épaule.
  A.units.artificier = { h: 46, top: 56, draw(ctx, u, team, dark, atk, R) {
    figure(ctx, u, team, dark, atk, {
      body: team, legs: team, boots: '#2a2420', belt: LEATHER, sleeve: team,
      back(c, a) { for (const x of [-12, -8.6]) { rect(c, x, -34 + a.ty, 2.8, 13, '#5d6a45', 0.9); poly(c, [x, -34 + a.ty, x + 1.4, -38 + a.ty, x + 2.8, -34 + a.ty], '#c0392b', 0.7); } },
      over(c, a) { line(c, [-5.2 * a.k, -30.6 + a.ty, 6 * a.k, -20.4 + a.ty], LEATHER, 2); for (const [x, y] of [[-2.6, -28.6], [0.6, -25.6], [3.6, -22.6]]) rect(c, x, y + a.ty, 1.8, 2.6, '#c8a24a'); },
      head(c, a) { hairWild(c, a, '#6a5040'); rect(c, a.hx - 5.6, a.hy - 2.6, 11.6, 2.4, '#3a3a36'); disc(c, a.hx + 1.8, a.hy - 1.4, 2.5, '#e0a040', 0.9); disc(c, a.hx + 1.8, a.hy - 1.4, 1.2, '#3a2a1a'); disc(c, a.hx + 5.6, a.hy - 1.6, 2, '#e0a040', 0.9); disc(c, a.hx + 5.6, a.hy - 1.6, 0.9, '#3a2a1a'); },
      arm(c, a) { aim(c, a, (cc, k) => {
        rect(cc, -15, -8.4, 31, 7, '#5d6a45', 1.2); rect(cc, 14, -9.6, 4.6, 9.4, '#3a3a36', 1); rect(cc, -17.6, -9, 3.4, 8.2, '#3a3a36', 1); rect(cc, -6, -8.4, 3.4, 7, team);
        rect(cc, -1.6, -1.6, 3, 5, '#3a3a36', 0.8);
        if (k < 0.15) poly(cc, [18.6, -7.4, 22.4, -4.9, 18.6, -2.4], '#c0392b', 0.7);
        muzzle(cc, 21, -4.9, k);
        if (k > 0.2) { cc.fillStyle = `rgba(230,226,220,${k * 0.6})`; cc.beginPath(); cc.arc(-22 - (1 - k) * 8, -5, 4 + (1 - k) * 5, 0, TAU); cc.fill(); }
      }, { sleeve: team, y: 1, kick: 2, glove: LEATHER }); },
    }, R);
  } };

  // Camion de guerre : cabine blindée, éperon à pointes, cheminées qui crachent. o : crown
  function tire(ctx, x, y, r, spin) {
    disc(ctx, x, y, r, '#24201c', 1.3);
    ctx.strokeStyle = '#3a3632'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = spin + i * Math.PI / 4; ctx.moveTo(x + Math.cos(an) * r * 0.78, y + Math.sin(an) * r * 0.78); ctx.lineTo(x + Math.cos(an) * r * 0.98, y + Math.sin(an) * r * 0.98); } ctx.stroke();
    disc(ctx, x, y, r * 0.46, TOLE, 0.9); disc(ctx, x, y, r * 0.16, IRON);
    ctx.fillStyle = IRON; for (let i = 0; i < 4; i++) { const an = spin + i * Math.PI / 2; ctx.beginPath(); ctx.arc(x + Math.cos(an) * r * 0.3, y + Math.sin(an) * r * 0.3, r * 0.07, 0, TAU); ctx.fill(); }
  }
  function rig(ctx, u, team, dark, atk, o, R) {
    const mv = u.moving, spin = mv ? u.walk * 1.2 : 0, j = mv ? Math.sin(u.walk * 2.4) * 0.7 : 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(atk * 6, 0);
    for (const x of [-5, 0]) { puffs(ctx, x + 1.6, -54 + j, { n: 3, speed: mv ? 1.4 : 0.6, rise: 16, drift: -18, r0: 2.4, r1: 6, rgb: '56,52,48', a: 0.5, seed: x * 0.1 + u.x * 0.01 }); if (o.crown) flame(ctx, x + 1.7, -52 + j, 8, 4, x); rect(ctx, x, -52 + j, 3.4, 24, IRON, 1); }
    // plateau et tôles rapiécées
    rect(ctx, -37, -31 + j, 33, 17, TOLE, 1.4);
    ctx.strokeStyle = TOLE_D; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -33; x < -5; x += 4.4) { ctx.moveTo(x, -30 + j); ctx.lineTo(x, -15 + j); } ctx.stroke();
    rect(ctx, -34, -28 + j, 11, 8, RUST, 0.9); rect(ctx, -19, -24 + j, 12, 8, team, 0.9);
    for (const x of [-32, -24]) { rect(ctx, x, -41 + j, 6.4, 10, '#c0392b', 1); rect(ctx, x, -37.6 + j, 6.4, 2, '#f2c230'); }
    poly(ctx, [-37, -31 + j, -40, -37 + j, -36, -32 + j, -34.6, -38 + j, -32, -31 + j], IRON, 0.9);
    // cabine
    blob(ctx, team, () => { ctx.moveTo(-4, -14 + j); ctx.lineTo(-4, -41 + j); ctx.lineTo(13, -41 + j); ctx.lineTo(22, -29 + j); ctx.lineTo(31, -27.6 + j); ctx.lineTo(31, -14 + j); }, 1.5);
    poly(ctx, [4, -37.6 + j, 11.6, -37.6 + j, 18.6, -28.6 + j, 4, -28.6 + j], '#22303a', 1);
    ctx.strokeStyle = IRON; ctx.lineWidth = 1.3; ctx.beginPath(); for (const x of [7, 10.6, 14.2]) { ctx.moveTo(x, -37.4 + j); ctx.lineTo(x, -28.8 + j); } ctx.stroke();
    rect(ctx, -3, -26 + j, 9, 9, dark, 0.9); line(ctx, [20, -27 + j, 30, -25.6 + j], dark, 1.6); disc(ctx, 26, -21 + j, 1.8, '#ffe9a8', 0.8);
    rect(ctx, -4, -43 + j, 18, 3, IRON, 1);
    if (o.crown) { disc(ctx, 4, -47.6 + j, 4, SKIN, 1.2); disc(ctx, 6, -48 + j, 0.75, INK); R.crown(ctx, 4, -53.6 + j); }
    // éperon à pointes
    blob(ctx, TOLE_D, () => { ctx.moveTo(30, -29 + j); ctx.lineTo(37, -22 + j); ctx.lineTo(39, -5); ctx.lineTo(30, -5); }, 1.4);
    for (const y of [-25, -18.5, -12]) blob(ctx, '#c9ccd2', () => { ctx.moveTo(35.6, y + j * 0.5); ctx.lineTo(45.5, y + 2 + j * 0.5); ctx.lineTo(36.2, y + 4.6 + j * 0.5); }, 0.9);
    if (o.crown) { disc(ctx, 33, -15 + j, 3.6, IVORY, 0.9); disc(ctx, 31.8, -15.6 + j, 0.9, INK); disc(ctx, 34.4, -15.6 + j, 0.9, INK); }
    rect(ctx, -37, -15.4 + j, 68, 5, '#34302c', 1.2);
    tire(ctx, -26, -9, 9.4, spin); tire(ctx, -8.6, -9, 9.4, spin + 0.4); tire(ctx, 20, -9, 9.4, spin + 0.9);
    ctx.restore();
  }
  A.units.camion = { h: 50, draw(ctx, u, team, dark, atk, R) { rig(ctx, u, team, dark, atk, {}, R); } };
  A.units['seigneur-ruines'] = { h: 50, draw(ctx, u, team, dark, atk, R) { rig(ctx, u, team, dark, atk, { crown: true }, R); } };

  /* --------------------------------------------------- base : fort de ferraille */
  function tole(ctx, x, y, w, h, fill) {
    rect(ctx, x, y, w, h, fill, 1.3);
    ctx.strokeStyle = 'rgba(30,22,16,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let xx = x + 4; xx < x + w - 1; xx += 5) { ctx.moveTo(xx, y + 1); ctx.lineTo(xx, y + h - 1); } ctx.stroke();
  }
  A.bases.scrapyard = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // grue et son crochet
    limb(ctx, [6, G - 96, 10, G - 150], 3, IRON); limb(ctx, [10, G - 150, 62, G - 136], 2.6, IRON); line(ctx, [10, G - 150, 34, G - 122, 6, G - 122], TOLE_D, 1.4);
    const sway = Math.sin(T * 1.2) * 3; line(ctx, [58, G - 137, 58 + sway, G - 116], '#2a2622', 1.1);
    ctx.strokeStyle = '#2a2622'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(58 + sway, G - 112, 3.6, -0.4, Math.PI); ctx.stroke();
    // murs de tôle
    tole(ctx, -14, G - 96, 46, 96, TOLE); tole(ctx, 30, G - 78, 48, 78, TOLE_L); tole(ctx, -14, G - 112, 30, 18, RUST);
    rect(ctx, -8, G - 84, 16, 12, RUST_D, 0.9); rect(ctx, 44, G - 64, 20, 13, RUST, 0.9); rect(ctx, 10, G - 58, 14, 18, '#5d6a45', 0.9); rect(ctx, 56, G - 40, 16, 12, '#4a6a7a', 0.9);
    for (const [x, y] of [[-6, G - 82], [6, G - 82], [-6, G - 74], [46, G - 62], [62, G - 62], [12, G - 56], [22, G - 42]]) disc(ctx, x, y, 0.9, '#2a2622');
    poly(ctx, [-14, G - 112, -10, G - 121, -6, G - 112, -2, G - 123, 3, G - 112, 8, G - 120, 12, G - 112], IRON, 1); poly(ctx, [30, G - 78, 35, G - 88, 40, G - 78, 46, G - 90, 52, G - 78, 60, G - 87, 66, G - 78, 72, G - 86, 78, G - 78], IRON, 1);
    // enseigne d'équipe peinte, porte coulissante
    rect(ctx, -10, G - 108, 22, 11, team, 1.1); disc(ctx, 1, G - 102.5, 3.4, IVORY); disc(ctx, -0.2, G - 103, 0.8, team); disc(ctx, 2.2, G - 103, 0.8, team); rect(ctx, -0.6, G - 100.6, 3.2, 1.4, IVORY);
    rect(ctx, 34, G - 46, 26, 46, '#2a2420', 1.5); for (const y of [G - 36, G - 24, G - 12]) line(ctx, [36, y, 58, y], '#4a4440', 1.4); rect(ctx, 32, G - 50, 30, 4.4, team, 1);
    // pneus, bidon qui brûle
    for (const [x, y] of [[-6, G - 7], [8, G - 7], [1, G - 20]]) { disc(ctx, x, y, 7.4, '#24201c', 1.2); disc(ctx, x, y, 3, '#4a4440'); }
    rect(ctx, 66, G - 16, 10, 16, '#c0392b', 1.1); rect(ctx, 66, G - 10, 10, 2, '#f2c230'); flame(ctx, 71, G - 16, 12, 8, side + 1);
    puffs(ctx, 71, G - 30, { n: 3, speed: 0.35, rise: 34, drift: 12, r0: 3, r1: 8, rgb: '50,46,42', a: 0.4 });
    // échafaudage des tourelles
    limb(ctx, [81, G, 82, G - 138], 2.4, RUST_D); limb(ctx, [106, G, 105, G - 138], 2.4, IRON);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; if (s < 3) line(ctx, [105, y - 2, 82, y - 28], IRON, 1.5); rect(ctx, 76, y - 1, 34, 4.4, s % 2 ? RUST : TOLE, 1.2); disc(ctx, 79, y + 1.2, 0.9, '#2a2622'); disc(ctx, 107, y + 1.2, 0.9, '#2a2622'); }
    // drapeau déchiré
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [-4, G - 112, -4, G - 166], 1.8, IRON);
    blob(ctx, team, () => { ctx.moveTo(-4, G - 165); ctx.quadraticCurveTo(10, G - 167 + wv, 22, G - 162 + wv); ctx.lineTo(17, G - 158 + wv * 0.8); ctx.lineTo(23, G - 154 + wv * 0.6); ctx.lineTo(16, G - 151 + wv * 0.5); ctx.lineTo(21, G - 146 + wv * 0.4); ctx.quadraticCurveTo(9, G - 145 + wv * 0.4, -4, G - 147); });
    line(ctx, [2, G - 160 + wv * 0.3, 12, G - 152 + wv * 0.4], dark, 1.8); line(ctx, [12, G - 160 + wv * 0.4, 2, G - 152 + wv * 0.3], dark, 1.8);
  };

  /* --------------------------------------------------------------- tourelles */
  A.turrets['tourelle-ferraille'] = function (ctx, a, team) {
    limb(ctx, [-8, 8, -1, -2], 2, IRON); limb(ctx, [7, 8, -1, -2], 2, IRON);
    ctx.save(); ctx.translate(-a * 2, 0);
    rect(ctx, -10, -11, 15, 9.5, TOLE, 1.2); rect(ctx, -8, -9.6, 5, 3.4, RUST, 0.7); rect(ctx, -10, -5, 15, 2, team);
    rect(ctx, 4, -9.4, 17, 2.4, '#3a3834', 0.8); rect(ctx, 4, -5.6, 17, 2.4, '#3a3834', 0.8);
    ctx.restore();
    poly(ctx, [-2, -17, 4, -16, 5, -1, -3, -1], TOLE_D, 1.1);
    muzzle(ctx, 23 - a * 2, -6.4, a);
  };
  A.turrets.harpon = function (ctx, a, team) {
    rect(ctx, -11, -4, 15, 11, TOLE_D, 1.2); rect(ctx, -11, 1, 15, 2.2, team);
    disc(ctx, -6, -7, 4.6, RUST, 1); line(ctx, [-6, -7, -3.4, -9.6], IRON, 1.2);
    rect(ctx, -4, -10.6, 18, 4.6, '#55524c', 1);
    if (a < 0.6) { line(ctx, [-2, -8.4, 19 - a * 6, -8.8], '#b9bec8', 2); blob(ctx, '#d6d9de', () => { ctx.moveTo(24 - a * 6, -8.8); ctx.lineTo(17 - a * 6, -13.4); ctx.lineTo(19 - a * 6, -8.8); ctx.lineTo(17 - a * 6, -4.2); }, 0.9); }
    line(ctx, [-6, -7, 2, -3, 12, -6.4], '#2a2622', 0.9);
  };
  A.turrets['catapulte-bidons'] = function (ctx, a, team) {
    rect(ctx, -12, 1, 24, 6.5, TOLE, 1.2); rect(ctx, -12, 3.2, 24, 2, team);
    limb(ctx, [8, 1, 3, -13], 2.2, IRON); limb(ctx, [-4, 1, 3, -13], 2.4, RUST_D);
    ctx.save(); ctx.translate(3, -12.5); ctx.rotate(-0.37 + a * 2.45);
    limb(ctx, [6.5, 0, -19, 0], 2.2, IRON); rect(ctx, 4.6, -3, 7, 8, '#34302c', 1);
    blob(ctx, TOLE_D, () => { ctx.moveTo(-24, -1); ctx.quadraticCurveTo(-20, 5.5, -16, -1); }, 1);
    if (a < 0.3) { rect(ctx, -23.6, -10.6, 7.4, 10, '#c0392b', 1); rect(ctx, -23.6, -6.8, 7.4, 2, '#f2c230'); }
    ctx.restore();
  };

  /* ---------------------------------------------------- projectiles, pouvoir */
  A.projectiles.harpoon = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    line(ctx, [-34, 0, -22, 0], 'rgba(40,36,32,0.6)', 1); line(ctx, [-24, 0, 0, 0], INK, 3.4); line(ctx, [-24, 0, 0, 0], '#b9bec8', 1.8);
    blob(ctx, '#d6d9de', () => { ctx.moveTo(6.5, 0); ctx.lineTo(-3, -4.8); ctx.lineTo(-0.6, 0); ctx.lineTo(-3, 4.8); }, 0.9);
  };
  function drum(ctx, s) { rect(ctx, -5.4 * s, -7 * s, 10.8 * s, 14 * s, '#c0392b', 1); rect(ctx, -5.4 * s, -2 * s, 10.8 * s, 3.6 * s, '#f2c230'); line(ctx, [-5.4 * s, -4.6 * s, 5.4 * s, -4.6 * s], '#8f2a20', 1); line(ctx, [-5.4 * s, 4.4 * s, 5.4 * s, 4.4 * s], '#8f2a20', 1); poly(ctx, [-1.6 * s, -1.6 * s, 0, -0.2 * s, 1.6 * s, -1.6 * s, 0, 1.4 * s], INK); }
  A.projectiles.barrel = function (ctx, p) { ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.05); drum(ctx, 1); };
  A.drops.barrel = function (ctx, d) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(d.x - 6, d.y - 50, 1.4, 26); ctx.fillRect(d.x + 5, d.y - 56, 1.4, 30);
    halo(ctx, d.x, d.y - 26, 8, '255,170,60', 0.7); flame(ctx, d.x, d.y - 16, 12, 7, d.x);
    ctx.save(); ctx.translate(d.x, d.y - 6); ctx.rotate(d.y * 0.02 + d.x); drum(ctx, 1.35); ctx.restore();
  };

  /* -------------------------------------------------------------------- décor */
  function wreck(g, x, base, w, hh, col, r, lean) {       // tour éventrée : ossature à nu en haut
    g.save(); g.translate(x + w / 2, base + 40); g.rotate(lean); g.translate(-w / 2, -40);
    g.fillStyle = col; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -hh * 0.62);
    for (let k = 1; k <= 6; k++) g.lineTo(w * k / 6, -hh * (0.5 + r() * 0.26));
    g.lineTo(w, 60); g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 2.4;
    for (let k = 0; k <= 4; k++) { const xx = w * k / 4; g.beginPath(); g.moveTo(xx, -hh * 0.5); g.lineTo(xx, -hh * (0.78 + r() * 0.22)); g.stroke(); }
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, -hh * (0.6 + k * 0.1)); g.lineTo(w * (0.5 + r() * 0.5), -hh * (0.6 + k * 0.1)); g.stroke(); }
    g.fillStyle = 'rgba(30,18,10,0.35)'; for (let k = 0; k < 14; k++) g.fillRect(4 + r() * (w - 12), -hh * 0.5 + r() * hh * 0.45, 6, 9);
    g.restore();
  }
  function carWreck(g, x, y, s, col) {
    g.fillStyle = col; g.beginPath(); g.moveTo(x - 22 * s, y); g.lineTo(x - 20 * s, y - 8 * s); g.lineTo(x - 10 * s, y - 9 * s); g.lineTo(x - 5 * s, y - 17 * s); g.lineTo(x + 9 * s, y - 17 * s); g.lineTo(x + 15 * s, y - 9 * s); g.lineTo(x + 22 * s, y - 7 * s); g.lineTo(x + 22 * s, y); g.fill();
    g.fillStyle = 'rgba(30,18,10,0.5)'; g.fillRect(x - 3 * s, y - 15 * s, 10 * s, 6 * s); g.beginPath(); g.arc(x - 12 * s, y, 5 * s, Math.PI, 0); g.arc(x + 13 * s, y, 5 * s, Math.PI, 0); g.fill();
  }
  const DUST = { x: 0 };
  A.backdrops.postapo = backdrop('postapo', 2077, (g, r) => {
    sky(g, [[0, '#8a5a3a'], [0.4, '#c98a4e'], [0.75, '#e9bf80'], [1, '#f3d9a8']]);
    halo(g, 640, 240, 320, '255,226,170', 0.6); disc(g, 640, 240, 58, 'rgba(255,236,196,0.75)');
    for (const [x, w, hh, lean] of [[60, 70, 250, -0.04], [200, 90, 190, 0.03], [430, 60, 290, 0.06], [760, 80, 230, -0.05], [900, 110, 170, 0.02], [1100, 70, 270, -0.03]]) wreck(g, x, 500, w, hh, '#a8784e', r, lean);
    const gr = g.createLinearGradient(0, 360, 0, 540); gr.addColorStop(0, 'rgba(240,210,160,0)'); gr.addColorStop(1, 'rgba(240,210,160,0.9)');
    g.fillStyle = gr; g.fillRect(-40, 360, W + 80, 260);
  }, (f, r) => {
    const h1 = x => 520 - Math.sin(x * 0.004 + 2.9) * 18 - Math.sin(x * 0.012 + 1.1) * 6;
    const h2 = x => 568 - Math.sin(x * 0.0058 + 0.6) * 13 - Math.sin(x * 0.016 + 4) * 5;
    for (const [x, w, hh, lean] of [[300, 90, 150, 0.05], [600, 120, 120, -0.03], [1010, 90, 160, 0.04]]) wreck(f, x, 520, w, hh, '#8a5e3c', r, lean);
    // viaduc d'autoroute effondré
    f.fillStyle = '#7a563a'; f.fillRect(-40, 470, 250, 12); f.fillRect(60, 482, 16, 60); f.fillRect(170, 482, 16, 60);
    f.beginPath(); f.moveTo(210, 470); f.lineTo(300, 506); f.lineTo(296, 516); f.lineTo(206, 482); f.fill(); f.fillRect(1090, 470, 230, 12); f.fillRect(1150, 482, 16, 60);
    f.strokeStyle = '#7a563a'; f.lineWidth = 2; for (const x of [300, 310, 1090, 1082]) { f.beginPath(); f.moveTo(x, 508 - (x > 1000 ? 36 : 0)); f.lineTo(x + 4, 524 - (x > 1000 ? 36 : 0)); f.stroke(); }
    let gr = f.createLinearGradient(0, 490, 0, GROUND); gr.addColorStop(0, '#c9a066'); gr.addColorStop(1, '#b0864e');
    hills(f, h1, 0, gr);
    for (const [x, hh] of [[460, 70], [880, 86]]) { const y = h1(x) + 4; f.strokeStyle = '#6a4e36'; f.lineWidth = 2.4; f.beginPath(); f.moveTo(x - 10, y); f.lineTo(x + 3, y - hh); f.lineTo(x + 12, y); f.moveTo(x - 14, y - hh * 0.72); f.lineTo(x + 18, y - hh * 0.8); f.moveTo(x - 10, y - hh * 0.5); f.lineTo(x + 14, y - hh * 0.56); f.stroke(); }
    hills(f, h2, 0, '#a87e48');
    gr = f.createLinearGradient(0, 552, 0, GROUND); gr.addColorStop(0, '#b0864e'); gr.addColorStop(1, '#9a7240');
    hills(f, h2, 4, gr);
    carWreck(f, 250, h2(250) + 12, 1.2, '#7a4a30'); carWreck(f, 700, h2(700) + 12, 1, '#5e6a5a'); carWreck(f, 1130, h2(1130) + 12, 1.3, '#8a5236');
    for (const x of [420, 436, 428]) { f.fillStyle = '#2e2620'; f.beginPath(); f.arc(x, h2(x) + 8 - (x === 428 ? 12 : 0), 8, 0, TAU); f.fill(); f.fillStyle = '#6a5a48'; f.beginPath(); f.arc(x, h2(x) + 8 - (x === 428 ? 12 : 0), 3, 0, TAU); f.fill(); }
    soil(f, r, { top: '#b58a52', bottom: '#7e5c34', crack: 'rgba(70,40,14,0.3)', pebbles: ['#9a8468', '#b39a78'], nPebbles: 24, tufts: ['#9a8a4e', '#7a6a3a'], band: '#c9a468', bandLight: '#e0c088' });
    // terre craquelée
    f.strokeStyle = 'rgba(70,40,14,0.28)'; f.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) { let x = r() * W, y = GROUND + 16 + r() * 88; f.beginPath(); f.moveTo(x, y); for (let k = 0; k < 3; k++) { x += 8 + r() * 14; y += (r() - 0.5) * 12; f.lineTo(x, y); } f.stroke(); }
  }, (ctx, t, dt, R) => {
    clouds(ctx, R, dt, 'rgba(160,110,70,0.35)', 'rgba(214,170,120,0.45)');
    flock(ctx, t, dt, 'postapo', '#3a2a22', 4);
  }, (ctx, t, dt) => {
    // voiles de poussière qui dérivent
    DUST.x = (DUST.x + 26 * (dt || 0)) % 520;
    for (let k = -1; k < 4; k++) { const x = k * 520 + DUST.x, g = ctx.createLinearGradient(x, 0, x + 360, 0); g.addColorStop(0, 'rgba(230,190,130,0)'); g.addColorStop(0.5, 'rgba(230,190,130,0.16)'); g.addColorStop(1, 'rgba(230,190,130,0)'); ctx.fillStyle = g; ctx.fillRect(x, 420, 360, 190); }
  });
})();

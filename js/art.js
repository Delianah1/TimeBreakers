/* =========================================================================
   NOUVEAUX GRAPHISMES (v2) — toujours dessinés à la main sur le canvas.
   Ce fichier : le principe, la boîte à outils commune (PA.Art.kit, en bas)
   et l'âge de pierre, qui a servi de modèle. Les autres âges sont dans
   js/art/<âge>.js, plus js/art/assaut.js pour l'assaut final.
   Le rendu d'origine (render.js) reste en place : quand un élément a une
   version ici, elle le remplace.

   Touche G en jeu : bascule anciens / nouveaux graphismes (pour comparer).
   Vitrine : index.html?demo=<id de l'âge> (flèches ← → pour changer d'âge).

   Pour convertir un âge, ajouter ses entrées dans PA.Art :
     units[id d'unité]         { h: hauteur du dessin, top: hauteur de l'étoile d'élite, draw(ctx, u, team, dark, atk, R) }
     bases[look de la base]    (ctx, side, def, team, dark, R)
     turrets[id de tourelle]   (ctx, a, team, dark)      a = 1 au moment du tir, puis 0
     projectiles[look]         (ctx, p, dir)
     drops[look du pouvoir]    (ctx, d)
     backdrops[id de l'âge]    (ctx, t, dt, R)
   Style : contour sombre, deux tons par matière, la couleur d'équipe sur les vêtements.
   Repère des unités : pieds en (0, 0), regard vers +x (le moteur retourne l'image pour l'ennemi).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const W = C.world.width, H = C.world.height, GROUND = C.world.groundY;
  const TAU = Math.PI * 2;
  const INK = '#2b1d14';
  const SKIN = '#e2b48a', SKIN_D = '#c08f66';
  const WOOD = '#8a5a30', WOOD_D = '#6b4424', WOOD_L = '#b98650';
  const ROCK = '#9a9084', ROCK_D = '#6f6457', ROCK_L = '#bdb2a2';
  const IVORY = '#f3ead2';

  const Art = { on: true, units: {}, bases: {}, turrets: {}, projectiles: {}, drops: {}, backdrops: {} };

  // Hasard reproductible : le décor est le même d'une image à l'autre.
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const now = () => performance.now() / 1000;

  // Forme pleine cernée d'un contour. lw = 0 : pas de contour.
  function blob(ctx, fill, build, lw) {
    ctx.beginPath(); build(); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (lw !== 0) { ctx.strokeStyle = INK; ctx.lineWidth = lw || 1.4; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  // Membre ou bâton : trait épais arrondi, cerné.
  function limb(ctx, pts, w, color) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = INK; ctx.lineWidth = w + 2.2; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  }
  function ell(ctx, x, y, rx, ry, rot) { ctx.moveTo(x + rx, y); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  // Caillou à facettes (projectiles, pouvoir, décor).
  function stone(ctx, r, fill, light) {
    blob(ctx, fill, () => { ctx.moveTo(-r, 0.15 * r); ctx.lineTo(-0.6 * r, -0.8 * r); ctx.lineTo(0.25 * r, -r); ctx.lineTo(0.95 * r, -0.35 * r); ctx.lineTo(0.8 * r, 0.6 * r); ctx.lineTo(0, r); ctx.lineTo(-0.7 * r, 0.75 * r); }, Math.max(0.8, r * 0.16));
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(-0.6 * r, -0.62 * r); ctx.lineTo(0.2 * r, -0.8 * r); ctx.lineTo(0.05 * r, -0.2 * r); ctx.lineTo(-0.7 * r, 0.05 * r); ctx.closePath(); ctx.fill();
  }

  /* =======================================================================
     ÂGE DE PIERRE — unités
     ======================================================================= */

  // --- bras et armes (sx, sy = épaule) --------------------------------------
  // Au repos la massue est tenue devant soi ; à l'attaque : armé en arrière, coup vers l'avant, retour.
  function armClub(ctx, sx, sy, u, big) {
    const pr = u.attackAnim > 0 ? 1 - u.attackAnim / 0.25 : -1;
    const rest = [0.75, sx + 5, sy + 6];
    let v = rest;
    if (pr >= 0) {
      const back = [-1.0, sx + 0.5, sy - 5], hit = [1.95, sx + 9.5, sy + 3];
      const mix = (p, q, t) => p.map((n, i) => n + (q[i] - n) * t);
      v = pr < 0.3 ? mix(rest, back, pr / 0.3) : pr < 0.6 ? mix(back, hit, (pr - 0.3) / 0.3) : mix(hit, rest, (pr - 0.6) / 0.4);
    }
    const hx = v[1], hy = v[2];
    limb(ctx, [sx, sy, (sx + hx) / 2 - 1, (sy + hy) / 2 + 2.6, hx, hy], 3, SKIN);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(v[0]); if (big) ctx.scale(big, big);
    blob(ctx, WOOD, () => { ctx.moveTo(-1.3, 3); ctx.lineTo(1.3, 3); ctx.lineTo(3.4, -11); ctx.quadraticCurveTo(4.2, -18, 0, -18.8); ctx.quadraticCurveTo(-4.2, -18, -3.4, -11); });
    ctx.strokeStyle = WOOD_L; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-1.1, -3); ctx.lineTo(-2.1, -13.5); ctx.stroke();
    ctx.strokeStyle = WOOD_D; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(1, -9, 1.3, 0.3, 2.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(-0.3, -14.4, 0.9, 0, 2.4); ctx.stroke();
    for (const [x, y, a] of [[3.3, -13, 0.6], [-3.3, -15.5, -0.6], [3.2, -8.2, 0.9]]) {      // éclats d'os
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      blob(ctx, IVORY, () => { ctx.moveTo(-1.1, 0.4); ctx.lineTo(0, -3.8); ctx.lineTo(1.1, 0.4); }, 0.8);
      ctx.restore();
    }
    ctx.restore();
    blob(ctx, SKIN, () => ctx.arc(hx, hy, 2, 0, TAU), 1);
  }

  function armSling(ctx, sx, sy, atk, u, sw) {
    const T = now();
    let hx, hy, ex, ey, charge = true, whirl = false;
    if (atk > 0.05) { hx = sx + 7.5; hy = sy - 2 + atk * 2; ex = hx + 9; ey = hy - 3 + atk * 5; charge = false; }   // lâcher
    else if (!u.moving) {                                                                                          // moulinet au-dessus de la tête
      hx = sx + 0.5; hy = sy - 12.5; whirl = true;
      const w = T * 15 + u.x * 0.1; ex = hx + Math.cos(w) * 9.5; ey = hy - 4 + Math.sin(w) * 3.2;
    } else { hx = sx + 4.5 + sw * 2; hy = sy + 8; ex = hx + 1 - sw * 3; ey = hy + 9; }                             // marche : fronde pendante
    limb(ctx, [sx, sy, (sx + hx) / 2 + 2.2, (sy + hy) / 2 + (hy < sy ? 0 : 1.5), hx, hy], 2.8, SKIN);
    if (whirl) { ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(hx, hy - 4, 9.5, 3.2, 0, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ex, ey); ctx.stroke();
    blob(ctx, '#7a5230', () => ctx.ellipse(ex, ey, 2.4, 1.6, 0, 0, TAU), 0.9);
    if (charge) blob(ctx, ROCK, () => ctx.arc(ex, ey - 0.7, 1.7, 0, TAU), 0.8);
    blob(ctx, SKIN, () => ctx.arc(hx, hy, 1.8, 0, TAU), 1);
  }

  function armStaff(ctx, sx, sy, atk, u, team) {
    const T = now();
    const hx = sx + 5 + atk * 2, hy = sy + 3 - atk * 5;
    limb(ctx, [sx, sy, sx + 3.5, sy + 4.5, hx, hy], 2.8, SKIN);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.1 + atk * 0.4);
    limb(ctx, [0, 26, 0, -20], 2, WOOD);
    for (const a of [-0.9, -0.3]) {                                             // plumes
      ctx.save(); ctx.translate(-1, -15); ctx.rotate(a - Math.sin(T * 3 + u.x) * 0.08);
      blob(ctx, team, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(-2.4, -4, 0, -8.5); ctx.quadraticCurveTo(2.2, -4, 0, 0); }, 0.8);
      ctx.restore();
    }
    blob(ctx, IVORY, () => ctx.ellipse(0, -23.5, 3.6, 4, 0, 0, TAU), 1);          // crâne
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(1.3, -24, 1.05, 0, TAU); ctx.fill(); ctx.fillRect(0.2, -21.2, 0.9, 1.6);
    const g = 2.6 + atk * 3.5 + Math.sin(T * 9 + u.x) * 0.5;                       // braise
    ctx.fillStyle = 'rgba(255,130,40,0.32)'; ctx.beginPath(); ctx.arc(0, -30.5, g * 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.arc(0, -30.5, g, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffeaa8'; ctx.beginPath(); ctx.arc(0, -30.5, g * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
    blob(ctx, SKIN, () => ctx.arc(hx, hy, 1.8, 0, TAU), 1);
  }

  // --- personnage ------------------------------------------------------------
  // o : bulk (carrure), hair (couleur), beard, tail (queue de cheval), antlers, cloak (couleur), paint, weapon, big, crown
  function caveman(ctx, u, team, dark, atk, o, R) {
    const T = now();
    const mv = u.moving;
    const sw = mv ? Math.sin(u.walk) : 0;
    const bob = mv ? Math.abs(Math.cos(u.walk)) * 1.3 : Math.sin(T * 2.2 + u.x * 0.05) * 0.5;
    const k = o.bulk || 1, ty = -bob, hair = o.hair || '#4a2e1c';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    if (o.cloak) {
      blob(ctx, o.cloak, () => {
        ctx.moveTo(-4 * k, -33 + ty); ctx.quadraticCurveTo(-13 * k - sw * 2, -22 + ty, -10.5 * k - sw * 3, -6);
        ctx.lineTo(-7 * k, -10); ctx.lineTo(-4 * k, -5.5); ctx.lineTo(0, -13); ctx.lineTo(3 * k, -32 + ty);
      });
    }
    limb(ctx, [-2 * k, -30 + ty, -4 * k - sw * 2, -24 + ty, -3 * k - sw * 5, -19 + ty], 3 * k, SKIN_D);     // bras arrière

    const leg = (dir, col) => {
      const fx = dir * sw * 6 + dir, lift = mv ? Math.max(0, dir * Math.cos(u.walk)) * 2.4 : 0;
      limb(ctx, [dir * 1.2 * k, -17 + ty, fx * 0.5 + 2.2, -9 + ty * 0.5 - lift * 0.5, fx, -2 - lift, fx + 3, -2 - lift], 3.6 * k, col);
    };
    leg(-1, SKIN_D); leg(1, SKIN);

    // torse nu, puis peau de bête sur une épaule (couleur d'équipe), ourlet en dents
    blob(ctx, SKIN, () => { ctx.moveTo(-5.5 * k, -31 + ty); ctx.quadraticCurveTo(0, -34.5 + ty, 6 * k, -31.5 + ty); ctx.lineTo(6.2 * k, -17 + ty); ctx.lineTo(-5.6 * k, -16.5 + ty); });
    blob(ctx, team, () => {
      ctx.moveTo(6 * k, -32 + ty); ctx.lineTo(6.8 * k, -17 + ty); ctx.lineTo(6 * k, -11.5 + ty); ctx.lineTo(3.4 * k, -14.5 + ty); ctx.lineTo(1 * k, -11 + ty);
      ctx.lineTo(-1.6 * k, -14.5 + ty); ctx.lineTo(-4 * k, -11.5 + ty); ctx.lineTo(-6.2 * k, -15 + ty); ctx.lineTo(-5.8 * k, -22.5 + ty); ctx.lineTo(2.5 * k, -31.5 + ty);
    });
    ctx.strokeStyle = dark; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-5.4 * k, -19 + ty); ctx.lineTo(6.4 * k, -19.6 + ty); ctx.stroke();
    ctx.fillStyle = dark;
    for (const [x, y] of [[2.6, -25], [-2, -22.5], [4, -15.8], [-3.2, -15.6]]) { ctx.beginPath(); ctx.ellipse(x * k, y + ty, 1.1, 0.8, 0.4, 0, TAU); ctx.fill(); }
    if (o.teeth) {                                                                  // collier de dents
      ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) { const x = (-2 + i * 2.2) * k, y = -30.5 + ty + Math.sin((i + 0.5) / 4 * Math.PI) * 2.2; ctx.beginPath(); ctx.moveTo(x - 0.9, y); ctx.lineTo(x, y + 2.6); ctx.lineTo(x + 0.9, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }

    const sx = 3.5 * k, sy = -30.5 + ty;

    // tête
    const hx = 2 * k, hy = -39.5 + ty;
    if (o.tail) blob(ctx, hair, () => { ctx.moveTo(hx - 4, hy - 3); ctx.quadraticCurveTo(hx - 12 - sw * 2, hy - 4, hx - 10.5 - sw * 2, hy + 6); ctx.quadraticCurveTo(hx - 8, hy + 1, hx - 4.5, hy + 2); });
    if (o.antlers) {
      for (const d of [-1, 1]) {
        const bx = hx + d * 2.6 - 0.6, by = hy - 5;
        limb(ctx, [bx, by, bx + d * 3.2, by - 5, bx + d * 2.2, by - 10.5], 1.5, IVORY);
        limb(ctx, [bx + d * 3, by - 4.6, bx + d * 6.4, by - 6.4], 1.3, IVORY);
        limb(ctx, [bx + d * 2.8, by - 7.6, bx + d * 5.6, by - 10.6], 1.2, IVORY);
      }
    }
    blob(ctx, SKIN, () => ctx.arc(hx, hy, 5.8, 0, TAU));
    blob(ctx, hair, () => {                                                         // tignasse
      ctx.moveTo(hx - 5.9, hy + 2.4); ctx.arc(hx, hy, 6.2, Math.PI * 0.88, Math.PI * 1.72);
      ctx.lineTo(hx + 2.4, hy - 3.3); ctx.lineTo(hx + 0.3, hy - 2.1); ctx.lineTo(hx - 1.4, hy - 3.7); ctx.lineTo(hx - 3.2, hy - 0.8); ctx.lineTo(hx - 3.8, hy + 2.6);
    }, 1.1);
    if (o.beard) blob(ctx, hair, () => {
      ctx.moveTo(hx - 4.4, hy + 2.8); ctx.lineTo(hx + 0.6, hy + 4.4); ctx.lineTo(hx + 5.2, hy + 3.8); ctx.lineTo(hx + 4.3, hy + 7.8);
      ctx.lineTo(hx + 2, hy + 6.8); ctx.lineTo(hx + 0.6, hy + (o.beard > 1 ? 13 : 9.8)); ctx.lineTo(hx - 1.8, hy + 7); ctx.lineTo(hx - 4, hy + 7.2);
    }, 1.1);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 2.9, hy - 0.6, 0.95, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(hx + 1.2, hy - 2.9); ctx.lineTo(hx + 4.7, hy - 1.9); ctx.stroke();
    blob(ctx, SKIN, () => ctx.arc(hx + 5.9, hy + 0.9, 1.5, 0, TAU), 1);
    if (atk > 0.4) { ctx.fillStyle = '#5a1e14'; ctx.beginPath(); ctx.ellipse(hx + 3.3, hy + 3.3, 1.6, 1.25, 0, 0, TAU); ctx.fill(); }
    else { ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 3.3); ctx.lineTo(hx + 4.4, hy + 3.1); ctx.stroke(); }
    if (o.paint) {                                                                   // peinture de guerre
      ctx.strokeStyle = o.paint; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx + 0.6, hy + 0.8); ctx.lineTo(hx + 3.4, hy + 1.4); ctx.moveTo(hx + 0.4, hy + 2.3); ctx.lineTo(hx + 2.6, hy + 2.7); ctx.stroke();
    }
    if (o.crown) R.crown(ctx, hx, hy - 8.5);

    // épaulière en défense de mammouth (chef)
    if (o.tusk) blob(ctx, IVORY, () => { ctx.moveTo(1 * k, -33 + ty); ctx.quadraticCurveTo(6 * k, -38 + ty, 10.5 * k, -41 + ty); ctx.quadraticCurveTo(8.5 * k, -33 + ty, 5 * k, -30 + ty); }, 1);

    if (o.weapon === 'sling') armSling(ctx, sx, sy, atk, u, sw);
    else if (o.weapon === 'staff') armStaff(ctx, sx, sy, atk, u, team);
    else armClub(ctx, sx, sy, u, o.big);
  }

  Art.units.cogneur = { h: 46, draw(ctx, u, team, dark, atk, R) { caveman(ctx, u, team, dark, atk, { beard: 1, bulk: 1.08, weapon: 'club' }, R); } };
  Art.units.frondeur = { h: 46, draw(ctx, u, team, dark, atk, R) { caveman(ctx, u, team, dark, atk, { hair: '#7a4420', tail: true, paint: '#f3ead2', weapon: 'sling' }, R); } };
  Art.units.chaman = { h: 46, top: 59, draw(ctx, u, team, dark, atk, R) {
    caveman(ctx, u, team, dark, atk, { hair: '#c9c1b4', beard: 2, antlers: true, cloak: dark, teeth: true, paint: '#c0392b', weapon: 'staff' }, R);
  } };
  Art.units['chef-clan'] = { h: 46, draw(ctx, u, team, dark, atk, R) {
    caveman(ctx, u, team, dark, atk, { beard: 1, bulk: 1.22, cloak: '#5a3d28', teeth: true, tusk: true, paint: '#f3ead2', crown: true, weapon: 'club', big: 1.3 }, R);
  } };

  // --- mammouth de guerre ------------------------------------------------------
  // o (champions, js/champions.js) : crown = le cavalier porte la couronne
  Art.units.mammouth = { h: 58, draw(ctx, u, team, dark, atk, R, o) {
    const T = now();
    const mv = u.moving, ph = u.walk * 0.7;
    const st = mv ? Math.sin(ph) : 0;
    const b = mv ? -Math.abs(Math.cos(ph)) * 1.2 : -Math.sin(T * 1.6 + u.x * 0.04) * 0.5;
    const FUR = '#7d5338', FUR_D = '#5f3d28', FUR_L = '#9c6e4c', TUSK_D = '#d6ccb0';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const leg = (x, dir, col) => {
      const dx = dir * st * 3.5, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 2.5 : 0;
      blob(ctx, col, () => {
        ctx.moveTo(x - 4.6, -25); ctx.lineTo(x + 4.6, -25); ctx.lineTo(x + 4.8 + dx, -3 - lift);
        ctx.quadraticCurveTo(x + 5.2 + dx, -lift, x + dx, -lift); ctx.quadraticCurveTo(x - 5.2 + dx, -lift, x - 4.8 + dx, -3 - lift);
      });
      ctx.fillStyle = '#e8dcc0';
      for (const o of [-1.6, 1, 3.6]) { ctx.beginPath(); ctx.arc(x + dx + o, -0.9 - lift, 1, Math.PI, 0); ctx.fill(); }
    };
    leg(-11, -1, FUR_D); leg(13, 1, FUR_D);
    leg(-18, 1, '#6e4830'); leg(6, -1, '#6e4830');
    limb(ctx, [-25.5, -35 + b, -30, -27 + b, -29 + st, -19], 1.6, FUR_D);                 // queue

    // défense du fond
    ctx.beginPath(); ctx.moveTo(20, -33 + b); ctx.quadraticCurveTo(33, -15 + b, 38 + atk * 2, -31 + b - atk * 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 5.4; ctx.stroke(); ctx.strokeStyle = TUSK_D; ctx.lineWidth = 3.2; ctx.stroke();

    blob(ctx, FUR, () => {
      ctx.moveTo(-25, -18 + b);
      ctx.quadraticCurveTo(-30, -30 + b, -24, -39 + b);        // croupe
      ctx.quadraticCurveTo(-12, -47 + b, 0, -51 + b);          // le dos monte vers le garrot
      ctx.quadraticCurveTo(6, -52 + b, 9, -48.5 + b);
      ctx.quadraticCurveTo(13, -58 + b, 20, -57 + b);          // dôme du crâne
      ctx.quadraticCurveTo(28.5, -55 + b, 28.5, -44 + b);      // front
      ctx.lineTo(27, -34 + b);
      ctx.quadraticCurveTo(24, -26 + b, 21, -19 + b);          // poitrail
      for (let x = 17; x >= -22; x -= 6.5) { ctx.lineTo(x + 1.5, -13 + b); ctx.lineTo(x - 3, -18.5 + b); }   // frange du ventre
    }, 1.6);
    ctx.strokeStyle = FUR_L; ctx.lineWidth = 2.2;                                           // lumière sur le dos
    ctx.beginPath(); ctx.moveTo(-23, -36.5 + b); ctx.quadraticCurveTo(-12, -44.5 + b, 0, -48.4 + b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(13, -53.5 + b); ctx.quadraticCurveTo(17, -55 + b, 21, -54.2 + b); ctx.stroke();
    ctx.strokeStyle = FUR_D; ctx.lineWidth = 1.2;                                           // mèches
    for (const [x, y] of [[-17, -29], [-7, -33], [4, -35], [-12, -23], [1, -25], [12, -29], [18, -38], [-21, -22], [13, -21]]) {
      ctx.beginPath(); ctx.arc(x, y + b, 3.8, 0.25, 2.5); ctx.stroke();
    }
    blob(ctx, FUR_D, () => { ctx.moveTo(13, -55.5 + b); ctx.lineTo(15.5, -61 + b); ctx.lineTo(18, -57.5 + b); ctx.lineTo(21, -61 + b); ctx.lineTo(23, -56 + b); }, 1.1);   // toupet
    blob(ctx, FUR_D, () => ctx.ellipse(14.5, -43 + b, 4.4, 6.6, 0.3, 0, TAU), 1.1);         // oreille
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(22.8, -46.5 + b, 1.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(23.2, -47 + b, 0.5, 0, TAU); ctx.fill();

    // trompe : pend au repos, fouette vers l'avant à l'attaque
    const p0 = [26.6, -38 + b], p1 = [32 + atk * 5, -24 + b - atk * 9], p2 = [27.5 + atk * 12, -10 - atk * 15 + b];
    const q = t => [(1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * p1[1] + t * t * p2[1]];
    const tr = []; for (let i = 0; i <= 6; i++) tr.push(q(i / 6));
    limb(ctx, [].concat(...tr.slice(0, 5)), 6.4, FUR);
    limb(ctx, [].concat(...tr.slice(3)), 4.6, FUR);
    ctx.strokeStyle = FUR_D; ctx.lineWidth = 0.9;
    for (let i = 1; i < 6; i++) { const [x, y] = tr[i]; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 1.6, y + 0.6); ctx.stroke(); }

    // défense de devant
    ctx.beginPath(); ctx.moveTo(23, -33 + b); ctx.quadraticCurveTo(37, -13 + b, 42 + atk * 2, -31 + b - atk * 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 5.8; ctx.stroke(); ctx.strokeStyle = IVORY; ctx.lineWidth = 3.6; ctx.stroke();
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24.5, -31 + b); ctx.quadraticCurveTo(35, -16 + b, 40.5 + atk * 2, -28 + b - atk * 3); ctx.stroke();

    // tapis de selle aux couleurs de l'équipe
    blob(ctx, team, () => {
      ctx.moveTo(-17, -42 + b); ctx.quadraticCurveTo(-8, -47.5 + b, 3, -51 + b);
      ctx.lineTo(4, -37 + b); ctx.lineTo(1, -33 + b); ctx.lineTo(-2.5, -37 + b); ctx.lineTo(-6, -33 + b); ctx.lineTo(-9.5, -37 + b); ctx.lineTo(-13, -33 + b); ctx.lineTo(-16.5, -37 + b);
    });
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-16.5, -39.5 + b); ctx.lineTo(3.8, -40.5 + b); ctx.stroke();
    ctx.fillStyle = IVORY; for (const x of [-12, -6.5, -1]) { ctx.beginPath(); ctx.arc(x, -43.2 + b - (x + 12) * 0.25, 1, 0, TAU); ctx.fill(); }

    // cavalier et sa lance à pointe de silex
    const ry = b - 50;
    limb(ctx, [-6, ry + 1, -3.5, ry + 6, -2, ry + 11], 2.6, SKIN);
    blob(ctx, SKIN, () => { ctx.moveTo(-10, ry - 11); ctx.lineTo(-2.6, ry - 11.5); ctx.lineTo(-2, ry + 1.5); ctx.lineTo(-10.4, ry + 1.5); }, 1.2);
    blob(ctx, team, () => { ctx.moveTo(-2.6, ry - 11.5); ctx.lineTo(-2, ry + 1.5); ctx.lineTo(-10.4, ry + 1.5); ctx.lineTo(-10.2, ry - 4); }, 1.2);
    blob(ctx, SKIN, () => ctx.arc(-5.6, ry - 16, 4.3, 0, TAU), 1.2);
    blob(ctx, '#4a2e1c', () => { ctx.moveTo(-10, ry - 14.5); ctx.arc(-5.6, ry - 16, 4.6, Math.PI * 0.9, Math.PI * 1.7); ctx.lineTo(-4.4, ry - 18.4); ctx.lineTo(-7.2, ry - 17); ctx.lineTo(-8.6, ry - 14); }, 1);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-3.4, ry - 16.4, 0.8, 0, TAU); ctx.fill();
    if (o && o.crown) R.crown(ctx, -5.6, ry - 23.5);
    const px = atk * 7;
    limb(ctx, [-15 + px, ry - 9.5, 19 + px, ry - 3.5], 1.5, '#9a6a3a');
    ctx.save(); ctx.translate(19 + px, ry - 3.5); ctx.rotate(0.175);
    blob(ctx, '#6a655e', () => { ctx.moveTo(-1, -2.6); ctx.lineTo(7, 0); ctx.lineTo(-1, 2.6); }, 0.9);
    ctx.restore();
    limb(ctx, [-4, ry - 8.5, -1 + px * 0.6, ry - 4.5, 1 + px, ry - 6.6], 2.4, SKIN);
  } };

  /* =======================================================================
     ÂGE DE PIERRE — base, tourelles, projectiles, pouvoir
     ======================================================================= */

  // Falaise et grotte habitée, tour de guet en rondins pour les tourelles (elles sont en x = 92).
  Art.bases.cave = function (ctx, side, def, team, dark) {
    const T = now(), G = GROUND;
    const fl = Math.sin(T * 9 + side) * 0.5 + Math.sin(T * 14.3) * 0.5;       // vacillement du feu
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // fumée qui sort d'une cheminée naturelle
    for (let i = 0; i < 4; i++) {
      const ph = (T * 0.22 + i / 4) % 1;
      ctx.fillStyle = `rgba(120,112,104,${0.4 * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(46 + ph * 26 + Math.sin(ph * 6 + i) * 3, G - 116 - ph * 70, 5 + ph * 13, 0, TAU); ctx.fill();
    }

    // falaise à facettes
    const sil = [[-14, G], [-14, G - 92], [2, G - 108], [20, G - 120], [40, G - 116], [56, G - 102], [70, G - 84], [80, G - 58], [86, G - 30], [90, G]];
    const poly = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
    poly(sil, '#8d8172');
    poly([[-14, G - 92], [2, G - 108], [20, G - 120], [40, G - 116], [30, G - 100], [8, G - 90]], '#b7a996');
    poly([[40, G - 116], [56, G - 102], [70, G - 84], [52, G - 82], [30, G - 100]], '#a39584');
    poly([[70, G - 84], [80, G - 58], [86, G - 30], [90, G], [74, G], [68, G - 50], [52, G - 82]], '#6f6457');
    poly([[-14, G - 92], [8, G - 90], [14, G - 44], [-14, G - 22]], '#9c8f7e');
    poly([[-14, G - 22], [14, G - 44], [24, G], [-14, G]], '#7d7164');
    ctx.strokeStyle = 'rgba(43,29,20,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(8, G - 90); ctx.lineTo(30, G - 100); ctx.lineTo(52, G - 82); ctx.moveTo(8, G - 90); ctx.lineTo(14, G - 44);
    ctx.moveTo(58, G - 96); ctx.lineTo(62, G - 88); ctx.moveTo(-6, G - 60); ctx.lineTo(2, G - 54); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); sil.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.fillStyle = '#7f9550';                                                   // mousse
    ctx.beginPath(); ell(ctx, 6, G - 106, 7, 2.6, -0.5); ell(ctx, 28, G - 117.5, 8, 2.4, 0.1); ell(ctx, 62, G - 92, 5, 2, 0.8); ctx.fill();

    // peintures rupestres : une main, un mammouth, un chasseur
    ctx.strokeStyle = '#a8452a'; ctx.fillStyle = '#a8452a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(7, G - 74, 2.6, 0, TAU); ctx.fill();
    ctx.beginPath(); for (const [dx, dy] of [[-3, -5.5], [-1, -6.5], [1.2, -6.2], [3, -5], [4.2, -1.5]]) { ctx.moveTo(7, G - 74); ctx.lineTo(7 + dx, G - 74 + dy); } ctx.stroke();
    ctx.beginPath(); ctx.ellipse(8, G - 50, 6, 3.6, 0, Math.PI, 0); ctx.moveTo(3, G - 50); ctx.lineTo(3, G - 45); ctx.moveTo(6, G - 50); ctx.lineTo(6, G - 45);
    ctx.moveTo(10, G - 50); ctx.lineTo(10, G - 45); ctx.moveTo(14, G - 50); ctx.quadraticCurveTo(17, G - 47, 15, G - 44); ctx.stroke();
    ctx.strokeStyle = '#3a2a22'; ctx.fillStyle = '#3a2a22'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(8, G - 27); ctx.lineTo(8, G - 33); ctx.moveTo(8, G - 31.5); ctx.lineTo(11.5, G - 34.5); ctx.moveTo(8, G - 27); ctx.lineTo(6.4, G - 23.5); ctx.moveTo(8, G - 27); ctx.lineTo(9.6, G - 23.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, G - 34.6, 1.3, 0, TAU); ctx.fill();

    // entrée de la grotte, éclairée par le feu
    const mouth = () => { ctx.moveTo(30, G); ctx.lineTo(30, G - 30); ctx.bezierCurveTo(31, G - 60, 49, G - 66, 56, G - 62); ctx.bezierCurveTo(68, G - 58, 76, G - 46, 76, G - 28); ctx.lineTo(76, G); };
    const glow = ctx.createRadialGradient(53, G - 6, 3, 53, G - 6, 58 + fl * 3);
    glow.addColorStop(0, '#ffc45a'); glow.addColorStop(0.22, '#e0762a'); glow.addColorStop(0.55, '#5a2a14'); glow.addColorStop(1, '#170e0a');
    blob(ctx, glow, mouth, 2);
    ctx.fillStyle = ROCK_L; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (const [x, y, r, a] of [[29, G - 14, 4.2, 0.2], [29.5, G - 34, 4, -0.2], [35, G - 53, 4.4, 0.6], [48, G - 64.5, 4.6, 0.1], [63, G - 60.5, 4.2, -0.5], [73.5, G - 48, 4, 0.9], [77, G - 30, 4.2, 0.3], [77, G - 12, 4, -0.1]]) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.72, a, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // foyer
    limb(ctx, [45, G - 2, 60, G - 4], 2.4, WOOD_D); limb(ctx, [47, G - 5, 61, G - 1.5], 2.2, WOOD);
    for (const [x, hh, col] of [[50, 13, '#ff7a22'], [56, 16, '#ff9a3c'], [53, 9, '#ffe08a']]) {
      const h2 = hh + fl * 2.5 * (x % 2 ? 1 : -1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 4, G - 4); ctx.quadraticCurveTo(x - 4.5, G - 4 - h2 * 0.5, x + fl, G - 4 - h2); ctx.quadraticCurveTo(x + 4.5, G - 4 - h2 * 0.5, x + 4, G - 4); ctx.closePath(); ctx.fill();
    }
    // peau tendue au-dessus de l'entrée (couleur d'équipe)
    blob(ctx, team, () => {
      ctx.moveTo(35, G - 51); ctx.quadraticCurveTo(52, G - 68, 71, G - 50);
      ctx.lineTo(68.5, G - 40); ctx.lineTo(64, G - 46.5); ctx.lineTo(59.5, G - 39); ctx.lineTo(54.5, G - 46.5); ctx.lineTo(49.5, G - 39.5); ctx.lineTo(44.5, G - 46.5); ctx.lineTo(39.5, G - 40.5);
    });
    ctx.fillStyle = dark; for (const [x, y] of [[44, G - 53], [53, G - 56.5], [62, G - 53.5], [49, G - 48], [59, G - 48]]) { ctx.beginPath(); ctx.ellipse(x, y, 1.6, 1.1, 0.3, 0, TAU); ctx.fill(); }
    // défenses de mammouth qui encadrent l'entrée
    for (const [x0, cx, x1] of [[25, 17, 39], [81, 89, 67]]) {
      ctx.beginPath(); ctx.moveTo(x0, G); ctx.quadraticCurveTo(cx, G - 44, x1, G - 60);
      ctx.strokeStyle = INK; ctx.lineWidth = 6.6; ctx.stroke(); ctx.strokeStyle = IVORY; ctx.lineWidth = 4.4; ctx.stroke();
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x0 - 0.8, G - 6); ctx.quadraticCurveTo(cx - 0.4, G - 42, x1 - 1.4, G - 56); ctx.stroke();
    }

    // tour de guet : deux montants, une traverse par étage de tourelle, ligatures
    limb(ctx, [80, G, 82, G - 136], 3, WOOD); limb(ctx, [106, G, 104, G - 136], 3, WOOD_D);
    for (let s = 0; s < 4; s++) {
      const y = G - 23 - s * 30;
      limb(ctx, [80.5, y, 105.5, y], 2.2, WOOD);
      ctx.strokeStyle = '#e6d7b0'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(79, y - 2); ctx.lineTo(83.4, y + 2); ctx.moveTo(79, y + 2); ctx.lineTo(83.4, y - 2); ctx.moveTo(102.8, y - 2); ctx.lineTo(107.2, y + 2); ctx.moveTo(102.8, y + 2); ctx.lineTo(107.2, y - 2); ctx.stroke();
    }

    // bannière de peau au sommet, crâne en tête de mât
    const wv = Math.sin(T * 2.4 + side) * 2;
    // (le tout reste sous la barre de vie, dessinée à GROUND - hauteur - 44)
    const by = G - 122;
    limb(ctx, [16, G - 114, 16, by - 22], 2.2, WOOD);
    blob(ctx, team, () => {
      ctx.moveTo(16, by - 20); ctx.quadraticCurveTo(30, by - 23 + wv, 43, by - 17 + wv);
      ctx.lineTo(38.5, by - 12 + wv * 0.8); ctx.lineTo(43.5, by - 7 + wv * 0.6); ctx.lineTo(38, by - 2 + wv * 0.4); ctx.quadraticCurveTo(28, by + 2 + wv * 0.4, 16, by + 1);
    });
    ctx.strokeStyle = dark; ctx.lineWidth = 2;                                    // emblème : une griffure
    ctx.beginPath(); for (const dx of [0, 4.5, 9]) { ctx.moveTo(22 + dx, by - 15.5 + wv * 0.4); ctx.lineTo(24.5 + dx, by - 5 + wv * 0.4); } ctx.stroke();
    blob(ctx, IVORY, () => ctx.ellipse(16, by - 25.5, 3.6, 3.9, 0, 0, TAU), 1.1);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(17.4, by - 26, 1, 0, TAU); ctx.arc(14.6, by - 26, 0.9, 0, TAU); ctx.fill();

    // premier plan : rochers, os, herbes
    ctx.save(); ctx.translate(2, G - 5); stone(ctx, 8, ROCK, ROCK_L); ctx.restore();
    ctx.save(); ctx.translate(15, G - 3); ctx.rotate(0.6); stone(ctx, 4.6, ROCK_D, ROCK); ctx.restore();
    limb(ctx, [92, G - 2, 100, G - 3.5], 1.5, IVORY);
    ctx.strokeStyle = '#8a9a48'; ctx.lineWidth = 1.4;
    ctx.beginPath(); for (const x of [-8, 22, 88]) { ctx.moveTo(x, G); ctx.lineTo(x - 2.5, G - 7); ctx.moveTo(x + 1, G); ctx.lineTo(x + 1.5, G - 9); ctx.moveTo(x + 2, G); ctx.lineTo(x + 5, G - 6); } ctx.stroke();
  };

  // Lance-pierres : fourche dressée, lanières, poche de cuir tirée en arrière puis lâchée.
  Art.turrets['lance-pierres'] = function (ctx, a, team) {
    blob(ctx, ROCK_D, () => ctx.ellipse(-5.5, 6.5, 4.4, 2.8, 0, 0, TAU), 1);
    blob(ctx, ROCK, () => ctx.ellipse(5, 7, 3.8, 2.4, 0, 0, TAU), 1);
    limb(ctx, [0, 7, 0, -3], 3.4, WOOD);
    limb(ctx, [0, -3, -5, -9, -6, -16.5], 2.4, WOOD_D);
    limb(ctx, [0, -3, 6, -9, 7, -16.5], 2.4, WOOD);
    ctx.strokeStyle = team; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2.4, 1.5); ctx.lineTo(2.4, 1.5); ctx.stroke();
    ctx.strokeStyle = '#e6d7b0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-2.4, -2.6); ctx.lineTo(2.4, -4.2); ctx.moveTo(-2.4, -4.4); ctx.lineTo(2.4, -2.4); ctx.stroke();
    const px = -8 + a * 17, py = -11.5 - a * 2.5;
    ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-6, -16.5); ctx.lineTo(px, py); ctx.lineTo(7, -16.5); ctx.stroke();
    blob(ctx, '#7a5230', () => ctx.ellipse(px, py, 2.8, 2.1, 0, 0, TAU), 0.9);
    if (a < 0.4) blob(ctx, ROCK, () => ctx.arc(px, py - 0.9, 2.1, 0, TAU), 0.8);
  };

  // Lanceur de silex : tronc creux sur chevalet, panier d'éclats.
  Art.turrets.silex = function (ctx, a, team) {
    limb(ctx, [-8, 7, -1, -5], 2.4, WOOD_D); limb(ctx, [6, 7, -1, -5], 2.4, WOOD_D);
    blob(ctx, '#9a7a48', () => { ctx.moveTo(-15, 1); ctx.lineTo(-7.5, 1); ctx.lineTo(-8.5, 7.5); ctx.lineTo(-14, 7.5); }, 1);
    ctx.fillStyle = '#4a4640'; ctx.strokeStyle = INK; ctx.lineWidth = 0.7;
    for (const [x, r] of [[-13.5, -0.3], [-11.2, 0.1], [-9, 0.4]]) { ctx.save(); ctx.translate(x, 1.4); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-1.2, 0); ctx.lineTo(0, -4.4); ctx.lineTo(1.2, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(-a * 2.6, 0); ctx.rotate(-0.09);
    blob(ctx, WOOD, () => { ctx.moveTo(-11, -12.5); ctx.lineTo(11, -12.5); ctx.lineTo(11, -4); ctx.lineTo(-11, -4); ctx.quadraticCurveTo(-13.5, -8.2, -11, -12.5); });
    ctx.strokeStyle = WOOD_D; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -10); ctx.lineTo(-2, -10.4); ctx.moveTo(1, -6.4); ctx.lineTo(7, -6.2); ctx.moveTo(-6, -6.8); ctx.lineTo(-3, -6.6); ctx.stroke();
    ctx.strokeStyle = WOOD_L; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-9.5, -11.3); ctx.lineTo(8, -11.3); ctx.stroke();
    blob(ctx, team, () => { ctx.moveTo(-4.4, -13); ctx.lineTo(0.4, -13); ctx.lineTo(0.4, -3.5); ctx.lineTo(-4.4, -3.5); }, 1);
    blob(ctx, '#c9a66b', () => ctx.ellipse(11, -8.2, 2.6, 4.3, 0, 0, TAU), 1);
    ctx.fillStyle = '#24160e'; ctx.beginPath(); ctx.ellipse(11.3, -8.2, 1.5, 2.8, 0, 0, TAU); ctx.fill();
    ctx.restore();
    if (a > 0.35) {
      ctx.fillStyle = `rgba(255,236,170,${a})`;
      for (const [dx, dy] of [[0, 0], [4, -3], [5, 2.5]]) { ctx.beginPath(); ctx.moveTo(15 + dx + (1 - a) * 8, -9 + dy); ctx.lineTo(19 + dx + (1 - a) * 8, -8.2 + dy); ctx.lineTo(15 + dx + (1 - a) * 8, -7.2 + dy); ctx.closePath(); ctx.fill(); }
    }
  };

  // Catapulte à rochers : châssis de rondins, bras à cuiller de cuir, contrepoids de pierre.
  Art.turrets.catapulte = function (ctx, a, team) {
    limb(ctx, [-13, 4.5, 13, 4.5], 3.4, WOOD);
    for (const x of [-9, 9]) { blob(ctx, WOOD_D, () => ctx.arc(x, 7.2, 3.8, 0, TAU), 1.1); ctx.fillStyle = WOOD_L; ctx.beginPath(); ctx.arc(x, 7.2, 1.2, 0, TAU); ctx.fill(); }
    limb(ctx, [9, 4, 3, -13], 2.4, WOOD_D); limb(ctx, [-3, 4, 3, -13], 2.8, WOOD);
    ctx.strokeStyle = team; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-12, 1.6); ctx.lineTo(-5, 1.6); ctx.stroke();
    ctx.save(); ctx.translate(3, -12.5); ctx.rotate(-0.37 + a * 2.45);
    limb(ctx, [6.5, 0, -19, 0], 2.2, '#9a6a3a');
    blob(ctx, ROCK_D, () => ctx.ellipse(8, 1.2, 3.6, 4, 0, 0, TAU), 1);
    ctx.strokeStyle = '#e6d7b0'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(11, 3.4); ctx.moveTo(5, 3.4); ctx.lineTo(11, -1); ctx.stroke();
    blob(ctx, '#7a5230', () => { ctx.moveTo(-23.5, -0.6); ctx.quadraticCurveTo(-20, 5, -16.5, -0.6); }, 1);
    if (a < 0.3) { ctx.save(); ctx.translate(-20, -2.6); stone(ctx, 3.5, ROCK, ROCK_L); ctx.restore(); }
    ctx.restore();
    ctx.strokeStyle = '#e6d7b0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0.8, -14.5); ctx.lineTo(5.2, -10.5); ctx.moveTo(0.8, -10.5); ctx.lineTo(5.2, -14.5); ctx.stroke();
  };

  // --- projectiles (le contexte est déjà sauvegardé par l'appelant) -----------
  Art.projectiles.pebble = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(-1, -2.2); ctx.lineTo(-13, 0); ctx.lineTo(-1, 2.2); ctx.closePath(); ctx.fill();
    ctx.rotate(p.x * 0.08); stone(ctx, 3.3, ROCK, ROCK_L);
  };
  Art.projectiles.flint = function (ctx, p, dir) {
    ctx.translate(p.x, p.y); ctx.rotate(dir + p.x * 0.12);
    blob(ctx, '#3f3b36', () => { ctx.moveTo(5, 0); ctx.lineTo(-1, -2.8); ctx.lineTo(-4.5, 0); ctx.lineTo(-1, 2.8); }, 0.8);
    ctx.fillStyle = '#8a857c'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-1, -2.8); ctx.lineTo(-0.5, 0); ctx.closePath(); ctx.fill();
  };
  Art.projectiles.boulder = function (ctx, p) {
    ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.035);
    stone(ctx, 7.5, '#857a6c', ROCK_L);
    ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(1, -1); ctx.lineTo(3.6, 2); ctx.lineTo(2, 5); ctx.stroke();
  };
  Art.projectiles.fireball = function (ctx, p, dir) {
    const f = Math.sin(p.x * 0.3) * 1.2;
    ctx.translate(p.x, p.y); ctx.rotate(dir);
    ctx.fillStyle = 'rgba(255,150,50,0.28)'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7a22'; ctx.beginPath(); ctx.moveTo(6.5, 0); ctx.quadraticCurveTo(3, -7, -5, -5 + f); ctx.lineTo(-17 - f * 2, 0); ctx.lineTo(-5, 5 - f); ctx.quadraticCurveTo(3, 7, 6.5, 0); ctx.fill();
    ctx.fillStyle = '#ffc04a'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(2, -4, -3, -3); ctx.lineTo(-10 - f, 0); ctx.lineTo(-3, 3); ctx.quadraticCurveTo(2, 4, 5, 0); ctx.fill();
    ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.arc(1.5, 0, 2.3, 0, TAU); ctx.fill();
  };

  // Éboulement : gros rocher qui tourne en tombant, traînée de poussière.
  Art.drops.rock = function (ctx, d) {
    ctx.fillStyle = 'rgba(150,130,105,0.28)';
    ctx.beginPath(); ctx.moveTo(d.x - 9, d.y - 4); ctx.lineTo(d.x - 3, d.y - 58); ctx.lineTo(d.x + 3, d.y - 58); ctx.lineTo(d.x + 9, d.y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(d.x - 6, d.y - 40, 1.4, 22); ctx.fillRect(d.x + 4.5, d.y - 48, 1.4, 26);
    ctx.save(); ctx.translate(d.x, d.y - 3); ctx.rotate(d.y * 0.02 + d.x);
    stone(ctx, 11, '#8a7f70', ROCK_L);
    ctx.strokeStyle = 'rgba(43,29,20,0.5)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(1, -2); ctx.lineTo(5, 2.5); ctx.lineTo(3, 7); ctx.moveTo(-3, 3); ctx.lineTo(-6, 6); ctx.stroke();
    ctx.restore();
  };

  /* =======================================================================
     ÂGE DE PIERRE — décor (steppe glaciaire au petit matin)
     Les parties fixes sont peintes une fois dans deux calques ; nuages et oiseaux sont animés.
     ======================================================================= */
  function ridge(r, base, amp, stepMin, stepMax) {
    const pts = []; let x = -90, hi = false;
    while (x < W + 90) { pts.push([x, hi ? base - amp * (0.55 + 0.45 * r()) : base - amp * 0.14 * r()]); x += stepMin + (stepMax - stepMin) * r(); hi = !hi; }
    return pts;
  }
  function range(g, pts, base, color, shade, snow) {
    const bottom = base + 160;
    g.fillStyle = color; g.beginPath(); g.moveTo(pts[0][0], bottom); for (const [x, y] of pts) g.lineTo(x, y); g.lineTo(pts[pts.length - 1][0], bottom); g.closePath(); g.fill();
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [xl, yl] = pts[i - 1], [xr, yr] = pts[i + 1];
      if (y > yl || y > yr) continue;                                              // pas un sommet
      g.fillStyle = shade;                                                          // versant à l'ombre
      g.beginPath(); g.moveTo(x, y); g.lineTo(xr, yr); g.lineTo(xr, bottom); g.lineTo(x + (xr - x) * 0.3, bottom); g.closePath(); g.fill();
      if (!snow || base - y < 95) continue;
      const f = 0.36, L = [x + (xl - x) * f, y + (yl - y) * f], Rr = [x + (xr - x) * f, y + (yr - y) * f];
      const m = t => [Rr[0] + (L[0] - Rr[0]) * t, Rr[1] + (L[1] - Rr[1]) * t];
      g.fillStyle = '#f6f9fc';
      g.beginPath(); g.moveTo(x, y); g.lineTo(Rr[0], Rr[1]);
      [[0.22, 9], [0.42, -4], [0.62, 10], [0.82, -3]].forEach(([t, dy]) => { const q = m(t); g.lineTo(q[0], q[1] + dy); });
      g.lineTo(L[0], L[1]); g.closePath(); g.fill();
      g.fillStyle = 'rgba(120,150,195,0.4)';
      g.beginPath(); g.moveTo(x, y); g.lineTo(Rr[0], Rr[1]); const q1 = m(0.22), q2 = m(0.42); g.lineTo(q1[0], q1[1] + 9); g.lineTo(q2[0], q2[1] - 4); g.closePath(); g.fill();
    }
  }
  function butte(g, x, y0, w, hh) {
    const top = y0 - hh;
    g.fillStyle = '#c99862'; g.beginPath(); g.moveTo(x - 12, y0 + 10); g.lineTo(x + 12, top + 6); g.lineTo(x + 26, top); g.lineTo(x + w * 0.55, top + 3); g.lineTo(x + w - 22, top - 2); g.lineTo(x + w - 8, top + 8); g.lineTo(x + w + 14, y0 + 10); g.closePath(); g.fill();
    g.fillStyle = 'rgba(110,62,26,0.3)'; g.beginPath(); g.moveTo(x + w * 0.62, top + 2.4); g.lineTo(x + w - 22, top - 2); g.lineTo(x + w - 8, top + 8); g.lineTo(x + w + 14, y0 + 10); g.lineTo(x + w * 0.74, y0 + 10); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(110,62,26,0.28)'; g.lineWidth = 1.5;
    for (const k of [0.28, 0.52, 0.78]) { g.beginPath(); g.moveTo(x + 12 - 24 * k + 3, top + 6 + (hh + 4) * k); g.lineTo(x + w - 8 + 22 * k - 3, top + 8 + (hh + 2) * k); g.stroke(); }
    g.strokeStyle = '#efcc96'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 12, top + 6); g.lineTo(x + 26, top); g.lineTo(x + w * 0.55, top + 3); g.lineTo(x + w - 22, top - 2); g.stroke();
  }
  function menhir(g, x, y, w, h, lean) {
    g.save(); g.translate(x, y); g.rotate(lean);
    g.fillStyle = 'rgba(70,45,20,0.22)'; g.beginPath(); g.ellipse(5, 1.5, w, 2.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#93806e'; g.beginPath(); g.moveTo(-w / 2, 2); g.lineTo(-w / 2 + 1, -h * 0.8); g.quadraticCurveTo(0, -h - 3, w / 2 - 1, -h * 0.82); g.lineTo(w / 2, 2); g.closePath(); g.fill();
    g.fillStyle = 'rgba(50,35,25,0.3)'; g.beginPath(); g.moveTo(w * 0.1, 2); g.lineTo(w * 0.14, -h * 0.9); g.quadraticCurveTo(w * 0.4, -h * 0.92, w / 2 - 1, -h * 0.82); g.lineTo(w / 2, 2); g.closePath(); g.fill();
    g.restore();
  }
  function pine(g, x, y, s) {
    g.fillStyle = '#5a4030'; g.fillRect(x - 1.5 * s, y - 8 * s, 3 * s, 10 * s);
    for (let i = 0; i < 3; i++) {
      const yy = y - 6 * s - i * 9 * s, ww = (11 - i * 2.6) * s;
      g.fillStyle = '#688546'; g.beginPath(); g.moveTo(x - ww, yy); g.lineTo(x, yy - 15 * s); g.lineTo(x + ww, yy); g.closePath(); g.fill();
      g.fillStyle = 'rgba(28,48,24,0.32)'; g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy - 15 * s); g.lineTo(x + ww, yy); g.closePath(); g.fill();
    }
  }

  // ---- calque du fond : ciel, soleil, deux chaînes de montagnes, brume
  function pierreBack(g, r) {
    let gr = g.createLinearGradient(0, -40, 0, GROUND);
    gr.addColorStop(0, '#3f86b9'); gr.addColorStop(0.42, '#8fc0d6'); gr.addColorStop(0.74, '#f3d9a8'); gr.addColorStop(1, '#fbe8c2');
    g.fillStyle = gr; g.fillRect(-40, -40, W + 80, GROUND + 40);
    const sx = 1010, sy = 205;
    gr = g.createRadialGradient(sx, sy, 20, sx, sy, 340);
    gr.addColorStop(0, 'rgba(255,246,206,0.9)'); gr.addColorStop(0.22, 'rgba(255,234,172,0.38)'); gr.addColorStop(1, 'rgba(255,234,172,0)');
    g.fillStyle = gr; g.fillRect(-40, -40, W + 80, GROUND + 40);
    g.fillStyle = '#fff8dc'; g.beginPath(); g.arc(sx, sy, 42, 0, TAU); g.fill();
    range(g, ridge(r, 474, 205, 62, 120), 474, '#a9bdd4', 'rgba(70,95,140,0.2)', true);
    range(g, ridge(r, 506, 118, 48, 96), 506, '#a096ae', 'rgba(60,48,90,0.2)', false);
    gr = g.createLinearGradient(0, 372, 0, 536);
    gr.addColorStop(0, 'rgba(252,232,198,0)'); gr.addColorStop(1, 'rgba(252,232,198,0.9)');
    g.fillStyle = gr; g.fillRect(-40, 372, W + 80, 250);
  }

  // ---- calque de devant : collines, buttes, pierres levées, sapins, sol
  function pierreFront(f, r) {
    let gr;
    const h1 = x => 508 - Math.sin(x * 0.0042 + 0.8) * 24 - Math.sin(x * 0.011 + 2.1) * 8;
    const h2 = x => 566 - Math.sin(x * 0.006 + 4.2) * 16 - Math.sin(x * 0.017 + 1) * 6;
    const hill = (fn, dy, style) => { f.fillStyle = style; f.beginPath(); f.moveTo(-40, GROUND + 4); for (let x = -40; x <= W + 40; x += 12) f.lineTo(x, fn(x) + dy); f.lineTo(W + 40, GROUND + 4); f.closePath(); f.fill(); };
    gr = f.createLinearGradient(0, 474, 0, GROUND); gr.addColorStop(0, '#dfba84'); gr.addColorStop(1, '#c79a64');
    hill(h1, 0, gr);
    butte(f, 180, h1(265), 172, 76); butte(f, 905, h1(965), 122, 56);
    for (const [x, s] of [[62, 1.2], [96, 0.9], [118, 1.05], [452, 0.95], [480, 1.25], [1048, 1.1], [1196, 1.3], [1228, 0.95], [800, 0.8]]) pine(f, x, h1(x) + 3, s);
    // alignement de pierres levées et dolmen
    for (const [x, w, hh, lean] of [[560, 9, 26, -0.05], [578, 11, 38, 0.04], [598, 9, 30, -0.02], [616, 12, 44, 0.03], [637, 9, 27, 0.07], [654, 8, 20, -0.06]]) menhir(f, x, h1(x) + 4, w, hh, lean);
    const dy = h1(712) + 4;
    menhir(f, 698, dy, 8, 20, 0); menhir(f, 728, dy + 1, 8, 20, 0);
    f.fillStyle = '#93806e'; f.beginPath(); f.moveTo(688, dy - 18); f.lineTo(694, dy - 25); f.lineTo(734, dy - 26); f.lineTo(740, dy - 19); f.closePath(); f.fill();
    f.fillStyle = 'rgba(50,35,25,0.3)'; f.beginPath(); f.moveTo(690, dy - 19.5); f.lineTo(738, dy - 20.5); f.lineTo(740, dy - 19); f.lineTo(688, dy - 18); f.closePath(); f.fill();
    // collines proches, liseré d'herbe, buissons
    hill(h2, 0, '#a9ae5e');
    gr = f.createLinearGradient(0, 548, 0, GROUND); gr.addColorStop(0, '#bd8f58'); gr.addColorStop(1, '#a67843');
    hill(h2, 5, gr);
    for (const x of [150, 372, 640, 846, 1105]) {
      const y = h2(x) + 3;
      f.fillStyle = '#6f8a4a'; f.beginPath(); ell(f, x, y, 13, 8); ell(f, x + 13, y + 2, 10, 6.5); ell(f, x - 12, y + 3, 9, 6); f.fill();
      f.fillStyle = '#8fa85a'; f.beginPath(); ell(f, x - 2, y - 3, 8, 3.6); ell(f, x + 12, y - 1, 5.5, 2.6); f.fill();
    }
    // sol
    gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#ab8450'); gr.addColorStop(1, '#75552e');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    f.strokeStyle = 'rgba(70,45,20,0.2)'; f.lineWidth = 1.4;
    for (let i = 0; i < 34; i++) { const x = r() * W, y = GROUND + 22 + r() * 82, w = 14 + r() * 30; f.beginPath(); f.moveTo(x, y); f.quadraticCurveTo(x + w / 2, y + 3 * (r() - 0.5), x + w, y + 1); f.stroke(); }
    for (let i = 0; i < 46; i++) {                                                   // cailloux
      const x = r() * W, y = GROUND + 18 + r() * 86, s = 2.4 + r() * 4.2;
      f.fillStyle = 'rgba(50,32,14,0.25)'; f.beginPath(); f.ellipse(x + 1.5, y + s * 0.5, s * 1.1, s * 0.36, 0, 0, TAU); f.fill();
      f.fillStyle = r() < 0.5 ? '#8f8478' : '#a09482'; f.beginPath(); f.ellipse(x, y, s, s * 0.62, 0, 0, TAU); f.fill();
      f.fillStyle = 'rgba(255,255,255,0.3)'; f.beginPath(); f.ellipse(x - s * 0.25, y - s * 0.2, s * 0.5, s * 0.22, 0, 0, TAU); f.fill();
    }
    f.lineCap = 'round';
    for (let i = 0; i < 5; i++) {                                                     // os
      const x = 80 + r() * (W - 160), y = GROUND + 30 + r() * 66, a = (r() - 0.5) * 1.2;
      f.save(); f.translate(x, y); f.rotate(a);
      f.strokeStyle = '#e9dfc6'; f.lineWidth = 2.4; f.beginPath(); f.moveTo(-7, 0); f.lineTo(7, 0); f.stroke();
      f.fillStyle = '#e9dfc6'; f.beginPath(); ell(f, -7.5, -1.4, 1.8, 1.8); ell(f, -7.5, 1.4, 1.8, 1.8); ell(f, 7.5, -1.4, 1.8, 1.8); ell(f, 7.5, 1.4, 1.8, 1.8); f.fill();
      f.restore();
    }
    for (let i = 0; i < 30; i++) {                                                    // touffes sèches
      const x = r() * W, y = GROUND + 16 + r() * 88;
      f.strokeStyle = r() < 0.5 ? '#c6a85e' : '#9aa552'; f.lineWidth = 1.5;
      f.beginPath(); f.moveTo(x, y); f.lineTo(x - 4, y - 8); f.moveTo(x + 1, y); f.lineTo(x + 1, y - 11); f.moveTo(x + 2, y); f.lineTo(x + 6, y - 7); f.stroke();
    }
    // bande d'herbe au bord du champ de bataille
    f.fillStyle = '#9aa552'; f.fillRect(-40, GROUND, W + 80, 7);
    f.beginPath(); for (let x = -40; x < W + 40; x += 9) { f.moveTo(x, GROUND + 6.5); f.lineTo(x + 4.5, GROUND + 10 + r() * 5); f.lineTo(x + 9, GROUND + 6.5); } f.fill();
    f.fillStyle = '#b3bd66'; f.fillRect(-40, GROUND, W + 80, 2);
    f.strokeStyle = '#87963f'; f.lineWidth = 1.4;
    f.beginPath(); for (let i = 0; i < 150; i++) { const x = r() * (W + 60) - 30, hh = 3 + r() * 5; f.moveTo(x, GROUND + 1); f.lineTo(x + (r() - 0.5) * 4, GROUND - hh); } f.stroke();
  }

  /* =======================================================================
     BOÎTE À OUTILS commune aux autres âges (js/art/*.js) : PA.Art.kit
     ======================================================================= */

  // Assombrit (f < 1) ou éclaircit (f > 1) une couleur #rrggbb.
  function dk(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * f)));
    return '#' + ((1 << 24) | (c(n >> 16) << 16) | (c((n >> 8) & 255) << 8) | c(n & 255)).toString(16).slice(1);
  }
  // Polygone [x, y, x, y…] : rempli, et cerné si lw est donné.
  function poly(ctx, pts, fill, lw) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function line(ctx, pts, color, w) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = color; ctx.lineWidth = w || 1; ctx.stroke();
  }
  function rect(ctx, x, y, w, h, fill, lw) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); if (lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.strokeRect(x, y, w, h); } }
  function disc(ctx, x, y, r, fill, lw) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke(); } }
  function oval(ctx, x, y, rx, ry, fill, lw, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.strokeStyle = INK; ctx.lineWidth = lw; ctx.stroke(); } }

  // --- personnage générique ----------------------------------------------------
  // Repères passés aux fonctions de l'appelant (objet A) : tête (hx, hy), épaule (sx, sy), k = carrure,
  // ty = sautillement, sw = balancement de la marche, atk, team, dark, u, R, T.
  // o : k, skin, body (couleur du torse), legs, boots, sleeve, skirt (+ skirtLen), belt,
  //     back(ctx, A), over(ctx, A), hairBack(ctx, A), head(ctx, A), arm(ctx, A), face (false = visage caché), crown
  function face(ctx, A, o) {
    const { hx, hy, atk } = A;
    disc(ctx, hx + 2.9, hy - 0.6, 0.95, INK);
    if (o.brow !== false) line(ctx, [hx + 1.2, hy - 2.9, hx + 4.7, hy - 1.9], INK, 1.3);
    disc(ctx, hx + 5.9, hy + 0.9, 1.5, o.headColor || A.skin, 1);
    if (atk > 0.4) oval(ctx, hx + 3.3, hy + 3.3, 1.6, 1.25, '#5a1e14');
    else line(ctx, [hx + 2, hy + 3.3, hx + 4.4, hy + 3.1], INK, 1);
  }
  function figure(ctx, u, team, dark, atk, o, R) {
    const T = now(), mv = u.moving;
    const sw = mv ? Math.sin(u.walk) : 0;
    const bob = mv ? Math.abs(Math.cos(u.walk)) * 1.3 : Math.sin(T * 2.2 + u.x * 0.05) * 0.5;
    const k = o.k || 1, ty = -bob, skin = o.skin || SKIN, skinD = o.skin ? dk(o.skin, 0.84) : SKIN_D;
    const A = { u, R, T, k, ty, sw, atk, team, dark, skin, hx: 2 * k, hy: -39.5 + ty, sx: 3.5 * k, sy: -30.5 + ty };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.back) o.back(ctx, A);
    limb(ctx, [-2 * k, -30 + ty, -4 * k - sw * 2, -24 + ty, -3 * k - sw * 5, -19 + ty], 3 * k, o.sleeve ? dk(o.sleeve, 0.8) : skinD);
    const legs = o.legs || skin, legsD = o.legs ? dk(o.legs, 0.8) : skinD;
    const leg = (dir, col) => {
      const fx = dir * sw * 6 + dir, lift = mv ? Math.max(0, dir * Math.cos(u.walk)) * 2.4 : 0;
      const kx = fx * 0.5 + 2.2, ky = -9 + ty * 0.5 - lift * 0.5;
      limb(ctx, [dir * 1.2 * k, -17 + ty, kx, ky, fx, -2 - lift, fx + 3, -2 - lift], 3.6 * k, col);
      if (o.boots) limb(ctx, [(kx + fx) / 2, (ky - 2 - lift) / 2, fx, -2 - lift, fx + 3.2, -2 - lift], 3.8 * k, dir < 0 ? dk(o.boots, 0.8) : o.boots);
    };
    leg(-1, legsD); leg(1, legs);
    blob(ctx, o.body || team, () => { ctx.moveTo(-5.5 * k, -31 + ty); ctx.quadraticCurveTo(0, -34.5 + ty, 6 * k, -31.5 + ty); ctx.lineTo(6.4 * k, -17 + ty); ctx.lineTo(-5.8 * k, -16.5 + ty); });
    if (o.skirt) {
      const y = -19 + ty + (o.skirtLen || 7);
      blob(ctx, o.skirt, () => { ctx.moveTo(-5.8 * k, -19.5 + ty); ctx.lineTo(6.5 * k, -20 + ty); ctx.lineTo(7.4 * k, y); ctx.lineTo(-6.6 * k - sw, y + 0.5); });
    }
    if (o.over) o.over(ctx, A);
    if (o.belt) line(ctx, [-5.6 * k, -19 + ty, 6.4 * k, -19.6 + ty], o.belt, 1.8);
    if (o.hairBack) o.hairBack(ctx, A);
    disc(ctx, A.hx, A.hy, 5.8, o.headColor || skin, 1.4);
    if (o.face !== false) face(ctx, A, o);
    if (o.head) o.head(ctx, A);
    if (o.crown) R.crown(ctx, A.hx, A.hy - (o.crownUp || 8.5));
    if (o.arm) o.arm(ctx, A);
  }
  // cheveux courts ; tignasse en bataille
  function hairShort(ctx, A, color) {
    const { hx, hy } = A;
    blob(ctx, color, () => { ctx.moveTo(hx - 5.9, hy + 1.6); ctx.arc(hx, hy, 6.1, Math.PI * 0.92, Math.PI * 1.74); ctx.lineTo(hx + 1.4, hy - 3.2); ctx.lineTo(hx - 3, hy - 1.6); ctx.lineTo(hx - 3.8, hy + 1.8); }, 1.1);
  }
  function hairWild(ctx, A, color) {
    const { hx, hy } = A;
    blob(ctx, color, () => {
      ctx.moveTo(hx - 5.9, hy + 2.4); ctx.arc(hx, hy, 6.2, Math.PI * 0.88, Math.PI * 1.72);
      ctx.lineTo(hx + 2.4, hy - 3.3); ctx.lineTo(hx + 0.3, hy - 2.1); ctx.lineTo(hx - 1.4, hy - 3.7); ctx.lineTo(hx - 3.2, hy - 0.8); ctx.lineTo(hx - 3.8, hy + 2.6);
    }, 1.1);
  }
  // casque en dôme. o : neck (descente sur la nuque), brim (longueur de la visière), shine (false = mat)
  function helm(ctx, A, color, o) {
    o = o || {}; const { hx, hy } = A, nk = o.neck == null ? 1 : o.neck;
    blob(ctx, color, () => { ctx.moveTo(hx - 6.3, hy + nk); ctx.arc(hx, hy - 0.6, 6.5, Math.PI * 0.98, Math.PI * 1.9); ctx.lineTo(hx + 5.4, hy - 2.2); ctx.lineTo(hx - 3.6, hy - 2); ctx.lineTo(hx - 3.8, hy + nk); }, 1.2);
    if (o.shine !== false) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(hx, hy - 0.6, 4.7, Math.PI * 1.12, Math.PI * 1.45); ctx.stroke(); }
    if (o.brim) limb(ctx, [hx - 7.4, hy - 1.6, hx + o.brim, hy - 2.4], 1.4, dk(color, 0.82));
  }
  // bras de devant, de l'épaule à la main ; poing
  function arm(ctx, A, hx, hy, sleeve, bend) {
    limb(ctx, [A.sx, A.sy, (A.sx + hx) / 2 + (bend == null ? -1 : bend), (A.sy + hy) / 2 + 2.6, hx, hy], 3, sleeve || A.skin);
  }
  function fist(ctx, A, hx, hy, color) { disc(ctx, hx, hy, 2, color || A.skin, 1); }
  // Coup de taille en trois temps (repos, armé, frappe). draw(ctx) dessine l'arme le long de -y, poignée en (0, 0).
  // o : rest / back / hit = [angle, dx, dy] depuis l'épaule, sleeve, glove, scale
  function swing(ctx, A, draw, o) {
    o = o || {};
    const pr = A.u.attackAnim > 0 ? 1 - A.u.attackAnim / 0.25 : -1;
    const rest = o.rest || [0.75, 5, 6], back = o.back || [-1.0, 0.5, -5], hit = o.hit || [1.95, 9.5, 3];
    let v = rest;
    if (pr >= 0) { const mix = (p, q, t) => p.map((n, i) => n + (q[i] - n) * t); v = pr < 0.3 ? mix(rest, back, pr / 0.3) : pr < 0.6 ? mix(back, hit, (pr - 0.3) / 0.3) : mix(hit, rest, (pr - 0.6) / 0.4); }
    const hx = A.sx + v[1], hy = A.sy + v[2];
    arm(ctx, A, hx, hy, o.sleeve);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(v[0]); if (o.scale) ctx.scale(o.scale, o.scale); draw(ctx, pr); ctx.restore();
    fist(ctx, A, hx, hy, o.glove);
  }
  // Estoc : la main part en avant. draw(ctx, atk) dessine l'arme le long de +x.
  function thrust(ctx, A, draw, o) {
    o = o || {};
    const hx = A.sx + (o.x == null ? 4 : o.x) + A.atk * (o.reach == null ? 8 : o.reach), hy = A.sy + (o.y == null ? 5 : o.y);
    arm(ctx, A, hx, hy, o.sleeve);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.rot || 0); draw(ctx, A.atk); ctx.restore();
    fist(ctx, A, hx, hy, o.glove);
  }
  // Arme d'épaule tenue à l'horizontale, recul au tir. draw(ctx, atk) dessine l'arme le long de +x, poignée en (0, 0).
  function aim(ctx, A, draw, o) {
    o = o || {};
    const hx = A.sx + (o.x == null ? 4 : o.x) - A.atk * (o.kick == null ? 2.5 : o.kick), hy = A.sy + (o.y == null ? 4 : o.y);
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(o.rot || 0); draw(ctx, A.atk); ctx.restore();
    arm(ctx, A, hx, hy, o.sleeve, 2);
    fist(ctx, A, hx, hy, o.glove);
  }

  // --- petits effets -------------------------------------------------------------
  function muzzle(ctx, x, y, a, color) {
    if (a < 0.45) return;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = Math.min(1, a * 1.2);
    ctx.fillStyle = color || '#ffd66e'; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? 2 : 4 + a * 4, an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * r * (i % 4 === 0 ? 1.6 : 1), Math.sin(an) * r); }
    ctx.closePath(); ctx.fill(); disc(ctx, 0, 0, 1.6 + a, '#fff8dc'); ctx.restore();
  }
  function wheel(ctx, x, y, r, spin, rim, fill, n) {
    rim = rim || '#3a2a1a'; n = n || 3;
    disc(ctx, x, y, r, rim, 1.2); disc(ctx, x, y, r * 0.72, fill || '#8a6a44');
    ctx.strokeStyle = rim; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = spin + i * Math.PI / n; ctx.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72); ctx.lineTo(x - Math.cos(a) * r * 0.72, y - Math.sin(a) * r * 0.72); }
    ctx.stroke(); disc(ctx, x, y, r * 0.2, rim);
  }
  // colonne de fumée ou de vapeur. o : n, speed, rise, drift, r0, r1, rgb, a, seed
  function puffs(ctx, x, y, o) {
    o = o || {}; const T = now(), n = o.n || 4;
    for (let i = 0; i < n; i++) {
      const ph = (T * (o.speed || 0.3) + i / n + (o.seed || 0)) % 1;
      ctx.fillStyle = `rgba(${o.rgb || '110,104,98'},${(o.a || 0.45) * (1 - ph)})`;
      ctx.beginPath(); ctx.arc(x + ph * (o.drift || 0) + Math.sin(ph * 6 + i) * 2, y - ph * (o.rise || 50), (o.r0 || 4) + ph * (o.r1 || 10), 0, TAU); ctx.fill();
    }
  }
  function flame(ctx, x, y, h, w, seed) {
    const T = now(), s0 = seed || 0, f = Math.sin(T * 11 + s0) * 0.5 + Math.sin(T * 17.3 + s0 * 2) * 0.5;
    [['#ff7a22', 1, -0.22], ['#ff9a3c', 0.8, 0.28], ['#ffe08a', 0.5, 0]].forEach(([c, s, dx], i) => {
      const hh = h * s * (1 + f * 0.14 * (i ? -1 : 1)), ww = w * s, cx = x + dx * w;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(cx - ww / 2, y); ctx.quadraticCurveTo(cx - ww * 0.55, y - hh * 0.5, cx + f * w * 0.12, y - hh); ctx.quadraticCurveTo(cx + ww * 0.55, y - hh * 0.5, cx + ww / 2, y); ctx.closePath(); ctx.fill();
    });
  }
  // halo lumineux
  function halo(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a == null ? 0.6 : a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  // --- décors ----------------------------------------------------------------------
  // Un décor = deux calques fixes peints une fois (fond puis devant, même hasard r), et ce qui bouge
  // entre les deux (mid) ou par-dessus (after). Un seul décor est gardé en mémoire à la fois.
  let cache = null;
  function layer(dpr, paint, r) {
    const cv = document.createElement('canvas');
    cv.width = Math.ceil((W + 80) * dpr); cv.height = Math.ceil((H + 80) * dpr);
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 40 * dpr, 40 * dpr); g.lineCap = 'round'; g.lineJoin = 'round';
    paint(g, r); return cv;
  }
  function backdrop(key, seed, back, front, mid, after) {
    return function (ctx, t, dt, R) {
      if (!cache || cache.key !== key || cache.dpr !== R.dpr) {
        const r = rng(seed); cache = { key, dpr: R.dpr };
        cache.back = layer(R.dpr, back, r); cache.front = layer(R.dpr, front, r);
      }
      ctx.drawImage(cache.back, -40, -40, W + 80, H + 80);
      if (mid) mid(ctx, t, dt, R);
      ctx.drawImage(cache.front, -40, -40, W + 80, H + 80);
      if (after) after(ctx, t, dt, R);
    };
  }
  // ciel en dégradé : [[position 0…1, couleur], …] du haut de l'écran jusqu'au sol
  function sky(g, stops) {
    const gr = g.createLinearGradient(0, -40, 0, GROUND); stops.forEach(([p, c]) => gr.addColorStop(p, c));
    g.fillStyle = gr; g.fillRect(-40, -40, W + 80, GROUND + 44);
  }
  function hills(g, fn, dy, style, bottom) {
    g.fillStyle = style; g.beginPath(); g.moveTo(-40, bottom || GROUND + 4);
    for (let x = -40; x <= W + 40; x += 12) g.lineTo(x, fn(x) + dy);
    g.lineTo(W + 40, bottom || GROUND + 4); g.closePath(); g.fill();
  }
  function starfield(g, r, n, yMax, rgb) {
    for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${rgb || '225,232,255'},${0.3 + r() * 0.6})`; g.beginPath(); g.arc(r() * W, r() * yMax, 0.5 + r() * 1.3, 0, TAU); g.fill(); }
  }
  function cloud(ctx, x, y, s, under, top) {
    ctx.fillStyle = under || 'rgba(238,214,184,0.8)';
    ctx.beginPath(); ell(ctx, x, y + 6 * s, 58 * s, 12 * s); ctx.fill();
    ctx.fillStyle = top || 'rgba(255,255,255,0.93)';
    ctx.beginPath(); ell(ctx, x - 28 * s, y, 26 * s, 14 * s); ell(ctx, x + 2 * s, y - 9 * s, 31 * s, 20 * s); ell(ctx, x + 31 * s, y - 1 * s, 24 * s, 13 * s); ctx.fill();
  }
  function clouds(ctx, R, dt, under, top) {
    for (const c of R.clouds) { c.x += c.v * (dt || 0); if (c.x > W + 140) c.x = -140; cloud(ctx, c.x, c.y, c.s, under, top); }
  }
  // vol d'oiseaux (ou d'autre chose : draw(ctx, x, y, s, battement))
  const flocks = {};
  function flock(ctx, t, dt, key, color, n, draw) {
    let list = flocks[key];
    if (!list) { const r = rng(key.length * 977 + 13); list = flocks[key] = []; for (let i = 0; i < (n || 5); i++) list.push({ x: r() * W, y: 100 + r() * 160, v: 16 + r() * 14, ph: r() * 6, s: 0.8 + r() * 0.5 }); }
    ctx.strokeStyle = color || '#4a3a34'; ctx.fillStyle = color || '#4a3a34'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    for (const b of list) {
      b.x += b.v * (dt || 0); if (b.x > W + 40) b.x = -40;
      const fl = Math.sin(t * 7 + b.ph), y = b.y + Math.sin(t * 0.8 + b.ph) * 6;
      if (draw) { draw(ctx, b.x, y, b.s, fl); continue; }
      ctx.beginPath(); ctx.moveTo(b.x - 7 * b.s, y - fl * 4 * b.s); ctx.quadraticCurveTo(b.x - 3 * b.s, y - 2, b.x, y); ctx.quadraticCurveTo(b.x + 3 * b.s, y - 2, b.x + 7 * b.s, y - fl * 4 * b.s); ctx.stroke();
    }
  }
  // Sol naturel : dégradé, sillons, cailloux, touffes, bande au bord du champ de bataille.
  // o : top, bottom, crack, pebbles [2 couleurs], nPebbles, tufts [2 couleurs], band, bandLight, blade
  function soil(g, r, o) {
    const gr = g.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, o.top); gr.addColorStop(1, o.bottom);
    g.fillStyle = gr; g.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    g.strokeStyle = o.crack || 'rgba(0,0,0,0.16)'; g.lineWidth = 1.4;
    for (let i = 0; i < 34; i++) { const x = r() * W, y = GROUND + 22 + r() * 82, w = 14 + r() * 30; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y + 3 * (r() - 0.5), x + w, y + 1); g.stroke(); }
    const peb = o.pebbles || ['#8f8478', '#a09482'];
    for (let i = 0; i < (o.nPebbles == null ? 40 : o.nPebbles); i++) {
      const x = r() * W, y = GROUND + 18 + r() * 86, s = 2.4 + r() * 4.2;
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x + 1.5, y + s * 0.5, s * 1.1, s * 0.36, 0, 0, TAU); g.fill();
      g.fillStyle = peb[r() < 0.5 ? 0 : 1]; g.beginPath(); g.ellipse(x, y, s, s * 0.62, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(x - s * 0.25, y - s * 0.2, s * 0.5, s * 0.22, 0, 0, TAU); g.fill();
    }
    if (o.tufts) for (let i = 0; i < 30; i++) {
      const x = r() * W, y = GROUND + 16 + r() * 88;
      g.strokeStyle = o.tufts[r() < 0.5 ? 0 : 1]; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y - 8); g.moveTo(x + 1, y); g.lineTo(x + 1, y - 11); g.moveTo(x + 2, y); g.lineTo(x + 6, y - 7); g.stroke();
    }
    if (o.band) {
      g.fillStyle = o.band; g.fillRect(-40, GROUND, W + 80, 7);
      g.beginPath(); for (let x = -40; x < W + 40; x += 9) { g.moveTo(x, GROUND + 6.5); g.lineTo(x + 4.5, GROUND + 10 + r() * 5); g.lineTo(x + 9, GROUND + 6.5); } g.fill();
      g.fillStyle = o.bandLight || dk(o.band, 1.15); g.fillRect(-40, GROUND, W + 80, 2);
      if (o.blade) { g.strokeStyle = o.blade; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 150; i++) { const x = r() * (W + 60) - 30, hh = 3 + r() * 5; g.moveTo(x, GROUND + 1); g.lineTo(x + (r() - 0.5) * 4, GROUND - hh); } g.stroke(); }
    }
  }

  Art.backdrops.pierre = backdrop('pierre', 20261110, pierreBack, pierreFront, (ctx, t, dt, R) => {
    clouds(ctx, R, dt);
    flock(ctx, t, dt, 'pierre');
  });

  Art.fx = {};      // effets des pouvoirs qui ne sont pas des « drops » : fx.airship(ctx, s), fx.sweep(ctx, s)
  Art.kit = { W, H, GROUND, TAU, INK, SKIN, SKIN_D, WOOD, WOOD_D, WOOD_L, ROCK, ROCK_D, ROCK_L, IVORY,
    rng, now, blob, limb, ell, stone, dk, poly, line, rect, disc, oval,
    figure, face, hairShort, hairWild, helm, arm, fist, swing, thrust, aim, caveman,
    muzzle, wheel, puffs, flame, halo,
    backdrop, sky, hills, starfield, cloud, clouds, flock, soil, ridge, range, pine };
  PA.Art = Art;
})();

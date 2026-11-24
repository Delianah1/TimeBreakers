/* =========================================================================
   DÉCORS DESSINÉS : fond, base et avalanche en images (Gemini) à la place des dessins en code.
   Âge médiéval pour commencer (21 novembre). Tant qu'une image n'est pas chargée, le jeu garde
   le dessin en code de js/art/*.js.

   Fond : images/decors/<âge>-fond.webp, 1360 px de large (l'écran + 40 px de marge de chaque côté
   pour les secousses). Calage : la rangée PIEDS de l'image (le milieu bas de la piste) tombe sur le sol du jeu.
   Avalanche (âge de glace caché, qui remplace le médiéval) : 5 images du même paysage, de plus en plus
   enneigé ; on passe de l'une à l'autre en fondu au fil des stades (js/ages-caches.js) :
     stade 1 → stade1, stade 2 → stade2, stade 3 → stade3, vague → vague puis arrivee, arrivée → arrivee.
   La couche de neige aux pieds des troupes (Art.phenDevant.glace) reste dessinée en code.
   Base : le château en 3 états (intact, abîmé, presque détruit) selon les PV de la base.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, A = PA.Art;
  if (!A) return;
  const W = C.world.width, GROUND = C.world.groundY;
  const LARGE = W + 80, PIEDS = 642.6;   // rangée des pieds dans les images à 1360 px de large

  const images = {};
  function image(nom) {
    let e = images[nom];
    if (!e) {
      e = images[nom] = { img: new Image(), pret: false };
      e.img.onload = () => { e.pret = true; };
      e.img.src = 'images/decors/' + nom + '.webp';
    }
    return e.pret ? e.img : null;
  }
  // Une image de décor, calée sur le sol ; les bords hors image (marges de secousse) sont étirés.
  function peindre(ctx, im, alpha, pieds) {
    const h = im.height * LARGE / im.width, y0 = GROUND - (pieds || PIEDS) * LARGE / im.width;
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(im, -40, y0, LARGE, h);
    if (y0 > -40) ctx.drawImage(im, 0, 0, im.width, 2, -40, -40, LARGE, y0 + 40 + 1);
    const bas = y0 + h, sy = im.height - 2;
    if (bas < C.world.height + 40) ctx.drawImage(im, 0, sy, im.width, 2, -40, bas - 1, LARGE, C.world.height + 41 - bas);
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ fond médiéval
  image('medieval-fond');
  const fond0 = A.backdrops.medieval;
  A.backdrops.medieval = function (ctx, t, dt, R) {
    const im = image('medieval-fond');
    if (!im) return fond0(ctx, t, dt, R);
    peindre(ctx, im, 1);
    ble(ctx, t);
    moulin(ctx, t);
    ciel(ctx, t, dt || 0);
  };

  // ------------------------------------------------------------ autres fonds (24 novembre)
  // Préparés par outils/decoupe-fonds.js : 1360 px de large, la piste (PIEDS) à la rangée 650.
  // Par-dessus l'image, un peu de vie dessinée en code : fumée, oiseaux.
  const Kit = A.kit;
  const CRATERE = [166, 92, 235];   // cratère du volcan du fond jurassique à l'écran, et le bas de ses coulées
  const FONDS = {
    jurassique: { pieds: 650, vie(ctx, t, dt) {
      Kit.puffs(ctx, CRATERE[0], CRATERE[1] + 6, { n: 6, speed: 0.07, rise: 130, drift: 120, r0: 12, r1: 40, rgb: '110,96,100', a: 0.45 });
      Kit.flock(ctx, t, dt, 'jurassique-img', '#5a3a3a', 3);
    } },
    magma: { pieds: 650, vie(ctx, t) {
      // la lave du fond palpite doucement
      ctx.fillStyle = `rgba(255,90,30,${0.05 + 0.04 * Math.sin(t * 1.6)})`; ctx.fillRect(-40, 300, W + 80, GROUND - 300);
    } },
    pierre: { pieds: 650, vie(ctx, t, dt) { Kit.flock(ctx, t, dt, 'pierre-img', '#4a3a30', 4); } },
    antiquite: { pieds: 650, vie(ctx, t, dt) { Kit.flock(ctx, t, dt, 'antiquite-img', '#3a4a5a', 4); } },
  };
  for (const age in FONDS) {
    const F = FONDS[age], code = A.backdrops[age];
    if (!code) continue;
    image(age + '-fond');
    A.backdrops[age] = function (ctx, t, dt, R) {
      const im = image(age + '-fond');
      if (age === 'jurassique' && PA.Magma) PA.Magma.CRATERE = im ? CRATERE : null;   // le réveil du volcan suit le dessin
      if (!im) return code(ctx, t, dt, R);
      peindre(ctx, im, 1, F.pieds);
      try { F.vie(ctx, t, dt || 0); } catch (e) { /* décor seul */ }
    };
  }

  // ------------------------------------------------------------ moulin (ailes qui tournent)
  // Les ailes ont été retirées de l'image (outils/decor-medieval.js) ; elles sont dessinées ici.
  const MOYEU = [1165.8, 390.9];   // dans l'image à 1360 px
  function moulin(ctx, t) {
    const x = MOYEU[0] - 40, y = MOYEU[1] + GROUND - PIEDS, a = t * 0.7;
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // chapeau de la tour, derrière les ailes
    ctx.fillStyle = '#b98c5e'; ctx.strokeStyle = '#4a3222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-13, 9); ctx.lineTo(-10, -5); ctx.quadraticCurveTo(0, -15, 10, -5); ctx.lineTo(13, 9); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Ailes comme dans le GIF animé du fond (Gemini) : de larges planches crème, pleines du moyeu
    // au bout, une longeron sombre au milieu, des traverses et des clous.
    const R0 = 6, R1 = 56, L2 = 8;
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(a + k * Math.PI / 2);
      ctx.fillStyle = '#dcc29c'; ctx.strokeStyle = '#4e3626'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.rect(R0, -L2, R1 - R0, L2 * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(150,105,60,0.22)'; ctx.fillRect(R0, 1, R1 - R0, L2 - 1);   // ombre du bas
      ctx.strokeStyle = '#9a7650'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let g = R0 + 10; g < R1 - 2; g += 10) { ctx.moveTo(g, -L2 + 1.5); ctx.lineTo(g, L2 - 1.5); }
      ctx.stroke();
      ctx.strokeStyle = '#7a5a3c'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R1, 0); ctx.stroke();   // longeron
      ctx.fillStyle = '#6b4a2c';
      for (let g = R0 + 5; g < R1; g += 10) { ctx.fillRect(g - 0.8, -L2 + 2.4, 1.6, 1.6); ctx.fillRect(g - 0.8, L2 - 4, 1.6, 1.6); }
      ctx.restore();
    }
    ctx.fillStyle = '#6b4a2c'; ctx.strokeStyle = '#3a2618'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ------------------------------------------------------------ champs de blé (rafales de vent)
  // Des bandes claires et sombres glissent sur le blé, découpées par le masque des champs.
  const BLE = { y0: 410, y1: 606, k: 0.5, cv: null };   // rangées de l'image à 1360 px, demi-résolution
  function ble(ctx, t) {
    const m = image('medieval-ble');
    if (!m) return;
    const B = BLE, w = Math.round(LARGE * B.k), h = Math.round((B.y1 - B.y0) * B.k);
    if (!B.cv) { B.cv = document.createElement('canvas'); B.cv.width = w; B.cv.height = h; }
    const c = B.cv.getContext('2d');
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, w, h);
    // rafales : bandes penchées qui avancent vers la droite
    const bande = (x, larg, coul, a) => {
      const g = c.createLinearGradient(x, 0, x + larg, 0);
      g.addColorStop(0, coul + '0)'); g.addColorStop(0.5, coul + a + ')'); g.addColorStop(1, coul + '0)');
      c.fillStyle = g; c.fillRect(x, 0, larg, h);
    };
    c.save(); c.transform(1, 0, -0.6, 1, h * 0.6, 0);   // bandes penchées dans le sens du vent
    for (let i = 0; i < 7; i++) {   // rafales claires, de vitesses un peu différentes
      const x = ((t * (42 + (i % 3) * 7) + i * 215) % 1600) - 160;
      bande(x * B.k, (60 + (i % 2) * 40) * B.k, 'rgba(255,246,200,', 0.45);
    }
    for (let i = 0; i < 4; i++) {   // creux plus sombres entre deux rafales
      const x = ((t * 36 + i * 400 + 110) % 1600) - 160;
      bande(x * B.k, 70 * B.k, 'rgba(130,85,15,', 0.22);
    }
    c.restore();
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(m, 0, B.y0, m.width, B.y1 - B.y0, 0, 0, w, h);
    const s = LARGE / m.width;
    ctx.drawImage(B.cv, -40, GROUND - PIEDS * s + B.y0 * s, LARGE, (B.y1 - B.y0) * s);
  }

  // ------------------------------------------------------------ ciel animé (par-dessus l'image)
  // Quelques nuages qui dérivent lentement, dans le style de l'image (blancs, contour bleu-gris),
  // et de temps en temps un vol d'oiseaux qui traverse le ciel.
  const NUAGES = [
    { x: 180, y: 120, s: 0.8, v: 7 }, { x: 760, y: 70, s: 1, v: 5 }, { x: 1120, y: 175, s: 0.65, v: 9 },
  ];
  const VOL = { x: -200, y: 170, v: 46, attente: 6, oiseaux: [[0, 0], [-22, -9], [-20, 10], [-44, -16], [-42, 17], [-66, -5], [-64, 24]] };
  function nuage(ctx, x, y, s) {
    const bosses = [[-46, 6, 26, 15], [-18, -6, 30, 22], [16, -10, 34, 26], [48, 2, 26, 17], [4, 10, 52, 14]];
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); for (const [bx, by, rx, ry] of bosses) { ctx.moveTo(bx + rx, by); ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2); }
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(120,150,190,0.75)'; ctx.stroke();   // contour, puis le blanc par-dessus
    ctx.fillStyle = '#fbfdff'; ctx.fill();
    ctx.fillStyle = 'rgba(200,218,240,0.7)';   // ombre bleutée en bas
    ctx.beginPath(); ctx.ellipse(6, 16, 50, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function ciel(ctx, t, dt) {
    for (const n of NUAGES) {
      n.x += n.v * dt;
      if (n.x - 90 * n.s > W + 40) n.x = -40 - 90 * n.s;
      nuage(ctx, n.x, n.y, n.s);
    }
    const V = VOL;
    if (V.attente > 0) { V.attente -= dt; return; }
    V.x += V.v * dt;
    ctx.strokeStyle = '#2f3a4a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    V.oiseaux.forEach(([dx, dy], i) => {
      const x = V.x + dx, y = V.y + dy + Math.sin(t * 1.3 + i) * 3, b = Math.sin(t * 9 + i * 1.7), e = 6.5;
      ctx.moveTo(x - e, y - b * 4); ctx.quadraticCurveTo(x - e * 0.4, y - 3, x, y); ctx.quadraticCurveTo(x + e * 0.4, y - 3, x + e, y - b * 4);
    });
    ctx.stroke();
    if (V.x - 70 > W + 40) { V.x = -120; V.y = 120 + Math.random() * 110; V.attente = 18 + Math.random() * 14; }   // repasse toutes les 20 à 30 s
  }

  // ------------------------------------------------------------ avalanche (âge de glace)
  const STADES = ['stade1', 'stade2', 'stade3', 'vague', 'arrivee'];
  const phen0 = A.phen.glace;
  A.phen.glace = function (ctx, b, P, T) {
    const scene = C.ages[b.enemyAge];
    if (!scene || scene.id !== 'medieval') return phen0.call(this, ctx, b, P, T);   // images faites pour le décor médiéval
    const ims = STADES.map(n => image('medieval-' + n));
    if (ims.some(im => !im)) return phen0.call(this, ctx, b, P, T);   // pas encore chargées : dessin en code
    // Avancée continue : p va de 0 (fond normal) à 5 (arrivée) ; 1, 2, 3 : les stades, 4 : la vague.
    // Pendant un stade, l'avalanche continue de gagner lentement vers l'image suivante (jusqu'à +0,4),
    // puis au stade suivant elle reprend d'où elle en était : elle ne s'arrête jamais.
    const s = Math.min(P.s || 1, 3), cle = s + P.etat;
    const m = b._avalImg || (b._avalImg = { p: Math.max(0, s - 0.6), t: T, t0: T, cle, flocons: [] });
    const dt = Math.min(0.1, Math.max(0, T - m.t)); m.t = T;
    if (m.cle !== cle) { m.cle = cle; m.t0 = T; }
    const dans = T - m.t0;
    const cible = P.etat === 'arrivee' ? 5
      : P.etat === 'vague' ? 3.4 + 1.6 * Math.min(1, (P.k || 0) * 1.15)
      : P.etat === 'attente' ? 3.25 + 0.15 * Math.min(1, dans / 4)
      : s + 0.4 * (1 - Math.exp(-dans / 40));
    if (cible > m.p) m.p = Math.min(cible, m.p + dt * (P.etat === 'vague' ? 2.5 : cible - m.p > 0.5 ? 0.45 : 0.08));
    const i = Math.floor(m.p), f = m.p - i;
    if (i >= 1) peindre(ctx, ims[Math.min(i, 5) - 1], 1);   // l'image atteinte (0 : le fond normal, déjà dessiné)
    if (i < 5 && f > 0.002) front(ctx, ims[i], f, T);       // la suivante gagne, front de neige en diagonale
    flocons(ctx, m, dt, T);
  };

  // L'image suivante est révélée derrière un front qui descend des montagnes, en haut à gauche,
  // vers le terrain en bas à droite ; le bord ondule et fume de poudreuse.
  function front(ctx, im, f, T) {
    const D = -90 + f * 2120, bord = y => D - 0.9 * y + Math.sin(y * 0.021 + T * 1.4) * 28 + Math.sin(y * 0.067 - T * 2.2) * 12;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-40, -40);
    for (let y = -40; y <= 760; y += 16) ctx.lineTo(Math.max(-40, bord(y)), y);
    ctx.lineTo(-40, 760); ctx.closePath(); ctx.clip();
    peindre(ctx, im, 1);
    ctx.restore();
    // poudreuse le long du front
    const a = 0.6 * Math.min(1, f * 12, (1 - f) * 12);
    if (a <= 0.01) return;
    for (let y = -20; y <= 700; y += 30) {
      const x = bord(y);
      if (x < -60 || x > W + 60) continue;
      const r = 34 + 14 * Math.sin(y * 0.11 + T * 1.7);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(250,253,255,${a})`); g.addColorStop(1, 'rgba(250,253,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Neige qui tombe, de plus en plus dense à mesure que l'avalanche avance.
  function flocons(ctx, m, dt, T) {
    const n = Math.round(m.p < 1 ? 15 * m.p : [15, 40, 70, 140, 110][Math.min(4, Math.floor(m.p) - 1)]);
    const L = m.flocons;
    while (L.length < n) L.push({ x: Math.random() * (W + 80) - 40, y: -20 - Math.random() * 600, v: 35 + Math.random() * 55, r: 1.2 + Math.random() * 2.3, ph: Math.random() * 6 });
    if (L.length > n) L.length = n;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.beginPath();
    for (const o of L) {
      o.y += o.v * dt; o.x += (14 + Math.sin(T * 0.9 + o.ph) * 18) * dt;
      if (o.y > GROUND + 30 || o.x > W + 40) { o.y = -10 - Math.random() * 60; o.x = Math.random() * (W + 80) - 80; }
      ctx.moveTo(o.x + o.r, o.y); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // Les images de l'avalanche ne sont chargées qu'à l'approche (Antiquité face au Médiéval).
  const maj0 = PA.AgesCaches && PA.AgesCaches.decor;
  if (maj0) PA.AgesCaches.decor = function (ctx, b, t) {
    if (b.phen && b.phen.c.cle === 'glace') STADES.forEach(n => image('medieval-' + n));
    return maj0.call(this, ctx, b, t);
  };

  // ------------------------------------------------------------ château (base médiévale)
  // Atlas images/sprites/medieval-chateau.webp (outils/decoupe-sprites.js) : [x, y, w, h] des 3 états.
  // Les autres bases (24 novembre) suivent le même principe : look du dessin en code → son atlas.
  // haut : hauteur à l'écran de l'état intact (≈ 1,26 × la hauteur de la base en code, comme le château).
  const BASES = {
    castle: { fichier: 'medieval-chateau', poses: [[0, 0, 300, 475], [302, 0, 303, 504], [607, 0, 310, 456]], haut: 215, gauche: -8 },
    volcano: { fichier: 'jurassique-base', poses: [[0, 0, 319, 484], [321, 0, 310, 504], [633, 0, 310, 386]], haut: 225, gauche: -10 },
    magma: { fichier: 'magma-base', poses: [[0, 0, 313, 492], [315, 0, 309, 504], [626, 0, 310, 385]], haut: 235, gauche: -8 },
    cave: { fichier: 'pierre-base', poses: [[0, 0, 328, 474], [330, 0, 313, 504], [645, 0, 293, 386]], haut: 190, gauche: -10 },
  };
  for (const look in BASES) {
    const B = BASES[look], base0 = A.bases[look];
    if (!base0) continue;
    const im = new Image();
    im.onload = () => { B.bleu = im; try { B.rouge = PA.Sprites ? PA.Sprites.rougir(im) : im; } catch (e) { B.rouge = im; } };
    im.src = 'images/sprites/' + B.fichier + '.webp';
    A.bases[look] = function (ctx, side, def, team, dark, R) {
      if (!B.bleu) return base0.call(this, ctx, side, def, team, dark, R);
      const g = PA.Game, bs = side === 1 ? g && g.run && g.run.base : g && g.battle && g.battle.enemyBase;
      const r = bs && bs.maxHp ? bs.hp / bs.maxHp : 1;
      const [x, y, w, h] = B.poses[r > 0.6 ? 0 : r > 0.25 ? 1 : 2];
      const k = B.haut / B.poses[0][3];
      ctx.drawImage(side === 1 ? B.bleu : B.rouge, x, y, w, h, B.gauche, GROUND - h * k + 2, w * k, h * k);
    };
  }
})();

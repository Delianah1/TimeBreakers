/* =========================================================================
   ÂGE CACHÉ DU MAGMA
   On ne le voit nulle part tant qu'on ne l'a pas trouvé. Pour y entrer, il faut REFUSER D'ÉVOLUER :
   rester au Jurassique pendant les niveaux de l'âge de pierre réveille le volcan du décor.
     - 1er niveau de Pierre (N6) : le volcan entre en éruption, ses bombes de lave incendient le fond du paysage ;
     - 2e (N7) : la lave descend les flancs, les bombes tombent partout, jusqu'aux collines de devant ;
     - 3e (N8) : les bombes tombent sur le terrain et la lave le recouvre (elle brûle les deux camps), et le bouton Évoluer
       devient « Plonger dans le magma ».
   Une fois l'âge découvert (meta.magma), le volcan se réveille un niveau plus tôt.
   Évoluer normalement avant la fin rendort le volcan pour la partie.

   Plonger : run.magma = true. L'âge n° 2 (index 1) devient le Magma pour toute la run, pour toi
   comme pour l'ennemi (C.ages[1] et PA.Champions.DEFS[1] sont échangés tant que la run dure).
   Ses chiffres sont ceux de l'âge de pierre : l'équilibrage ne bouge pas.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, W = C.world.width, GROUND = C.world.groundY, PF = C.world.baseWidth, EF = W - C.world.baseWidth;
  const rand = (a, b) => a + Math.random() * (b - a);
  const IDX = 1;                       // la place de l'âge de pierre, que le Magma prend
  const PIERRE = C.ages[IDX];

  const MAGMA = {
    id: 'magma',
    name: 'Âge du Magma',
    short: 'Magma',
    cache: true,
    baseHp: PIERRE.baseHp,
    base: { look: 'magma', height: 200 },
    palette: { skyTop: '#3a1a1a', skyBottom: '#e88a3a', hills: '#2e2428', hillsFar: '#4a3236', ground: '#2a2226', groundTop: '#3a3034' },
    units: [
      { id: 'salamandre', name: 'Salamandre ardente', kind: 'melee', cost: 45, hp: 124, dmg: 30, interval: 0.95, reach: 8, speed: 58, train: 1.0, w: 34, h: 28,
        look: { body: 'salamandre' }, desc: 'Rapide, mord en brûlant' },
      { id: 'cendreux', name: 'Cracheur de cendres', kind: 'ranged', cost: 75, hp: 86, dmg: 16, interval: 1.1, range: 170, speed: 45, train: 1.2, w: 24, h: 46,
        look: { body: 'cendreux' }, projectile: { look: 'cendre', speed: 520, burn: 0.35 }, desc: 'Ses cendres brûlent un instant' },
      { id: 'golem-obsidienne', name: 'Golem d’obsidienne', kind: 'melee', cost: 300, hp: 500, dmg: 68, interval: 1.4, reach: 12, speed: 36, train: 3.0, w: 46, h: 66,
        eclate: true, look: { body: 'golem' }, desc: 'Sous la moitié de ses PV, sa carapace éclate : il fonce' },
      { id: 'elementaire-lave', name: 'Élémentaire de lave', kind: 'melee', elite: true, cost: 135, hp: 210, dmg: 44, interval: 1.4, reach: 12, splash: 42, speed: 40, train: 2.5, w: 30, h: 50,
        divise: true, look: { body: 'elementaire' }, desc: 'Frappe en zone, se divise en mourant' },
    ],
    turrets: [
      { id: 'brasero', name: 'Brasero', cost: 300, dmg: 22, interval: 0.7, range: 320, proj: 'braise', projSpeed: 600, burn: { dps: 4, duration: 2 } },
      { id: 'geyser-magma', name: 'Geyser de magma', cost: 600, dmg: 26, interval: 1.2, range: 300, proj: 'lava', projSpeed: 460, splash: 50, arc: true, burn: { dps: 7, duration: 2 } },
      { id: 'mortier-obsidienne', name: 'Mortier à obsidienne', cost: 1350, dmg: 70, interval: 1.9, range: 420, proj: 'obsidienne', projSpeed: 380, splash: 48, arc: true },
    ],
    special: { id: 'pluie-lave', name: 'Pluie de lave', cooldown: 40, count: 14, duration: 3, dmg: 154, radius: 42, look: 'lavabomb', speed: 760,
      desc: 'Des bombes de lave s’abattent sur les ennemis' },
    champion: Object.assign({}, PIERRE.champion, { id: 'titan-magma', name: 'Titan de magma' }),
  };
  // La mini-version de l'élémentaire (quand il se divise) : pas une unité qu'on achète.
  const PETIT = { id: 'petit-elementaire', name: 'Petit élémentaire', kind: 'melee', cost: 20, hp: 60, dmg: 14, interval: 1.1, reach: 8, speed: 52, train: 0, w: 18, h: 28,
    look: { body: 'elementaire' }, petit: true };

  PA.Champions.TABLE.magma = [
    { id: 'titan-magma', name: 'Titan de magma', genre: 'colosse', w: 64, h: 104, speed: 30, cap: { type: 'coulee', every: 3, first: 1.5 }, desc: 'Il laisse des coulées brûlantes derrière lui et se soigne quand il marche dessus.' },
    { id: 'reine-salamandres', name: 'Reine des salamandres', genre: 'meneur', w: 60, h: 40, speed: 46, cap: { type: 'appel', every: 11, first: 3, n: 3, unite: 0, cri: '+3 salamandres' }, desc: 'Elle appelle 3 salamandres toutes les 11 secondes.' },
    { id: 'phenix', name: 'Phénix des cendres', genre: 'perturbateur', w: 66, h: 60, vol: 84, cap: { type: 'renait' }, desc: 'Il vole : seuls tes tireurs et tes tourelles le touchent. Abattu, il renaît une fois de ses cendres.' },
  ];
  const CH_MAGMA = PA.Champions.construire(MAGMA);
  const CH_PIERRE = PA.Champions.DEFS[IDX];

  const M = PA.Magma = {
    MAGMA, PETIT, CHAMPIONS: CH_MAGMA,
    // Met l'âge n° 2 en Magma (on) ou en Pierre (off). Appelé à chaque combat et en revenant au camp.
    appliquer(on) {
      C.ages[IDX] = on ? MAGMA : PIERRE;
      PA.Champions.DEFS[IDX] = on ? CH_MAGMA : CH_PIERRE;
    },
    actif() { return C.ages[IDX] === MAGMA; },
    decouvert(meta) { return !!(meta && meta.magma && meta.magma.trouve); },

    // Le stade du réveil pour ce combat : 0 (endormi) à 3 (la lave arrive).
    stade(b) {
      const run = b.run;
      if (b.mode !== 'level' || b.special_ || run.mode || run.magma || run.volcanDort || run.age !== 0) return 0;
      if (PA.Tuto && PA.Tuto.actif) return 0;
      if (b.enemyAge !== IDX) return 0;
      return Math.min(3, b.blockIndex + 1 + (M.decouvert(b.meta) ? 1 : 0));
    },

    // ------------------------------------------------------------ en combat
    preparer(b) {
      b.volcan = M.stade(b);
      if (b.volcan) b.lave = { t: 14, x: null, etat: b.volcan >= 3 ? 'attente' : 'aucune', touches: new Set(), refroidi: 0 };
      b.magmaFile = [];
      if (b.volcan === 1) b.shake = 0.3;
    },

    maj(b, dt) {
      // Golem d'obsidienne : sous la moitié de ses PV, la carapace éclate et il accélère.
      for (const list of [b.pu, b.eu]) for (const u of list) {
        if (u.dead || !u.def.eclate || u.eclat || u.hp >= u.maxHp * 0.5) continue;
        u.eclat = true; u.speed = u.def.speed * 1.7; u.interval = u.def.interval * 0.8;
        b.texts.push({ x: u.x, y: GROUND - u.h - 20, text: 'CARAPACE BRISÉE !', life: 1.2, color: '#ffb44a' });
        for (let i = 0; i < 12; i++) b.particles.push({ x: u.x + rand(-14, 14), y: GROUND - rand(10, u.h), vx: rand(-140, 140), vy: rand(-180, -40), life: 0.7, max: 0.7, color: i % 2 ? '#3a3236' : '#ff8a3c', size: rand(2, 5) });
      }
      // Élémentaires qui se divisent (à faire hors de la boucle des unités).
      if (b.magmaFile.length) {
        for (const s of b.magmaFile) {
          for (const dx of [-10, 10]) {
            if (s.side === 1) b.spawnPlayer(PETIT, s.age); else b.spawnEnemy(PETIT, false, s.mult, s.age);
            const u = (s.side === 1 ? b.pu : b.eu).at(-1);
            u.x = Math.max(PF + u.w / 2 + 2, Math.min(EF - u.w / 2 - 2, s.x + dx)); u.invoque = true;
          }
        }
        b.magmaFile = []; b.sortUnits();
      }
      if (b.volcan) M.majVolcan(b, dt);
    },

    // Le 3e stade : le volcan bombarde le terrain. Chaque bombe s'écrase, brûle les unités autour
    // (une fois chacune) et laisse une flaque de lave qui s'étale. Quand les flaques couvrent la piste, c'est fini.
    majVolcan(b, dt) {
      const L = b.lave; if (!L) return;
      if (b.volcan >= 2 && Math.random() < dt * 0.4) b.shake = Math.max(b.shake, 0.1);
      if (L.etat === 'aucune') return;
      if (L.etat === 'attente') {
        L.t -= dt;
        if (L.t <= 3 && !L.alerte) { L.alerte = true; b.game.toast('Le volcan gronde… les bombes de lave arrivent !', 'big'); }
        if (L.t <= 0) {
          L.etat = 'coule'; L.x = EF - 10; b.shake = 0.5;
          // 24 bombes réparties sur toute la piste, dans le désordre, sur 5 secondes
          const n = 24, pas = (EF - PF - 40) / n, cibles = [];
          for (let i = 0; i < n; i++) cibles.push(PF + 20 + (i + 0.2 + Math.random() * 0.6) * pas);
          for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cibles[i], cibles[j]] = [cibles[j], cibles[i]]; }
          L.bombes = cibles.map((x, i) => ({ x, t: -i * 0.21, vol: 1.1, haut: 220 + Math.random() * 140 }));
          L.flaques = [];
        }
        return;
      }
      if (L.etat === 'coule') {
        b.shake = Math.max(b.shake, 0.08);
        for (const bo of L.bombes) {
          if (bo.posee) continue;
          bo.t += dt;
          if (bo.t < bo.vol) continue;
          bo.posee = true;
          const r = 34 + Math.random() * 14;
          L.flaques.push({ x: bo.x, r: 8, rMax: r, age: 0, ph: Math.random() * 6 });
          b.shake = Math.max(b.shake, 0.3);
          for (const list of [b.pu, b.eu]) for (const u of list) {
            if (u.dead || u.alt > 0 || L.touches.has(u) || Math.abs(u.x - bo.x) > r + u.w / 2) continue;
            L.touches.add(u);
            b.damageUnit(u, u.maxHp * (u.isChampion ? 0.1 : 0.35), false, 'pouvoir');
            if (!u.dead) u.burn = { dps: u.maxHp * 0.04, t: 3 };
            b.spark(u.x, GROUND - 10, '#ff8a3c', 6);
          }
          for (let i = 0; i < 16; i++) b.particles.push({ x: bo.x + rand(-10, 10), y: GROUND - rand(0, 10), vx: rand(-160, 160), vy: rand(-280, -80), life: 0.7, max: 0.7, color: i % 2 ? '#ff8a3c' : '#ffd36a', size: rand(2, 5) });
        }
        if (L.bombes.every(bo => bo.posee)) {
          L.fin = (L.fin || 0) + dt;
          if (L.fin > 0.8) {
            L.etat = 'arrivee'; L.x = PF + 10;
            if (b.run.age === 0) b.game.toast('La lave a tout recouvert : plonge dans le magma !', 'big');
          }
        }
      }
      if (L.flaques) for (const f of L.flaques) { f.age += dt; f.r = Math.min(f.rMax, f.r + dt * 60); }
      if (L.etat === 'arrivee') L.refroidi = Math.min(1, L.refroidi + dt / 20);
    },

    plongeePossible(b) {
      return !!(b.volcan >= 3 && b.lave && b.lave.etat === 'arrivee' && b.run.age === 0 && !b.over && b.game.playableAges > IDX);
    },

    plonger(b) {
      const run = b.run, meta = b.game.meta;
      run.magma = true;
      M.appliquer(true);
      b._champ = null;           // le champion ennemi de ce combat sera celui du Magma
      const premier = !M.decouvert(meta);
      meta.magma = Object.assign({ trouve: true, fois: 0 }, meta.magma);
      meta.magma.trouve = true; meta.magma.fois = (meta.magma.fois || 0) + 1;
      if (premier) { const gain = PA.Meta.bank(meta, 500); run.ppLevels += gain; b.magmaGain = gain; }
      PA.Meta.save(meta);
      b.volcan = 0; b.lave = null;
      b.shake = 0.8;
      for (let i = 0; i < 70; i++) b.particles.push({ x: rand(0, W), y: GROUND - rand(0, 30), vx: rand(-60, 60), vy: rand(-320, -80), life: rand(0.6, 1.4), max: 1.4, color: i % 3 ? '#ff8a3c' : '#ffd36a', size: rand(2, 5) });
      if (premier) setTimeout(() => b.game.toast(`Âge caché découvert : ${MAGMA.name} ! +${Math.round(b.magmaGain)} ✦`, 'big'), 1600);
      if (M.surDecouverte) M.surDecouverte(b, premier);
    },

    // ------------------------------------------------------------ dessin
    // Par-dessus le décor : le volcan entre en éruption et crache des bombes de lave.
    //   stade 1 : elles tombent sur l'arrière du paysage (les collines du fond) ;
    //   stade 2 : partout, jusqu'aux collines de devant ;
    //   stade 3 : sur le terrain, et la coulée le recouvre.
    decor(ctx, b, t) {
      const s = b.volcan, T = performance.now() / 1000, A = PA.Art, Kit = A && A.kit;
      const L = b.lave;
      if (s && Kit) {
        const [CX, CY, CB = 450] = M.CRATERE || [930, 252];   // js/decors.js le déplace sur le volcan du fond dessiné
        // collines du décor (js/art/jurassique.js)
        const h1 = x => 500 - Math.sin(x * 0.0046 + 2.2) * 26 - Math.sin(x * 0.012 + 0.4) * 9;
        const h2 = x => 560 - Math.sin(x * 0.0062 + 0.9) * 18 - Math.sin(x * 0.019 + 3) * 6;
        const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
        // ciel qui rougit, fumée épaisse, coulées sur les flancs
        ctx.fillStyle = `rgba(190,50,20,${0.05 + 0.05 * s})`; ctx.fillRect(0, 0, W, GROUND);
        Kit.puffs(ctx, CX, CY - 4, { n: 7 + s * 3, speed: 0.1, rise: 190 + s * 40, drift: 140, r0: 18, r1: 56 + s * 14, rgb: '60,46,50', a: 0.55 + s * 0.08 });
        Kit.halo(ctx, CX, CY, 80 + s * 34, '255,110,40', 0.45 + s * 0.12 + 0.1 * Math.sin(T * 5));
        if (Kit.couleesVolcan) Kit.couleesVolcan(ctx, CX, CY, CB, [0, 0.4, 0.75, 1][s], T);
        // la fontaine de lave au cratère
        for (let i = 0; i < 10 + s * 6; i++) {
          const p = 0.9 + (i % 4) * 0.25, u = ((T + i * 0.37) % p) / p, vx = (hash(i) - 0.5) * 120, hh = 60 + hash(i + 50) * (50 + s * 30);
          ctx.globalAlpha = 1 - u * 0.6;
          Kit.disc(ctx, CX + vx * u, CY - 4 * hh * u * (1 - u), 2.4 + (i % 3), i % 3 ? '#ff8a3c' : '#ffe08a');
        }
        ctx.globalAlpha = 1;
        // incendies laissés par les bombes
        const feux = [];
        for (let i = 0; i < 4 + s * 3; i++) { const x = 40 + hash(i + 7) * (W - 80); feux.push([x, h1(x) + 3, 0.55]); }
        if (s >= 2) for (let i = 0; i < 3 + (s - 1) * 3; i++) { const x = 60 + hash(i + 90) * (W - 220); feux.push([x, h2(x) + 6, 0.85]); }
        for (const [x, y, k] of feux) { Kit.halo(ctx, x, y - 10 * k, 34 * k, '255,120,40', 0.5); Kit.flame(ctx, x, y, 30 * k, 16 * k, x); }
        // les bombes de lave : du cratère vers leur point de chute
        const nb = 5 + s * 4;
        for (let i = 0; i < nb; i++) {
          const p = 2.1 + (i % 5) * 0.33, ph = T + i * 0.71, n = Math.floor(ph / p), u = (ph % p) / p;
          const r1 = hash(i * 31 + n), r2 = hash(i * 17 + n * 3 + 5);
          let tx, ty, k;
          // (les bombes qui tombent sur le terrain au stade 3 sont de vraies bombes : L.bombes, plus bas)
          const zone = s >= 2 && r2 < 0.75 ? 'devant' : 'fond';
          if (zone === 'devant') { tx = 40 + r1 * (W - 80); ty = h2(tx) + 6; k = 0.85; }
          else { tx = 20 + r1 * (W - 40); ty = h1(tx) + 2; k = 0.55; }
          if (u < 0.72) {
            const q = u / 0.72, haut = 230 + r2 * 120;
            for (let j = 4; j >= 0; j--) {
              const qq = Math.max(0, q - j * 0.025);
              const x = CX + (tx - CX) * qq, y = CY + (ty - CY) * qq - 4 * haut * qq * (1 - qq);
              ctx.globalAlpha = j ? 0.5 - j * 0.09 : 1;
              if (!j) Kit.halo(ctx, x, y, 22 * (0.7 + k * 0.4), '255,140,40', 0.6);
              Kit.disc(ctx, x, y, (j ? 6 - j * 0.8 : 8.5) * (0.7 + k * 0.4), j ? '#ff7a22' : '#ffd36a');
            }
            ctx.globalAlpha = 1;
          } else {
            const v = (u - 0.72) / 0.28;
            Kit.halo(ctx, tx, ty - 6, (30 + v * 40) * k, '255,130,40', 0.8 * (1 - v));
            ctx.strokeStyle = `rgba(255,220,140,${1 - v})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(tx, ty, (8 + v * 46) * k, (3 + v * 10) * k, 0, 0, Math.PI * 2); ctx.stroke();
            for (let j = 0; j < 6; j++) { const a = Math.PI * (0.1 + 0.8 * j / 5); Kit.disc(ctx, tx + Math.cos(a) * v * 40 * k, ty - Math.sin(a) * v * 34 * k + v * v * 20, 2.4 * k, j % 2 ? '#ff8a3c' : '#ffd36a'); }
          }
        }
        // braises dans l'air
        for (let i = 0; i < 6 * s; i++) { const k = (T * 0.12 + i * 0.173) % 1; ctx.globalAlpha = 1 - k; Kit.disc(ctx, (i * 211 + T * 20) % W, k * GROUND, 1.6, i % 2 ? '#ff8a3c' : '#ffd36a'); }
        ctx.globalAlpha = 1;
      }
      if (L && L.flaques && Kit) {
        // les flaques de lave laissées par les bombes (posées sur le sol, elles refroidissent ensuite)
        const c = L.refroidi;
        for (const f of L.flaques) {
          const g = ctx.createRadialGradient(f.x, GROUND + 2, 0, f.x, GROUND + 2, f.r);
          if (c >= 1) { g.addColorStop(0, '#4a3430'); g.addColorStop(1, '#2e2220'); }
          else { g.addColorStop(0, `rgba(255,${220 - c * 120 | 0},${110 - c * 70 | 0},1)`); g.addColorStop(0.55, `rgba(255,${130 - c * 70 | 0},30,1)`); g.addColorStop(1, `rgba(150,${40 + c * 10 | 0},20,1)`); }
          ctx.fillStyle = g; ctx.beginPath();
          for (let i = 0; i <= 16; i++) {
            const a = Math.PI * 2 * i / 16, w = 1 + Math.sin(a * 3 + f.ph) * 0.12 + Math.sin(a * 5 + f.ph * 2) * 0.06;
            const x = f.x + Math.cos(a) * f.r * w, y = GROUND + 2 + Math.sin(a) * 6 * w;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.closePath(); ctx.fill();
          if (c < 1) {
            Kit.halo(ctx, f.x, GROUND - 4, f.r * 1.1, '255,120,40', 0.35 * (1 - c));
            // bulles qui éclatent
            for (let i = 0; i < 3; i++) { const u = (T * 0.8 + i * 0.33 + f.ph) % 1; ctx.globalAlpha = (1 - u) * (1 - c); Kit.disc(ctx, f.x + Math.sin(f.ph + i * 2.1) * f.r * 0.6, GROUND + 1 - u * 6, 1.5 + u * 2.5, '#ffe08a'); }
            ctx.globalAlpha = 1;
          }
        }
      }
      if (L && L.bombes && Kit) {
        // les vraies bombes, du cratère jusqu'à la piste
        const [CX, CY, CB = 450] = M.CRATERE || [930, 252];   // js/decors.js le déplace sur le volcan du fond dessiné
        for (const bo of L.bombes) {
          if (bo.posee || bo.t < 0) continue;
          const q = bo.t / bo.vol;
          for (let j = 5; j >= 0; j--) {
            const qq = Math.max(0, q - j * 0.03);
            const x = CX + (bo.x - CX) * qq, y = CY + (GROUND - 4 - CY) * qq - 4 * bo.haut * qq * (1 - qq);
            ctx.globalAlpha = j ? 0.55 - j * 0.08 : 1;
            if (!j) Kit.halo(ctx, x, y, 30, '255,140,40', 0.7);
            Kit.disc(ctx, x, y, j ? 8 - j : 11, j ? '#ff7a22' : '#ffd36a');
          }
          ctx.globalAlpha = 1;
        }
      }
    },
  };

  // ---------------------------------------------------------------- branchements
  const B = PA.Battle.prototype;
  const update0 = B.update, canEvolve0 = B.canEvolve, evolve0 = B.evolve, mort0 = B.onUnitDeath;
  B.update = function (dt) { update0.call(this, dt); if (!this.over || this.magmaFile) M.maj(this, dt); };
  B.canEvolve = function () { return M.plongeePossible(this) || canEvolve0.call(this); };
  B.plongeePossible = function () { return M.plongeePossible(this); };
  B.evolve = function () {
    if (M.plongeePossible(this)) { M.plonger(this); this.run.xp = Math.max(this.run.xp, C.evolveXp[0]); }
    else if (this.volcan && canEvolve0.call(this)) { this.run.volcanDort = true; this.volcan = 0; this.lave = null; }   // évoluer normalement rendort le volcan
    return evolve0.call(this);
  };
  B.onUnitDeath = function (u) {
    if (u.def.divise && this.magmaFile) this.magmaFile.push({ side: u.side, x: u.x, age: u.ageIdx, mult: this.statMult });
    return mort0.call(this, u);
  };

  // Au camp, l'âge n° 2 redevient la Pierre (les menus, la boutique et la galerie la montrent).
  const camp0 = PA.UI.showCamp;
  PA.UI.showCamp = function (...a) { M.appliquer(false); return camp0.apply(this, a); };

  // Chaque combat remet l'âge n° 2 dans le bon état (Magma seulement pour la run qui y a plongé).
  // On l'enveloppe ici : la classe est déjà créée par js/battle.js.
  const Battle0 = PA.Battle;
  PA.Battle = class extends Battle0 {
    constructor(game, opts) {
      M.appliquer(!!(game.run && game.run.magma));
      super(game, opts);
      M.preparer(this);
    }
  };
})();

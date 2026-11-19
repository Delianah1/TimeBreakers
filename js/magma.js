/* =========================================================================
   ÂGE CACHÉ DU MAGMA
   On ne le voit nulle part tant qu'on ne l'a pas trouvé. Pour y entrer, il faut REFUSER D'ÉVOLUER :
   rester au Jurassique pendant les niveaux de l'âge de pierre réveille le volcan du décor.
     - 1er niveau de Pierre (N6) : le volcan fume fort, la terre tremble ;
     - 2e (N7) : la lave descend les flancs, des braises tombent ;
     - 3e (N8) : la lave arrive sur le terrain (elle brûle les deux camps), et le bouton Évoluer
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

    // La coulée du 3e stade : elle part du pied du volcan (à droite), traverse la piste et refroidit.
    majVolcan(b, dt) {
      const L = b.lave; if (!L) return;
      if (b.volcan >= 2 && Math.random() < dt * 0.4) b.shake = Math.max(b.shake, 0.1);
      if (L.etat === 'aucune') return;
      if (L.etat === 'attente') {
        L.t -= dt;
        if (L.t <= 3 && !L.alerte) { L.alerte = true; b.game.toast('Le sol tremble… la lave arrive !', 'big'); }
        if (L.t <= 0) { L.etat = 'coule'; L.x = EF - 10; b.shake = 0.5; if (PA.Sons && PA.Sons.evolution) { /* pas de son dédié */ } }
        return;
      }
      if (L.etat === 'coule') {
        L.x -= 170 * dt;
        b.shake = Math.max(b.shake, 0.12);
        for (const list of [b.pu, b.eu]) for (const u of list) {
          if (u.dead || u.alt > 0 || L.touches.has(u) || u.x < L.x - u.w / 2) continue;
          L.touches.add(u);
          b.damageUnit(u, u.maxHp * (u.isChampion ? 0.1 : 0.35), false, 'pouvoir');
          if (!u.dead) u.burn = { dps: u.maxHp * 0.04, t: 3 };
          b.spark(u.x, GROUND - 10, '#ff8a3c', 6);
        }
        if (Math.random() < dt * 30) b.particles.push({ x: L.x + rand(0, 20), y: GROUND - rand(0, 14), vx: rand(-60, 30), vy: rand(-200, -60), life: 0.6, max: 0.6, color: Math.random() < 0.5 ? '#ff8a3c' : '#ffd36a', size: rand(2, 4) });
        if (L.x <= PF + 10) {
          L.etat = 'arrivee'; L.x = PF + 10;
          if (b.run.age === 0) b.game.toast('La lave a tout recouvert : plonge dans le magma !', 'big');
        }
        return;
      }
      L.refroidi = Math.min(1, L.refroidi + dt / 20);
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
    // Par-dessus le décor : le réveil du volcan (au fond), puis la coulée sur la piste.
    decor(ctx, b, t) {
      const s = b.volcan, T = performance.now() / 1000, A = PA.Art, Kit = A && A.kit;
      if (s && Kit) {
        // fumée plus épaisse, coulées sur les flancs, ciel qui rougit
        Kit.puffs(ctx, 930, 248, { n: 6 + s * 2, speed: 0.09, rise: 170 + s * 30, drift: 130, r0: 16, r1: 50 + s * 12, rgb: '70,56,60', a: 0.45 + s * 0.08 });
        Kit.halo(ctx, 930, 250, 60 + s * 30, '255,110,40', 0.35 + s * 0.12 + 0.08 * Math.sin(T * 3));
        if (s >= 2 && Kit.couleesVolcan) Kit.couleesVolcan(ctx, 930, 252, 450, s >= 3 ? 1 : 0.55, T);
        if (s >= 2) {
          ctx.fillStyle = `rgba(200,60,20,${0.06 * s})`; ctx.fillRect(0, 0, W, GROUND);
          for (let i = 0; i < 6 * s; i++) { const k = (T * 0.12 + i * 0.173) % 1; ctx.globalAlpha = 1 - k; Kit.disc(ctx, (i * 211 + T * 20) % W, k * GROUND, 1.6, i % 2 ? '#ff8a3c' : '#ffd36a'); }
          ctx.globalAlpha = 1;
        }
      }
      const L = b.lave;
      if (L && L.x != null) {
        const x0 = L.x, x1 = EF + 10, c = L.refroidi;
        const g = ctx.createLinearGradient(0, GROUND - 8, 0, GROUND + 22);
        g.addColorStop(0, c >= 1 ? '#3a2a26' : `rgba(255,${150 - c * 80 | 0},40,0.95)`); g.addColorStop(1, '#7a2a18');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, GROUND + 22);
        for (let x = x0; x <= x1; x += 14) ctx.lineTo(x, GROUND - 5 - Math.sin(x * 0.07 + T * 3) * 3 * (1 - c));
        ctx.lineTo(x1, GROUND + 22); ctx.closePath(); ctx.fill();
        if (c < 1) {
          ctx.globalAlpha = 1 - c; ctx.strokeStyle = '#ffe9a0'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 10]); ctx.lineDashOffset = T * 20;
          ctx.beginPath(); ctx.moveTo(x0, GROUND + 1); ctx.lineTo(x1, GROUND + 1); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        }
        if (L.etat === 'coule') { Kit && Kit.halo(ctx, x0, GROUND - 6, 40, '255,120,40', 0.7); Kit && Kit.flame(ctx, x0 + 4, GROUND, 18, 16, 1); }
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

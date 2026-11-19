/* =========================================================================
   MODES À PART : boss rush et défi du jour (19 novembre).

   GALERIE DES CHAMPIONS (meta.champs) : { id du champion: médaille }
     1 bronze : vaincu dans une vraie partie (il entre alors dans le boss rush)
     2 argent : vaincu dans le boss rush
     3 or     : vaincu dans le boss rush, base encore au-dessus de 50 %

   BOSS RUSH : débloqué par un premier assaut final. Un combat par âge, dans l'ordre, contre un champion
   déjà vaincu de cet âge. Ton armée est toujours du même âge que lui, l'or est remis à un montant fixe,
   et entre deux boss : une récompense au choix et +25 % de PV pour la base. Pas de prestige : des records.

   DÉFI DU JOUR : le même pour tout le monde ce jour-là (tiré à partir de la date). Ton âge, l'avance de
   l'ennemi, le mélange des vagues et une règle changent chaque jour. Il ne tient compte ni de tes
   améliorations ni de tes élites. 1) Survivre : la base ennemie est intouchable et envoie des unités
   de plusieurs âges. 2) La porte se ferme : plus de renforts, va détruire sa base.
   Le premier défi réussi de la journée rapporte un peu de prestige.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;

  // ------------------------------------------------------------ hasard fixé
  function graine(txt) { let h = 2166136261; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function hasard(s) {   // mulberry32
    return function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const jourDe = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const aujourdhui = () => jourDe(new Date());
  const hier = () => { const d = new Date(); d.setDate(d.getDate() - 1); return jourDe(d); };
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

  // ------------------------------------------------------------ défi : tables
  // w : poids de chaque écart d'âge par rapport au tien (-3 = trois âges plus anciens, +2 = deux âges d'avance).
  const MELANGES = [
    { id: 'tous', nom: 'La mêlée des âges', desc: 'Des unités de tous les âges, à parts presque égales.', w: { '-3': 1, '-2': 1.5, '-1': 2, 0: 2.5, 1: 1.2, 2: 0.4 } },
    { id: 'anciens', nom: 'La revanche des anciens', desc: 'Surtout des unités d’âges passés, en grand nombre.', w: { '-3': 2.5, '-2': 3, '-1': 2, 0: 1, 1: 0.3 } },
    { id: 'avant-garde', nom: 'L’avant-garde', desc: 'Moins d’unités, mais beaucoup viennent du futur.', w: { '-1': 1, 0: 2, 1: 2, 2: 0.8 } },
    { id: 'colosses', nom: 'La marche des colosses', desc: 'L’ennemi préfère ses unités lourdes.', w: { '-2': 1, '-1': 2, 0: 2.5, 1: 1 }, lourds: true },
  ];
  const REGLES = [
    { id: 'aucune', nom: 'Sans règle', desc: 'Rien de spécial aujourd’hui : à toi de jouer.' },
    { id: 'or2', nom: 'Or double, pas de tourelles', desc: 'Chaque ennemi tué rapporte deux fois plus d’or, mais tu ne peux pas construire de tourelle.' },
    { id: 'pouvoir', nom: 'Pouvoir déchaîné', desc: 'Ton pouvoir spécial se recharge deux fois plus vite.' },
    { id: 'breche', nom: 'La brèche', desc: 'La base ennemie est à moitié détruite, mais elle envoie deux fois plus d’unités.' },
    { id: 'solo', nom: 'Une seule unité', desc: 'Tu ne peux acheter qu’un seul type d’unité.' },
    { id: 'fortin', nom: 'Le fortin', desc: 'Ta base a 50 % de PV en plus.' },
  ];
  const SURVIE = 180;   // secondes à tenir avant que la porte ennemie se ferme
  // Boss rush : le champion arrive après champ secondes, l'escorte a cette part de l'or d'un niveau de boss,
  // et chaque combat commence avec or × le minimum d'un début de niveau, plus une tourelle offerte.
  // Mesuré au pilote (outils/pilote-modes.js, sauvegarde neuve) : à or 3,5 / escorte 0,7, 3 rushs complets sur 4,
  // tout en or ; à 2,5 / 1, la moitié des rushs complets, l'autre moitié tombe au Chevalier noir.
  const RUSH = { champ: 15, escorte: 1, or: 2.5 };

  const Modes = {
    MELANGES, REGLES, SURVIE, RUSH,
    DEFI_REVENU: 1 / 40,   // or par seconde au défi = cette part de l'or minimum d'un début de niveau de ton âge
    // Réglages mesurés au pilote (outils/pilote-modes.js, 8 jours différents) : l'IA plafonne à 14 unités,
    // c'est donc leur force qui fait la pression, pas l'or. À ×1,3 le pilote finissait toujours avec sa base
    // intacte ; à ×1,8 il tombait presque toujours pendant la survie ; à ×1,5 la moitié des défis tombaient.
    DEFI_BASE: 0.7,        // PV de la base ennemie = ceux d'un niveau de boss de ton âge × ce facteur
    DEFI_TOURELLES: [0],   // tourelles de la base ennemie (index dans la liste de ton âge)
    DEFI_PRESSION: 3,      // or par seconde de l'IA = celui d'un niveau de boss de ton âge × ce facteur
    DEFI_STAT: 1.4,        // PV et dégâts des unités ennemies (en plus de la difficulté)

    // ================================================================ galerie
    medaille(meta, id) { return (meta.champs && meta.champs[id]) || 0; },
    donner(meta, id, n) {
      meta.champs = meta.champs || {};
      if ((meta.champs[id] || 0) >= n) return false;
      meta.champs[id] = n;
      PA.Meta.save(meta);
      return true;
    },
    // Un champion ennemi vient de mourir (appelé par le combat).
    championTue(b, u) {
      const game = b.game, run = b.run;
      if (game.demo || (PA.Tuto && PA.Tuto.actif)) return;
      if (run.mode === 'rush') {
        b.champTue = true;
        return;
      }
      if (!run.mode && this.donner(game.meta, u.def.id, 1)) game.toast(`${u.def.name} rejoint ta galerie des champions !`);
    },
    // Champions vaincus d'un âge (au moins le bronze).
    vaincus(meta, age) { return (PA.Champions.DEFS[age] || []).map((d, k) => ({ d, k })).filter(o => this.medaille(meta, o.d.id) > 0); },
    nbVaincus(meta) { let n = 0; for (let a = 0; a < C.ages.length; a++) n += this.vaincus(meta, a).length; return n; },

    // ============================================================== boss rush
    rushOuvert(meta) { return !!meta.rushOuvert || PA.DEV; },
    rushEtapes(meta) {
      const out = [];
      for (let a = 0; a < C.ages.length; a++) {
        const l = this.vaincus(meta, a);
        if (l.length) out.push({ age: a, k: l[Math.floor(Math.random() * l.length)].k });
      }
      return out;
    },
    lancerRush() {
      const game = PA.Game, meta = game.meta;
      const etapes = this.rushEtapes(meta);
      if (!etapes.length) return;
      game.run = {
        mode: 'rush', etapes, i: 0, temps: 0, medailles: [],
        age: etapes[0].age, xp: 0, gold: 0, base: { hp: 0, maxHp: 0 }, turrets: [null, null], relics: [],
        level: 1, levelsDone: 0, ppLevels: 0, ppAssault: 0, ppLost: 0, assaultWave: 0,
        champions: PA.Champions.DEFS.map(() => 0),
      };
      game.speed = Math.min(game.speed, PA.Meta.maxSpeed(meta));
      this.combatRush(true);
    },
    combatRush(premier) {
      const game = PA.Game, run = game.run, e = run.etapes[run.i];
      const ratio = premier ? 1 : run.base.hp / Math.max(1, run.base.maxHp);
      run.age = e.age;
      run.champions[e.age] = e.k;
      game.playableAges = e.age + 1;               // pas d'évolution : l'armée a l'âge du champion
      game.totalLevels = run.etapes.length;
      game.refreshBaseMax();
      run.base.hp = Math.max(1, Math.round(run.base.maxHp * ratio));
      run.gold = C.economy.minGoldAtLevelStart[e.age] * RUSH.or;
      run.turrets = [{ age: e.age, idx: 0, cd: 0.5 }, null];
      const ch = PA.Champions.DEFS[e.age][e.k];
      this.combat({ mode: 'level', enemyAge: e.age, levelNumber: run.i + 1, blockIndex: C.levels.perAge - 1, special: 'rush',
        banniere: { title: `BOSS ${run.i + 1} / ${run.etapes.length}`, sub: `${ch.name} · ${C.ages[e.age].name}`, color: '#ff8a6a' } });
    },

    // ============================================================ défi du jour
    defiOuvert(meta) { return meta.runs >= 1 || PA.DEV; },
    // Le défi d'un jour donné : toujours le même pour une même date.
    defi(jour) {
      jour = jour || aujourdhui();
      const r = hasard(graine('timebreakers-' + jour));
      const pick = l => l[Math.floor(r() * l.length)];
      const nAges = C.ages.length;
      const age = 1 + Math.floor(r() * Math.min(6, nAges - 4));         // ton âge : Pierre à Moderne
      const avance = 2 + Math.floor(r() * 2);                          // l'ennemi a 2 ou 3 âges d'avance
      const melange = pick(MELANGES), regle = pick(REGLES);
      const solo = Math.floor(r() * 3);
      const [a, m, j] = jour.split('-').map(Number);
      const nomJour = JOURS[new Date(a, m - 1, j).getDay()];
      return { jour, nomJour, age, ennemi: Math.min(nAges - 1, age + avance), melange, regle, solo,
        nom: `${nomJour[0].toUpperCase() + nomJour.slice(1)} : ${melange.nom.charAt(0).toLowerCase() + melange.nom.slice(1)}` };
    },
    // Les records du défi pour aujourd'hui (remis à zéro chaque jour ; la série, elle, continue).
    etatDefi(meta) {
      const j = aujourdhui();
      const s = meta.defi = Object.assign({ jour: null, essais: 0, meilleur: null, serie: 0, dernierReussi: null, recompense: null }, meta.defi || {});
      if (s.jour !== j) { s.jour = j; s.essais = 0; s.meilleur = null; }
      if (s.dernierReussi && s.dernierReussi !== j && s.dernierReussi !== hier()) s.serie = 0;
      return s;
    },
    recompenseDefi(meta) {
      const P = C.prestige;
      return Math.round((P.levelBase + P.levelPerIndex * Math.max(C.levels.perAge, meta.bestLevel || 0)) * 2);
    },
    lancerDefi(jour) {   // jour : seulement pour les essais (outils/pilote-modes.js)
      const game = PA.Game, meta = game.meta, d = this.defi(jour);
      const s = this.etatDefi(meta); s.essais++; PA.Meta.save(meta);
      // Méta neutre : ni améliorations, ni élites, ni pouvoirs achetés. Tout le monde part à égalité.
      const neutre = PA.Meta.defaults(meta.difficulty);
      game.run = {
        mode: 'defi', defi: d, metaNeutre: neutre, temps: 0,
        age: d.age, xp: 0, gold: C.economy.minGoldAtLevelStart[d.age] * 3, base: { hp: 0, maxHp: 0 },
        turrets: d.regle.id === 'or2' ? [] : [{ age: d.age, idx: 0, cd: 0.5 }, null], relics: [],
        level: 1, levelsDone: 0, ppLevels: 0, ppAssault: 0, ppLost: 0, assaultWave: 0, champions: null,
      };
      game.playableAges = d.age + 1;
      game.totalLevels = 1;
      game.refreshBaseMax();
      game.run.base.hp = game.run.base.maxHp;
      game.speed = Math.min(game.speed, PA.Meta.maxSpeed(meta));
      this.combat({ mode: 'level', enemyAge: d.ennemi, levelNumber: 1, blockIndex: C.levels.perAge - 1, special: 'defi',
        banniere: { title: 'DÉFI DU JOUR', sub: `${d.melange.nom} · ${d.regle.nom}`, sub2: `Tiens ${Math.floor(SURVIE / 60)} minutes, puis détruis la base ennemie`, color: '#7fd6ff' } });
    },
    // Réglages du combat du défi (appelé par le constructeur du combat).
    preparerDefi(b) {
      const d = b.run.defi, L = C.levels, p = d.age;
      b.defi = d;
      b.statMult = L.statMult[L.perAge - 1] * (b.diff.enemyStat + (b.diff.enemyStatPerAge || 0) * p) * this.DEFI_STAT;
      b.baseStatMult = b.statMult;
      const hp = Math.round(L.enemyBaseHp[p][L.perAge - 1] * this.DEFI_BASE * (d.regle.id === 'breche' ? 0.5 : 1));
      b.enemyBase = { hp, maxHp: hp, invulnerable: true };
      // Tourelles de ton âge (d'un âge d'avance, elles fauchaient toute attaque de la base au pilote).
      b.enemyTurrets = this.DEFI_TOURELLES.map((idx, k) => ({ age: p, idx, cd: 2 + k }));
      b.ai.income = L.enemyIncome[p][L.perAge - 1] * this.DEFI_PRESSION * (d.regle.id === 'breche' ? 2 : 1);
      b.ai.gold = L.enemyStartGold[p];
      b.isBoss = false; b.rushLeft = 0;
      b.phase = 'survie';
      if (d.regle.id === 'or2') b.mods.goldGain += 1;
      if (d.regle.id === 'pouvoir') b.mods.specialCd = Math.max(-0.7, b.mods.specialCd - 0.5);
    },
    // L'IA du défi : elle achète des unités de plusieurs âges, puis s'arrête quand la porte se ferme.
    majDefi(b, dt) {
      const d = b.defi, ai = b.ai, L = C.levels;
      if (b.phase === 'survie' && b.time >= SURVIE) {
        b.phase = 'assaut';
        b.enemyBase.invulnerable = false;
        b.banniere = { title: 'LA PORTE SE FERME', sub: 'Plus de renforts : détruis la base ennemie !', color: '#ffd76a' };
        b.introT = 0;
        b.shake = Math.max(b.shake, 0.3);
        if (PA.Music) PA.Music.demande('assaut');
        return;
      }
      if (b.phase !== 'survie' || b.time < 2) return;
      ai.gold += ai.income * dt;
      if (ai.pick == null) {
        const ecarts = Object.keys(d.melange.w).map(Number).filter(k => d.age + k >= 0 && d.age + k <= d.ennemi);
        // pas d'unités en avance trop tôt : elles arrivent après la première minute
        const poids = ecarts.map(k => (k > 0 && b.time < 60 ? 0 : d.melange.w[k]));
        const age = d.age + ecarts[pick(poids)];
        const w = d.melange.lourds ? [0.25, 0.3, 0.45] : L.unitWeights.slice();
        if (b.time < L.heavyAfter) w[2] = 0;
        ai.pick = { age, idx: pick(w) };
      }
      const def = C.ages[ai.pick.age].units[ai.pick.idx];
      if (ai.gold >= def.cost && b.eu.length < L.maxEnemyUnits && b.canSpawn(-1, def.w)) {
        ai.gold -= def.cost;
        b.spawnEnemy(def, false, null, ai.pick.age);
        ai.pick = null;
        b.sortUnits();
      }
    },

    // ============================================================== communs
    combat(opts) {
      const game = PA.Game;
      game.battle = new PA.Battle(game, opts);
      if (opts.banniere) game.battle.banniere = opts.banniere;
      game.paused = false;
      game.blocked = false;
      PA.UI.hideOverlay();
      PA.UI.enterBattle();
      PA.UI.update(true);
    },

    // Fin d'un combat d'un de ces modes (victoire, défaite ou abandon).
    fin(b, result) {
      const game = PA.Game, run = game.run, meta = game.meta;
      game.blocked = true;
      game.paused = false;
      run.temps += b.time;
      const basePct = run.base.hp / Math.max(1, run.base.maxHp);
      if (run.mode === 'rush') {
        if (result === 'victory') {
          const e = run.etapes[run.i], ch = PA.Champions.DEFS[e.age][e.k];
          const m = basePct >= 0.5 ? 3 : 2;
          const neuve = this.donner(meta, ch.id, m);
          run.medailles.push({ ch, m, neuve, t: b.time });
          run.i++;
          if (run.i < run.etapes.length) return PA.UI.showRushEtape(run, b, this.choixRecompenses(run));
        }
        return this.finRush(run, result);
      }
      // défi du jour
      const s = this.etatDefi(meta);
      let score = null, record = false, gain = 0;
      if (result === 'victory') {
        score = { t: Math.round(b.time), base: Math.round(basePct * 100) };
        const m = s.meilleur;
        if (!m || score.t < m.t || (score.t === m.t && score.base > m.base)) { s.meilleur = score; record = true; }
        if (s.dernierReussi !== s.jour) {
          s.serie = s.dernierReussi === hier() ? s.serie + 1 : 1;
          s.dernierReussi = s.jour;
        }
        if (s.recompense !== s.jour) { s.recompense = s.jour; gain = PA.Meta.bank(meta, this.recompenseDefi(meta)); }
      }
      PA.Meta.save(meta);
      PA.UI.showDefiFin({ result, defi: run.defi, score, record, gain, etat: s, phase: b.phase, temps: b.time });
    },
    finRush(run, result) {
      const meta = PA.Game.meta;
      const r = meta.rush = Object.assign({ best: 0, temps: null, complets: 0 }, meta.rush || {});
      const n = run.medailles.length, complet = n >= run.etapes.length;
      let record = false;
      if (n > r.best || (n === r.best && n > 0 && (r.temps == null || run.temps < r.temps))) { r.best = n; r.temps = Math.round(run.temps); record = true; }
      if (complet) r.complets++;
      PA.Meta.save(meta);
      PA.UI.showRushFin({ run, result, complet, record, rec: r });
    },
    choixRecompenses(run) {
      // Les récompenses d'une run normale, sans le butin (l'or est remis à un montant fixe à chaque boss).
      let pool = C.relics.filter(r => !(r.instant && r.instant.gold));
      const mine = C.relics.find(r => r.element && run.relics.includes(r.id));
      if (mine) { const lvl = run.relics.filter(id => id === mine.id).length; pool = pool.filter(r => !r.element || (r === mine && lvl < PA.elementMax(r.element))); }
      if (run.base.hp >= run.base.maxHp * 0.85) pool = pool.filter(r => r.id !== 'reparations');
      const out = [];
      while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
      return out;
    },
    // Récompense choisie entre deux boss : on l'applique, la base récupère 25 %, et on enchaîne.
    choisirRush(id) {
      const game = PA.Game, run = game.run, r = C.relics.find(x => x.id === id);
      if (r && r.mod) { run.relics.push(id); const old = run.base.maxHp; game.refreshBaseMax(); if (run.base.maxHp > old) run.base.hp += run.base.maxHp - old; }
      if (r && r.instant && r.instant.heal) run.base.hp = Math.min(run.base.maxHp, run.base.hp + run.base.maxHp * r.instant.heal);
      run.base.hp = Math.min(run.base.maxHp, run.base.hp + run.base.maxHp * 0.25);
      this.combatRush(false);
    },

    // Sauvegardes d'avant la galerie : les 3 champions de chaque âge dont le boss a déjà été battu
    // sont révélés (bronze), et un assaut déjà atteint ouvre le boss rush.
    migrer(meta) {
      if (meta.champsV) return;
      meta.champs = meta.champs || {};
      const ages = Math.min(C.ages.length, Math.floor((meta.bestLevel || 0) / C.levels.perAge));
      for (let a = 0; a < ages; a++) for (const d of PA.Champions.DEFS[a] || []) if (!meta.champs[d.id]) meta.champs[d.id] = 1;
      if (meta.bestWave > 0) meta.rushOuvert = true;
      meta.champsV = 1;
    },
  };

  function pick(w) {
    const tot = w.reduce((s, x) => s + x, 0);
    let r = Math.random() * tot;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return w.length - 1;
  }

  PA.Modes = Modes;
})();

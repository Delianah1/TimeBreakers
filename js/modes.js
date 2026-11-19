/* =========================================================================
   MODES À PART : boss rush et défi du jour (19 novembre).

   GALERIE DES CHAMPIONS (meta.champs) : { id du champion: médaille }
     1 bronze : vaincu dans une vraie partie (il entre alors dans le boss rush)
     2 argent : vaincu dans le boss rush
     3 or     : vaincu dans le boss rush, base encore au-dessus de 50 %

   BOSS RUSH : débloqué par un premier assaut final. Rien que des boss : un combat par âge, dans l'ordre,
   contre ses trois champions l'un après l'autre (pas d'unités ordinaires, base ennemie intouchable, sans
   tourelle). Ton armée a l'âge des champions, l'or est remis à un montant fixe et coule un peu chaque
   seconde ; entre deux âges : une récompense au choix et +25 % de PV pour la base. Des records, pas de prestige.

   DÉFI DU JOUR : le même pour tout le monde ce jour-là (tiré à partir de la date), un jour sur deux de chaque sorte.
   Il ne tient compte ni de tes améliorations ni de tes élites, et une règle change chaque jour.
     - survie : tu pars à un âge donné. 1) Survivre : la base ennemie est intouchable et envoie des unités
       de plusieurs âges. 2) La porte se ferme : plus de renforts, va détruire sa base.
     - course : tu pars du Jurassique comme une vraie partie et tu évolues. En face, un âge plus haut :
       trois unités de trois âges différents, une tourelle d'un autre âge, un champion de temps en temps.
       Détruis sa base le plus vite possible.
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
  // Boss rush : chaque combat commence avec or × le minimum d'un début de niveau, plus une tourelle offerte ;
  // revenu : or par seconde (part de ce même minimum) ; premier / pause : secondes avant le premier champion
  // et entre la mort de l'un et l'arrivée du suivant ; stat : PV et dégâts des champions.
  const RUSH = { or: 2.5, revenu: 1 / 30, premier: 4, pause: 5, stat: 1, statParAge: 0.1 };
  // Défi « course » : l'ennemi suit ta croissance, comme les niveaux d'une vraie partie.
  //  - revenu : celui d'un 1er niveau de TON âge (sans dépasser le sien), qui grandit de 100 % toutes les rampe secondes,
  //    jusqu'à plafond × le revenu d'un 1er niveau de son âge (× breche avec la règle « La brèche ») ; avec celui d'un
  //    niveau de boss, une fois son âge rattrapé, le pilote ne touchait plus sa base (sans plafond, il finissait par sortir une petite
  //    unité par instant devant sa base, et ta mêlée ne l'atteignait plus jamais) ;
  //  - une unité ou le champion d'un âge plus récent que le tien n'arrive que quand tu atteins cet âge, ou au bout
  //    de portes[i] / champPorte secondes si tu traînes (sinon, au pilote, la mêlée de pierre écrasait le Jurassique à 2 min) ;
  //  - poids puis poidsTard (quand les trois unités sont là) : leurs chances d'être choisies ;
  //  - champ1 / champ : premier champion une fois qu'il peut venir, puis délai après la mort du précédent ;
  //  - cadence : secondes minimum entre deux unités (sans elle, riche, l'IA sortait ses petites unités anciennes
  //    à la chaîne devant sa base : 50 minutes de blocage au pilote) ; l'or en trop part dans les unités récentes ;
  //  - base : PV de sa base (× ceux d'un premier niveau de son âge) ; stat : PV et dégâts de ses unités.
  const COURSE = { rampe: 600, plafond: 1, portes: [0, 240, 420], poids: [0.5, 0.32, 0.18], poidsTard: [0.2, 0.35, 0.45],
    cadence: 2.5, breche: 1.4, champPorte: 360, champ1: 30, champ: 120, base: 0.8, stat: 1.05 };

  const Modes = {
    MELANGES, REGLES, SURVIE, RUSH, COURSE,
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
        const r = b.rushB; if (!r) return;
        const m = run.base.hp / Math.max(1, run.base.maxHp) >= 0.5 ? 3 : 2;
        const neuve = this.donner(game.meta, u.def.id, m);
        run.medailles.push({ ch: u.def, m, neuve, t: b.time - r.t0 });
        r.t0 = b.time; r.tues++;
        if (r.tues >= r.total) b.champTue = true;   // les trois champions de l'âge sont tombés
        else game.toast(`${u.def.name} est vaincu ! Champion suivant…`);
        return;
      }
      if (!run.mode && this.donner(game.meta, u.def.id, 1)) game.toast(`${u.def.name} rejoint ta galerie des champions !`);
    },
    // Champions vaincus d'un âge (au moins le bronze).
    vaincus(meta, age) { return (PA.Champions.DEFS[age] || []).map((d, k) => ({ d, k })).filter(o => this.medaille(meta, o.d.id) > 0); },
    nbVaincus(meta) { let n = 0; for (let a = 0; a < C.ages.length; a++) n += this.vaincus(meta, a).length; return n; },

    // ============================================================== boss rush
    rushOuvert(meta) { return !!meta.rushOuvert || PA.DEV; },
    // Une étape par âge, avec tous ses champions dans un ordre tiré au sort.
    rushEtapes() {
      const out = [];
      for (let a = 0; a < C.ages.length; a++) {
        const ks = (PA.Champions.DEFS[a] || []).map((d, k) => k);
        for (let i = ks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; }
        if (ks.length) out.push({ age: a, ks });
      }
      return out;
    },
    nbChampions() { return PA.Champions.DEFS.flat().length; },
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
      run.champions[e.age] = e.ks[0];
      game.playableAges = e.age + 1;               // pas d'évolution : l'armée a l'âge des champions
      game.totalLevels = run.etapes.length;
      game.refreshBaseMax();
      run.base.hp = Math.max(1, Math.round(run.base.maxHp * ratio));
      run.gold = C.economy.minGoldAtLevelStart[e.age] * RUSH.or;
      run.turrets = [{ age: e.age, idx: 0, cd: 0.5 }, null];
      this.combat({ mode: 'level', enemyAge: e.age, levelNumber: run.i + 1, blockIndex: C.levels.perAge - 1, special: 'rush',
        banniere: { title: `${C.ages[e.age].name.toUpperCase()} · ${run.i + 1} / ${run.etapes.length}`, sub: `${e.ks.length} champions à abattre, l’un après l’autre`, color: '#ff8a6a' } });
    },
    // Réglages du combat du rush (appelé par le constructeur du combat) : rien que les champions.
    preparerRush(b) {
      const e = b.run.etapes[b.run.i];
      b.rushB = { file: e.ks.slice(), total: e.ks.length, tues: 0, t: RUSH.premier, t0: 0, actuel: null };
      b.statMult = b.baseStatMult = b.statMult * (RUSH.stat + RUSH.statParAge * b.run.i);   // de plus en plus durs
      b.enemyBase.invulnerable = true;
      b.enemyTurrets = [];
      b.ai.income = 0; b.ai.gold = 0;
      b.isBoss = false;
    },
    majRush(b, dt) {
      const r = b.rushB;
      if (!r.file.length || b.eu.some(u => u.isChampion && !u.dead && !u.clone)) return;
      r.t -= dt;
      if (r.t > 0) return;
      const def = PA.Champions.DEFS[b.enemyAge][r.file[0]];
      if (!b.canSpawn(-1, def.w)) return;
      r.file.shift();
      r.actuel = def; b._champ = def;            // le HUD et les dessins lisent b.champDef
      if (!r.tues) r.t0 = b.time;
      b.spawnEnemy(def, true);
      b.sortUnits();
      r.t = RUSH.pause;
      b.game.toast(`${def.name} entre en scène ! (${r.tues + 1} / ${r.total})`, 'big');
    },

    // ============================================================ défi du jour
    defiOuvert(meta) { return meta.runs >= 1 || PA.DEV; },
    // Le défi d'un jour donné : toujours le même pour une même date.
    // type : seulement pour les essais (forcer 'survie' ou 'course').
    defi(jour, type) {
      jour = jour || aujourdhui();
      const r = hasard(graine('timebreakers-' + jour));
      const pick = l => l[Math.floor(r() * l.length)];
      const nAges = C.ages.length;
      const [a, m, j] = jour.split('-').map(Number);
      const nomJour = JOURS[new Date(a, m - 1, j).getDay()];
      const Jour = nomJour[0].toUpperCase() + nomJour.slice(1);
      type = type || (Math.round(Date.UTC(a, m - 1, j) / 864e5) % 2 ? 'course' : 'survie');   // un jour sur deux
      const regle = pick(REGLES), solo = Math.floor(r() * 3);
      if (type === 'course') {
        const ennemi = r() < 0.55 ? 2 : 3;                               // Antiquité ou Médiéval
        const autres = [...Array(ennemi).keys()];
        while (autres.length > 2) autres.splice(Math.floor(r() * autres.length), 1);
        const ages3 = [...autres, ennemi];                               // trois âges différents, du plus ancien au plus récent
        const unites = ages3.map(ag => ({ age: ag, idx: Math.floor(r() * 3) }));
        const chAge = ages3[1 + Math.floor(r() * 2)];
        const champion = { age: chAge, k: Math.floor(r() * PA.Champions.DEFS[chAge].length) };
        // pas la 3e tourelle d'un âge (onagre, canon…) : avec sa portée et sa zone, au pilote, la base devenait imprenable
        const tourelle = { age: Math.floor(r() * ennemi), idx: Math.floor(r() * 2) };
        return { type, jour, nomJour, age: 0, ennemi, unites, champion, tourelle, regle, solo,
          melange: { nom: 'La course des âges' }, nom: `${Jour} : la course des âges` };
      }
      const age = 1 + Math.floor(r() * Math.min(6, nAges - 4));         // ton âge : Pierre à Moderne
      const avance = 2 + Math.floor(r() * 2);                          // l'ennemi a 2 ou 3 âges d'avance
      const melange = pick(MELANGES);
      return { type, jour, nomJour, age, ennemi: Math.min(nAges - 1, age + avance), melange, regle, solo,
        nom: `${Jour} : ${melange.nom.charAt(0).toLowerCase() + melange.nom.slice(1)}` };
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
    lancerDefi(jour, type) {   // jour, type : seulement pour les essais (outils/pilote-modes.js)
      const game = PA.Game, meta = game.meta, d = this.defi(jour, type);
      const s = this.etatDefi(meta); s.essais++; PA.Meta.save(meta);
      // Méta neutre : ni améliorations, ni élites, ni pouvoirs achetés. Tout le monde part à égalité.
      const neutre = PA.Meta.defaults(meta.difficulty);
      if (d.type === 'course') {
        // Comme une vraie partie : Jurassique, or de départ, un emplacement de tourelle, et on évolue.
        game.run = {
          mode: 'defi', defi: d, metaNeutre: neutre, temps: 0,
          age: 0, xp: 0, gold: C.economy.startGold, base: { hp: 0, maxHp: 0 },
          turrets: d.regle.id === 'or2' ? [] : [null], relics: [],
          level: 1, levelsDone: 0, ppLevels: 0, ppAssault: 0, ppLost: 0, assaultWave: 0, champions: null,
        };
        game.playableAges = Math.min(C.ages.length, d.ennemi + 2);   // on peut dépasser l'ennemi d'un âge
        game.totalLevels = 1;
        game.refreshBaseMax();
        game.run.base.hp = game.run.base.maxHp;
        game.speed = Math.min(game.speed, PA.Meta.maxSpeed(meta));
        this.combat({ mode: 'level', enemyAge: d.ennemi, levelNumber: 1, blockIndex: 0, special: 'defi',
          banniere: { title: 'DÉFI DU JOUR', sub: `La course des âges · ${d.regle.nom}`, sub2: `Pars du Jurassique, évolue et détruis sa base au plus vite`, color: '#7fd6ff' } });
        return;
      }
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
      if (d.type === 'course') {
        b.statMult = b.baseStatMult = L.statMult[0] * b.diffStat * COURSE.stat;
        const hp = Math.round(L.enemyBaseHp[d.ennemi][0] * COURSE.base * (d.regle.id === 'breche' ? 0.5 : 1));
        b.enemyBase = { hp, maxHp: hp, invulnerable: false };
        b.enemyTurrets = [{ age: d.tourelle.age, idx: d.tourelle.idx, cd: 3 }];
        b.ai.gold = L.enemyStartGold[0];
        b.ai.income = L.enemyIncome[0][0];
        b.ai.champT = COURSE.champ1;
        b.isBoss = false; b.rushLeft = 0;
        b.phase = 'course';
        if (d.regle.id === 'or2') b.mods.goldGain += 1;
        if (d.regle.id === 'pouvoir') b.mods.specialCd = Math.max(-0.7, b.mods.specialCd - 0.5);
        return;
      }
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
      if (d.type === 'course') return this.majCourse(b, dt);
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

    // L'IA de la course : trois unités de trois âges (les plus récentes arrivent plus tard), un revenu
    // qui grandit avec le temps, et un champion dès que le précédent est mort depuis un moment.
    majCourse(b, dt) {
      const d = b.defi, ai = b.ai, L = C.levels;
      const age = b.run.age;
      const plafond = L.enemyIncome[d.ennemi][0] * COURSE.plafond;
      ai.income = Math.min(plafond, L.enemyIncome[Math.min(d.ennemi, age)][0] * (1 + b.time / COURSE.rampe)) * (d.regle.id === 'breche' ? COURSE.breche : 1);
      ai.gold += ai.income * dt;
      if (b.time < 2) return;
      const ok = d.unites.map((o, i) => o.age <= age || b.time >= COURSE.portes[i]);
      // une unité devenue permise après coup : on rejette un choix fait avant, pour qu'elle ait sa chance
      if (ai.pick != null && ai.okN !== ok.filter(Boolean).length) ai.pick = null;
      ai.okN = ok.filter(Boolean).length;
      if (ai.pick == null) {
        const tard = ok.every(Boolean);
        const w = (tard ? COURSE.poidsTard : COURSE.poids).map((p, i) => (ok[i] ? p : 0));
        // riche : il garde son or pour la plus récente des unités permises
        const rec = ok.lastIndexOf(true), cr = C.ages[d.unites[rec].age].units[d.unites[rec].idx].cost;
        ai.pick = d.unites[ai.gold >= cr * 2 ? rec : pick(w)];
      }
      ai.cad = (ai.cad || 0) - dt;
      const def = C.ages[ai.pick.age].units[ai.pick.idx];
      if (ai.cad <= 0 && ai.gold >= def.cost && b.eu.length < L.maxEnemyUnits && b.canSpawn(-1, def.w)) {
        ai.gold -= def.cost;
        ai.cad = COURSE.cadence;
        b.spawnEnemy(def, false, null, ai.pick.age);
        ai.pick = null;
        b.sortUnits();
      }
      const enJeu = b.eu.some(u => u.isChampion && !u.dead && !u.clone);
      const chOk = d.champion.age <= age || b.time >= COURSE.champPorte;
      if (!enJeu && chOk) ai.champT -= dt;
      const ch = PA.Champions.DEFS[d.champion.age][d.champion.k];
      if (!enJeu && ai.champT <= 0 && b.canSpawn(-1, ch.w)) {
        b._champ = ch;
        b.spawnEnemy(ch, true, null, d.champion.age);
        ai.champT = COURSE.champ;
        b.game.toast(`${ch.name} entre en scène !`, 'big');
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
        if (result === 'victory') {   // les médailles sont données à chaque champion abattu (championTue)
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
      // v2 : le record compte des champions (33), plus des boss (un par âge) : les anciens records repartent de zéro.
      const r = meta.rush = Object.assign({ best: 0, temps: null, complets: 0 }, meta.rush && meta.rush.v === 2 ? meta.rush : {}, { v: 2 });
      const n = run.medailles.length, complet = n >= this.nbChampions();
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

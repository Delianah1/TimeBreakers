/* =========================================================================
   MÉTA-PROGRESSION : sauvegarde du prestige et calcul des bonus.
   ========================================================================= */
window.PA = window.PA || {};

PA.Meta = {
  KEY: 'front-des-ages-meta-v1',
  PREF: 'front-des-ages-difficulte',

  // Chaque difficulté est une campagne à part, avec sa propre sauvegarde.
  // « facile » garde la clé d'origine : les sauvegardes d'avant les difficultés y restent.
  keyFor(difficulty) { return difficulty && difficulty !== 'facile' ? `${this.KEY}-${difficulty}` : this.KEY; },

  // Difficulté choisie la dernière fois (facile par défaut).
  loadPref() {
    try {
      const d = localStorage.getItem(this.PREF);
      if (d && PA.CONFIG.difficulties[d]) return d;
    } catch (e) { /* ignore */ }
    return 'facile';
  },
  savePref(difficulty) {
    try { localStorage.setItem(this.PREF, difficulty); } catch (e) { /* ignore */ }
  },

  defaults(difficulty) {
    return { balance: 0, totalEarned: 0, upgrades: {}, agesUnlocked: 0, runs: 0, bestWave: 0, bestLevel: 0,
      elites: {},     // unités d'élite débloquées : { id de l'unité: true }
      powers: {},     // pouvoirs ultimes achetés : { id du pouvoir: true } (js/pouvoirs.js)
      powerPick: {},  // pouvoir équipé par âge : { id de l'âge: id du pouvoir } (rien = le pouvoir de contrôle)
      maxSpeed: 1,    // vitesse de jeu la plus haute achetée (1, 2 ou 3)
      agesV: 2,       // version de la liste des âges (2 = 11 âges, avec Antiquité et Vapeur)
      difficulty: difficulty || 'facile' };   // la campagne à laquelle appartient cette sauvegarde
  },

  load(difficulty) {
    difficulty = difficulty || 'facile';
    try {
      const raw = localStorage.getItem(this.keyFor(difficulty));
      if (raw) {
        const meta = this.migrate(JSON.parse(raw));
        meta.difficulty = difficulty;
        return meta;
      }
    } catch (e) { /* stockage indisponible : on joue sans sauvegarde */ }
    return this.defaults(difficulty);
  },

  // Sauvegardes de la liste à 9 âges : l'Antiquité (3e) et la Vapeur (6e) ont été insérées.
  // Le nombre d'âges débloqués est recalé pour garder tous les âges déjà achetés
  // (les âges insérés en dessous sont offerts). Les élites sont rangées par id : rien à faire.
  migrate(saved) {
    const meta = Object.assign(this.defaults(), saved);
    if (!saved.agesV) {
      const n = saved.agesUnlocked || 0;
      meta.agesUnlocked = n <= 2 ? n : n <= 4 ? n + 1 : n + 2;
      meta.agesV = 2;
    }
    return meta;
  },

  save(meta) {
    try { localStorage.setItem(this.keyFor(meta.difficulty), JSON.stringify(meta)); } catch (e) { /* ignore */ }
  },

  // Efface la progression d'une seule difficulté.
  reset(difficulty) {
    try { localStorage.removeItem(this.keyFor(difficulty)); } catch (e) { /* ignore */ }
    return this.defaults(difficulty);
  },

  level(meta, id) { return meta.upgrades[id] || 0; },

  // Met des points de prestige à l'abri (ils ne peuvent plus être perdus).
  bank(meta, pp) {
    const n = Math.max(0, Math.round(pp));
    meta.balance += n;
    meta.totalEarned += n;
    this.save(meta);
    return n;
  },

  // Âges débloqués d'office (coût 0 en tête de liste).
  freeAgeCount() {
    const c = PA.CONFIG.prestige.ageCosts;
    let n = 0;
    while (n < c.length && c[n] === 0) n++;
    return n;
  },

  // Nombre d'âges débloqués (achetés dans l'ordre au camp).
  unlockedAgeCount(meta) {
    return Math.max(meta.agesUnlocked || 0, this.freeAgeCount());
  },

  // Prix du prochain âge à débloquer, ou null s'il n'y en a plus.
  nextAgeCost(meta) {
    const c = PA.CONFIG.prestige.ageCosts;
    const i = this.unlockedAgeCount(meta);
    return i < c.length ? c[i] : null;
  },

  // Achète le prochain âge. Refusé si son contenu n'existe pas encore dans le jeu.
  buyAge(meta) {
    const i = this.unlockedAgeCount(meta);
    const cost = this.nextAgeCost(meta);
    if (cost == null || i >= PA.CONFIG.ages.length || meta.balance < cost) return false;
    meta.balance -= cost;
    meta.agesUnlocked = i + 1;
    this.save(meta);
    return true;
  },

  // Âges réellement jouables = débloqués ET existants dans le contenu actuel.
  playableAgeCount(meta) {
    return Math.min(this.unlockedAgeCount(meta), PA.CONFIG.ages.length);
  },

  lossRate(meta) {
    const up = PA.CONFIG.upgrades.find(u => u.id === 'treasury');
    return up.lossByLevel[this.level(meta, 'treasury')];
  },

  // Niveau maximum achetable aujourd'hui : il monte avec les âges débloqués (table upgradeCapByAges).
  upgradeLimit(meta, up) {
    const caps = PA.CONFIG.prestige.upgradeCapByAges;
    const n = Math.min(this.unlockedAgeCount(meta), caps.length - 1);
    return Math.min(up.max, caps[n]);
  },

  // Prix du prochain niveau, ou null si l'amélioration est au max (ou au plafond actuel).
  upgradeCost(meta, up) {
    const lvl = this.level(meta, up.id);
    return lvl >= this.upgradeLimit(meta, up) ? null : up.costs[lvl];
  },

  buyUpgrade(meta, id) {
    const up = PA.CONFIG.upgrades.find(u => u.id === id);
    if (!up) return false;
    const cost = this.upgradeCost(meta, up);
    if (cost == null || meta.balance < cost) return false;
    meta.balance -= cost;
    meta.upgrades[id] = this.level(meta, id) + 1;
    this.save(meta);
    return true;
  },

  // ------------------------------------------------------- unités d'élite
  eliteDef(ageIdx) { return PA.CONFIG.ages[ageIdx].units.find(u => u.elite) || null; },
  hasElite(meta, ageIdx) {
    const def = this.eliteDef(ageIdx);
    return !!(def && meta.elites && meta.elites[def.id]);
  },
  eliteCost(ageIdx) { return PA.CONFIG.prestige.eliteCosts[ageIdx]; },
  // Achetable si l'âge est débloqué (et jouable) et que l'unité ne l'est pas encore.
  canBuyElite(meta, ageIdx) {
    return ageIdx < this.playableAgeCount(meta) && !!this.eliteDef(ageIdx) && !this.hasElite(meta, ageIdx);
  },
  buyElite(meta, ageIdx) {
    const cost = this.eliteCost(ageIdx);
    if (!this.canBuyElite(meta, ageIdx) || meta.balance < cost) return false;
    meta.balance -= cost;
    meta.elites = Object.assign({}, meta.elites, { [this.eliteDef(ageIdx).id]: true });
    this.save(meta);
    return true;
  },

  // --------------------------------------------------------- vitesses de jeu
  maxSpeed(meta) { return Math.max(1, meta.maxSpeed || 1); },
  // Prix de la prochaine vitesse (×2 puis ×3), ou null si tout est acheté.
  nextSpeedCost(meta) {
    const c = PA.CONFIG.prestige.speedCosts;
    const i = this.maxSpeed(meta) - 1;
    return i < c.length ? c[i] : null;
  },
  buySpeed(meta) {
    const cost = this.nextSpeedCost(meta);
    if (cost == null || meta.balance < cost) return false;
    meta.balance -= cost;
    meta.maxSpeed = this.maxSpeed(meta) + 1;
    this.save(meta);
    return true;
  },
};

// Additionne tous les bonus (améliorations permanentes + reliques de la run).
// Les bonus sont additifs : multiplicateur final = 1 + somme.
// Réglages de la difficulté d'une sauvegarde (voir CONFIG.difficulties).
PA.diff = function (meta) {
  const D = PA.CONFIG.difficulties;
  return D[meta && meta.difficulty] || D.facile;
};

PA.computeMods = function (meta, relicIds) {
  const m = {
    meleeDmg: 0, rangedDmg: 0, allDmg: 0, unitHp: 0, trainTime: 0, xpGain: 0, goldGain: 0,
    turretDmg: 0, turretRange: 0, unitCost: 0, specialCd: 0, baseMaxHp: 0, startGold: 0,
    passiveGold: 0,   // niveaux de « Collecteurs » (or/s = niveaux × passiveGoldPerLevel[âge])
    ice: 0, fire: 0, shock: 0,   // niveau de chaque élément (reliques)
  };
  for (const up of PA.CONFIG.upgrades) {
    const lvl = PA.Meta.level(meta, up.id);
    if (!up.per || !lvl) continue;
    for (const k in up.per) m[k] += up.per[k] * lvl;
  }
  for (const id of relicIds || []) {
    const r = PA.CONFIG.relics.find(x => x.id === id);
    if (r && r.mod) for (const k in r.mod) m[k] += r.mod[k];
  }
  // Garde-fous : on ne descend jamais sous 30 % d'un coût ou d'un temps.
  m.trainTime = Math.max(m.trainTime, -0.7);
  m.unitCost = Math.max(m.unitCost, -0.7);
  m.specialCd = Math.max(m.specialCd, -0.7);
  for (const k in PA.CONFIG.elements) m[k] = Math.min(m[k], PA.elementMax(k));
  return m;
};

// ---------------------------------------------------------------- éléments
PA.elementMax = function (key) { return PA.CONFIG.elements[key].max; };

// Effet d'un élément à un niveau donné (1 à 3), en une phrase.
PA.elementDesc = function (key, lvl) {
  const E = PA.CONFIG.elements[key];
  const i = Math.max(1, lvl) - 1;
  const pct = x => Math.round(x * 100) + ' %';
  if (key === 'ice') return `Tes unités et tourelles ralentissent leurs cibles de ${pct(E.slow[i])} (déplacement et attaques) pendant ${E.duration} s. Moitié moins sur les champions.`;
  if (key === 'fire') return `Tes unités et tourelles enflamment leurs cibles : elles brûlent pour ${pct(E.burn[i])} des dégâts de chaque coup, en ${E.duration} s.`;
  const n = E.targets[i];
  return `Les tirs simples et coups de tes unités et tourelles rebondissent sur ${n} ennemi${n > 1 ? 's' : ''} proche${n > 1 ? 's' : ''}, à ${pct(E.share[i])} des dégâts.`;
};

// Nom et description d'une relique telle qu'on la propose (le niveau d'un élément dépend de la run).
PA.relicText = function (r, relicIds) {
  if (!r.element) return { name: r.name, desc: r.desc };
  const have = (relicIds || []).filter(id => id === r.id).length;
  const lvl = have + 1, max = PA.elementMax(r.element);
  return {
    name: `${r.name}${lvl > 1 ? ` niv. ${lvl}` : ''}`,
    desc: (lvl > 1 ? `Niveau ${lvl}/${max}. ` : `Élément de la run (les autres ne seront plus proposés). `) + PA.elementDesc(r.element, lvl),
  };
};

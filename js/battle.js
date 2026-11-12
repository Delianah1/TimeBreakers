/* =========================================================================
   MOTEUR DE COMBAT : une ligne, deux bases, des unités qui avancent seules.
   side = 1 pour le joueur (à gauche, avance vers la droite)
   side = -1 pour l'ennemi (à droite, avance vers la gauche)
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const W = C.world;
  const GROUND = W.groundY;
  const PLAYER_FRONT = W.baseWidth;
  const ENEMY_FRONT = W.width - W.baseWidth;
  const GAP = 4;           // espace minimal entre deux unités alliées
  const SLOT_DY = 30;      // écart vertical entre deux emplacements de tourelle

  const rand = (a, b) => a + Math.random() * (b - a);

  // Effets d'impact du pouvoir spécial, selon son apparence
  const DROP_FX = {
    rock: { color: '#a08f7a', sparks: 8, shake: 0.08 },
    arrow: { color: '#e8d9b0', sparks: 3 },
    cannonball: { color: '#8a7d6a', sparks: 8, shake: 0.08, ring: true },
    bomb: { color: '#ffb057', sparks: 10, shake: 0.12, ring: true },
    beam: { color: '#9fe8ff', sparks: 10, shake: 0.1, ring: true },
    meteor: { color: '#ff7a2a', sparks: 12, shake: 0.12, ring: true },
    barrel: { color: '#ff9a3c', sparks: 12, shake: 0.12, ring: true },
    fist: { color: '#ffe066', sparks: 10, shake: 0.14, ring: true },
    saucer: { color: '#8dff7a', sparks: 10, shake: 0.1, ring: true },
    steambomb: { color: '#ffc27a', sparks: 12, shake: 0.12, ring: true },
  };
  // Couleur des explosions à zone, selon le projectile
  const SPLASH_COLOR = { fireball: '#ff9a3c', oil: '#3b2a1a', mortar: '#ffb057', rocket: '#ff8a3c', plasma: '#7ef0c8',
    lava: '#ff6a2a', barrel: '#ff9a3c', lightning: '#bfe8ff', spore: '#9cff5a', flame: '#ff7a22', psi: '#d49bff',
    jar: '#c9773a', steambomb: '#ffc27a', boiler: '#e8e2da' };

  function pickWeighted(weights) {
    const total = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  class Unit {
    constructor(def, side, hp, dmg, ageIdx, isChampion) {
      this.def = def;
      this.side = side;
      this.kind = def.kind;
      this.cost = def.cost;
      this.w = def.w;
      this.h = def.h;
      this.speed = def.speed;
      this.interval = def.interval;
      this.reach = def.kind === 'ranged' ? def.range : def.reach;
      this.hp = this.maxHp = hp;
      this.dmg = dmg;
      this.ageIdx = ageIdx;
      this.isChampion = !!isChampion;
      const spawnX = side === 1 ? PLAYER_FRONT + this.w / 2 + 2 : ENEMY_FRONT - this.w / 2 - 2;
      this.x = spawnX;
      this.cd = rand(0.1, 0.4);
      this.walk = Math.random() * 6;
      this.moving = false;
      this.attackAnim = 0;
      this.flash = 0;
      this.burn = null;    // { dps, t } : brûlure en cours
      this.chill = null;   // { k, t } : ralentissement (Glace), k = part de vitesse perdue
      this.dead = false;
    }
    get front() { return this.x + this.side * this.w / 2; }
  }

  class Battle {
    /**
     * opts.mode       : 'level' ou 'assault'
     * opts.enemyAge   : index de l'âge des ennemis
     * opts.levelNumber: numéro global du niveau (1, 2, 3…)
     * opts.blockIndex : position dans le bloc de l'âge (0 à 4)
     */
    constructor(game, opts) {
      this.game = game;
      this.run = game.run;
      this.meta = game.meta;
      this.mode = opts.mode;
      this.enemyAge = opts.enemyAge;
      this.levelNumber = opts.levelNumber || 0;
      this.blockIndex = opts.blockIndex || 0;
      this.mods = PA.computeMods(this.meta, this.run.relics);
      // Élément de la run (une seule affinité), ou null.
      this.element = Object.keys(C.elements).find(k => this.mods[k] > 0) || null;

      this.pu = [];           // unités du joueur (triées de l'avant vers l'arrière)
      this.eu = [];           // unités ennemies (idem)
      this.projectiles = [];
      this.drops = [];        // projectiles du pouvoir spécial
      this.sweeps = [];       // pouvoir « charge » : bêtes qui traversent la ligne
      this.airship = null;    // pouvoir « tapis de bombes » : le dirigeable (visuel)
      this.particles = [];
      this.texts = [];
      this.queue = [];

      this.time = 0;
      this.specialCd = 10;
      this.over = false;
      this.result = null;
      this.kills = 0;
      this.killsPP = 0;       // points de prestige accumulés pendant ce niveau (pas encore à l'abri)
      this.cagnotte = 0;      // cagnotte de l'assaut final
      this.shake = 0;

      const L = C.levels;
      const D = this.diff = PA.diff(this.meta);   // réglages de la difficulté (facile / difficile)
      // Puissance des ennemis selon la difficulté : une base, plus un supplément par âge ennemi
      // (sans lui, les améliorations de prestige effacent la difficulté dès la deuxième run).
      this.diffStat = D.enemyStat + (D.enemyStatPerAge || 0) * this.enemyAge;
      if (this.mode === 'level') {
        const a = this.enemyAge, b = this.blockIndex;
        this.statMult = L.statMult[b] * this.diffStat;
        const hp = L.enemyBaseHp[a][b];
        this.enemyBase = { hp, maxHp: hp, invulnerable: false };
        this.enemyTurrets = (L.enemyTurrets[a][b] || []).map(idx => ({ age: a, idx, cd: 1 }));
        this.isBoss = b + 1 === L.bossLevel;
        // Ruée d'ouverture : les premières unités ennemies du niveau sont « enragées » (voir levels.rush).
        // Pas de ruée au tout premier niveau de la run : le temps de prendre ses marques.
        this.rushLeft = L.rush && D.rush && this.levelNumber > 1 ? L.rush.units[b] || 0 : 0;
        this.rushTotal = this.rushLeft;
        this.ai = { gold: L.enemyStartGold[a], income: L.enemyIncome[a][b], pick: null, champT: L.championFirst };
        const P = C.prestige;
        this.killsPPCap = (P.levelBase + P.levelPerIndex * this.levelNumber) * P.killPPCap;
        // Renforts (anti-farm) : palier 0 au début, puis +1 toutes les X secondes.
        this.reinf = 0;
        this.reinfFlash = 0;
        this.baseStatMult = this.statMult;
        this.baseIncome = this.ai.income;
      } else {
        this.statMult = C.assault.startStatMult * this.diffStat;
        this.enemyBase = { hp: 1, maxHp: 1, invulnerable: true };
        this.enemyTurrets = [];
        this.isBoss = false;
        this.wave = { n: 0, state: 'pause', timer: 3, toSpawn: [], spawnT: 0, statMult: 1 };
      }
    }

    // ---------------------------------------------------------------- outils
    get playerAge() { return C.ages[this.run.age]; }
    get enemyAgeDef() { return C.ages[this.enemyAge]; }

    // Or par seconde, uniquement grâce à l'amélioration « Collecteurs ».
    passiveGold() { return this.mods.passiveGold * C.economy.passiveGoldPerLevel[this.run.age]; }
    // Les unités coûtent ×3 à chaque âge : sans ce facteur, le prestige des kills exploserait.
    killValue() { return C.prestige.killValueByAge[this.enemyAge] ?? 1; }

    unitCost(def) { return Math.max(1, Math.round(def.cost * (1 + this.mods.unitCost))); }
    trainTime(def) { return def.train * (1 + this.mods.trainTime); }
    specialCooldown() { return this.playerAge.special.cooldown * (1 + this.mods.specialCd); }
    assaultMult(waveN) {
      const n = waveN == null ? this.wave.n : waveN;
      return 1 + C.assault.multiplierStep * Math.floor(Math.max(0, n - 1) / C.assault.windowEvery);
    }

    playerStats(def) {
      const m = this.mods;
      const dmgMult = 1 + m.allDmg + (def.kind === 'melee' ? m.meleeDmg : m.rangedDmg);
      return { hp: def.hp * (1 + m.unitHp), dmg: def.dmg * dmgMult };
    }

    turretPos(side, slot) {
      return { x: side === 1 ? 92 : W.width - 92, y: GROUND - 34 - slot * SLOT_DY };
    }

    canSpawn(side, w) {
      const list = side === 1 ? this.pu : this.eu;
      if (!list.length) return true;
      const rear = list[list.length - 1];
      const spawnX = side === 1 ? PLAYER_FRONT + w / 2 + 2 : ENEMY_FRONT - w / 2 - 2;
      const space = side === 1
        ? (rear.x - rear.w / 2) - (spawnX + w / 2)
        : (spawnX - w / 2) - (rear.x + rear.w / 2);
      return space >= GAP;
    }

    sortUnits() {
      this.pu.sort((a, b) => b.x - a.x);
      this.eu.sort((a, b) => a.x - b.x);
    }

    // ------------------------------------------------------- actions joueur
    buyUnit(idx) {
      if (this.over) return;
      const def = this.playerAge.units[idx];
      if (!def) return;
      if (def.elite && !PA.Meta.hasElite(this.meta, this.run.age)) {
        return this.game.toast(`${def.name} : unité d’élite à débloquer au camp (${PA.Meta.eliteCost(this.run.age).toLocaleString('fr-FR')} ✦)`);
      }
      const cost = this.unitCost(def);
      if (this.queue.length >= C.economy.queueSize) return this.game.toast('File d’entraînement pleine');
      if (this.run.gold < cost) return this.game.toast('Pas assez d’or');
      this.run.gold -= cost;
      const t = this.trainTime(def);
      this.queue.push({ def, age: this.run.age, t, total: t });
    }

    buyTurret(idx) {
      if (this.over) return;
      const def = this.playerAge.turrets[idx];
      if (!def) return;
      const slot = this.run.turrets.findIndex(t => !t);
      if (slot < 0) return this.game.toast('Aucun emplacement libre : achète un emplacement ou vends une tourelle');
      if (this.run.gold < def.cost) return this.game.toast('Pas assez d’or');
      this.run.gold -= def.cost;
      this.run.turrets[slot] = { age: this.run.age, idx, cd: 0.5 };
    }

    sellTurret(slot) {
      const t = this.run.turrets[slot];
      if (!t || this.over) return;
      const def = C.ages[t.age].turrets[t.idx];
      this.run.gold += Math.round(def.cost * C.economy.turretSellRefund);
      this.run.turrets[slot] = null;
    }

    slotCost() {
      const n = this.run.turrets.length;
      return n >= 4 ? null : C.economy.slotCosts[n - 1];
    }

    buySlot() {
      const cost = this.slotCost();
      if (cost == null || this.over) return;
      if (this.run.gold < cost) return this.game.toast('Pas assez d’or');
      this.run.gold -= cost;
      this.run.turrets.push(null);
    }

    canEvolve() {
      return this.run.age + 1 < this.game.playableAges && this.run.xp >= C.evolveXp[this.run.age];
    }

    evolve() {
      if (!this.canEvolve() || this.over) return;
      const oldMax = this.run.base.maxHp;
      this.run.age++;
      this.game.refreshBaseMax();
      this.run.base.hp += this.run.base.maxHp - oldMax;
      this.shake = 0.4;
      for (let i = 0; i < 40; i++) {
        this.particles.push({ x: rand(0, PLAYER_FRONT), y: rand(GROUND - 160, GROUND), vx: rand(-60, 60), vy: rand(-160, -40),
          life: rand(0.6, 1.2), max: 1.2, color: '#ffd76a', size: rand(2, 5) });
      }
      this.game.toast(`Évolution : ${this.playerAge.name} !`, 'big');
      this.game.onEvolve();
    }

    useSpecial() {
      if (this.specialCd > 0 || this.over) return;
      const sp = this.playerAge.special;
      this.specialCd = this.specialCooldown();
      const dmg = sp.dmg * (1 + this.mods.allDmg);
      if (sp.sweep) {
        // Charge : les bêtes partent l'une après l'autre de ta base et traversent toute la ligne.
        for (let i = 0; i < sp.count; i++) {
          this.sweeps.push({ delay: i * sp.duration / sp.count + rand(0, 0.15), x: PLAYER_FRONT - 30, speed: sp.speed, dmg,
            knock: sp.knockback || 0, look: sp.look, hit: new Set(), walk: rand(0, 6), dead: false });
        }
        return;
      }
      if (sp.carpet) {
        // Tapis de bombes : le dirigeable vole de ton front au front ennemi et lâche ses bombes en chemin.
        const x0 = PLAYER_FRONT + 90, x1 = ENEMY_FRONT - 20;
        this.airship = { t: 0, dur: sp.duration, x0, x1 };
        for (let i = 0; i < sp.count; i++) {
          const k = (i + 0.5) / sp.count;
          this.drops.push({ delay: k * sp.duration, x: null, fixX: x0 + (x1 - x0) * k + rand(-12, 12), y: 124, vy: sp.speed || 600,
            dmg, radius: sp.radius, look: sp.look, dead: false });
        }
        return;
      }
      for (let i = 0; i < sp.count; i++) {
        this.drops.push({ delay: rand(0, sp.duration), x: null, y: -30, vy: sp.speed || (sp.look === 'rock' ? 620 : 900),
          dmg, radius: sp.radius, look: sp.look, dead: false });
      }
    }

    // --------------------------------------------------------------- spawns
    spawnPlayer(def, age) {
      const s = this.playerStats(def);
      this.pu.push(new Unit(def, 1, s.hp, s.dmg, age, false));
    }

    spawnEnemy(def, isChampion, statMult) {
      const m = statMult || this.statMult;
      const u = new Unit(def, -1, def.hp * m, def.dmg * m, this.enemyAge, isChampion);
      this.eu.push(u);
      return u;
    }

    // ----------------------------------------------------------------- dégâts
    // quiet : pas de flash blanc (brûlure, sinon l'unité clignoterait en continu)
    damageUnit(u, dmg, quiet) {
      if (u.dead) return;
      u.hp -= dmg;
      if (!quiet) u.flash = 0.1;
      if (u.hp <= 0) {
        u.dead = true;
        this.onUnitDeath(u);
      }
    }

    damageBase(side, dmg) {
      if (side === 1) {
        this.run.base.hp -= dmg;
        this.shake = Math.max(this.shake, 0.12);
      } else if (!this.enemyBase.invulnerable) {
        this.enemyBase.hp -= dmg;
      }
      const x = side === 1 ? PLAYER_FRONT - 10 : ENEMY_FRONT + 10;
      this.spark(x, GROUND - rand(20, 80), '#e8d9b0', 4);
    }

    onUnitDeath(u) {
      const m = this.mods;
      const e = C.economy;
      if (u.side === -1) {
        const gold = u.cost * e.killGoldMult * (1 + m.goldGain);
        this.run.gold += gold;
        this.run.xp += u.cost * e.killXpMult * (1 + m.xpGain);
        this.kills++;
        if (this.mode === 'level') {
          if (this.killsPP < this.killsPPCap) {
            this.killsPP = Math.min(this.killsPPCap, this.killsPP + u.cost * C.prestige.ppPerKillCost * this.killValue());
            if (this.killsPP >= this.killsPPCap) this.game.toast('Plafond de prestige atteint : termine le niveau !');
          }
        } else {
          const pp = u.cost * C.assault.ppPerCost * this.assaultMult() * this.killValue();
          this.cagnotte += pp;
          this.texts.push({ x: u.x, y: GROUND - u.h - 30, text: `+${pp.toFixed(1)} ✦`, life: 1.2, color: '#c9a7ff' });
        }
        this.texts.push({ x: u.x, y: GROUND - u.h - 14, text: `+${Math.round(gold)}`, life: 1, color: '#ffd76a' });
      } else {
        this.run.xp += u.cost * e.ownDeathXpMult * (1 + m.xpGain);
      }
      for (let i = 0; i < 10; i++) {
        this.particles.push({ x: u.x + rand(-u.w / 2, u.w / 2), y: GROUND - rand(4, u.h * 0.7), vx: rand(-70, 70), vy: rand(-140, -20),
          life: rand(0.4, 0.8), max: 0.8, color: u.side === 1 ? '#6f8fd8' : '#d36a5f', size: rand(2, 4) });
      }
    }

    spark(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        this.particles.push({ x, y, vx: rand(-90, 90), vy: rand(-120, 30), life: rand(0.15, 0.35), max: 0.35, color, size: rand(1.5, 3) });
      }
    }

    // ------------------------------------------------------------ mise à jour
    update(dt) {
      if (this.over) return;
      this.time += dt;
      this.sortUnits();

      this.run.gold += this.passiveGold() * dt;
      if (this.specialCd > 0) this.specialCd = Math.max(0, this.specialCd - dt);
      this.updateQueue(dt);
      if (this.mode === 'level') this.updateAI(dt);
      else this.updateWaves(dt);

      this.updateUnits(this.pu, this.eu, 1, dt);
      this.updateUnits(this.eu, this.pu, -1, dt);
      this.updateTurrets(1, this.run.turrets, dt);
      this.updateTurrets(-1, this.enemyTurrets, dt);
      this.updateProjectiles(dt);
      this.updateDrops(dt);
      this.updateFx(dt);

      this.pu = this.pu.filter(u => !u.dead);
      this.eu = this.eu.filter(u => !u.dead);

      if (this.run.base.hp <= 0) {
        this.run.base.hp = 0;
        this.end('defeat');
      } else if (this.mode === 'level' && this.enemyBase.hp <= 0) {
        this.enemyBase.hp = 0;
        this.end('victory');
      }
    }

    end(result) {
      this.over = true;
      this.result = result;
      this.game.onBattleEnd(this, result);
    }

    updateQueue(dt) {
      const q = this.queue[0];
      if (!q) return;
      q.t -= dt;
      if (q.t <= 0) {
        q.t = 0;
        if (this.canSpawn(1, q.def.w)) {
          this.spawnPlayer(q.def, q.age);
          this.queue.shift();
          this.sortUnits();
        }
      }
    }

    // Palier de renforts atteint à l'instant t (0 = pas encore de renforts).
    reinfLevelAt(t) {
      const R = C.levels.reinforcements;
      return t < R.startAfter ? 0 : 1 + Math.floor((t - R.startAfter) / R.every);
    }

    updateReinforcements(dt) {
      const R = C.levels.reinforcements;
      if (this.reinfFlash > 0) this.reinfFlash = Math.max(0, this.reinfFlash - dt);
      const lvl = this.reinfLevelAt(this.time);
      if (lvl === this.reinf) return;
      this.reinf = lvl;
      // Touche les unités qui apparaissent à partir de maintenant et les tourelles ennemies.
      this.statMult = this.baseStatMult * (1 + R.statPerStep * lvl);
      this.ai.income = this.baseIncome * (1 + R.incomePerStep * lvl);
      this.reinfFlash = 1.2;
      this.shake = Math.max(this.shake, 0.15);
      this.game.toast(lvl === 1
        ? 'Renforts ennemis ! Plus le niveau dure, plus ils sont forts'
        : `Renforts ennemis : +${Math.round(R.statPerStep * lvl * 100)} % de puissance`, 'big');
    }

    updateAI(dt) {
      const L = C.levels;
      const ai = this.ai;
      this.updateReinforcements(dt);
      ai.gold += ai.income * dt;
      if (this.time < 2) return;
      const units = this.enemyAgeDef.units;
      // Ruée d'ouverture : quelques unités de base enragées (plus rapides, plus solides) partent d'abord,
      // gratuitement. Elles viennent se battre devant ta base au lieu du milieu du terrain.
      // L'IA garde son or pendant ce temps : ses achats normaux suivent juste derrière.
      if (this.rushLeft > 0) {
        const R = L.rush;
        const def = units[R.pattern[(this.rushTotal - this.rushLeft) % R.pattern.length]];
        if (this.canSpawn(-1, def.w)) {
          // La puissance de la ruée ne se cumule pas avec celle de la difficulté : c'est la plus forte des deux
          // qui compte (cumulées, elles tuaient presque toutes les runs d'une sauvegarde neuve aux niveaux 2 à 5).
          const u = this.spawnEnemy(def, false, this.statMult * Math.max(1, R.stat / this.diffStat));
          u.rush = true;
          u.speed *= R.speed;
          if (this.rushLeft === this.rushTotal) this.game.toast('Ruée ennemie : défends ta base !', 'big');
          this.rushLeft--;
          this.sortUnits();
        }
        return;
      }
      if (ai.pick == null) {
        const w = L.unitWeights.slice();
        if (this.time < L.heavyAfter) w[2] = 0;
        ai.pick = pickWeighted(w);
      }
      const def = units[ai.pick];
      if (ai.gold >= def.cost && this.eu.length < L.maxEnemyUnits && this.canSpawn(-1, def.w)) {
        ai.gold -= def.cost;
        this.spawnEnemy(def, false);
        ai.pick = null;
        this.sortUnits();
      }
      if (this.isBoss) {
        ai.champT -= dt;
        const champ = this.enemyAgeDef.champion;
        if (ai.champT <= 0 && this.canSpawn(-1, champ.w)) {
          this.spawnEnemy(champ, true);
          ai.champT = L.championEvery;
          this.game.toast(`${champ.name} entre en scène !`);
          this.sortUnits();
        }
      }
    }

    // ------------------------------------------------- assaut final (vagues)
    startWave() {
      const A = C.assault;
      const wv = this.wave;
      wv.n++;
      wv.statMult = A.startStatMult * this.diffStat * Math.pow(1 + A.statGrowth, wv.n - 1);
      const count = A.baseCount + (wv.n - 1) * A.countPerWave;
      const w = C.levels.unitWeights.slice();
      if (wv.n < 2) w[2] = 0;
      wv.toSpawn = [];
      for (let i = 0; i < count; i++) wv.toSpawn.push({ def: this.enemyAgeDef.units[pickWeighted(w)], champion: false });
      if (wv.n % A.windowEvery === 0) wv.toSpawn.push({ def: this.enemyAgeDef.champion, champion: true });
      wv.state = 'spawning';
      wv.spawnT = 0;
      this.game.toast(`Vague ${wv.n}`);
    }

    updateWaves(dt) {
      const A = C.assault;
      const wv = this.wave;
      if (wv.state === 'pause') {
        wv.timer -= dt;
        if (wv.timer <= 0) this.startWave();
      } else if (wv.state === 'spawning') {
        wv.spawnT -= dt;
        const next = wv.toSpawn[0];
        if (next && wv.spawnT <= 0 && this.canSpawn(-1, next.def.w)) {
          this.spawnEnemy(next.def, next.champion, wv.statMult);
          wv.toSpawn.shift();
          wv.spawnT = A.spawnInterval;
          this.sortUnits();
        }
        if (!wv.toSpawn.length) wv.state = 'fighting';
      } else if (wv.state === 'fighting') {
        if (this.eu.every(u => u.dead)) {
          if (wv.n % A.windowEvery === 0) {
            wv.state = 'window';
            this.game.onAssaultWindow(this);
          } else {
            wv.state = 'pause';
            wv.timer = A.pauseBetweenWaves;
          }
        }
      }
    }

    continueAssault() {
      this.wave.state = 'pause';
      this.wave.timer = C.assault.pauseBetweenWaves;
    }

    // --------------------------------------------------------------- unités
    updateUnits(list, foes, side, dt) {
      const foeBaseFront = side === 1 ? ENEMY_FRONT : PLAYER_FRONT;

      for (let i = 0; i < list.length; i++) {
        const u = list[i];
        if (u.dead) continue;
        const foeFront = foes.find(f => !f.dead) || null;
        if (u.flash > 0) u.flash -= dt;
        if (u.attackAnim > 0) u.attackAnim -= dt;
        if (u.burn) {
          this.damageUnit(u, u.burn.dps * dt, true);
          u.burn.t -= dt;
          if (u.burn.t <= 0) u.burn = null;
          if (u.dead) continue;
        }
        // Glace : le temps passe moins vite pour l'unité (déplacement et recharge).
        let udt = dt;
        if (u.chill) {
          udt = dt * (1 - u.chill.k);
          u.chill.t -= dt;
          if (u.chill.t <= 0) u.chill = null;
        }
        u.cd -= udt;

        // Cible : l'unité ennemie la plus avancée, ou la base si elle est plus proche.
        const dBase = side === 1 ? foeBaseFront - u.front : u.front - foeBaseFront;
        let target = null;
        let dist = dBase;
        if (foeFront) {
          const dUnit = side === 1
            ? (foeFront.x - foeFront.w / 2) - u.front
            : u.front - (foeFront.x + foeFront.w / 2);
          if (dUnit <= dBase) { target = foeFront; dist = dUnit; }
        }

        let canMove = true;
        if (dist <= u.reach) {
          canMove = false;
          if (u.cd <= 0) this.attack(u, target);
        }

        let maxStep = Math.max(0, dist - 1);
        if (canMove && i > 0) {
          const ahead = list[i - 1];
          const gap = side === 1
            ? (ahead.x - ahead.w / 2) - u.front
            : u.front - (ahead.x + ahead.w / 2);
          if (gap <= GAP) canMove = false;
          else maxStep = Math.min(maxStep, gap - GAP);
        }

        u.moving = canMove && maxStep > 0.01;
        if (u.moving) {
          const step = Math.min(u.speed * udt, maxStep);
          u.x += side * step;
          u.walk += step * 0.18;
        }
      }
    }

    attack(u, target) {
      u.cd = u.interval;
      u.attackAnim = 0.25;
      if (u.kind === 'melee') {
        if (target) {
          this.damageUnit(target, u.dmg);
          if (u.side === 1) this.applyElement(target, u.dmg, true);
          this.spark(target.x - u.side * target.w / 2, GROUND - target.h * 0.55, this.hitColor(u.side), 3);
        } else {
          this.damageBase(-u.side, u.dmg);
        }
        if (u.def.splash) this.meleeSplash(u, target);
      } else {
        const p = u.def.projectile;
        const sx = u.x + u.side * 8;
        const sy = GROUND - u.h * 0.62;
        this.fire({
          owner: u.side, x: sx, y: sy, target, look: p.look, speed: p.speed, dmg: u.dmg,
          baseX: u.side === 1 ? ENEMY_FRONT + 6 : PLAYER_FRONT - 6,
          elem: u.side === 1 ? this.element : null,
          // Unités d'élite : tir en zone, éventuellement en cloche ou incendiaire.
          splash: p.splash || 0, arc: !!p.arc,
          burn: p.burn ? { dps: u.dmg * p.burn / 2, duration: 2 } : null,
        });
      }
    }

    // Coup de mêlée en zone (unités d'élite) : touche aussi les ennemis serrés autour de la cible.
    meleeSplash(u, target) {
      const foes = u.side === 1 ? this.eu : this.pu;
      const cx = target ? target.x : u.front + u.side * 16;
      const r = u.def.splash;
      for (const f of foes) {
        if (f === target || f.dead || Math.abs(f.x - cx) > r + f.w / 2) continue;
        this.damageUnit(f, u.dmg);
        if (u.side === 1) this.applyElement(f, u.dmg, false);
      }
      this.particles.push({ ring: true, x: cx, y: GROUND - 4, r: 4, maxR: r, life: 0.3, max: 0.3, color: '#e8d9b0' });
    }

    // -------------------------------------------------------------- tourelles
    updateTurrets(side, turrets, dt) {
      const foes = side === 1 ? this.eu : this.pu;
      for (let i = 0; i < turrets.length; i++) {
        const t = turrets[i];
        if (!t) continue;
        t.cd -= dt;
        if (t.cd > 0) continue;
        const target = foes.find(f => !f.dead);
        if (!target) continue;
        const def = C.ages[t.age].turrets[t.idx];
        const pos = this.turretPos(side, i);
        const range = def.range * (side === 1 ? 1 + this.mods.turretRange : C.levels.enemyTurretRange);
        const d = side === 1 ? (target.x - target.w / 2) - pos.x : pos.x - (target.x + target.w / 2);
        if (d > range) continue;
        const dmg = def.dmg * (side === 1 ? 1 + this.mods.turretDmg : this.statMult * C.levels.enemyTurretDmg);
        t.cd = def.interval;
        t.anim = 0.2;
        this.fire({ owner: side, x: pos.x, y: pos.y - 8, target, look: def.proj, speed: def.projSpeed, dmg,
          splash: def.splash || 0, arc: !!def.arc, burn: def.burn || null, elem: side === 1 ? this.element : null });
      }
    }

    // ------------------------------------------------------------ projectiles
    fire(p) {
      p.dead = false;
      if (p.arc) {
        const tx = p.target ? p.target.x : p.baseX;
        const dist = Math.abs(tx - p.x);
        p.sx = p.x; p.sy = p.y; p.tx = tx; p.ty = GROUND - 4;
        p.dur = Math.max(0.45, dist / p.speed);
        p.peak = Math.min(220, 60 + dist * 0.35);
        p.t = 0;
      }
      this.projectiles.push(p);
    }

    updateProjectiles(dt) {
      for (const p of this.projectiles) {
        if (p.dead) continue;
        if (p.arc) {
          p.t += dt / p.dur;
          const k = Math.min(1, p.t);
          p.px = p.x; p.py = p.y;
          p.x = p.sx + (p.tx - p.sx) * k;
          p.y = p.sy + (p.ty - p.sy) * k - p.peak * 4 * k * (1 - k);
          if (k >= 1) this.hit(p, p.tx);
        } else {
          let tx, ty;
          if (p.target && !p.target.dead) {
            tx = p.target.x; ty = GROUND - p.target.h * 0.55;
          } else if (p.target) {
            p.dead = true;            // la cible est morte en route
            continue;
          } else {
            tx = p.baseX; ty = GROUND - 50;
          }
          const dx = tx - p.x, dy = ty - p.y;
          const d = Math.hypot(dx, dy);
          const step = p.speed * dt;
          p.px = p.x; p.py = p.y;
          if (d <= step + 4) {
            p.x = tx; p.y = ty;
            this.hit(p, tx);
          } else {
            p.x += dx / d * step;
            p.y += dy / d * step;
          }
        }
      }
      this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    hit(p, x) {
      p.dead = true;
      const foes = p.owner === 1 ? this.eu : this.pu;
      if (p.splash) {
        for (const f of foes) {
          if (!f.dead && Math.abs(f.x - x) <= p.splash + f.w / 2) {
            this.damageUnit(f, p.dmg);
            // Tourelle incendiaire : la brûlure qui fera le plus de dégâts l'emporte.
            if (p.burn && !f.dead && (!f.burn || f.burn.dps * f.burn.t < p.burn.dps * p.burn.duration)) {
              f.burn = { dps: p.burn.dps, t: p.burn.duration };
            }
            if (p.owner === 1) this.applyElement(f, p.dmg, false);   // pas de rebond depuis une zone
          }
        }
        // Tir en zone d'une unité visant la base (pas de cible) : la base encaisse aussi.
        if (!p.target && p.baseX != null) this.damageBase(-p.owner, p.dmg);
        const color = SPLASH_COLOR[p.look] || '#b9a58a';
        this.particles.push({ ring: true, x, y: GROUND - 6, r: 4, maxR: p.splash, life: 0.35, max: 0.35, color });
        this.spark(x, GROUND - 8, color, 8);
      } else if (p.target) {
        if (!p.target.dead) {
          this.damageUnit(p.target, p.dmg);
          if (p.owner === 1) this.applyElement(p.target, p.dmg, true);
        }
        this.spark(p.x, p.y, this.hitColor(p.owner), 2);
      } else {
        this.damageBase(-p.owner, p.dmg);
      }
    }

    // ---------------------------------------------------------------- éléments
    hitColor(side) { return side === 1 && this.element ? C.elements[this.element].color : '#fff3c4'; }

    // Effet de l'élément de la run sur un ennemi touché par une unité ou une tourelle du joueur.
    // single : coup à cible unique (seuls ceux-là rebondissent avec la Foudre).
    applyElement(f, dmg, single) {
      const m = this.mods, E = C.elements;
      if (m.ice && !f.dead) {
        const k = E.ice.slow[m.ice - 1] * (f.isChampion ? E.ice.championFactor : 1);
        f.chill = { k: Math.max(k, f.chill ? f.chill.k : 0), t: E.ice.duration };
      }
      if (m.fire && !f.dead) {
        // La brûlure s'accumule : ce qui reste à brûler + la part de ce coup, sur toute la durée.
        const left = f.burn ? f.burn.dps * f.burn.t : 0;
        const total = left + dmg * E.fire.burn[m.fire - 1];
        f.burn = { dps: total / E.fire.duration, t: E.fire.duration };
      }
      if (m.shock && single) this.chain(f, dmg);
    }

    // Foudre : l'éclair saute vers les ennemis les plus proches, l'un après l'autre.
    chain(from, dmg) {
      const E = C.elements.shock, i = this.mods.shock - 1;
      const share = dmg * E.share[i];
      const done = new Set([from]);
      const pts = [[from.x, GROUND - from.h * 0.55]];
      let cur = from;
      for (let n = 0; n < E.targets[i]; n++) {
        let best = null, bd = E.range;
        for (const f of this.eu) {
          if (f.dead || done.has(f)) continue;
          const d = Math.abs(f.x - cur.x);
          if (d <= bd) { bd = d; best = f; }
        }
        if (!best) break;
        done.add(best);
        pts.push([best.x, GROUND - best.h * 0.55]);
        this.damageUnit(best, share);
        cur = best;
      }
      if (pts.length < 2) return;
      // Tracé en zigzag, calculé une fois pour que l'éclair ne tremble pas.
      const zig = [pts[0]];
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
        for (let s = 1; s <= 4; s++) {
          const q = s / 4;
          zig.push([ax + (bx - ax) * q, ay + (by - ay) * q + (s < 4 ? rand(-9, 9) : 0)]);
        }
      }
      this.particles.push({ bolt: true, pts: zig, life: 0.22, max: 0.22, color: E.color });
      this.spark(cur.x, GROUND - cur.h * 0.55, E.color, 3);
    }

    // ------------------------------------------------------- pouvoir spécial
    updateDrops(dt) {
      for (const d of this.drops) {
        if (d.dead) continue;
        if (d.delay > 0) { d.delay -= dt; continue; }
        if (d.x == null && d.fixX != null) d.x = d.fixX;
        if (d.x == null) {
          const alive = this.eu.filter(u => !u.dead);
          d.x = alive.length && Math.random() < 0.75
            ? alive[Math.floor(Math.random() * alive.length)].x + rand(-25, 25)
            : rand(PLAYER_FRONT + 150, ENEMY_FRONT - 20);
        }
        d.y += d.vy * dt;
        if (d.y >= GROUND - 6) {
          d.dead = true;
          for (const f of this.eu) {
            if (!f.dead && Math.abs(f.x - d.x) <= d.radius + f.w / 2) this.damageUnit(f, d.dmg);
          }
          const fx = DROP_FX[d.look] || DROP_FX.arrow;
          this.spark(d.x, GROUND - 6, fx.color, fx.sparks);
          if (fx.ring) this.particles.push({ ring: true, x: d.x, y: GROUND - 6, r: 4, maxR: d.radius, life: 0.35, max: 0.35, color: fx.color });
          if (fx.shake) this.shake = Math.max(this.shake, fx.shake);
        }
      }
      this.drops = this.drops.filter(d => !d.dead);
      if (this.airship) {
        this.airship.t += dt;
        if (this.airship.t > this.airship.dur + 1.6) this.airship = null;
      }
      this.updateSweeps(dt);
    }

    // Charge : chaque bête touche chaque ennemi une seule fois et le repousse vers sa base.
    updateSweeps(dt) {
      for (const s of this.sweeps) {
        if (s.dead) continue;
        if (s.delay > 0) { s.delay -= dt; continue; }
        s.x += s.speed * dt;
        s.walk += dt * 14;
        for (const f of this.eu) {
          if (f.dead || s.hit.has(f) || Math.abs(f.x - s.x) > f.w / 2 + 26) continue;
          s.hit.add(f);
          this.damageUnit(f, s.dmg);
          if (!f.dead && s.knock) f.x = Math.min(ENEMY_FRONT - f.w / 2 - 2, f.x + s.knock * (f.isChampion ? 0.4 : 1));
          this.spark(f.x, GROUND - f.h * 0.5, '#e8d9b0', 5);
          this.shake = Math.max(this.shake, 0.06);
        }
        if (Math.random() < dt * 30) {
          this.particles.push({ x: s.x - 30, y: GROUND - rand(0, 8), vx: rand(-80, -20), vy: rand(-60, -10),
            life: rand(0.3, 0.6), max: 0.6, color: 'rgba(190,170,130,0.8)', size: rand(3, 6) });
        }
        if (s.x > ENEMY_FRONT + 60) s.dead = true;
      }
      this.sweeps = this.sweeps.filter(s => !s.dead);
    }

    updateFx(dt) {
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      for (const p of this.particles) {
        p.life -= dt;
        if (p.ring) { p.r += (p.maxR / p.max) * dt; continue; }
        if (p.bolt) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 420 * dt;
      }
      this.particles = this.particles.filter(p => p.life > 0);
      for (const t of this.texts) { t.life -= dt; t.y -= 28 * dt; }
      this.texts = this.texts.filter(t => t.life > 0);
    }
  }

  PA.Battle = Battle;
  PA.BattleConst = { GROUND, PLAYER_FRONT, ENEMY_FRONT, SLOT_DY };
})();

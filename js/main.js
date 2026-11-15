/* =========================================================================
   BOUCLE DE JEU ET DÉROULÉ D'UNE RUN
   camp → niveaux 1…N (5 par âge) → assaut final → fin de run → camp
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const STEP = 1 / 60;

  const Game = {
    meta: null,
    run: null,
    battle: null,
    paused: false,
    blocked: false,       // une fenêtre attend une réponse : le combat est figé
    speed: 1,
    pending: null,        // fin de combat à traiter après la mise à jour
    playableAges: 2,
    totalLevels: 10,
    acc: 0,
    last: 0,

    init() {
      this.meta = PA.Meta.load(PA.Meta.loadPref());   // la campagne (difficulté) jouée la dernière fois
      // Musique : réglages du joueur ; le son démarre au premier appui (règle des navigateurs).
      PA.Music.charger();
      PA.Fx.charger();
      PA.Sons.chargerReel();      // cherche les enregistrements (dossier sons/) ; sans eux, tout reste synthétisé
      for (const ev of ['pointerdown', 'touchstart', 'keydown']) addEventListener(ev, () => PA.Music.debloquer(), { once: true });
      PA.Render.init(document.getElementById('canvas'));
      PA.UI.init(this);
      const demo = new URLSearchParams(location.search).get('demo');
      if (demo && PA.DEV) this.startDemo(demo);   // la vitrine (or illimité) n'existe pas dans la version publique
      else this.showCamp();
      requestAnimationFrame(t => { this.last = t; this.frame(t); });
    },

    // ---------------------------------------------------------------- vitrine
    // index.html?demo=pierre : un combat sans fin dans l'âge demandé, pour regarder les graphismes.
    // Les deux camps sont de cet âge, l'or est illimité, les bases ne tombent pas, des unités
    // arrivent toutes seules (les boutons marchent aussi). Rien n'est lu ni écrit dans la sauvegarde.
    startDemo(id) {
      const idx = Math.max(0, C.ages.findIndex(a => a.id === id));
      PA.Meta.save = function () {};
      PA.Meta.reset = () => PA.Meta.defaults();
      const meta = this.meta = PA.Meta.defaults();
      meta.agesUnlocked = C.ages.length;
      C.ages.forEach((a, i) => { const d = PA.Meta.eliteDef(i); if (d) meta.elites[d.id] = true; });
      meta.maxSpeed = 1 + C.prestige.speedCosts.length;
      this.playableAges = C.ages.length;
      this.totalLevels = this.playableAges * C.levels.perAge;
      this.run = {
        age: idx, xp: 0, gold: 0, base: { hp: 0, maxHp: 0 }, relics: [],
        turrets: [0, 1, 2].map(i => ({ age: idx, idx: i, cd: 0.5 + i * 0.4 })),
        level: idx * C.levels.perAge + 3, levelsDone: 0, ppLevels: 0, ppAssault: 0, ppLost: 0, assaultWave: 0,
      };
      this.refreshBaseMax();
      this.run.base.hp = this.run.base.maxHp;
      this.demo = { idx, t: 0, next: 0.6, k: 0, champ: false, special: 12 };
      this.startLevel();
      this.toast(`Vitrine : ${C.ages[idx].name} — ← → change d’âge · G anciens / nouveaux graphismes`, 'big');
    },

    demoTick(dt) {
      const d = this.demo, b = this.battle, run = this.run, age = C.ages[d.idx];
      run.gold = Math.max(run.gold, age.units[2].cost * 20);
      run.base.hp = run.base.maxHp;
      b.enemyBase.hp = b.enemyBase.maxHp;
      b.killsPP = 0;                            // pas de prestige en vitrine (ni de message de plafond)
      d.t += dt;
      if (d.t >= d.next) {
        d.next = d.t + 1.7;
        const def = age.units[[0, 1, 0, 3, 1, 2, 0, 1][d.k % 8]];
        if (b.pu.length < 9 && b.canSpawn(1, def.w)) { b.spawnPlayer(def, d.idx); d.k++; }
      }
      if (!d.champ && d.t > 8) { d.champ = true; b.spawnEnemy(age.champion, true); }
      if (d.t > d.special) { d.special = d.t + 16; b.specialCd = 0; b.useSpecial(); }
      if (b.time > 300) {                       // on repart avant l'arrivée des renforts ennemis
        d.t = 0; d.next = 0.6; d.champ = false; d.special = 12;
        this.startLevel();
      }
    },

    // ------------------------------------------------------------- boucle
    frame(now) {
      const dt = Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      const b = this.battle;
      if (b && !this.paused && !this.blocked && !b.over) {
        if (this.demo) this.demoTick(dt * this.speed);
        this.acc += dt * this.speed;
        while (this.acc >= STEP && !this.blocked && !this.pending) {
          b.update(STEP);
          this.acc -= STEP;
        }
      } else {
        this.acc = 0;
      }
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        this.acc = 0;
        this.handleEnd(p.battle, p.result);
      }
      PA.Render.draw(this, now / 1000, this.paused ? 0 : dt);
      PA.UI.update();
      requestAnimationFrame(t => this.frame(t));
    },

    toast(msg, cls) { PA.UI.toast(msg, cls); },

    // Passe à la vitesse suivante parmi celles achetées au camp (×1 → ×2 → ×3 → ×1).
    cycleSpeed() {
      const max = PA.Meta.maxSpeed(this.meta);
      if (max <= 1) {
        const cost = PA.Meta.nextSpeedCost(this.meta);
        this.toast(`Vitesse ×2 : à acheter au camp (${cost.toLocaleString('fr-FR')} ✦)`);
        return;
      }
      this.speed = this.speed >= max ? 1 : this.speed + 1;
      PA.UI.update(true);
    },

    togglePause() {
      if (!this.battle || this.blocked || this.battle.over) return;
      this.paused = !this.paused;   // l'interface affiche un voile « PAUSE » et bloque les commandes
      PA.UI.update(true);
    },

    mods() { return PA.computeMods(this.meta, this.run ? this.run.relics : []); },

    // PV max de la base selon l'âge et les bonus. L'appelant gère le gain de PV.
    refreshBaseMax() {
      const base = this.run.base;
      base.maxHp = Math.round(C.ages[this.run.age].baseHp * (1 + this.mods().baseMaxHp));
      base.hp = Math.min(base.hp, base.maxHp);
    },

    // ------------------------------------------------------------------ run
    newRun() {
      const meta = this.meta;
      this.playableAges = PA.Meta.playableAgeCount(meta);
      this.totalLevels = this.playableAges * C.levels.perAge;
      this.run = {
        age: 0, xp: 0, gold: 0,
        base: { hp: 0, maxHp: 0 },
        turrets: [null],
        relics: [],
        level: 1,
        levelsDone: 0,
        ppLevels: 0,       // points mis à l'abri pendant les niveaux
        ppAssault: 0,      // points gagnés pendant l'assaut final
        ppLost: 0,
        assaultWave: 0,    // vagues franchies
      };
      this.run.gold = C.economy.startGold + this.mods().startGold;
      // Version perso : assez d'XP dès le départ pour évoluer jusqu'au dernier âge jouable (le bouton Évoluer reste libre).
      if (PA.DEV && this.playableAges > 1) this.run.xp = C.evolveXp[this.playableAges - 2];
      this.refreshBaseMax();
      this.run.base.hp = this.run.base.maxHp;
      meta.runs++;
      PA.Meta.save(meta);
      // On garde la vitesse choisie à la run précédente, dans la limite de ce qui est acheté.
      this.speed = Math.min(this.speed, PA.Meta.maxSpeed(meta));
      this.startLevel();
    },

    startLevel() {
      const n = this.run.level;
      const per = C.levels.perAge;
      const enemyAge = Math.floor((n - 1) / per);
      const blockIndex = (n - 1) % per;
      this.battle = new PA.Battle(this, { mode: 'level', enemyAge, levelNumber: n, blockIndex });
      this.paused = false;
      this.blocked = false;
      PA.UI.hideOverlay();
      PA.UI.enterBattle();
      PA.UI.update(true);   // le bandeau d'entrée est dessiné par PA.Render.levelBanner
    },

    onEvolve() {
      PA.UI.buildBattleButtons();
      PA.UI.update(true);
    },

    // Appelé par le combat au moment où il se termine (pendant la mise à jour).
    onBattleEnd(battle, result) {
      this.pending = { battle, result };
    },

    handleEnd(b, result) {
      if (b !== this.battle) return;
      if (b.mode === 'level') {
        if (result === 'victory') this.levelVictory(b);
        else this.levelDefeat(b, 'defeat-level');
      } else {
        this.assaultDefeat(b, 'defeat-assault');
      }
    },

    // ------------------------------------------------------- fin de niveau
    levelVictory(b) {
      const P = C.prestige;
      const run = this.run;
      const n = b.levelNumber;
      const base = P.levelBase + P.levelPerIndex * n;
      const kills = b.killsPP;
      const t = b.time;
      let speed = 0;
      if (t <= P.speedFast) speed = P.speedBonusMax;
      else if (t < P.speedSlow) speed = P.speedBonusMax * (P.speedSlow - t) / (P.speedSlow - P.speedFast);
      const gap = Math.max(0, b.enemyAge - run.age);
      const outsider = gap * P.outsiderPerAge;
      const total = PA.Meta.bank(this.meta, (base + kills) * (1 + speed + outsider));
      run.ppLevels += total;
      run.levelsDone = n;
      this.meta.bestLevel = Math.max(this.meta.bestLevel, n);
      PA.Meta.save(this.meta);

      b.killsPP = 0;   // ces points viennent d'être mis à l'abri
      // Les unités encore en file d'attente sont remboursées.
      for (const q of b.queue) run.gold += b.unitCost(q.def);
      b.queue = [];

      this.blocked = true;
      PA.UI.showVictory({
        n, time: t, base, kills, killsCap: b.killsPPCap, speed, outsider, gap, total,
        last: n >= this.totalLevels,
        choices: this.pickRelics(3),
      });
    },

    pickRelics(count) {
      const run = this.run;
      let pool = C.relics.slice();
      // Inutile de proposer une réparation si la base est presque intacte.
      if (run.base.hp >= run.base.maxHp * 0.85) pool = pool.filter(r => r.id !== 'reparations');
      // Éléments : une seule affinité par run. Une fois choisie, seul cet élément revient, jusqu'à son niveau max.
      const mine = C.relics.find(r => r.element && run.relics.includes(r.id));
      if (mine) {
        const lvl = run.relics.filter(id => id === mine.id).length;
        pool = pool.filter(r => !r.element || (r === mine && lvl < PA.elementMax(r.element)));
      }
      const out = [];
      while (out.length < count && pool.length) {
        const i = Math.floor(Math.random() * pool.length);
        out.push(pool[i].id);
        pool.splice(i, 1);
      }
      return out;
    },

    chooseRelic(id) {
      const run = this.run;
      const E = C.economy;
      const r = C.relics.find(x => x.id === id);

      if (r.mod) {
        run.relics.push(id);
        const oldMax = run.base.maxHp;
        this.refreshBaseMax();
        if (run.base.maxHp > oldMax) run.base.hp += run.base.maxHp - oldMax;
      }

      // Préparation du niveau suivant
      run.gold = Math.max(Math.floor(run.gold * E.goldCarryOver), E.minGoldAtLevelStart[run.age]);
      run.base.hp = Math.min(run.base.maxHp, run.base.hp + run.base.maxHp * PA.diff(this.meta).repair);
      if (!E.keepTurretsBetweenLevels) run.turrets = run.turrets.map(() => null);
      run.turrets.forEach(t => { if (t) t.cd = 0.5; });

      if (r.instant) {
        if (r.instant.heal) run.base.hp = Math.min(run.base.maxHp, run.base.hp + run.base.maxHp * r.instant.heal);
        if (r.instant.gold) run.gold += r.instant.gold * E.lootMultByAge[run.age];
      }

      if (run.levelsDone >= this.totalLevels) {
        PA.UI.showAssaultIntro();
      } else {
        run.level = run.levelsDone + 1;
        this.startLevel();
      }
    },

    levelDefeat(b, reason) {
      const run = this.run;
      const loss = PA.Meta.lossRate(this.meta);
      const kept = PA.Meta.bank(this.meta, b.killsPP * (1 - loss));
      run.ppLevels += kept;
      run.ppLost += b.killsPP * loss;
      this.endRun(reason, { level: b.levelNumber });
    },

    // -------------------------------------------------------- assaut final
    startAssault() {
      this.battle = new PA.Battle(this, { mode: 'assault', enemyAge: this.playableAges - 1 });
      this.paused = false;
      this.blocked = false;
      PA.UI.hideOverlay();
      PA.UI.enterBattle();
      PA.UI.update(true);
    },

    onAssaultWindow(b) {
      this.blocked = true;
      this.run.assaultWave = b.wave.n;
      this.meta.bestWave = Math.max(this.meta.bestWave, b.wave.n);
      PA.Meta.save(this.meta);
      PA.UI.showAssaultWindow(b);
    },

    continueAssault() {
      this.blocked = false;
      PA.UI.hideOverlay();
      this.battle.continueAssault();
    },

    retreat() {
      const b = this.battle;
      b.over = true;
      this.run.ppAssault += PA.Meta.bank(this.meta, b.cagnotte);
      this.run.assaultWave = b.wave.n;
      this.endRun('retreat', { wave: b.wave.n });
    },

    assaultDefeat(b, reason) {
      const run = this.run;
      const loss = PA.Meta.lossRate(this.meta);
      run.ppAssault += PA.Meta.bank(this.meta, b.cagnotte * (1 - loss));
      run.ppLost += b.cagnotte * loss;
      run.assaultWave = Math.max(0, b.wave.n - 1);
      this.meta.bestWave = Math.max(this.meta.bestWave, run.assaultWave);
      this.endRun(reason, { wave: b.wave.n });
    },

    abandon() {
      const b = this.battle;
      if (!b) return;
      b.over = true;
      if (b.mode === 'level') this.levelDefeat(b, 'abandon');
      else this.assaultDefeat(b, 'abandon');
    },

    endRun(reason, info) {
      this.blocked = true;
      this.paused = false;
      this.meta.bestLevel = Math.max(this.meta.bestLevel, this.run.levelsDone);
      PA.Meta.save(this.meta);
      PA.UI.showRunEnd(reason, info);
    },

    // Change de campagne depuis le camp : chaque difficulté a sa propre sauvegarde.
    setDifficulty(d) {
      if (!C.difficulties[d] || this.battle || d === this.meta.difficulty) return;
      this.meta = PA.Meta.load(d);
      PA.Meta.savePref(d);
      this.speed = 1;
      this.showCamp();
    },

    showCamp() {
      this.battle = null;
      this.run = null;
      this.paused = false;
      this.blocked = false;
      PA.UI.enterMenu();
      PA.UI.showCamp();
    },
  };

  PA.Game = Game;
  Game.init();
})();

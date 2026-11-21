/* =========================================================================
   INTERFACE : barre du haut, commandes, fenêtres (camp, victoire, retraite…).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const $ = id => document.getElementById(id);
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const pct = x => `${Math.round(x * 100)} %`;
  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const court = n => PA.court(n);                                   // 12,3 k · 1,46 M : pour les petits boutons
  const rnd = n => Math.round(n).toLocaleString('fr-FR');           // arrondi comme la mise à l'abri (Meta.bank)
  // médaille de la galerie des champions : 1 bronze, 2 argent, 3 or (rien pour 0)
  const med = m => (m ? `<i class="med m${m}" title="${['', 'Bronze', 'Argent', 'Or'][m]}">★</i>` : '');

  const UI = {
    init(game) {
      this.game = game;
      this.el = {};
      ['hud-level', 'hud-enemy', 'hud-track', 'hud-gold', 'hud-xp-fill', 'hud-xp-text', 'btn-evolve', 'hud-age', 'hud-pp', 'hud-time',
        'btn-speed', 'btn-pause', 'btn-quit', 'unit-buttons', 'turret-buttons', 'queue', 'slots', 'btn-special', 'relics',
        'overlay', 'overlay-card', 'toast'].forEach(id => { this.el[id] = $(id); });
      this.lastUpdate = 0;
      this.builtForAge = -1;

      // Toute action de combat passe par ici : rien ne se fait en pause ni derrière une fenêtre.
      this.act = fn => () => {
        const b = game.battle;
        if (!b || game.blocked || game.paused) return;
        fn(b);
        this.update(true);
      };
      this.el['btn-evolve'].onclick = this.act(b => b.evolve());
      this.el['btn-special'].onclick = this.act(b => b.useSpecial());
      this.el['btn-speed'].onclick = () => game.cycleSpeed();
      this.el['btn-pause'].onclick = () => game.togglePause();
      this.el['btn-quit'].onclick = () => this.confirmAbandon();
      $('pause-veil').onclick = () => game.togglePause();
      $('pause-son').onclick = () => { PA.Music.basculer(); this.update(true); };
      if ($('pause-fx')) $('pause-fx').onclick = () => { PA.Music.basculerFx(); this.update(true); };
      // Emplacements de tourelles, dans la barre du bas : « + » achète un emplacement ;
      // une tourelle se vend en deux appuis (le premier affiche le prix de revente).
      // Un seul écouteur, qui agit toujours sur le combat en cours.
      this.sellArmed = null;
      this.el.slots.addEventListener('click', e => {
        const btn = e.target.closest('button');
        const b = game.battle;
        if (!btn || !b || game.blocked || game.paused) return;
        if (btn.dataset.slot) b.buySlot();
        else if (btn.dataset.sell != null) {
          const i = Number(btn.dataset.sell), now = performance.now();
          if (this.sellArmed && this.sellArmed.slot === i && now < this.sellArmed.until) { b.sellTurret(i); this.sellArmed = null; }
          else this.sellArmed = { slot: i, until: now + 2500 };
        }
        this.update(true);
      });

      window.addEventListener('keydown', e => {
        const b = game.battle;
        if (!b || game.blocked) return;
        const k = e.key.toLowerCase();
        if (k === 'p') { game.togglePause(); return; }
        // G : compare anciens et nouveaux graphismes (js/art.js), même en pause.
        if (k === 'g' && PA.Art) { PA.Art.on = !PA.Art.on; this.builtForAge = -1; this.el.queue.dataset.key = '?'; this.toast(PA.Art.on ? 'Nouveaux graphismes' : 'Anciens graphismes'); return; }
        // Vitrine (index.html?demo=…) : les flèches gauche et droite passent à l'âge précédent ou suivant.
        if (game.demo && (k === 'arrowright' || k === 'arrowleft')) {
          const n = C.ages.length, i = (game.demo.idx + (k === 'arrowright' ? 1 : n - 1)) % n;
          location.search = '?demo=' + C.ages[i].id;
          return;
        }
        // Vitrine : U passe au pouvoir suivant de l'âge (les quatre sont débloqués).
        if (game.demo && k === 'u') {
          const L = PA.Pouvoirs.liste(game.run.age), i = L.indexOf(b.special), p = L[(i + 1) % L.length];
          game.meta.powerPick[C.ages[game.run.age].id] = p.id; b.specialCd = 0;
          this.toast(`Pouvoir : ${p.name} (${p.genre})`);
          return;
        }
        if (game.paused) return;
        if (k === '1' || k === '2' || k === '3' || k === '4') b.buyUnit(Number(k) - 1);
        else if (k === 'a' || k === 'z' || k === 'e') b.buyTurret({ a: 0, z: 1, e: 2 }[k]);
        else if (k === ' ') { e.preventDefault(); b.useSpecial(); }
        else if (k === 'v') b.evolve();
      });
    },

    // Musique : le camp, les niveaux, et le boss ou l'assaut final ont chacun leur thème.
    enterBattle() {
      document.body.classList.remove('in-menu');
      this.builtForAge = -1;
      this.buildBattleButtons();
      const b = this.game.battle;
      if (b && !this.game.demo) PA.Music.demande(b.mode === 'assault' || b.isBoss ? 'assaut' : 'combat');
    },

    enterMenu() {
      document.body.classList.add('in-menu');
      if (!this.game.demo) PA.Music.demande('camp');
    },

    toast(msg, cls) {
      const box = this.el.toast;
      while (box.children.length >= 3) box.removeChild(box.firstChild);
      const d = document.createElement('div');
      d.className = 'toast-msg' + (cls ? ' ' + cls : '');
      d.textContent = msg;
      box.appendChild(d);
      setTimeout(() => d.remove(), 2400);
    },

    // ----------------------------------------------------- commandes de combat
    buildBattleButtons() {
      const game = this.game;
      const b = game.battle;
      if (!b) return;
      const age = C.ages[game.run.age];
      this.builtForAge = game.run.age;

      const ub = this.el['unit-buttons'];
      ub.innerHTML = '';
      age.units.forEach((u, i) => {
        const btn = document.createElement('button');
        const locked = u.elite && !PA.Meta.hasElite(b.meta, game.run.age);   // b.meta : neutre au défi du jour
        btn.className = 'buy' + (u.elite ? ' elite' : '') + (locked ? ' locked' : '');
        btn.dataset.idx = i;
        btn.title = locked ? `${u.name} — unité d’élite : à débloquer au camp pour ${fmt(PA.Meta.eliteCost(game.run.age))} ✦` : `${u.name} — ${u.desc} · ${fmt(u.hp)} PV (touche ${i + 1})`;
        // Le bouton montre l'unité elle-même (même dessin que sur le terrain) et son prix.
        btn.innerHTML = `<canvas width="128" height="128"></canvas>${u.elite ? '<i class="star">★</i>' : ''}<span class="cost"></span>`;
        this.peindre(btn.firstChild, PA.Render.portrait('unit', u));
        btn.onclick = this.act(b2 => b2.buyUnit(i));
        ub.appendChild(btn);
      });

      const tb = this.el['turret-buttons'];
      tb.innerHTML = '';
      age.turrets.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.className = 'buy';
        btn.dataset.idx = i;
        const info = t.splash ? 'dégâts de zone' : t.interval < 0.4 ? 'tir rapide' : 'tir précis';
        btn.title = `${t.name} — ${info} · portée ${t.range} (touche ${'AZE'[i]})`;
        btn.innerHTML = `<canvas width="128" height="128"></canvas><span class="cost">${court(t.cost)}</span>`;
        this.peindre(btn.firstChild, PA.Render.portrait('turret', t));
        btn.onclick = this.act(b2 => b2.buyTurret(i));
        tb.appendChild(btn);
      });
    },

    // Image décodée une seule fois, gardée en mémoire (vignettes des unités et des tourelles).
    vignette(src) {
      this.vignettes = this.vignettes || {};
      let im = this.vignettes[src];
      if (!im) { im = this.vignettes[src] = new Image(); im.src = src; }
      return im;
    },
    // Dessine une vignette sur un canevas (vide si src = ''). Rien n'est rechargé : pas de clignotement.
    peindre(cv, src) {
      cv.dataset.src = src;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!src) return;
      const im = this.vignette(src);
      const go = () => { if (cv.dataset.src === src) { ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0, cv.width, cv.height); } };
      if (im.complete && im.naturalWidth) go(); else im.addEventListener('load', go, { once: true });
    },

    update(force) {
      const now = performance.now();
      if (!force && now - this.lastUpdate < 100) return;
      this.lastUpdate = now;
      const game = this.game;
      const b = game.battle;
      const run = game.run;
      document.body.classList.toggle('paused', !!(b && game.paused));
      $('pause-son').textContent = PA.Music.on ? '♪ Musique : oui' : '♪ Musique : non';
      if ($('pause-fx')) $('pause-fx').textContent = PA.Music.fx ? '🔊 Sons : oui' : '🔊 Sons : non';
      if (!b || !run) return;
      if (this.builtForAge !== run.age) this.buildBattleButtons();

      // Titre du niveau (avec une étiquette quand la campagne est en difficile)
      const hardTag = game.meta.difficulty === 'difficile' ? '<span class="hard">Difficile</span> · ' : '';
      if (run.mode === 'rush') {
        const r = b.rushB;
        this.el['hud-level'].textContent = `Boss rush · ${C.ages[b.enemyAge].name} (${run.i + 1} / ${run.etapes.length})`;
        this.el['hud-enemy'].innerHTML = r && r.actuel
          ? `${hardTag}${r.actuel.name} · champion ${Math.min(r.total, r.tues + 1)} / ${r.total} · ${run.medailles.length} / ${PA.Modes.nbChampions()} vaincus`
          : `${hardTag}Le premier champion arrive… · ${run.medailles.length} / ${PA.Modes.nbChampions()} vaincus`;
      } else if (run.mode === 'defi' && b.phase === 'course') {
        this.el['hud-level'].textContent = 'Défi du jour · course';
        this.el['hud-enemy'].innerHTML = `${hardTag}<span class="good">Détruis sa base au plus vite</span> · ${run.defi.regle.nom}`;
      } else if (run.mode === 'defi') {
        this.el['hud-level'].textContent = 'Défi du jour';
        this.el['hud-enemy'].innerHTML = b.phase === 'survie'
          ? `${hardTag}<span class="warn">Tiens encore ${fmtTime(Math.max(0, PA.Modes.SURVIE - b.time))}</span> · ${run.defi.regle.nom}`
          : `${hardTag}<span class="good">Porte fermée : détruis la base !</span> · ${run.defi.regle.nom}`;
      } else if (b.mode === 'level') {
        const boss = b.isBoss ? ' · Boss' : '';
        this.el['hud-level'].textContent = `Niveau ${b.levelNumber} / ${game.totalLevels}${boss}`;
        const gap = b.enemyAge - run.age;
        const R = C.levels.reinforcements;
        let reinf = '';
        if (b.reinf > 0) reinf = ` · <span class="warn">⚠ renforts +${Math.round(R.statPerStep * b.reinf * 100)} %</span>`;
        else if (b.time >= R.startAfter - R.warnBefore) reinf = ` · <span class="warn">renforts dans ${Math.ceil(R.startAfter - b.time)} s</span>`;
        this.el['hud-enemy'].innerHTML = `${hardTag}Ennemis : ${C.ages[b.enemyAge].name}` +
          (gap > 0 ? ` — outsider : +${Math.round(gap * C.prestige.outsiderPerAge * 100)} % de prestige` : '') + reinf;
      } else {
        this.el['hud-level'].textContent = `Assaut final — vague ${b.wave.n}`;
        this.el['hud-enemy'].innerHTML = `${hardTag}Ennemis : ${C.ages[b.enemyAge].name} · cagnotte ${rnd(b.cagnotte)} ✦`;
      }

      // Frise de la run : un point par niveau, un losange pour les boss, puis l'assaut.
      const cur = b.mode === 'level' ? b.levelNumber : game.totalLevels + 1;
      const trackKey = `${run.mode || ''}${cur}/${game.totalLevels}${run.mode === 'defi' ? b.phase : ''}`;
      if (run.mode && this.el['hud-track'].dataset.key !== trackKey) {
        // Frise des modes à part : un losange par boss du rush, ou les deux phases du défi.
        this.el['hud-track'].dataset.key = trackKey;
        this.el['hud-track'].innerHTML = run.mode === 'rush'
          ? `<span class="t-grp"><span class="t-age cur">Rush</span>${run.etapes.map((e, i) => `<i class="pip boss ${i < run.i ? 'done' : i === run.i ? 'cur' : ''}" title="${C.ages[e.age].name}"></i>`).join('')}</span>`
          : b.phase === 'course'
            ? `<span class="t-grp"><span class="t-age cur">Course</span></span>`
            : `<span class="t-grp"><span class="t-age ${b.phase === 'survie' ? 'cur' : ''}">Survie</span><span class="t-age ${b.phase === 'survie' ? '' : 'cur'}">Assaut</span></span>`;
      } else if (!run.mode && this.el['hud-track'].dataset.key !== trackKey) {
        this.el['hud-track'].dataset.key = trackKey;
        const per = C.levels.perAge;
        let h = '';
        for (let a = 0; a < game.playableAges; a++) {
          const inBlock = cur > a * per && cur <= (a + 1) * per;
          h += `<span class="t-grp"><span class="t-age ${inBlock ? 'cur' : ''}">${C.ages[a].short}</span>`;
          for (let i = 1; i <= per; i++) {
            const n = a * per + i;
            const boss = i === C.levels.bossLevel;
            const state = n < cur ? 'done' : n === cur ? 'cur' : '';
            h += `<i class="pip ${state} ${boss ? 'boss' : ''}" title="Niveau ${n}${boss ? ' (boss)' : ''}"></i>`;
          }
          h += '</span>';
        }
        h += `<span class="t-grp"><span class="t-age ${cur > game.totalLevels ? 'cur' : ''}">∞ Assaut</span></span>`;
        this.el['hud-track'].innerHTML = h;
      }

      const income = b.passiveGold();
      this.el['hud-gold'].innerHTML = court(run.gold) +
        (income > 0 ? ` <small class="income">+${income.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/s</small>` : '');
      this.el['hud-age'].textContent = C.ages[run.age].short;
      this.el['hud-time'].textContent = fmtTime(b.time);
      this.el['hud-time'].classList.toggle('warn', b.mode === 'level' && b.reinf > 0);
      const atRisk = b.mode === 'level'
        ? `${Math.floor(b.killsPP)}/${Math.round(b.killsPPCap)}${b.killsPP >= b.killsPPCap ? ' max' : ''}`
        : court(Math.round(b.cagnotte));
      this.el['hud-pp'].textContent = run.mode ? '—' : `${court(run.ppLevels)} +${atRisk}`;
      this.el['hud-pp'].title = run.mode ? 'Pas de prestige pendant ce mode' : b.mode === 'level'
        ? 'Prestige à l’abri, puis celui des kills de ce niveau / plafond (mis à l’abri quand tu gagnes le niveau).'
        : 'Prestige à l’abri, puis cagnotte de l’assaut final';
      this.el['btn-pause'].textContent = game.paused ? '▶' : 'Ⅱ';
      const maxSpeed = PA.Meta.maxSpeed(game.meta);
      this.el['btn-speed'].textContent = maxSpeed > 1 ? `×${game.speed}` : '×1 🔒';
      this.el['btn-speed'].title = maxSpeed > 1
        ? `Vitesse du jeu (jusqu’à ×${maxSpeed})${maxSpeed < 3 ? ' · ×3 à acheter au camp' : ''}`
        : 'Vitesses ×2 et ×3 : à acheter au camp';

      // XP et évolution
      const next = C.evolveXp[run.age];
      const hasNext = run.age + 1 < game.playableAges;
      const fill = this.el['hud-xp-fill'];
      if (hasNext) {
        fill.style.width = `${Math.min(100, run.xp / next * 100)}%`;
        this.el['hud-xp-text'].textContent = `${court(run.xp)} / ${court(next)}`;
      } else {
        // Dernier âge de la run : l'XP ne sert plus, on n'affiche plus de compteur.
        fill.style.width = '100%';
        this.el['hud-xp-text'].textContent = 'ÂGE MAX';
      }
      this.el['btn-evolve'].disabled = !b.canEvolve();
      // Âges cachés (js/magma.js, js/ages-caches.js) : quand le phénomène a tout recouvert, Évoluer devient Plonger.
      const pl = b.plongeeInfo ? b.plongeeInfo() : (b.plongeePossible && b.plongeePossible() ? { texte: 'Plonger dans le magma', cls: 'magma' } : null);
      const labelEvo = pl ? pl.texte : 'Évoluer';
      for (const k of ['magma', 'abysses', 'givre', 'neon']) this.el['btn-evolve'].classList.toggle(k, !!pl && pl.cls === k);
      if (this.el['btn-evolve'].textContent !== labelEvo) this.el['btn-evolve'].textContent = labelEvo;
      this.el['btn-evolve'].style.visibility = hasNext ? '' : 'hidden';   // garde sa place : le bandeau ne bouge pas

      // Boutons d'achat
      const units = C.ages[run.age].units;
      [...this.el['unit-buttons'].children].forEach((btn, i) => {
        if (btn.classList.contains('locked')) {
          btn.querySelector('.cost').textContent = `🔒 ${court(PA.Meta.eliteCost(run.age))} ✦`;
          btn.disabled = b.over;
          return;
        }
        const cost = b.unitCost(units[i]);
        btn.querySelector('.cost').textContent = court(cost);
        // défi « Une seule unité » ; !! : sans défi, toggle(…, undefined) inverserait la classe à chaque mise à jour
        const interdit = !!(b.defi && b.defi.regle.id === 'solo' && i !== b.defi.solo);
        btn.classList.toggle('cant', run.gold < cost || interdit);
        btn.disabled = b.over;
      });
      const turrets = C.ages[run.age].turrets;
      const freeSlot = run.turrets.some(t => !t);
      [...this.el['turret-buttons'].children].forEach((btn, i) => {
        btn.classList.toggle('cant', run.gold < turrets[i].cost || !freeSlot || !!(b.defi && b.defi.regle.id === 'or2'));
        btn.disabled = b.over;
      });

      // File d'entraînement : une pastille par unité en attente, la première se remplit de bas en haut.
      // Les pastilles restent en place : on ne change que l'image qui doit changer. Reconstruites à chaque
      // sortie d'unité, leurs images se rechargeaient et, sur téléphone, toute la file clignotait.
      // Encore mieux : pas d'<img> du tout. Quand une unité sort, toutes les autres avancent d'une case ;
      // changer le src de chaque image la faisait redécoder, et sur téléphone ça clignotait quand même.
      // Chaque case est un petit canevas où l'on redessine une image déjà décodée (this.vignette).
      const q = this.el.queue;
      if (q.children.length !== C.economy.queueSize) {
        q.innerHTML = '<div class="q-slot"><div class="fill"></div><canvas width="64" height="64"></canvas></div>'.repeat(C.economy.queueSize);
      }
      [...q.children].forEach((slot, i) => {
        const item = b.queue[i], cv = slot.lastChild, fill = slot.firstChild;
        const src = item ? PA.Render.portrait('unit', item.def) : '';
        slot.classList.toggle('on', !!item);
        if (cv.dataset.src !== src) this.peindre(cv, src);
        fill.style.height = i === 0 && item ? `${(1 - item.t / item.total) * 100}%` : '0';
      });

      // Emplacements de tourelles : une case par emplacement, puis « + » pour en acheter un.
      const slotsEl = this.el.slots;
      const armed = this.sellArmed && now < this.sellArmed.until ? this.sellArmed.slot : -1;
      let sh = '';
      run.turrets.forEach((t, i) => {
        if (!t) { sh += '<div class="slot-chip empty" title="Emplacement libre : achète une tourelle à droite"></div>'; return; }
        const def = C.ages[t.age].turrets[t.idx];
        const refund = court(Math.round(def.cost * C.economy.turretSellRefund));
        sh += armed === i
          ? `<button class="slot-chip armed" data-sell="${i}" title="Appuie encore pour vendre"><span>Vendre<b>+${refund}</b></span></button>`
          : `<button class="slot-chip full" data-sell="${i}" title="${def.name} : appuie pour vendre (+${refund} or)"><canvas width="96" height="96" data-v="${PA.Render.portrait('turret', def)}"></canvas><i>×</i></button>`;
      });
      const sc = b.slotCost();
      // « cant » se règle à part : sinon chaque passage de l'or au-dessus ou en dessous du prix reconstruisait
      // toutes les cases, et les images des tourelles posées clignotaient.
      if (sc != null) sh += `<button class="slot-chip add" data-slot="1" title="Acheter un emplacement de tourelle"><b>+</b><span>${court(sc)}</span></button>`;
      if (slotsEl.dataset.html !== sh) {
        slotsEl.innerHTML = sh;
        slotsEl.dataset.html = sh;
        slotsEl.querySelectorAll('canvas[data-v]').forEach(cv => this.peindre(cv, cv.dataset.v));
      }
      const addBtn = slotsEl.querySelector('.add');
      if (addBtn) addBtn.classList.toggle('cant', run.gold < sc);

      // Pouvoir spécial : le bouton se remplit de bas en haut pendant la recharge.
      const sp = b.special;                               // le pouvoir équipé pour cet âge (js/pouvoirs.js)
      const spBtn = this.el['btn-special'];
      const ready = b.specialCd <= 0;
      spBtn.classList.toggle('ready', ready);
      const spKey = `${ready ? '✦' : Math.ceil(b.specialCd)}|${sp.name}`;
      if (spBtn.dataset.key !== spKey) {
        spBtn.dataset.key = spKey;
        spBtn.innerHTML = `<div class="cdfill"></div><span><b>${ready ? '✦' : Math.ceil(b.specialCd)}</b>${sp.name}</span>`;
      }
      spBtn.firstChild.style.height = `${ready ? 100 : (1 - b.specialCd / b.specialCooldown()) * 100}%`;

      // Reliques
      const counts = {};
      run.relics.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
      const rh = Object.keys(counts).map(id => {
        const r = C.relics.find(x => x.id === id);
        if (r.element) {
          const col = C.elements[r.element].color;
          return `<span class="relic-chip elem" style="border-color:${col};color:${col}" title="${PA.elementDesc(r.element, counts[id])}">${r.icon} ${r.name} niv. ${counts[id]}</span>`;
        }
        return `<span class="relic-chip" title="${r.desc}">${r.icon} ${r.name}${counts[id] > 1 ? ' ×' + counts[id] : ''}</span>`;
      }).join('') || '<span class="muted">Aucune pour l’instant</span>';
      if (this.el.relics.dataset.html !== rh) { this.el.relics.innerHTML = rh; this.el.relics.dataset.html = rh; }
    },

    // ------------------------------------------------------------- fenêtres
    // camp = true : plein écran, fond transparent (le décor du jeu reste visible derrière)
    overlay(html, handlers, camp) {
      const card = this.el['overlay-card'];
      card.className = camp ? 'camp-card' : '';
      this.el.overlay.classList.toggle('is-camp', !!camp);
      card.innerHTML = html;
      this.el.overlay.classList.remove('hidden');
      card.scrollTop = 0;
      card.querySelectorAll('[data-action]').forEach(el => {
        el.onclick = () => {
          const fn = handlers[el.dataset.action];
          if (fn) fn(el.dataset.arg, el);
        };
      });
    },

    hideOverlay() {
      this.el.overlay.classList.add('hidden');
    },

    showCamp() {
      const game = this.game;
      const meta = game.meta;
      const P = C.prestige;
      const unlocked = PA.Meta.unlockedAgeCount(meta);

      const ages = P.ageNames.map((name, i) => {
        const on = i < unlocked;
        const exists = i < C.ages.length;
        let status;
        const cost = P.ageCosts[i];
        if (on && exists) status = '<span class="good">Débloqué</span>';
        else if (on) status = '<span class="good">Débloqué</span> · contenu à venir';
        else if (i > unlocked) status = `${fmt(cost)} ✦<br><span class="muted">Débloque d’abord ${P.ageNames[i - 1]}</span>`;
        else {
          // Le prochain âge à acheter : barre de progression du solde vers son prix.
          const k = Math.min(100, meta.balance / cost * 100);
          status = `${fmt(Math.min(meta.balance, cost))} / ${fmt(cost)} ✦<div class="pbar"><div style="width:${k}%"></div></div>` + (exists
            ? `<button data-action="buyAge" ${meta.balance < cost ? 'disabled' : ''}>Débloquer</button>`
            : '<button disabled title="Cet âge n’existe pas encore dans le prototype">Bientôt</button>');
        }
        return `<div class="age-pill ${on ? 'on' : i === unlocked ? 'next' : ''}"><div class="n">${i + 1}. ${name}</div>${status}</div>`;
      }).join('');

      const nextAgeName = P.ageNames[unlocked];
      const ups = C.upgrades.map(up => {
        const lvl = PA.Meta.level(meta, up.id);
        const lim = PA.Meta.upgradeLimit(meta, up);
        const cost = PA.Meta.upgradeCost(meta, up);
        let btn;
        if (lvl >= up.max) btn = '<button disabled>Max</button>';
        else if (cost == null) btn = `<button disabled title="Débloquer d’autres âges relève le plafond">🔒 ${nextAgeName || 'Max'}</button>`;
        else btn = `<button data-action="buy" data-arg="${up.id}" ${meta.balance < cost ? 'disabled' : ''}>${fmt(cost)} ✦</button>`;
        // jauge : niveaux acquis en jaune, niveaux encore sous le plafond en bleu, niveaux verrouillés en sombre
        let dots = ''; for (let k = 0; k < up.max; k++) dots += `<i class="${k < lvl ? 'on' : k >= lim ? 'cap' : ''}"></i>`;
        return `<div class="upgrade"><div><div class="name">${up.name} <span class="lvl">niv. ${lvl}/${up.max}</span></div><div class="desc">${up.desc}</div><div class="lvl-dots">${dots}</div></div>${btn}</div>`;
      }).join('');

      // Unités d'élite : une par âge, achetable une fois l'âge débloqué.
      const playable = PA.Meta.playableAgeCount(meta);
      const elites = C.ages.map((age, i) => {
        const def = PA.Meta.eliteDef(i);
        if (!def) return '';
        const cost = PA.Meta.eliteCost(i);
        let btn;
        if (PA.Meta.hasElite(meta, i)) btn = '<span class="good">Débloquée</span>';
        else if (i >= playable) btn = `<button disabled title="Débloque d’abord l’âge ${P.ageNames[i]}">🔒 ${P.ageNames[i]}</button>`;
        else btn = `<button data-action="buyElite" data-arg="${i}" ${meta.balance < cost ? 'disabled' : ''}>${fmt(cost)} ✦</button>`;
        const role = def.kind === 'melee' ? 'mêlée' : `portée ${def.range}`;
        return `<div class="upgrade elite-card"><div><div class="name">★ ${def.name} <span class="lvl">${P.ageNames[i]}</span></div>` +
          `<div class="desc">${def.desc} · ${role} · ${fmt(def.hp)} PV · ${fmt(def.cost)} or</div></div>${btn}</div>`;
      }).join('');

      // Pouvoirs ultimes : quatre par âge. Celui de contrôle est donné, les trois autres s'achètent ; un seul est équipé.
      const pouvoirs = C.ages.map((age, i) => {
        const prix = PA.Pouvoirs.cout(i), equipe = PA.Pouvoirs.choisi(meta, i);
        const cartes = PA.Pouvoirs.liste(i).map(p => {
          let btn;
          if (i >= playable) btn = `<button disabled title="Débloque d’abord l’âge ${P.ageNames[i]}">🔒</button>`;
          else if (p === equipe) btn = '<span class="good">Équipé</span>';
          else if (PA.Pouvoirs.possede(meta, i, p.id)) btn = `<button data-action="equiperPouvoir" data-arg="${i}|${p.id}">Équiper</button>`;
          else btn = `<button data-action="acheterPouvoir" data-arg="${i}|${p.id}" ${meta.balance < prix ? 'disabled' : ''}>${fmt(prix)} ✦</button>`;
          return `<div class="upgrade pouvoir-carte${p === equipe && i < playable ? ' on' : ''}"><div><div class="name">${p.name} <span class="genre g-${p.genre.toLowerCase().replace('ô', 'o')}">${p.genre}</span></div><div class="desc">${p.desc}</div></div>${btn}</div>`;
        }).join('');
        return `<h3 class="pouvoir-age${i >= playable ? ' verrou' : ''}">${P.ageNames[i]}</h3>${cartes}`;
      }).join('');

      // Vitesses de jeu, dans l'ordre : ×2 puis ×3.
      const ms = PA.Meta.maxSpeed(meta);
      const speeds = P.speedCosts.map((cost, k) => {
        const mult = k + 2;
        let btn;
        if (ms >= mult) btn = '<span class="good">Achetée</span>';
        else if (ms < mult - 1) btn = `<button disabled>🔒 ×${mult - 1} d’abord</button>`;
        else btn = `<button data-action="buySpeed" ${meta.balance < cost ? 'disabled' : ''}>${fmt(cost)} ✦</button>`;
        const desc = mult === 2 ? 'Le combat peut aller deux fois plus vite (bouton en haut à droite).' : 'Encore plus vite : le bouton passe ×1 → ×2 → ×3.';
        return `<div class="upgrade"><div><div class="name">Vitesse ×${mult}</div><div class="desc">${desc} Ne change ni l’or, ni l’XP, ni le prestige.</div></div>${btn}</div>`;
      }).join('');

      const loss = PA.Meta.lossRate(meta);
      const D = PA.diff(meta), DH = C.difficulties.difficile;
      // Écran de départ à onglets : Bataille (accueil), Améliorations, Âges, Élites, Vitesse, et l'aide (bouton « ? »).
      if (this.campTab === 'speed') { this.campTab = 'ups'; this.campSous = 'speed'; }   // l'ancien onglet Vitesse
      const tab = this.campTab || 'play', sous = this.campSous === 'speed' ? 'speed' : 'bonus';
      const nextCost = PA.Meta.nextAgeCost(meta);
      const canAge = nextCost != null && unlocked < C.ages.length && meta.balance >= nextCost;
      const bodies = {
        play: `<div class="hero">
            ${canAge ? `<div class="badge">NOUVEL ÂGE<br>disponible !</div>` : ''}
            <h1>TIME <br><em>BREAKERS</em></h1>
            <button class="play" data-action="start">JOUER</button>
            ${PA.Mutateurs ? PA.Mutateurs.bouton(meta) : ''}
            <div class="decouvrir">${PA.Tuto ? '<button class="tuto" data-action="tuto">Tutoriel</button><button class="visite" data-action="guide">Visite des menus</button>' : ''}${PA.Modes ? this.boutonsModes(meta) : ''}</div>
            <div class="stats">${PA.Meta.playableAgeCount(meta)} âges sur ${C.ages.length} · Meilleur niveau ${meta.bestLevel} · Meilleure vague ${meta.bestWave} · ${meta.runs} run${meta.runs > 1 ? 's' : ''}<small>${D.name} : ${D.desc}</small></div>
          </div>`,
        // Améliorations : deux sous-catégories, « Bonus » et « Vitesse » (l'ancien onglet Vitesse).
        ups: `<div class="seg sous-onglets"><button data-action="sous" data-arg="bonus" class="${sous === 'bonus' ? 'on' : ''}">Bonus</button><button data-action="sous" data-arg="speed" class="${sous === 'speed' ? 'on' : ''}">Vitesse</button></div>` +
          (sous === 'speed'
            ? `<p class="camp-hint">Accélère le combat. Ne change ni l’or, ni l’XP, ni le prestige.</p><div class="upgrades">${speeds}</div>`
            : `<p class="camp-hint">Bonus permanents, valables à chaque run. Débloquer des âges relève le plafond.</p><div class="upgrades">${ups}</div>`),
        ages: `<p class="camp-hint">Chaque âge débloqué ajoute 5 niveaux à la run. Ils s’achètent dans l’ordre.</p><div class="ages">${ages}</div>`,
        elites: `<p class="camp-hint">La 4e unité de chaque âge : dégâts de zone, réservée à ton armée.</p><div class="upgrades">${elites}</div>`,
        rush: PA.Modes && tab === 'rush' ? this.panneauRush(meta) : '',
        defi: PA.Modes && tab === 'defi' ? this.panneauDefi(meta) : '',
        hf: PA.HautsFaits && tab === 'hf' ? PA.HautsFaits.panneau(meta) : '',   // hauts faits (js/hauts-faits.js)
        bestiaire: PA.Bestiaire && tab === 'bestiaire' ? PA.Bestiaire.panneau(meta) : '',   // bestiaire (js/collection.js)
        mutateurs: PA.Mutateurs && tab === 'mutateurs' ? PA.Mutateurs.panneau(meta) : '',   // mutateurs (js/mutateurs.js)
        pouvoirs: `<p class="camp-hint">Un pouvoir équipé par âge. Celui de contrôle est offert ; les trois autres s’achètent une fois l’âge débloqué.</p><div class="upgrades pouvoirs">${pouvoirs}</div>`,
      };
      const tabs = [['ups', '⚒', 'Améliorations'], ['ages', '⏳', 'Âges'], ['play', '⚔', 'Bataille'], ['elites', '★', 'Élites'], ['pouvoirs', '✦', 'Pouvoirs']]
        .map(([id, ic, nom]) => `<button data-action="tab" data-arg="${id}" class="${tab === id ? 'on' : ''}"><i>${ic}</i>${nom}</button>`).join('');
      const aide = `
        <h3>Son</h3>
        <div class="reglage-son">
          <label for="vol-musique">Musique</label>
          <input type="range" id="vol-musique" min="0" max="100" value="${Math.round(PA.Music.volume * 100)}">
          <div class="seg">${Object.keys(PA.Music.SONORITES).map(so => `<button data-action="sonorite" data-arg="${so}" class="${PA.Music.sonorite === so ? 'on' : ''}">${PA.Music.SONORITES[so]}</button>`).join('')}</div>
        </div>
        <div class="reglage-son">
          <label for="vol-effets">Effets sonores</label>
          <input type="range" id="vol-effets" min="0" max="100" value="${Math.round(PA.Music.fxVol * 100)}">
          <div class="seg"><button data-action="effets" data-arg="1" class="${PA.Music.fx ? 'on' : ''}">Oui</button><button data-action="effets" data-arg="0" class="${PA.Music.fx ? '' : 'on'}">Non</button></div>
        </div>
        <div class="reglage-son">
          <label>Style des effets</label>
          <div class="seg"><button data-action="styleFx" data-arg="synthe" class="${PA.Music.fxMode === 'reel' && PA.Sons.reelDispo() ? '' : 'on'}">Synthétisés</button><button data-action="styleFx" data-arg="reel" class="${PA.Music.fxMode === 'reel' && PA.Sons.reelDispo() ? 'on' : ''}"${PA.Sons.reelDispo() ? '' : ' disabled title="Les enregistrements ne sont pas installés"'}>Enregistrements</button></div>
          ${PA.Sons.reelDispo() ? '' : '<span class="muted">(enregistrements pas encore installés)</span>'}
        </div>
        ${PA.DEV ? `<div class="reglage-son">
          <label>Effets visuels</label>
          <div class="seg">${Object.keys(PA.Fx.STYLES).map(s => `<button data-action="styleVisuel" data-arg="${s}" class="${PA.Fx.style === s ? 'on' : ''}">${PA.Fx.STYLES[s]}</button>`).join('')}</div>
          <span class="muted">(version perso : à essayer en combat)</span>
        </div>` : ''}
        <h3>Comment jouer</h3>
        <ul class="rules">
          <li>Achète des unités : elles avancent seules et attaquent la première cible devant elles. Les tireurs visent par-dessus tes troupes.</li>
          <li>Chaque ennemi tué rapporte de l’or et de l’XP. Avec assez d’XP, <b>Évoluer</b> te fait passer à l’âge suivant. Rien ne t’y oblige.</li>
          <li><b>5 niveaux par âge.</b> Gagner un niveau en ayant un âge de retard rapporte +${Math.round(P.outsiderPerAge * 100)} % de prestige. Le gagner vite rapporte jusqu’à +${Math.round(P.speedBonusMax * 100)} %.</li>
          <li><b>Deux difficultés</b>, chacune avec sa propre progression (boutons en haut de cet écran). En <b>Difficile</b> : chaque niveau s’ouvre sur une <b>ruée</b> d’ennemis enragés (anneau rouge) qui foncent vers ta base, tous les ennemis ont +${Math.round((DH.enemyStat - 1) * 100)} % de PV et de dégâts, puis ${Math.round(DH.enemyStatPerAge * 100)} points de plus à chaque âge, et ta base n’est réparée que de ${pct(DH.repair)} entre deux niveaux (${pct(C.difficulties.facile.repair)} en Facile).</li>
          <li>Dans un niveau, les kills rapportent au plus autant de prestige que la victoire elle-même : inutile de traîner pour farmer.</li>
          <li>Parmi les récompenses, des <b>éléments</b> peuvent apparaître : ❄️ Glace (ralentit), 🔥 Feu (brûlure), ⚡ Foudre (rebonds). Un seul élément par run, qui peut monter jusqu’au niveau 3.</li>
          <li>Au bout de ${fmtTime(C.levels.reinforcements.startAfter)}, l’ennemi reçoit des <b>renforts</b> : +${Math.round(C.levels.reinforcements.statPerStep * 100)} % de puissance toutes les ${C.levels.reinforcements.every} s. Ne t’éternise pas.</li>
          <li>Après le dernier niveau vient l’<b>assaut final</b>, qui ne s’arrête jamais. Toutes les ${C.assault.windowEvery} vagues, tu choisis : te retirer (tu gardes tout) ou continuer (multiplicateur plus élevé).</li>
          <li>Si ta base tombe, tu perds ${pct(loss)} des points qui ne sont pas encore à l’abri. Les points d’un niveau sont mis à l’abri quand tu le termines.</li>
          <li>Les âges suivants s’<b>achètent</b> ici avec tes points de prestige. Chaque âge débloqué ajoute 5 niveaux à la run et relève peu à peu le plafond des améliorations (niveau ${C.prestige.upgradeCapByAges[2]} au départ, ${C.prestige.upgradeCapByAges[C.prestige.upgradeCapByAges.length - 1]} avec les ${C.ages.length} âges).</li>
          <li>Chaque âge a quatre <b>pouvoirs ✦</b> : celui de contrôle est offert, les trois autres s’achètent ici. Tu en équipes un seul par âge.</li>
          <li>Chaque âge a aussi une <b>unité d’élite ★</b> (touche 4) qui frappe en zone. Elle s’achète ici une fois l’âge débloqué, et l’ennemi n’en a pas.</li>
        </ul>
        ${PA.DEV ? `<details class="dev">
          <summary>Outils de test (version perso)</summary>
          <p class="muted">Pour essayer les âges suivants sans tout farmer. Absents de la version publique.</p>
          <div class="actions" style="justify-content:flex-start;margin-top:8px">
            <button data-action="devPP" data-arg="1000">+1 000 ✦</button>
            <button data-action="devPP" data-arg="100000">+100 000 ✦</button>
            <button data-action="devAges">Débloquer tous les âges</button>
            <button data-action="devElites">Élites + vitesses + pouvoirs</button>
          </div>
        </details>` : ''}
        <div class="actions"><button class="danger" data-action="reset">Réinitialiser la progression (${D.name})</button></div>`;
      this.overlay(`
        <div class="camp-top">
          <div class="cur" title="Points de prestige"><i>✦</i>${fmt(meta.balance)}</div>
          <div class="seg" title="Chaque difficulté a sa propre progression">${Object.keys(C.difficulties).map(id => `<button data-action="diff" data-arg="${id}" class="d-${id}${id === meta.difficulty ? ' on' : ''}">${C.difficulties[id].name}</button>`).join('')}</div>
          <div class="side">${meta.totalEarned > meta.balance ? `<span class="muted">Total gagné : ${fmt(meta.totalEarned)} ✦</span>` : ''}${PA.Bestiaire ? `<button data-action="tab" data-arg="${tab === 'bestiaire' ? 'play' : 'bestiaire'}" class="hf-bouton" title="Bestiaire">${tab === 'bestiaire' ? '✕' : '📖'}</button>` : ''}${PA.HautsFaits ? `<button data-action="tab" data-arg="${tab === 'hf' ? 'play' : 'hf'}" class="hf-bouton" title="Hauts faits">${tab === 'hf' ? '✕' : '🏆'}</button>` : ''}<button data-action="musique" class="son${PA.Music.on ? '' : ' off'}" title="Musique : oui / non">♪</button><button data-action="bruitages" class="son${PA.Music.fx ? '' : ' off'}" title="Effets sonores : oui / non">🔊</button><button data-action="tab" data-arg="${tab === 'aide' ? 'play' : 'aide'}" title="Aide et réglages">${tab === 'aide' ? '✕' : '?'}</button></div>
        </div>
        <div class="camp-body ${tab === 'play' ? '' : 'list'}">${tab === 'aide' ? `<div>${aide}</div>` : bodies[tab]}</div>
        <nav class="tabs">${tabs}</nav>
      `, (() => {
      // Un achat réussi (le solde a baissé) fait tinter des pièces (js/sons.js).
      const achat = (fn, gros) => {
        const avant = meta.balance;
        fn();
        if (meta.balance < avant && PA.Sons && PA.Sons.achat) PA.Sons.achat(gros);
        this.showCamp();
      };
      return {
        tab: t => { this.campTab = t; this.showCamp(); },
        sous: s => { this.campSous = s; this.showCamp(); },
        // JOUER : qui n'a jamais fait le tutoriel se voit poser la question une fois (js/tuto.js).
        start: () => { if (PA.Tuto && PA.Tuto.doitConfirmer()) return PA.Tuto.confirmer(); this.campTab = 'play'; if (PA.Mutateurs) PA.Mutateurs.armer(meta); game.newRun(); },
        tuto: () => PA.Tuto.lancer(),
        // Boss rush et défi du jour (js/modes.js)
        lancerRush: () => { if (PA.Modes.rushOuvert(meta) && PA.Modes.rushEtapes(meta).length) PA.Modes.lancerRush(); },
        lancerDefi: () => { if (PA.Modes.defiOuvert(meta)) PA.Modes.lancerDefi(); },
        guide: () => { this.campTab = 'play'; this.showCamp(); PA.Tuto.guide(); },
        diff: d => game.setDifficulty(d),
        musique: (arg, el) => { const on = PA.Music.basculer(); el.classList.toggle('off', !on); },
        // bouton rapide des effets sonores ; tient à jour le « Oui / Non » de l'aide s'il est affiché
        bruitages: (arg, el) => { const on = PA.Music.basculerFx(); el.classList.toggle('off', !on); document.querySelectorAll('[data-action="effets"]').forEach(b => b.classList.toggle('on', (b.dataset.arg === '1') === on)); },
        styleVisuel: (s, el) => { PA.Fx.choisir(s); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
        styleFx: (mode, el) => { if (mode === 'reel' && !PA.Sons.reelDispo()) return; PA.Music.fxMode = mode; PA.Music.sauver(); if (mode === 'reel') { PA.Music.contexte(); PA.Sons.precharger(); } el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); if (PA.Music.fx) PA.Sons.apercu('raptor'); },
        effets: (oui, el) => { PA.Music.fx = oui === '1'; PA.Music.sauver(); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); document.querySelectorAll('[data-action="bruitages"]').forEach(b => b.classList.toggle('off', !PA.Music.fx)); if (PA.Music.fx && PA.Sons) PA.Sons.apercu('raptor'); },
        sonorite: (so, el) => { PA.Music.choisirSonorite(so); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
        // Outils de test : ne font rien dans la version publique (PA.DEV est faux), même appelés à la main.
        devPP: n => { if (!PA.DEV) return; meta.balance += Number(n) || 1000; PA.Meta.save(meta); this.showCamp(); },
        devAges: () => { if (!PA.DEV) return; meta.agesUnlocked = C.ages.length; PA.Meta.save(meta); this.showCamp(); },
        devElites: () => {
          if (!PA.DEV) return;
          meta.elites = {};
          C.ages.forEach((a, i) => { const d = PA.Meta.eliteDef(i); if (d) meta.elites[d.id] = true; });
          meta.maxSpeed = 1 + C.prestige.speedCosts.length;
          PA.Pouvoirs.toutDebloquer(meta);
          PA.Meta.save(meta); this.showCamp();
        },
        buyAge: () => achat(() => PA.Meta.buyAge(meta), true),
        buy: id => achat(() => PA.Meta.buyUpgrade(meta, id)),
        buyElite: i => achat(() => PA.Meta.buyElite(meta, Number(i))),
        acheterPouvoir: a => { const [i, id] = a.split('|'); achat(() => PA.Pouvoirs.acheter(meta, Number(i), id)); },
        equiperPouvoir: a => { const [i, id] = a.split('|'); PA.Pouvoirs.equiper(meta, Number(i), id); this.showCamp(); },
        buySpeed: () => achat(() => PA.Meta.buySpeed(meta)),
        reset: (arg, el) => {
          if (el.dataset.confirm) { game.meta = PA.Meta.reset(meta.difficulty); this.showCamp(); return; }
          el.dataset.confirm = '1';
          el.textContent = 'Appuie encore pour tout effacer';
        },
      };
      })(), true);
      const vol = document.getElementById('vol-musique');
      if (vol) vol.oninput = e => PA.Music.regler(e.target.value / 100);
      const volFx = document.getElementById('vol-effets');
      if (volFx) {
        volFx.oninput = e => PA.Music.reglerFx(e.target.value / 100);
        volFx.onchange = () => { if (PA.Sons) PA.Sons.apercu('cogneur'); };   // un petit coup pour juger le niveau
      }
    },

    // ------------------------------------------------ boss rush et défi du jour (js/modes.js)
    boutonsModes(meta) {
      const M = PA.Modes, s = M.etatDefi(meta);
      const fait = s.dernierReussi === s.jour;
      const defi = M.defiOuvert(meta)
        ? `<button class="mode-btn defi" data-action="tab" data-arg="defi"><b>☀ Défi du jour</b><small>${fait ? '✓ réussi aujourd’hui' : M.defi().regle.nom}</small></button>`
        : '<button class="mode-btn defi" disabled title="Termine une première partie"><b>🔒 Défi du jour</b><small>après ta première partie</small></button>';
      const rush = M.rushOuvert(meta)
        ? `<button class="mode-btn rush" data-action="tab" data-arg="rush"><b>♛ Boss rush</b><small>${M.nbVaincus(meta)} / ${PA.Champions.DEFS.flat().length} champions</small></button>`
        : `<button class="mode-btn rush" data-action="tab" data-arg="rush"><b>🔒 Boss rush</b><small>galerie : ${M.nbVaincus(meta)} / ${PA.Champions.DEFS.flat().length}</small></button>`;
      return defi + rush;
    },

    panneauRush(meta) {
      const M = PA.Modes, P = C.prestige;
      const ouvert = M.rushOuvert(meta), etapes = M.rushEtapes(meta);
      const r = meta.rush && meta.rush.v === 2 ? meta.rush : { best: 0, temps: null, complets: 0 };
      const ICONES = [0, 1, 2, 3].map(med);
      const galerie = C.ages.map((age, a) => {
        const cartes = (PA.Champions.DEFS[a] || []).map(d => {
          const m = M.medaille(meta, d.id);
          return `<div class="champ-carte${m ? '' : ' inconnu'}" title="${m ? d.desc : 'Pas encore vaincu'}">
            <img alt="" src="${PA.Render.portrait('unit', d)}"><span class="nom">${m ? d.name : '???'}</span>${ICONES[m]}</div>`;
        }).join('');
        return `<div class="champ-age"><h4>${P.ageNames[a]}</h4><div class="champ-ligne">${cartes}</div></div>`;
      }).join('');
      const nb = M.nbChampions();
      const record = r.best ? `Record : <b>${r.best} / ${nb} champions</b> d’affilée${r.temps != null ? ` en ${fmtTime(r.temps)}` : ''}${r.complets ? ` · ${r.complets} rush${r.complets > 1 ? 's' : ''} complet${r.complets > 1 ? 's' : ''}` : ''}` : 'Pas encore de record.';
      const bouton = !ouvert
        ? '<button class="primary" disabled>🔒 Atteins un premier assaut final</button>'
        : `<button class="primary" data-action="lancerRush">Lancer le rush (${etapes.length} âges, ${nb} champions)</button>`;
      return `<div class="mode-panneau">
        <h2>♛ Boss rush</h2>
        <p class="camp-hint">Rien que des boss : les ${nb} champions, âge par âge, les trois de chaque âge l’un après l’autre. Pas d’unités ordinaires en face. Ton armée a l’âge des champions et reçoit un peu d’or chaque seconde. Entre deux âges : une récompense au choix et +25 % de PV pour ta base. Pas de prestige ici, seulement des records et des médailles.</p>
        <p class="mode-record">${record}</p>
        <div class="actions">${bouton}</div>
        <h3>Galerie des champions <small class="legende">${med(1)} vaincu en partie ${med(2)} vaincu au rush ${med(3)} au rush, base au-dessus de 50 %</small></h3>
        <div class="galerie">${galerie}</div>
      </div>`;
    },

    panneauDefi(meta) {
      const M = PA.Modes, d = M.defi(), s = M.etatDefi(meta);
      const ouvert = M.defiOuvert(meta);
      const regle = d.regle.id === 'solo'
        ? `${d.regle.desc} Aujourd’hui : <b>${d.type === 'course' ? `ton unité n° ${d.solo + 1} (${C.ages[0].units[d.solo].name} au Jurassique)` : C.ages[d.age].units[d.solo].name}</b>.`
        : d.regle.desc;
      const gain = s.recompense === s.jour ? '<span class="muted">Récompense du jour déjà touchée</span>' : `<b style="color:var(--pp)">+${fmt(M.recompenseDefi(meta))} ✦</b> au premier succès du jour`;
      const best = s.meilleur ? `Ton meilleur aujourd’hui : <b>${fmtTime(s.meilleur.t)}</b>, base à ${s.meilleur.base} %` : 'Pas encore réussi aujourd’hui.';
      return `<div class="mode-panneau">
        <h2>☀ Défi du jour</h2>
        <p class="mode-nom">${d.nom}</p>
        <p class="camp-hint">Le même défi pour tout le monde aujourd’hui. Tes améliorations et tes élites ne comptent pas : tout le monde part à égalité.</p>
        ${d.type === 'course' ? this.grilleCourse(d, regle) : `<div class="defi-grille">
          <div><span class="muted">Ton armée</span><b>${C.ages[d.age].name}</b></div>
          <div><span class="muted">L’ennemi</span><b>${C.ages[d.ennemi].name}</b><small>sa base t’attend avec une tourelle</small></div>
          <div><span class="muted">Les vagues</span><b>${d.melange.nom}</b><small>${d.melange.desc}</small></div>
          <div><span class="muted">La règle</span><b>${d.regle.nom}</b><small>${regle}</small></div>
        </div>
        <ol class="rules defi-etapes"><li><b>Survis ${Math.floor(M.SURVIE / 60)} minutes</b> : la base ennemie est intouchable et envoie des unités de plusieurs âges.</li><li><b>La porte se ferme</b> : plus de renforts. Détruis sa base le plus vite possible.</li></ol>`}
        <p class="mode-record">${best} · Essais : ${s.essais} · Série : <b>${s.serie} jour${s.serie > 1 ? 's' : ''}</b><br>${gain}</p>
        <div class="actions">${ouvert ? '<button class="primary" data-action="lancerDefi">Relever le défi</button>' : '<button class="primary" disabled>🔒 Termine d’abord une partie</button>'}</div>
      </div>`;
    },

    // Défi « course » : ce qui t'attend en face.
    grilleCourse(d, regle) {
      const unites = d.unites.map(o => `${C.ages[o.age].units[o.idx].name} <span class="muted">(${C.ages[o.age].name})</span>`).join('<br>');
      const ch = PA.Champions.DEFS[d.champion.age][d.champion.k], t = C.ages[d.tourelle.age].turrets[d.tourelle.idx];
      return `<div class="defi-grille">
          <div><span class="muted">Ton armée</span><b>${C.ages[0].name}</b><small>comme une vraie partie : tu évolues avec l’XP</small></div>
          <div><span class="muted">L’ennemi</span><b>${C.ages[d.ennemi].name}</b><small>sa base est gardée par : ${t.name} (${C.ages[d.tourelle.age].name})</small></div>
          <div><span class="muted">Ses unités</span><small>${unites}</small></div>
          <div><span class="muted">Son champion</span><b>${ch.name}</b><small>${C.ages[d.champion.age].name} · revient régulièrement · ${ch.desc}</small></div>
          <div><span class="muted">La règle</span><b>${d.regle.nom}</b><small>${regle}</small></div>
        </div>
        <ol class="rules defi-etapes"><li><b>Pars de zéro</b> : tue, gagne de l’XP et évolue pour rattraper son âge. Ses unités plus récentes arrivent au fil du temps.</li><li><b>Détruis sa base</b> le plus vite possible : c’est ton temps qui compte.</li></ol>`;
    },

    showRushEtape(run, b, choix) {
      const prec = run.etapes[run.i - 1], suiv = run.etapes[run.i];
      const tombes = run.medailles.slice(-prec.ks.length);
      const noms = suiv.ks.map(k => PA.Champions.DEFS[suiv.age][k].name).join(', ');
      const cards = choix.map(id => {
        const r = C.relics.find(x => x.id === id), tx = PA.relicText(r, run.relics);
        const style = r.element ? ` style="border-color:${C.elements[r.element].color}"` : '';
        return `<button class="card${r.element ? ' elem' : ''}"${style} data-action="relic" data-arg="${r.id}"><span class="icon">${r.icon}</span><span class="name">${tx.name}</span><span class="desc">${tx.desc}</span></button>`;
      }).join('');
      this.overlay(`
        <h2>${C.ages[prec.age].name} : tous ses champions sont tombés !</h2>
        <p class="sub">${tombes.map(x => `${x.ch.name} ${med(x.m)}${x.neuve ? ' <span class="good">nouvelle</span>' : ''}`).join(' · ')}</p>
        <p class="sub">Temps : ${fmtTime(b.time)} · Choisis une récompense :</p>
        <div class="cards">${cards}</div>
        <div class="next-box"><b>Prochain âge (${run.i + 1} / ${run.etapes.length}) : ${C.ages[suiv.age].name}</b> — ${noms}</div>
        <p class="muted">Ta base récupère 25 % de ses PV et ton or est remplacé par une somme fixe.</p>
      `, { relic: id => PA.Modes.choisirRush(id) });
    },

    showRushFin(o) {
      const game = this.game, run = o.run;
      const lignes = run.medailles.map((x, i) => `<tr><td>${i + 1}. ${x.ch.name} ${med(x.m)}${x.neuve ? ' <span class="good">nouvelle</span>' : ''}</td><td>${fmtTime(x.t)}</td></tr>`).join('');
      const titre = o.complet ? 'Rush terminé : tous les boss sont tombés !' : o.result === 'abandon' ? 'Rush abandonné' : 'Ta base est tombée';
      this.overlay(`
        <h2>${titre}</h2>
        <p class="sub">${run.medailles.length} / ${PA.Modes.nbChampions()} champions vaincus · temps total ${fmtTime(run.temps)}${o.record ? ' · <b class="good">nouveau record !</b>' : ''}</p>
        ${lignes ? `<div class="rush-liste"><table class="breakdown">${lignes}</table></div>` : ''}
        <p class="muted">Record : ${o.rec.best} champions d’affilée${o.rec.temps != null ? ` en ${fmtTime(o.rec.temps)}` : ''}.</p>
        <div class="actions"><button data-action="galerie">Voir la galerie</button><button class="primary" data-action="camp">Retour au camp</button></div>
      `, { camp: () => { this.campTab = 'play'; game.showCamp(); }, galerie: () => { this.campTab = 'rush'; game.showCamp(); } });
    },

    showDefiFin(o) {
      const game = this.game, s = o.etat;
      const titre = o.result === 'victory' ? 'Défi réussi !' : o.result === 'abandon' ? 'Défi abandonné' : o.phase === 'survie' ? 'Ta base est tombée pendant la survie' : o.phase === 'course' ? 'Ta base est tombée' : 'Ta base est tombée pendant l’assaut';
      this.overlay(`
        <h2>${titre}</h2>
        <p class="sub">${o.defi.nom}</p>
        ${o.score ? `<table class="breakdown">
          <tr><td>Temps</td><td>${fmtTime(o.score.t)}</td></tr>
          <tr><td>Base restante</td><td>${o.score.base} %</td></tr>
          ${o.gain ? `<tr class="total"><td>Récompense du jour</td><td>+${fmt(o.gain)} ✦</td></tr>` : ''}
        </table>` : `<p>Tu as tenu ${fmtTime(o.temps)}.</p>`}
        ${o.record ? '<p class="good"><b>Ton meilleur temps du jour !</b></p>' : ''}
        <p class="muted">Série : ${s.serie} jour${s.serie > 1 ? 's' : ''} · Essais aujourd’hui : ${s.essais}${s.meilleur ? ` · Meilleur : ${fmtTime(s.meilleur.t)}, base à ${s.meilleur.base} %` : ''}</p>
        <div class="actions"><button data-action="encore">Réessayer</button><button class="primary" data-action="camp">Retour au camp</button></div>
      `, { camp: () => { this.campTab = 'play'; game.showCamp(); }, encore: () => PA.Modes.lancerDefi() });
    },

    showVictory(d) {
      const game = this.game;
      const cards = d.choices.map(id => {
        const r = C.relics.find(x => x.id === id);
        const tx = PA.relicText(r, game.run.relics);
        const style = r.element ? ` style="border-color:${C.elements[r.element].color}"` : '';
        return `<button class="card${r.element ? ' elem' : ''}"${style} data-action="relic" data-arg="${r.id}"><span class="icon">${r.icon}</span><span class="name">${tx.name}</span><span class="desc">${tx.desc}</span></button>`;
      }).join('');
      const next = `Avant le prochain combat, ta base est réparée de ${pct(PA.diff(game.meta).repair)} et tu gardes ${pct(C.economy.goldCarryOver)} de ton or.`;
      let nextBox;
      if (d.last) {
        nextBox = '<b>Prochain combat : l’assaut final</b> <span class="warn">· vagues infinies</span>';
      } else {
        const nn = d.n + 1;
        const per = C.levels.perAge;
        const ea = Math.floor((nn - 1) / per);
        const bi = (nn - 1) % per;
        const tags = [];
        if (bi === 0) tags.push(`<span class="warn">les ennemis passent ${C.ages[ea].to || 'à l’' + C.ages[ea].name}</span>`);
        if (bi + 1 === C.levels.bossLevel) tags.push('<span class="warn">niveau de boss</span>');
        const gap = ea - game.run.age;
        if (gap > 0) tags.push(`<span style="color:var(--pp)">outsider +${Math.round(gap * C.prestige.outsiderPerAge * 100)} %</span>`);
        nextBox = `<b>Prochain combat : niveau ${nn} / ${game.totalLevels}</b> — ${C.ages[ea].name} (${bi + 1}/${per})${tags.length ? ' · ' + tags.join(' · ') : ''}`;
      }
      this.overlay(`
        <h2>Niveau ${d.n} terminé !</h2>
        <p class="sub">Temps : ${fmtTime(d.time)} · <b style="color:#e6d6ff">+${fmt(d.total)} ✦ mis à l’abri</b> · Choisis une récompense :</p>
        <div class="cards">${cards}</div>
        <div class="next-box">${nextBox}</div>
        <h3>Détail des points</h3>
        <table class="breakdown">
          <tr><td>Niveau terminé</td><td>+${fmt(d.base)}</td></tr>
          <tr><td>Ennemis tués <span class="muted">(plafond ${Math.round(d.killsCap)})</span></td><td>+${d.kills.toFixed(1)}</td></tr>
          <tr><td>Bonus de rapidité</td><td>+${pct(d.speed)}</td></tr>
          <tr><td>Bonus outsider${d.gap ? ` (${d.gap} âge${d.gap > 1 ? 's' : ''} de retard)` : ''}</td><td>+${pct(d.outsider)}</td></tr>
          ${d.mut ? `<tr><td>Mutateurs <span class="muted">(multiplie le tout)</span></td><td>×${(1 + d.mut).toFixed(2).replace('.', ',')}</td></tr>` : ''}
          <tr class="total"><td>Points mis à l’abri</td><td>+${fmt(d.total)} ✦</td></tr>
        </table>
        <p class="muted">${next}</p>
      `, { relic: id => game.chooseRelic(id) });
    },

    showAssaultIntro() {
      const game = this.game;
      const A = C.assault;
      const loss = PA.Meta.lossRate(game.meta);
      this.overlay(`
        <h2>Assaut final</h2>
        <p class="sub">Les vagues ne s’arrêtent plus. Jusqu’où oseras-tu aller ?</p>
        <ul class="rules">
          <li>Chaque vague est plus forte que la précédente (+${pct(A.statGrowth)} de PV et de dégâts).</li>
          <li>Chaque ennemi tué remplit la <b>cagnotte ✦</b>, avec un multiplicateur de ×1, puis ×${1 + A.multiplierStep}, ×${1 + 2 * A.multiplierStep}…</li>
          <li>Toutes les ${A.windowEvery} vagues, une <b>fenêtre de retraite</b> : te retirer (tu gardes 100 %) ou continuer.</li>
          <li>Si ta base tombe, tu perds <b class="warn">${pct(loss)}</b> de la cagnotte.</li>
        </ul>
        <p class="muted">Ta base est réparée de ${pct(PA.diff(game.meta).repair)} avant l’assaut.</p>
        <div class="actions"><button class="primary" data-action="go">Lancer l’assaut</button></div>
      `, { go: () => game.startAssault() });
    },

    showAssaultWindow(b) {
      const game = this.game;
      const loss = PA.Meta.lossRate(game.meta);
      const cur = b.assaultMult(b.wave.n);
      const nxt = b.assaultMult(b.wave.n + 1);
      this.overlay(`
        <h2>Vague ${b.wave.n} franchie !</h2>
        <p class="sub">Fenêtre de retraite · Base : ${fmt(game.run.base.hp)} / ${fmt(game.run.base.maxHp)} PV</p>
        <div class="choice-grid">
          <div class="choice">
            <div class="muted">Se retirer</div>
            <div class="big" style="color:var(--pp)">${rnd(b.cagnotte)} ✦</div>
            <p>Tu gardes <b>100 %</b> de la cagnotte et la run se termine.</p>
            <button class="primary" data-action="retreat">Se retirer</button>
          </div>
          <div class="choice">
            <div class="muted">Continuer</div>
            <div class="big">×${cur.toFixed(1)} → ×${nxt.toFixed(1)}</div>
            <p>Les ${C.assault.windowEvery} prochaines vagues rapportent plus. Mais si ta base tombe, tu ne garderas que ${pct(1 - loss)} de la cagnotte (soit ${rnd(b.cagnotte * (1 - loss))} ✦ pour l’instant).</p>
            <button class="alt" data-action="continue">Continuer</button>
          </div>
        </div>
      `, { retreat: () => game.retreat(), continue: () => game.continueAssault() });
    },

    confirmAbandon() {
      const game = this.game;
      const b = game.battle;
      if (!b || b.over || game.blocked) return;
      game.blocked = true;
      const loss = PA.Meta.lossRate(game.meta);
      const mode = game.run && game.run.mode;
      this.overlay(`
        <h2>${mode === 'rush' ? 'Abandonner le boss rush ?' : mode === 'defi' ? 'Abandonner le défi ?' : 'Abandonner la run ?'}</h2>
        <p>${mode === 'rush' ? 'Les médailles déjà gagnées sont conservées.' : mode === 'defi' ? 'Tu pourras retenter le défi autant de fois que tu veux aujourd’hui.' : `Les points déjà mis à l’abri sont conservés. Tu perds ${pct(loss)} des points en jeu.`}</p>
        <div class="actions">
          <button data-action="no">Continuer à jouer</button>
          <button class="danger" data-action="yes">Abandonner</button>
        </div>
      `, {
        no: () => { game.blocked = false; this.hideOverlay(); },
        yes: () => game.abandon(),
      });
    },

    showRunEnd(reason, info) {
      const game = this.game;
      const run = game.run;
      const meta = game.meta;
      const titles = {
        'defeat-level': `Ta base est tombée au niveau ${info.level}`,
        'defeat-assault': `Ta base est tombée à la vague ${info.wave}`,
        'retreat': `Retraite réussie après la vague ${info.wave} !`,
        'abandon': 'Run abandonnée',
      };
      const nextIdx = PA.Meta.unlockedAgeCount(meta);
      const nextCost = PA.Meta.nextAgeCost(meta);
      const newAge = nextCost != null && meta.balance >= nextCost
        ? `<p class="good"><b>Tu as assez de points pour acheter l’âge ${C.prestige.ageNames[nextIdx]} au camp.</b>${nextIdx >= C.ages.length ? ' (son contenu n’existe pas encore dans le prototype)' : ''}</p>`
        : '';
      // Les lignes du tableau s'additionnent : ce qui est perdu avec la base est déjà retiré, on le dit à part.
      const lost = Math.round(run.ppLost);
      const inAssault = !!game.battle && game.battle.mode === 'assault';
      const assaultRow = inAssault
        ? `<tr><td>Assaut final${lost > 0 ? ` <span class="muted">(cagnotte de ${rnd(run.ppAssault + run.ppLost)} ✦, dont ${rnd(lost)} perdus avec la base)</span>` : ''}</td><td>+${fmt(run.ppAssault)}</td></tr>`
        : '';
      const lostNote = !inAssault && lost > 0
        ? `<p class="muted">Kills du dernier niveau : ${rnd(lost)} ✦ perdus avec la base (déjà retirés du total).</p>`
        : '';
      this.overlay(`
        <h2>${titles[reason]}</h2>
        <p class="sub">Mode ${PA.diff(meta).name} · Niveaux terminés : ${run.levelsDone} / ${game.totalLevels}${run.levelsDone >= game.totalLevels ? ` · Assaut : ${run.assaultWave} vague${run.assaultWave > 1 ? 's' : ''} franchie${run.assaultWave > 1 ? 's' : ''}` : ''}</p>
        <table class="breakdown">
          <tr><td>Points des niveaux (à l’abri)</td><td>+${fmt(run.ppLevels)}</td></tr>
          ${assaultRow}
          <tr class="total"><td>Gagné pendant cette run</td><td>+${fmt(run.ppLevels + run.ppAssault)} ✦</td></tr>
        </table>
        ${lostNote}
        ${newAge}
        ${game.rushDebloque ? '<p class="good"><b>Nouveau mode débloqué : le boss rush !</b> Retrouve-le sur l’accueil.</p>' : ''}
        <p class="muted">Solde : ${fmt(meta.balance)} ✦ · Total gagné depuis le début : ${fmt(meta.totalEarned)} ✦</p>
        <div class="actions"><button class="primary" data-action="camp">Retour au camp</button></div>
      `, { camp: () => game.showCamp() });
      game.rushDebloque = false;
    },
  };

  PA.UI = UI;
})();

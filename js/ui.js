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
        const locked = u.elite && !PA.Meta.hasElite(game.meta, game.run.age);
        btn.className = 'buy' + (u.elite ? ' elite' : '') + (locked ? ' locked' : '');
        btn.dataset.idx = i;
        btn.title = locked ? `${u.name} — unité d’élite : à débloquer au camp pour ${fmt(PA.Meta.eliteCost(game.run.age))} ✦` : `${u.name} — ${u.desc} · ${fmt(u.hp)} PV (touche ${i + 1})`;
        // Le bouton montre l'unité elle-même (même dessin que sur le terrain) et son prix.
        btn.innerHTML = `<img alt="${u.name}" src="${PA.Render.portrait('unit', u)}">${u.elite ? '<i class="star">★</i>' : ''}<span class="cost"></span>`;
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
        btn.innerHTML = `<img alt="${t.name}" src="${PA.Render.portrait('turret', t)}"><span class="cost">${court(t.cost)}</span>`;
        btn.onclick = this.act(b2 => b2.buyTurret(i));
        tb.appendChild(btn);
      });
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
      if (!b || !run) return;
      if (this.builtForAge !== run.age) this.buildBattleButtons();

      // Titre du niveau (avec une étiquette quand la campagne est en difficile)
      const hardTag = game.meta.difficulty === 'difficile' ? '<span class="hard">Difficile</span> · ' : '';
      if (b.mode === 'level') {
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
      const trackKey = `${cur}/${game.totalLevels}`;
      if (this.el['hud-track'].dataset.key !== trackKey) {
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
      this.el['hud-pp'].textContent = `${court(run.ppLevels)} +${atRisk}`;
      this.el['hud-pp'].title = b.mode === 'level'
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
        btn.classList.toggle('cant', run.gold < cost);
        btn.disabled = b.over;
      });
      const turrets = C.ages[run.age].turrets;
      const freeSlot = run.turrets.some(t => !t);
      [...this.el['turret-buttons'].children].forEach((btn, i) => {
        btn.classList.toggle('cant', run.gold < turrets[i].cost || !freeSlot);
        btn.disabled = b.over;
      });

      // File d'entraînement : une pastille par unité en attente, la première se remplit de bas en haut.
      const q = this.el.queue;
      const qKey = b.queue.map(item => item.def.id).join(',');
      if (q.dataset.key !== qKey) {
        q.dataset.key = qKey;
        let qh = '';
        for (let i = 0; i < C.economy.queueSize; i++) {
          const item = b.queue[i];
          qh += item ? `<div class="q-slot on"><div class="fill"></div><img alt="" src="${PA.Render.portrait('unit', item.def)}"></div>` : '<div class="q-slot"></div>';
        }
        q.innerHTML = qh;
      }
      const qFill = q.querySelector('.fill');
      if (qFill && b.queue[0]) qFill.style.height = `${(1 - b.queue[0].t / b.queue[0].total) * 100}%`;

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
          : `<button class="slot-chip full" data-sell="${i}" title="${def.name} : appuie pour vendre (+${refund} or)"><img alt="${def.name}" src="${PA.Render.portrait('turret', def)}"><i>×</i></button>`;
      });
      const sc = b.slotCost();
      if (sc != null) sh += `<button class="slot-chip add${run.gold < sc ? ' cant' : ''}" data-slot="1" title="Acheter un emplacement de tourelle"><b>+</b><span>${court(sc)}</span></button>`;
      if (slotsEl.dataset.html !== sh) {
        slotsEl.innerHTML = sh;
        slotsEl.dataset.html = sh;
      }

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
            ${PA.Tuto ? '<div class="decouvrir"><button class="tuto" data-action="tuto">Tutoriel</button><button class="visite" data-action="guide">Visite des menus</button></div>' : ''}
            <div class="stats">${PA.Meta.playableAgeCount(meta)} âges sur ${C.ages.length} · Meilleur niveau ${meta.bestLevel} · Meilleure vague ${meta.bestWave} · ${meta.runs} run${meta.runs > 1 ? 's' : ''}<small>${D.name} : ${D.desc}</small></div>
          </div>`,
        // Améliorations : deux sous-catégories, « Bonus » et « Vitesse » (l'ancien onglet Vitesse).
        ups: `<div class="seg sous-onglets"><button data-action="sous" data-arg="bonus" class="${sous === 'bonus' ? 'on' : ''}">Bonus</button><button data-action="sous" data-arg="speed" class="${sous === 'speed' ? 'on' : ''}">Vitesse</button></div>` +
          (sous === 'speed'
            ? `<p class="camp-hint">Accélère le combat. Ne change ni l’or, ni l’XP, ni le prestige.</p><div class="upgrades">${speeds}</div>`
            : `<p class="camp-hint">Bonus permanents, valables à chaque run. Débloquer des âges relève le plafond.</p><div class="upgrades">${ups}</div>`),
        ages: `<p class="camp-hint">Chaque âge débloqué ajoute 5 niveaux à la run. Ils s’achètent dans l’ordre.</p><div class="ages">${ages}</div>`,
        elites: `<p class="camp-hint">La 4e unité de chaque âge : dégâts de zone, réservée à ton armée.</p><div class="upgrades">${elites}</div>`,
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
          <div class="side">${meta.totalEarned > meta.balance ? `<span class="muted">Total gagné : ${fmt(meta.totalEarned)} ✦</span>` : ''}<button data-action="musique" class="son${PA.Music.on ? '' : ' off'}" title="Musique : oui / non">♪</button><button data-action="tab" data-arg="${tab === 'aide' ? 'play' : 'aide'}" title="Aide et réglages">${tab === 'aide' ? '✕' : '?'}</button></div>
        </div>
        <div class="camp-body ${tab === 'play' ? '' : 'list'}">${tab === 'aide' ? `<div>${aide}</div>` : bodies[tab]}</div>
        <nav class="tabs">${tabs}</nav>
      `, {
        tab: t => { this.campTab = t; this.showCamp(); },
        sous: s => { this.campSous = s; this.showCamp(); },
        // JOUER : qui n'a jamais fait le tutoriel se voit poser la question une fois (js/tuto.js).
        start: () => { if (PA.Tuto && PA.Tuto.doitConfirmer()) return PA.Tuto.confirmer(); this.campTab = 'play'; game.newRun(); },
        tuto: () => PA.Tuto.lancer(),
        guide: () => { this.campTab = 'play'; this.showCamp(); PA.Tuto.guide(); },
        diff: d => game.setDifficulty(d),
        musique: (arg, el) => { const on = PA.Music.basculer(); el.classList.toggle('off', !on); },
        styleVisuel: (s, el) => { PA.Fx.choisir(s); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
        styleFx: (mode, el) => { if (mode === 'reel' && !PA.Sons.reelDispo()) return; PA.Music.fxMode = mode; PA.Music.sauver(); if (mode === 'reel') { PA.Music.contexte(); PA.Sons.precharger(); } el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); if (PA.Music.fx) PA.Sons.apercu('raptor'); },
        effets: (oui, el) => { PA.Music.fx = oui === '1'; PA.Music.sauver(); el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); if (PA.Music.fx && PA.Sons) PA.Sons.apercu('raptor'); },
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
        buyAge: () => { PA.Meta.buyAge(meta); this.showCamp(); },
        buy: id => { PA.Meta.buyUpgrade(meta, id); this.showCamp(); },
        buyElite: i => { PA.Meta.buyElite(meta, Number(i)); this.showCamp(); },
        acheterPouvoir: a => { const [i, id] = a.split('|'); PA.Pouvoirs.acheter(meta, Number(i), id); this.showCamp(); },
        equiperPouvoir: a => { const [i, id] = a.split('|'); PA.Pouvoirs.equiper(meta, Number(i), id); this.showCamp(); },
        buySpeed: () => { PA.Meta.buySpeed(meta); this.showCamp(); },
        reset: (arg, el) => {
          if (el.dataset.confirm) { game.meta = PA.Meta.reset(meta.difficulty); this.showCamp(); return; }
          el.dataset.confirm = '1';
          el.textContent = 'Appuie encore pour tout effacer';
        },
      }, true);
      const vol = document.getElementById('vol-musique');
      if (vol) vol.oninput = e => PA.Music.regler(e.target.value / 100);
      const volFx = document.getElementById('vol-effets');
      if (volFx) {
        volFx.oninput = e => PA.Music.reglerFx(e.target.value / 100);
        volFx.onchange = () => { if (PA.Sons) PA.Sons.apercu('cogneur'); };   // un petit coup pour juger le niveau
      }
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
      this.overlay(`
        <h2>Abandonner la run ?</h2>
        <p>Les points déjà mis à l’abri sont conservés. Tu perds ${pct(loss)} des points en jeu.</p>
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
        <p class="muted">Solde : ${fmt(meta.balance)} ✦ · Total gagné depuis le début : ${fmt(meta.totalEarned)} ✦</p>
        <div class="actions"><button class="primary" data-action="camp">Retour au camp</button></div>
      `, { camp: () => game.showCamp() });
    },
  };

  PA.UI = UI;
})();

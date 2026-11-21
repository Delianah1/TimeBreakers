/* =========================================================================
   MUTATEURS : avant une partie, on choisit jusqu'à deux règles qui la rendent plus dure
   (ou plus étrange), en échange d'un bonus sur TOUT le prestige mis à l'abri pendant la partie
   (niveaux, kills, assaut final). Les bonus s'additionnent : +20 % et +30 % font ×1,5.

   Ouverts seulement en mode Facile, une fois les 11 âges débloqués ET 5 parties jouées avec tous les âges
   (meta.runsTousAges, compté par game.newRun dans js/main.js). Jamais en mode Difficile.
   Pas en boss rush, défi du jour ni tutoriel.
   Sauvegarde : meta.mutateurs = [ids] (le choix est gardé d'une partie à l'autre) ;
   run.mutateurs = [ids] : ceux de la partie en cours (posés au lancement, par le bouton JOUER).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const MAX = 2, PARTIES = 5;   // parties à jouer avec tous les âges avant l'ouverture

  const LISTE = [
    { id: 'presses', ico: '💨', nom: 'Ennemis pressés', desc: 'Les ennemis avancent 30 % plus vite.', bonus: 0.35 },
    { id: 'blindes', ico: '🛡', nom: 'Ennemis blindés', desc: 'Les ennemis ont 40 % de PV en plus.', bonus: 0.15 },
    { id: 'furieux', ico: '♛', nom: 'Champions furieux', desc: 'Les champions ennemis ont 60 % de PV et de dégâts en plus.', bonus: 0.2 },
    { id: 'tresor', ico: '💰', nom: 'Trésor fragile', desc: 'Les ennemis rapportent deux fois plus d’or, mais ta base a moitié moins de PV.', bonus: 0.05 },
    { id: 'verre', ico: '🗡', nom: 'Canons de verre', desc: 'Tes unités frappent 50 % plus fort, mais ont 40 % de PV en moins.', bonus: 0.05 },
    { id: 'remparts', ico: '🚫', nom: 'Sans remparts', desc: 'Aucune tourelle pendant toute la partie.', bonus: 0.6 },
    { id: 'disette', ico: '🥖', nom: 'Disette', desc: 'Les ennemis rapportent 40 % d’or en moins.', bonus: 0.15 },
  ];
  const PAR_ID = Object.fromEntries(LISTE.map(m => [m.id, m]));
  const pct = x => Math.round(x * 100) + ' %';

  const MU = PA.Mutateurs = {
    LISTE, PAR_ID, MAX,
    prochain: null,
    facile(meta) { return !!meta && (meta.difficulty || 'facile') === 'facile'; },
    tousAges(meta) { return MU.facile(meta) && PA.Meta.playableAgeCount(meta) >= C.ages.length; },
    restantes(meta) { return Math.max(0, PARTIES - (meta.runsTousAges || 0)); },
    ouvert(meta) { return MU.tousAges(meta) && MU.restantes(meta) === 0; },
    choix(meta) { return (meta.mutateurs || []).filter(id => PAR_ID[id]).slice(0, MAX); },
    // Les mutateurs de la partie (aucun en boss rush, défi du jour, tutoriel).
    actifs(run) { return run && !run.mode && !(PA.Tuto && PA.Tuto.actif) && run.mutateurs || []; },
    a(run, id) { return MU.actifs(run).includes(id); },
    bonus(run) { return MU.actifs(run).reduce((s, id) => s + (PAR_ID[id] ? PAR_ID[id].bonus : 0), 0); },
    // Appelé par JOUER juste avant game.newRun() (js/ui.js).
    armer(meta) { MU.prochain = MU.ouvert(meta) ? MU.choix(meta) : null; },

    // ---------------------------------------------------------------- camp
    bouton(meta) {
      if (!MU.ouvert(meta)) {
        // Tous les âges débloqués : on annonce les mutateurs et ce qui manque.
        if (!MU.tousAges(meta)) return '';
        const n = MU.restantes(meta);
        return `<button class="mut-bouton" disabled title="Les mutateurs s’ouvrent après ${PARTIES} parties avec tous les âges">🔒 Mutateurs : encore ${n} partie${n > 1 ? 's' : ''}</button>`;
      }
      const l = MU.choix(meta), b = l.reduce((s, id) => s + PAR_ID[id].bonus, 0);
      return `<button class="mut-bouton${l.length ? ' on' : ''}" data-action="tab" data-arg="mutateurs">🎲 ${l.length ? `${l.map(id => PAR_ID[id].ico).join(' ')} Mutateurs : +${pct(b)} ✦` : 'Mutateurs'}</button>`;
    },
    panneau(meta) {
      if (!MU.ouvert(meta)) return '<p class="camp-hint">Les mutateurs s’ouvrent en mode Facile, une fois tous les âges débloqués et 5 parties jouées avec tous les âges.</p>';
      const l = MU.choix(meta), plein = l.length >= MAX, b = l.reduce((s, id) => s + PAR_ID[id].bonus, 0);
      const cartes = LISTE.map(m => {
        const on = l.includes(m.id), off = !on && plein;
        return `<button class="mut${on ? ' on' : ''}" data-mut="${m.id}"${off ? ' disabled' : ''}><i>${m.ico}</i><div><b>${m.nom}</b><span>${m.desc}</span></div><em>+${pct(m.bonus)} ✦</em></button>`;
      }).join('');
      return `<p class="camp-hint">Choisis jusqu’à <b>${MAX} mutateurs</b> pour ta prochaine partie. Chacun la rend plus dure, et tout le prestige mis à l’abri pendant la partie est augmenté d’autant. Pas en boss rush ni en défi du jour.</p>
        <div class="mut-total">${l.length ? `Prochaine partie : <b>+${pct(b)} ✦</b>` : 'Aucun mutateur : partie normale.'}${l.length ? ' <button class="mut-vider" data-mut="">Tout retirer</button>' : ''}</div>
        <div class="mut-grille">${cartes}</div>
        <div class="actions"><button class="play" data-action="start">JOUER</button></div>`;
    },
  };

  // Clic sur une carte : ajoute ou retire le mutateur (et « Tout retirer »).
  const camp0 = PA.UI.showCamp;
  PA.UI.showCamp = function (...a) {
    const r = camp0.apply(this, a);
    const meta = PA.Game && PA.Game.meta;
    document.querySelectorAll('[data-mut]').forEach(el => el.addEventListener('click', () => {
      const id = el.dataset.mut;
      let l = MU.choix(meta);
      if (!id) l = [];
      else if (l.includes(id)) l = l.filter(x => x !== id);
      else if (l.length < MAX) l.push(id);
      meta.mutateurs = l; PA.Meta.save(meta);
      PA.UI.showCamp();
    }));
    return r;
  };

  // ---------------------------------------------------------------- en combat
  const B = PA.Battle.prototype;
  const spawn0 = B.spawnEnemy, buyTurret0 = B.buyTurret, buySlot0 = B.buySlot, slotCost0 = B.slotCost;
  B.spawnEnemy = function (def, isChampion, statMult, age) {
    const u = spawn0.call(this, def, isChampion, statMult, age), run = this.run;
    if (!MU.actifs(run).length || !u) return u;
    if (MU.a(run, 'presses')) u.speed *= 1.3;
    if (MU.a(run, 'blindes')) { u.hp *= 1.4; u.maxHp *= 1.4; }
    if (MU.a(run, 'furieux') && isChampion) { u.hp *= 1.6; u.maxHp *= 1.6; u.dmg *= 1.6; if (u.cs && u.cs.bouMax) { u.cs.bou *= 1.6; u.cs.bouMax *= 1.6; } }
    return u;
  };
  B.buyTurret = function (idx) {
    if (MU.a(this.run, 'remparts')) return this.game.toast('Mutateur « Sans remparts » : pas de tourelles cette partie');
    return buyTurret0.call(this, idx);
  };
  B.slotCost = function () { return MU.a(this.run, 'remparts') ? null : slotCost0.call(this); };
  B.buySlot = function () { if (MU.a(this.run, 'remparts')) return; return buySlot0.call(this); };

  const Battle0 = PA.Battle;
  PA.Battle = class extends Battle0 {
    constructor(game, opts) {
      const run = game.run;
      // Le premier combat d'une partie lancée par JOUER reçoit les mutateurs choisis.
      if (MU.prochain && run && !run.mode && !run.mutateurs && run.levelsDone === 0) run.mutateurs = MU.prochain.slice();
      MU.prochain = null;
      if (!game._mutBase) {
        // Trésor fragile : la base a moitié moins de PV (recalculée à chaque évolution).
        const r0 = game.refreshBaseMax;
        game.refreshBaseMax = function () {
          r0.call(this);
          if (MU.a(this.run, 'tresor')) { const bs = this.run.base; bs.maxHp = Math.round(bs.maxHp * 0.5); bs.hp = Math.min(bs.hp, bs.maxHp); }
        };
        game._mutBase = true;
      }
      if (run && run.mutateurs && !run._mutPrets) { run._mutPrets = true; game.refreshBaseMax(); }
      super(game, opts);
      const m = this.mods, l = MU.actifs(run);
      if (l.includes('tresor')) m.goldGain += 1;
      if (l.includes('disette')) m.goldGain -= 0.4;
      if (l.includes('verre')) { m.allDmg += 0.5; m.unitHp -= 0.4; }
      if (l.length && opts.mode === 'level' && opts.levelNumber === 1 && !this.special_) {
        setTimeout(() => this.game.toast(`Mutateurs : ${l.map(id => PAR_ID[id].nom).join(' + ')} (+${pct(MU.bonus(run))} ✦)`, 'big'), 3200);
      }
    }
  };
})();

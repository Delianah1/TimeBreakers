/* =========================================================================
   COLLECTION : trois ajouts qui se branchent sans toucher au combat.
     1. Bestiaire (PA.Bestiaire)   : une fiche par unité, tourelle et champion croisés, avec tes compteurs
                                     (ennemis tués, troupes entraînées, troupes perdues, tourelles construites).
     2. Cosmétiques (PA.Collection) : couleurs d'armée et sceaux de missive, débloqués par les hauts faits.
     3. Statistiques (PA.Stats)     : le bilan de la partie sur l'écran de fin (dégâts par source, or dépensé,
                                     unité la plus utile…).
   Sauvegarde à part (timebreakers-collection), commune aux deux difficultés.
   Chargé après js/hauts-faits.js et avant js/main.js.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const fmt = n => Math.floor(n).toLocaleString('fr-FR');
  const court = n => (PA.court ? PA.court(n) : fmt(n));
  const HF = PA.HautsFaits;

  // ================================================================ sauvegarde
  const KEY = 'timebreakers-collection';
  const S = {
    s: null,
    charger() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* ignore */ }
      s = s && typeof s === 'object' ? s : {};
      for (const k of ['vu', 'tue', 'forme', 'perdu', 'bati']) s[k] = s[k] || {};
      s.cos = s.cos || { couleur: 'bleu', sceau: 'cire' };
      this.s = s;
    },
    sauver() { try { localStorage.setItem(KEY, JSON.stringify(this.s)); } catch (e) { /* ignore */ } },
    plus(k, id, n) { this.s[k][id] = (this.s[k][id] || 0) + (n || 1); },
  };
  S.charger();
  const compte = () => !(PA.Game && PA.Game.demo) && !(PA.Tuto && PA.Tuto.actif);

  // ================================================================ 2. cosmétiques
  // besoin : nombre de hauts faits obtenus ; secret : un haut fait précis.
  const COULEURS = [
    { id: 'bleu', nom: 'Bleu royal', c: '#3d6fd6', f: '#284c99', besoin: 0 },
    { id: 'vert', nom: 'Vert émeraude', c: '#2fa860', f: '#1d6e3e', besoin: 10 },
    { id: 'violet', nom: 'Violet impérial', c: '#8a52d6', f: '#5a3399', besoin: 25 },
    { id: 'turquoise', nom: 'Turquoise', c: '#1fb3b8', f: '#137377', besoin: 40 },
    { id: 'or', nom: 'Or des légendes', c: '#e0a92a', f: '#9a6e12', besoin: 60 },
    { id: 'nuit', nom: 'Bleu de minuit', c: '#3a4a8f', f: '#1d2550', besoin: 80 },
    { id: 'obsidienne', nom: 'Obsidienne', c: '#5a5068', f: '#2a2433', secret: 'enfant-magma' },
    { id: 'blanc', nom: 'Blanc des Timebreakers', c: '#e8eef8', f: '#93a3c4', besoin: 100 },
  ];
  const SCEAUX = [
    { id: 'cire', nom: 'Cire rouge', sym: '✦', besoin: 0 },
    { id: 'or', nom: 'Sceau d’or', sym: '★', besoin: 15 },
    { id: 'emeraude', nom: 'Sceau d’émeraude', sym: '❦', besoin: 35 },
    { id: 'royal', nom: 'Sceau royal', sym: '♛', besoin: 50 },
    { id: 'lave', nom: 'Sceau de lave', sym: '♨', secret: 'coulee' },
    { id: 'temps', nom: 'Sceau du temps', sym: '⌛', besoin: 100 },
  ];
  const nbHf = () => (HF ? HF.nb() : 0);
  const ouvert = o => (o.secret ? !!(HF && HF.a(o.secret)) : nbHf() >= o.besoin);
  const condition = o => (o.secret ? 'Un haut fait secret' : `${o.besoin} hauts faits`);

  const CO = PA.Collection = {
    COULEURS, SCEAUX,
    couleur() { return COULEURS.find(o => o.id === S.s.cos.couleur && ouvert(o)) || COULEURS[0]; },
    sceau() { return SCEAUX.find(o => o.id === S.s.cos.sceau && ouvert(o)) || SCEAUX[0]; },
    appliquer() { const o = this.couleur(); if (PA.Render && PA.Render.couleurEquipe) PA.Render.couleurEquipe(o.c, o.f); },
    choisir(type, id) {
      const liste = type === 'couleur' ? COULEURS : SCEAUX, o = liste.find(x => x.id === id);
      if (!o || !ouvert(o)) return;
      S.s.cos[type] = id; S.sauver();
      if (type === 'couleur') this.appliquer();
    },
    sceauHtml() { const o = this.sceau(); return `<div class="sceau s-${o.id}">${o.sym}</div>`; },
    // en tête de l'onglet des hauts faits
    panneau() {
      const ligne = (type, liste, actuel, dessin) => liste.map(o => {
        const ok = ouvert(o), on = o.id === actuel.id;
        return `<button class="cos${on ? ' on' : ''}${ok ? '' : ' verrou'}" data-cos="${type}" data-id="${o.id}" ${ok ? '' : 'disabled'} title="${ok ? o.nom : `${o.nom} : ${condition(o)}`}">${dessin(o, ok)}<small>${ok ? o.nom : `🔒 ${o.secret ? '???' : o.besoin}`}</small></button>`;
      }).join('');
      const couleurs = ligne('couleur', COULEURS, this.couleur(), o => `<i class="pastille" style="background:linear-gradient(${o.c},${o.f})"></i>`);
      const sceaux = ligne('sceau', SCEAUX, this.sceau(), (o, ok) => `<i class="sceau mini s-${o.id}">${ok ? o.sym : '?'}</i>`);
      return `<div class="cos-bloc"><h3 class="hf-theme">🎨 Récompenses <small>débloquées par tes hauts faits</small></h3>
        <div class="cos-ligne"><span>Couleur de ton armée</span><div>${couleurs}</div></div>
        <div class="cos-ligne"><span>Sceau des missives</span><div>${sceaux}</div></div></div>`;
    },
  };
  CO.appliquer();
  if (HF) {
    const panneau0 = HF.panneau;
    HF.panneau = function (meta) { return CO.panneau() + panneau0.call(this, meta); };
  }

  // ================================================================ 1. bestiaire
  const BE = PA.Bestiaire = {
    // les âges à montrer : ceux du jeu (la Pierre au camp), plus le Magma une fois découvert
    ages(meta) {
      const l = C.ages.map((age, a) => ({ age, a, ch: PA.Champions.DEFS[a] || [] }));
      const M = PA.Magma;
      if (M && M.decouvert(meta)) l.splice(2, 0, { age: M.MAGMA, a: 1, ch: M.CHAMPIONS, cache: true });
      return l;
    },
    panneau(meta) {
      const jouables = PA.Meta.playableAgeCount(meta);
      const MO = PA.Modes;
      let vus = 0, total = 0;
      const carte = (kind, def, connu, lignes) => {
        total++; if (connu) vus++;
        const img = PA.Render.portrait(kind, def);
        return `<div class="be-carte${connu ? '' : ' inconnu'}"><img alt="" src="${img}"><div><b>${connu ? def.name : '???'}</b>${connu ? lignes : '<span class="muted">Pas encore croisé</span>'}</div></div>`;
      };
      const n = (k, id) => S.s[k][id] || 0;
      const corps = this.ages(meta).map(({ age, a, ch, cache }) => {
        const base = !cache && a < jouables;   // un âge que tu as joué compte comme déjà vu (sauvegardes d'avant le bestiaire)
        const unites = age.units.map(d => {
          const role = d.kind === 'melee' ? 'mêlée' : `portée ${d.range}`;
          return carte('unit', d, base || S.s.vu[d.id], `<span>${d.elite ? '★ élite · ' : ''}${role} · ${fmt(d.hp)} PV · ${fmt(d.dmg)} dégâts · ${fmt(d.cost)} or</span>${d.desc ? `<span class="muted">${d.desc}</span>` : ''}<em>Tués : ${fmt(n('tue', d.id))} · Entraînés : ${fmt(n('forme', d.id))} · Perdus : ${fmt(n('perdu', d.id))}</em>`);
        }).join('');
        const tourelles = age.turrets.map(d => carte('turret', d, base || S.s.vu[d.id],
          `<span>${fmt(d.dmg)} dégâts · portée ${d.range} · ${fmt(d.cost)} or${d.splash ? ' · zone' : ''}</span><em>Construites : ${fmt(n('bati', d.id))}</em>`)).join('');
        const champions = ch.map(d => {
          const med = MO ? MO.medaille(meta, d.id) : 0;
          return carte('unit', d, med || S.s.vu[d.id], `<span class="muted">${d.desc || ''}</span><em>Abattu : ${fmt(n('tue', d.id))} fois</em>`);
        }).join('');
        return `<h3 class="hf-theme">${cache ? '🌋 ' : ''}${age.name}</h3>
          <div class="be-grille">${unites}${tourelles}${champions}</div>`;
      }).join('');
      return `<p class="camp-hint">Tout ce que tu as croisé, d’un âge à l’autre, avec tes compteurs. <b>${vus} / ${total}</b> fiches découvertes.</p><div class="be-liste">${corps}</div>`;
    },
  };

  // ================================================================ 3. statistiques de la partie
  const ST = PA.Stats = {
    de(run) {
      return run.stats || (run.stats = { t: 0, kills: 0, champs: 0, forme: 0, pertes: 0, orU: 0, orT: 0, orE: 0, orGagne: 0, base: 0, deg: {}, tues: {}, noms: {} });
    },
    html(run) {
      const s = run && run.stats;
      if (!s || s.t < 1) return '';
      const sources = Object.keys(s.deg).filter(k => s.deg[k] >= 1).sort((a, b) => s.deg[b] - s.deg[a]);
      const tot = sources.reduce((x, k) => x + s.deg[k], 0) || 1;
      const mvp = sources.find(k => k.startsWith('u:'));
      const lignes = sources.slice(0, 8).map(k => {
        const p = s.deg[k] / tot * 100;
        return `<tr><td>${s.noms[k] || k}${k === mvp ? ' <span class="st-mvp">la plus utile</span>' : ''}<div class="st-barre"><i style="width:${p.toFixed(1)}%"></i></div></td><td>${court(s.deg[k])}<small>${p.toFixed(0)} %</small></td><td>${fmt(s.tues[k] || 0)}</td></tr>`;
      }).join('');
      const dep = s.orU + s.orT + s.orE;
      const chiffre = (v, l) => `<div><b>${v}</b><span>${l}</span></div>`;
      const mn = Math.floor(s.t / 60), sec = Math.floor(s.t % 60);
      return `<details class="st-bloc" open><summary>Statistiques de la partie</summary>
        <div class="st-chiffres">
          ${chiffre(`${mn} min ${String(sec).padStart(2, '0')}`, 'de combat')}
          ${chiffre(fmt(s.kills), `ennemis tués${s.champs ? ` dont ${s.champs} champion${s.champs > 1 ? 's' : ''}` : ''}`)}
          ${chiffre(fmt(s.forme), `troupes entraînées · ${fmt(s.pertes)} perdues`)}
          ${chiffre(court(dep), `or dépensé <small>troupes ${court(s.orU)} · tourelles ${court(s.orT)}${s.orE ? ` · emplacements ${court(s.orE)}` : ''}</small>`)}
          ${chiffre(court(s.orGagne), 'or gagné sur les ennemis')}
          ${chiffre(court(s.base), 'dégâts subis par ta base')}
        </div>
        ${lignes ? `<table class="breakdown st-table"><tr><th>Dégâts infligés</th><th>Dégâts</th><th>Tués</th></tr>${lignes}</table>` : ''}
      </details>`;
    },
  };

  // ================================================================ branchements
  const B = PA.Battle.prototype;

  // qui frappe ? une troupe (pendant son attaque, puis via son projectile) ou une tourelle (via son projectile)
  const attack0 = B.attack;
  B.attack = function (u, target) {
    if (u.side !== 1) return attack0.call(this, u, target);
    const avant = this._auteur; this._auteur = 'u:' + u.def.id; this._nom = u.def.name;
    try { return attack0.call(this, u, target); } finally { this._auteur = avant; }
  };
  const updateTurrets0 = B.updateTurrets;
  B.updateTurrets = function (side, turrets, dt) { this._tirJ = side === 1; try { return updateTurrets0.call(this, side, turrets, dt); } finally { this._tirJ = false; } };
  const fire0 = B.fire;
  B.fire = function (p) {
    if (p.owner === 1) {
      if (this._auteur) { p.auteur = this._auteur; p.nom = this._nom; }
      else if (this._tirJ) {
        const t = this.run.turrets.find(x => x && C.ages[x.age].turrets[x.idx].proj === p.look);
        if (t) { const d = C.ages[t.age].turrets[t.idx]; p.auteur = 't:' + d.id; p.nom = d.name; }
      }
    }
    return fire0.call(this, p);
  };
  const hit0 = B.hit;
  B.hit = function (p, x) {
    const a = this._auteur, n = this._nom;
    this._auteur = p.auteur || null; this._nom = p.nom;
    try { return hit0.call(this, p, x); } finally { this._auteur = a; this._nom = n; }
  };

  const damageUnit0 = B.damageUnit;
  B.damageUnit = function (u, dmg, quiet, src) {
    if (u.dead || u.cache || !this.run || !compte()) return damageUnit0.call(this, u, dmg, quiet, src);
    const hp0 = u.hp;
    const r = damageUnit0.call(this, u, dmg, quiet, src);
    const st = ST.de(this.run);
    if (u.side === -1) {
      const k = this._auteur || (src === 'brulure' ? 'b' : 'p');
      if (!st.noms[k]) st.noms[k] = this._auteur ? (this._nom || k) : k === 'b' ? 'Brûlures' : 'Pouvoirs et effets';
      st.deg[k] = (st.deg[k] || 0) + Math.max(0, hp0 - Math.max(0, u.hp));
      if (u.dead && !u.retourne && !u.clone) st.tues[k] = (st.tues[k] || 0) + 1;
    } else if (u.dead) {
      st.pertes++;
      S.plus('perdu', u.def.id);
    }
    return r;
  };
  const damageBase0 = B.damageBase;
  B.damageBase = function (side, dmg) {
    if (side !== 1 || !this.run || !compte()) return damageBase0.call(this, side, dmg);
    const hp0 = this.run.base.hp, r = damageBase0.call(this, side, dmg);
    ST.de(this.run).base += Math.max(0, hp0 - this.run.base.hp);
    return r;
  };
  const mort0 = B.onUnitDeath;
  B.onUnitDeath = function (u) {
    if (u.side !== -1 || u.retourne || u.clone || !this.run || !compte()) return mort0.call(this, u);
    const g0 = this.run.gold, r = mort0.call(this, u), st = ST.de(this.run);
    st.kills++; if (u.isChampion) st.champs++;
    st.orGagne += Math.max(0, this.run.gold - g0);
    S.plus('tue', u.def.id); S.s.vu[u.def.id] = 1;
    return r;
  };
  const spawnEnemy0 = B.spawnEnemy;
  B.spawnEnemy = function (def) { if (def && def.id && compte()) S.s.vu[def.id] = 1; return spawnEnemy0.apply(this, arguments); };

  // achats
  const achat = (nom, apres) => {
    const f0 = B[nom];
    B[nom] = function () {
      if (!this.run || !compte()) return f0.apply(this, arguments);
      const g0 = this.run.gold, r = f0.apply(this, arguments), cout = g0 - this.run.gold;
      if (cout > 0) apres.call(this, ST.de(this.run), cout, arguments);
      return r;
    };
  };
  achat('buyUnit', function (st, cout) { const d = this.queue[this.queue.length - 1].def; st.orU += cout; st.forme++; S.plus('forme', d.id); S.s.vu[d.id] = 1; });
  achat('buyTurret', function (st, cout, args) { const d = this.playerAge.turrets[args[0]]; st.orT += cout; S.plus('bati', d.id); S.s.vu[d.id] = 1; });
  achat('buySlot', function (st, cout) { st.orE += cout; });

  const update0 = B.update;
  B.update = function (dt) {
    const r = update0.call(this, dt);
    if (this.run && !this.over && compte()) {
      const st = ST.de(this.run); st.t += dt;
      if ((st.t | 0) % 20 === 0 && (st.t - dt | 0) !== (st.t | 0)) S.sauver();
    }
    return r;
  };

  // écrans de fin : le bilan s'insère au-dessus des boutons
  const UI = PA.UI;
  const ajouterBilan = run => {
    S.sauver();
    const html = ST.html(run);
    const card = document.getElementById('overlay-card');
    if (!html || !card) return;
    const act = card.querySelector('.actions');
    act ? act.insertAdjacentHTML('beforebegin', html) : card.insertAdjacentHTML('beforeend', html);
  };
  for (const nom of ['showRunEnd', 'showRushFin', 'showDefiFin']) {
    const f0 = UI[nom];
    UI[nom] = function (a) {
      const run = nom === 'showRunEnd' ? this.game.run : (a && a.run) || this.game.run;
      const r = f0.apply(this, arguments);
      ajouterBilan(run);
      return r;
    };
  }

  // camp : on sauvegarde, et les boutons des cosmétiques
  const camp0 = UI.showCamp;
  UI.showCamp = function () {
    const r = camp0.apply(this, arguments);
    S.sauver();
    CO.appliquer();
    document.querySelectorAll('#overlay-card [data-cos]').forEach(el => {
      el.onclick = () => { CO.choisir(el.dataset.cos, el.dataset.id); UI.showCamp(); };
    });
    return r;
  };
})();

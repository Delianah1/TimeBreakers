/* =========================================================================
   CHAMPIONS : trois par âge, un seul tiré au sort à chaque run (run.champions = [rang par âge]).
     - colosse      : il encaisse (bouclier, armure, enrage…) ;
     - meneur       : il fait venir des renforts ou aide ses troupes ;
     - perturbateur : il gêne le joueur (vole, saute dans ses lignes, vole son pouvoir…).

   Statistiques : celles de l'ancien champion de l'âge (config.js : age.champion), × un facteur selon le genre.

   Ce fichier ajoute au moteur (js/battle.js) : nait (apparition), maj (à chaque pas), subit (dégâts reçus),
   frappe (coup porté), mort ; et au dessin (js/render.js) : sol (sous les unités), dessiner (par-dessus),
   plus un dessin par champion dans PA.Art.units.

   Règles nouvelles qu'ils apportent :
     - u.vol     : unité volante (altitude u.alt), la mêlée du joueur ne la touche pas ;
     - u.survol  : volant qui ignore tes unités et file vers ta base ;
     - u.cache   : sous terre, ni ciblée ni touchée ;
     - u.pilote  : déplacement pris en main ici (saut, charge, rapt…) ;
     - u.ancre   : ne peut pas avancer (tortue, souffle).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, BC = PA.BattleConst, GROUND = BC.GROUND, PF = BC.PLAYER_FRONT, EF = BC.ENEMY_FRONT;
  const TAU = Math.PI * 2, INK = '#2b1d14', OR = '#f2c230';
  const rand = (a, b) => a + Math.random() * (b - a), cl = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const MAXE = C.levels.maxEnemyUnits + 4;

  // ---------------------------------------------------------------- la table
  const ARCH = { colosse: { hp: 1.2, dmg: 0.9 }, meneur: { hp: 0.85, dmg: 0.85 }, perturbateur: { hp: 0.8, dmg: 0.9 } };
  const GENRES = { colosse: 'Colosse', meneur: 'Meneur', perturbateur: 'Perturbateur' };
  // Grand chaman : portée 80, pas 170. À la portée des frondeurs, il restait derrière sa ligne où un seul de tes
  // tireurs l'atteignait à la fois, et ses boules de feu fauchaient la file : seul contre 16 unités, il gagnait toujours.
  const TABLE = {
    jurassique: [
      { id: 'spinosaure', name: 'Spinosaure des marais', genre: 'colosse', w: 96, h: 84, cap: { type: 'rage' }, desc: 'Sous la moitié de ses PV, il s’enrage et frappe deux fois plus vite.' },
      { id: 'reine-raptors', name: 'Reine des raptors', genre: 'meneur', w: 64, h: 86, cap: { type: 'appel', every: 12, first: 3, n: 3, unite: 0 }, desc: 'Un cri appelle 3 raptors toutes les 12 secondes.' },
      { id: 'quetzal', name: 'Quetzalcoatlus géant', genre: 'perturbateur', w: 70, h: 58, vol: 80, cap: { type: 'rapt', every: 10, first: 4 }, desc: 'Il vole : seuls tes tireurs et tes tourelles le touchent. Il enlève une unité et la lâche chez l’ennemi.' },
    ],
    pierre: [
      { id: 'mammouth-clan', name: 'Mammouth laineux du clan', genre: 'colosse', w: 90, h: 100, speed: 34, cap: { type: 'charge', every: 12, first: 2 }, desc: 'Sa charge renverse toute ta première ligne.' },
      { id: 'grand-chaman', name: 'Grand chaman', genre: 'meneur', w: 30, h: 84, kind: 'ranged', range: 80, projectile: { look: 'fireball', speed: 380, arc: true, splash: 40 }, cap: { type: 'soin', every: 7, first: 5 }, desc: 'Sa transe soigne les ennemis autour de lui.' },
      { id: 'ours-cavernes', name: 'Ours des cavernes', genre: 'perturbateur', w: 64, h: 62, speed: 52, cap: { type: 'bond' }, desc: 'Il bondit par-dessus ta mêlée et retombe sur tes tireurs.' },
    ],
    antiquite: [
      { id: 'centurion', name: 'Centurion légendaire', genre: 'colosse', w: 40, h: 92, cap: { type: 'tortue' }, desc: 'Il lève son bouclier en tortue : moitié moins de dégâts, mais il s’arrête.' },
      { id: 'pharaon', name: 'Pharaon immortel', genre: 'meneur', w: 36, h: 90, cap: { type: 'momies' }, desc: 'Il relève ses soldats tombés en momies.' },
      { id: 'hannibal', name: 'Hannibal et son éléphant', genre: 'perturbateur', w: 90, h: 104, cap: { type: 'pietine', every: 9, first: 3 }, desc: 'Sa charge piétine et repousse les unités sur son chemin.' },
    ],
    medieval: [
      { id: 'chevalier-noir', name: 'Chevalier noir', genre: 'colosse', w: 40, h: 96, cap: { type: 'armure' }, desc: 'Son armure lourde ne laisse passer qu’un quart des dégâts des tirs.' },
      { id: 'roi-sorcier', name: 'Roi sorcier', genre: 'meneur', w: 40, h: 100, cap: { type: 'aura' }, desc: 'Sa bannière maudite donne +50 % de dégâts aux ennemis autour de lui.' },
      { id: 'dragon', name: 'Dragon de siège', genre: 'perturbateur', w: 96, h: 84, cap: { type: 'souffle', every: 9, first: 4 }, desc: 'Son souffle traverse toute ta ligne et touche ta base.' },
    ],
    renaissance: [
      { id: 'galion', name: 'Galion sur roues', genre: 'colosse', w: 104, h: 120, speed: 30, cap: { type: 'bordee', every: 10, first: 4 }, desc: 'Une bordée de canons sur toute ta ligne toutes les 10 secondes.' },
      { id: 'machine-volante', name: 'Machine volante', genre: 'perturbateur', w: 80, h: 50, vol: 92, survol: true, cap: { type: 'bombes', every: 2.2, first: 1 }, desc: 'Elle survole tes troupes, file vers ta base et largue des bombes.' },
      { id: 'capitaine', name: 'Capitaine des mousquetaires', genre: 'meneur', w: 34, h: 88, kind: 'ranged', range: 180, projectile: { look: 'bullet', speed: 900 }, cap: { type: 'salve', every: 7, first: 3 }, desc: 'Il commande des salves : tous ses tireurs font feu ensemble, plus fort.' },
    ],
    vapeur: [
      { id: 'locomotive', name: 'Locomotive cuirassée', genre: 'colosse', w: 108, h: 84, speed: 28, cap: { type: 'pousse' }, desc: 'Rien ne l’arrête : elle pousse tes unités et écrase celles coincées contre ta base.' },
      { id: 'zeppelin', name: 'Baron du zeppelin', genre: 'perturbateur', w: 120, h: 66, vol: 96, cap: { type: 'largage', every: 9, first: 3 }, desc: 'Hors de portée de la mêlée, il largue des troupes en parachute.' },
      { id: 'tesla', name: 'Docteur Tesla', genre: 'meneur', w: 36, h: 94, kind: 'ranged', range: 160, projectile: { look: 'lightning', speed: 900 }, cap: { type: 'arc', every: 6, first: 3 }, desc: 'Un arc électrique saute d’une de tes unités à l’autre.' },
    ],
    moderne: [
      { id: 'char-lourd', name: 'Char super-lourd', genre: 'colosse', w: 118, h: 76, speed: 30, cap: { type: 'blindage' }, desc: 'Balles et coups ne lui font presque rien : il faut des explosifs et des pouvoirs.' },
      { id: 'helico', name: 'Général en hélicoptère', genre: 'perturbateur', w: 104, h: 58, vol: 88, kind: 'ranged', range: 200, projectile: { look: 'bullet', speed: 900 }, cap: { type: 'para', every: 10, first: 4 }, desc: 'Il mitraille depuis les airs et largue des parachutistes.' },
      { id: 'sous-marin', name: 'Sous-marin terrestre', genre: 'meneur', w: 90, h: 58, cap: { type: 'fouisseur', but: 'lignes' }, desc: 'Il file sous terre, ressort au milieu de tes lignes et libère des commandos.' },
    ],
    heros: [
      { id: 'docteur-neant', name: 'Docteur Néant', genre: 'perturbateur', w: 40, h: 92, kind: 'ranged', range: 180, projectile: { look: 'psi', speed: 600 }, cap: { type: 'volPouvoir', every: 14, first: 6 }, desc: 'Il te vole ton pouvoir : inutilisable pendant 8 secondes.' },
      { id: 'colosse-vert', name: 'Colosse vert', genre: 'colosse', w: 50, h: 92, cap: { type: 'croissance' }, desc: 'Chaque coup reçu le fait grandir et frapper plus fort.' },
      { id: 'reine-ombres', name: 'Reine des ombres', genre: 'meneur', w: 36, h: 90, cap: { type: 'clones', every: 18 }, desc: 'Elle se dédouble en trois : une seule est la vraie.' },
    ],
    postapo: [
      { id: 'monstre-camion', name: 'Monstre-camion', genre: 'colosse', w: 104, h: 92, cap: { type: 'ecrase' }, desc: 'Il roule sur les petites unités et les écrase au passage.' },
      { id: 'reine-pillards', name: 'Reine des pillards', genre: 'meneur', w: 36, h: 88, reach: 40, cap: { type: 'pille' }, desc: 'Chaque coup de sa chaîne te vole de l’or.' },
      { id: 'mutant', name: 'Mutant géant', genre: 'perturbateur', w: 60, h: 86, speed: 30, cap: { type: 'flaques', every: 3.5, first: 2 }, desc: 'Il laisse des flaques radioactives qui empoisonnent tes troupes.' },
    ],
    futur: [
      { id: 'meca-gardien', name: 'Méca-gardien', genre: 'colosse', w: 60, h: 98, cap: { type: 'bouclier' }, desc: 'Son bouclier d’énergie doit être brisé avant qu’on puisse l’atteindre.' },
      { id: 'ia-mere', name: 'IA-mère', genre: 'meneur', w: 56, h: 96, kind: 'ranged', range: 200, projectile: { look: 'laser', speed: 1100 }, cap: { type: 'piratage', every: 16, first: 5 }, desc: 'Elle pirate une de tes tourelles et la retourne contre toi pendant 10 secondes.' },
      { id: 'vaisseau', name: 'Vaisseau d’assaut', genre: 'perturbateur', w: 70, h: 40, vol: 74, kind: 'ranged', range: 200, projectile: { look: 'laser', speed: 1100 }, cap: { type: 'teleport', every: 7, first: 5 }, desc: 'Il se téléporte d’un point à l’autre, même dans ton dos.' },
    ],
    alien: [
      { id: 'reine-ruche', name: 'Reine de la ruche', genre: 'meneur', w: 96, h: 104, cap: { type: 'ponte', every: 7, first: 3 }, desc: 'Elle pond des œufs qui éclosent en soldats.' },
      { id: 'cerveau', name: 'Cerveau suprême', genre: 'perturbateur', w: 56, h: 96, kind: 'ranged', range: 190, projectile: { look: 'psi', speed: 600 }, cap: { type: 'controle', every: 12, first: 5 }, desc: 'Il prend le contrôle d’une de tes unités, qui attaque les autres pendant 7 secondes.' },
      { id: 'leviathan', name: 'Léviathan des sables', genre: 'colosse', w: 64, h: 112, cap: { type: 'fouisseur', but: 'base' }, desc: 'Il file sous terre et ressort sous ta base.' },
    ],
  };
  const DEFS = C.ages.map(age => (TABLE[age.id] || []).map(o => {
    const b = age.champion, A = ARCH[o.genre];
    const d = Object.assign({}, b, o);
    d.id = 'ch-' + o.id; d.hp = Math.round(b.hp * A.hp); d.dmg = b.dmg * A.dmg;
    if (o.kind !== 'ranged') { d.kind = 'melee'; d.reach = o.reach || b.reach; }
    return d;
  }));

  const CH = PA.Champions = {
    TABLE, DEFS, GENRES,
    // Le tirage d'une run : un rang (0 à 2) par âge.
    tirer() { return DEFS.map(l => Math.floor(Math.random() * Math.max(1, l.length))); },
    // Le champion de cet âge pour cette run (au hasard s'il n'y a pas de tirage : vitrine, essais).
    def(run, i) {
      const l = DEFS[i];
      if (!l || !l.length) return C.ages[i].champion;
      const k = run && run.champions ? run.champions[i] : Math.floor(Math.random() * l.length);
      return l[k] || l[0];
    },
  };

  // ---------------------------------------------------------------- outils
  const etatDe = b => b.chx || (b.chx = { zones: [], oeufs: [], bombes: [], fx: [], relever: [] });
  const texte = (b, x, y, s, col = '#fff') => b.texts.push({ x, y, text: s, life: 1.5, color: col });
  const titre = (b, u, s, col) => texte(b, u.x, GROUND - u.h - 34 - (u.alt || 0), s, col);
  const anneau = (b, x, r, col) => b.particles.push({ ring: true, x, y: GROUND - 6, r: 4, maxR: r, life: 0.45, max: 0.45, color: col });
  const poussiere = (b, x, n, col = 'rgba(190,170,130,0.85)') => { for (let i = 0; i < n; i++) b.particles.push({ x: x + rand(-20, 20), y: GROUND - rand(0, 10), vx: rand(-90, 90), vy: rand(-120, -20), life: rand(0.3, 0.7), max: 0.7, color: col, size: rand(3, 6) }); };
  const vivant = f => f && !f.dead && !f.cache && !f.chute && !f.porte;
  // La première de tes unités (la plus avancée), si elle est à moins de d pixels du champion.
  const proche = (b, u, d) => { const f = b.pu.find(vivant); return f && Math.abs(f.x - u.x) - (f.w + u.w) / 2 <= d ? f : null; };
  const invoquer = (b, def, x) => { const f = b.spawnEnemy(def, false); f.x = cl(x, PF + def.w / 2 + 40, EF - def.w / 2 - 2); return f; };
  // Position d'un point du dessin d'un champion (repère du dessin : tourné vers la droite, pieds en 0) dans le monde.
  const pt = (u, lx, ly) => { const a = PA.Art && PA.Art.units[u.def.id], s = a ? u.h / a.h : 1; return { x: u.x + u.side * lx * s, y: GROUND - (u.alt || 0) + ly * s }; };

  // ---------------------------------------------------------------- moteur
  CH.nait = function (b, u) {
    const cap = u.def.cap; if (!cap) return;
    etatDe(b);
    u.cs = { t: cap.first != null ? cap.first : 4, fx: 0, n: 0, cd: 0, grow: 0, lev: 0 };
    if (u.def.vol) { u.vol = true; u.alt = u.def.vol; }
    if (u.def.survol) u.survol = true;
    if (cap.type === 'bouclier') u.cs.bou = u.cs.bouMax = u.maxHp * 0.6;
    if (cap.type === 'fouisseur') { u.cache = true; u.pilote = true; u.cs.sous = true; }
    if (cap.type === 'clones') u.cs.t = 1.5;
    if (cap.type === 'tortue') u.cs.t = 3;
  };

  function lacher(b, u, cs) {
    const p = cs.proie; cs.proie = null; u.pilote = false;
    if (p && !p.dead) { p.porte = false; p.chute = { v: 0 }; }
    b.sortUnits();
  }
  function sortir(b, u, cs) {
    cs.sous = false; u.cache = false; u.pilote = false; cs.sortie = 0.8;
    anneau(b, u.x, 110, '#a8865a'); poussiere(b, u.x, 18, 'rgba(150,110,70,0.9)');
    b.shake = Math.max(b.shake, 0.35);
    const r = u.def.cap.but === 'base' ? 90 : 70;
    for (const p of b.pu) if (vivant(p) && Math.abs(p.x - u.x) <= r + p.w / 2) { b.damageUnit(p, u.dmg, false, 'pouvoir'); if (!p.dead) p.stun = Math.max(p.stun || 0, 0.6); }
    if (u.def.cap.but === 'base') { b.damageBase(1, u.dmg * 4); titre(b, u, 'SOUS TA BASE !', '#ffd76a'); }
    else {
      const def = b.enemyAgeDef.units[0];
      for (const dx of [-44, 44]) if (b.eu.length < MAXE) invoquer(b, def, u.x + dx);
      titre(b, u, 'SURPRISE !', '#ffd76a');
    }
    b.sortUnits();
  }

  const CAP = {
    rage(b, u) {
      if (!u.enrage && u.hp < u.maxHp * 0.5) { u.enrage = true; titre(b, u, 'ENRAGÉ !', '#ff7a3a'); anneau(b, u.x, 90, '#ff7a3a'); b.shake = Math.max(b.shake, 0.2); }
    },
    appel(b, u, dt, cs) {
      cs.cri = Math.max(0, (cs.cri || 0) - dt); cs.t -= dt;
      if (cs.t > 0) return; cs.t = u.def.cap.every;
      if (b.eu.length >= MAXE) return;
      const def = b.enemyAgeDef.units[u.def.cap.unite];
      for (let i = 0; i < u.def.cap.n; i++) invoquer(b, def, u.x + u.w / 2 + 16 + i * (def.w + 6));
      cs.cri = 1; titre(b, u, '+3 raptors', '#ffd76a'); b.sortUnits();
    },
    rapt(b, u, dt, cs) {
      if (cs.proie) {
        const p = cs.proie;
        u.x = Math.min(cs.dest, u.x + 230 * dt); u.alt = Math.min(118, u.alt + 70 * dt);
        if (!p.dead) { p.x = u.x; p.alt = u.alt - 30; p.stun = Math.max(p.stun || 0, 0.1); }
        if (u.x >= cs.dest || p.dead) lacher(b, u, cs);
        return;
      }
      if (u.alt > u.def.vol) u.alt = Math.max(u.def.vol, u.alt - 40 * dt);
      cs.t -= dt; if (cs.t > 0) return;
      const f = b.pu.find(p => vivant(p) && p.h <= 62 && !p.invoque);
      if (!f || Math.abs(f.x - u.x) > 80) return;
      cs.t = u.def.cap.every; cs.proie = f; f.porte = true; u.pilote = true; cs.dest = Math.min(EF - 150, u.x + 250);
      titre(b, u, 'ENLEVÉ !', '#fff');
    },
    charge(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt;
      if (cs.t > 0 || !proche(b, u, 50)) return;
      cs.t = u.def.cap.every; cs.fx = 0.6;
      for (const p of b.pu) {
        if (!vivant(p)) continue; const d = u.x - p.x; if (d < -20 || d > 170) continue;
        b.damageUnit(p, u.dmg * 1.2, false, 'pouvoir'); if (p.dead) continue;
        p.x = Math.max(PF + p.w / 2 + 2, p.x - 70); p.stun = Math.max(p.stun || 0, 1); p.renverse = 1;
      }
      u.x -= 14; anneau(b, u.x - u.w / 2, 130, '#e8d9b0'); poussiere(b, u.x - u.w / 2, 14); b.shake = Math.max(b.shake, 0.3);
      titre(b, u, 'RENVERSÉS !', '#ffd76a'); b.sortUnits();
    },
    soin(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt;
      if (cs.t > 0) return; cs.t = u.def.cap.every;
      let n = 0;
      for (const f of b.eu) {
        if (f.dead || f.cache || Math.abs(f.x - u.x) > 230 || f.hp >= f.maxHp) continue;
        f.hp = Math.min(f.maxHp, f.hp + f.maxHp * (f === u ? 0.04 : 0.08)); n++;   // 25 % par transe rendait ses troupes increvables
        texte(b, f.x, GROUND - f.h - 20 - (f.alt || 0), '+', '#8dff7a');
      }
      if (n) { cs.fx = 1.4; titre(b, u, 'TRANSE : SOIN', '#8dff7a'); }
    },
    bond(b, u, dt, cs) {
      if (cs.saut) {
        const s = cs.saut; s.k += dt / 0.75; const k = Math.min(1, s.k);
        u.x = lerp(s.x0, s.x1, k); u.alt = 100 * Math.sin(Math.PI * k);
        if (k >= 1) {
          u.alt = 0; u.pilote = false; cs.saut = null;
          for (const p of b.pu) if (vivant(p) && Math.abs(p.x - u.x) <= 70 + p.w / 2) { b.damageUnit(p, u.dmg * 1.5, false, 'pouvoir'); if (!p.dead) p.stun = Math.max(p.stun || 0, 0.6); }
          anneau(b, u.x, 90, '#c9a77a'); poussiere(b, u.x, 16); b.shake = Math.max(b.shake, 0.3); b.sortUnits();
        }
        return;
      }
      if (cs.fait || !proche(b, u, 40)) return;
      const ps = b.pu.filter(vivant);
      const cible = ps.slice(1).find(p => p.kind === 'ranged') || (ps.length > 2 ? ps[ps.length - 1] : null);
      if (!cible) return;
      cs.fait = true; cs.saut = { x0: u.x, x1: Math.max(PF + u.w / 2 + 4, cible.x + 4), k: 0 }; u.pilote = true;
      titre(b, u, 'BOND !', '#ffd76a');
    },
    tortue(b, u, dt, cs) {
      cs.t -= dt;
      if (cs.t <= 0) { u.garde = !u.garde; cs.t = u.garde ? 4 : 5; if (u.garde) titre(b, u, 'TORTUE !', '#ffd76a'); }
      u.ancre = !!u.garde; cs.lev = cl(cs.lev + (u.garde ? 6 : -6) * dt, 0, 1);
    },
    momies(b, u, dt, cs) { cs.cd = Math.max(0, cs.cd - dt); cs.fx = Math.max(0, cs.fx - dt); },
    pietine(b, u, dt, cs) {
      if (cs.ch) {
        const c2 = cs.ch; c2.t -= dt;
        u.x = Math.max(PF + u.w / 2 + 2, u.x - 270 * dt); u.walk += dt * 30; u.moving = true;
        for (const p of b.pu) {
          if (!vivant(p) || c2.hit.has(p) || Math.abs(p.x - u.x) > (p.w + u.w) / 2) continue;
          c2.hit.add(p); b.damageUnit(p, u.dmg, false, 'pouvoir');
          if (!p.dead) { p.x = Math.max(PF + p.w / 2 + 2, p.x - 50); p.stun = Math.max(p.stun || 0, 0.5); p.renverse = 0.8; }
          b.shake = Math.max(b.shake, 0.1);
        }
        if (Math.random() < dt * 30) poussiere(b, u.x + u.w / 2, 1);
        if (c2.t <= 0 || u.x <= PF + u.w / 2 + 3) { cs.ch = null; u.pilote = false; b.sortUnits(); }
        return;
      }
      cs.t -= dt; if (cs.t > 0 || !proche(b, u, 130)) return;
      cs.t = u.def.cap.every; cs.ch = { t: 0.9, hit: new Set() }; u.pilote = true;
      titre(b, u, 'PIÉTINEMENT !', '#ffd76a');
    },
    armure() {},
    aura(b, u) { for (const f of b.eu) if (f !== u && !f.dead && Math.abs(f.x - u.x) <= 240) f.dmgK *= 1.5; },
    souffle(b, u, dt, cs) {
      if (cs.feu > 0) {
        cs.feu -= dt; u.ancre = true;
        const x0 = u.x - u.w / 2 - 440;
        for (const p of b.pu) {
          if (p.dead || p.x < x0 || p.x > u.x) continue;
          b.damageUnit(p, u.dmg * 0.8 * dt, true, 'pouvoir');
          if (!p.dead && (!p.burn || p.burn.dps < u.dmg * 0.2)) p.burn = { dps: u.dmg * 0.2, t: 2 };
        }
        if (x0 <= PF) { b.run.base.hp -= u.dmg * dt; b.shake = Math.max(b.shake, 0.08); }
        if (cs.feu <= 0) u.ancre = false;
        return;
      }
      cs.t -= dt; if (cs.t > 0) return;
      if (!proche(b, u, 320) && u.x - u.w / 2 - 440 > PF) return;
      cs.t = u.def.cap.every; cs.feu = 1.2; titre(b, u, 'SOUFFLE !', '#ff8a3c');
    },
    bordee(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt; if (cs.t > 0) return;
      const cibles = b.pu.filter(p => vivant(p) && u.x - p.x < 470 && u.x - p.x > -20).slice(0, 5);
      const tirs = cibles.slice(); if (u.x - u.w / 2 - 470 <= PF) tirs.push(null);
      if (!tirs.length) return;
      cs.t = u.def.cap.every; cs.fx = 0.6;
      tirs.forEach((tg, i) => b.fire({ owner: -1, x: u.x - 24 + i * 12, y: GROUND - u.h * 0.32, target: tg, look: 'mortar', speed: 520, dmg: u.dmg * 0.7, splash: 34, arc: true, baseX: PF - 6 }));
      for (let i = 0; i < 6; i++) b.particles.push({ x: u.x - 30 + i * 12, y: GROUND - u.h * 0.32, vx: rand(-40, 10), vy: rand(-50, -10), life: 0.8, max: 0.8, color: 'rgba(230,226,216,0.9)', size: rand(5, 9) });
      titre(b, u, 'BORDÉE !', '#ffd76a'); b.shake = Math.max(b.shake, 0.15);
    },
    bombes(b, u, dt, cs, E) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      E.bombes.push({ x: u.x, y: GROUND - u.alt + 6, vy: 0, dmg: u.dmg * 0.9 });
    },
    salve(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt; if (cs.t > 0 || !proche(b, u, u.reach + 40)) return;
      cs.t = u.def.cap.every; cs.fx = 0.8;
      for (const f of b.eu) if (!f.dead && f.kind === 'ranged' && Math.abs(f.x - u.x) <= 320) { f.cd = 0; f.salve = true; }
      titre(b, u, 'FEU !', '#ff8a3c');
    },
    pousse(b, u, dt) {
      if (u.stun > 0) return;
      // Au contact (à portée de coup), elle continue d'avancer et pousse devant elle toutes tes unités.
      const pres = b.pu.filter(p => vivant(p) && p.x <= u.x && p.x + p.w / 2 >= u.x - u.w / 2 - u.reach - 4);
      if (!pres.length) return;
      u.x = Math.max(PF + u.w / 2 + 2, u.x - u.speed * 0.7 * dt); u.walk += u.speed * 0.7 * dt * 0.18; u.moving = true;
      let mur = u.x - u.w / 2 - 1;                 // chaque unité poussée pousse celle qui est derrière
      for (const p of b.pu) {
        if (!vivant(p) || p.x > u.x || p.x + p.w / 2 <= mur) continue;
        p.x = mur - p.w / 2;
        if (p.x < PF + p.w / 2) {                  // coincée contre ta base : écrasée
          p.x = PF + p.w / 2; b.damageUnit(p, u.dmg * 1.2 * dt, true, 'pouvoir');
          if (Math.random() < dt * 12) b.spark(p.x, GROUND - p.h * 0.5, '#ffd76a', 2);
        }
        mur = p.x - p.w / 2 - 1;
      }
      if (Math.random() < dt * 14) b.spark(u.x - u.w / 2, GROUND - 6, '#ffd76a', 2);
    },
    largage(b, u, dt, cs) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      if (b.eu.length >= MAXE) return;
      const f = invoquer(b, b.enemyAgeDef.units[0], u.x); f.alt = u.alt - 16; f.chute = { v: 0 }; f.para = true;
      titre(b, u, 'LARGAGE !', '#fff'); b.sortUnits();
    },
    arc(b, u, dt, cs) {
      cs.t -= dt; if (cs.t > 0) return;
      const f0 = b.pu.find(p => vivant(p) && u.x - p.x <= 230 && u.x - p.x > -40); if (!f0) return;
      cs.t = u.def.cap.every;
      const o = point(u, 'coil'), pts = [[o.x, o.y]], done = new Set(); let cur = f0;
      for (let n = 0; n < 5 && cur; n++) {
        done.add(cur); pts.push([cur.x, GROUND - cur.h * 0.55]);
        b.damageUnit(cur, u.dmg * 0.8, false, 'pouvoir'); b.spark(cur.x, GROUND - cur.h * 0.55, '#9fe3ff', 4);
        let best = null, bd = 170; for (const p of b.pu) { if (!vivant(p) || done.has(p)) continue; const d = Math.abs(p.x - cur.x); if (d < bd) { bd = d; best = p; } }
        cur = best;
      }
      const zig = [pts[0]];
      for (let k = 1; k < pts.length; k++) { const [ax, ay] = pts[k - 1], [bx, by] = pts[k]; for (let s = 1; s <= 4; s++) zig.push([ax + (bx - ax) * s / 4, ay + (by - ay) * s / 4 + (s < 4 ? rand(-9, 9) : 0)]); }
      b.particles.push({ bolt: true, pts: zig, life: 0.35, max: 0.35, color: '#9fe3ff' });
      titre(b, u, 'ARC EN CHAÎNE', '#9fe3ff');
    },
    blindage() {},
    para(b, u, dt, cs) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      if (b.eu.length >= MAXE) return;
      for (const dx of [-26, 26]) { const f = invoquer(b, b.enemyAgeDef.units[0], u.x + dx); f.alt = u.alt - 12; f.chute = { v: 0 }; f.para = true; }
      titre(b, u, 'PARACHUTISTES !', '#fff'); b.sortUnits();
    },
    fouisseur(b, u, dt, cs) {
      cs.sortie = Math.max(0, (cs.sortie || 0) - dt);
      if (!cs.sous) return;
      let dest;
      if (u.def.cap.but === 'base') dest = PF + u.w / 2 + 4;
      else { const ps = b.pu.filter(vivant); dest = ps.length ? ps[Math.floor(ps.length / 2)].x : PF + 170; dest = Math.max(dest, PF + u.w / 2 + 4); }
      u.x = Math.max(dest, u.x - 160 * dt);
      if (Math.random() < dt * 18) poussiere(b, u.x, 1, 'rgba(150,110,70,0.9)');
      if (u.x <= dest + 1) sortir(b, u, cs);
    },
    volPouvoir(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt; if (cs.t > 0) return;
      if (b.specialCd >= 8) { cs.t = 1; return; }
      cs.t = u.def.cap.every; b.specialCd = 8; cs.fx = 1.2;
      titre(b, u, 'POUVOIR VOLÉ !', '#d58bff'); b.game.toast('Docteur Néant te vole ton pouvoir : 8 secondes', 'big');
    },
    croissance(b, u, dt, cs) {
      u.dmgK *= 1 + cs.grow;
      const palier = Math.floor(cs.grow / 0.2);
      if (palier > cs.n) { cs.n = palier; titre(b, u, 'PLUS FORT !', '#8dff7a'); }
    },
    clones(b, u, dt, cs) {
      cs.t -= dt; if (cs.t > 0) return;
      if (b.eu.some(f => f.clone === u && !f.dead)) { cs.t = 2; return; }
      cs.t = u.def.cap.every;
      for (const dx of [-54, 54]) {
        const f = b.spawnEnemy(u.def, false);
        f.isChampion = true; f.clone = u; f.maxHp = f.hp = u.maxHp * 0.15; f.dmg = u.dmg * 0.35; f.cost = 1;
        f.x = cl(u.x + dx, PF + 60, EF - u.w / 2 - 2);
        for (let i = 0; i < 8; i++) b.particles.push({ x: f.x + rand(-14, 14), y: GROUND - rand(10, 70), vx: rand(-40, 40), vy: rand(-60, 0), life: 0.6, max: 0.6, color: 'rgba(80,40,120,0.85)', size: rand(4, 8) });
      }
      titre(b, u, 'TROIS REINES…', '#d58bff'); b.sortUnits();
    },
    ecrase(b, u, dt, cs) {
      if (u.stun > 0) return;
      cs.ecr = cs.ecr || new Map(); let passe = false;
      for (const p of b.pu) {
        if (!vivant(p) || p.h > 52 || p.def.elite) continue;
        if (Math.abs(p.x - u.x) > u.w / 2 + p.w / 2 - 4) continue;
        passe = true;
        if ((cs.ecr.get(p) || 0) > b.time) continue;
        cs.ecr.set(p, b.time + 1); b.damageUnit(p, u.dmg * 2, false, 'pouvoir');
        if (!p.dead) p.ecrase = 0.6;
        texte(b, p.x, GROUND - 50, 'écrasé !', '#fff'); b.shake = Math.max(b.shake, 0.1);
      }
      // Les petites unités ne l'arrêtent pas : il continue de rouler par-dessus.
      const devant = b.pu.find(vivant);
      const bloque = b.eu.some(f => f !== u && !f.dead && !f.vol && f.x < u.x && f.x > u.x - u.w / 2 - 30);   // un allié devant lui
      if (!bloque && (passe || (devant && devant.h <= 52 && !devant.def.elite && Math.abs(devant.x - u.x) < u.w / 2 + devant.w / 2 + u.reach + 10))) {
        u.x = Math.max(PF + u.w / 2 + 2, u.x - u.speed * 0.8 * dt); u.walk += u.speed * dt * 0.18; u.moving = true;
      }
    },
    pille() {},
    flaques(b, u, dt, cs, E) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      E.zones.push({ x: u.x - 12, r: 46, t: 9, max: 9, dps: u.dmg * 0.25 });
    },
    bouclier(b, u, dt, cs) { cs.fx = Math.max(0, cs.fx - dt); },
    piratage(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt; if (cs.t > 0) return;
      cs.t = u.def.cap.every;
      const libres = b.run.turrets.map((t, i) => t && !(t.pirate > 0) ? i : -1).filter(i => i >= 0);
      if (libres.length) {
        const i = libres[Math.floor(Math.random() * libres.length)];
        b.run.turrets[i].pirate = 10; cs.cible = i; cs.fx = 1.2;
        titre(b, u, 'TOURELLE PIRATÉE !', '#ff8a8a'); b.game.toast('L’IA-mère pirate une de tes tourelles : 10 secondes', 'big');
      } else {
        const vict = b.pu.filter(vivant).slice(0, 2);
        if (!vict.length) { cs.t = 2; return; }
        for (const p of vict) { p.stun = Math.max(p.stun || 0, 3); b.spark(p.x, GROUND - p.h * 0.6, '#8dff7a', 6); }
        cs.cible = -1; cs.fx = 1.2; titre(b, u, 'PIRATAGE !', '#8dff7a');
      }
    },
    teleport(b, u, dt, cs, E) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      const ps = b.pu.filter(vivant);
      let dest;
      if (cs.n % 2 === 0 && ps.length) dest = cl(ps[ps.length - 1].x - 80, PF + u.w / 2 + 24, EF - 80);
      else dest = cl((ps.length ? ps[0].x : PF + 320) + 170, PF + 140, EF - u.w / 2 - 10);
      cs.n++;
      E.fx.push({ type: 'tele', x: u.x, y: GROUND - u.alt - 14, t: 0.45, max: 0.45 });
      u.x = dest;
      E.fx.push({ type: 'tele', x: u.x, y: GROUND - u.alt - 14, t: 0.45, max: 0.45 });
      titre(b, u, cs.n % 2 ? 'DANS TON DOS !' : 'TÉLÉPORTATION', '#4ad8ff'); b.sortUnits();
    },
    ponte(b, u, dt, cs, E) {
      cs.t -= dt; if (cs.t > 0) return; cs.t = u.def.cap.every;
      if (b.eu.length + E.oeufs.length >= MAXE) return;
      const def = b.enemyAgeDef.units[0];
      E.oeufs.push({ x: cl(u.x + u.w / 2 + 12 + rand(0, 24), PF + 80, EF - def.w / 2 - 4), t: 2.5, max: 2.5, def });
      titre(b, u, 'ELLE POND…', '#d58bff');
    },
    controle(b, u, dt, cs) {
      cs.fx = Math.max(0, cs.fx - dt); cs.t -= dt; if (cs.t > 0) return;
      const f = b.pu.find(p => vivant(p) && !p.isChampion && !p.invoque && u.x - p.x < 330);
      if (!f) { cs.t = 1; return; }
      cs.t = u.def.cap.every;
      b.pu.splice(b.pu.indexOf(f), 1); f.side = -1; f.retourne = 7; f.cd = 0.4; f.stun = 0; b.eu.push(f);
      cs.cible = f; cs.fx = 1; titre(b, u, 'CONTRÔLÉ !', '#d58bff'); b.sortUnits();
    },
  };

  CH.maj = function (b, dt) {
    const E = etatDe(b);
    for (const f of b.eu) f.dmgK = 1;   // recalculé à chaque pas (aura, croissance)
    for (const u of b.eu.slice()) if (u.cs && !u.dead && CAP[u.def.cap.type]) CAP[u.def.cap.type](b, u, dt, u.cs, E);

    // Unités qui tombent : parachutistes, unité lâchée par le Quetzalcoatlus.
    for (const list of [b.pu, b.eu]) for (const f of list) {
      if (f.renverse > 0) f.renverse = Math.max(0, f.renverse - dt * 1.2);
      if (f.ecrase > 0) f.ecrase = Math.max(0, f.ecrase - dt);
      if (f.poisonCh > 0) f.poisonCh -= dt;
      if (!f.chute) continue;
      f.stun = Math.max(f.stun || 0, 0.05);
      f.alt -= (f.para ? 70 : (f.chute.v += 700 * dt)) * dt;
      if (f.alt <= 0) {
        f.alt = 0; f.chute = null;
        if (!f.para) { b.damageUnit(f, f.maxHp * 0.15, false, 'pouvoir'); poussiere(b, f.x, 6); }
        f.para = false; b.sortUnits();
      }
    }
    // Unités retournées par le Cerveau suprême : elles reviennent au bout de 7 secondes.
    const rendre = b.eu.filter(f => f.retourne > 0 && !f.dead && (f.retourne -= dt) <= 0);
    for (const f of rendre) { b.eu.splice(b.eu.indexOf(f), 1); f.side = 1; f.retourne = 0; f.cd = 0.4; b.pu.push(f); }
    if (rendre.length) b.sortUnits();

    for (const z of E.zones) {
      z.t -= dt;
      for (const p of b.pu) if (vivant(p) && Math.abs(p.x - z.x) <= z.r + p.w / 2) { b.damageUnit(p, z.dps * dt, true, 'pouvoir'); p.poisonCh = 0.3; }
    }
    E.zones = E.zones.filter(z => z.t > 0);
    for (const o of E.oeufs) {
      o.t -= dt;
      if (o.t <= 0) { invoquer(b, o.def, o.x); for (let i = 0; i < 6; i++) b.particles.push({ x: o.x, y: GROUND - 10, vx: rand(-80, 80), vy: rand(-140, -40), life: 0.5, max: 0.5, color: '#e8d8f8', size: rand(2, 4) }); b.sortUnits(); }
    }
    E.oeufs = E.oeufs.filter(o => o.t > 0);
    for (const m of E.bombes) {
      m.vy += 900 * dt; m.y += m.vy * dt;
      if (m.y < GROUND - 4) continue;
      m.dead = true;
      for (const p of b.pu) if (vivant(p) && Math.abs(p.x - m.x) <= 46 + p.w / 2) b.damageUnit(p, m.dmg, false, 'pouvoir');
      if (m.x - 46 <= PF) b.damageBase(1, m.dmg);
      anneau(b, m.x, 46, '#ffb057'); b.spark(m.x, GROUND - 8, '#ffb057', 8); b.shake = Math.max(b.shake, 0.08);
    }
    E.bombes = E.bombes.filter(m => !m.dead);
    for (const r of E.relever) {
      r.t -= dt;
      if (r.t <= 0 && b.eu.length < MAXE) {
        const f = invoquer(b, r.def, r.x); f.hp = f.maxHp * 0.6; f.momie = true; f.cost = Math.round(f.cost * 0.5);
        texte(b, f.x, GROUND - f.h - 24, 'RELEVÉ !', '#efe6cf'); b.sortUnits();
      }
    }
    E.relever = E.relever.filter(r => r.t > 0);
    for (const x of E.fx) x.t -= dt;
    E.fx = E.fx.filter(x => x.t > 0);
  };

  // Dégâts reçus par un champion. src : 'melee', 'tir', 'zone', 'brulure' ou rien (pouvoir, explosion).
  CH.subit = function (b, u, dmg, src) {
    const cs = u.cs; if (!cs) return dmg;
    switch (u.def.cap.type) {
      case 'tortue': if (u.garde) dmg *= 0.5; break;
      case 'armure': if (src === 'tir' || src === 'zone') { dmg *= 0.25; if (Math.random() < 0.3) b.spark(u.x, GROUND - u.h * 0.6, '#c9d2e3', 2); } break;
      case 'blindage': if (src === 'tir' || src === 'melee') { dmg *= 0.25; if (Math.random() < 0.3) b.spark(u.x - u.w / 2, GROUND - u.h * 0.4, '#fff3c4', 2); } else if (src === 'brulure') dmg *= 0.5; break;
      case 'croissance': if (src !== 'brulure') cs.grow = Math.min(0.8, cs.grow + 0.012); break;
      case 'bouclier':
        if (cs.bou > 0) {
          const a = Math.min(cs.bou, dmg); cs.bou -= a; dmg -= a; cs.fx = 0.15;
          if (cs.bou <= 0) {
            titre(b, u, 'BOUCLIER BRISÉ !', '#4ad8ff'); b.shake = Math.max(b.shake, 0.2);
            for (let i = 0; i < 14; i++) b.particles.push({ x: u.x + rand(-30, 30), y: GROUND - u.h * 0.5 + rand(-40, 40), vx: rand(-160, 160), vy: rand(-180, 20), life: 0.7, max: 0.7, color: '#bff4ff', size: rand(2, 5) });
          }
        }
        break;
    }
    return dmg;
  };

  // Coup porté par un champion.
  CH.frappe = function (b, u) {
    if (u.def.cap.type !== 'pille') return;
    const v = Math.round(Math.min(b.run.gold, b.enemyAgeDef.units[0].cost * 0.8));
    if (v <= 0) return;
    b.run.gold -= v;
    texte(b, u.x, GROUND - u.h - 20, `−${v} or`, '#ffd76a');
    for (let i = 0; i < 4; i++) b.particles.push({ x: u.x - 30, y: GROUND - 40, vx: rand(40, 140), vy: rand(-200, -80), life: 0.7, max: 0.7, color: '#ffd76a', size: 4 });
  };

  CH.mort = function (b, u) {
    const E = etatDe(b);
    if (u.cs) {
      if (u.cs.proie) lacher(b, u, u.cs);
      if (u.cs.cible && u.cs.cible.retourne > 0) u.cs.cible.retourne = 0.01;
      if (u.def.cap.type === 'clones') for (const f of b.eu) if (f.clone === u && !f.dead) { f.dead = true; anneau(b, f.x, 40, '#b06bff'); }
    }
    if (u.clone) { for (let i = 0; i < 10; i++) b.particles.push({ x: u.x + rand(-14, 14), y: GROUND - rand(10, 70), vx: rand(-40, 40), vy: rand(-80, 0), life: 0.7, max: 0.7, color: 'rgba(80,40,120,0.85)', size: rand(4, 8) }); texte(b, u.x, GROUND - u.h - 20, 'FAUSSE', '#d58bff'); }
    if (u.side !== -1 || u.isChampion || u.momie || u.retourne || u.invoque) return;
    const ph = b.eu.find(p => !p.dead && p.cs && p.def.cap.type === 'momies' && Math.abs(p.x - u.x) < 320);
    if (ph && ph.cs.n < 8 && ph.cs.cd <= 0) { ph.cs.cd = 2.5; ph.cs.n++; ph.cs.fx = 1.4; E.relever.push({ def: u.def, x: u.x, t: 1.3, max: 1.3 }); }
  };

  // ---------------------------------------------------------------- dessin
  // Petits outils des effets (sol, dessiner) : c = contexte courant, T = temps.
  let c = null, T = 0;
  const trait = (w = 2) => { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const rond = (x, y, r, col, w = 2) => { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fillStyle = col; c.fill(); if (w) trait(w); };
  const ell = (x, y, rx, ry, col, rot = 0, w = 2) => { c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); c.fillStyle = col; c.fill(); if (w) trait(w); };
  const ligne = (x1, y1, x2, y2, col, w = 3) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); };

  /* Les champions sont dessinés avec la boîte à outils des autres unités (PA.Art.kit, js/art.js et js/art/*.js) :
     contour sombre, deux tons par matière, couleur d'équipe sur les vêtements, couronne dorée.
     Repère : pieds en (0, 0), regard vers +x. h = hauteur du dessin, couronne comprise (le jeu le met à la taille de def.h).
     pts : points d'où partent les effets (souffle, éclairs, rayons), dans ce même repère. */
  const ART = {};
  const K = PA.Art && PA.Art.kit;
  if (K) {
    const { SKIN, IVORY, WOOD, WOOD_D, now, blob, limb, dk, poly, line, rect, disc, oval, figure, helm, hairShort, hairWild, arm, fist, swing, thrust, aim, muzzle, wheel, puffs, halo } = K;
    const KI = K.INK, GOLD = '#d9a93a', STEEL = '#b4bac2', STEEL_D = '#7d838b', BRASS = '#c9963f', BRASS_D = '#94692a', IRON = '#5a5650', IRON_D = '#3a3632';
    const hexa = (r, rx, y) => [0, 1, 2, 3, 4, 5].flatMap(i => [Math.cos(i * Math.PI / 3 + Math.PI / 6) * r, y + Math.sin(i * Math.PI / 3 + Math.PI / 6) * rx]);

    // ---- Jurassique
    ART.spinosaure = { h: 60, pts: {}, draw(ctx, u, team, dark, atk, R) {
      const rage = u.enrage, t = now();
      if (rage) halo(ctx, -2, -40, 32, '255,90,40', 0.32 + 0.1 * Math.sin(t * 9));
      K.theropod(ctx, u, team, dark, rage ? Math.max(atk, Math.max(0, Math.sin(t * 12)) * 0.35) : atk,
        { body: '#5f7a4e', belly: '#d6cf98', rex: true, crown: true, eye: rage ? '#ff3b2a' : '#ffd23f', sail: rage ? '#e8643a' : '#c27a5a' }, R);
    } };
    ART['reine-raptors'] = { h: 50, pts: { bouche: [22, -38] }, draw(ctx, u, team, dark, atk, R) {
      K.theropod(ctx, u, team, dark, Math.max(atk, u.cs ? u.cs.cri : 0), { body: '#8a7a3e', belly: '#e0d49a', crown: true, eye: '#ff9a3c' }, R);
    } };
    ART.quetzal = { h: 34, draw(ctx, u, team, dark, atk, R) {
      const t = now(), f = Math.sin(t * 7 + u.x * 0.02), y = -20 + Math.sin(t * 2.4) * 1.5, pris = u.cs && u.cs.proie;
      const B = '#b07a58', BD = '#8a5a3e', WG = '#c99a76';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      blob(ctx, dk(WG, 0.78), () => { ctx.moveTo(-1, y - 2); ctx.quadraticCurveTo(-8, y - 12 - f * 8, -22, y - 14 - f * 14); ctx.quadraticCurveTo(-12, y - 6 - f * 4, -8, y + 1); });
      limb(ctx, [-11, y + 1, -19, y + 2.5], 1.3, BD);
      const py = pris ? 13 : 9;
      limb(ctx, [-3, y + 3, -4, y + py, -1, y + py + 1], 1.4, BD); limb(ctx, [2, y + 3, 2, y + py, 5, y + py + 1], 1.4, B);
      oval(ctx, 0, y, 12, 5, B, 1.3);
      ctx.fillStyle = '#e6c9a0'; ctx.beginPath(); ctx.ellipse(1, y + 2.2, 9, 2, 0, 0, K.TAU); ctx.fill();
      blob(ctx, team, () => { ctx.moveTo(-4, y - 4.8); ctx.lineTo(2, y - 5); ctx.lineTo(2.5, y + 4.6); ctx.lineTo(-3.5, y + 4.8); }, 1);
      limb(ctx, [9, y - 2, 13, y - 7], 2.6, B);
      ctx.save(); ctx.translate(14, y - 8); ctx.rotate(-0.1 + atk * 0.35);
      blob(ctx, dark, () => { ctx.moveTo(-1, -2); ctx.lineTo(-12, -7); ctx.lineTo(-2, 1); }, 1);
      disc(ctx, 0, 0, 3.4, B, 1.1);
      blob(ctx, '#e8c45a', () => { ctx.moveTo(2, -1.6); ctx.lineTo(18, 0.4); ctx.lineTo(2.4, 1.4); }, 0.9);
      ctx.save(); ctx.translate(2.4, 1.2); ctx.rotate(0.05 + atk * 0.4); blob(ctx, '#c9a040', () => { ctx.moveTo(0, -0.4); ctx.lineTo(14, 0.6); ctx.lineTo(0, 1.8); }, 0.9); ctx.restore();
      disc(ctx, 0.8, -0.8, 1, KI); disc(ctx, 1.1, -1.1, 0.35, '#fff');
      R.crown(ctx, -1, -5.5);
      ctx.restore();
      blob(ctx, WG, () => { ctx.moveTo(4, y - 3); ctx.quadraticCurveTo(-2, y - 14 - f * 10, -18, y - 20 - f * 16); ctx.quadraticCurveTo(-10, y - 10 - f * 6, -4, y + 0.5); ctx.quadraticCurveTo(0, y - 1, 4, y - 3); });
      line(ctx, [3, y - 3, -4, y - 12 - f * 8, -18, y - 20 - f * 16], dk(WG, 0.7), 1.1);
    } };

    // ---- Pierre
    ART['mammouth-clan'] = { h: 78, draw(ctx, u, team, dark, atk, R) { PA.Art.units.mammouth.draw(ctx, u, team, dark, Math.max(atk, u.cs ? u.cs.fx / 0.6 : 0), R, { crown: true }); } };
    ART['grand-chaman'] = { h: 60, draw(ctx, u, team, dark, atk, R) {
      const tr = u.cs && u.cs.fx > 0;
      if (tr) halo(ctx, 2, -30, 30, '141,255,122', 0.25 + 0.1 * Math.sin(now() * 8));
      ctx.save(); if (tr) ctx.translate(0, -Math.abs(Math.sin(now() * 9)) * 2.5);
      K.caveman(ctx, u, team, dark, tr ? 0.6 : atk, { hair: '#e8e2d6', beard: 2, antlers: true, cloak: dark, teeth: true, paint: '#c0392b', weapon: 'staff', crown: true, bulk: 1.1 }, R);
      ctx.restore();
    } };
    ART['ours-cavernes'] = { h: 36, draw(ctx, u, team, dark, atk, R) {
      const t = now(), saut = u.alt > 0, mv = u.moving || saut, ph = u.walk * 0.9 + (saut ? t * 8 : 0), st = mv ? Math.sin(ph) : 0;
      const b = mv ? -Math.abs(Math.cos(ph)) * 1 : -Math.sin(t * 1.8 + u.x * 0.04) * 0.4;
      const F = '#6b4a30', FD = '#4e3522', FL = '#8a6444';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save(); if (saut) ctx.rotate(-0.18);
      const leg = (x, dir, col) => K.stump(ctx, x, -14, dir * st * 3 + (saut ? dir * 4 : 0), mv ? Math.max(0, dir * Math.cos(ph)) * 2 : 0, col, 3.6);
      leg(-13, -1, FD); leg(10, 1, FD);
      blob(ctx, F, () => { ctx.moveTo(-20, -12 + b); ctx.quadraticCurveTo(-23, -25 + b, -10, -28 + b); ctx.quadraticCurveTo(2, -32 + b, 10, -28 + b); ctx.quadraticCurveTo(17, -25 + b, 17, -16 + b); ctx.lineTo(14, -9 + b); ctx.quadraticCurveTo(-2, -6 + b, -20, -12 + b); }, 1.5);
      ctx.strokeStyle = FL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -24 + b); ctx.quadraticCurveTo(-6, -30 + b, 6, -28.4 + b); ctx.stroke();
      ctx.strokeStyle = FD; ctx.lineWidth = 1.1; for (const [x, y] of [[-14, -18], [-6, -22], [3, -19], [-10, -12], [8, -14]]) { ctx.beginPath(); ctx.arc(x, y + b, 3.2, 0.3, 2.4); ctx.stroke(); }
      blob(ctx, team, () => { ctx.moveTo(8, -28 + b); ctx.quadraticCurveTo(13, -26 + b, 15, -18 + b); ctx.lineTo(12, -16 + b); ctx.quadraticCurveTo(11, -23 + b, 6, -26 + b); }, 1);
      for (const y of [-25, -21]) disc(ctx, 11 + (y + 25) * 0.4, y + b, 1, IVORY, 0.5);
      leg(-19, 1, F); leg(4, -1, F);
      ctx.save(); ctx.translate(17, -21 + b); ctx.rotate(atk * 0.3);
      disc(ctx, -3, -6, 2.6, F, 1); disc(ctx, -3, -6, 1.2, FD);
      oval(ctx, 2, 0, 7.4, 6.2, F, 1.3);
      oval(ctx, 8, 2, 4.4, 3.2, FL, 1); disc(ctx, 12, 1, 1.4, KI);
      disc(ctx, 3.6, -2, 1.1, KI); line(ctx, [2, -3.8, 5.4, -3], KI, 1);
      if (atk > 0.3) { oval(ctx, 9, 5, 3, 1.6, '#5a1e14'); for (const x of [7.4, 10]) poly(ctx, [x, 3.8, x + 0.8, 5.6, x + 1.6, 3.8], IVORY); }
      R.crown(ctx, 1, -8);
      ctx.restore(); ctx.restore();
    } };

    // ---- Antiquité
    ART.centurion = { h: 60, draw(ctx, u, team, dark, atk, R) {
      const lev = u.cs ? u.cs.lev : 0;
      figure(ctx, u, team, dark, atk, {
        k: 1.12, body: STEEL, skirt: team, skirtLen: 7, belt: '#6a4426', boots: '#8a6440', sleeve: SKIN, back: K.cape(dark), crown: true, crownUp: 15,
        over(c, a) { for (const y of [-29, -25.5, -22]) line(c, [-5.4 * a.k, y + a.ty, 6.2 * a.k, y - 0.3 + a.ty], STEEL_D, 1.1); for (const x of [-2, 3]) disc(c, x * a.k, -27 + a.ty, 1.2, GOLD, 0.6); },
        head(c, a) {
          blob(c, team, () => { c.moveTo(a.hx - 8, a.hy - 5); c.quadraticCurveTo(a.hx, a.hy - 15, a.hx + 8, a.hy - 5); c.lineTo(a.hx + 6, a.hy - 4); c.quadraticCurveTo(a.hx, a.hy - 11, a.hx - 6, a.hy - 4); }, 1.1);
          helm(c, a, STEEL, { neck: 2.4 }); rect(c, a.hx + 4.4, a.hy - 2.4, 1.5, 5, STEEL_D);
        },
        arm(c, a) {
          thrust(c, a, cc => { blob(cc, '#e3e7ee', () => { cc.moveTo(1, -1.6); cc.lineTo(13, -1.2); cc.lineTo(16, 0); cc.lineTo(13, 1.2); cc.lineTo(1, 1.6); }, 0.9); rect(cc, -1, -3, 2.2, 6, GOLD, 0.7); }, { sleeve: SKIN, x: 3 - lev * 2, y: 4, reach: 7 });
          const sx = a.sx + lerp(-1, 9, lev), sy = a.sy + lerp(9, 2, lev);           // bouclier : sur le côté, levé devant lui en tortue
          blob(c, team, () => { c.moveTo(sx - 5, sy - 12); c.quadraticCurveTo(sx - 6.4, sy, sx - 5, sy + 12); c.lineTo(sx + 5, sy + 12); c.quadraticCurveTo(sx + 6.4, sy, sx + 5, sy - 12); }, 1.3);
          line(c, [sx - 4.6, sy - 11, sx + 4.6, sy - 11], GOLD, 1.2); line(c, [sx - 4.6, sy + 11, sx + 4.6, sy + 11], GOLD, 1.2);
          disc(c, sx, sy, 2.6, GOLD, 0.9); for (const d of [-1, 1]) line(c, [sx + d * 2.4, sy - 8, sx + d * 3.4, sy - 3.6], GOLD, 1.1);
        },
      }, R);
    } };
    ART.pharaon = { h: 58, draw(ctx, u, team, dark, atk, R) {
      const lev = u.cs ? Math.min(1, u.cs.fx) : 0, SK = '#c08a5a';
      if (lev > 0) halo(ctx, 12, -56, 14, '255,214,90', 0.55 * lev);
      figure(ctx, u, team, dark, atk, {
        skin: SK, body: IVORY, skirt: IVORY, skirtLen: 12, belt: GOLD, boots: '#a87a3a', sleeve: SK, crown: true, crownUp: 13,
        over(c, a) {
          blob(c, GOLD, () => { c.moveTo(-5.6 * a.k, -32 + a.ty); c.quadraticCurveTo(0.4, -24 + a.ty, 6.4 * a.k, -32.4 + a.ty); c.quadraticCurveTo(0.4, -28.5 + a.ty, -5.6 * a.k, -32 + a.ty); }, 1);
          line(c, [-4 * a.k, -30.4 + a.ty, 5.2 * a.k, -30.8 + a.ty], team, 1.4);
          blob(c, team, () => { c.moveTo(-1, -19 + a.ty); c.lineTo(3, -19 + a.ty); c.lineTo(2.4, -8 + a.ty); c.lineTo(-0.4, -8 + a.ty); }, 0.9);
        },
        hairBack(c, a) {
          blob(c, GOLD, () => { c.moveTo(a.hx - 6, a.hy - 3); c.lineTo(a.hx - 9, a.hy + 9); c.lineTo(a.hx - 2, a.hy + 9); c.lineTo(a.hx - 1, a.hy + 2); }, 1);
          for (const y of [1.5, 5, 8]) line(c, [a.hx - 7.8, a.hy + y, a.hx - 2.2, a.hy + y], team, 1.3);
        },
        head(c, a) {
          blob(c, GOLD, () => { c.moveTo(a.hx - 6.6, a.hy + 1); c.quadraticCurveTo(a.hx - 7, a.hy - 9, a.hx, a.hy - 9.4); c.quadraticCurveTo(a.hx + 6.4, a.hy - 9, a.hx + 6.4, a.hy - 3.6); c.lineTo(a.hx + 2, a.hy - 3.6); c.lineTo(a.hx - 2.6, a.hy - 1.4); c.lineTo(a.hx - 3.4, a.hy + 2); }, 1.1);
          for (const y of [-7, -4.6]) line(c, [a.hx - 6, a.hy + y + 1.6, a.hx + 5.6, a.hy + y], team, 1.2);
          rect(c, a.hx + 3.6, a.hy + 3.6, 1.6, 4.4, '#3a2a18', 0.6);
          line(c, [a.hx + 1.4, a.hy - 0.8, a.hx + 4.8, a.hy - 0.6], '#1a1a2a', 1);
        },
        arm(c, a) {                                      // la crosse se lève quand il relève un mort
          const hx = a.sx + 6 + atk * 2, hy = a.sy + 2 - 9 * lev;
          arm(c, a, hx, hy, SK);
          c.save(); c.translate(hx, hy); c.rotate(0.15 + 0.25 * lev);
          limb(c, [0, 12, 0, -16], 1.8, GOLD); for (const y of [-12, -6, 0, 6]) line(c, [-1.2, y, 1.2, y], team, 1.3);
          c.beginPath(); c.arc(-3, -16, 3, 0, Math.PI, true); c.strokeStyle = KI; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 1.8; c.stroke();
          c.restore(); fist(c, a, hx, hy, SK);
        },
      }, R);
    } };
    ART.hannibal = { h: 84, draw(ctx, u, team, dark, atk, R) { K.elephant(ctx, u, team, dark, u.cs && u.cs.ch ? Math.max(atk, 0.5) : atk, R, { crown: true }); } };

    // ---- Médiéval
    ART['chevalier-noir'] = { h: 58, draw(ctx, u, team, dark, atk, R) {
      const AR = '#3a3d48', AD = '#26282f', AL = '#5a5f6e', t = now();
      figure(ctx, u, team, dark, atk, {
        k: 1.15, body: AR, skirt: team, skirtLen: 8, belt: AD, legs: AR, boots: AD, sleeve: AR, face: false, headColor: AR, back: K.cape(AD), crown: true, crownUp: 11,
        over(c, a) {
          blob(c, team, () => { c.moveTo(-3.6 * a.k, -32 + a.ty); c.lineTo(4.6 * a.k, -32.4 + a.ty); c.lineTo(6.2 * a.k, -19.5 + a.ty); c.lineTo(-5.6 * a.k, -19 + a.ty); }, 1);
          line(c, [0.6, -30 + a.ty, 0.6, -21 + a.ty], AD, 1.8); line(c, [-2.6, -26.6 + a.ty, 3.8, -26.8 + a.ty], AD, 1.8);
          line(c, [-4.6 * a.k, -31 + a.ty, -2 * a.k, -33 + a.ty], AL, 1.2);
        },
        head(c, a) {
          const { hx, hy } = a;
          blob(c, team, () => { c.moveTo(hx - 2, hy - 7); c.quadraticCurveTo(hx - 14, hy - 16, hx - 13, hy - 1); c.quadraticCurveTo(hx - 7, hy - 8, hx, hy - 6.4); }, 1);
          blob(c, AR, () => { c.moveTo(hx - 6.2, hy + 6); c.lineTo(hx - 6.5, hy - 3); c.quadraticCurveTo(hx, hy - 10, hx + 6.5, hy - 3); c.lineTo(hx + 6.8, hy + 6); }, 1.3);
          rect(c, hx + 0.4, hy - 2, 6.2, 1.8, '#120a0a'); line(c, [hx + 1, hy - 1.1, hx + 6, hy - 1.1], `rgba(255,70,50,${0.6 + 0.3 * Math.sin(t * 4)})`, 1);
          line(c, [hx + 3.3, hy - 6.4, hx + 3.3, hy + 5.6], AD, 1.2); line(c, [hx - 4.4, hy - 3.6, hx - 3, hy - 6], 'rgba(255,255,255,0.35)', 1.1);
        },
        arm(c, a) { swing(c, a, cc => K.sword(cc, 30, AL), { sleeve: AR, glove: AD, rest: [0.45, 6, 5], hit: [1.9, 10.5, 4] }); },
      }, R);
    } };
    ART['roi-sorcier'] = { h: 66, draw(ctx, u, team, dark, atk, R) {
      const t = now(), RO = '#3e2a5a', RD = '#2a1c40', w = Math.sin(t * 4 + u.x * 0.02) * 2;
      figure(ctx, u, team, dark, atk, {
        skin: '#cfc4dc', body: RO, skirt: RO, skirtLen: 16, belt: GOLD, legs: RD, boots: RD, sleeve: RO, crown: true, crownUp: 9.5,
        back(c, a) {                                     // la bannière maudite
          limb(c, [-9, -2, -9, -64 + a.ty], 1.5, WOOD_D); disc(c, -9, -65 + a.ty, 1.6, GOLD, 0.8);
          blob(c, team, () => { c.moveTo(-9, -62 + a.ty); c.lineTo(-25, -61 + a.ty + w); c.lineTo(-22, -54 + a.ty + w); c.lineTo(-25, -47 + a.ty + w); c.lineTo(-9, -48 + a.ty); }, 1.1);
          const sy = -55 + a.ty + w * 0.6; disc(c, -16.5, sy, 2.8, IVORY, 0.8); disc(c, -17.5, sy - 0.4, 0.7, KI); disc(c, -15.5, sy - 0.4, 0.7, KI);
        },
        over(c, a) { line(c, [0.8, -32 + a.ty, 1.4, -4 + a.ty], GOLD, 1.2); poly(c, [-5, -32 + a.ty, 6, -32.4 + a.ty, 0.6, -25 + a.ty], dark, 0.9); },
        hairBack(c, a) { blob(c, '#d8d4e0', () => { c.moveTo(a.hx - 5, a.hy - 3); c.lineTo(a.hx - 8.4, a.hy + 9); c.lineTo(a.hx - 3, a.hy + 6); }, 0.9); },
        head(c, a) { blob(c, '#d8d4e0', () => { c.moveTo(a.hx + 0.4, a.hy + 3.6); c.lineTo(a.hx + 6, a.hy + 3.6); c.lineTo(a.hx + 2.6, a.hy + 12); }, 0.9); disc(c, a.hx + 2.9, a.hy - 0.6, 1.2, '#c06bff'); },
        arm(c, a) {
          const hx = a.sx + 6 + atk * 2, hy = a.sy + 2 - atk * 4;
          arm(c, a, hx, hy, RO);
          limb(c, [hx, hy + 16, hx, hy - 14], 1.6, '#4a3a5a'); halo(c, hx, hy - 17, 8 + atk * 8, '192,107,255', 0.6); disc(c, hx, hy - 17, 3, '#e2b8ff', 1);
          fist(c, a, hx, hy, '#cfc4dc');
        },
      }, R);
    } };
    ART.dragon = { h: 72, pts: { bouche: [48, -40] }, draw(ctx, u, team, dark, atk, R) {
      const t = now(), mv = u.moving, ph = u.walk * 0.8, st = mv ? Math.sin(ph) : 0, b = mv ? -Math.abs(Math.cos(ph)) * 1.2 : -Math.sin(t * 1.8 + u.x * 0.04) * 0.6;
      const feu = u.cs && u.cs.feu > 0, fl = Math.sin(t * 3 + u.x * 0.01);
      const C1 = '#5d7a4a', C2 = dk(C1, 0.72), C3 = '#e0c890';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      blob(ctx, dk(team, 0.7), () => { ctx.moveTo(-4, -36 + b); ctx.lineTo(-22, -62 + b - fl * 4); ctx.lineTo(-32, -44 + b - fl * 2); ctx.lineTo(-14, -34 + b); });
      const leg = (x, dir, col) => {
        const dx = dir * st * 3.5, lift = mv ? Math.max(0, dir * Math.cos(ph)) * 2.4 : 0;
        limb(ctx, [x, -24 + b, x + dx - 1, -11 - lift * 0.5, x + dx + 2, -2 - lift], 4.2, col);
        for (const o of [-0.5, 2, 4.5]) blob(ctx, IVORY, () => { ctx.moveTo(x + dx + o, -2.6 - lift); ctx.lineTo(x + dx + o + 2.6, -0.4 - lift); ctx.lineTo(x + dx + o, -0.4 - lift); }, 0.6);
      };
      leg(-14, -1, C2); leg(10, 1, C2);
      blob(ctx, C1, () => { ctx.moveTo(-18, -34 + b); ctx.quadraticCurveTo(-34, -30 + b, -44, -14 + fl * 2); ctx.quadraticCurveTo(-34, -22 + b, -18, -24 + b); });
      poly(ctx, [-44, -14 + fl * 2, -52, -20 + fl * 2, -49, -10 + fl * 2], team, 1);
      blob(ctx, C1, () => { ctx.moveTo(-22, -26 + b); ctx.quadraticCurveTo(-24, -40 + b, -8, -42 + b); ctx.quadraticCurveTo(10, -44 + b, 18, -36 + b); ctx.quadraticCurveTo(22, -26 + b, 14, -20 + b); ctx.quadraticCurveTo(-4, -16 + b, -22, -26 + b); }, 1.6);
      ctx.fillStyle = C3; ctx.beginPath(); ctx.moveTo(14, -22 + b); ctx.quadraticCurveTo(-2, -17.5 + b, -18, -24 + b); ctx.quadraticCurveTo(-2, -21 + b, 15, -26 + b); ctx.closePath(); ctx.fill();
      for (const x of [-16, -9, -2, 5]) poly(ctx, [x - 2, -41 + b, x, -46.5 + b, x + 2, -41.5 + b], IVORY, 0.7);
      leg(-20, 1, C1); leg(4, -1, C1);
      ctx.save(); ctx.translate(14, -36 + b);
      limb(ctx, [0, 0, 10, -8, 20, -6], 7, C1);
      ctx.translate(22, -6); ctx.rotate(feu ? -0.1 : atk * 0.3);
      for (const d of [0, 1]) blob(ctx, IVORY, () => { ctx.moveTo(-4 + d * 3, -4); ctx.quadraticCurveTo(-10 + d * 3, -12, -14 + d * 3, -11); ctx.quadraticCurveTo(-8 + d * 3, -8, -2 + d * 3, -3); }, 0.8);
      blob(ctx, C1, () => { ctx.moveTo(-5, -4); ctx.quadraticCurveTo(2, -7, 12, -3.6); ctx.lineTo(14, -1); ctx.lineTo(4, 0.6); ctx.quadraticCurveTo(-4, 3, -5, -4); }, 1.2);
      ctx.save(); ctx.translate(2, 0.6); ctx.rotate(feu ? 0.45 : 0.1 + atk * 0.4); blob(ctx, C2, () => { ctx.moveTo(0, -0.6); ctx.lineTo(11, 0); ctx.lineTo(9, 2.2); ctx.lineTo(0, 2.6); }, 1); ctx.restore();
      if (feu) halo(ctx, 14, 1, 10, '255,150,60', 0.7);
      disc(ctx, 4, -3.4, 1.5, '#ffd23f', 0.7); disc(ctx, 4.4, -3.4, 0.6, KI);
      R.crown(ctx, -1, -9);
      ctx.restore();
      blob(ctx, team, () => { ctx.moveTo(2, -38 + b); ctx.lineTo(-12, -67 + b - fl * 5); ctx.lineTo(-18, -57 + b - fl * 4); ctx.lineTo(-26, -51 + b - fl * 3); ctx.lineTo(-30, -41 + b - fl * 2); ctx.lineTo(-10, -34 + b); });
      limb(ctx, [2, -38 + b, -12, -67 + b - fl * 5], 1.6, C2);
      for (const [x, y] of [[-18, -57], [-26, -51], [-30, -41]]) line(ctx, [-12, -67 + b - fl * 5, x, y + b - fl * (y < -50 ? 4 : 2)], C2, 1);
    } };

    // ---- Renaissance
    ART.galion = { h: 100, draw(ctx, u, team, dark, atk, R) {
      const t = now(), spin = u.moving ? u.walk * 0.5 : 0, j = u.moving ? Math.sin(u.walk * 2) * 0.6 : 0, fx = u.cs ? u.cs.fx : 0;
      const H1 = '#8a5a30', H2 = '#6b4424', H3 = '#b98650';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      limb(ctx, [-2, -30 + j, -2, -98 + j], 2.4, H2); limb(ctx, [-24, -36 + j, -24, -80 + j], 2, H2);
      for (const [x, y0, y1, w] of [[-2, -92, -68, 15], [-2, -64, -42, 18], [-24, -76, -52, 11]]) {
        const bl = Math.sin(t * 1.6 + x) * 1.5;
        blob(ctx, '#efe6cf', () => { ctx.moveTo(x - w, y0 + j); ctx.lineTo(x + w, y0 + j); ctx.quadraticCurveTo(x + w + 3 + bl, (y0 + y1) / 2 + j, x + w, y1 + j); ctx.lineTo(x - w, y1 + j); ctx.quadraticCurveTo(x - w + 3 + bl, (y0 + y1) / 2 + j, x - w, y0 + j); }, 1.1);
        line(ctx, [x - w + 1, y0 + j, x + w - 1, y0 + j], H2, 1.6);
        line(ctx, [x, y0 + 2 + j, x, y1 - 1 + j], team, 2.4); line(ctx, [x - w + 2, (y0 + y1) / 2 + j, x + w - 1, (y0 + y1) / 2 + j], team, 2.4);
      }
      poly(ctx, [-2, -98 + j, 12, -95 + j + Math.sin(t * 5) * 1.2, -2, -91 + j], team, 0.9);
      limb(ctx, [18, -38 + j, 40, -50 + j], 1.6, H2); line(ctx, [40, -50 + j, -2, -92 + j], '#3a2a1a', 0.8);
      blob(ctx, H1, () => { ctx.moveTo(-44, -46 + j); ctx.lineTo(-30, -46 + j); ctx.lineTo(-28, -38 + j); ctx.lineTo(28, -38 + j); ctx.quadraticCurveTo(40, -38 + j, 44, -44 + j); ctx.quadraticCurveTo(40, -20 + j, 28, -16 + j); ctx.lineTo(-36, -16 + j); ctx.quadraticCurveTo(-44, -24 + j, -44, -46 + j); }, 1.6);
      for (const y of [-34, -22]) line(ctx, [-40, y + j, 36, y + j], H2, 1);
      line(ctx, [-42, -40 + j, 40, -41 + j], H3, 1.4);
      rect(ctx, -38, -31 + j, 74, 4.5, team, 1);
      for (const x of [-26, -12, 2, 16]) { rect(ctx, x - 3, -31.5 + j, 6, 5.5, '#2a1a10', 0.9); rect(ctx, x + 2.6, -30 + j, 4 + fx * 3, 2.4, IRON_D, 0.7); if (fx > 0) muzzle(ctx, x + 10, -28.8 + j, fx / 0.6); }
      rect(ctx, -44, -54 + j, 16, 8, H1, 1.2); line(ctx, [-44, -50 + j, -28, -50 + j], GOLD, 1.2);
      disc(ctx, -34, -58 + j, 3.8, SKIN, 1.1); disc(ctx, -32.4, -58.4 + j, 0.7, KI); R.crown(ctx, -34, -64 + j);
      rect(ctx, -36, -17 + j, 68, 4, H2, 1.1);
      for (const [x, s] of [[-26, 0], [2, 0.5], [28, 1]]) wheel(ctx, x, -9, 9, spin + s, '#3a2a1a', '#a07a4a', 4);
    } };
    ART['machine-volante'] = { h: 34, draw(ctx, u, team, dark, atk, R) {
      const t = now(), f = Math.sin(t * 9 + u.x * 0.02), y = -16 + Math.sin(t * 2.6) * 1.5;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      blob(ctx, '#d8ccb0', () => { ctx.moveTo(-2, y - 3); ctx.quadraticCurveTo(-14, y - 12 - f * 8, -34, y - 8 - f * 12); ctx.lineTo(-26, y - 1 - f * 5); ctx.lineTo(-14, y + 1); }, 1);
      limb(ctx, [-24, y, 18, y - 1], 2.4, WOOD); limb(ctx, [-24, y, -30, y - 6], 1.6, WOOD_D);
      poly(ctx, [-30, y - 6, -38, y - 12, -36, y - 1, -30, y + 1], '#e6dcc4', 1);
      blob(ctx, team, () => { ctx.moveTo(-14, y - 1); ctx.quadraticCurveTo(-4, y - 6, 6, y - 4); ctx.lineTo(6, y + 1); ctx.lineTo(-14, y + 2); }, 1);
      limb(ctx, [-14, y, -22, y + 1], 2.4, '#4a3a2c');
      disc(ctx, 9, y - 4, 3.6, SKIN, 1.1); disc(ctx, 10.8, y - 4.4, 0.7, KI); R.crown(ctx, 9, y - 10);
      limb(ctx, [4, y - 2, 12, y + 2], 1.8, SKIN);
      limb(ctx, [0, y - 4, 0, y - 14], 1.2, WOOD_D);
      oval(ctx, 0, y - 15, 10 * Math.abs(Math.cos(t * 10)) + 1.5, 1.6, 'rgba(230,220,196,0.85)', 0.8);
      blob(ctx, '#efe6cf', () => { ctx.moveTo(2, y - 3); ctx.quadraticCurveTo(-8, y - 16 - f * 9, -30, y - 14 - f * 14); ctx.lineTo(-24, y - 7 - f * 7); ctx.lineTo(-18, y - 5 - f * 4); ctx.lineTo(-10, y - 2); }, 1.1);
      for (const k of [0.35, 0.65, 0.9]) line(ctx, [2, y - 3, 2 - 32 * k, y - 3 - (11 + f * 14) * k], WOOD_D, 1);
    } };
    ART.capitaine = { h: 58, draw(ctx, u, team, dark, atk, R) {
      const fx = u.cs ? u.cs.fx : 0;
      figure(ctx, u, team, dark, atk, {
        body: team, skirt: team, skirtLen: 6, belt: '#3a2a22', legs: '#3f3a44', boots: '#6a4426', sleeve: team, back: K.cape(dark), crown: true, crownUp: 13,
        over(c, a) { line(c, [0.6, -31 + a.ty, 0.9, -20 + a.ty], IVORY, 1.8); line(c, [-4, -26.6 + a.ty, 5.4, -27 + a.ty], IVORY, 1.8); K.ruff(c, a); },
        head(c, a) { K.goatee(c, a, '#3a2618'); K.plumeHat(c, a, '#3a2a22', IVORY); },
        arm(c, a) {
          if (fx > 0.3) swing(c, a, cc => K.saber(cc, 22), { sleeve: team, rest: [-0.5, 5, -7] });   // sabre levé : « Feu ! »
          else aim(c, a, (cc, k) => K.longGun(cc, k, 22, '#7a5230', '#55524c'), { sleeve: team, y: 3.5 });
        },
      }, R);
    } };

    // ---- Vapeur
    ART.locomotive = { h: 64, draw(ctx, u, team, dark, atk, R) {
      const spin = u.walk * 0.6, j = u.moving ? Math.sin(u.walk * 2.4) * 0.5 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      puffs(ctx, 21.5, -62 + j, { n: 4, speed: u.moving ? 1.2 : 0.5, rise: 30, drift: -22, r0: 4, r1: 9, rgb: '90,86,80', a: 0.5, seed: u.x * 0.01 });
      rect(ctx, -40, -50 + j, 20, 34, team, 1.4); rect(ctx, -42, -54 + j, 24, 5, IRON_D, 1.2);
      rect(ctx, -36, -46 + j, 11, 10, '#ffe9a8', 1); disc(ctx, -30, -40 + j, 3.4, SKIN, 1); disc(ctx, -28.4, -40.6 + j, 0.7, KI); R.crown(ctx, -30, -46.5 + j);
      blob(ctx, IRON, () => { ctx.moveTo(-20, -44 + j); ctx.lineTo(30, -44 + j); ctx.quadraticCurveTo(36, -34 + j, 30, -22 + j); ctx.lineTo(-20, -22 + j); }, 1.4);
      for (const x of [-12, 4, 20]) line(ctx, [x, -44 + j, x, -22 + j], BRASS, 2);
      line(ctx, [-18, -41 + j, 28, -41 + j], 'rgba(255,255,255,0.25)', 1.6);
      rect(ctx, 18, -60 + j, 7, 16, IRON_D, 1.2); rect(ctx, 16, -63 + j, 11, 4, IRON_D, 1.1);
      oval(ctx, 2, -46 + j, 5, 3, BRASS, 1);
      halo(ctx, 34, -34 + j, 9, '255,230,150', 0.4); disc(ctx, 31.5, -34 + j, 4, '#ffe9a8', 1);
      rect(ctx, -42, -22 + j, 76, 5, IRON_D, 1.2);
      poly(ctx, [32, -22 + j, 46, -2, 32, -2], team, 1.2); for (const x of [35, 39]) line(ctx, [x, -19 + j, x + 3, -3], dk(team, 0.7), 1);
      wheel(ctx, -32, -10, 8, spin, '#2a2420', BRASS_D, 4);
      wheel(ctx, -10, -12, 11, spin, '#2a2420', dark, 4); wheel(ctx, 14, -12, 11, spin + 0.4, '#2a2420', dark, 4);
      limb(ctx, [-10 + Math.cos(spin) * 7, -12 + Math.sin(spin) * 7, 14 + Math.cos(spin) * 7, -12 + Math.sin(spin) * 7], 1.6, STEEL);
      if (u.moving) puffs(ctx, -4, -6, { n: 2, speed: 1.6, rise: 6, drift: -14, r0: 2, r1: 5, rgb: '238,238,238', a: 0.5, seed: 2 });
    } };
    ART.zeppelin = { h: 48, draw(ctx, u, team, dark, atk, R) {
      const t = now(), y = -32 + Math.sin(t * 1.6) * 1.5, E = '#c2b8a2', ED = dk(E, 0.8);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const d of [-1, 1]) poly(ctx, [-38, y + d * 6, -54, y + d * 17, -52, y + d * 3], team, 1.1);
      limb(ctx, [-50, y, -56, y], 1.4, IRON_D); oval(ctx, -57, y, 1.6, 7 * Math.abs(Math.cos(t * 14)) + 1, 'rgba(60,60,60,0.8)', 0.8);
      oval(ctx, 0, y, 46, 15, E, 1.6);
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, y, 45, 14, 0, 0, K.TAU); ctx.clip();
      ctx.fillStyle = ED; ctx.fillRect(-50, y + 6, 100, 12);
      for (const x of [-30, -15, 0, 15, 30]) line(ctx, [x, y - 16, x, y + 16], ED, 1);
      rect(ctx, -50, y - 2.5, 100, 5, team);
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(0, y, 46, 15, 0, 0, K.TAU); ctx.strokeStyle = KI; ctx.lineWidth = 1.6; ctx.stroke();
      line(ctx, [-30, y - 10, 20, y - 12], 'rgba(255,255,255,0.4)', 2);
      line(ctx, [-8, y + 14, -6, y + 19], KI, 1); line(ctx, [8, y + 14, 6, y + 19], KI, 1);
      blob(ctx, WOOD, () => { ctx.moveTo(-12, y + 19); ctx.lineTo(12, y + 19); ctx.lineTo(9, y + 27); ctx.lineTo(-9, y + 27); }, 1.2);
      line(ctx, [-11, y + 22, 11, y + 22], team, 1.6);
      disc(ctx, 4, y + 16, 3.6, SKIN, 1.1); disc(ctx, 5.8, y + 15.6, 0.7, KI); R.crown(ctx, 4, y + 10);
      limb(ctx, [-12, y + 23, -16, y + 23], 1.2, IRON_D); oval(ctx, -17, y + 23, 1.2, 5 * Math.abs(Math.cos(t * 16)) + 1, 'rgba(60,60,60,0.8)', 0.6);
    } };
    ART.tesla = { h: 64, pts: { coil: [-9.5, -53] }, draw(ctx, u, team, dark, atk, R) {
      const t = now(), sp = Math.sin(t * 13 + u.x) > 0.3, SU = '#3a3440';
      figure(ctx, u, team, dark, atk, {
        body: SU, skirt: SU, skirtLen: 11, belt: '#26202a', legs: '#2a2630', boots: '#1e1a20', sleeve: SU, crown: true, crownUp: 12,
        back(c, a) {                                     // la bobine sur le dos
          rect(c, -13, -34 + a.ty, 7, 15, BRASS_D, 1.1); limb(c, [-9.5, -34 + a.ty, -9.5, -50 + a.ty], 2.4, '#b8703a');
          for (const y of [-38, -42, -46]) oval(c, -9.5, y + a.ty, 3.4, 1.1, '#d08a4a', 0.7);
          halo(c, -9.5, -53 + a.ty, 8, '160,220,255', 0.5 + (sp ? 0.3 : 0)); disc(c, -9.5, -53 + a.ty, 3.6, STEEL, 1);
          if (sp) K.bolt(c, [-9.5, -53 + a.ty, -13 + Math.sin(t * 29) * 3, -59 + a.ty, -9 + Math.sin(t * 23) * 4, -64 + a.ty], 'rgba(150,215,255,0.6)', 0.9);
        },
        over(c, a) {
          blob(c, team, () => { c.moveTo(-3 * a.k, -32 + a.ty); c.lineTo(4 * a.k, -32.4 + a.ty); c.lineTo(5 * a.k, -19 + a.ty); c.lineTo(-3.6 * a.k, -19 + a.ty); }, 1);
          poly(c, [-1, -33.4 + a.ty, 4.4, -33.6 + a.ty, 1.6, -31 + a.ty], IVORY, 0.7); disc(c, 1.6, -31.6 + a.ty, 1.1, '#1a1a1a');
        },
        head(c, a) { hairWild(c, a, '#e8e6e0'); line(c, [a.hx + 1.4, a.hy + 2.4, a.hx + 6.2, a.hy + 2], '#e8e6e0', 1.6); K.goggles(c, a.hx - 1, a.hy - 6.4); },
        arm(c, a) {
          const hx = a.sx + 8 + atk * 2, hy = a.sy + 1 - atk * 3, jj = n => Math.sin(t * 31 + n * 7.3 + u.x) * 2.4;
          arm(c, a, hx, hy, SU); fist(c, a, hx, hy, '#6a5a4a');
          halo(c, hx + 3, hy - 1, 6 + atk * 7, '170,225,255', 0.5 + atk * 0.4); disc(c, hx + 3, hy - 1, 1.6 + atk * 1.4, '#ffffff');
          K.bolt(c, [hx + 3, hy - 1, hx + 7 + jj(1), hy - 5 + jj(2), hx + 10 + jj(3), hy - 1 + jj(4)], 'rgba(150,215,255,0.55)', 0.9);
        },
      }, R);
    } };

    // ---- Moderne
    ART['char-lourd'] = { h: 58, draw(ctx, u, team, dark, atk, R) {
      K.tank(ctx, u, team, dark, atk, { hull: '#4f5546', crown: true }, R);
      blob(ctx, '#5d6352', () => { ctx.moveTo(-32, -15); ctx.lineTo(31, -15); ctx.lineTo(31, -7.5); ctx.lineTo(-32, -7.5); }, 1.2);   // jupes de blindage
      for (const x of [-24, -12, 0, 12, 24]) disc(ctx, x, -11, 0.9, '#3a3f33');
      line(ctx, [-30, -13.4, 29, -13.4], team, 1.4);
    } };
    ART.helico = { h: 38, draw(ctx, u, team, dark, atk, R) {
      const t = now(), y = -20 + Math.sin(t * 2.2) * 1.5, OL = '#5d6a45', OD = dk(OL, 0.75), sw = Math.cos(t * 20);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      blob(ctx, OL, () => { ctx.moveTo(-12, y - 5); ctx.lineTo(-44, y - 6); ctx.lineTo(-44, y - 2); ctx.lineTo(-12, y + 3); }, 1.2);
      poly(ctx, [-44, y - 6, -50, y - 14, -46, y - 2], OD, 1);
      oval(ctx, -47, y - 6, 1.4, 7 * Math.abs(sw) + 1, 'rgba(40,40,40,0.75)', 0.6);
      line(ctx, [-8, y + 8, -6, y + 13], KI, 1.4); line(ctx, [8, y + 8, 8, y + 13], KI, 1.4); limb(ctx, [-14, y + 13, 16, y + 13, 19, y + 11], 1.4, '#3b3f45');
      blob(ctx, OL, () => { ctx.moveTo(-14, y - 6); ctx.quadraticCurveTo(-8, y - 12, 6, y - 11); ctx.quadraticCurveTo(20, y - 10, 22, y); ctx.quadraticCurveTo(18, y + 9, 4, y + 9); ctx.lineTo(-12, y + 6); ctx.quadraticCurveTo(-16, y, -14, y - 6); }, 1.5);
      line(ctx, [-12, y + 2, 18, y + 3], team, 2.6);
      if (R.star) R.star(ctx, -5, y - 3, 2.6, IVORY, 0);
      blob(ctx, 'rgba(160,210,230,0.85)', () => { ctx.moveTo(6, y - 10.6); ctx.quadraticCurveTo(19, y - 9, 21.6, y - 0.6); ctx.lineTo(8, y - 1); }, 1.1);
      disc(ctx, 12, y - 5, 3, SKIN, 1); disc(ctx, 13.6, y - 5.4, 0.6, KI); R.crown(ctx, 12, y - 10.5);
      rect(ctx, 14, y + 5, 10 - atk * 2, 2.4, '#3b3f45', 0.8); muzzle(ctx, 25, y + 6.2, atk);
      limb(ctx, [2, y - 11, 2, y - 15], 1.6, '#3b3f45'); oval(ctx, 2, y - 16, 40 * Math.abs(sw) + 3, 1.6, 'rgba(40,40,40,0.7)', 0.6);
    } };
    ART['sous-marin'] = { h: 52, draw(ctx, u, team, dark, atk, R) {
      const t = now(), j = u.moving ? Math.sin(u.walk * 2) * 0.5 : 0, HU = '#5a6470', HD = dk(HU, 0.75);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      blob(ctx, '#2f2f2c', () => { ctx.moveTo(-30, -10); ctx.lineTo(24, -10); ctx.quadraticCurveTo(30, -5, 24, 0); ctx.lineTo(-30, 0); ctx.quadraticCurveTo(-36, -5, -30, -10); }, 1.3);
      for (let i = 0; i < 5; i++) disc(ctx, -24 + i * 11, -5, 3.4, '#5f5f56', 0.8);
      poly(ctx, [-34, -14 + j, -44, -26 + j, -40, -12 + j], team, 1);
      blob(ctx, HU, () => { ctx.moveTo(-34, -14 + j); ctx.quadraticCurveTo(-38, -26 + j, -24, -30 + j); ctx.lineTo(18, -30 + j); ctx.quadraticCurveTo(26, -29 + j, 26, -20 + j); ctx.lineTo(26, -12 + j); ctx.lineTo(-30, -10 + j); }, 1.5);
      line(ctx, [-32, -20 + j, 24, -20 + j], team, 2.6);
      for (const x of [-18, -6, 6]) disc(ctx, x, -25 + j, 2.4, '#9fd0d8', 0.9);
      for (const x of [-26, -12, 2, 16]) disc(ctx, x, -14 + j, 0.8, HD);
      rect(ctx, -14, -38 + j, 16, 8, HU, 1.2); line(ctx, [-12, -35 + j, 0, -35 + j], team, 1.4);
      limb(ctx, [-10, -38 + j, -10, -46 + j, -6, -46 + j], 1.4, HD);
      disc(ctx, -3, -41 + j, 3.2, SKIN, 1); disc(ctx, -1.6, -41.4 + j, 0.6, KI); R.crown(ctx, -3, -46.5 + j);
      ctx.save(); ctx.translate(26, -20 + j);                     // le foret tourne
      blob(ctx, STEEL, () => { ctx.moveTo(0, -10); ctx.lineTo(18, 0); ctx.lineTo(0, 10); }, 1.2);
      for (let i = 0; i < 3; i++) { const k = (t * 2.4 + i / 3) % 1; line(ctx, [k * 16, -10 + k * 10, k * 16 + 3, 10 - k * 10 - 1], STEEL_D, 1.3); }
      ctx.restore();
    } };

    // ---- Héros
    ART['docteur-neant'] = { h: 62, pts: { orbe: [15.5, -35] }, draw(ctx, u, team, dark, atk, R) {
      const t = now(), RO = '#2a2238', fl = Math.sin(t * 2.5 + u.x * 0.03) * 2;
      halo(ctx, 0, -2, 12, '120,60,200', 0.3);
      ctx.save(); ctx.translate(0, -3 + fl);                       // il lévite
      figure(ctx, u, team, dark, atk, {
        body: RO, skirt: RO, skirtLen: 15, belt: team, legs: RO, boots: '#14101c', sleeve: RO, face: false, headColor: '#14101c', back: K.cape(team), crown: true, crownUp: 12,
        over(c, a) { poly(c, [-4.4, -32 + a.ty, 5.4, -32.4 + a.ty, 0.6, -24 + a.ty], dark, 0.9); disc(c, 0.6, -27 + a.ty, 2, '#8b3bff', 0.7); },
        head(c, a) {
          blob(c, RO, () => { c.moveTo(a.hx - 7, a.hy + 6); c.quadraticCurveTo(a.hx - 8, a.hy - 10, a.hx + 1, a.hy - 10.6); c.quadraticCurveTo(a.hx + 7.4, a.hy - 9, a.hx + 7, a.hy + 1); c.lineTo(a.hx + 4, a.hy - 3); c.lineTo(a.hx - 2.6, a.hy - 2.4); c.lineTo(a.hx - 3.4, a.hy + 6.4); }, 1.2);
          disc(c, a.hx + 2.4, a.hy - 0.2, 1, '#d58bff'); disc(c, a.hx + 5, a.hy - 0.2, 0.9, '#d58bff');
        },
        arm(c, a) {
          const hx = a.sx + 8 + atk * 2, hy = a.sy + 1 - atk * 2;
          arm(c, a, hx, hy, RO);
          halo(c, hx + 4, hy - 2, 9 + atk * 6, '139,59,255', 0.6); disc(c, hx + 4, hy - 2, 3.6, '#05020f', 1);
          fist(c, a, hx, hy, '#14101c');
        },
      }, R);
      ctx.restore();
    } };
    ART['colosse-vert'] = { h: 56, draw(ctx, u, team, dark, atk, R) {
      const gr = u.cs ? u.cs.grow : 0, G = '#6fb24e';
      ctx.save(); ctx.scale(1 + gr * 0.45, 1 + gr * 0.45);
      figure(ctx, u, team, dark, atk, {
        k: 1.45, skin: G, body: G, legs: '#6a3a9a', boots: G, belt: team, crown: true, crownUp: 9.5,
        over(c, a) {
          blob(c, '#6a3a9a', () => { c.moveTo(-5.4 * a.k, -18 + a.ty); c.lineTo(6.2 * a.k, -18.4 + a.ty); c.lineTo(5 * a.k, -11 + a.ty); c.lineTo(3, -13 + a.ty); c.lineTo(1, -10 + a.ty); c.lineTo(-1.4, -13 + a.ty); c.lineTo(-4.6 * a.k, -10.6 + a.ty); }, 1);
          line(c, [-1.4 * a.k, -31 + a.ty, 1.6 * a.k, -29.4 + a.ty], dk(G, 0.72), 1.1); line(c, [-3 * a.k, -24 + a.ty, 4 * a.k, -24.6 + a.ty], dk(G, 0.72), 1);
        },
        head(c, a) { hairWild(c, a, '#1e2a1a'); line(c, [a.hx + 0.6, a.hy - 2.6, a.hx + 5, a.hy - 1.4], KI, 1.6); },
        arm(c, a) { K.punch(c, a, G, 2, G); },
      }, R);
      ctx.restore();
    } };
    ART['reine-ombres'] = { h: 56, draw(ctx, u, team, dark, atk, R) {
      const t = now(), RO = '#2a1838', w = Math.sin(t * 4 + (u.clone ? 2 : 0)) * 1.6;
      halo(ctx, 0, -22, 22, '90,40,140', 0.25);
      figure(ctx, u, team, dark, atk, {
        skin: '#d8d0e8', body: RO, skirt: RO, skirtLen: 17, belt: team, legs: RO, boots: '#140a1c', sleeve: RO, back: K.cape('#140a1c'), crown: true, crownUp: 10,
        over(c, a) { poly(c, [-5, -32 + a.ty, 6, -32.4 + a.ty, 0.6, -22 + a.ty], team, 0.9); },
        hairBack(c, a) { blob(c, '#1a0e24', () => { c.moveTo(a.hx - 5, a.hy - 4); c.quadraticCurveTo(a.hx - 11, a.hy + 4, a.hx - 8 + w, a.hy + 14); c.lineTo(a.hx - 3, a.hy + 6); }, 1); },
        head(c, a) { hairShort(c, a, '#1a0e24'); disc(c, a.hx + 2.9, a.hy - 0.6, 1, '#d58bff'); },
        arm(c, a) { thrust(c, a, cc => { blob(cc, '#d58bff', () => { cc.moveTo(1, -1.4); cc.lineTo(12, 0); cc.lineTo(1, 1.4); }, 0.8); rect(cc, -1, -2.6, 2, 5.2, GOLD, 0.6); }, { sleeve: RO, x: 4, y: 4, reach: 9, rot: -0.1, glove: '#d8d0e8' }); },
      }, R);
    } };

    // ---- Post-apo
    ART['monstre-camion'] = { h: 64, draw(ctx, u, team, dark, atk, R) {
      const mv = u.moving, spin = mv ? u.walk * 0.9 : 0, j = mv ? Math.sin(u.walk * 2.4) * 0.8 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const x of [-22, 22]) { limb(ctx, [x, -17, x - 4, -34 + j], 2.2, STEEL_D); limb(ctx, [x, -17, x + 4, -34 + j], 2.2, STEEL_D); }
      for (const x of [-30, -22]) { puffs(ctx, x + 1.5, -55 + j, { n: 2, speed: mv ? 1.4 : 0.6, rise: 12, drift: -12, r0: 2, r1: 5, rgb: '56,52,48', a: 0.5, seed: x === -30 ? 0.3 : 0.7 }); rect(ctx, x, -54 + j, 3, 8, IRON_D, 0.9); }
      blob(ctx, team, () => { ctx.moveTo(-38, -34 + j); ctx.lineTo(-36, -46 + j); ctx.lineTo(-6, -46 + j); ctx.lineTo(0, -58 + j); ctx.lineTo(18, -58 + j); ctx.lineTo(26, -46 + j); ctx.lineTo(38, -44 + j); ctx.lineTo(38, -34 + j); }, 1.5);
      blob(ctx, '#f2c230', () => { ctx.moveTo(-34, -38 + j); ctx.lineTo(-20, -44 + j); ctx.lineTo(-24, -40 + j); ctx.lineTo(-10, -44 + j); ctx.lineTo(-14, -39 + j); ctx.lineTo(0, -42 + j); ctx.lineTo(-8, -36 + j); ctx.lineTo(-34, -36 + j); }, 0.8);
      poly(ctx, [3, -56 + j, 16, -56 + j, 22, -46.4 + j, 3, -46.4 + j], '#22303a', 1);
      disc(ctx, 10, -50.6 + j, 3.4, SKIN, 1); disc(ctx, 11.8, -51 + j, 0.7, KI); R.crown(ctx, 10, -56.4 + j);
      limb(ctx, [-2, -58 + j, -2, -62 + j, 20, -62 + j, 20, -58 + j], 1.4, IRON_D);
      disc(ctx, 36, -40 + j, 2, '#ffe9a8', 0.8); rect(ctx, 36, -37 + j, 6, 4, STEEL_D, 1);
      K.tire(ctx, -24, -16, 16, spin); K.tire(ctx, 24, -16, 16, spin + 0.5);
    } };
    ART['reine-pillards'] = { h: 62, draw(ctx, u, team, dark, atk, R) {
      const t = now(), LE = '#5a4030';
      figure(ctx, u, team, dark, atk, {
        body: team, legs: LE, boots: '#2a2420', belt: '#4a4440', sleeve: SKIN, crown: true, crownUp: 15.5,
        back(c, a) { oval(c, -9, -24 + a.ty, 5.4, 7, '#8a6a3a', 1.1); line(c, [-12, -30 + a.ty, -6, -30 + a.ty], LE, 1.2); disc(c, -9, -22 + a.ty, 2, GOLD, 0.8); },
        over(c, a) { line(c, [-5.4 * a.k, -22 + a.ty, 6.2 * a.k, -25.6 + a.ty], LE, 1.8); K.shoulderSpikes(c, a); },
        head(c, a) {
          line(c, [a.hx + 0.4, a.hy + 0.4, a.hx + 5.4, a.hy + 1.4], '#2a2420', 1.3);
          blob(c, '#e05aa0', () => { c.moveTo(a.hx - 6, a.hy - 2); c.lineTo(a.hx - 7.6, a.hy - 9.4); c.lineTo(a.hx - 3.6, a.hy - 7); c.lineTo(a.hx - 3.4, a.hy - 13); c.lineTo(a.hx, a.hy - 8); c.lineTo(a.hx + 1.6, a.hy - 12.6); c.lineTo(a.hx + 3.4, a.hy - 7); c.lineTo(a.hx + 5.4, a.hy - 8.6); c.lineTo(a.hx + 4, a.hy - 4.6); c.lineTo(a.hx - 2, a.hy - 5.6); }, 1.1);
        },
        arm(c, a) {                                      // chaîne : pend au repos, fouette à l'attaque
          const hx = a.sx + 6, hy = a.sy + 3 - atk * 3;
          arm(c, a, hx, hy, SKIN); fist(c, a, hx, hy, LE);
          for (let i = 1; i <= 8; i++) { const k = i / 8; oval(c, hx + k * (8 + 18 * atk), hy + Math.sin(k * 3 + t * 6) * (1 - atk) * 3 + k * 10 * (1 - atk), 1.6, 1.1, STEEL, 0.6); }
          disc(c, hx + 8 + 18 * atk, hy + 10 * (1 - atk), 2.4, IRON, 0.8);
        },
      }, R);
    } };
    ART.mutant = { h: 56, draw(ctx, u, team, dark, atk, R) {
      const t = now(), G = '#9bb85a';
      figure(ctx, u, team, dark, atk, {
        k: 1.5, skin: G, body: G, legs: '#5a5248', boots: G, sleeve: G, face: false, headColor: G, crown: true, crownUp: 9.5,
        over(c, a) {
          blob(c, team, () => { c.moveTo(-5.8 * a.k, -21 + a.ty); c.lineTo(6.4 * a.k, -21.4 + a.ty); c.lineTo(6 * a.k, -14 + a.ty); c.lineTo(3, -16 + a.ty); c.lineTo(0.5, -12.4 + a.ty); c.lineTo(-2, -15.6 + a.ty); c.lineTo(-5.6 * a.k, -13 + a.ty); }, 1);
          for (const [x, y, r] of [[-4, -28, 2.2], [2, -31, 1.6], [5, -24.5, 1.8], [-6, -24, 1.4]]) { halo(c, x * a.k, y + a.ty, r * 2.4, '200,255,110', 0.35 + 0.15 * Math.sin(t * 4 + x)); disc(c, x * a.k, y + a.ty, r, '#c8e070', 0.8); }
        },
        head(c, a) {
          disc(c, a.hx - 2.4, a.hy - 4, 3, G, 1); disc(c, a.hx + 3, a.hy - 0.8, 2.4, '#eaff9a', 0.8); disc(c, a.hx + 3.6, a.hy - 0.8, 1, KI);
          if (atk > 0.4) oval(c, a.hx + 3.6, a.hy + 3.6, 2, 1.5, '#3a1a10'); else line(c, [a.hx + 1.4, a.hy + 3.6, a.hx + 5, a.hy + 3], KI, 1);
        },
        arm(c, a) { swing(c, a, cc => { limb(cc, [0, 3, 0, -18], 2.6, '#7a6a5a'); rect(cc, -3, -22, 6, 6, '#5a5248', 1); }, { sleeve: G, glove: G }); },
      }, R);
    } };

    // ---- Futur
    ART['meca-gardien'] = { h: 86, draw(ctx, u, team, dark, atk, R) { K.mech(ctx, u, team, dark, atk, { hull: '#4a5672', trim: '#4fd8ff', crown: true }, R); } };
    ART['ia-mere'] = { h: 78, pts: { oeil: [0, -46] }, draw(ctx, u, team, dark, atk, R) {
      const t = now(), y = -46 + Math.sin(t * 1.8) * 2.5, W2 = '#e6eaf1', WD = '#aab2c2';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      halo(ctx, 0, -2, 16, '79,216,255', 0.3); oval(ctx, 0, -1, 10, 2, 'rgba(79,216,255,0.4)');
      for (const [x, k] of [[-14, 0], [-6, 1], [6, 2], [14, 3]]) {
        const ex = x * 1.2 + Math.sin(t * 2 + k + 1) * 5, ey = y + 38;
        ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.quadraticCurveTo(x * 1.5 + Math.sin(t * 2 + k) * 4, y + 28, ex, ey);
        ctx.strokeStyle = KI; ctx.lineWidth = 3.6; ctx.stroke(); ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 1.8; ctx.stroke();
        disc(ctx, ex, ey, 1.8, '#4fd8ff', 0.6);
      }
      poly(ctx, hexa(25, 23, y), W2, 1.6); poly(ctx, hexa(20, 18.5, y), WD);
      disc(ctx, 0, y, 16, team, 1.2); disc(ctx, 0, y, 12, '#1c2434', 1);
      line(ctx, [-18, y - 14, -10, y - 19], 'rgba(255,255,255,0.6)', 1.6);
      halo(ctx, 0, y, 14 + atk * 6, '255,60,60', 0.45 + 0.15 * Math.sin(t * 3)); disc(ctx, 0, y, 7, '#ff3b3b', 1); disc(ctx, 1.6, y, 3, '#ffd0d0');
      R.crown(ctx, 0, y - 27);
    } };
    ART.vaisseau = { h: 30, draw(ctx, u, team, dark, atk, R) {
      const t = now(), y = -12 + Math.sin(t * 3 + u.x * 0.02) * 1.5, W2 = '#e6eaf1', WD = '#aab2c2';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      halo(ctx, -23, y, 6 + Math.sin(t * 30) * 1.5, '79,216,255', 0.8); disc(ctx, -22, y, 2.6, '#c8f4ff');
      poly(ctx, [-20, y - 5, -12, y - 14, -4, y - 5], WD, 1);
      blob(ctx, W2, () => { ctx.moveTo(-22, y - 5); ctx.lineTo(10, y - 5); ctx.quadraticCurveTo(26, y - 3, 28, y); ctx.quadraticCurveTo(20, y + 5, 8, y + 5); ctx.lineTo(-22, y + 5); }, 1.4);
      line(ctx, [-20, y + 1, 22, y + 1], team, 2.4);
      poly(ctx, [-10, y + 4, -2, y + 4, -14, y + 11, -19, y + 11], WD, 1);
      blob(ctx, '#16304a', () => { ctx.moveTo(0, y - 5); ctx.quadraticCurveTo(8, y - 12, 16, y - 4.6); }, 1);
      line(ctx, [3, y - 7.6, 8, y - 9.4], 'rgba(200,244,255,0.8)', 1.2);
      R.crown(ctx, 6, y - 13);
      rect(ctx, 10, y + 5, 14 - atk * 2, 2.2, '#3a3f4a', 0.8); halo(ctx, 25, y + 6, 3 + atk * 6, '255,80,80', 0.4 + atk * 0.5);
    } };

    // ---- Extra-terrestre
    ART['reine-ruche'] = { h: 70, draw(ctx, u, team, dark, atk, R) {
      const t = now(), mv = u.moving, st = mv ? Math.sin(u.walk) : 0, p = 1 + Math.sin(t * 3) * 0.04;
      const CH = '#4a2a5e', CL = '#6a3f80', CD = '#33193f', LI = '#c3a6e0';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.save(); ctx.translate(-22, -24); ctx.scale(p, p);                // l'abdomen qui pond
      oval(ctx, 0, 0, 22, 15, LI, 1.5); for (const x of [-12, -4, 4, 12]) line(ctx, [x, -14 + Math.abs(x) * 0.2, x + 1, 14 - Math.abs(x) * 0.2], dk(LI, 0.8), 1.1);
      halo(ctx, -4, 2, 10, '141,255,122', 0.25); for (const [x, y] of [[-8, 4], [0, 7], [7, 2]]) oval(ctx, x, y, 2.4, 3, '#e8ddf6', 0.6);
      ctx.restore();
      const leg = (x, d, col) => { const dx = d * st * 3; limb(ctx, [x, -26, x + 6 + dx, -16, x + 4 + dx, 0], 1.8, col); };
      leg(-4, 1, CD); leg(4, -1, CD); leg(10, 1, CD);
      oval(ctx, 4, -30, 11, 9, CH, 1.4);
      blob(ctx, team, () => { ctx.moveTo(-5, -36); ctx.quadraticCurveTo(4, -42, 13, -35); ctx.lineTo(11, -30); ctx.quadraticCurveTo(4, -35, -3, -31); }, 1);
      leg(-1, -1, CH); leg(8, 1, CH); leg(14, -1, CH);
      limb(ctx, [10, -36, 16, -46], 4, CH);
      ctx.save(); ctx.translate(18, -50); ctx.rotate(atk * 0.3);
      for (const a of [-0.5, -0.15, 0.2]) { ctx.save(); ctx.rotate(a); poly(ctx, [-2, -6, 0, -18, 2.6, -6], CD, 0.9); ctx.restore(); }
      oval(ctx, 0, 0, 7, 8, CL, 1.3); oval(ctx, 3.6, -1, 2.2, 1.6, '#8dff7a', 0.6);
      for (const d of [-1, 1]) blob(ctx, IVORY, () => { ctx.moveTo(4, 4); ctx.quadraticCurveTo(10, 5 + d * 2 + atk * 3 * d, 12, 2 + d * 4 * (1 + atk)); ctx.lineTo(6, 6); }, 0.8);
      R.crown(ctx, 0, -10);
      ctx.restore();
      limb(ctx, [12, -34, 22 + atk * 6, -40, 26 + atk * 10, -28], 1.8, CH); poly(ctx, [26 + atk * 10, -28, 30 + atk * 10, -20, 24 + atk * 10, -26], IVORY, 0.7);
    } };
    ART.cerveau = { h: 68, pts: { cerveau: [0, -46] }, draw(ctx, u, team, dark, atk, R) {
      const t = now(), y = -44 + Math.sin(t * 2) * 2.5, LI = '#c3a6e0';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      halo(ctx, 0, -2, 14, '212,155,255', 0.35); oval(ctx, 0, -1, 10, 2, 'rgba(212,155,255,0.45)');
      for (const [x, k] of [[-9, 0], [0, 1], [9, 2]]) limb(ctx, [x, y + 16, x + Math.sin(t * 2 + k) * 4, y + 26, x + Math.sin(t * 2 + k + 1) * 5, y + 36], 2.2, dk(LI, 0.8));
      blob(ctx, '#3a3a5a', () => { ctx.moveTo(-18, y + 6); ctx.lineTo(18, y + 6); ctx.quadraticCurveTo(16, y + 18, 0, y + 19); ctx.quadraticCurveTo(-16, y + 18, -18, y + 6); }, 1.4);
      rect(ctx, -18, y + 6, 36, 3.4, team, 1);
      for (const x of [-10, 0, 10]) disc(ctx, x, y + 13, 1.6, Math.sin(t * 6 + x) > 0 ? '#8dff7a' : '#ff6bd6', 0.6);
      halo(ctx, 0, y - 4, 22 + atk * 6, '212,155,255', 0.25 + atk * 0.3);
      blob(ctx, '#f0a0c8', () => { ctx.moveTo(-15, y + 5); ctx.quadraticCurveTo(-19, y - 10, -6, y - 14); ctx.quadraticCurveTo(6, y - 18, 14, y - 8); ctx.quadraticCurveTo(18, y, 14, y + 5); }, 1.3);
      ctx.strokeStyle = '#c06090'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (const [a, b2, c2, d] of [[-12, -4, -5, 0], [-6, -11, 0, -4], [3, -12, 7, -4], [9, -6, 13, 0], [-4, 2, 6, 1]]) { ctx.moveTo(a, y + b2); ctx.quadraticCurveTo((a + c2) / 2 + 2, y + (b2 + d) / 2 - 3, c2, y + d); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(190,230,255,0.25)'; ctx.beginPath(); ctx.arc(0, y + 6, 21, Math.PI, K.TAU); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = KI; ctx.lineWidth = 1.4; ctx.stroke(); line(ctx, [-14, y - 6, -8, y - 12], 'rgba(255,255,255,0.6)', 1.6);
      R.crown(ctx, 0, y - 19);
    } };
    ART.leviathan = { h: 92, draw(ctx, u, team, dark, atk, R) {
      const t = now(), so = u.cs && u.cs.sortie > 0 ? u.cs.sortie / 0.8 : 0, S1 = '#8a6a52', S2 = dk(S1, 0.8);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const P = k => [-46 + k * 58, -Math.sin(Math.PI * Math.min(1, k * 0.85 + 0.15)) * 10 - k * k * 56 + Math.sin(k * 6 + t * 2.6) * 2.5];
      for (let i = 0; i <= 11; i++) {
        const k = i / 11, p = P(k), r = 7 + k * 7;
        disc(ctx, p[0], p[1] - 6, r, i % 2 ? S1 : S2, 1.3);
        if (i % 2 === 0) { ctx.beginPath(); ctx.arc(p[0], p[1] - 6, r - 1.5, Math.PI * 1.15, Math.PI * 1.85); ctx.strokeStyle = team; ctx.lineWidth = 2.4; ctx.stroke(); }
      }
      const hp = P(1), hx = hp[0] + 6 + atk * 5, hy = hp[1] - 14 - so * 6;
      disc(ctx, hx, hy, 16, S1, 1.5);
      disc(ctx, hx + 5, hy + 1, 10, '#3a1020', 1.2);
      for (let i = 0; i < 10; i++) { const a = i * K.TAU / 10 + t * 0.4, r = 10; poly(ctx, [hx + 5 + Math.cos(a) * r, hy + 1 + Math.sin(a) * r, hx + 5 + Math.cos(a + 0.25) * r, hy + 1 + Math.sin(a + 0.25) * r, hx + 5 + Math.cos(a + 0.12) * r * 0.5, hy + 1 + Math.sin(a + 0.12) * r * 0.5], IVORY, 0.6); }
      line(ctx, [hx - 12, hy - 6, hx - 4, hy - 12], 'rgba(255,255,255,0.3)', 1.6);
      R.crown(ctx, hx - 6, hy - 16.5);
    } };

    for (const [k, a] of Object.entries(ART)) {
      PA.Art.units['ch-' + k] = { h: a.h, draw(ctx, u, team, dark, atk, R) { ctx.lineCap = 'round'; ctx.lineJoin = 'round'; a.draw(ctx, u, team, dark, atk, R); } };
    }
  }
  // Point d'un dessin (pts.<nom>) dans le monde ; à défaut, le haut du corps.
  const point = (u, nom) => {
    const a = ART[u.def.id.slice(3)], p = a && a.pts && a.pts[nom];
    return p ? pt(u, p[0], p[1]) : { x: u.x, y: GROUND - (u.alt || 0) - u.h * 0.7 };
  };
  // ---- au sol, sous les unités : flaques, œufs, galeries, aura du Roi sorcier
  CH.sol = function (ctx, b) {
    const E = b.chx; if (!E) return;
    c = ctx; T = performance.now() / 1000; ctx.save();
    for (const z of E.zones) {
      const a = Math.min(1, z.t, (z.max - z.t) * 3);
      ctx.globalAlpha = 0.8 * a; ell(z.x, GROUND + 2, z.r, 7, '#8dff3a', 0, 2);
      ctx.globalAlpha = a; for (let j = 0; j < 3; j++) { const k = (T * 1.3 + j / 3 + z.x * 0.01) % 1; rond(z.x - z.r * 0.5 + j * z.r * 0.5, GROUND - k * 16, 3 * (1 - k), '#c8ff6a', 1); }
    }
    ctx.globalAlpha = 1;
    for (const o of E.oeufs) { const w = o.t < 1 ? Math.sin(T * 30) * 2 : 0; ell(o.x + w, GROUND - 10, 8, 11, '#e8d8f8'); if (o.t < 1) ligne(o.x - 4, GROUND - 14, o.x + 3, GROUND - 6, INK, 1.4); }
    for (const r of E.relever) { const k = 1 - r.t / r.max; ctx.globalAlpha = 0.8; ell(r.x, GROUND + 1, 16 + k * 6, 4, '#3a2a1a', 0, 0); ctx.globalAlpha = 1; for (let j = 0; j < 3; j++) rond(r.x - 10 + j * 10 + Math.sin(T * 9 + j) * 2, GROUND - 2 - k * 8, 3, '#b0905a', 1.2); }
    for (const u of b.eu) {
      if (u.dead || !u.cs) continue;
      if (u.cache) { ell(u.x, GROUND, 26, 8, '#6a5a3a'); for (let j = 0; j < 3; j++) rond(u.x - 16 + j * 16, GROUND - 8 - Math.abs(Math.sin(T * 12 + j)) * 7, 3, '#6a5a3a', 1.2); }
      if (u.def.cap.type === 'aura') { ctx.globalAlpha = 0.18 + 0.05 * Math.sin(T * 5); ell(u.x, GROUND, 240, 18, '#b06bff', 0, 0); ctx.globalAlpha = 0.6; c.beginPath(); c.ellipse(u.x, GROUND, 240, 18, 0, 0, TAU); c.lineWidth = 2; c.strokeStyle = '#d58bff'; c.stroke(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  };

  // ---- par-dessus les unités
  CH.dessiner = function (ctx, b) {
    const E = b.chx; if (!E) return;
    c = ctx; T = performance.now() / 1000; ctx.save();
    for (const u of b.eu) {
      if (u.dead) continue;
      if (u.momie) { const top = GROUND - u.h; ctx.globalAlpha = 0.85; for (let y = top + u.h * 0.2; y < GROUND - 4; y += 7) ligne(u.x - u.w * 0.35, y, u.x + u.w * 0.35, y + 3, '#efe6cf', 2.2); ctx.globalAlpha = 1; }
      if (u.retourne > 0) { ctx.save(); ctx.translate(u.x, GROUND - u.h - 12); ctx.rotate(T * 4); c.beginPath(); c.arc(0, 0, 7, 0, 4.5); c.lineWidth = 2.5; c.strokeStyle = '#d58bff'; c.stroke(); ctx.restore(); }
      if (u.para && u.chute) { const yt = GROUND - u.alt - u.h - 16; c.beginPath(); c.arc(u.x, yt, 18, Math.PI, TAU); c.closePath(); c.fillStyle = '#f3ead2'; c.fill(); trait(2); ligne(u.x - 18, yt, u.x - 6, yt + 18, INK, 1.2); ligne(u.x + 18, yt, u.x + 6, yt + 18, INK, 1.2); }
      if (u.dmgK > 1 && !u.isChampion) { ctx.globalAlpha = 0.5; rond(u.x, GROUND - u.h * 0.5, u.h * 0.45, 'rgba(176,107,255,0.35)', 0); ctx.globalAlpha = 1; }
      const cs = u.cs; if (!cs) continue;
      const type = u.def.cap.type;
      if (type === 'souffle' && cs.feu > 0) {
        const m = point(u, 'bouche'), x1 = Math.max(PF - 10, u.x - u.w / 2 - 440), k = Math.min(1, (1.2 - cs.feu) * 5), fin = cs.feu < 0.2 ? 1 - cs.feu / 0.2 : 0;
        for (let i = 0; i < 30; i++) { const s = i / 29; if (s > k || s < fin) continue; rond(lerp(m.x, x1, s) + Math.sin(T * 20 + i) * 3, lerp(m.y, GROUND - 26, s) + Math.sin(T * 17 + i * 2) * 4, 5 + s * 13, i % 3 ? '#ff8a3c' : '#ffd23f', 0); }
      }
      if (type === 'bouclier' && cs.bou > 0) {
        const cy = GROUND - u.h * 0.5, r = u.h * 0.62;
        ctx.globalAlpha = 0.2 + 0.08 * Math.sin(T * 6) + (cs.fx > 0 ? 0.25 : 0); rond(u.x, cy, r, '#4ad8ff', 0);
        ctx.globalAlpha = 0.85; c.beginPath(); c.arc(u.x, cy, r, 0, TAU); c.lineWidth = 2.5; c.strokeStyle = '#bff4ff'; c.stroke(); ctx.globalAlpha = 1;
        const bw = Math.max(24, u.w * 0.8), y = GROUND - u.h - 18;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(u.x - bw / 2, y, bw, 4); ctx.fillStyle = '#4ad8ff'; ctx.fillRect(u.x - bw / 2, y, bw * cs.bou / cs.bouMax, 4);
      }
      if (type === 'soin' && cs.fx > 0) for (let j = 0; j < 3; j++) { const k = (T * 1.2 + j / 3) % 1; ctx.globalAlpha = (1 - k) * 0.8 * Math.min(1, cs.fx); c.beginPath(); c.ellipse(u.x, GROUND - 4, 20 + k * 200, 6 + k * 16, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = '#8dff7a'; c.stroke(); ctx.globalAlpha = 1; }
      if (type === 'appel' && cs.cri > 0) { const m = point(u, 'bouche'); for (let j = 0; j < 3; j++) { const k = (T * 2.5 + j / 3) % 1; ctx.globalAlpha = (1 - k) * cs.cri; c.beginPath(); c.arc(m.x, m.y, 10 + k * 46, -2.4, -0.8); trait(3); } ctx.globalAlpha = 1; }
      if (type === 'volPouvoir' && cs.fx > 0) { const o = point(u, 'orbe'); ctx.globalAlpha = Math.min(1, cs.fx); for (const [w, col] of [[8, INK], [4, '#8b3bff']]) { c.beginPath(); for (let i = 0; i <= 24; i++) { const s = i / 24, x = lerp(o.x, b.game && PF + 40, s), y = lerp(o.y, -10, s) + Math.sin(s * 30 - T * 20) * 6; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); } ctx.globalAlpha = 1; }
      if (type === 'piratage' && cs.fx > 0 && cs.cible >= 0) { const tp = b.turretPos(1, cs.cible), o = point(u, 'oeil'); ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#8dff7a'; for (let j = 0; j < 10; j++) { const s = (T * 0.9 + j / 10) % 1; ctx.fillText(j % 2 ? '1' : '0', lerp(o.x, tp.x, s), lerp(o.y, tp.y, s)); } }
      if (type === 'controle' && cs.cible && cs.cible.retourne > 0 && !cs.cible.dead) { const o = point(u, 'cerveau'); ctx.save(); ctx.globalAlpha = 0.6; ctx.setLineDash([5, 7]); ctx.lineDashOffset = -T * 30; ligne(o.x, o.y, cs.cible.x, GROUND - cs.cible.h - 8, '#d58bff', 2.5); ctx.restore(); }
      if (type === 'salve' && cs.fx > 0.5) for (const f of b.eu) if (f.kind === 'ranged' && !f.dead && Math.abs(f.x - u.x) <= 320) rond(f.x - 18, GROUND - f.h * 0.62, 4 + Math.random() * 3, 'rgba(255,214,110,0.9)', 0);
    }
    for (let i = 0; i < b.run.turrets.length; i++) {
      const t = b.run.turrets[i]; if (!t || !(t.pirate > 0)) continue;
      const p = b.turretPos(1, i); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(T * 10); rond(p.x, p.y - 6, 22, '#ff3b3b', 0); ctx.globalAlpha = 1;
      ctx.font = 'bold 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff8a8a'; ctx.fillText(Math.ceil(t.pirate) + ' s', p.x, p.y - 30);
    }
    for (const p of b.pu) if (p.poisonCh > 0 && !p.dead) for (let j = 0; j < 2; j++) { const k = (T * 1.6 + j / 2 + p.x * 0.01) % 1; rond(p.x - 4 + j * 8, GROUND - p.h - 4 - k * 14, 2.5, '#8dff3a', 1); }
    for (const m of E.bombes) { rond(m.x, m.y, 5, '#2a2a2a', 1.6); }
    for (const x of E.fx) if (x.type === 'tele') { const k = 1 - x.t / x.max; ctx.globalAlpha = 1 - k; c.beginPath(); c.arc(x.x, x.y, 10 + 36 * k, 0, TAU); c.lineWidth = 4; c.strokeStyle = '#4ad8ff'; c.stroke(); ctx.globalAlpha = 1; }
    ctx.restore();
  };
})();

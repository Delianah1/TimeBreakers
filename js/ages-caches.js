/* =========================================================================
   TROIS AUTRES ÂGES CACHÉS : Atlantide, Âge de glace, Âge néon.
   Même principe que le Magma (js/magma.js) : on les trouve en REFUSANT D'ÉVOLUER.
   Tu restes un âge en arrière pendant que l'ennemi avance, et le décor se dérègle :
     - Atlantide  (place de l'Antiquité, n° 3) : tu es encore à l'âge de pierre face à l'Antiquité.
                   La mer monte, puis un raz-de-marée traverse le terrain (il ralentit tout le monde).
     - Âge de glace (place du Médiéval, n° 4) : tu es encore à l'Antiquité face au Médiéval.
                   L'hiver tombe, puis un blizzard traverse le terrain (il gèle tout le monde).
     - Âge néon   (place du Moderne, n° 7) : tu es encore à la Vapeur face au Moderne.
                   Les lumières grésillent, puis une surtension traverse le terrain (elle paralyse tout le monde).
   1er niveau de l'âge ennemi : les signes ; 2e : ça s'aggrave ; 3e : la vague arrive après 14 s,
   et le bouton Évoluer devient « Plonger… ». Un âge déjà découvert se réveille un niveau plus tôt.
   Évoluer normalement pendant le phénomène le rendort pour la partie.

   Plonger : run.caches[clé] = true. L'âge remplace l'âge d'origine pour toute la run (toi et l'ennemi),
   avec les mêmes chiffres : l'équilibrage ne bouge pas. Sauvegarde : meta.caches[clé] = { trouve, fois }.
   +500 ✦ la première fois.

   Ce fichier ajoute aussi trois effets d'unités (pour ces âges, réutilisables ailleurs) :
     def.effet = { gel: [durée, ralentissement] } ou { stun: durée }   → au corps à corps ;
     EFFETS[look de projectile]                                        → pour les tirs (unités et tourelles) ;
     def.carapace : moitié moins de dégâts des tirs.
   Le dessin est dans js/art/atlantide.js, js/art/glace.js, js/art/neon.js (dont Art.phen[clé] : le phénomène).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, W = C.world.width, GROUND = C.world.groundY, PF = C.world.baseWidth, EF = W - C.world.baseWidth;
  const rand = (a, b) => a + Math.random() * (b - a);
  const ANT = C.ages[2], MED = C.ages[3], MOD = C.ages[6];

  // ------------------------------------------------------------------ les trois âges
  const ATLANTIDE = {
    id: 'atlantide', name: 'Atlantide', to: 'à l’Atlantide', short: 'Atlantide', cache: true,
    baseHp: ANT.baseHp,
    base: { look: 'atlantide', height: 170 },
    palette: { skyTop: '#0e2a52', skyBottom: '#4ab8c8', hills: '#1a4a5a', hillsFar: '#2a6a7a', ground: '#3a5a58', groundTop: '#4a7a70' },
    units: [
      { id: 'triton', name: 'Triton', kind: 'melee', cost: 150, hp: 360, dmg: 48, interval: 1.0, reach: 10, speed: 46, train: 1.5, w: 26, h: 48, son: 'hoplite',
        look: { body: 'human' }, desc: 'Trident et écailles : encaisse' },
      { id: 'sirene', name: 'Sirène', kind: 'ranged', cost: 210, hp: 176, dmg: 30, interval: 0.9, range: 180, speed: 48, train: 1.4, w: 22, h: 46, son: 'archer',
        look: { body: 'human' }, projectile: { look: 'bulle', speed: 520 }, desc: 'Ses bulles chantantes ralentissent' },
      { id: 'crabe-geant', name: 'Crabe géant', kind: 'melee', cost: 1000, hp: 900, dmg: 110, interval: 1.1, reach: 12, speed: 52, train: 3.0, w: 58, h: 44, son: 'char-guerre',
        carapace: true, look: { body: 'crabe' }, desc: 'Carapace : moitié moins de dégâts des tirs' },
      { id: 'meduse', name: 'Méduse géante', kind: 'melee', elite: true, cost: 950, hp: 1300, dmg: 120, interval: 1.5, reach: 14, splash: 50, speed: 34, train: 3.5, w: 44, h: 66, son: 'elephant',
        effet: { stun: 0.6 }, look: { body: 'meduse' }, desc: 'Filaments en zone qui paralysent' },
    ],
    turrets: [
      { id: 'lance-harpons', name: 'Lance-harpons', cost: 1500, dmg: 20, interval: 0.25, range: 320, proj: 'harpon-corail', projSpeed: 900, son: 'harpon' },
      { id: 'conque', name: 'Conque des tempêtes', cost: 2400, dmg: 170, interval: 1.6, range: 440, proj: 'trombe', projSpeed: 1400, son: 'miroir' },
      { id: 'geyser-abyssal', name: 'Geyser abyssal', cost: 3300, dmg: 130, interval: 2.0, range: 440, proj: 'bulle-geante', projSpeed: 380, splash: 60, arc: true, son: 'geyser' },
    ],
    special: { id: 'tridents', name: 'Pluie de tridents', cooldown: 40, count: 14, duration: 3, dmg: 120, radius: 42, look: 'trident', speed: 760,
      desc: 'Des tridents s’abattent sur les ennemis' },
    champion: Object.assign({}, ANT.champion, { id: 'kraken', name: 'Kraken' }),
  };

  const GLACE = {
    id: 'glace', name: 'Âge de glace', to: 'à l’âge de glace', short: 'Glace', cache: true,
    baseHp: MED.baseHp,
    base: { look: 'glace', height: 180 },
    palette: { skyTop: '#9ab8d8', skyBottom: '#eef6fb', hills: '#c8d8e6', hillsFar: '#dce8f2', ground: '#d8e4ee', groundTop: '#eef4f8' },
    units: [
      { id: 'guerrier-givre', name: 'Guerrier du givre', kind: 'melee', cost: 450, hp: 678, dmg: 112, interval: 1.0, reach: 8, speed: 52, train: 1.5, w: 26, h: 48, son: 'fantassin',
        effet: { gel: [1, 0.3] }, look: { body: 'human' }, desc: 'Hache de glace : ses coups ralentissent' },
      { id: 'lanceur-glace', name: 'Lanceur de glaçons', kind: 'ranged', cost: 675, hp: 436, dmg: 88, interval: 1.4, range: 190, speed: 45, train: 1.5, w: 24, h: 46, son: 'arbaletrier',
        look: { body: 'human' }, projectile: { look: 'glacon', speed: 640 }, desc: 'Longue portée, ses glaçons ralentissent' },
      { id: 'mammouth-laineux', name: 'Mammouth laineux', kind: 'melee', cost: 3150, hp: 2330, dmg: 240, interval: 1.3, reach: 14, speed: 46, train: 3.0, w: 64, h: 66, son: 'mammouth',
        look: { body: 'mammouth' }, desc: 'Charge lourde, très résistant' },
      { id: 'yeti', name: 'Yéti', kind: 'ranged', elite: true, cost: 1200, hp: 1250, dmg: 244, interval: 1.8, range: 250, speed: 34, train: 3.0, w: 40, h: 62, son: 'mangonneau',
        look: { body: 'yeti' }, projectile: { look: 'boule-neige', speed: 380, arc: true, splash: 55 }, desc: 'Lance des blocs de neige en zone qui gèlent' },
    ],
    turrets: [
      { id: 'baliste-givre', name: 'Baliste de givre', cost: 4500, dmg: 218, interval: 1.2, range: 400, proj: 'glacon', projSpeed: 700, son: 'baliste' },
      { id: 'canon-neige', name: 'Canon à neige', cost: 6750, dmg: 242, interval: 1.8, range: 420, proj: 'boule-neige', projSpeed: 380, splash: 55, arc: true, son: 'catapulte' },
      { id: 'souffle-polaire', name: 'Souffle polaire', cost: 9000, dmg: 88, interval: 0.5, range: 120, proj: 'givre', projSpeed: 300, splash: 70, arc: true, son: 'huile' },
    ],
    special: { id: 'grele', name: 'Tempête de grêle', cooldown: 40, count: 30, duration: 3, dmg: 260, radius: 26, look: 'grelon', speed: 900,
      desc: 'Des grêlons géants s’abattent sur les ennemis' },
    champion: Object.assign({}, MED.champion, { id: 'yeti-roi', name: 'Roi des yétis' }),
  };

  const NEON = {
    id: 'neon', name: 'Âge néon', to: 'à l’âge néon', short: 'Néon', cache: true,
    baseHp: MOD.baseHp,
    base: { look: 'neon', height: 160 },
    palette: { skyTop: '#0a0618', skyBottom: '#3a1450', hills: '#1a1030', hillsFar: '#2a1a48', ground: '#16121e', groundTop: '#241c30' },
    units: [
      { id: 'cyber-ninja', name: 'Cyber-ninja', kind: 'melee', cost: 12200, hp: 7260, dmg: 896, interval: 0.9, reach: 10, speed: 62, train: 1.5, w: 24, h: 46, son: 'sapeur',
        look: { body: 'human' }, desc: 'Lame néon, très rapide' },
      { id: 'hacker', name: 'Hacker', kind: 'ranged', cost: 18300, hp: 4690, dmg: 800, interval: 1.4, range: 230, speed: 48, train: 1.6, w: 24, h: 46, son: 'tireur',
        look: { body: 'human' }, projectile: { look: 'code', speed: 900 }, desc: 'Ses virus figent un instant' },
      { id: 'robot-emeute', name: 'Robot anti-émeute', kind: 'melee', cost: 85000, hp: 24800, dmg: 2080, interval: 1.5, reach: 16, speed: 42, train: 3.5, w: 48, h: 70, son: 'marcheur',
        carapace: true, look: { body: 'robot' }, desc: 'Blindé : moitié moins de dégâts des tirs' },
      { id: 'drone-neon', name: 'Drone néon', kind: 'ranged', elite: true, cost: 32400, hp: 14000, dmg: 700, interval: 0.9, range: 140, speed: 50, train: 2.5, w: 36, h: 44, son: 'drone',
        look: { body: 'drone' }, projectile: { look: 'eclair-neon', speed: 900, splash: 40 }, desc: 'Arcs électriques en zone qui paralysent' },
    ],
    turrets: [
      { id: 'tourelle-neon', name: 'Tourelle néon', cost: 122000, dmg: 479, interval: 0.25, range: 380, proj: 'laser-neon', projSpeed: 1100, son: 'tourelle-laser' },
      { id: 'canon-plasma', name: 'Canon à plasma', cost: 176000, dmg: 4470, interval: 1.8, range: 460, proj: 'plasma-neon', projSpeed: 900, son: 'canon-ions' },
      { id: 'tour-surtension', name: 'Tour à surtension', cost: 243000, dmg: 3190, interval: 1.8, range: 480, proj: 'boule-neon', projSpeed: 420, splash: 70, arc: true, son: 'tour-tesla' },
    ],
    special: { id: 'surtension', name: 'Surtension', cooldown: 40, count: 14, duration: 2.5, dmg: 6920, radius: 55, look: 'foudre-neon', speed: 900,
      desc: 'Des éclairs néon frappent les ennemis' },
    champion: Object.assign({}, MOD.champion, { id: 'robot-geant', name: 'Robot géant' }),
  };

  // Les tirs qui font plus que des dégâts (unités et tourelles, des deux camps).
  const EFFETS = {
    bulle: { gel: [1.2, 0.3] }, 'bulle-geante': { gel: [2, 0.4] },
    glacon: { gel: [1.2, 0.35] }, 'boule-neige': { gel: [1.5, 0.4] }, givre: { gel: [1.5, 0.5] },
    code: { stun: 0.35 }, 'eclair-neon': { stun: 0.3 }, 'boule-neon': { stun: 0.5 },
  };

  // ------------------------------------------------------------------ les phénomènes
  const LISTE = [
    { cle: 'atlantide', idx: 2, age: ATLANTIDE, ico: '🌊', cls: 'abysses', hf: 'enfant-abysses',
      texte: 'Plonger dans les abysses',
      alerte: 'La mer se retire… un raz-de-marée arrive !',
      arrivee: 'La mer a tout englouti : plonge dans les abysses !',
      decouverte: 'Âge caché découvert : l’Atlantide !',
      couleurs: ['#bfefff', '#4ad8e8'], degats: 0.3,
      touche(b, u) { u.chill = { t: 3, k: 0.5 }; },
      champions: [
        { id: 'kraken', name: 'Kraken', genre: 'colosse', w: 100, h: 92, speed: 30, cap: { type: 'pousse' }, desc: 'Rien ne l’arrête : ses tentacules poussent tes unités et écrasent celles coincées contre ta base.' },
        { id: 'roi-triton', name: 'Roi des tritons', genre: 'meneur', w: 36, h: 94, cap: { type: 'soin', every: 7, first: 5 }, desc: 'Le chant de son trident soigne les ennemis autour de lui.' },
        { id: 'grand-requin', name: 'Grand requin des sables', genre: 'perturbateur', w: 92, h: 52, cap: { type: 'fouisseur', but: 'lignes' }, desc: 'Il nage sous le sable, ressort au milieu de tes lignes et libère des tritons.' },
      ],
      pouvoirs: [
        { id: 'maree', name: 'Grande marée', type: 'push', dist: 110, k: 1, chill: 0.4, t: 3, desc: 'Une vague repousse tous les ennemis et les ralentit pendant 3 secondes.' },
        { id: 'colere-poseidon', name: 'Colère de Poséidon', type: 'focus', n: 4, dur: 2, cible: 'fort', k: 3.5, r: 30, look: 'eclair', desc: 'La foudre du trident frappe quatre fois l’ennemi le plus solide.' },
        { id: 'garde-abysses', name: 'Garde des abysses', type: 'summon', unite: 0, count: 3, mult: 1.3, ou: 'base', desc: 'Trois tritons gratuits, plus forts que la normale, sortent de l’eau.' },
      ],
      origine: 'Quatorze tridents de bronze s’abattent sur la ligne ennemie.' },

    { cle: 'glace', idx: 3, age: GLACE, ico: '❄️', cls: 'givre', hf: 'enfant-givre',
      texte: 'Plonger dans l’hiver éternel',
      alerte: 'Le vent glacé se lève… le blizzard arrive !',
      arrivee: 'Le blizzard a tout gelé : plonge dans l’hiver éternel !',
      decouverte: 'Âge caché découvert : l’Âge de glace !',
      couleurs: ['#ffffff', '#bfe6ff'], degats: 0.25,
      touche(b, u) { u.chill = { t: 6, k: u.isChampion ? 0.35 : 0.6 }; },
      champions: [
        { id: 'yeti-roi', name: 'Roi des yétis', genre: 'colosse', w: 62, h: 102, speed: 34, cap: { type: 'rage' }, desc: 'Sous la moitié de ses PV, il s’enrage et frappe deux fois plus vite.' },
        { id: 'reine-neiges', name: 'Reine des neiges', genre: 'meneur', w: 36, h: 94, kind: 'ranged', range: 160, projectile: { look: 'glacon', speed: 640 }, cap: { type: 'clones', every: 18 }, desc: 'Elle se dédouble en trois reflets de glace : une seule est la vraie.' },
        { id: 'dragon-givre', name: 'Dragon de givre', genre: 'perturbateur', w: 96, h: 84, cap: { type: 'souffle', every: 9, first: 4, gel: true, couleurs: ['#bfefff', '#ffffff'] }, desc: 'Son souffle glacé traverse toute ta ligne, ralentit tes troupes et touche ta base.' },
      ],
      pouvoirs: [
        { id: 'blizzard', name: 'Blizzard', type: 'push', dist: 50, k: 0.8, chill: 0.6, t: 5, desc: 'Un vent glacé repousse les ennemis et les ralentit de 60 % pendant 5 secondes.' },
        { id: 'avalanche', name: 'Avalanche', type: 'drops', count: 3, k: 4, radius: 85, duration: 1.6, speed: 520, look: 'neige', desc: 'Trois énormes blocs de neige : dégâts massifs sur une large zone.' },
        { id: 'troupeau', name: 'Troupeau de mammouths', type: 'sweep', count: 1, k: 4, speed: 480, knock: 70, look: 'mammouth', desc: 'Un mammouth charge d’un bout à l’autre et repousse les ennemis.' },
      ],
      origine: 'Trente grêlons géants s’abattent sur les ennemis.' },

    { cle: 'neon', idx: 6, age: NEON, ico: '⚡', cls: 'neon', hf: 'enfant-reseau',
      texte: 'Plonger dans le réseau',
      alerte: 'Les lumières grésillent… une surtension arrive !',
      arrivee: 'La surtension a tout grillé : plonge dans le réseau !',
      decouverte: 'Âge caché découvert : l’Âge néon !',
      couleurs: ['#ff3ad8', '#3afff0'], degats: 0.3,
      touche(b, u) { u.stun = Math.max(u.stun || 0, u.isChampion ? 0.6 : 2); },
      champions: [
        { id: 'robot-geant', name: 'Robot géant', genre: 'colosse', w: 64, h: 104, cap: { type: 'bouclier' }, desc: 'Son bouclier d’énergie doit être brisé avant qu’on puisse l’atteindre.' },
        { id: 'ia-rebelle', name: 'IA rebelle', genre: 'meneur', w: 56, h: 96, kind: 'ranged', range: 200, projectile: { look: 'laser-neon', speed: 1100 }, cap: { type: 'piratage', every: 16, first: 5 }, desc: 'Elle pirate une de tes tourelles et la retourne contre toi pendant 10 secondes.' },
        { id: 'pirate-holo', name: 'Pirate holographique', genre: 'perturbateur', w: 40, h: 90, kind: 'ranged', range: 190, projectile: { look: 'code', speed: 900 }, cap: { type: 'teleport', every: 7, first: 5 }, desc: 'Il se téléporte d’un point à l’autre, même dans ton dos.' },
      ],
      pouvoirs: [
        { id: 'coupure', name: 'Coupure générale', type: 'stun', t: 3, look: 'iem', tourelles: 6, desc: 'Paralyse les ennemis 3 secondes et coupe leurs tourelles 6 secondes.' },
        { id: 'rayon-neon', name: 'Rayon néon', type: 'sweep', count: 1, k: 4.5, speed: 900, look: 'laser', desc: 'Un rayon néon balaie tout le terrain.' },
        { id: 'hologrammes', name: 'Renforts holographiques', type: 'summon', unite: 0, count: 3, mult: 1.5, ou: 'front', desc: 'Trois cyber-ninjas gratuits apparaissent sur la ligne de front.' },
      ],
      origine: 'Quatorze éclairs néon frappent les ennemis.' },
  ];

  // Inscription : champions, pouvoirs, sons d'emprunt.
  for (const c of LISTE) {
    c.orig = C.ages[c.idx];
    PA.Champions.TABLE[c.age.id] = c.champions;
    c.champions = PA.Champions.construire(c.age);
    c.chOrig = PA.Champions.DEFS[c.idx];
    PA.Pouvoirs.TABLE[c.age.id] = c.pouvoirs;
    if (PA.Pouvoirs.ORIGINE) PA.Pouvoirs.ORIGINE[c.age.special.id] = c.origine;
  }
  // Le Magma emprunte aussi des sons (js/sons.js : def.son).
  if (PA.Magma) {
    const S = { salamandre: 'raptor', cendreux: 'cracheur', 'golem-obsidienne': 'mammouth', 'elementaire-lave': 'ankylosaure',
      brasero: 'canon-ambre', 'geyser-magma': 'geyser', 'mortier-obsidienne': 'catapulte' };
    for (const d of [...PA.Magma.MAGMA.units, ...PA.Magma.MAGMA.turrets]) if (S[d.id]) d.son = S[d.id];
    PA.Magma.PETIT.son = 'ankylosaure';
  }

  const AC = PA.AgesCaches = {
    LISTE, EFFETS, PAR_CLE: Object.fromEntries(LISTE.map(c => [c.cle, c])),

    // Chaque âge est l'âge caché (si la run y a plongé) ou l'âge d'origine.
    appliquer(run) {
      for (const c of LISTE) {
        const on = !!(run && !run.mode && run.caches && run.caches[c.cle]);
        C.ages[c.idx] = on ? c.age : c.orig;
        PA.Champions.DEFS[c.idx] = on ? c.champions : c.chOrig;
      }
    },
    decouvert(meta, cle) { return !!(meta && meta.caches && meta.caches[cle] && meta.caches[cle].trouve); },
    nbDecouverts(meta) { return LISTE.filter(c => AC.decouvert(meta, c.cle)).length + (PA.Magma && PA.Magma.decouvert(meta) ? 1 : 0); },

    stade(b, c) {
      const run = b.run;
      if (b.mode !== 'level' || b.special_ || run.mode) return 0;
      if (PA.Tuto && PA.Tuto.actif) return 0;
      if ((run.caches && run.caches[c.cle]) || (run.cachesDort && run.cachesDort[c.cle])) return 0;
      if (run.age !== c.idx - 1 || b.enemyAge !== c.idx || b.game.playableAges <= c.idx) return 0;
      return Math.min(3, b.blockIndex + 1 + (AC.decouvert(b.meta, c.cle) ? 1 : 0));
    },

    // ------------------------------------------------------------ en combat
    preparer(b) {
      b.phen = null;
      for (const c of LISTE) {
        const s = AC.stade(b, c);
        if (!s) continue;
        b.phen = { c, s, t: 14, x: null, etat: s >= 3 ? 'attente' : 'aucune', touches: new Set(), fin: 0 };
        if (s === 1) b.shake = 0.25;
        break;
      }
    },

    maj(b, dt) {
      const P = b.phen; if (!P) return;
      if (P.etat === 'aucune') return;
      if (P.etat === 'attente') {
        P.t -= dt;
        if (P.t <= 3 && !P.alerte) { P.alerte = true; b.game.toast(P.c.alerte, 'big'); }
        if (P.t <= 0) { P.etat = 'vague'; P.x = EF - 10; b.shake = 0.5; }
        return;
      }
      if (P.etat === 'vague') {
        P.x -= 190 * dt;
        b.shake = Math.max(b.shake, 0.1);
        for (const list of [b.pu, b.eu]) for (const u of list) {
          if (u.dead || u.cache || u.alt > 0 || P.touches.has(u) || u.x < P.x - u.w / 2) continue;
          P.touches.add(u);
          b.damageUnit(u, u.maxHp * (u.isChampion ? 0.1 : P.c.degats), false, 'pouvoir');
          if (!u.dead) P.c.touche(b, u);
          b.spark(u.x, GROUND - 14, P.c.couleurs[1], 6);
        }
        if (Math.random() < dt * 30) b.particles.push({ x: P.x + rand(0, 24), y: GROUND - rand(0, 30), vx: rand(-80, 30), vy: rand(-220, -60), life: 0.6, max: 0.6, color: P.c.couleurs[Math.random() < 0.5 ? 0 : 1], size: rand(2, 4) });
        if (P.x <= PF + 10) { P.etat = 'arrivee'; P.x = PF + 10; b.game.toast(P.c.arrivee, 'big'); }
        return;
      }
      P.fin = Math.min(1, P.fin + dt / 20);
    },

    plongeePossible(b) {
      const P = b.phen;
      return !!(P && P.s >= 3 && P.etat === 'arrivee' && b.run.age === P.c.idx - 1 && !b.over && b.game.playableAges > P.c.idx);
    },

    plonger(b) {
      const c = b.phen.c, run = b.run, meta = b.game.meta;
      run.caches = Object.assign({}, run.caches, { [c.cle]: true });
      AC.appliquer(run);
      b._champ = null;            // le champion ennemi de ce combat sera celui de l'âge caché
      const premier = !AC.decouvert(meta, c.cle);
      meta.caches = Object.assign({}, meta.caches);
      meta.caches[c.cle] = Object.assign({ trouve: true, fois: 0 }, meta.caches[c.cle]);
      meta.caches[c.cle].trouve = true; meta.caches[c.cle].fois = (meta.caches[c.cle].fois || 0) + 1;
      let gain = 0;
      if (premier) { gain = PA.Meta.bank(meta, 500); run.ppLevels += gain; }
      PA.Meta.save(meta);
      b.phen = null;
      b.shake = 0.8;
      for (let i = 0; i < 70; i++) b.particles.push({ x: rand(0, W), y: GROUND - rand(0, 40), vx: rand(-60, 60), vy: rand(-320, -80), life: rand(0.6, 1.4), max: 1.4, color: c.couleurs[i % 2], size: rand(2, 5) });
      if (premier) setTimeout(() => b.game.toast(`${c.decouverte} +${Math.round(gain)} ✦`, 'big'), 1600);
      if (AC.surDecouverte) AC.surDecouverte(b, c, premier);
    },

    decor(ctx, b, t) {
      const P = b.phen, f = PA.Art && PA.Art.phen && PA.Art.phen[P.c.cle];
      if (f) f(ctx, b, P, performance.now() / 1000);
    },
  };

  // ---------------------------------------------------------------- branchements
  const B = PA.Battle.prototype;
  const update0 = B.update, canEvolve0 = B.canEvolve, evolve0 = B.evolve, plonge0 = B.plongeePossible;
  const attack0 = B.attack, hit0 = B.hit, damage0 = B.damageUnit;
  B.update = function (dt) { update0.call(this, dt); if (!this.over) AC.maj(this, dt); };
  B.canEvolve = function () { return AC.plongeePossible(this) || canEvolve0.call(this); };
  B.plongeePossible = function () { return AC.plongeePossible(this) || !!(plonge0 && plonge0.call(this)); };
  // Le texte et la couleur du bouton Évoluer quand on peut plonger (js/ui.js).
  B.plongeeInfo = function () {
    if (AC.plongeePossible(this)) return { texte: this.phen.c.texte, cls: this.phen.c.cls };
    if (plonge0 && plonge0.call(this)) return { texte: 'Plonger dans le magma', cls: 'magma' };
    return null;
  };
  B.evolve = function () {
    if (AC.plongeePossible(this)) { const i = this.run.age; AC.plonger(this); this.run.xp = Math.max(this.run.xp, C.evolveXp[i]); }
    else if (this.phen && canEvolve0.call(this)) { this.run.cachesDort = Object.assign({}, this.run.cachesDort, { [this.phen.c.cle]: true }); this.phen = null; }   // évoluer normalement rendort le phénomène
    return evolve0.call(this);
  };

  // Effets : on note l'effet du coup en cours, damageUnit l'applique à la cible.
  B.attack = function (u, target) {
    const avant = this._effet; this._effet = u.def.effet || null;
    try { return attack0.call(this, u, target); } finally { this._effet = avant; }
  };
  B.hit = function (p, x) {
    const avant = this._effet; this._effet = EFFETS[p.look] || null;
    try { return hit0.call(this, p, x); } finally { this._effet = avant; }
  };
  B.damageUnit = function (u, dmg, quiet, src) {
    if (u.def && u.def.carapace && (src === 'tir' || src === 'zone')) dmg *= 0.5;
    const r = damage0.call(this, u, dmg, quiet, src);
    const fx = this._effet;
    if (fx && !u.dead && !u.cache && (src === 'melee' || src === 'tir' || src === 'zone')) {
      if (fx.gel) { const k = fx.gel[1] * (u.isChampion ? 0.5 : 1); if (!u.chill || u.chill.k <= k) u.chill = { t: fx.gel[0], k }; }
      if (fx.stun) u.stun = Math.max(u.stun || 0, fx.stun * (u.isChampion ? 0.3 : 1));
    }
    return r;
  };

  // Au camp, les âges d'origine reviennent (menus, boutique, galerie).
  const camp0 = PA.UI.showCamp;
  PA.UI.showCamp = function (...a) { AC.appliquer(null); return camp0.apply(this, a); };

  const Battle0 = PA.Battle;
  PA.Battle = class extends Battle0 {
    constructor(game, opts) {
      AC.appliquer(game.run);
      super(game, opts);
      AC.preparer(this);
    }
  };
})();

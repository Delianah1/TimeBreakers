/* =========================================================================
   CONFIGURATION DU JEU — toutes les valeurs d'équilibrage sont ici.
   Modifier ce fichier suffit pour ajuster le jeu (puis recharger la page).
   ========================================================================= */
window.PA = window.PA || {};

// Prix croissants : premier prix, puis ×facteur à chaque niveau, arrondi à 2 chiffres significatifs.
PA.prix = function (premier, facteur, niveaux) {
  const out = [];
  let p = premier;
  for (let i = 0; i < niveaux; i++) {
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(p)) - 1));
    out.push(Math.round(p / mag) * mag);
    p *= facteur;
  }
  return out;
};

PA.CONFIG = {
  // --- Monde (coordonnées logiques, le canvas est mis à l'échelle) ---------
  world: {
    width: 1280,
    height: 720,
    groundY: 610,
    baseWidth: 110,        // largeur d'une base ; joueur à gauche, ennemi à droite
  },

  // --- Économie du joueur ---------------------------------------------------
  economy: {
    startGold: 175,
    // Pas d'or par seconde de base : l'or vient des kills (décision du 9/11).
    // Le filet de sécurité, c'est le pouvoir spécial : ses kills rapportent de l'or.
    // L'or par seconde s'achète avec l'amélioration permanente « Collecteurs » :
    // or/s gagné PAR NIVEAU d'amélioration, selon l'âge du joueur.
    passiveGoldPerLevel: [0.4, 1, 3, 9, 27, 81, 243, 729, 2187, 6561, 19683],
    killGoldMult: 1.3,                  // or gagné = coût de l'unité tuée × ce facteur
    killXpMult: 4,                      // XP gagnée = coût de l'unité tuée × ce facteur
    ownDeathXpMult: 1,                  // XP gagnée quand une de tes unités meurt
    goldCarryOver: 0.5,                 // part de l'or conservée d'un niveau à l'autre
    minGoldAtLevelStart: [120, 300, 900, 2700, 8000, 24000, 72000, 216000, 648000, 1944000, 5832000],
    // La réparation de la base entre deux niveaux dépend de la difficulté : voir difficulties.*.repair.
    keepTurretsBetweenLevels: true,     // les tourelles restent sur la base d'un niveau à l'autre
    queueSize: 5,
    slotCosts: [250, 800, 2000],        // prix du 2e, 3e et 4e emplacement de tourelle
    turretSellRefund: 0.5,
    lootMultByAge: [1, 2, 5, 15, 40, 120, 360, 1080, 3240, 9720, 29160],   // multiplicateur de la récompense « Butin de guerre »
  },

  // XP cumulée nécessaire pour passer à l'âge suivant (index = âge actuel)
  // Réglé au simulateur pour que l'évolution tombe vers le 3e niveau de chaque âge (comme au premier âge).
  // Avec des seuils plus bas, le robot avait un âge d'avance presque toute la run puis s'écrasait au dernier âge.
  evolveXp: [5000, 25000, 84000, 257000, 777000, 2340000, 7020000, 21100000, 63300000, 190000000],

  // --- Les âges --------------------------------------------------------------
  // kind : 'melee' (reach = allonge) ou 'ranged' (range = portée)
  // Les distances se mesurent de bord à bord, en pixels logiques.
  // elite : 4e unité de l'âge, réservée au joueur, à débloquer au camp (prix : prestige.eliteCosts).
  //   Toutes frappent en zone : splash (mêlée, autour de la cible) ou projectile.splash
  //   (tireurs ; arc = tir en cloche, burn = part des dégâts infligée en brûlure sur 2 s).
  //   Repères : une élite coûte 1,8× le tireur de base (0,9× l'unité lourde pour les élites de mêlée),
  //   avec ≈ 20 % de PV et de dégâts PAR PIÈCE D'OR en plus que l'unité de base, sans compter la zone.
  //   (Une première version à 2,8× le prix rapportait deux fois moins de dégâts par pièce d'or : aucun effet au simulateur.)
  //
  // L'ordre suit l'histoire, des dinosaures à l'invasion extra-terrestre (11 âges) :
  // Jurassique → Pierre → Antiquité → Médiéval → Renaissance → Vapeur (la révolution industrielle)
  // → Moderne → Héros (notre époque) → Post-apo (l'effondrement) → Futur (la reconstruction high-tech)
  // → Alien (l'invasion).
  // Chaque âge garde son caractère, mais ses chiffres suivent sa PLACE dans la progression :
  // d'un âge au suivant, coût ×3, PV ×2,2, dégâts ×2 (chaque âge est plus rentable par pièce d'or),
  // et la portée des tireurs passe de 140 à 240. Pour changer l'ordre, il faut donc remettre
  // les chiffres à l'échelle de la nouvelle place (voir le GDD, §8).
  ages: [
    {
      id: 'jurassique',
      name: 'Âge jurassique',
      short: 'Jurassique',
      baseHp: 500,
      base: { look: 'volcano', height: 180 },
      palette: { skyTop: '#e8885a', skyBottom: '#f6d29a', hills: '#4f7a3a', hillsFar: '#6f9a52', ground: '#4a3a24', groundTop: '#5f7a34' },
      units: [
        { id: 'raptor', name: 'Raptor de guerre', kind: 'melee', cost: 17, hp: 64, dmg: 14, interval: 0.8, reach: 10, speed: 70, train: 1.5, w: 34, h: 40,
          look: { body: 'raptor' }, desc: 'Rapide et féroce' },
        { id: 'cracheur', name: 'Cracheur', kind: 'ranged', cost: 25, hp: 41, dmg: 13, interval: 1.2, range: 140, speed: 50, train: 1.6, w: 34, h: 44,
          look: { body: 'raptor', crest: true }, projectile: { look: 'venom', speed: 700 }, desc: 'Crache du venin' },
        { id: 'tricera', name: 'Tricératops', kind: 'melee', cost: 117, hp: 218, dmg: 33, interval: 1.3, reach: 16, speed: 44, train: 3.5, w: 66, h: 56,
          look: { body: 'trike' }, desc: 'Charge cornue' },
        { id: 'ankylosaure', name: 'Ankylosaure', kind: 'melee', elite: true, cost: 105, hp: 240, dmg: 38, interval: 1.4, reach: 14, splash: 45, speed: 36, train: 3.0, w: 62, h: 40,
          look: { body: 'ankylo' }, desc: 'Massue : frappe en zone' },
      ],
      turrets: [
        { id: 'lance-epines', name: 'Lance-épines', cost: 167, dmg: 3.4, interval: 0.2, range: 280, proj: 'spike', projSpeed: 1000, shape: 'spikes' },
        { id: 'canon-ambre', name: 'Canon à ambre', cost: 241, dmg: 38, interval: 1.6, range: 330, proj: 'amber', projSpeed: 800, shape: 'ambercannon' },
        { id: 'geyser', name: 'Geyser de lave', cost: 333, dmg: 22, interval: 1.8, range: 420, proj: 'lava', projSpeed: 420, splash: 80, arc: true,
          burn: { dps: 5.1, duration: 3 }, shape: 'geyser' },
      ],
      special: { id: 'meteores', name: 'Pluie de météores', cooldown: 40, count: 12, duration: 2.5, dmg: 62, radius: 60, look: 'meteor', speed: 1100,
        desc: 'Des météores s’écrasent sur les ennemis' },
      champion: { id: 'roi-tyran', name: 'Roi tyran', kind: 'melee', cost: 300, hp: 495, dmg: 33, interval: 1.2, reach: 22, speed: 40, train: 0, w: 84, h: 80,
        look: { body: 'trex', crown: true } },
    },
    {
      id: 'pierre',
      name: 'Âge de pierre',
      short: 'Pierre',
      baseHp: 1100,
      base: { look: 'cave', height: 120 },
      palette: { skyTop: '#f0b27a', skyBottom: '#fbe7c6', hills: '#c99a66', hillsFar: '#ddb98a', ground: '#8a6a3f', groundTop: '#a7834f' },
      units: [
        { id: 'cogneur', name: 'Cogneur', kind: 'melee', cost: 45, hp: 132, dmg: 28, interval: 1.0, reach: 8, speed: 50, train: 1.0, w: 24, h: 46,
          look: { body: 'human', weapon: 'club' }, desc: 'Mêlée bon marché' },
        { id: 'frondeur', name: 'Frondeur', kind: 'ranged', cost: 75, hp: 88, dmg: 18, interval: 1.1, range: 170, speed: 45, train: 1.2, w: 22, h: 44,
          look: { body: 'human', weapon: 'sling' }, projectile: { look: 'pebble', speed: 520 }, desc: 'Tire par-dessus les alliés' },
        { id: 'mammouth', name: 'Mammouth de guerre', kind: 'melee', cost: 300, hp: 484, dmg: 72, interval: 1.4, reach: 12, speed: 38, train: 3.0, w: 50, h: 58,
          look: { body: 'mammoth', weapon: 'spear' }, desc: 'Lourd, encaisse beaucoup' },
        { id: 'chaman', name: 'Chaman', kind: 'ranged', elite: true, cost: 135, hp: 194, dmg: 50, interval: 1.8, range: 200, speed: 40, train: 2.5, w: 24, h: 48,
          look: { body: 'human', weapon: 'staff', hat: 'horns' }, projectile: { look: 'pot-braises', speed: 380, arc: true, splash: 40 }, desc: 'Pots de braises en zone' },
        // Chaman réduit au simulateur : à 64 dégâts, portée 220 et zone 50, il faisait passer le robot
        // de 6 à 20 assauts sur 24 avec 2 âges (le boss du N10 ne tenait plus). Maintenant : 14 sur 24.
      ],
      turrets: [
        { id: 'lance-pierres', name: 'Lance-pierres', cost: 300, dmg: 26, interval: 0.75, range: 330, proj: 'pebble', projSpeed: 560 },
        { id: 'silex', name: 'Lanceur de silex', cost: 600, dmg: 11, interval: 0.28, range: 280, proj: 'flint', projSpeed: 620 },
        { id: 'catapulte', name: 'Catapulte à rochers', cost: 1350, dmg: 66, interval: 1.8, range: 420, proj: 'boulder', projSpeed: 380, splash: 45, arc: true },
      ],
      special: { id: 'eboulement', name: 'Éboulement', cooldown: 40, count: 14, duration: 3, dmg: 154, radius: 40, look: 'rock',
        desc: 'Des rochers tombent sur les ennemis' },
      champion: { id: 'chef-clan', name: 'Chef de clan', kind: 'melee', cost: 900, hp: 990, dmg: 60, interval: 1.2, reach: 12, speed: 40, train: 0, w: 34, h: 64,
        look: { body: 'human', weapon: 'club', crown: true } },
    },
    {
      // Antiquité : phalanges, chars et éléphants. Plus défensive que le Médiéval qui la suit :
      // ses fantassins encaissent, ses tireurs tirent vite mais faiblement.
      id: 'antiquite',
      name: 'Antiquité',
      to: 'à l’Antiquité',
      short: 'Antiquité',
      baseHp: 2400,
      base: { look: 'temple', height: 160 },
      palette: { skyTop: '#7fb6e8', skyBottom: '#f3ecd6', hills: '#a99a6a', hillsFar: '#c9bb8c', ground: '#8a7448', groundTop: '#a89058',
        sun: 'rgba(255,246,200,0.95)', acropolis: true },
      units: [
        { id: 'hoplite', name: 'Hoplite', kind: 'melee', cost: 150, hp: 360, dmg: 48, interval: 1.0, reach: 10, speed: 46, train: 1.5, w: 26, h: 48,
          look: { body: 'human', weapon: 'spearshield', hat: 'crested' }, desc: 'Bouclier et lance : encaisse' },
        { id: 'archer', name: 'Archer', kind: 'ranged', cost: 210, hp: 176, dmg: 30, interval: 0.9, range: 180, speed: 48, train: 1.4, w: 22, h: 46,
          look: { body: 'human', weapon: 'bow', hat: 'band' }, projectile: { look: 'arrow', speed: 650 }, desc: 'Tir rapide' },
        { id: 'char-guerre', name: 'Char de guerre', kind: 'melee', cost: 1000, hp: 900, dmg: 110, interval: 1.0, reach: 12, speed: 72, train: 3.0, w: 62, h: 56,
          look: { body: 'chariot' }, desc: 'Charge éclair, roues à faux' },
        { id: 'elephant', name: 'Éléphant de guerre', kind: 'melee', elite: true, cost: 950, hp: 1300, dmg: 120, interval: 1.5, reach: 14, splash: 50, speed: 34, train: 3.5, w: 64, h: 70,
          look: { body: 'elephant' }, desc: 'Piétine en zone, très résistant' },
      ],
      turrets: [
        { id: 'scorpion', name: 'Scorpion', cost: 1500, dmg: 20, interval: 0.25, range: 320, proj: 'dart', projSpeed: 900, shape: 'scorpion' },
        { id: 'miroir', name: 'Miroir ardent', cost: 2400, dmg: 170, interval: 1.6, range: 440, proj: 'sunbeam', projSpeed: 2000, shape: 'mirror' },
        { id: 'onagre', name: 'Onagre à jarres', cost: 3300, dmg: 130, interval: 2.0, range: 440, proj: 'jar', projSpeed: 380, splash: 60, arc: true, shape: 'onager' },
      ],
      // sweep : au lieu de tomber du ciel, les éléphants traversent la ligne de ton front au front ennemi,
      // touchent chaque ennemi une fois au passage et le repoussent de `knockback` pixels.
      special: { id: 'charge', name: 'Charge des éléphants', cooldown: 40, count: 4, duration: 2.4, dmg: 110, sweep: true, speed: 420, knockback: 26, look: 'elephant',
        desc: 'Des éléphants chargent toute la ligne ennemie' },
      champion: { id: 'imperator', name: 'Imperator', kind: 'melee', cost: 2700, hp: 2420, dmg: 120, interval: 1.2, reach: 14, speed: 55, train: 0, w: 70, h: 66,
        look: { body: 'chariot', crown: true } },
    },
    {
      id: 'medieval',
      name: 'Âge médiéval',
      short: 'Médiéval',
      baseHp: 5200,
      base: { look: 'castle', height: 170 },
      palette: { skyTop: '#8fb4d6', skyBottom: '#e3edf4', hills: '#7f9a6f', hillsFar: '#a9bd9b', ground: '#5d6c44', groundTop: '#768a56' },
      units: [
        { id: 'fantassin', name: 'Fantassin', kind: 'melee', cost: 450, hp: 678, dmg: 112, interval: 1.0, reach: 8, speed: 52, train: 1.5, w: 26, h: 48,
          look: { body: 'human', weapon: 'sword', helmet: true }, desc: 'Mêlée solide' },
        { id: 'arbaletrier', name: 'Arbalétrier', kind: 'ranged', cost: 675, hp: 436, dmg: 88, interval: 1.4, range: 190, speed: 45, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'crossbow', helmet: true }, projectile: { look: 'bolt', speed: 640 }, desc: 'Longue portée' },
        { id: 'chevalier', name: 'Chevalier', kind: 'melee', cost: 3150, hp: 2330, dmg: 240, interval: 1.2, reach: 12, speed: 60, train: 3.0, w: 52, h: 64,
          look: { body: 'horse', weapon: 'lance', helmet: true }, desc: 'Charge lourde' },
        { id: 'mangonneau', name: 'Mangonneau', kind: 'ranged', elite: true, cost: 1200, hp: 959, dmg: 244, interval: 1.8, range: 250, speed: 30, train: 3.0, w: 56, h: 46,
          look: { body: 'siege' }, projectile: { look: 'pierre-mangonneau', speed: 380, arc: true, splash: 55 }, desc: 'Engin de siège, tir en zone' },
      ],
      turrets: [
        { id: 'baliste', name: 'Baliste', cost: 4500, dmg: 218, interval: 1.2, range: 400, proj: 'bolt', projSpeed: 700 },
        { id: 'catapulte-feu', name: 'Catapulte enflammée', cost: 6750, dmg: 242, interval: 1.8, range: 420, proj: 'poix', shape: 'fireball', projSpeed: 380, splash: 55, arc: true,
          burn: { dps: 48, duration: 3 } },
        { id: 'huile', name: "Chaudron d'huile", cost: 9000, dmg: 88, interval: 0.5, range: 120, proj: 'oil', projSpeed: 300, splash: 70, arc: true },
      ],
      special: { id: 'volee', name: 'Volée de flèches', cooldown: 40, count: 45, duration: 3, dmg: 194, radius: 22, look: 'arrow',
        desc: 'Une pluie de flèches s’abat sur les ennemis' },
      champion: { id: 'seigneur', name: 'Seigneur de guerre', kind: 'melee', cost: 8100, hp: 5320, dmg: 240, interval: 1.2, reach: 14, speed: 55, train: 0, w: 58, h: 74,
        look: { body: 'horse', weapon: 'sword', helmet: true, crown: true } },
    },
    {
      id: 'renaissance',
      name: 'Renaissance',
      to: 'à la Renaissance',
      short: 'Renaissance',
      baseHp: 11000,
      base: { look: 'fort', height: 160 },
      palette: { skyTop: '#e7a98c', skyBottom: '#f7e4cc', hills: '#8f9a68', hillsFar: '#b6bf92', ground: '#6d6141', groundTop: '#887b52' },
      units: [
        { id: 'bretteur', name: 'Bretteur', kind: 'melee', cost: 1350, hp: 1500, dmg: 224, interval: 0.9, reach: 8, speed: 55, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'rapier', hat: 'feather' }, desc: 'Mêlée rapide' },
        { id: 'arquebusier', name: 'Arquebusier', kind: 'ranged', cost: 2020, hp: 968, dmg: 200, interval: 1.6, range: 210, speed: 45, train: 1.6, w: 24, h: 46,
          look: { body: 'human', weapon: 'musket', helmet: true }, projectile: { look: 'bullet', speed: 900 }, desc: 'Tir puissant, recharge lente' },
        { id: 'cuirassier', name: 'Cuirassier', kind: 'melee', cost: 9450, hp: 5130, dmg: 520, interval: 1.2, reach: 12, speed: 62, train: 3.0, w: 52, h: 64,
          look: { body: 'horse', weapon: 'saber', helmet: true }, desc: 'Cavalerie cuirassée' },
        { id: 'grenadier', name: 'Grenadier', kind: 'ranged', elite: true, cost: 3600, hp: 2130, dmg: 486, interval: 1.8, range: 250, speed: 42, train: 2.5, w: 24, h: 50,
          look: { body: 'human', weapon: 'grenade', hat: 'bearskin' }, projectile: { look: 'mortar', speed: 420, arc: true, splash: 50 }, desc: 'Grenades en zone' },
      ],
      turrets: [
        { id: 'fauconneau', name: 'Fauconneau', cost: 13500, dmg: 484, interval: 1.2, range: 420, proj: 'cannonball', projSpeed: 650, shape: 'falconet' },
        { id: 'mortier', name: 'Mortier', cost: 19800, dmg: 532, interval: 2.0, range: 450, proj: 'mortar', projSpeed: 360, splash: 60, arc: true, shape: 'mortar' },
        { id: 'orgue', name: 'Orgue à salves', cost: 27000, dmg: 165, interval: 0.22, range: 300, proj: 'bullet', projSpeed: 900, shape: 'volleygun' },
      ],
      special: { id: 'bombardement', name: 'Bombardement', cooldown: 40, count: 16, duration: 3, dmg: 1450, radius: 45, look: 'cannonball', speed: 800,
        desc: 'Des boulets de canon pleuvent sur les ennemis' },
      champion: { id: 'condottiere', name: 'Condottiere', kind: 'melee', cost: 24300, hp: 11600, dmg: 520, interval: 1.2, reach: 14, speed: 55, train: 0, w: 58, h: 74,
        look: { body: 'horse', weapon: 'saber', helmet: true, crown: true } },
    },
    {
      // Âge de la vapeur : chaudières, rivets et automates. Unités lentes et solides,
      // tourelles à fort débit ; le pouvoir est un tapis de bombes lâché par un dirigeable.
      id: 'vapeur',
      name: 'Âge de la vapeur',
      to: 'à l’âge de la vapeur',
      short: 'Vapeur',
      baseHp: 24200,
      base: { look: 'factory', height: 170 },
      palette: { skyTop: '#a08a78', skyBottom: '#e6d3b8', hills: '#6e5a4a', hillsFar: '#94806c', ground: '#4a3e34', groundTop: '#5e4c3e',
        sun: 'rgba(255,220,180,0.5)', clouds: 'rgba(110,100,95,0.5)', smoke: true },
      units: [
        { id: 'mecano', name: 'Mécano', kind: 'melee', cost: 4050, hp: 3700, dmg: 480, interval: 1.0, reach: 10, speed: 48, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'wrench', hat: 'flatcap' }, desc: 'Clé à molette géante' },
        { id: 'fusilier-vapeur', name: 'Fusilier à vapeur', kind: 'ranged', cost: 6000, hp: 2300, dmg: 520, interval: 1.5, range: 220, speed: 44, train: 1.6, w: 24, h: 48,
          look: { body: 'human', weapon: 'airgun', hat: 'tophat' }, projectile: { look: 'rivet', speed: 900 }, desc: 'Tire des rivets brûlants' },
        { id: 'automate', name: 'Automate à vapeur', kind: 'melee', cost: 28400, hp: 13500, dmg: 1000, interval: 1.5, reach: 16, speed: 34, train: 3.5, w: 46, h: 76,
          look: { body: 'automaton' }, desc: 'Géant de laiton, très résistant' },
        { id: 'araignee', name: 'Araignée mécanique', kind: 'ranged', elite: true, cost: 10800, hp: 5060, dmg: 1350, interval: 1.8, range: 260, speed: 46, train: 2.5, w: 50, h: 44,
          look: { body: 'spider' }, projectile: { look: 'steambomb', speed: 420, arc: true, splash: 55 }, desc: 'Mortier sur pattes, tir en zone' },
      ],
      turrets: [
        { id: 'manivelle', name: 'Mitrailleuse à manivelle', cost: 40500, dmg: 200, interval: 0.22, range: 400, proj: 'bullet', projSpeed: 1000, shape: 'gatling' },
        { id: 'canon-vapeur', name: 'Canon à vapeur', cost: 58500, dmg: 2000, interval: 1.7, range: 470, proj: 'cannonball', projSpeed: 800, shape: 'steamcannon' },
        { id: 'mortier-chaudieres', name: 'Mortier à chaudières', cost: 81000, dmg: 1300, interval: 1.9, range: 480, proj: 'boiler', projSpeed: 400, splash: 75, arc: true,
          burn: { dps: 300, duration: 3 }, shape: 'boilermortar' },
      ],
      // carpet : un dirigeable traverse le champ de bataille et lâche ses bombes le long de sa route,
      // régulièrement espacées (toute la ligne est couverte, au lieu de viser les ennemis).
      special: { id: 'dirigeable', name: 'Raid de dirigeable', cooldown: 40, count: 16, duration: 2.6, dmg: 2900, radius: 55, look: 'steambomb', speed: 600, carpet: true,
        desc: 'Un dirigeable bombarde toute la ligne' },
      champion: { id: 'colosse-fonte', name: 'Colosse de fonte', kind: 'melee', cost: 72900, hp: 25500, dmg: 1040, interval: 1.3, reach: 18, speed: 34, train: 0, w: 56, h: 96,
        look: { body: 'automaton', crown: true } },
    },
    {
      id: 'moderne',
      name: 'Âge moderne',
      short: 'Moderne',
      baseHp: 53200,
      base: { look: 'bunker', height: 130 },
      palette: { skyTop: '#93a1ab', skyBottom: '#d8dcdf', hills: '#6c7a5c', hillsFar: '#97a289', ground: '#4f4a3b', groundTop: '#665f4a',
        sun: 'rgba(255,240,210,0.5)', clouds: 'rgba(120,120,118,0.45)' },
      units: [
        { id: 'sapeur', name: 'Sapeur', kind: 'melee', cost: 12200, hp: 7260, dmg: 896, interval: 0.9, reach: 10, speed: 58, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'bayonet', hat: 'modern' }, desc: 'Fusil à baïonnette' },
        { id: 'tireur', name: 'Tireur d’élite', kind: 'ranged', cost: 18300, hp: 4690, dmg: 800, interval: 1.4, range: 230, speed: 48, train: 1.6, w: 24, h: 46,
          look: { body: 'human', weapon: 'rifle', hat: 'modern' }, projectile: { look: 'bullet', speed: 1000 }, desc: 'Très longue portée' },
        { id: 'char', name: 'Char d’assaut', kind: 'melee', cost: 85000, hp: 24800, dmg: 2080, interval: 1.5, reach: 30, speed: 45, train: 3.5, w: 64, h: 44,
          look: { body: 'tank' }, desc: 'Blindé, canon court' },
        { id: 'lance-flammes', name: 'Lance-flammes', kind: 'ranged', elite: true, cost: 32400, hp: 14000, dmg: 700, interval: 0.9, range: 110, speed: 46, train: 2.5, w: 26, h: 46,
          look: { body: 'human', weapon: 'flamer', hat: 'modern' }, projectile: { look: 'flame', speed: 650, splash: 40, burn: 0.6 }, desc: 'Courte portée, brûle en zone' },
      ],
      turrets: [
        { id: 'mitrailleuse', name: 'Mitrailleuse', cost: 122000, dmg: 479, interval: 0.25, range: 380, proj: 'bullet', projSpeed: 1100, shape: 'mg' },
        { id: 'antichar', name: 'Canon antichar', cost: 176000, dmg: 4470, interval: 1.8, range: 460, proj: 'shell', projSpeed: 900, shape: 'atgun' },
        { id: 'roquettes', name: 'Lance-roquettes', cost: 243000, dmg: 3190, interval: 1.8, range: 480, proj: 'rocket', projSpeed: 420, splash: 70, arc: true, shape: 'rocketpod' },
      ],
      special: { id: 'frappe-aerienne', name: 'Frappe aérienne', cooldown: 40, count: 14, duration: 2.5, dmg: 6920, radius: 55, look: 'bomb', speed: 700,
        desc: 'Des bombes s’abattent sur les ennemis' },
      champion: { id: 'commandant', name: 'Char du commandant', kind: 'melee', cost: 219000, hp: 56600, dmg: 2080, interval: 1.4, reach: 32, speed: 42, train: 0, w: 76, h: 52,
        look: { body: 'tank', crown: true } },
    },
    {
      id: 'heros',
      name: 'Âge des super-héros',
      short: 'Héros',
      baseHp: 117000,
      base: { look: 'herotower', height: 200 },
      palette: { skyTop: '#3d8be0', skyBottom: '#bfe3ff', hills: '#5a6f8a', hillsFar: '#8196b0', ground: '#4c4f5a', groundTop: '#6b6f7c', city: true },
      units: [
        { id: 'justicier', name: 'Justicier', kind: 'melee', cost: 36400, hp: 16000, dmg: 1790, interval: 0.8, reach: 8, speed: 68, train: 1.5, w: 24, h: 48,
          look: { body: 'human', weapon: 'fist', hat: 'mask', cape: true }, desc: 'Poings d’acier' },
        { id: 'foudroyeur', name: 'Foudroyeur', kind: 'ranged', cost: 54000, hp: 10300, dmg: 1600, interval: 1.2, range: 230, speed: 52, train: 1.6, w: 24, h: 48,
          look: { body: 'human', weapon: 'spark', hat: 'mask', cape: true }, projectile: { look: 'lightning', speed: 1400 }, desc: 'Lance la foudre' },
        { id: 'colosse', name: 'Colosse', kind: 'melee', cost: 256000, hp: 54200, dmg: 4160, interval: 1.3, reach: 14, speed: 46, train: 3.5, w: 44, h: 74,
          look: { body: 'human', weapon: 'fist', hat: 'mask', cape: true }, desc: 'Force surhumaine' },
        { id: 'sismique', name: 'Sismique', kind: 'melee', elite: true, cost: 230000, hp: 59500, dmg: 4840, interval: 1.4, reach: 12, splash: 55, speed: 50, train: 3.0, w: 34, h: 60,
          look: { body: 'human', weapon: 'gauntlet', hat: 'mask', cape: true }, desc: 'Onde de choc en zone' },
      ],
      turrets: [
        { id: 'lance-etoiles', name: 'Lance-étoiles', cost: 364000, dmg: 852, interval: 0.2, range: 420, proj: 'star', projSpeed: 1000, shape: 'starthrower' },
        { id: 'canon-sonique', name: 'Canon sonique', cost: 526000, dmg: 9580, interval: 1.6, range: 480, proj: 'sonic', projSpeed: 900, shape: 'sonic' },
        { id: 'tour-tesla', name: 'Tour Tesla', cost: 729000, dmg: 5520, interval: 1.8, range: 460, proj: 'lightning', projSpeed: 1600, splash: 80,
          burn: { dps: 1280, duration: 3 }, shape: 'tesla' },
      ],
      special: { id: 'poings', name: 'Poings célestes', cooldown: 40, count: 12, duration: 2.5, dmg: 15400, radius: 60, look: 'fist', speed: 1300,
        desc: 'Des poings géants s’abattent sur les ennemis' },
      champion: { id: 'capitaine', name: 'Capitaine Invincible', kind: 'melee', cost: 656000, hp: 123000, dmg: 4160, interval: 1.1, reach: 16, speed: 50, train: 0, w: 50, h: 90,
        look: { body: 'human', weapon: 'fist', hat: 'mask', cape: true, crown: true } },
    },
    {
      id: 'postapo',
      name: 'Âge post-apocalyptique',
      short: 'Post-apo',
      baseHp: 257000,
      base: { look: 'scrapyard', height: 150 },
      palette: { skyTop: '#b58a52', skyBottom: '#ead1a0', hills: '#8a7350', hillsFar: '#a88f68', ground: '#6a5536', groundTop: '#836a44',
        sun: 'rgba(255,220,150,0.6)', clouds: 'rgba(160,130,90,0.4)' },
      units: [
        { id: 'pillard', name: 'Pillard', kind: 'melee', cost: 109000, hp: 35100, dmg: 3580, interval: 0.8, reach: 10, speed: 62, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'chainsaw', hat: 'mohawk' }, desc: 'Tronçonneuse' },
        { id: 'ferrailleur', name: 'Ferrailleur', kind: 'ranged', cost: 162000, hp: 22700, dmg: 3200, interval: 1.2, range: 230, speed: 50, train: 1.6, w: 24, h: 46,
          look: { body: 'human', weapon: 'shotgun', hat: 'gasmask' }, projectile: { look: 'bullet', speed: 1000 }, desc: 'Fusil de récupération' },
        { id: 'camion', name: 'Camion de guerre', kind: 'melee', cost: 765000, hp: 120000, dmg: 8320, interval: 1.4, reach: 24, speed: 50, train: 3.5, w: 72, h: 50,
          look: { body: 'warrig' }, desc: 'Pare-chocs à pointes' },
        { id: 'artificier', name: 'Artificier', kind: 'ranged', elite: true, cost: 288000, hp: 49900, dmg: 10400, interval: 1.8, range: 270, speed: 42, train: 2.5, w: 26, h: 46,
          look: { body: 'human', weapon: 'launcher', hat: 'goggles' }, projectile: { look: 'rocket', speed: 450, arc: true, splash: 55 }, desc: 'Roquettes bricolées en zone' },
      ],
      turrets: [
        { id: 'tourelle-ferraille', name: 'Tourelle de ferraille', cost: 1090000, dmg: 1870, interval: 0.2, range: 420, proj: 'bullet', projSpeed: 1100, shape: 'scrapgun' },
        { id: 'harpon', name: 'Lance-harpon', cost: 1580000, dmg: 21100, interval: 1.6, range: 480, proj: 'harpoon', projSpeed: 800, shape: 'harpoon' },
        { id: 'catapulte-bidons', name: 'Catapulte à bidons', cost: 2190000, dmg: 12200, interval: 1.8, range: 480, proj: 'barrel', projSpeed: 420, splash: 80, arc: true,
          burn: { dps: 2810, duration: 3 }, shape: 'barrelcat' },
      ],
      special: { id: 'bidons', name: 'Bidons explosifs', cooldown: 40, count: 12, duration: 2.5, dmg: 34000, radius: 60, look: 'barrel', speed: 900,
        desc: 'Des bidons explosifs tombent sur les ennemis' },
      champion: { id: 'seigneur-ruines', name: 'Seigneur des ruines', kind: 'melee', cost: 1970000, hp: 272000, dmg: 8320, interval: 1.3, reach: 26, speed: 44, train: 0, w: 88, h: 60,
        look: { body: 'warrig', crown: true } },
    },
    {
      id: 'futur',
      name: 'Âge futur',
      short: 'Futur',
      baseHp: 566000,
      base: { look: 'dome', height: 190 },
      palette: { skyTop: '#1b2140', skyBottom: '#4a5890', hills: '#2b3257', hillsFar: '#3b4471', ground: '#22253a', groundTop: '#39497a',
        night: true, clouds: 'rgba(170,180,230,0.12)' },
      units: [
        { id: 'gardien', name: 'Gardien', kind: 'melee', cost: 328000, hp: 77400, dmg: 7160, interval: 0.8, reach: 10, speed: 62, train: 1.5, w: 24, h: 46,
          look: { body: 'human', weapon: 'energyblade', hat: 'visor' }, desc: 'Lame d’énergie' },
        { id: 'fusilier-laser', name: 'Fusilier laser', kind: 'ranged', cost: 486000, hp: 49900, dmg: 6400, interval: 1.2, range: 240, speed: 50, train: 1.6, w: 24, h: 46,
          look: { body: 'human', weapon: 'laserrifle', hat: 'visor' }, projectile: { look: 'laser', speed: 1600 }, desc: 'Rayon laser' },
        { id: 'marcheur', name: 'Marcheur de combat', kind: 'melee', cost: 2300000, hp: 263000, dmg: 16600, interval: 1.3, reach: 18, speed: 44, train: 3.5, w: 60, h: 76,
          look: { body: 'mech' }, desc: 'Robot géant' },
        { id: 'drone', name: 'Drone d’assaut', kind: 'ranged', elite: true, cost: 873000, hp: 110000, dmg: 20700, interval: 1.8, range: 280, speed: 55, train: 2.5, w: 40, h: 50,
          look: { body: 'drone' }, projectile: { look: 'plasma', speed: 450, arc: true, splash: 55 }, desc: 'Bombes à plasma en zone' },
      ],
      turrets: [
        { id: 'tourelle-laser', name: 'Tourelle laser', cost: 3280000, dmg: 4120, interval: 0.2, range: 420, proj: 'laser', projSpeed: 1800, shape: 'laserturret' },
        { id: 'canon-ions', name: 'Canon à ions', cost: 4740000, dmg: 46400, interval: 1.6, range: 480, proj: 'ion', projSpeed: 900, shape: 'ioncannon' },
        { id: 'lance-plasma', name: 'Lance-plasma', cost: 6560000, dmg: 26800, interval: 1.8, range: 480, proj: 'plasma', projSpeed: 420, splash: 80, arc: true,
          burn: { dps: 6200, duration: 3 }, shape: 'plasmalauncher' },
      ],
      special: { id: 'frappe-orbitale', name: 'Frappe orbitale', cooldown: 40, count: 12, duration: 2.5, dmg: 74500, radius: 60, look: 'beam', speed: 2400,
        desc: 'Des rayons tombent de l’espace' },
      champion: { id: 'titan', name: 'Titan', kind: 'melee', cost: 5900000, hp: 600000, dmg: 16600, interval: 1.2, reach: 20, speed: 40, train: 0, w: 72, h: 92,
        look: { body: 'mech', crown: true } },
    },
    {
      id: 'alien',
      name: 'Âge extra-terrestre',
      to: 'à l’âge extra-terrestre',
      short: 'Alien',
      baseHp: 1245000,
      base: { look: 'hive', height: 190 },
      palette: { skyTop: '#1a0b26', skyBottom: '#5a2a6e', hills: '#3a1f4a', hillsFar: '#4a2a5e', ground: '#241a30', groundTop: '#4f2f6a',
        night: true, planet: '#6fe08a', clouds: 'rgba(200,140,230,0.12)' },
      units: [
        { id: 'rodeur', name: 'Rôdeur', kind: 'melee', cost: 984000, hp: 170000, dmg: 14300, interval: 0.8, reach: 10, speed: 70, train: 1.5, w: 26, h: 48,
          look: { body: 'alien', weapon: 'claw' }, desc: 'Griffes acérées' },
        { id: 'tireur-gris', name: 'Tireur gris', kind: 'ranged', cost: 1460000, hp: 110000, dmg: 12800, interval: 1.2, range: 240, speed: 52, train: 1.6, w: 26, h: 48,
          look: { body: 'alien', weapon: 'raygun' }, projectile: { look: 'ray', speed: 1300 }, desc: 'Pistolet à rayons' },
        { id: 'tripode', name: 'Tripode', kind: 'melee', cost: 6890000, hp: 578000, dmg: 33300, interval: 1.3, reach: 20, speed: 42, train: 3.5, w: 60, h: 84,
          look: { body: 'tripod' }, desc: 'Machine de guerre' },
        { id: 'psion', name: 'Psion', kind: 'ranged', elite: true, cost: 2610000, hp: 242000, dmg: 41500, interval: 1.8, range: 280, speed: 44, train: 2.5, w: 28, h: 54,
          look: { body: 'alien', weapon: 'orb', bighead: true }, projectile: { look: 'psi', speed: 700, splash: 60 }, desc: 'Onde psychique en zone' },
      ],
      turrets: [
        { id: 'tourelle-rayons', name: 'Tourelle à rayons', cost: 9840000, dmg: 9070, interval: 0.2, range: 420, proj: 'ray', projSpeed: 1300, shape: 'rayturret' },
        { id: 'canon-antimatiere', name: 'Canon à antimatière', cost: 14200000, dmg: 102000, interval: 1.6, range: 480, proj: 'antimatter', projSpeed: 900, shape: 'antimatter' },
        { id: 'cracheur-spores', name: 'Cracheur de spores', cost: 19700000, dmg: 59000, interval: 1.8, range: 480, proj: 'spore', projSpeed: 420, splash: 80, arc: true,
          burn: { dps: 13600, duration: 3 }, shape: 'sporepod' },
      ],
      special: { id: 'abduction', name: 'Rayons d’abduction', cooldown: 40, count: 12, duration: 2.5, dmg: 164000, radius: 60, look: 'saucer', speed: 1600,
        desc: 'Des soucoupes foudroient les ennemis' },
      champion: { id: 'tripode-imperial', name: 'Tripode impérial', kind: 'melee', cost: 17700000, hp: 1320000, dmg: 33300, interval: 1.2, reach: 22, speed: 38, train: 0, w: 72, h: 100,
        look: { body: 'tripod', crown: true } },
    },
  ],

  // --- Difficultés (11/11) ---------------------------------------------------
  // Deux campagnes séparées : chacune a sa propre sauvegarde (prestige, âges, améliorations, records).
  //   rush            : la ruée d'ouverture (levels.rush) est-elle active ?
  //   enemyStat       : PV et dégâts de tous les ennemis × ce facteur (unités, champions, tourelles, vagues de l'assaut)
  //   enemyStatPerAge : supplément ajouté à enemyStat pour chaque âge ennemi (Jurassique +0, Pierre +1 fois, … Alien +10 fois)
  //   repair          : réparation de la base entre deux niveaux (part des PV max)
  // Réglage du mode difficile, mesuré au simulateur (outils/simulation.js) :
  //   - un simple +15 % ne sert à rien : dès la 2e run, les améliorations de prestige l'effacent et la campagne
  //     dure autant qu'en facile (environ 16 h de jeu pour tout débloquer avec le robot « fonce + tourelles ») ;
  //   - il faut donc un supplément PAR ÂGE, qui suit le plafond des améliorations. Seuils mesurés, améliorations
  //     au plafond et sans élites, où les robots ne passent plus qu'une fois sur deux environ :
  //     ×1,5-1,6 avec 2 âges · ×2,05 avec 4 âges · ×2,55 avec 7 âges · ×2,9-3,0 avec 11 âges ;
  //   - 1,3 + 0,2 par âge reste juste sous ces seuils au début et les atteint à la fin (les élites compensent).
  // À vérifier après tout changement : PA.Sim.tension(5, {}, 2, 'difficile') et
  // new PA.Sim.Campagne('fonce + tourelles', 'ages', 150, { difficulte: 'difficile' }).
  difficulties: {
    facile: { name: 'Facile', desc: 'Les ennemis restent à distance : idéal pour découvrir le jeu.',
      rush: false, enemyStat: 1, enemyStatPerAge: 0, repair: 0.30 },
    // Correctif (21/11, simulateur, campagnes depuis une sauvegarde vierge) : à ×1,3 dès le Jurassique et ruée
    // dès le niveau 2, le robot perdait aux niveaux 1-2 pendant 57 parties. Avec ×1,0 au départ (+0,23 par âge,
    // l'Alien reste à ×3,3) et la ruée à partir du niveau 6 : tout débloqué en 65 parties, 46 h (×2,1 le facile).
    difficile: { name: 'Difficile', desc: 'Ruée ennemie dès l’âge de pierre, ennemis bien plus forts d’âge en âge, base moins réparée : chaque erreur se paie.',
      rush: true, rushFrom: 6, enemyStat: 1.0, enemyStatPerAge: 0.23, repair: 0.15 },
  },

  // --- Niveaux (5 par âge ; les ennemis appartiennent à l'âge du bloc) -----
  levels: {
    perAge: 5,
    // Une ligne par âge, une valeur par niveau du bloc (niveau 1 → 5)
    // Réglages ajustés au simulateur (outils/simulation.js) : un robot simple
    // finit chaque niveau en 1 à 4 min et atteint l'assaut final.
    enemyBaseHp: [
      [350, 450, 550, 650, 900],          // Jurassique
      [1000, 1200, 1400, 1600, 1700],     // Pierre
      [2200, 2600, 3000, 3400, 3700],     // Antiquité
      [4800, 5600, 6400, 7200, 8000],     // Médiéval
      [10500, 12000, 13500, 15000, 16500], // Renaissance
      [23000, 26000, 30000, 33000, 36000], // Vapeur
      [51000, 58000, 65000, 73000, 80000], // Moderne
      [112000, 128000, 144000, 160000, 176000], // Héros
      [246000, 281000, 316000, 351000, 387000], // Post-apo
      [541000, 618000, 695000, 772000, 851000], // Futur
      [1190000, 1360000, 1530000, 1700000, 1870000], // Alien
    ],
    enemyIncome: [                        // or par seconde de l'IA
      [3.5, 4, 4.5, 5, 5.5],
      // 2e âge : l'âge de pierre remis à l'échelle est moins menaçant que l'ancien Médiéval
      // (mammouths lents, frondes) ; +30 % environ pour garder la même difficulté au simulateur.
      [12, 13.5, 15, 16, 17],
      [27, 29, 31, 33, 35],
      [80, 86, 92, 98, 104],
      [240, 258, 276, 294, 312],
      [720, 774, 828, 882, 936],
      [2160, 2322, 2484, 2646, 2808],
      [6480, 6966, 7452, 7938, 8424],
      [19440, 20898, 22356, 23814, 25272],
      [58320, 62694, 67068, 71442, 75816],
      [174960, 188082, 201204, 214326, 227448],
    ],
    enemyStartGold: [60, 200, 600, 1800, 5400, 16200, 48600, 145800, 437400, 1312200, 3936600],
    // PV ET dégâts des ennemis : la puissance réelle monte à peu près au carré (1,16² ≈ 1,35)
    statMult: [1, 1.04, 1.08, 1.12, 1.16],
    // Au premier âge, les deux camps ont les mêmes unités (pas encore d'évolution) : +8 % suffisait à gagner
    // chaque duel, et le N3 tuait la plupart des premières runs (simulateur, 24/11). Courbe plus douce ;
    // le boss du N10 reste le mur de la première run, et le boss du N5 reste dur sans évoluer.
    statMultPremierAge: [1, 1, 1.02, 1.04, 1.06],
    // index des tourelles ennemies, par âge puis par niveau
    enemyTurrets: [
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
      [[], [], [0], [0], [0]],
    ],
    enemyTurretDmg: 0.5,       // dégâts des tourelles ennemies (× multiplicateur du niveau) ; à 1, les niveaux s'enlisent
    enemyTurretRange: 1,       // portée des tourelles ennemies
    bossLevel: 5,              // le 5e niveau de chaque âge envoie un champion
    championFirst: 40,         // secondes avant le premier champion
    championEvery: 45,
    // Anti-farm : quand un niveau traîne, l'ennemi reçoit des renforts (esprit « chrono de Megabonk »).
    // Seuil tardif + montée brutale : un joueur normal finit avant, un farmeur se fait balayer.
    // Mesuré au simulateur : à 3-5 min, les runs normales s'effondraient (≈ 0-15 % d'assauts atteints) ;
    // à 6 min, l'écart avec « sans renforts » reste dans le bruit, et un farm à 4 tourelles tombe en 6 à 11 min.
    reinforcements: {
      startAfter: 360,         // secondes avant le 1er palier
      every: 30,               // secondes entre deux paliers
      statPerStep: 0.20,       // +20 % de PV et de dégâts par palier (unités, champions, tourelles ennemies)
      incomePerStep: 0.10,     // +10 % d'or par seconde pour l'IA par palier
      warnBefore: 60,          // compte à rebours affiché avant le 1er palier
    },
    // Ruée d'ouverture (11/11) : au début de chaque niveau, sauf le tout premier de la run, les premières
    // unités ennemies sont « enragées » : plus rapides et plus solides, elles viennent se battre devant
    // ta base au lieu du milieu du terrain. Elles sont gratuites pour l'IA et rapportent autant que les autres.
    // Pourquoi pas simplement plus d'or ou plus d'unités pour l'IA : mesuré au simulateur (PA.Sim.tension),
    // même +70 % d'or ou 14 unités de plus ne changent rien, elles meurent une à une au milieu du terrain.
    // Très sensible : à stat 3 presque toutes les runs meurent aux niveaux 2-3 ; à 1,5 la base n'est jamais approchée.
    rush: {
      units: [3, 3, 4, 4, 5],   // nombre d'unités enragées, par niveau du bloc
      pattern: [0, 0, 1],       // lesquelles : unité 1, unité 1, unité 2, et on recommence
      stat: 1.8,                // PV et dégâts × ce facteur (en plus du multiplicateur du niveau)
      speed: 2,                 // vitesse de déplacement × ce facteur
    },
    maxEnemyUnits: 14,
    unitWeights: [0.5, 0.35, 0.15],   // probabilité de choisir l'unité 1, 2 ou 3
    heavyAfter: 20,                    // l'IA n'envoie pas d'unité lourde avant X secondes
  },

  // --- Combat final : assaut infini, variante B ----------------------------
  assault: {
    windowEvery: 5,            // fenêtre de retraite toutes les X vagues
    baseCount: 4,              // unités dans la vague 1
    countPerWave: 1,           // unités supplémentaires par vague
    startStatMult: 1.35,
    statGrowth: 0.10,          // +10 % de PV et de dégâts par vague
    spawnInterval: 1.1,
    pauseBetweenWaves: 3,
    multiplierStep: 0.5,       // ×1 (vagues 1-5), ×1,5 (6-10), ×2 (11-15)…
    ppPerCost: 1 / 25,         // cagnotte gagnée par kill = coût × ce facteur × multiplicateur
  },

  // --- Prestige ---------------------------------------------------------------
  prestige: {
    ppPerKillCost: 1 / 50,     // points gagnés par kill pendant un niveau = coût × ce facteur
    // Anti-farm : dans un niveau, les kills rapportent au plus killPPCap × le prestige de base
    // du niveau (levelBase + levelPerIndex × n). Sans plafond, le N10 rapportait ~260 ✦ de kills.
    killPPCap: 1,
    levelBase: 8,              // points pour un niveau terminé = levelBase + levelPerIndex × n° du niveau
    levelPerIndex: 2,
    speedBonusMax: 0.5,        // +50 % si le niveau est fini en moins de speedFast secondes
    speedFast: 75,
    speedSlow: 180,            // aucun bonus au-delà
    outsiderPerAge: 0.5,       // +50 % par âge de retard sur les ennemis
    lossBase: 0.5,             // part perdue de ce qui n'est pas à l'abri en cas de défaite
    // Débloquer un âge s'ACHÈTE au camp avec les points de prestige, dans l'ordre (0 = débloqué d'office).
    // Avant : déblocage automatique selon le total gagné, jugé trop rapide (Renaissance en une run).
    // Au simulateur (campagne complète), une run rapporte ≈ 1 000 ✦ à 2 âges, 2 600 à 3, 4 000 à 4,
    // 8 000 à 5, 10 500 à 6, 14 000 à 7 et 19 000 à 8. Le Moderne (5e âge) coûtait 15 000 : c'était
    // le palier le plus long (9 runs, plus de 4 h). Ramené à 10 000.
    // Passage à 11 âges (Antiquité et Vapeur ajoutées) : prix répartis sur 9 achats au lieu de 7.
    ageCosts: [0, 0, 1000, 2500, 5000, 9000, 15000, 25000, 40000, 60000, 90000],
    // Plafond des améliorations : niveau max achetable selon le nombre d'âges débloqués
    // (case n = n âges débloqués) : 3 avec les 2 âges de départ, 10 avec les 11.
    // Les améliorations restent à acheter jusqu'à la fin, au lieu d'être toutes au max aux deux tiers.
    upgradeCapByAges: [3, 3, 3, 4, 5, 6, 6, 7, 8, 8, 9, 10],
    // Unité d'élite (4e unité de chaque âge, réservée au joueur) : s'achète au camp, une fois l'âge débloqué.
    // Prix ≈ ce que rapporte une run au moment où l'âge s'ouvre. L'IA ennemie n'en a pas.
    // L'Ankylosaure est moins cher : on quitte vite le Jurassique, il sert peu longtemps.
    eliteCosts: [300, 800, 1500, 2500, 4000, 6000, 8000, 10000, 14000, 18000, 25000],
    // Prix d'un pouvoir ultime à acheter (origine, frappe, renfort), par âge : la moitié du prix de l'élite.
    powerCosts: [150, 400, 750, 1250, 2000, 3000, 4000, 5000, 7000, 9000, 12500],
    // Vitesses de jeu : ×2 puis ×3, achetées dans l'ordre. Le temps de jeu ne change pas
    // (bonus de rapidité compris) : seul le temps réel passé devant l'écran baisse.
    speedCosts: [250, 2500],
    ageNames: ['Jurassique', 'Pierre', 'Antiquité', 'Médiéval', 'Renaissance', 'Vapeur', 'Moderne', 'Héros', 'Post-apo', 'Futur', 'Alien'],
    // Les unités coûtent ×3 d'un âge à l'autre : ce facteur (selon l'âge ENNEMI) garde le prestige
    // des kills et de l'assaut dans des proportions raisonnables.
    killValueByAge: [1, 1, 0.45, 0.2, 0.09, 0.04, 0.018, 0.008, 0.0036, 0.0016, 0.00072],
  },

  // --- Améliorations permanentes (achetées avec les points de prestige) -----
  // 10 niveaux, prix ×1,6 par niveau. Version « renforcée » (10/11) : au simulateur, avec les anciennes
  // valeurs (5 niveaux, +10 % de base, +5 % de dégâts), aucune run n'atteignait la vague 20 de l'assaut.
  upgrades: [
    { id: 'startGold', name: 'Trésor de départ', desc: '+60 or au début de chaque run', max: 10,
      costs: PA.prix(40, 1.6, 10), per: { startGold: 60 } },
    { id: 'xp', name: 'Sagesse ancestrale', desc: '+10 % d’XP gagnée', max: 10,
      costs: PA.prix(50, 1.6, 10), per: { xpGain: 0.10 } },
    { id: 'walls', name: 'Remparts', desc: '+25 % de PV pour ta base', max: 10,
      costs: PA.prix(40, 1.6, 10), per: { baseMaxHp: 0.25 } },
    { id: 'training', name: 'Entraînement', desc: '+15 % de dégâts pour tes unités', max: 10,
      costs: PA.prix(60, 1.6, 10), per: { allDmg: 0.15 } },
    { id: 'armor', name: 'Armures', desc: '+12 % de PV pour tes unités', max: 10,
      costs: PA.prix(60, 1.6, 10), per: { unitHp: 0.12 } },
    { id: 'engineers', name: 'Ingénieurs', desc: '+15 % de dégâts pour tes tourelles', max: 10,
      costs: PA.prix(60, 1.6, 10), per: { turretDmg: 0.15 } },
    { id: 'income', name: 'Collecteurs', desc: 'Or par seconde, par niveau : +0,4/s au premier âge, puis ×3 environ à chaque âge', max: 10,
      costs: PA.prix(80, 1.6, 10), per: { passiveGold: 1 } },
    { id: 'treasury', name: 'Trésor de guerre', desc: 'Réduit la perte en cas de défaite : 50 % → 40 % → 30 % → 25 %', max: 3,
      costs: [80, 180, 350], lossByLevel: [0.5, 0.4, 0.3, 0.25] },
  ],

  // --- Récompenses entre deux niveaux (1 au choix parmi 3) ------------------
  // mod : bonus additifs. instant : effet immédiat.
  relics: [
    { id: 'massues', icon: '🪨', name: 'Armes lestées', desc: '+15 % de dégâts en mêlée', mod: { meleeDmg: 0.15 } },
    { id: 'cordes', icon: '🏹', name: 'Cordes tendues', desc: '+15 % de dégâts à distance', mod: { rangedDmg: 0.15 } },
    { id: 'peaux', icon: '🛡️', name: 'Peaux épaisses', desc: '+15 % de PV pour tes unités', mod: { unitHp: 0.15 } },
    { id: 'camp', icon: '⛺', name: 'Camp d’entraînement', desc: '-15 % de temps de production', mod: { trainTime: -0.15 } },
    { id: 'sorcier', icon: '🔮', name: 'Sagesse du sorcier', desc: '+20 % d’XP gagnée', mod: { xpGain: 0.20 } },
    { id: 'pillards', icon: '💰', name: 'Pillards', desc: '+15 % d’or par kill', mod: { goldGain: 0.15 } },
    { id: 'mecanos', icon: '⚙️', name: 'Mécaniciens', desc: '+20 % de dégâts des tourelles', mod: { turretDmg: 0.20 } },
    { id: 'guet', icon: '🔭', name: 'Tour de guet', desc: '+15 % de portée des tourelles', mod: { turretRange: 0.15 } },
    { id: 'forge', icon: '🔨', name: 'Forge communale', desc: '-10 % sur le prix des unités', mod: { unitCost: -0.10 } },
    { id: 'rituel', icon: '🌀', name: 'Rituel', desc: '-20 % de recharge du pouvoir', mod: { specialCd: -0.20 } },
    { id: 'palissade', icon: '🧱', name: 'Palissade', desc: '+20 % de PV max pour ta base', mod: { baseMaxHp: 0.20 } },
    { id: 'reparations', icon: '🩹', name: 'Réparations d’urgence', desc: 'Répare 40 % des PV de ta base', instant: { heal: 0.40 } },
    { id: 'butin', icon: '🪙', name: 'Butin de guerre', desc: '+200 or, multiplié selon ton âge (×2 à l’âge de pierre, ×40 à la Renaissance, ×360 au Moderne…)', instant: { gold: 200 } },
    // Éléments : voir `elements` ci-dessous. La description dépend du niveau (PA.relicText).
    { id: 'glace', icon: '❄️', name: 'Glace', element: 'ice', mod: { ice: 1 } },
    { id: 'feu', icon: '🔥', name: 'Feu', element: 'fire', mod: { fire: 1 } },
    { id: 'foudre', icon: '⚡', name: 'Foudre', element: 'shock', mod: { shock: 1 } },
  ],

  // --- Éléments (reliques spéciales) ------------------------------------------
  // Ils s'ajoutent aux coups de tes unités et de tes tourelles (pas au pouvoir spécial).
  // Une seule affinité par run : une fois un élément choisi, les autres ne sont plus
  // proposés, et le même élément peut revenir pour monter de niveau (jusqu'à `max`).
  // Dans les tableaux, une case par niveau.
  elements: {
    // Ralentit déplacement et cadence d'attaque de la cible.
    ice: { name: 'Glace', color: '#9fe3ff', max: 3, slow: [0.2, 0.32, 0.45], duration: 2, championFactor: 0.5 },
    // Brûlure qui s'accumule : la cible brûle pour X % des dégâts de chaque coup, en `duration` s.
    fire: { name: 'Feu', color: '#ff8a3c', max: 3, burn: [0.2, 0.45, 0.7], duration: 3 },
    // Les coups à cible unique rebondissent sur les ennemis proches.
    shock: { name: 'Foudre', color: '#fff27a', max: 3, targets: [1, 2, 3], share: [0.35, 0.45, 0.55], range: 150 },
  },
};

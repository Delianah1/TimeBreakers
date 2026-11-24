/* =========================================================================
   POUVOIRS ULTIMES : quatre par âge.
     - le pouvoir de CONTRÔLE, donné d'office ;
     - le pouvoir d'ORIGINE (celui de config.js : age.special), une FRAPPE et un RENFORT, à acheter au camp
       avec le prestige (prix : prestige.powerCosts), puis à équiper : un seul pouvoir équipé par âge.

   Sauvegarde : meta.powers = { id: true } (achetés), meta.powerPick = { idÂge: idPouvoir } (équipé).

   Dégâts : « k » multiplie les dégâts par coup du pouvoir d'origine de l'âge (age.special.dmg),
   pour que tout suive l'échelle de l'âge sans table à part.

   Ce fichier ajoute au moteur (js/battle.js) : lancerPouvoir, majPouvoirs ; et au dessin (js/render.js) :
   PA.Pouvoirs.sol (sous les unités), .dessiner (par-dessus), .charge (looks des charges), .chute (looks des projectiles).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, K = PA.BattleConst, GROUND = K.GROUND, PF = K.PLAYER_FRONT, EF = K.ENEMY_FRONT;
  const TAU = Math.PI * 2, INK = '#0a1838';
  const rand = (a, b) => a + Math.random() * (b - a), cl = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------------------------------------------------------------- la table des pouvoirs
  // Par âge, dans l'ordre : contrôle (d'office), frappe, renfort.
  const TABLE = {
    jurassique: [
      { id: 'rugissement', name: 'Rugissement', type: 'stun', t: 3, look: 'cri', desc: 'Un cri fige de peur tous les ennemis pendant 3 secondes.' },
      { id: 'eruption', name: 'Éruption', type: 'drops', count: 7, k: 1.2, radius: 50, duration: 2, look: 'meteor', flaque: { k: 0.45, t: 4, r: 44 }, desc: 'Des bombes de lave tombent sur les ennemis et laissent des flaques brûlantes.' },
      { id: 'raptors', name: 'Ruée de raptors', type: 'sweep', count: 6, k: 1.0, speed: 520, duration: 1.4, look: 'raptor', desc: 'Une meute traverse le terrain en mordant tout sur son passage.' },
    ],
    pierre: [
      { id: 'fosse', name: 'Fosse à pieux', type: 'zone', ou: 'front', large: 230, t: 5, effet: 'root', k: 0.25, look: 'fosse', desc: 'Un piège s’ouvre sous la ligne ennemie : ceux qui y tombent ne bougent plus pendant 5 secondes.' },
      { id: 'mammouth', name: 'Mammouth enragé', type: 'sweep', count: 1, k: 4, speed: 480, knock: 70, look: 'mammouth', desc: 'Il charge d’un bout à l’autre et repousse les ennemis.' },
      { id: 'feu-sacre', name: 'Feu sacré', type: 'haste', t: 8, desc: 'Tes unités frappent deux fois plus vite pendant 8 secondes.' },
    ],
    // Âge caché (js/magma.js) : il prend la place de la Pierre dans les runs où on plonge dans le volcan.
    magma: [
      { id: 'souffle-volcan', name: 'Souffle du volcan', type: 'push', dist: 90, k: 1, chill: 0.5, t: 4, desc: 'Une bouffée de cendres brûlantes repousse les ennemis et les ralentit de moitié pendant 4 secondes.' },
      { id: 'coulee', name: 'Coulée', type: 'zone', ou: 'ligne', t: 5, effet: 'burn', k: 0.9, look: 'flammes', image: 'coulee', desc: 'Une rivière de lave traverse le terrain : les ennemis brûlent pendant 5 secondes.' },
      { id: 'carapace', name: 'Carapace d’obsidienne', type: 'guard', t: 5, k: 0.7, look: 'tortue', image: 'carapace', desc: 'Tes unités et ta base encaissent 70 % de dégâts en moins pendant 5 secondes.' },
    ],
    antiquite: [
      { id: 'tortue', name: 'Formation tortue', type: 'guard', t: 5, k: 0.85, look: 'tortue', desc: 'Tes unités et ta base encaissent 85 % de dégâts en moins pendant 5 secondes.' },
      { id: 'feu-gregeois', name: 'Feu grégeois', type: 'zone', ou: 'ligne', t: 5, effet: 'burn', k: 0.9, look: 'flammes', desc: 'Tout le terrain s’embrase : les ennemis brûlent pendant 5 secondes.' },
      { id: 'colere', name: 'Colère des dieux', type: 'focus', n: 4, dur: 2, cible: 'fort', k: 3.5, r: 30, look: 'eclair', desc: 'La foudre frappe quatre fois l’ennemi le plus solide.' },
    ],
    medieval: [
      { id: 'huile', name: 'Huile bouillante', type: 'zone', ou: 'base', large: 260, t: 6, effet: 'burn', k: 1.5, look: 'huile', desc: 'Pendant 6 secondes, tout ennemi qui approche de ta base est brûlé.' },
      { id: 'trebuchets', name: 'Trébuchets', type: 'drops', count: 3, k: 4, radius: 85, duration: 1.6, speed: 520, look: 'rock', desc: 'Trois énormes rochers : dégâts massifs sur une large zone.' },
      { id: 'cavalerie', name: 'Charge de cavalerie', type: 'sweep', count: 5, k: 1.4, speed: 560, knock: 14, duration: 1.2, look: 'chevalier', desc: 'Des chevaliers traversent le terrain lances baissées.' },
    ],
    renaissance: [
      { id: 'fumee', name: 'Rideau de fumée', type: 'blind', t: 6, desc: 'Les ennemis et leurs tourelles ratent tous leurs coups pendant 6 secondes.' },
      { id: 'baril', name: 'Baril de poudre', type: 'sweep', count: 1, k: 6, speed: 300, explode: 110, look: 'baril', desc: 'Un baril roule vers l’ennemi et explose au premier contact.' },
      { id: 'mercenaires', name: 'Mercenaires', type: 'summon', unite: 2, count: 3, mult: 1.3, ou: 'base', desc: 'Trois soldats lourds gratuits, plus forts que la normale, arrivent en renfort.' },
    ],
    vapeur: [
      { id: 'jet-vapeur', name: 'Jet de vapeur', type: 'push', dist: 90, k: 1, chill: 0.5, t: 4, desc: 'Un nuage brûlant repousse tous les ennemis et les ralentit de moitié pendant 4 secondes.' },
      { id: 'locomotive', name: 'Locomotive folle', type: 'sweep', count: 1, k: 5, speed: 700, knock: 40, look: 'train', desc: 'Un train traverse le champ de bataille et écrase tout.' },
      { id: 'surpression', name: 'Surpression', type: 'turretHaste', t: 8, desc: 'Tes tourelles tirent trois fois plus vite pendant 8 secondes.' },
    ],
    moderne: [
      { id: 'mines', name: 'Champ de mines', type: 'mines', count: 5, k: 3.5, r: 60, desc: 'Cinq mines posées juste devant la ligne ennemie : chacune explose dès qu’un ennemi avance dessus.' },
      { id: 'barrage', name: 'Tir de barrage', type: 'drops', ligne: true, count: 10, k: 1.3, radius: 55, duration: 1.8, speed: 900, look: 'bomb', desc: 'Une ligne d’explosions avance de ta base vers l’ennemi.' },
      { id: 'parachutistes', name: 'Parachutistes', type: 'summon', unite: 0, count: 3, mult: 1.5, ou: 'front', desc: 'Trois soldats gratuits sautent directement sur la ligne de front.' },
    ],
    heros: [
      { id: 'arret-temps', name: 'Arrêt du temps', type: 'stun', t: 4, champ: 1, look: 'temps', desc: 'Tous les ennemis, champions compris, sont figés 4 secondes. Tes unités continuent.' },
      { id: 'laser', name: 'Rayon laser', type: 'sweep', count: 1, k: 4.5, speed: 900, look: 'laser', desc: 'Un regard laser balaie tout le terrain.' },
      { id: 'appel-heros', name: 'Appel des héros', type: 'summon', unite: 'champion', count: 1, mult: 1, ttl: 10, ou: 'front', desc: 'Un champion combat à tes côtés pendant 10 secondes.' },
    ],
    postapo: [
      { id: 'toxique', name: 'Nuage toxique', type: 'zone', ou: 'front', large: 300, t: 6, effet: 'poison', k: 0.9, look: 'toxique', desc: 'Un nuage de poison ronge les ennemis de la ligne de front pendant 6 secondes.' },
      { id: 'convoi', name: 'Convoi de pillards', type: 'sweep', count: 3, k: 1.8, speed: 600, knock: 20, duration: 0.9, look: 'camion', desc: 'Trois véhicules blindés foncent à travers les lignes.' },
      { id: 'horde', name: 'Horde', type: 'summon', unite: 0, count: 8, mult: 0.5, ou: 'base', desc: 'Huit combattants gratuits, faibles mais nombreux.' },
    ],
    futur: [
      { id: 'iem', name: 'Impulsion électromagnétique', type: 'stun', t: 3, look: 'iem', tourelles: 6, desc: 'Paralyse les ennemis 3 secondes et coupe leurs tourelles 6 secondes.' },
      { id: 'drones', name: 'Essaim de drones', type: 'drops', chaque: true, count: 10, k: 3, radius: 30, duration: 1.2, speed: 700, look: 'drone', desc: 'Un drone kamikaze par ennemi, dix au plus.' },
      { id: 'bouclier', name: 'Bouclier d’énergie', type: 'guard', t: 4, k: 1, look: 'dome', desc: 'Tes unités et ta base ne prennent aucun dégât pendant 4 secondes.' },
    ],
    alien: [
      { id: 'mental', name: 'Contrôle mental', type: 'convert', n: 2, t: 8, desc: 'Les deux ennemis de tête changent de camp pendant 8 secondes, puis s’effondrent.' },
      { id: 'trou-noir', name: 'Trou noir', type: 'pull', t: 1.6, k: 6, r: 130, desc: 'Aspire les ennemis vers un point, puis implose.' },
      { id: 'vaisseau-mere', name: 'Vaisseau-mère', type: 'focus', n: 20, dur: 8, cible: 'front', k: 0.9, r: 35, look: 'rayon', desc: 'Il plane au-dessus du front et tire en continu pendant 8 secondes.' },
    ],
  };
  const GENRES = ['Contrôle', 'Origine', 'Frappe', 'Renfort'];
  const ORIGINE = {
    meteores: 'Douze météores s’abattent sur les ennemis.', eboulement: 'Quatorze rochers dévalent sur la ligne ennemie.',
    charge: 'Quatre éléphants traversent le terrain et repoussent les ennemis.', volee: 'Quarante-cinq flèches pleuvent sur les ennemis.',
    bombardement: 'Seize boulets de canon pilonnent le terrain.', dirigeable: 'Un dirigeable survole le terrain en lâchant ses bombes.',
    'frappe-aerienne': 'Quatorze bombes larguées sur les ennemis.', poings: 'Douze poings géants tombent du ciel.',
    bidons: 'Douze bidons explosifs s’écrasent sur les ennemis.', 'frappe-orbitale': 'Douze rayons tirés depuis l’orbite.',
    abduction: 'Douze soucoupes frappent les ennemis de leurs rayons.',
    'pluie-lave': 'Quatorze bombes de lave s’abattent sur la ligne ennemie.',
  };
  const listes = {};

  const P = PA.Pouvoirs = {
    TABLE, GENRES, ORIGINE,
    // Les quatre pouvoirs d'un âge : [contrôle, origine, frappe, renfort].
    liste(ageIdx) {
      const age = C.ages[ageIdx];
      if (!listes[age.id]) {
        const t = TABLE[age.id] || [];
        const origine = Object.assign({}, age.special, { desc: ORIGINE[age.special.id] || 'Le pouvoir d’origine de cet âge.' });
        listes[age.id] = [t[0], origine, t[1], t[2]].filter(Boolean).map((p, i) => Object.assign(p, { genre: GENRES[t[0] ? i : 1], cooldown: p.cooldown || age.special.cooldown, gratuit: i === 0 }));
      }
      return listes[age.id];
    },
    cout(ageIdx) { return C.prestige.powerCosts[ageIdx]; },
    possede(meta, ageIdx, id) { const p = this.liste(ageIdx).find(q => q.id === id); return !!p && (p.gratuit || !!(meta.powers && meta.powers[id])); },
    // Le pouvoir équipé pour cet âge (celui de contrôle tant que rien d'autre n'est choisi).
    choisi(meta, ageIdx) {
      const L = this.liste(ageIdx), id = meta && meta.powerPick && meta.powerPick[C.ages[ageIdx].id];
      return (id && this.possede(meta, ageIdx, id) && L.find(p => p.id === id)) || L[0];
    },
    peutAcheter(meta, ageIdx, id) { return ageIdx < PA.Meta.playableAgeCount(meta) && !this.possede(meta, ageIdx, id) && this.liste(ageIdx).some(p => p.id === id); },
    acheter(meta, ageIdx, id) {
      const cout = this.cout(ageIdx);
      if (!this.peutAcheter(meta, ageIdx, id) || meta.balance < cout) return false;
      meta.balance -= cout;
      meta.powers = Object.assign({}, meta.powers, { [id]: true });
      meta.powerPick = Object.assign({}, meta.powerPick, { [C.ages[ageIdx].id]: id });   // acheté = équipé
      PA.Meta.save(meta);
      return true;
    },
    equiper(meta, ageIdx, id) {
      if (!this.possede(meta, ageIdx, id)) return false;
      meta.powerPick = Object.assign({}, meta.powerPick, { [C.ages[ageIdx].id]: id });
      PA.Meta.save(meta);
      return true;
    },
    // Version perso / vitrine : tout débloquer.
    toutDebloquer(meta) { meta.powers = Object.assign({}, meta.powers); C.ages.forEach((a, i) => this.liste(i).forEach(p => { if (!p.gratuit) meta.powers[p.id] = true; })); },
  };

  // ---------------------------------------------------------------- en combat
  const B = PA.Battle.prototype;
  Object.defineProperty(B, 'special', { get() { return P.choisi(this.meta, this.run.age); } });
  const etat = b => b.pw || (b.pw = { zones: [], mines: [], blind: 0, guard: 0, guardK: 0, guardLook: '', haste: 0, turretHaste: 0, turretOff: 0, jet: 0, onde: 0, ondeLook: '', gel: 0, focus: null, trou: null });
  const front = b => { const f = b.eu.find(u => !u.dead); return f ? f.x : (PF + EF) / 2 + 120; };

  // Explosion : dégâts à tous les ennemis dans le rayon.
  P.explose = function (b, x, r, dmg, color) {
    for (const f of b.eu) if (!f.dead && Math.abs(f.x - x) <= r + f.w / 2) b.damageUnit(f, dmg);
    b.particles.push({ ring: true, x, y: GROUND - 6, r: 4, maxR: r, life: 0.35, max: 0.35, color: color || '#ffb057' });
    b.spark(x, GROUND - 10, color || '#ffb057', 12);
    b.shake = Math.max(b.shake, 0.14);
  };
  // Fin de vie d'une unité à durée limitée (champion appelé, ennemi sous contrôle mental).
  P.expire = function (b, u) {
    u.dead = true;
    if (u.converti) { u.side = -1; b.onUnitDeath(u); return; }    // l'ennemi retourné s'effondre : il compte comme tué
    for (let i = 0; i < 10; i++) b.particles.push({ x: u.x + rand(-u.w / 2, u.w / 2), y: GROUND - rand(4, u.h), vx: rand(-60, 60), vy: rand(-150, -40), life: rand(0.4, 0.8), max: 0.8, color: '#ffd76a', size: rand(2, 4) });
  };

  // ref : dégâts par coup du pouvoir d'origine de l'âge, bonus compris.
  B.lancerPouvoir = function (sp, ref) {
    const pw = etat(this), dmg = ref * (sp.k || 1);
    switch (sp.type) {
      case 'drops': {
        const x0 = PF + 90, x1 = EF - 20, cibles = sp.chaque ? this.eu.filter(u => !u.dead).slice(0, sp.count) : null;
        const n = cibles ? Math.max(1, cibles.length) : sp.count;
        for (let i = 0; i < n; i++) {
          const d = { delay: sp.ligne || cibles ? (i + 0.3) * sp.duration / n : rand(0, sp.duration), x: null, y: -30, vy: sp.speed || 900, dmg, radius: sp.radius, look: sp.look, dead: false };
          if (sp.ligne) d.fixX = x0 + (x1 - x0) * (i + 0.5) / n + rand(-10, 10);
          if (cibles && cibles[i]) d.fixX = cibles[i].x;
          if (sp.flaque) d.apres = dd => pw.zones.push({ x0: dd.x - sp.flaque.r, x1: dd.x + sp.flaque.r, t: 0, max: sp.flaque.t, effet: 'burn', dps: ref * sp.flaque.k, look: 'flaque' });
          this.drops.push(d);
        }
        break;
      }
      case 'sweep':
        for (let i = 0; i < sp.count; i++) {
          this.sweeps.push({ delay: i * (sp.duration || 0) / sp.count + rand(0, 0.1), x: PF - 30, speed: sp.speed, dmg, knock: sp.knock || 0, look: sp.look, explode: sp.explode || 0,
            hit: new Set(), walk: rand(0, 6), dead: false });
        }
        break;
      case 'zone': {
        let x0 = PF + 30, x1 = EF - 10;
        if (sp.ou === 'base') { x0 = PF; x1 = PF + sp.large; }
        if (sp.ou === 'front') { const f = front(this); x0 = f - 40; x1 = x0 + sp.large; }
        pw.zones.push({ x0, x1, t: 0, max: sp.t, effet: sp.effet, dps: dmg, look: sp.look, image: sp.image });   // image : dessin de js/sprites.js
        break;
      }
      case 'stun':
        for (const f of this.eu) if (!f.dead) f.stun = Math.max(f.stun || 0, sp.t * (f.isChampion ? (sp.champ != null ? sp.champ : 0.5) : 1));
        pw.onde = 0.9; pw.ondeLook = sp.look; pw.gel = sp.t;
        if (sp.tourelles) pw.turretOff = sp.tourelles;
        this.shake = Math.max(this.shake, 0.2);
        break;
      case 'blind': pw.blind = sp.t; break;
      case 'guard': pw.guard = sp.t; pw.guardMax = sp.t; pw.guardK = sp.k; pw.guardLook = sp.look; pw.guardImage = sp.image; break;
      case 'haste': pw.haste = sp.t; break;
      case 'turretHaste': pw.turretHaste = sp.t; break;
      case 'push':
        for (const f of this.eu) {
          if (f.dead) continue;
          this.damageUnit(f, dmg);
          if (f.dead) continue;
          f.x = Math.min(EF - f.w / 2 - 2, f.x + sp.dist * (f.isChampion ? 0.4 : 1));
          f.chill = { k: Math.max(sp.chill * (f.isChampion ? 0.5 : 1), f.chill ? f.chill.k : 0), t: sp.t };
        }
        pw.jet = 0.9; this.shake = Math.max(this.shake, 0.15);
        break;
      case 'mines':
        for (let i = 0; i < sp.count; i++) pw.mines.push({ x: Math.max(PF + 40 + i * 12, front(this) - 34 - i * 40), dmg, r: sp.r, t: 60 });
        break;
      case 'focus':
        pw.focus = { left: sp.n, every: sp.dur / sp.n, t: 0.25, cible: sp.cible, dmg, r: sp.r, look: sp.look, reste: sp.dur + 0.6, x: front(this) };
        break;
      case 'summon': {
        const age = this.run.age, def = sp.unite === 'champion' ? C.ages[age].champion : C.ages[age].units[sp.unite];
        const tete = this.pu.find(u => !u.dead);
        for (let i = 0; i < sp.count; i++) {
          this.spawnPlayer(def, age);
          const u = this.pu[this.pu.length - 1];
          u.hp = u.maxHp = u.maxHp * sp.mult; u.dmg *= sp.mult; u.invoque = true;
          if (sp.ttl) u.ttl = sp.ttl;
          u.x = sp.ou === 'front' ? cl((tete ? tete.x : PF + 220) - 24 - i * (def.w + 8), PF + def.w / 2 + 2, EF - 80) : PF + def.w / 2 + 2 + i * (def.w * 0.6 + 6);
          u.arrivee = 0.5;                                    // petit effet d'apparition
          if (sp.id === 'parachutistes') { u.arrivee = 0.9; u.para = true; }
        }
        this.sortUnits();
        break;
      }
      case 'convert': {
        const cibles = this.eu.filter(f => !f.dead && !f.isChampion).slice(0, sp.n);
        for (const f of cibles) {
          this.eu.splice(this.eu.indexOf(f), 1);
          f.side = 1; f.ttl = sp.t; f.converti = true; f.cd = 0.3; f.chill = null; f.stun = 0; f.rush = false;
          this.pu.push(f);
        }
        if (!cibles.length) this.game.toast('Aucun ennemi à contrôler (les champions résistent)');
        pw.onde = 0.9; pw.ondeLook = 'mental';
        this.sortUnits();
        break;
      }
      case 'pull':
        pw.trou = { x: cl(front(this) + 80, PF + 200, EF - 80), t: sp.t, max: sp.t, dmg, r: sp.r };
        break;
    }
  };

  B.majPouvoirs = function (dt) {
    const pw = this.pw;
    if (!pw) return;
    for (const k of ['blind', 'guard', 'haste', 'turretHaste', 'turretOff', 'jet', 'onde', 'gel']) if (pw[k] > 0) pw[k] = Math.max(0, pw[k] - dt);
    for (const z of pw.zones) {
      z.t += dt;
      for (const f of this.eu) {
        if (f.dead || f.x < z.x0 - f.w / 2 || f.x > z.x1 + f.w / 2) continue;
        if (z.effet === 'burn') { if (!f.burn || f.burn.dps <= z.dps) f.burn = { dps: z.dps, t: 0.5 }; }
        else {
          this.damageUnit(f, z.dps * dt, true);
          if (z.effet === 'root') f.stun = Math.max(f.stun || 0, 0.15); else f.poison = 0.3;
        }
      }
    }
    pw.zones = pw.zones.filter(z => z.t < z.max);
    for (const m of pw.mines) {
      m.t -= dt;
      if (this.eu.some(f => !f.dead && Math.abs(f.x - m.x) <= f.w / 2 + 10)) { P.explose(this, m.x, m.r, m.dmg); m.t = 0; }
    }
    pw.mines = pw.mines.filter(m => m.t > 0);
    const fo = pw.focus;
    if (fo) {
      fo.reste -= dt; fo.t -= dt;
      const vivants = this.eu.filter(u => !u.dead);
      const cible = fo.cible === 'fort' ? vivants.reduce((a, u) => (!a || u.hp > a.hp ? u : a), null) : vivants[0];
      if (cible) fo.x += (cible.x - fo.x) * Math.min(1, dt * 6);
      while (fo.left > 0 && fo.t <= 0) {
        fo.t += fo.every; fo.left--;
        if (!cible) continue;
        for (const f of this.eu) if (!f.dead && Math.abs(f.x - cible.x) <= fo.r + f.w / 2) this.damageUnit(f, fo.dmg);
        const ty = GROUND - cible.h * 0.5;
        if (fo.look === 'eclair') {
          const pts = []; for (let s = 0; s <= 6; s++) pts.push([cible.x + (s < 6 ? rand(-12, 12) : 0), 70 + (ty - 70) * s / 6]);
          this.particles.push({ bolt: true, pts, life: 0.25, max: 0.25, color: '#fff27a' });
          this.shake = Math.max(this.shake, 0.14);
        } else this.particles.push({ bolt: true, pts: [[fo.x, 150], [cible.x, ty]], life: 0.18, max: 0.18, color: '#8dff7a' });
        this.spark(cible.x, ty, fo.look === 'eclair' ? '#fff27a' : '#8dff7a', 8);
      }
      if (fo.left <= 0 && fo.reste <= 0) pw.focus = null;
    }
    const tr = pw.trou;
    if (tr) {
      tr.t -= dt;
      for (const f of this.eu) {
        if (f.dead) continue;
        const d = tr.x - f.x, pas = Math.min(Math.abs(d), 260 * dt * (f.isChampion ? 0.3 : 1));
        f.x += Math.sign(d) * pas; f.stun = Math.max(f.stun || 0, 0.1);
      }
      if (tr.t <= 0) { P.explose(this, tr.x, tr.r, tr.dmg, '#b06bff'); this.shake = Math.max(this.shake, 0.4); pw.trou = null; }
    }
    for (const u of this.eu) if (u.poison > 0) u.poison -= dt;
    for (const u of this.pu) if (u.arrivee > 0) u.arrivee -= dt;
  };

  // ---------------------------------------------------------------- dessin (trait cartoon, contour encre)
  let c = null;
  const trait = (w = 3) => { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const rond = (x, y, r, col, w = 3) => { c.beginPath(); c.arc(x, y, Math.max(0, r), 0, TAU); c.fillStyle = col; c.fill(); if (w) trait(w); };
  const rect = (x, y, w, h, col, r = 4) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = col; c.fill(); trait(); };
  const ligne = (x1, y1, x2, y2, col, w = 3) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); };
  const poly = (pts, col, w = 3) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = col; c.fill(); if (w) trait(w); };
  const nuage = (x, y, r, col, a) => {
    c.save(); c.globalAlpha = a; c.fillStyle = col; c.beginPath();
    for (const [dx, dy, m] of [[-0.7, 0.1, 0.7], [0, -0.25, 1], [0.75, 0.1, 0.75]]) { c.moveTo(x + dx * r + m * r * 0.7, y + dy * r); c.arc(x + dx * r, y + dy * r, m * r * 0.7, 0, TAU); }
    c.fill(); trait(2.5); c.restore();
  };
  const flamme = (x, y, h, T, i) => {
    const hh = h * (0.7 + 0.3 * Math.sin(T * 12 + i * 2 + x));
    c.beginPath(); c.moveTo(x - 8, y); c.quadraticCurveTo(x - 12, y - hh * 0.5, x, y - hh); c.quadraticCurveTo(x + 12, y - hh * 0.5, x + 8, y); c.closePath();
    c.fillStyle = i % 2 ? '#ffd23f' : '#ff8a3c'; c.fill(); trait(2.5);
  };
  const etoile = (x, y, r, col) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = col; c.fill(); trait(2); };
  const roue = (x, y, r, T) => { rond(x, y, r, '#3a3f4a'); ligne(x - r * Math.cos(T * 12), y - r * Math.sin(T * 12), x + r * Math.cos(T * 12), y + r * Math.sin(T * 12), '#9aa3b5', 2.5); };
  const soucoupe = (x, y, s, T) => {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.ellipse(0, -6, 12, 9, 0, Math.PI, TAU); c.fillStyle = '#9fe3ff'; c.fill(); trait(2);
    c.beginPath(); c.ellipse(0, 0, 28, 8, 0, 0, TAU); c.fillStyle = '#8b6fd6'; c.fill(); trait(2);
    for (const d of [-16, 0, 16]) rond(d, 1, 2.5, Math.sin(T * 8 + d) > 0 ? '#8dff7a' : '#fff27a', 1);
    c.restore();
  };

  // Sous les unités : ce qui est posé au sol.
  P.sol = function (ctx, b) {
    const pw = b.pw; if (!pw) return;
    c = ctx; const T = performance.now() / 1000;
    for (const z of pw.zones) {
      const a = Math.min(1, z.t / 0.3, (z.max - z.t) / 0.4), cx = (z.x0 + z.x1) / 2, rx = (z.x1 - z.x0) / 2;
      c.save(); c.globalAlpha = Math.max(0, a);
      if (z.look === 'fosse') {
        c.beginPath(); c.ellipse(cx, GROUND + 6, rx * Math.min(1, z.t / 0.3), 14, 0, 0, TAU); c.fillStyle = '#22140c'; c.fill(); trait();
        for (let x = z.x0 + 22; x < z.x1 - 10; x += 30) poly([[x - 6, GROUND + 14], [x, GROUND - 10], [x + 6, GROUND + 14]], '#c9b08a', 2);
      } else if (z.look === 'huile' || z.look === 'flaque' || z.look === 'toxique') {
        c.beginPath(); c.ellipse(cx, GROUND + 5, rx, z.look === 'flaque' ? 7 : 9, 0, 0, TAU);
        c.fillStyle = z.look === 'huile' ? '#c8741c' : z.look === 'flaque' ? '#ff6a2a' : '#6fae3a'; c.fill(); trait(2.5);
      }
      c.restore();
    }
    for (const m of pw.mines) { rond(m.x, GROUND + 2, 9, '#3a3f4a', 2.5); rond(m.x, GROUND - 4, 3, Math.sin(T * 10 + m.x) > 0 ? '#ff3b3b' : '#6b1a1a', 1.5); }
  };

  // Par-dessus les unités : flammes, nuages, étoiles, dômes, vaisseaux.
  P.dessiner = function (ctx, b) {
    const pw = b.pw; if (!pw) return;
    c = ctx; const T = performance.now() / 1000;
    for (const z of pw.zones) {
      const a = Math.max(0, Math.min(1, z.t / 0.3, (z.max - z.t) / 0.4));
      if (z.effet === 'burn') { c.save(); c.globalAlpha = a; let i = 0; for (let x = z.x0 + 12; x < z.x1; x += z.look === 'flaque' ? 22 : 34) flamme(x, GROUND + 4, z.look === 'flammes' ? 34 : 26, T, i++); c.restore(); }
      if (z.look === 'toxique') for (let j = 0, x = z.x0 + 30; x < z.x1; x += 52, j++) nuage(x + Math.sin(T * 1.3 + j * 2) * 8, GROUND - 46 - (j % 2) * 26, 34, '#8dd65a', a * 0.6);
    }
    for (const u of b.eu) {
      if (u.dead) continue;
      if (u.stun > 0.2) for (let i = 0; i < 3; i++) etoile(u.x + Math.cos(T * 5 + i * TAU / 3) * 13, GROUND - u.h - 12 + Math.sin(T * 5 + i * TAU / 3) * 4, 6, pw.ondeLook === 'temps' || pw.ondeLook === 'iem' ? '#9fe3ff' : '#ffd23f');
      if (u.poison > 0) { const k = (T * 1.6 + u.x * 0.01) % 1; rond(u.x + Math.sin(u.x) * 8, GROUND - u.h - 4 - k * 18, 4 * (1 - k) + 1, '#8dd65a', 1.5); }
    }
    for (const u of b.pu) {
      if (u.dead) continue;
      if (u.converti) { c.save(); c.translate(u.x, GROUND - u.h - 14); c.rotate(T * 5); c.beginPath(); c.arc(0, 0, 9, 0, 4.6); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.lineWidth = 3.5; c.strokeStyle = '#d58bff'; c.stroke(); c.restore(); }
      if (u.arrivee > 0 && u.para) {                        // le parachute se replie au-dessus du soldat qui vient de se poser
        const k = u.arrivee / 0.9, y = GROUND - u.h - 18 - k * 26;
        c.save(); c.globalAlpha = Math.min(1, k * 2);
        ligne(u.x - 24 * k - 4, y, u.x, GROUND - u.h + 4, INK, 2); ligne(u.x + 24 * k + 4, y, u.x, GROUND - u.h + 4, INK, 2);
        c.beginPath(); c.ellipse(u.x, y, 26 * k + 6, 20 * k + 4, 0, Math.PI, TAU); c.closePath(); c.fillStyle = '#7fb069'; c.fill(); trait(2.5); c.restore();
      } else if (u.arrivee > 0) { c.save(); c.globalAlpha = u.arrivee / 0.5; c.beginPath(); c.arc(u.x, GROUND - u.h / 2, u.h * (1.2 - u.arrivee), 0, TAU); c.lineWidth = 4; c.strokeStyle = '#ffd23f'; c.stroke(); c.restore(); }
      if (pw.haste > 0) { c.save(); c.globalAlpha = 0.35 * Math.min(1, pw.haste); c.beginPath(); c.arc(u.x, GROUND - u.h / 2, u.h * 0.62 + 2 * Math.sin(T * 10 + u.x), 0, TAU); c.fillStyle = '#ff8a3c'; c.fill(); c.restore(); for (let j = 0; j < 3; j++) ligne(u.x - u.w / 2 - 6 - j * 5, GROUND - 10 - j * 12, u.x - u.w / 2 - 22 - j * 5, GROUND - 10 - j * 12, '#ffd23f', 2.5); }
      if (pw.guard > 0 && pw.guardLook === 'tortue') { c.save(); c.globalAlpha = Math.min(1, pw.guard * 2); c.translate(u.x + u.w / 2 + 4, GROUND - u.h * 0.5); rect(-9, -16, 18, 32, '#c9a13a', 7); rond(0, 0, 4, '#ffe9a0', 2); c.restore(); }
    }
    if (pw.guard > 0 && pw.guardLook === 'dome') {
      const tete = b.pu.find(u => !u.dead), x1 = Math.max(PF + 120, tete ? tete.x + 50 : 0), cx = (x1 - 20) / 2 + 10, r = (x1 + 20) / 2, a = Math.min(1, pw.guard * 2);
      c.save(); c.globalAlpha = 0.28 * a; c.beginPath(); c.ellipse(cx, GROUND, r, Math.min(r, 230), 0, Math.PI, TAU); c.closePath(); c.fillStyle = '#78dcff'; c.fill();
      c.globalAlpha = 0.9 * a; c.lineWidth = 4; c.strokeStyle = '#e6fbff'; c.stroke(); c.restore();
    }
    if (pw.turretHaste > 0) for (let i = 0; i < b.run.turrets.length; i++) { if (!b.run.turrets[i]) continue; const p = b.turretPos(1, i); c.save(); c.globalAlpha = 0.4 + 0.3 * Math.sin(T * 30 + i); rond(p.x, p.y - 8, 20, '#ff8a3c', 0); c.restore(); nuage(p.x - 14, p.y - 30 - ((T * 40 + i * 9) % 22), 8, '#ffffff', 0.7); }
    if (pw.blind > 0) { const a = Math.min(1, pw.blind, (6 - pw.blind) * 4 + 0.2), x0 = front(b) - 30; for (let j = 0; j < 7; j++) nuage(x0 + j * 58 + Math.sin(T * 1.4 + j) * 8, GROUND - 40 - (j % 2) * 30, 40, '#b9c0cc', a * 0.85); }
    if (pw.jet > 0) { const k = 1 - pw.jet / 0.9; for (let j = 0; j < 9; j++) nuage(PF + 40 + k * 620 * (0.5 + j / 16) + j * 20, GROUND - 30 - (j % 3) * 22, 18 + k * 30, '#ffffff', (1 - k) * 0.85); }
    if (pw.onde > 0) {
      const k = 1 - pw.onde / 0.9;
      c.save(); c.globalAlpha = 1 - k;
      if (pw.ondeLook === 'cri') for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(PF, GROUND - 70, 60 + (k + j * 0.18) * 900, -0.42, 0.42); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke(); }
      else { const col = pw.ondeLook === 'mental' ? '#d58bff' : '#9fe3ff', ox = pw.ondeLook === 'temps' ? (PF + EF) / 2 : PF + 60; c.beginPath(); c.arc(ox, GROUND - 60, 30 + k * 950, 0, TAU); c.lineWidth = 12; c.strokeStyle = col; c.stroke(); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke(); }
      c.restore();
    }
    if (pw.gel > 0 && pw.ondeLook === 'temps') {
      c.save(); c.globalAlpha = 0.16 * Math.min(1, pw.gel * 2); c.fillStyle = '#5078ff'; c.fillRect(0, 0, C.world.width, C.world.height); c.restore();
      const x = C.world.width / 2, y = 150; rond(x, y, 34, '#fff'); for (let j = 0; j < 12; j++) ligne(x + 27 * Math.cos(j * TAU / 12), y + 27 * Math.sin(j * TAU / 12), x + 31 * Math.cos(j * TAU / 12), y + 31 * Math.sin(j * TAU / 12), INK, 2.5);
      ligne(x, y, x, y - 22, INK, 4); ligne(x, y, x + 16, y, INK, 4);
    }
    const fo = pw.focus;
    if (fo) {
      if (fo.look === 'rayon') { const y = 120 + Math.sin(T * 3) * 5 - Math.max(0, 0.6 - fo.reste) * 300; soucoupe(fo.x, y, 3.2, T); }
      else { nuage(fo.x, 62, 62, '#56607a', Math.min(1, fo.reste * 2)); nuage(fo.x - 50, 76, 40, '#6a7590', Math.min(1, fo.reste * 2)); }
    }
    const tr = pw.trou;
    if (tr) {
      const o = Math.min(1, (tr.max - tr.t) / 0.3), y = GROUND - 90;
      for (let j = 0; j < 3; j++) { c.save(); c.translate(tr.x, y); c.rotate(T * 3 + j * 2); c.beginPath(); c.ellipse(0, 0, (78 - j * 14) * o, (30 - j * 7) * o, 0, 0, TAU); c.lineWidth = 6; c.strokeStyle = ['#b06bff', '#ff6bd6', '#9fe3ff'][j]; c.stroke(); c.restore(); }
      rond(tr.x, y, 34 * o, '#05020f', 4);
    }
  };

  // Les charges qui ne sont pas des éléphants. Renvoie true si le look est géré ici.
  P.charge = function (ctx, s) {
    c = ctx; const T = performance.now() / 1000, b = Math.sin(s.walk * 1.3) * 3;
    c.save(); c.translate(s.x, GROUND);
    switch (s.look) {
      case 'raptor':
        ligne(-16, -24 + b, -44, -34 + b, INK, 11); ligne(-16, -24 + b, -44, -34 + b, '#5fa35a', 5);
        ligne(-5, -14, -10 - b * 2, 0, INK, 5); ligne(7, -14, 12 + b * 2, 0, INK, 5);
        c.beginPath(); c.ellipse(0, -24 + b, 22, 12, -0.2, 0, TAU); c.fillStyle = '#5fa35a'; c.fill(); trait(); rond(22, -40 + b, 10, '#5fa35a'); rond(26, -42 + b, 2.5, '#fff', 1.5);
        break;
      case 'mammouth':
        for (const lx of [-40, -14, 14, 36]) rect(lx, -24, 16, 24, '#6e452c', 4);
        rect(-54, -84 + b, 104, 62, '#8a5a3c', 24); rond(54, -66 + b, 27, '#8a5a3c');
        c.beginPath(); c.moveTo(72, -54 + b); c.quadraticCurveTo(98, -32, 80, -8); c.lineWidth = 14; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = '#8a5a3c'; c.stroke();
        c.beginPath(); c.moveTo(62, -48 + b); c.quadraticCurveTo(98, -36, 108, -70 + b); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#fff8e0'; c.stroke();
        rond(62, -74 + b, 3.5, '#fff', 1.5);
        break;
      case 'chevalier':
        for (const lx of [-20, -7, 10, 22]) ligne(lx, -18, lx + Math.sin(s.walk * 1.3 + lx) * 8, 0, INK, 5);
        c.beginPath(); c.ellipse(0, -28 + b, 30, 14, 0, 0, TAU); c.fillStyle = '#8a5a3c'; c.fill(); trait(); rond(34, -46 + b, 11, '#8a5a3c');
        rect(-10, -70 + b, 20, 32, '#3b82f6', 6); rond(0, -78 + b, 10, '#c9d2e3'); ligne(8, -56 + b, 70, -44 + b, INK, 8); ligne(8, -56 + b, 70, -44 + b, '#d8c08a', 4);
        break;
      case 'baril':
        c.translate(0, -20); c.rotate(s.x * 0.05); rond(0, 0, 20, '#b0703a'); ligne(-20, 0, 20, 0, INK, 3); ligne(0, -20, 0, 20, INK, 3); rond(0, -24, 4 + Math.sin(T * 30), '#ffd23f', 2);
        break;
      case 'train':
        for (let j = 0; j < 4; j++) nuage(-40 - j * 46, -124 - j * 14, 18 + j * 7, '#e8edf5', 0.9 - j * 0.2);
        rect(-78, -68, 54, 54, '#8f2f2f', 5); rect(-28, -54, 100, 40, '#3a3f4a', 10); rect(40, -84, 18, 34, '#3a3f4a', 3); rect(-70, -60, 22, 18, '#9fe3ff', 3);
        poly([[72, -18], [98, -4], [72, -4]], '#c9a13a'); roue(-54, -12, 14, T); roue(-8, -12, 14, T); roue(40, -12, 14, T);
        break;
      case 'camion':
        rect(-54, -54, 78, 36, '#a5622a', 6); rect(24, -44, 34, 26, '#a5622a', 5); rect(32, -38, 16, 11, '#9fe3ff', 3);
        poly([[58, -22], [80, -18], [58, -10]], '#c9d2e3', 2.5); poly([[58, -40], [76, -40], [58, -30]], '#c9d2e3', 2.5); roue(-32, -11, 12, T); roue(32, -11, 12, T);
        break;
      case 'laser':
        c.translate(-s.x, -GROUND);
        ligne(PF + 30, 96, s.x, GROUND, INK, 16); ligne(PF + 30, 96, s.x, GROUND, '#ff3b3b', 9); ligne(PF + 30, 96, s.x, GROUND, '#fff', 3);
        c.save(); c.translate(PF + 6, 100 + Math.sin(T * 4) * 4); poly([[-8, -6], [-50, 6], [-44, 24], [-6, 12]], '#e5484d'); rect(-10, -12, 40, 22, '#3b82f6', 9); rond(34, -4, 11, '#ffd9b0'); c.restore();
        etoile(s.x, GROUND - 4, 16 + 5 * Math.sin(T * 30), '#ffd23f');
        break;
      default: c.restore(); return false;
    }
    c.restore();
    return true;
  };

  // Les projectiles propres aux nouveaux pouvoirs. Renvoie true si le look est géré ici.
  P.chute = function (ctx, d) {
    if (d.look !== 'drone') return false;
    c = ctx; const T = performance.now() / 1000;
    ligne(d.x - 16, d.y - 9, d.x + 16, d.y - 9, INK, 3); rect(d.x - 11, d.y - 7, 22, 14, '#56607a', 5); rond(d.x, d.y, 3.5, Math.sin(T * 30) > 0 ? '#ff3b3b' : '#6b1a1a', 1.5);
    return true;
  };
})();

/* =========================================================================
   EFFETS SONORES : un son par troupe (quand elle attaque), un son par pouvoir (les « ultimes »)
   et un petit générique par montée en âge. Tout est synthétisé par le navigateur (Web Audio),
   aucun fichier son.

     PA.Sons.attaque(unite)        // appelé par le combat à chaque attaque d'une unité
     PA.Sons.pouvoir(indexAge)     // appelé quand le pouvoir spécial est lancé
     PA.Sons.evolution(indexAge)   // appelé quand on passe à l'âge indexAge (1 à 10)
     PA.Sons.apercu('raptor')      // joue le son d'une troupe (réglages, essais)
     PA.Sons.rendre(fn, secondes)  // rendu hors ligne d'un son (mesures)

   Un son = une ou plusieurs « couches » : [famille, paramètres, retard]. Les familles (coup, lame, corde,
   arme à feu, laser, cri…) sont des recettes de synthèse ; chaque troupe a ses propres réglages (hauteur,
   durée, filtre) pour qu'on la reconnaisse. Le son d'un ennemi est plus discret que celui de tes troupes
   et placé de son côté de l'écran (stéréo).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = nom => {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(nom);
    return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };

  // ------------------------------------------------------------ banc : sortie, bruit, salle
  function banc(ctx, volume) {
    const out = ctx.createGain();
    out.gain.value = volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
    out.connect(comp); comp.connect(ctx.destination);
    const bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bruit.getChannelData(0);
    let graine = 987654321;
    for (let i = 0; i < d.length; i++) { graine = (graine * 1103515245 + 12345) & 0x7fffffff; d[i] = graine / 0x3fffffff - 1; }
    const n = Math.floor(ctx.sampleRate * 1.5), imp = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = imp.getChannelData(c);
      for (let i = 0; i < n; i++) { graine = (graine * 1103515245 + 12345) & 0x7fffffff; ch[i] = (graine / 0x3fffffff - 1) * Math.pow(1 - i / n, 3); }
    }
    const conv = ctx.createConvolver(); conv.buffer = imp;
    const salle = ctx.createGain(); salle.gain.value = 1;
    salle.connect(conv); conv.connect(out);
    return { ctx, out, bruit, salle };
  }

  // ------------------------------------------------------------ briques de synthèse
  const jit = () => (Sons.stable ? 1 : 1 + (Math.random() - 0.5) * 0.05);   // petite variation entre deux coups

  function sortie(B, g, o) {
    let n = g;
    if (o.pan && B.ctx.createStereoPanner) { const p = B.ctx.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); n = p; }
    n.connect(B.out);
    if (o.rev) { const s = B.ctx.createGain(); s.gain.value = o.rev; n.connect(s); s.connect(B.salle); }
  }

  // oscillateur : f0 → f1, enveloppe percutante (par défaut) ou tenue
  function osc(B, o) {
    const ctx = B.ctx, t = o.t, d = o.d, f0 = o.f0 * jit(), f1 = (o.f1 == null ? o.f0 : o.f1) * jit(), a = o.a == null ? 0.003 : o.a;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.vol, t + a);
    if (o.tenu) { g.gain.setValueAtTime(o.vol, t + Math.max(a, d - (o.rel || 0.06))); g.gain.linearRampToValueAtTime(0.0001, t + d); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const o1 = ctx.createOscillator();
    o1.type = o.type || 'sine';
    o1.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o1.frequency.exponentialRampToValueAtTime(f1, t + (o.sw || d));
    if (o.det) o1.detune.value = o.det;
    const fin = t + d + 0.05;
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(o1.detune); l.start(t); l.stop(fin); }
    if (o.fm) { const m = ctx.createOscillator(), mg = ctx.createGain(); m.frequency.value = f0 * o.fm[0]; mg.gain.value = o.fm[1]; m.connect(mg); mg.connect(o1.frequency); m.start(t); m.stop(fin); }
    if (o.am) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.am[0]; lg.gain.value = o.vol * o.am[1]; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(fin); }
    if (o.fl) {
      const bq = ctx.createBiquadFilter();
      bq.type = o.fl[0]; bq.Q.value = o.fl[3] || 0.8;
      bq.frequency.setValueAtTime(o.fl[1], t);
      if (o.fl[2] && o.fl[2] !== o.fl[1]) bq.frequency.exponentialRampToValueAtTime(o.fl[2], t + d);
      o1.connect(bq); bq.connect(g);
    } else o1.connect(g);
    sortie(B, g, o);
    o1.start(t); o1.stop(fin);
  }

  // bruit filtré
  function bruit(B, o) {
    const ctx = B.ctx, t = o.t, d = o.d, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = B.bruit; src.loop = true;
    fl.type = o.type || 'bandpass'; fl.Q.value = o.q || 0.8;
    fl.frequency.setValueAtTime(o.f0 * jit(), t);
    if (o.f1 && o.f1 !== o.f0) fl.frequency.exponentialRampToValueAtTime(o.f1 * jit(), t + d);
    const a = o.a == null ? 0.002 : o.a;
    g.gain.setValueAtTime(0.0001, t);
    if (o.gonfle) { g.gain.linearRampToValueAtTime(o.vol, t + o.gonfle); g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
    else { g.gain.linearRampToValueAtTime(o.vol, t + a); if (o.tenu) { g.gain.setValueAtTime(o.vol, t + Math.max(a, d - 0.08)); g.gain.linearRampToValueAtTime(0.0001, t + d); } else g.gain.exponentialRampToValueAtTime(0.0001, t + d); }
    if (o.am) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = o.am[0]; lg.gain.value = o.vol * o.am[1]; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(t + d + 0.05); }
    src.connect(fl); fl.connect(g);
    sortie(B, g, o);
    src.start(t); src.stop(t + d + 0.05);
  }

  // ------------------------------------------------------------ familles de sons
  // p : paramètres de la couche ; t : instant de départ ; v : volume de base ; o : { pan, rev }
  const FAM = {
    // coup sourd (massue, poing, sabot, queue d'ankylosaure) : une chute grave et un bruit étouffé
    coup(B, t, p, o) {
      osc(B, { ...o, t, type: 'sine', f0: p.f0, f1: p.f1, d: p.d, vol: 0.55 * p.v });
      bruit(B, { ...o, t, d: p.d * 0.6, type: 'lowpass', f0: p.fb || 900, f1: 120, vol: 0.4 * (p.b == null ? 1 : p.b) * p.v, q: 0.7 });
    },
    // souffle (lance, fronde, rapière, queue qui fouette)
    fouet(B, t, p, o) { bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: p.f0, f1: p.f1, q: p.q || 1.2, gonfle: p.d * 0.45, vol: 0.32 * p.v }); },
    // lame qui sonne : des harmoniques métalliques qui s'éteignent vite
    lame(B, t, p, o) {
      [1, 2.76, 5.4, 8.93].forEach((r, i) => osc(B, { ...o, t, type: 'sine', f0: p.f * r, d: p.d / (1 + i * 0.7), vol: (0.2 / (1 + i * 0.6)) * p.v }));
      bruit(B, { ...o, t, d: 0.03, type: 'highpass', f0: 3500, vol: 0.25 * p.v });
    },
    // corde d'arc ou d'arbalète : un claquement qui descend, un souffle de flèche
    corde(B, t, p, o) {
      osc(B, { ...o, t, type: 'triangle', f0: p.f0, f1: p.f1, d: p.d, vol: 0.4 * p.v });
      bruit(B, { ...o, t, d: 0.02, type: 'highpass', f0: 4000, vol: 0.2 * p.v });
      bruit(B, { ...o, t: t + 0.02, d: p.d * 1.1, type: 'bandpass', f0: p.f0 * 2, f1: p.f0 * 5, q: 1.5, gonfle: 0.05, vol: 0.12 * p.v });
    },
    // arme à feu : claquement, corps grave, queue de fumée ; n détonations rapprochées
    feu(B, t, p, o) {
      for (let i = 0; i < (p.n || 1); i++) {
        const ti = t + i * (p.gap || 0.07);
        bruit(B, { ...o, t: ti, d: p.d, type: 'bandpass', f0: p.f * 6, f1: p.f * 1.5, q: 0.6, vol: 0.55 * p.v });
        osc(B, { ...o, t: ti, type: 'sine', f0: p.f, f1: p.f * 0.35, d: p.d * 1.3, vol: 0.5 * p.v });
      }
      bruit(B, { ...o, t: t + 0.02, d: p.tail || 0.3, type: 'lowpass', f0: 2500, f1: 300, vol: 0.12 * p.v, rev: 0.25 });
    },
    // laser : un sifflement qui plonge
    laser(B, t, p, o) {
      for (let i = 0; i < (p.n || 1); i++) {
        osc(B, { ...o, t: t + i * (p.gap || 0.09), type: p.type || 'sawtooth', f0: p.f0, f1: p.f1, d: p.d, vol: 0.2 * p.v, fl: ['lowpass', p.f0 * 1.6, p.f1 * 1.5, 1], fm: p.fm });
      }
    },
    // orbe psychique ou plasma : un son qui ondule en montant
    orbe(B, t, p, o) {
      osc(B, { ...o, t, type: 'sine', f0: p.f0, f1: p.f1, d: p.d, vol: 0.3 * p.v, fm: [p.r || 1.5, p.depth || 220], vib: [p.vib || 9, 25], rev: 0.35, a: 0.02 });
    },
    // flamme : un souffle continu qui crépite
    flamme(B, t, p, o) {
      bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: 900, f1: 500, q: 0.5, gonfle: 0.08, vol: 0.4 * p.v, am: [28, 0.5] });
      bruit(B, { ...o, t, d: p.d, type: 'highpass', f0: 3500, vol: 0.1 * p.v, tenu: true });
    },
    // tronçonneuse : une scie qui vibre très vite
    scie(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f, f1: p.f * 1.15, d: p.d, vol: 0.28 * p.v, am: [p.am || 55, 0.8], fl: ['lowpass', 1800, 900, 1], tenu: true });
      bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: 2200, q: 1, vol: 0.12 * p.v, am: [p.am || 55, 0.8], tenu: true });
    },
    // cri d'animal : une voix qui monte avec des formants
    cri(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f0, f1: p.f1, d: p.d, vol: 0.3 * p.v, a: 0.01, vib: [p.vib || 22, 40], fl: ['bandpass', p.fo || 1400, (p.fo || 1400) * 1.6, p.q || 4], tenu: true });
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f0 * 0.5, f1: p.f1 * 0.5, d: p.d, vol: 0.15 * p.v, a: 0.01, fl: ['lowpass', 900, 500, 0.7], tenu: true });
    },
    // rugissement : grave, rauque, qui tremble
    grondement(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f, f1: p.f * 0.7, d: p.d, vol: 0.38 * p.v, a: 0.04, am: [p.am || 24, 0.6], fl: ['lowpass', 700, 260, 1.2], tenu: true, rel: 0.2 });
      bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: 500, f1: 250, q: 0.8, vol: 0.18 * p.v, am: [p.am || 24, 0.6], tenu: true, rev: 0.2 });
    },
    // barrissement / cor : un cuivre qui glisse
    cor(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f0, f1: p.f1, d: p.d, vol: 0.3 * p.v, a: p.a || 0.05, sw: p.d * 0.4, vib: [p.vib || 6, 14], det: 6, fl: ['lowpass', p.f0 * 3, p.f1 * 5, 1.5], tenu: true, rev: p.rev || 0.15 });
      if (p.bas) osc(B, { ...o, t, type: 'square', f0: p.f0 / 2, f1: p.f1 / 2, d: p.d, vol: 0.14 * p.v, a: p.a || 0.05, sw: p.d * 0.4, tenu: true, fl: ['lowpass', 500, 400, 1] });
    },
    // canon : une chute très grave, un souffle, un écho
    canon(B, t, p, o) {
      osc(B, { ...o, t, type: 'sine', f0: p.f, f1: p.f * 0.3, d: p.d, vol: 0.7 * p.v });
      bruit(B, { ...o, t, d: p.d * 0.7, type: 'lowpass', f0: 3000, f1: 150, vol: 0.55 * p.v, q: 0.6, rev: 0.3 });
      bruit(B, { ...o, t, d: 0.02, type: 'highpass', f0: 2500, vol: 0.3 * p.v });
    },
    // vapeur : un sifflement qui retombe, un cliquetis de métal
    vapeur(B, t, p, o) {
      bruit(B, { ...o, t, d: p.d, type: 'highpass', f0: p.f0, f1: p.f1 || p.f0, q: 0.6, a: 0.02, vol: 0.3 * p.v });
      if (p.clac) osc(B, { ...o, t, type: 'square', f0: p.clac, f1: p.clac * 0.6, d: 0.06, vol: 0.2 * p.v, fl: ['bandpass', p.clac * 2, p.clac * 2, 3] });
    },
    // catapulte : un grincement de bois, puis le lancer
    catapulte(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f0, f1: p.f1, d: p.d, vol: 0.14 * p.v, a: 0.05, fl: ['bandpass', 500, 900, 4], tenu: true });
      FAM.coup(B, t + p.d, { f0: 150, f1: 55, d: 0.3, v: p.v, b: 0.7 }, o);
    },
    // étincelles électriques : des craquements nerveux
    elec(B, t, p, o) {
      for (let i = 0; i < (p.n || 5); i++) bruit(B, { ...o, t: t + i * (p.gap || 0.035) + (i % 2) * 0.012, d: 0.035, type: 'bandpass', f0: p.f * (0.8 + (i % 3) * 0.4), q: 3, vol: 0.3 * p.v });
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f * 0.5, f1: p.f * 2.2, d: (p.n || 5) * (p.gap || 0.035) + 0.05, vol: 0.1 * p.v, fl: ['bandpass', p.f, p.f, 2] });
    },
    // onde de choc : très grave, qui s'étire
    onde(B, t, p, o) {
      osc(B, { ...o, t, type: 'sine', f0: p.f, f1: p.f * 0.4, d: p.d, vol: 0.65 * p.v, a: 0.008 });
      bruit(B, { ...o, t, d: p.d, type: 'lowpass', f0: 500, f1: 60, vol: 0.4 * p.v, q: 0.5, rev: 0.3 });
    },
    // moteur : un régime qui monte
    moteur(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f, f1: p.f * 1.9, d: p.d, vol: 0.26 * p.v, a: 0.03, am: [p.am || 38, 0.5], fl: ['lowpass', 600, 1500, 1], tenu: true });
      bruit(B, { ...o, t, d: p.d, type: 'lowpass', f0: 900, vol: 0.12 * p.v, tenu: true });
    },
    // grenade : un « pop » puis une explosion sourde
    grenade(B, t, p, o) {
      bruit(B, { ...o, t, d: 0.05, type: 'highpass', f0: 2500, vol: 0.3 * p.v });
      osc(B, { ...o, t, type: 'triangle', f0: 500, f1: 120, d: 0.1, vol: 0.3 * p.v });
      FAM.canon(B, t + p.dt, { f: p.f, d: p.d, v: p.v * 0.8 }, o);
    },
    // pas lourd d'une machine : un choc et une résonance de métal
    pas(B, t, p, o) {
      FAM.coup(B, t, { f0: p.f, f1: p.f * 0.4, d: 0.22, v: p.v, b: 0.5, fb: 600 }, o);
      FAM.lame(B, t + 0.005, { f: p.ring, d: 0.35, v: p.v * 0.5 }, o);
    },
    // sabot de cheval : deux chocs rapprochés
    sabot(B, t, p, o) {
      FAM.coup(B, t, { f0: p.f, f1: p.f * 0.5, d: 0.1, v: p.v, b: 0.8, fb: 1500 }, o);
      FAM.coup(B, t + 0.09, { f0: p.f * 1.2, f1: p.f * 0.6, d: 0.1, v: p.v * 0.8, b: 0.8, fb: 1500 }, o);
    },
    // griffes : deux balayages aigus
    griffes(B, t, p, o) {
      bruit(B, { ...o, t, d: 0.1, type: 'bandpass', f0: p.f, f1: p.f * 2.2, q: 2.5, gonfle: 0.03, vol: 0.3 * p.v });
      bruit(B, { ...o, t: t + 0.06, d: 0.1, type: 'bandpass', f0: p.f * 1.2, f1: p.f * 2.6, q: 2.5, gonfle: 0.03, vol: 0.26 * p.v });
    },
    // lame d'énergie : un ronflement qui balaie
    sabreE(B, t, p, o) {
      osc(B, { ...o, t, type: 'sawtooth', f0: p.f0, f1: p.f1, d: p.d, vol: 0.22 * p.v, a: 0.01, fl: ['lowpass', 1200, 2400, 2], vib: [30, 30], tenu: true });
      bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: 1800, f1: 4000, q: 2, vol: 0.12 * p.v, gonfle: 0.04 });
    },
    // flûte d'os / sifflet de chaman (utilisée aussi par les pouvoirs)
    souffle(B, t, p, o) {
      osc(B, { ...o, t, type: 'sine', f0: p.f0, f1: p.f1, d: p.d, vol: 0.25 * p.v, a: 0.03, vib: [6, 20], tenu: true });
      bruit(B, { ...o, t, d: p.d, type: 'bandpass', f0: p.f0 * 2, q: 4, vol: 0.06 * p.v, tenu: true });
    },
    // morsure : un grognement qui précède, des mâchoires qui claquent (deux micro-clics), un craquement d'os
    // (bruit haché), le poids du corps. n : nombre de coups de mâchoire, f : hauteur du craquement,
    // click : aigu du claquement, corps : grave, cr : vitesse du craquement, g : grognement (0 = aucun)
    morsure(B, t, p, o) {
      const n = p.n || 1, gap = p.gap || 0.07, deb = p.g ? 0.06 : 0;
      if (p.g) osc(B, { ...o, t, type: 'sawtooth', f0: p.g, f1: p.g * 0.8, d: p.gd || 0.22, vol: 0.22 * p.v, a: 0.02, am: [p.gam || 28, 0.7], fl: ['bandpass', p.g * 5, p.g * 3, 2], tenu: true, rev: 0.15 });
      for (let i = 0; i < n; i++) {
        const ti = t + deb + i * gap;
        bruit(B, { ...o, t: ti, d: 0.012, type: 'highpass', f0: p.click || 2500, vol: 0.5 * p.v });
        bruit(B, { ...o, t: ti + 0.022, d: 0.012, type: 'highpass', f0: (p.click || 2500) * 1.2, vol: 0.4 * p.v });
        bruit(B, { ...o, t: ti + 0.012, d: 0.14, type: 'bandpass', f0: p.f, f1: p.f * 0.45, q: 1.6, vol: 0.5 * p.v, am: [p.cr || 70, 0.9] });
        osc(B, { ...o, t: ti + 0.01, type: 'sine', f0: p.corps || 140, f1: (p.corps || 140) * 0.45, d: 0.12, vol: 0.4 * p.v });
      }
    },
    // crachat : un jet humide
    crachat(B, t, p, o) {
      bruit(B, { ...o, t, d: 0.14, type: 'bandpass', f0: p.f, f1: p.f * 0.4, q: 1.8, gonfle: 0.02, vol: 0.4 * p.v });
      osc(B, { ...o, t, type: 'sine', f0: p.f * 0.4, f1: p.f * 0.12, d: 0.12, vol: 0.25 * p.v });
    },
  };

  // ------------------------------------------------------------ un son par troupe
  // couche = [famille, paramètres, retard en secondes]
  const L = (f, p, dt) => [f, p, dt || 0];
  const TROUPES = {
    // --- Jurassique
    'raptor':        [L('morsure', { n: 2, gap: 0.09, f: 1300, click: 3200, corps: 170, cr: 80, g: 520, gd: 0.2, gam: 40 })],
    'cracheur':      [L('crachat', { f: 900 }), L('orbe', { f0: 180, f1: 760, d: 0.1, r: 1, depth: 60, vib: 30 }, 0.1)],
    'tricera':       [L('coup', { f0: 150, f1: 50, d: 0.3, b: 0.6 }), L('grondement', { f: 95, d: 0.3, am: 18 }, 0.02)],
    'ankylosaure':   [L('fouet', { f0: 300, f1: 800, d: 0.14, q: 1 }), L('coup', { f0: 90, f1: 38, d: 0.45, b: 0.9, fb: 500 }, 0.12), L('lame', { f: 190, d: 0.14 }, 0.13)],
    'roi-tyran':     [L('morsure', { n: 1, f: 380, click: 1200, corps: 70, cr: 45, g: 60, gd: 0.6, gam: 16 }), L('grondement', { f: 55, d: 0.8, am: 15 }, 0.1)],
    // --- Pierre
    'cogneur':       [L('fouet', { f0: 400, f1: 700, d: 0.12 }), L('coup', { f0: 150, f1: 58, d: 0.24, b: 0.3, fb: 800 }, 0.09), L('crachat', { f: 1300 }, 0.09)],
    'frondeur':      [L('fouet', { f0: 350, f1: 1900, d: 0.3, q: 1.6 }), L('coup', { f0: 600, f1: 300, d: 0.05, b: 1.4, fb: 3000 }, 0.3)],
    'mammouth':      [L('cri', { f0: 140, f1: 420, d: 0.45, fo: 800, q: 2, vib: 14 }), L('souffle', { f0: 200, f1: 300, d: 0.3 }, 0.05), L('coup', { f0: 70, f1: 32, d: 0.4, b: 0.6 }, 0.2)],
    'chaman':        [L('orbe', { f0: 330, f1: 520, d: 0.35, r: 2, depth: 90, vib: 7 }), L('vapeur', { f0: 6000, d: 0.2 }, 0.02)],
    'chef-clan':     [L('cri', { f0: 220, f1: 150, d: 0.3, fo: 700, q: 3, vib: 14 }), L('coup', { f0: 130, f1: 48, d: 0.3, b: 0.7 }, 0.12)],
    // --- Antiquité
    'hoplite':       [L('fouet', { f0: 700, f1: 1500, d: 0.1 }), L('coup', { f0: 260, f1: 110, d: 0.08, b: 0.3 }, 0.07), L('lame', { f: 380, d: 0.55 }, 0.07)],
    'archer':        [L('corde', { f0: 620, f1: 200, d: 0.32 }), L('fouet', { f0: 1500, f1: 5200, d: 0.35, q: 1.5 }, 0.03)],
    'char-guerre':   [L('sabot', { f: 190 }), L('sabot', { f: 210 }, 0.2), L('coup', { f0: 330, f1: 140, d: 0.07, b: 1.2, fb: 2500 }, 0.4)],
    'elephant':      [L('cor', { f0: 240, f1: 520, d: 0.65, vib: 7, rev: 0.3 }), L('coup', { f0: 65, f1: 30, d: 0.35, b: 0.5 }, 0.25)],
    'imperator':     [L('cor', { f0: 255, f1: 260, d: 0.5, a: 0.015, rev: 0.4 }), L('cor', { f0: 170, f1: 172, d: 0.5, a: 0.015, bas: true, rev: 0.4 }), L('lame', { f: 1100, d: 0.5 }, 0.32)],
    // --- Médiéval
    'fantassin':     [L('fouet', { f0: 1500, f1: 4000, d: 0.12, q: 1.5 }), L('lame', { f: 1250, d: 0.26 }, 0.08)],
    'arbaletrier':   [L('corde', { f0: 1300, f1: 180, d: 0.13 }), L('coup', { f0: 320, f1: 150, d: 0.04, b: 1.5, fb: 3500 })],
    'chevalier':     [L('sabot', { f: 140 }), L('sabot', { f: 150 }, 0.2), L('coup', { f0: 260, f1: 100, d: 0.1, b: 2, fb: 4000 }, 0.36), L('lame', { f: 280, d: 0.35 }, 0.36)],
    'mangonneau':    [L('catapulte', { f0: 130, f1: 210, d: 0.32 })],
    'seigneur':      [L('sabot', { f: 120 }), L('lame', { f: 240, d: 0.45 }, 0.18), L('cor', { f0: 150, f1: 150, d: 0.4, a: 0.01, bas: true }, 0.18)],
    // --- Renaissance
    'bretteur':      [L('fouet', { f0: 1800, f1: 6000, d: 0.12, q: 2.5 }), L('lame', { f: 2300, d: 0.4 }, 0.1), L('lame', { f: 3100, d: 0.25 }, 0.2)],
    'arquebusier':   [L('vapeur', { f0: 6000, d: 0.07 }), L('feu', { f: 190, d: 0.28, tail: 0.7 }, 0.06)],
    'cuirassier':    [L('sabot', { f: 170 }), L('fouet', { f0: 1200, f1: 5000, d: 0.18, q: 1.8 }, 0.1), L('lame', { f: 1050, d: 0.3 }, 0.16), L('lame', { f: 1500, d: 0.2 }, 0.22)],
    'grenadier':     [L('grenade', { f: 140, d: 0.3, dt: 0.24 }), L('laser', { f0: 1200, f1: 380, d: 0.22, type: 'sine' }, 0.03)],
    'condottiere':   [L('sabot', { f: 115 }), L('lame', { f: 530, d: 0.4 }, 0.15), L('cor', { f0: 260, f1: 330, d: 0.3, a: 0.02 }, 0.12)],
    // --- Vapeur
    'mecano':        [L('lame', { f: 250, d: 0.2 }), L('lame', { f: 390, d: 0.16 }, 0.1), L('coup', { f0: 190, f1: 90, d: 0.09, b: 0.6, fb: 2000 }, 0.1)],
    'fusilier-vapeur': [L('vapeur', { f0: 3200, f1: 1500, d: 0.2, clac: 900 }), L('coup', { f0: 420, f1: 160, d: 0.07 }, 0.02)],
    'automate':      [L('pas', { f: 140, ring: 440 }), L('pas', { f: 170, ring: 520 }, 0.13), L('vapeur', { f0: 2200, f1: 1200, d: 0.22 }, 0.2)],
    'araignee':      [L('lame', { f: 900, d: 0.05 }), L('lame', { f: 1150, d: 0.05 }, 0.06), L('lame', { f: 1350, d: 0.05 }, 0.12), L('vapeur', { f0: 2500, f1: 900, d: 0.3, clac: 520 }, 0.16), L('catapulte', { f0: 300, f1: 520, d: 0.14 }, 0.26)],
    'colosse-fonte': [L('pas', { f: 80, ring: 95 }), L('cor', { f0: 200, f1: 180, d: 0.5, a: 0.02, bas: true }, 0.12), L('vapeur', { f0: 1800, d: 0.4 }, 0.2)],
    // --- Moderne
    'sapeur':        [L('fouet', { f0: 1200, f1: 3500, d: 0.07, q: 2 }), L('lame', { f: 880, d: 0.15 }, 0.05), L('coup', { f0: 200, f1: 80, d: 0.08 }, 0.05)],
    'tireur':        [L('feu', { f: 260, d: 0.12, tail: 0.2 }), L('lame', { f: 2400, d: 0.04 }, 0.26)],
    'char':          [L('canon', { f: 78, d: 0.55 }), L('pas', { f: 60, ring: 140 }, 0.2), L('lame', { f: 700, d: 0.05 }, 0.28), L('lame', { f: 920, d: 0.05 }, 0.35), L('lame', { f: 760, d: 0.05 }, 0.42), L('moteur', { f: 50, d: 0.4, am: 26 }, 0.15)],
    'lance-flammes': [L('flamme', { d: 0.45 })],
    'commandant':    [L('moteur', { f: 55, d: 0.6, am: 20 }), L('canon', { f: 58, d: 0.8 }, 0.35), L('pas', { f: 50, ring: 120 }, 0.55)],
    // --- Héros
    'justicier':     [L('fouet', { f0: 900, f1: 2600, d: 0.07, q: 2 }), L('coup', { f0: 330, f1: 120, d: 0.1, b: 1, fb: 3500 }, 0.05), L('lame', { f: 2600, d: 0.3 }, 0.05)],
    'foudroyeur':    [L('elec', { f: 2600, n: 6, gap: 0.03 })],
    'colosse':       [L('cri', { f0: 110, f1: 190, d: 0.25, fo: 500, q: 2, vib: 10 }), L('coup', { f0: 200, f1: 46, d: 0.4, b: 1.2, fb: 1200 }, 0.2), L('onde', { f: 70, d: 0.4 }, 0.2)],
    'sismique':      [L('onde', { f: 46, d: 1.3 }), L('coup', { f0: 100, f1: 34, d: 0.5, b: 1.2, fb: 350 }, 0.05), L('crachat', { f: 500 }, 0.3), L('crachat', { f: 380 }, 0.5), L('crachat', { f: 620 }, 0.7)],
    'capitaine':     [L('cor', { f0: 330, f1: 440, d: 0.3, a: 0.01, rev: 0.3 }), L('coup', { f0: 150, f1: 45, d: 0.3 }, 0.12), L('elec', { f: 1800, n: 4, gap: 0.04 }, 0.14), L('lame', { f: 1500, d: 0.4 }, 0.12)],
    // --- Post-apocalypse
    'pillard':       [L('scie', { f: 130, d: 0.4, am: 60 })],
    'ferrailleur':   [L('feu', { f: 105, d: 0.4, tail: 0.6 }), L('coup', { f0: 90, f1: 40, d: 0.3, b: 0.2 }), L('lame', { f: 1800, d: 0.05 }, 0.45), L('lame', { f: 2100, d: 0.05 }, 0.6)],
    'camion':        [L('moteur', { f: 70, d: 0.7, am: 45 }), L('cor', { f0: 310, f1: 305, d: 0.12, a: 0.01 }, 0.3), L('cor', { f0: 310, f1: 305, d: 0.16, a: 0.01 }, 0.46), L('crachat', { f: 300 }, 0.62)],
    'artificier':    [L('coup', { f0: 220, f1: 70, d: 0.14, b: 0.5, fb: 1800 }), L('fouet', { f0: 400, f1: 3200, d: 0.5, q: 0.9 }, 0.05), L('canon', { f: 66, d: 0.8 }, 0.55)],
    'seigneur-ruines': [L('moteur', { f: 45, d: 0.7, am: 22 }), L('cor', { f0: 120, f1: 110, d: 0.6, a: 0.03, bas: true, rev: 0.3 }, 0.1), L('coup', { f0: 70, f1: 30, d: 0.4 }, 0.5)],
    // --- Futur
    'gardien':       [L('sabreE', { f0: 150, f1: 520, d: 0.28 })],
    'fusilier-laser': [L('laser', { f0: 4200, f1: 700, d: 0.11, n: 2, gap: 0.13, type: 'square' })],
    'marcheur':      [L('pas', { f: 100, ring: 360 }), L('elec', { f: 3200, n: 3, gap: 0.03 }, 0.08)],
    'drone':         [L('laser', { f0: 2200, f1: 2200, d: 0.05, n: 4, gap: 0.09, type: 'sine' }), L('elec', { f: 900, n: 3, gap: 0.05 }, 0.02)],
    'titan':         [L('pas', { f: 58, ring: 190 }), L('laser', { f0: 900, f1: 90, d: 0.7, type: 'sawtooth' }, 0.1)],
    // --- Alien
    'rodeur':        [L('morsure', { n: 3, gap: 0.05, f: 2000, click: 4200, corps: 220, cr: 100, g: 900, gd: 0.12, gam: 60 }), L('griffes', { f: 2200 }, 0.02)],
    'tireur-gris':   [L('laser', { f0: 1300, f1: 260, d: 0.42, fm: [0.25, 520] }), L('orbe', { f0: 500, f1: 700, d: 0.4, r: 0.5, depth: 120, vib: 14 }, 0.0)],
    'tripode':       [L('cor', { f0: 90, f1: 62, d: 0.7, a: 0.02, bas: true, rev: 0.4 }), L('laser', { f0: 1400, f1: 200, d: 0.5, type: 'sawtooth' }, 0.15)],
    'psion':         [L('orbe', { f0: 260, f1: 980, d: 0.6, r: 1.5, depth: 180, vib: 5 })],
    'tripode-imperial': [L('cor', { f0: 70, f1: 48, d: 0.9, a: 0.02, bas: true, rev: 0.5 }), L('onde', { f: 45, d: 0.7 }, 0.1), L('laser', { f0: 1200, f1: 120, d: 0.7 }, 0.2)],
  };

  // ------------------------------------------------------------ un son par tourelle (3 par âge)
  // Les tourelles tirent souvent (jusqu'à 5 fois par seconde) : leurs sons sont courts et plus discrets que ceux des troupes.
  const TOURELLES = {
    // --- Jurassique
    'lance-epines':  [L('corde', { f0: 900, f1: 300, d: 0.12 }), L('fouet', { f0: 2500, f1: 6000, d: 0.09, q: 2 }, 0.02)],
    'canon-ambre':   [L('crachat', { f: 500 }), L('canon', { f: 150, d: 0.25 }, 0.02), L('lame', { f: 1400, d: 0.2 }, 0.03)],
    'geyser':        [L('vapeur', { f0: 1800, f1: 600, d: 0.5 }), L('onde', { f: 80, d: 0.4 }), L('flamme', { d: 0.3 }, 0.05)],
    // --- Pierre
    'lance-pierres': [L('fouet', { f0: 500, f1: 1800, d: 0.15 }), L('coup', { f0: 700, f1: 350, d: 0.05, b: 1.5, fb: 3500 }, 0.15)],
    'silex':         [L('coup', { f0: 500, f1: 300, d: 0.06, b: 1, fb: 2500 }), L('lame', { f: 1700, d: 0.06 }, 0.04)],
    'catapulte':     [L('catapulte', { f0: 110, f1: 190, d: 0.35 })],
    // --- Antiquité
    'scorpion':      [L('corde', { f0: 420, f1: 180, d: 0.1 }), L('coup', { f0: 300, f1: 140, d: 0.04, b: 1.2, fb: 2500 })],
    'miroir':        [L('orbe', { f0: 1500, f1: 3000, d: 0.5, r: 1, depth: 150, vib: 12 }), L('elec', { f: 4000, n: 3, gap: 0.05 }, 0.1)],
    'onagre':        [L('catapulte', { f0: 90, f1: 150, d: 0.45 }), L('souffle', { f0: 150, f1: 220, d: 0.3 }, 0.05)],
    // --- Médiéval
    'baliste':       [L('corde', { f0: 300, f1: 90, d: 0.25 }), L('coup', { f0: 200, f1: 70, d: 0.12, b: 0.8, fb: 1500 }), L('fouet', { f0: 700, f1: 2400, d: 0.2 }, 0.04)],
    'catapulte-feu': [L('catapulte', { f0: 100, f1: 170, d: 0.3 }), L('flamme', { d: 0.3 }, 0.3)],
    'huile':         [L('vapeur', { f0: 3500, f1: 2000, d: 0.4 }), L('crachat', { f: 700 }, 0.05), L('flamme', { d: 0.2 }, 0.1)],
    // --- Renaissance
    'fauconneau':    [L('canon', { f: 150, d: 0.3 }), L('vapeur', { f0: 5000, f1: 3500, d: 0.18 }, 0.04), L('crachat', { f: 1800 }, 0.08)],
    'mortier':       [L('canon', { f: 85, d: 0.5 }), L('fouet', { f0: 800, f1: 300, d: 0.5, q: 0.9 }, 0.1)],
    'orgue':         [L('feu', { f: 170, d: 0.1, n: 5, gap: 0.04, tail: 0.2 }), L('vapeur', { f0: 4500, f1: 3000, d: 0.12 }, 0.2)],
    // --- Vapeur
    'manivelle':     [L('feu', { f: 320, d: 0.07, tail: 0.1 }), L('lame', { f: 600, d: 0.05 })],
    'canon-vapeur':  [L('vapeur', { f0: 4000, f1: 2000, d: 0.25 }), L('canon', { f: 120, d: 0.4 }, 0.05)],
    'mortier-chaudieres': [L('canon', { f: 70, d: 0.6 }), L('vapeur', { f0: 2500, f1: 900, d: 0.6 }, 0.05), L('lame', { f: 120, d: 0.5 }, 0.05)],
    // --- Moderne
    'mitrailleuse':  [L('feu', { f: 280, d: 0.08, n: 2, gap: 0.06, tail: 0.1 })],
    'antichar':      [L('feu', { f: 130, d: 0.3, tail: 0.5 }), L('lame', { f: 900, d: 0.45 }, 0.03), L('lame', { f: 3000, d: 0.05 })],
    'roquettes':     [L('fouet', { f0: 300, f1: 2800, d: 0.6, q: 0.9 }), L('flamme', { d: 0.5 }, 0.03), L('coup', { f0: 200, f1: 80, d: 0.12 })],
    // --- Héros
    'lance-etoiles': [L('laser', { f0: 3800, f1: 2000, d: 0.08, type: 'sine' }), L('orbe', { f0: 3000, f1: 4500, d: 0.1, r: 1, depth: 300, vib: 20 })],
    'canon-sonique': [L('orbe', { f0: 220, f1: 110, d: 0.55, r: 1, depth: 500, vib: 8 }), L('onde', { f: 150, d: 0.6 }, 0.05), L('lame', { f: 90, d: 0.3 })],
    'tour-tesla':    [L('elec', { f: 2200, n: 8, gap: 0.035 }), L('onde', { f: 90, d: 0.3 })],
    // --- Post-apocalypse
    'tourelle-ferraille':[L('feu', { f: 140, d: 0.12, n: 2, gap: 0.09, tail: 0.2 }), L('lame', { f: 260, d: 0.1 }, 0.02), L('lame', { f: 410, d: 0.08 }, 0.1)],
    'harpon':        [L('corde', { f0: 200, f1: 70, d: 0.3 }), L('fouet', { f0: 600, f1: 200, d: 0.35 }, 0.03), L('lame', { f: 500, d: 0.06 }, 0.1), L('lame', { f: 560, d: 0.06 }, 0.16), L('lame', { f: 620, d: 0.06 }, 0.22)],
    'catapulte-bidons': [L('catapulte', { f0: 100, f1: 160, d: 0.3 }), L('lame', { f: 150, d: 0.3 }, 0.35)],
    // --- Futur
    'tourelle-laser':[L('laser', { f0: 3600, f1: 900, d: 0.12, type: 'square', fm: [2, 500] })],
    'canon-ions':    [L('laser', { f0: 700, f1: 120, d: 0.5, type: 'sawtooth' }), L('onde', { f: 100, d: 0.4 }, 0.02)],
    'lance-plasma':  [L('orbe', { f0: 300, f1: 1400, d: 0.4, r: 2, depth: 400, vib: 8 }), L('flamme', { d: 0.25 }, 0.05)],
    // --- Alien
    'tourelle-rayons': [L('orbe', { f0: 1800, f1: 900, d: 0.1, r: 0.5, depth: 200, vib: 18 })],
    'canon-antimatiere': [L('onde', { f: 60, d: 0.6 }), L('laser', { f0: 2400, f1: 80, d: 0.6, type: 'sine' }), L('orbe', { f0: 300, f1: 700, d: 0.5, r: 1.5, depth: 200, vib: 6 }, 0.05)],
    'cracheur-spores': [L('crachat', { f: 450 }), L('orbe', { f0: 200, f1: 600, d: 0.25, r: 1, depth: 80, vib: 20 }, 0.05)],
  };
  // Gains mesurés avec Mesures.niveauxTourelles() (outils/mesurer-sons.js) ; à refaire si on change une recette.
  const NIVEAUX_TOURELLES = {'lance-epines':2,'canon-ambre':0.6,'geyser':0.73,'lance-pierres':0.56,'silex':0.96,'catapulte':0.59,'scorpion':1.29,'miroir':2.03,'onagre':0.62,'baliste':1.15,'catapulte-feu':0.48,'huile':0.97,'fauconneau':0.84,'mortier':0.96,'orgue':0.49,'manivelle':1.2,'canon-vapeur':0.39,'mortier-chaudieres':0.46,'mitrailleuse':0.62,'antichar':0.75,'roquettes':0.97,'lance-etoiles':1.89,'canon-sonique':0.49,'tour-tesla':1.26,'tourelle-ferraille':0.42,'harpon':0.55,'catapulte-bidons':0.53,'tourelle-laser':4,'canon-ions':0.78,'lance-plasma':0.93,'tourelle-rayons':2.16,'canon-antimatiere':0.61,'cracheur-spores':1.27};
  // Gain de chaque troupe : mesuré avec outils/mesurer-sons.js (Mesures.niveaux()) pour que toutes aient le même volume
  // (les très grosses un peu plus fort). À refaire si on change une recette ci-dessus.
  const NIVEAUX = {'raptor':0.51,'cracheur':1.1,'tricera':0.49,'ankylosaure':0.56,'roi-tyran':0.6,'cogneur':0.56,'frondeur':0.53,'mammouth':0.39,'chaman':0.81,'chef-clan':0.49,'hoplite':0.45,'archer':1.63,'char-guerre':0.47,'elephant':0.42,'imperator':0.35,'fantassin':0.67,'arbaletrier':1.07,'chevalier':0.33,'mangonneau':0.55,'seigneur':0.54,'bretteur':0.61,'arquebusier':0.52,'cuirassier':0.66,'grenadier':0.47,'condottiere':0.51,'mecano':0.44,'fusilier-vapeur':0.71,'automate':0.6,'araignee':0.53,'colosse-fonte':0.59,'sapeur':0.44,'tireur':0.7,'char':0.55,'lance-flammes':1.04,'commandant':0.42,'justicier':0.53,'foudroyeur':3.66,'colosse':0.46,'sismique':0.6,'capitaine':0.3,'pillard':0.54,'ferrailleur':0.71,'camion':0.6,'artificier':0.36,'seigneur-ruines':0.47,'gardien':1.22,'fusilier-laser':1.3,'marcheur':1.28,'drone':1.33,'titan':2.1,'rodeur':0.45,'tireur-gris':1.59,'tripode':0.72,'psion':2,'tripode-imperial':0.71};

  // ------------------------------------------------------------ un son par pouvoir (11 âges)
  // fonction (B, t, v) : v = volume. Chacune dure environ 2 à 3 secondes.
  const NIVEAU_POUVOIR = [0.6, 1.2, 0.9, 1.3, 0.6, 1.0, 0.95, 0.8, 1.05, 0.8, 0.95];
  const POUVOIRS = [
    // 0 Jurassique : pluie de météores
    (B, t, v) => {
      bruit(B, { t, d: 1.3, type: 'lowpass', f0: 90, f1: 380, q: 0.5, gonfle: 1.1, vol: 0.5 * v });
      osc(B, { t: t + 0.1, type: 'sine', f0: 1800, f1: 160, d: 1.0, vol: 0.18 * v, rev: 0.2, tenu: true });
      [1.05, 1.45, 1.75, 2.1, 2.4].forEach((dt, i) => FAM.canon(B, t + dt, { f: 120 - i * 10, d: 0.6, v: v * (1 - i * 0.12) }, { rev: 0.3 }));
    },
    // 1 Pierre : éboulement
    (B, t, v) => {
      bruit(B, { t, d: 1.8, type: 'lowpass', f0: 140, f1: 70, q: 0.5, gonfle: 0.4, vol: 0.55 * v, am: [11, 0.4] });
      for (let i = 0; i < 14; i++) bruit(B, { t: t + 0.2 + i * 0.1 + (i % 3) * 0.02, d: 0.09, type: 'bandpass', f0: 500 + (i * 137) % 900, q: 2, vol: 0.25 * v });
      FAM.coup(B, t + 0.5, { f0: 100, f1: 38, d: 0.5, v, b: 1, fb: 500 }, { rev: 0.2 });
      FAM.coup(B, t + 1.2, { f0: 85, f1: 32, d: 0.6, v, b: 1, fb: 400 }, { rev: 0.3 });
    },
    // 2 Antiquité : charge des éléphants
    (B, t, v) => {
      FAM.cor(B, t, { f0: 250, f1: 560, d: 0.7, v, vib: 7, rev: 0.35 }, {});
      FAM.cor(B, t + 0.35, { f0: 200, f1: 430, d: 0.8, v: v * 0.8, vib: 6, rev: 0.35 }, { pan: -0.3 });
      for (let i = 0; i < 10; i++) FAM.coup(B, t + 0.5 + i * 0.16, { f0: 75 + (i % 2) * 15, f1: 34, d: 0.2, v: v * 0.9, b: 0.8, fb: 500 }, {});
    },
    // 3 Médiéval : volée de flèches
    (B, t, v) => {
      [0, 0.12, 0.26].forEach(dt => bruit(B, { t: t + dt, d: 0.9, type: 'bandpass', f0: 800, f1: 3500, q: 1.2, gonfle: 0.55, vol: 0.3 * v }));
      FAM.corde(B, t, { f0: 800, f1: 220, d: 0.25, v }, {});
      for (let i = 0; i < 16; i++) FAM.coup(B, t + 1.0 + i * 0.045 + (i % 4) * 0.02, { f0: 520 + (i * 53) % 300, f1: 200, d: 0.05, v: v * 0.8, b: 1.5, fb: 3000 }, { pan: ((i % 5) - 2) * 0.25 });
    },
    // 4 Renaissance : bombardement
    (B, t, v) => {
      [0, 0.4, 0.7, 1.05, 1.4].forEach((dt, i) => {
        FAM.canon(B, t + dt, { f: 100 - i * 6, d: 0.55, v }, { pan: (i % 2 ? 0.2 : -0.2), rev: 0.3 });
        osc(B, { t: t + dt + 0.15, type: 'sine', f0: 1500, f1: 300, d: 0.5, vol: 0.08 * v, tenu: true });
        FAM.canon(B, t + dt + 0.7, { f: 80, d: 0.45, v: v * 0.7 }, { pan: (i % 2 ? -0.4 : 0.4) });
      });
    },
    // 5 Vapeur : raid de dirigeable
    (B, t, v) => {
      osc(B, { t, type: 'sawtooth', f0: 140, f1: 143, d: 1.3, vol: 0.3 * v, a: 0.05, tenu: true, rel: 0.3, rev: 0.3, fl: ['lowpass', 900, 700, 1] });
      osc(B, { t, type: 'sawtooth', f0: 210, f1: 214, d: 1.3, vol: 0.2 * v, a: 0.05, tenu: true, rel: 0.3, rev: 0.3, fl: ['lowpass', 1200, 900, 1] });
      osc(B, { t: t + 0.3, type: 'sawtooth', f0: 52, f1: 58, d: 2.4, vol: 0.2 * v, am: [22, 0.5], tenu: true, rel: 0.4, fl: ['lowpass', 400, 400, 1] });
      for (let i = 0; i < 6; i++) { FAM.vapeur(B, t + 1.0 + i * 0.28, { f0: 3000, f1: 1000, d: 0.25, v: v * 0.8 }, {}); FAM.canon(B, t + 1.25 + i * 0.28, { f: 90, d: 0.4, v: v * 0.8 }, { pan: (i - 2.5) * 0.18 }); }
    },
    // 6 Moderne : frappe aérienne
    (B, t, v) => {
      bruit(B, { t, d: 1.6, type: 'bandpass', f0: 300, f1: 2200, q: 0.9, gonfle: 0.9, vol: 0.45 * v, pan: -0.6 });
      bruit(B, { t: t + 1.0, d: 1.2, type: 'bandpass', f0: 2200, f1: 250, q: 0.9, gonfle: 0.05, vol: 0.3 * v, pan: 0.6 });
      [1.1, 1.4, 1.7, 2.1].forEach((dt, i) => { osc(B, { t: t + dt - 0.35, type: 'sine', f0: 2200, f1: 260, d: 0.35, vol: 0.1 * v, tenu: true }); FAM.canon(B, t + dt, { f: 105 - i * 8, d: 0.6, v }, { rev: 0.3, pan: (i - 1.5) * 0.3 }); });
    },
    // 7 Héros : poings célestes
    (B, t, v) => {
      [262, 330, 392, 523].forEach((f, i) => osc(B, { t, type: 'sine', f0: f, f1: f * 1.02, d: 1.1, vol: 0.14 * v, a: 0.5, tenu: true, rel: 0.4, vib: [5, 14], rev: 0.5 }));
      FAM.onde(B, t + 0.95, { f: 85, d: 1.1, v }, { rev: 0.4 });
      FAM.coup(B, t + 0.95, { f0: 160, f1: 40, d: 0.4, v, b: 1.2 }, {});
      [1.35, 1.6, 1.85].forEach((dt, i) => FAM.coup(B, t + dt, { f0: 120 - i * 15, f1: 36, d: 0.35, v: v * (0.8 - i * 0.15), b: 0.8 }, { pan: (i - 1) * 0.3 }));
      for (let i = 0; i < 6; i++) osc(B, { t: t + 1.0 + i * 0.07, type: 'sine', f0: 2000 + i * 330, d: 0.5, vol: 0.05 * v, rev: 0.5 });
    },
    // 8 Post-apo : bidons explosifs
    (B, t, v) => {
      for (let i = 0; i < 8; i++) {
        const dt = i * 0.24 + (i % 2) * 0.05;
        FAM.lame(B, t + dt, { f: 160 + (i % 3) * 40, d: 0.22, v: v * 0.8 }, { pan: (i - 3.5) * 0.18 });
        FAM.canon(B, t + dt + 0.12, { f: 110 - (i % 3) * 12, d: 0.45, v: v * 0.85 }, { pan: (i - 3.5) * 0.18, rev: 0.2 });
        FAM.flamme(B, t + dt + 0.14, { d: 0.35, v: v * 0.5 }, {});
      }
    },
    // 9 Futur : frappe orbitale
    (B, t, v) => {
      osc(B, { t, type: 'sine', f0: 200, f1: 2600, d: 1.1, vol: 0.2 * v, am: [14, 0.6], tenu: true, rel: 0.1, rev: 0.3 });
      osc(B, { t: t + 1.05, type: 'sawtooth', f0: 1300, f1: 900, d: 0.7, vol: 0.22 * v, tenu: true, rel: 0.3, fl: ['lowpass', 3000, 800, 1.5], rev: 0.4 });
      bruit(B, { t: t + 1.05, d: 0.7, type: 'bandpass', f0: 4000, f1: 1000, q: 1, vol: 0.2 * v });
      FAM.onde(B, t + 1.05, { f: 70, d: 1.0, v }, { rev: 0.4 });
      FAM.elec(B, t + 1.15, { f: 3000, n: 10, gap: 0.05, v: v * 0.8 }, {});
    },
    // 10 Alien : rayons d'abduction
    (B, t, v) => {
      osc(B, { t, type: 'sine', f0: 300, f1: 900, d: 1.2, vol: 0.28 * v, fm: [1.5, 260], vib: [7, 30], rev: 0.5, a: 0.15, tenu: true, rel: 0.3 });
      osc(B, { t: t + 0.4, type: 'sine', f0: 900, f1: 280, d: 1.4, vol: 0.2 * v, fm: [2, 200], vib: [5, 40], rev: 0.5, a: 0.1, tenu: true, rel: 0.4 });
      osc(B, { t, type: 'triangle', f0: 70, f1: 66, d: 2.2, vol: 0.2 * v, a: 0.3, tenu: true, rel: 0.5, am: [3, 0.4] });
      [0, 0.15, 0.3, 0.45, 0.6, 0.75].forEach((dt, i) => osc(B, { t: t + 1.0 + dt, type: 'sine', f0: hz(84 - i * 3), d: 0.4, vol: 0.07 * v, rev: 0.6 }));
    },
  ];

  // ------------------------------------------------------------ un petit générique par montée en âge
  // Pour l'âge 1 (Pierre) à 10 (Alien). voix : instrument ; mel : « note:durée » (durée en demi-temps) ;
  // basse : une note de basse par groupe de 4 demi-temps ; perc : motif de percussion sur 16 demi-temps.
  const GENERIQUES = [
    null,
    { nom: 'Pierre', bpm: 92, voix: 'flute', mel: 'A4:1 C5:1 D5:1 E5:1 G5:2 E5:1 D5:1 C5:2 D5:2 A4:4 -:0 C5:1 D5:1 E5:2 A5:6', basse: ['A2', 'A2', 'G2', 'A2'], perc: 'K...t...K.t.t...', tamb: 'tom' },
    { nom: 'Antiquité', bpm: 100, voix: 'lyre', mel: 'D5:2 F5:1 E5:1 D5:2 A4:2 D5:1 E5:1 F5:1 G5:1 A5:4 G5:1 F5:1 E5:1 D5:1 D5:6', basse: ['D3', 'D3', 'C3', 'D3'], perc: 'K...t.t.K...t...', tamb: 'tom' },
    { nom: 'Médiéval', bpm: 108, voix: 'cuivre', mel: 'G4:2 C5:1 C5:1 E5:2 G5:2 E5:1 E5:1 G5:2 C6:2 B5:1 A5:1 G5:2 E5:2 C5:6', basse: ['C3', 'C3', 'G2', 'C3'], perc: 'K...S...K..KS...', tamb: 'caisse' },
    { nom: 'Renaissance', bpm: 112, voix: 'clavecin', mel: 'E5:1 F#5:1 G5:1 A5:1 B5:2 G5:1 E5:1 A5:2 F#5:2 G5:1 A5:1 B5:1 C6:1 B5:2 A5:2 G5:6', basse: ['G2', 'D3', 'C3', 'G2'], perc: 'K...s...K...s.s.', tamb: 'claire' },
    { nom: 'Vapeur', bpm: 104, voix: 'sifflet', mel: 'F5:2 A5:2 C6:2 A5:1 F5:1 G5:2 Bb5:2 D6:2 C6:2 A5:1 F5:1 F5:6', basse: ['F2', 'F2', 'Bb2', 'C3'], perc: 'K.sK.sK.sK.sK.s.', tamb: 'vapeur' },
    { nom: 'Moderne', bpm: 116, voix: 'clairon', mel: 'C5:2 E5:1 G5:1 C6:3 G5:1 E5:2 G5:1 A5:1 C6:2 E6:2 D6:1 C6:1 C6:7', basse: ['C3', 'F3', 'G3', 'C3'], perc: 'K.S.K.S.K.S.KSKS', tamb: 'caisse' },
    { nom: 'Héros', bpm: 120, voix: 'cuivre-epique', mel: 'D5:2 A5:2 D6:4 C6:2 Bb5:2 A5:4 Bb5:2 D6:2 F6:4 E6:2 D6:2 D6:8', basse: ['D2', 'Bb2', 'G2', 'A2'], perc: 'K.t.K.t.K.t.KtKt', tamb: 'timbale' },
    { nom: 'Post-apo', bpm: 100, voix: 'grunge', mel: 'E4:2 E4:1 G4:1 A4:2 E4:2 D4:1 E4:1 G4:2 B4:2 A4:1 G4:1 E4:2 E4:6', basse: ['E2', 'E2', 'D2', 'E2'], perc: 'K..sK.s.K..sK.sK', tamb: 'metal' },
    { nom: 'Futur', bpm: 124, voix: 'synth', mel: 'E5:1 G5:1 B5:1 E6:1 D6:2 B5:2 C6:1 B5:1 A5:1 G5:1 B5:2 E6:2 G6:1 E6:1 B5:1 E6:1 E6:6', basse: ['E2', 'C3', 'G2', 'D3'], perc: 'K...K...K..KK...', tamb: 'synth' },
    { nom: 'Alien', bpm: 96, voix: 'theremin', mel: 'C5:2 Eb5:2 Gb5:2 A5:2 G5:3 Eb5:1 C5:4 Eb5:2 Gb5:2 Bb5:2 C6:2 C6:8', basse: ['C2', 'C2', 'Gb2', 'C2'], perc: 'K...t...K...t.t.', tamb: 'alien' },
  ];

  // une note de générique (voix selon l'époque)
  function noteGen(B, t, d, n, voix, v, pan) {
    const f = hz(n), o = { pan };
    switch (voix) {
      case 'flute':
        osc(B, { ...o, t, type: 'sine', f0: f, d, vol: 0.28 * v, a: 0.04, vib: [5.5, 18], tenu: true, rel: 0.08, rev: 0.3 });
        bruit(B, { ...o, t, d: Math.min(d, 0.15), type: 'bandpass', f0: f * 2, q: 5, vol: 0.05 * v });
        break;
      case 'lyre':
        osc(B, { ...o, t, type: 'triangle', f0: f, d: 0.9, vol: 0.3 * v, a: 0.004, rev: 0.3 });
        osc(B, { ...o, t, type: 'sine', f0: f * 2, d: 0.4, vol: 0.08 * v });
        break;
      case 'cuivre': case 'cuivre-epique':
        osc(B, { ...o, t, type: 'sawtooth', f0: f, d, vol: (voix === 'cuivre' ? 0.14 : 0.18) * v, a: 0.05, det: 7, vib: [5.5, 12], tenu: true, rel: 0.1, rev: 0.3, fl: ['lowpass', 500, 2400, 0.9] });
        osc(B, { ...o, t, type: 'sawtooth', f0: f / 2, d, vol: 0.07 * v, a: 0.06, tenu: true, rel: 0.1, fl: ['lowpass', 400, 900, 0.8] });
        break;
      case 'clavecin':
        osc(B, { ...o, t, type: 'sawtooth', f0: f, d: 0.35, vol: 0.14 * v, a: 0.002, fl: ['lowpass', 5000, 900, 1.2], rev: 0.2 });
        osc(B, { ...o, t, type: 'square', f0: f * 2, d: 0.12, vol: 0.04 * v, a: 0.002 });
        break;
      case 'sifflet':
        osc(B, { ...o, t, type: 'sine', f0: f * 1.01, d, vol: 0.2 * v, a: 0.03, vib: [7, 22], tenu: true, rel: 0.1, rev: 0.25 });
        bruit(B, { ...o, t, d, type: 'highpass', f0: 4500, vol: 0.04 * v, tenu: true });
        break;
      case 'clairon':
        osc(B, { ...o, t, type: 'square', f0: f, d, vol: 0.1 * v, a: 0.02, vib: [5, 10], tenu: true, rel: 0.08, fl: ['lowpass', 1800, 1800, 1], rev: 0.25 });
        osc(B, { ...o, t, type: 'sawtooth', f0: f, d, vol: 0.08 * v, a: 0.02, tenu: true, rel: 0.08, fl: ['lowpass', 1200, 1200, 1] });
        break;
      case 'grunge':
        osc(B, { ...o, t, type: 'sawtooth', f0: f, d, vol: 0.14 * v, a: 0.01, det: 18, tenu: true, rel: 0.06, fl: ['lowpass', 1400, 600, 3] });
        osc(B, { ...o, t, type: 'square', f0: f / 2, d, vol: 0.08 * v, a: 0.01, tenu: true, fl: ['lowpass', 500, 500, 1] });
        break;
      case 'synth':
        osc(B, { ...o, t, type: 'sawtooth', f0: f, d: Math.max(0.12, d), vol: 0.13 * v, a: 0.005, det: 9, tenu: true, rel: 0.1, fl: ['lowpass', 4500, 1500, 3], rev: 0.35 });
        osc(B, { ...o, t, type: 'square', f0: f * 2, d: 0.1, vol: 0.04 * v });
        break;
      case 'theremin':
        osc(B, { ...o, t, type: 'sine', f0: f * 0.97, f1: f, d, vol: 0.22 * v, a: 0.08, sw: 0.1, vib: [6, 45], tenu: true, rel: 0.15, rev: 0.5 });
        break;
    }
  }

  function jouerGenerique(B, idx, t, v) {
    const G = GENERIQUES[idx];
    if (!G) return 0;
    const demi = 30 / (G.bpm * 1.45);      // durée d'un demi-temps (un petit générique d'environ 6 secondes)
    let pos = 0;
    for (const jeton of G.mel.split(' ')) {
      const [nom, d] = jeton.split(':');
      const dd = Number(d);
      if (nom !== '-' && dd > 0) noteGen(B, t + pos * demi, Math.max(0.1, dd * demi * 0.95), midi(nom), G.voix, v, 0);
      pos += dd;
    }
    const total = pos;
    // basse : une note par groupe de 4 demi-temps ; accord final tenu
    G.basse.forEach((b, i) => osc(B, { t: t + i * 4 * demi, type: G.voix === 'synth' || G.voix === 'grunge' ? 'sawtooth' : 'triangle', f0: hz(midi(b)), d: 4 * demi * 0.95, vol: 0.3 * v, a: 0.01, tenu: true, rel: 0.08, fl: ['lowpass', 500, 500, 1] }));
    const fin = t + total * demi;
    // accord de fin (tenu) pour conclure
    const racine = midi(G.basse[0].replace(/\d/, '3'));
    [0, 7, 12].forEach(dn => osc(B, { t: fin - 4 * demi * 0.5, type: 'triangle', f0: hz(racine + dn), d: 4 * demi + 0.4, vol: 0.1 * v, a: 0.05, tenu: true, rel: 0.4, rev: 0.4 }));
    // percussions
    const reps = Math.ceil(total / 16);
    for (let r = 0; r < reps; r++) {
      for (let i = 0; i < 16; i++) {
        const c = G.perc[i], ti = t + (r * 16 + i) * demi;
        if (ti > fin) break;
        if (c === 'K') percuGen(B, ti, 'K', G.tamb, v);
        else if (c === 'S' || c === 's') percuGen(B, ti, 'S', G.tamb, v * (c === 'S' ? 1 : 0.6));
        else if (c === 't') percuGen(B, ti, 't', G.tamb, v);
      }
    }
    // coup final
    if (G.tamb === 'timbale') FAM.canon(B, fin - 4 * demi * 0.5, { f: 90, d: 0.7, v: v * 0.6 }, { rev: 0.4 });
    bruit(B, { t: fin - 4 * demi * 0.5, d: 1.4, type: 'highpass', f0: 5500, vol: 0.06 * v, rev: 0.3 });
    return total * demi + 0.8;
  }

  function percuGen(B, t, c, tamb, v) {
    if (c === 'K') { osc(B, { t, type: 'sine', f0: 130, f1: 45, d: 0.18, vol: 0.5 * v }); return; }
    if (c === 't') { osc(B, { t, type: 'sine', f0: 190, f1: 95, d: 0.2, vol: 0.3 * v, rev: 0.2 }); return; }
    // S : selon l'époque
    if (tamb === 'metal') FAM.lame(B, t, { f: 330, d: 0.2, v: v * 0.6 }, {});
    else if (tamb === 'vapeur') FAM.vapeur(B, t, { f0: 5000, f1: 3000, d: 0.08, v: v * 0.8 }, {});
    else bruit(B, { t, d: 0.1, type: 'bandpass', f0: 1700, q: 0.8, vol: 0.2 * v, rev: 0.2 });
  }

  // ------------------------------------------------------------ pilotage
  const Sons = {
    TROUPES, TOURELLES, POUVOIRS, GENERIQUES,
    stable: false,         // vrai : pas de variation aléatoire (mesures)
    bus: null, ctxBus: null,
    recents: [], dernier: {},

    pret() { const M = PA.Music; if (!M || !M.debloque || !M.fx) return false; return !!M.contexte(); },
    banc() {
      const M = PA.Music;
      if (!this.bus || this.ctxBus !== M.ctx) { this.bus = banc(M.ctx, M.fxVol); this.ctxBus = M.ctx; }
      return this.bus;
    },
    volume() { if (this.bus) this.bus.out.gain.setTargetAtTime(PA.Music.fxVol, this.bus.ctx.currentTime, 0.03); },

    // ---- Enregistrements (mode « reel ») -----------------------------------------------------------
    // sons/index.json décrit, pour chaque son du jeu, des couches de fichiers audio (voir sons/LISEZ-MOI.txt).
    // Un son absent du catalogue, un fichier manquant ou pas encore chargé : on joue la version synthétisée.
    reel: { etat: 'inconnu', man: null, tampons: {}, charge: {}, promesse: null },
    chargerReel() {
      const R = this.reel;
      if (R.etat !== 'inconnu') return R.promesse;
      R.etat = 'chargement';
      R.promesse = fetch('sons/index.json').then(r => (r.ok ? r.json() : Promise.reject()))
        .then(j => { R.man = j; R.etat = Object.keys(j.sons || {}).length ? 'pret' : 'vide'; })
        .catch(() => { R.etat = 'absent'; });
      return R.promesse;
    },
    reelDispo() { return this.reel.etat === 'pret'; },
    // Charge d'avance tous les fichiers du catalogue (quelques secondes), pour que le premier son soit déjà prêt.
    precharger() {
      if (!this.reelDispo() || !PA.Music.ctx || this.reel.pre) return;
      this.reel.pre = true;
      const liste = [];
      for (const k of Object.keys(this.reel.man.sons)) for (const c of this.reel.man.sons[k]) for (const f of c.f) if (liste.indexOf(f) < 0) liste.push(f);
      let i = 0;
      const suite = () => { for (let n = 0; n < 6 && i < liste.length; n++) this.tampon(liste[i++]); if (i < liste.length) setTimeout(suite, 60); };
      suite();
    },
    modeReel() { return !!(PA.Music && PA.Music.fxMode === 'reel' && this.reelDispo()); },
    tampon(fichier) {
      const R = this.reel;
      if (R.tampons[fichier]) return R.tampons[fichier];
      if (R.charge[fichier]) return null;
      R.charge[fichier] = true;
      const ctx = PA.Music.ctx;
      fetch('sons/' + fichier).then(r => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then(b => new Promise((ok, ko) => ctx.decodeAudioData(b, ok, ko)))
        .then(buf => { R.tampons[fichier] = buf; })
        .catch(() => { R.tampons[fichier] = 'x'; });
      return null;
    },
    // couche : { f: [fichiers au choix], g: gain, r: [vitesse min, max], dt: retard (s), de: début dans le fichier (s), d: durée (s), lp / hp: filtres (Hz) }
    jouerReel(cle, B, t, v, o) {
      const man = this.reel.man, couches = man && man.sons[cle];
      if (!couches) return false;
      v *= (man.niveaux && man.niveaux[cle]) || 1;      // égalisation mesurée (outils/mesurer-sons.js : Mesures.niveauxReel)
      const aJouer = [];
      for (const c of couches) {
        const f = c.f[Math.floor(Math.random() * c.f.length)], buf = this.tampon(f);
        if (buf && buf !== 'x') aJouer.push([c, buf]);
      }
      if (!aJouer.length) return false;
      for (const [c, buf] of aJouer) {
        const src = B.ctx.createBufferSource(), g = B.ctx.createGain(), r = c.r || [1, 1];
        src.buffer = buf; src.playbackRate.value = r[0] + Math.random() * (r[1] - r[0]);
        g.gain.value = (c.g == null ? 1 : c.g) * v;
        let n = src;
        if (c.lp) { const f = B.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = c.lp; n.connect(f); n = f; }
        if (c.hp) { const f = B.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = c.hp; n.connect(f); n = f; }
        n.connect(g);
        sortie(B, g, o || {});
        src.start(t + (c.dt || 0), c.de || 0, c.d || undefined);
      }
      return true;
    },

    // une troupe attaque
    attaque(u) {
      if (!this.pret() || !u || !u.def) return;
      const recette = TROUPES[u.def.id];
      if (!recette) return;
      const B = this.banc(), now = B.ctx.currentTime;
      this.recents = this.recents.filter(x => now - x < 0.12);
      if (this.recents.length >= 5) return;                                    // pas plus de 5 sons en 120 ms
      if (this.dernier[u.def.id] && now - this.dernier[u.def.id] < 0.07) return;   // ni la même troupe en rafale
      this.recents.push(now); this.dernier[u.def.id] = now;
      const v0 = u.side === 1 ? 1 : 0.7;
      const pan = clamp((u.x / 1280) * 1.4 - 0.7, -0.7, 0.7);
      if (this.modeReel() && this.jouerReel(u.def.id, B, now + 0.005, v0, { pan })) return;
      this.jouer(B, recette, now + 0.005, v0 * (NIVEAUX[u.def.id] || 1), { pan });
    },
    jouer(B, recette, t, v, o) {
      for (const [fam, p, dt] of recette) FAM[fam](B, t + dt, { v, ...p }, o || {});
    },

    // une tourelle tire (def : sa définition dans la config ; x : sa position)
    tourelle(def, side, x) {
      if (!this.pret() || !def) return;
      const recette = TOURELLES[def.id];
      if (!recette) return;
      const B = this.banc(), now = B.ctx.currentTime;
      this.recentsT = (this.recentsT || []).filter(y => now - y < 0.12);
      if (this.recentsT.length >= 3) return;                                      // pas plus de 3 tirs de tourelle en 120 ms
      if (this.dernier['t:' + def.id] && now - this.dernier['t:' + def.id] < 0.1) return;
      this.recentsT.push(now); this.dernier['t:' + def.id] = now;
      const v0 = 0.6 * (side === 1 ? 1 : 0.75), o = { pan: clamp((x / 1280) * 1.4 - 0.7, -0.7, 0.7) };
      if (this.modeReel() && this.jouerReel('t:' + def.id, B, now + 0.005, v0, o)) return;
      this.jouer(B, recette, now + 0.005, v0 * (NIVEAUX_TOURELLES[def.id] || 1), o);
    },

    // le pouvoir spécial de l'âge lancé
    pouvoir(idx) {
      if (!this.pret() || !POUVOIRS[idx]) return;
      const B = this.banc();
      if (!(this.modeReel() && this.jouerReel('p:' + idx, B, B.ctx.currentTime + 0.01, 1, {}))) POUVOIRS[idx](B, B.ctx.currentTime + 0.01, NIVEAU_POUVOIR[idx] || 1);
      PA.Music.duck(2.8, 0.45);
    },

    // montée en âge : petit générique, la musique baisse pendant ce temps
    evolution(idx) {
      if (!this.pret() || !GENERIQUES[idx]) return;
      const B = this.banc();
      const d = jouerGenerique(B, idx, B.ctx.currentTime + 0.05, 0.85);
      PA.Music.duck(d + 0.3, 0.25);
    },

    // haut fait : on souffle dans une corne (souffle, une note brève puis une longue, une quinte plus haut)
    corne() {
      if (!this.pret()) return;
      const B = this.banc(), t = B.ctx.currentTime + 0.05;
      bruit(B, { t, d: 0.35, type: 'bandpass', f0: 700, f1: 1100, q: 1.2, vol: 0.06, gonfle: 0.12 });
      const note = (t0, f, d, v) => {
        osc(B, { t: t0, type: 'sawtooth', f0: f * 0.93, f1: f, sw: 0.1, d, vol: 0.13 * v, a: 0.08, tenu: true, rel: 0.4, vib: [4.5, 9], fl: ['lowpass', 420, 1400, 1.3], rev: 0.4 });
        osc(B, { t: t0, type: 'triangle', f0: f * 0.93, f1: f, sw: 0.1, d, vol: 0.16 * v, a: 0.08, tenu: true, rel: 0.4, rev: 0.4 });
        bruit(B, { t: t0, d: d * 0.8, type: 'bandpass', f0: f * 3, q: 3, vol: 0.025 * v, tenu: true });
      };
      note(t + 0.1, 196, 0.34, 0.85);     // sol
      note(t + 0.5, 294, 1.25, 1);        // ré, tenu
      PA.Music.duck(2.1, 0.3);
    },

    // essai du son d'une tourelle (page d'écoute)
    apercuTourelle(id) {
      if (!this.pret() || !TOURELLES[id]) return;
      const B = this.banc();
      if (this.modeReel() && this.jouerReel('t:' + id, B, B.ctx.currentTime + 0.01, 0.6, {})) return;
      this.jouer(B, TOURELLES[id], B.ctx.currentTime + 0.01, 0.6 * (NIVEAUX_TOURELLES[id] || 1), {});
    },

    // essai d'un son (réglages)
    apercu(id) {
      if (!this.pret() || !TROUPES[id]) return;
      const B = this.banc();
      if (this.modeReel() && this.jouerReel(id, B, B.ctx.currentTime + 0.01, 1, {})) return;
      this.jouer(B, TROUPES[id], B.ctx.currentTime + 0.01, NIVEAUX[id] || 1, {});
    },

    // rendu hors ligne d'une fonction (B, t) : mono, 44,1 kHz ; renvoie une promesse d'AudioBuffer
    rendre(fn, secondes) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const ctx = new OAC(1, Math.ceil(secondes * 44100), 44100);
      const B = banc(ctx, 1);
      this.stable = true;
      try { fn(B, 0.01); } finally { this.stable = false; }
      return ctx.startRendering();
    },
    rendreTourelle(id, secondes) { return this.rendre((B, t) => this.jouer(B, TOURELLES[id], t, 1, {}), secondes || 1.2); },
    rendreTroupe(id, secondes) { return this.rendre((B, t) => this.jouer(B, TROUPES[id], t, 1, {}), secondes || 1.2); },
    rendrePouvoir(idx, secondes) { return this.rendre((B, t) => POUVOIRS[idx](B, t, NIVEAU_POUVOIR[idx] || 1), secondes || 3.4); },
    rendreGenerique(idx, secondes) { return this.rendre((B, t) => jouerGenerique(B, idx, t, 0.85), secondes || 9); },
  };

  PA.Sons = Sons;
})();

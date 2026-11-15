/* =========================================================================
   MUSIQUE : trois thèmes originaux, joués par le navigateur (Web Audio).
   Aucun fichier son : les notes sont écrites ici et synthétisées à la volée.

     PA.Music.play('camp')              // lance un thème en boucle (après un clic : les navigateurs l'exigent)
     PA.Music.play('combat', 'piano')   // même thème, autre sonorité (orchestre, piano, retro)
     PA.Music.stop()
     PA.Music.setVolume(0.5)            // 0 à 1
     PA.Music.render('assaut', 'orchestre', 20)   // promesse d'un AudioBuffer (mesures, export)

   Parti pris (12/11, à la demande) : des thèmes CALMES et qui restent en tête.
     - tempo lent, batterie légère « à demi-temps », nappes de cordes tenues ;
     - une harpe qui égrène l'accord en croches, toujours le même dessin ;
     - un motif de quatre notes au rythme fixe, répété d'accord en accord : c'est lui qu'on retient.

   Écriture d'une mélodie : une chaîne par mesure, « note:durée » en doubles croches
   (16 par mesure), « - » pour un silence. Ex. : 'E5:3 G5:1 A5:4 G5:8'.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const DEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = nom => {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(nom);
    if (!m) throw new Error('note illisible : ' + nom);
    return 12 * (Number(m[3]) + 1) + DEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  };
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  // « Am » → fondamentale (octave 2), tierce, quinte
  const accord = sym => {
    const m = /^([A-G][#b]?)(m?)$/.exec(sym);
    if (!m) throw new Error('accord illisible : ' + sym);
    const r = midi(m[1] + '2');
    return { r, t: r + (m[2] ? 3 : 4), q: r + 7 };
  };

  // ------------------------------------------------------------ les trois thèmes
  // form : l'ordre des sections ; calme = sans batterie ; double = la mélodie est doublée à l'octave.
  // basse : 'tenue' (une longue note par mesure) ou 'pouls' (une note par temps).
  // batterie : [motif normal, motif de fin de section] ; K = grosse caisse + charleston, S = caisse claire + charleston,
  //            minuscules = l'instrument seul, h = charleston, t = tom.
  const TRACKS = {
    camp: {
      name: 'Feu de camp', usage: 'Camp', bpm: 84, tonalite: 'do majeur',
      humeur: 'Chaleureux et posé. Un motif de quatre notes qui monte, puis redescend se poser : on le fredonne en choisissant ses améliorations.',
      basse: 'tenue', harpe: 12, batterie: ['K...h...s...h...', 'K...h...s...h.h.'],
      form: [['A', { calme: true }], ['A', {}], ['B', {}], ['A', { double: true }]],
      sections: {
        A: {
          accords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F G', 'C'],
          chant: ['E5:3 G5:1 A5:4 G5:8', 'E5:3 G5:1 A5:4 C6:8', 'A5:3 G5:1 F5:4 A5:8', 'G5:3 E5:1 D5:12',
            'E5:3 G5:1 A5:4 G5:8', 'E5:3 G5:1 A5:4 C6:8', 'D6:3 C6:1 A5:4 G5:3 E5:1 D5:4', 'E5:3 D5:1 C5:12'],
        },
        B: {
          accords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
          chant: ['A4:4 C5:4 E5:8', 'F5:4 E5:4 C5:8', 'E5:6 D5:2 C5:8', 'D5:12 G4:4',
            'A4:4 C5:4 E5:8', 'F5:4 A5:4 C6:8', 'G5:6 E5:2 C5:8', 'D5:6 E5:2 G5:8'],
        },
      },
    },
    combat: {
      name: 'Ligne de front', usage: 'Combat', bpm: 100, tonalite: 'la mineur',
      humeur: 'Calme mais décidé. Le même saut vers le haut revient sur chaque accord, porté par la harpe et un pouls de basse régulier.',
      basse: 'pouls', harpe: 12, batterie: ['K.h.h.h.S.h.h.k.', 'K.h.h.h.S.h.t.tt'],
      form: [['A', { calme: true }], ['A', {}], ['B', {}], ['A', { double: true }]],
      sections: {
        A: {
          accords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'],
          chant: ['E5:4 A5:6 G5:2 E5:4', 'C5:4 F5:6 E5:2 C5:4', 'E5:4 G5:6 E5:2 C5:4', 'D5:4 G5:6 D5:2 B4:4',
            'E5:4 A5:6 G5:2 E5:4', 'A5:4 C6:6 A5:2 F5:4', 'G5:4 C6:6 G5:2 E5:4', 'D5:4 G5:4 B5:8'],
        },
        B: {
          accords: ['F', 'G', 'Am', 'Am', 'F', 'G', 'C', 'E'],
          chant: ['A5:8 C6:8', 'B5:8 D6:8', 'C6:6 B5:2 A5:8', 'E5:4 A5:4 E5:8',
            'A5:8 C6:8', 'B5:8 D6:8', 'E6:6 D6:2 C6:8', 'B5:8 G#5:8'],
        },
      },
    },
    assaut: {
      name: 'Dernier rempart', usage: 'Boss et assaut final', bpm: 108, tonalite: 'ré mineur',
      humeur: 'Épique. Un ostinato de cordes qui martèle, des cuivres qui montent en trois temps vers une note tenue, des timbales sur chaque temps et une cymbale à chaque retour du thème.',
      epique: true, basse: 'tenue', harpe: 0, timbales: true, batterie: ['K...t...K...t.t.', 'K.t.K.t.K.t.tttt'],
      form: [['A', { calme: true }], ['A', {}], ['B', {}], ['A', { double: true }]],
      sections: {
        A: {
          accords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'],
          chant: ['D5:2 F5:2 A5:4 D6:8', 'Bb5:4 D6:4 C6:8', 'A5:2 C6:2 F6:4 C6:8', 'G5:4 C6:4 E6:8',
            'D5:2 F5:2 A5:4 D6:8', 'Bb5:4 D6:4 F6:8', 'G5:4 Bb5:4 D6:8', 'A5:4 C#6:4 E6:8'],
        },
        B: {
          accords: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
          chant: ['Bb5:8 D6:8', 'C6:8 E6:8', 'F6:6 E6:2 D6:8', 'A5:4 D6:4 F6:8',
            'Bb5:8 F6:8', 'E6:8 C6:8', 'E6:6 D6:2 C#6:8', 'A5:16'],
        },
      },
    },
  };

  // ------------------------------------------------------------ des notes écrites aux événements
  // Renvoie { evts: [{ t, d, v, n | notes, vel }], len } ; t et d sont en doubles croches.
  function construire(track) {
    const evts = [];
    const avertissements = [];
    let t0 = 0;
    for (const [nomSection, opt] of track.form) {
      const sec = track.sections[nomSection];
      sec.accords.forEach((accStr, mesure) => {
        const base = t0 + mesure * 16;
        const moities = accStr.split(' ').map(accord);
        const demi = i => moities[moities.length === 1 ? 0 : i];   // accord de chaque moitié de mesure

        // mélodie
        let t = base, total = 0;
        for (const jeton of sec.chant[mesure].split(' ')) {
          const [nom, duree] = jeton.split(':');
          const d = Number(duree);
          if (nom !== '-') {
            const n = midi(nom);
            evts.push({ t, d, v: 'chant', n, vel: 1 });
            if (opt.double) evts.push({ t, d, v: 'chant', n: n + 12, vel: 0.35 });
          }
          t += d; total += d;
        }
        if (total !== 16) avertissements.push(`${track.name}, section ${nomSection}, mesure ${mesure + 1} : ${total} doubles croches au lieu de 16`);

        // harpe : l'accord égrené en croches, toujours le même dessin (monte puis redescend)
        for (let h = 0; h < 2; h++) {
          const a = demi(h), b = base + h * 8, o = 12 + track.harpe;
          const tons = [a.r + o, a.q + o, a.r + o + 12, a.t + o + 12, a.q + o + 12];
          (h === 0 ? [0, 1, 2, 3] : [4, 3, 2, 1]).forEach((i, k) => evts.push({ t: b + k * 2, d: 2, v: 'harpe', n: tons[i], vel: k === 0 ? 1 : 0.75 }));
        }

        // nappe : l'accord tenu
        moities.forEach((a, i) => evts.push({ t: base + i * (16 / moities.length), d: 16 / moities.length, v: 'nappe', notes: [a.r + 12, a.t + 12, a.q + 12], vel: 1 }));

        // basse
        if (track.basse === 'pouls') {
          for (let k = 0; k < 4; k++) evts.push({ t: base + k * 4, d: 3.4, v: 'basse', n: demi(k < 2 ? 0 : 1).r, vel: k === 0 ? 1 : 0.7 });
        } else {
          moities.forEach((a, i) => evts.push({ t: base + i * (16 / moities.length), d: 16 / moities.length - 1, v: 'basse', n: a.r, vel: 1 }));
        }
        if (track.timbales && !track.epique) evts.push({ t: base, d: 8, v: 'timbale', n: moities[0].r, vel: opt.calme ? 0.6 : 1 });

        // thème épique : cordes en ostinato, timbales sur chaque temps, cymbale au début des sections pleines
        if (track.epique) {
          for (let h = 0; h < 2; h++) {
            const a = demi(h), b = base + h * 8;
            [a.r + 12, a.q + 12, a.r + 24, a.q + 12].forEach((n, k) => evts.push({ t: b + k * 2, d: 1.7, v: 'ostinato', n, vel: k === 0 ? 1 : 0.7 }));
            evts.push({ t: b, d: 8, v: 'timbale', n: a.r, vel: opt.calme ? (h === 0 ? 0.6 : 0) : 1 });
            if (!opt.calme) evts.push({ t: b + 4, d: 4, v: 'timbale', n: a.r, vel: 0.55 });
          }
          if (!opt.calme && mesure === 0) evts.push({ t: base, d: 12, v: 'crash', vel: 1 });
          if (mesure === sec.accords.length - 1 && !opt.calme) evts.push({ t: base + 12, d: 4, v: 'crash', vel: 0.6 });
        }

        // batterie légère
        if (!opt.calme) {
          const motif = track.batterie[mesure === sec.accords.length - 1 ? 1 : 0];
          for (let i = 0; i < 16; i++) {
            const c = motif[i];
            if (c === 'K' || c === 'k') evts.push({ t: base + i, d: 1, v: 'caisse', vel: c === 'K' ? 1 : 0.7 });
            if (c === 'S' || c === 's') evts.push({ t: base + i, d: 1, v: 'claire', vel: c === 'S' ? 1 : 0.7 });
            if (c === 'K' || c === 'S' || c === 'h') evts.push({ t: base + i, d: 1, v: 'charley', vel: i % 8 === 0 ? 1 : 0.6 });
            if (c === 't') evts.push({ t: base + i, d: 1, v: 'tom', n: 50 - (i % 4) * 3, vel: 1 });
          }
        }
      });
      t0 += sec.accords.length * 16;
    }
    evts.sort((a, b) => a.t - b.t);
    return { evts, len: t0, avertissements, epique: !!track.epique };
  }

  // ------------------------------------------------------------ les instruments
  // Un « banc » : tout ce qu'il faut pour jouer dans un contexte audio (direct ou hors ligne).
  function banc(ctx, sonorite, volume) {
    const sortie = ctx.createGain();
    sortie.gain.value = volume;
    const compresseur = ctx.createDynamicsCompressor();
    compresseur.threshold.value = -16; compresseur.ratio.value = 3; compresseur.attack.value = 0.01; compresseur.release.value = 0.25;
    const mix = ctx.createGain();
    mix.connect(compresseur); compresseur.connect(sortie); sortie.connect(ctx.destination);
    // bruit blanc (caisse claire, charleston)
    const bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bruit.getChannelData(0);
    let graine = 12345;
    const hasard = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x3fffffff - 1; };
    for (let i = 0; i < d.length; i++) d[i] = hasard();
    // grande salle : une réverbération fabriquée (sauf en 8 bits, qui reste sec)
    let salle = null;
    if (sonorite !== 'retro') {
      const n = Math.floor(ctx.sampleRate * 2.2), imp = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const ch = imp.getChannelData(c);
        for (let i = 0; i < n; i++) ch[i] = hasard() * Math.pow(1 - i / n, 3);
      }
      const conv = ctx.createConvolver(); conv.buffer = imp;
      salle = ctx.createGain(); salle.gain.value = 0.2;
      salle.connect(conv); conv.connect(mix);
    }
    return { ctx, sonorite, mix, salle, bruit, sortie };
  }

  // Une note : un ou plusieurs oscillateurs, une enveloppe de volume, parfois un filtre.
  //   chute > 0 : son pincé ou frappé, qui s'éteint tout seul en « chute » secondes (harpe, piano)
  //   chute = 0 : son tenu pendant toute la durée de la note (flûte, cordes)
  function ton(B, { type, f, t, d, vol, attaque = 0.005, chute = 0, relache = 0.05, desaccord = 0, filtre = null, vibrato = false, echo = false }) {
    const ctx = B.ctx;
    const g = ctx.createGain();
    const fin = chute > 0 ? t + chute : t + d;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attaque);
    if (chute > 0) g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 0.015), fin);
    else g.gain.setValueAtTime(vol, Math.max(t + attaque, fin - 0.005));
    g.gain.linearRampToValueAtTime(0.0001, fin + relache);
    const arret = fin + relache + 0.02;
    let cible = g;
    if (filtre) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = filtre.q || 0.7;
      lp.frequency.setValueAtTime(filtre.de, t);
      lp.frequency.exponentialRampToValueAtTime(filtre.a, t + (filtre.en || 0.05));
      lp.connect(g); cible = lp;
    }
    for (const dt of (desaccord ? [-desaccord, desaccord] : [0])) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = f; o.detune.value = dt;
      if (vibrato && d > 0.5) {             // vibrato léger, seulement sur les notes longues
        const lfo = ctx.createOscillator(), prof = ctx.createGain();
        lfo.frequency.value = 5.2; prof.gain.setValueAtTime(0, t); prof.gain.linearRampToValueAtTime(9, t + 0.45);
        lfo.connect(prof); prof.connect(o.detune); lfo.start(t); lfo.stop(arret);
      }
      o.connect(cible); o.start(t); o.stop(arret);
    }
    g.connect(B.mix);
    if (echo && B.salle) g.connect(B.salle);
  }

  function souffle(B, { t, d, vol, type, freq, q = 0.7, echo = false }) {
    const ctx = B.ctx, src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = B.bruit; src.loop = true;
    fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(B.mix);
    if (echo && B.salle) g.connect(B.salle);
    src.start(t); src.stop(t + d + 0.02);
  }

  function percu(B, { t, de, a, d, vol, type = 'sine', echo = false }) {   // un son qui descend : grosse caisse, tom, timbale
    const ctx = B.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(de, t); o.frequency.exponentialRampToValueAtTime(a, t + d * 0.7);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(B.mix); if (echo && B.salle) g.connect(B.salle);
    o.start(t); o.stop(t + d + 0.02);
  }

  // Joue un événement à l'instant t (secondes) ; s = durée d'une double croche en secondes.
  function jouer(B, e, t, s) {
    const d = e.d * s, v = e.vel, so = B.sonorite;
    switch (e.v) {
      case 'ostinato':                     // cordes qui martèlent (thème épique)
        if (so === 'orchestre') ton(B, { type: 'sawtooth', f: hz(e.n), t, d, vol: 0.06 * v, attaque: 0.012, chute: 0.2, echo: true, filtre: { de: 1500, a: 650, en: 0.18 } });
        else if (so === 'piano') ton(B, { type: 'triangle', f: hz(e.n), t, d, vol: 0.09 * v, chute: 0.22, echo: true });
        else ton(B, { type: 'square', f: hz(e.n), t, d: d * 0.6, vol: 0.04 * v });
        break;
      case 'crash':                        // cymbale
        souffle(B, { t, d: so === 'retro' ? 0.5 : 1.8, vol: 0.12 * v, type: 'highpass', freq: so === 'retro' ? 4500 : 5200, echo: true });
        if (so !== 'retro') souffle(B, { t, d: 1.2, vol: 0.05 * v, type: 'bandpass', freq: 8500, q: 0.6, echo: true });
        break;
      case 'chant':
        if (so === 'orchestre' && B.epique) {   // cuivres : deux scies légèrement désaccordées, un filtre qui s'ouvre, une octave grave
          ton(B, { type: 'sawtooth', f: hz(e.n), t, d: d * 0.97, vol: 0.085 * v, attaque: 0.07, relache: 0.12, desaccord: 7, vibrato: true, echo: true, filtre: { de: 450, a: 2300, en: 0.16, q: 0.9 } });
          ton(B, { type: 'sawtooth', f: hz(e.n - 12), t, d: d * 0.97, vol: 0.05 * v, attaque: 0.09, relache: 0.12, echo: true, filtre: { de: 350, a: 1100, en: 0.2 } });
        } else if (so === 'orchestre') {          // flûte : un son pur, une attaque douce, un peu de souffle
          ton(B, { type: 'sine', f: hz(e.n), t, d: d * 0.96, vol: 0.15 * v, attaque: 0.05, relache: 0.09, vibrato: true, echo: true });
          ton(B, { type: 'triangle', f: hz(e.n) * 2, t, d: d * 0.96, vol: 0.018 * v, attaque: 0.06, relache: 0.09, echo: true });
          souffle(B, { t, d: 0.09, vol: 0.012 * v, type: 'bandpass', freq: hz(e.n) * 2, q: 1.5 });
        } else if (so === 'piano') {       // piano : trois harmoniques qui s'éteignent
          const c = Math.max(0.9, d * 1.5);
          ton(B, { type: 'sine', f: hz(e.n), t, d, vol: 0.17 * v, chute: c, echo: true });
          ton(B, { type: 'sine', f: hz(e.n) * 2, t, d, vol: 0.05 * v, chute: c * 0.6, echo: true });
          ton(B, { type: 'sine', f: hz(e.n) * 3, t, d, vol: 0.018 * v, chute: c * 0.35 });
        } else ton(B, { type: 'square', f: hz(e.n), t, d: d * 0.92, vol: 0.075 * v, attaque: 0.01, vibrato: true });
        break;
      case 'harpe':
        if (so === 'orchestre') ton(B, { type: 'triangle', f: hz(e.n), t, d, vol: 0.075 * v, chute: 0.7, echo: true });
        else if (so === 'piano') { ton(B, { type: 'sine', f: hz(e.n), t, d, vol: 0.07 * v, chute: 0.6, echo: true }); ton(B, { type: 'sine', f: hz(e.n) * 2, t, d, vol: 0.016 * v, chute: 0.3 }); }
        else ton(B, { type: 'triangle', f: hz(e.n), t, d: d * 0.8, vol: 0.085 * v });
        break;
      case 'nappe':                         // cordes tenues, très en retrait
        for (const n of e.notes) {
          if (so === 'orchestre') ton(B, { type: 'sawtooth', f: hz(n), t, d, vol: 0.02, attaque: 0.3, relache: 0.5, desaccord: 6, echo: true, filtre: { de: 500, a: 950, en: 0.6 } });
          else if (so === 'piano') ton(B, { type: 'sine', f: hz(n), t, d, vol: 0.022, attaque: 0.4, relache: 0.5, echo: true });
          else ton(B, { type: 'triangle', f: hz(n), t, d, vol: 0.02, attaque: 0.05, relache: 0.1 });
        }
        break;
      case 'basse':
        if (so === 'retro') ton(B, { type: 'triangle', f: hz(e.n), t, d, vol: 0.26 * v, attaque: 0.01 });
        else { ton(B, { type: 'sine', f: hz(e.n), t, d, vol: 0.24 * v, attaque: 0.03, relache: 0.12 }); ton(B, { type: 'triangle', f: hz(e.n), t, d, vol: 0.05 * v, attaque: 0.03, relache: 0.12 }); }
        break;
      case 'timbale':
        if (v <= 0) break;
        percu(B, { t, de: hz(e.n) * 2.15, a: hz(e.n) * 2, d: so === 'retro' ? 0.4 : (B.epique ? 1.4 : 1.1), vol: (B.epique ? 0.4 : 0.26) * v, type: so === 'retro' ? 'triangle' : 'sine', echo: true });
        break;
      case 'caisse': percu(B, { t, de: 120, a: 46, d: 0.2, vol: 0.5 * v }); break;
      case 'tom': percu(B, { t, de: hz(e.n) * 1.3, a: hz(e.n), d: 0.25, vol: 0.3 * v, echo: true }); break;
      case 'claire':                        // plutôt un coup sur le cercle qu'une caisse claire franche
        souffle(B, { t, d: 0.1, vol: 0.13 * v, type: 'bandpass', freq: 1500, echo: true });
        percu(B, { t, de: 330, a: 260, d: 0.05, vol: 0.1 * v, type: 'triangle', echo: true });
        break;
      case 'charley': souffle(B, { t, d: 0.03, vol: 0.035 * v, type: 'highpass', freq: 8000 }); break;
    }
  }

  // ------------------------------------------------------------ lecture
  const Music = {
    TRACKS,
    SONORITES: { orchestre: 'Orchestre', piano: 'Piano', retro: 'Rétro 8 bits' },
    sonorite: 'orchestre',
    volume: 0.6,
    current: null,      // { id, sonorite, B, part, s, debut, i, minuteur }
    ctx: null,
    cache: {},

    // ---- réglages du joueur (gardés dans le navigateur) et pilotage par le jeu
    // Le jeu demande un thème avec demande('camp'), demande('combat') ou demande('assaut') ; le son ne démarre
    // qu'après le premier appui du joueur (les navigateurs l'exigent), puis suit les demandes.
    cle: 'timebreakers-son',
    on: true,
    fx: true,           // effets sonores (js/sons.js) : oui / non
    fxVol: 0.8,         // volume des effets
    fxMode: 'synthe',   // 'synthe' (sons fabriqués par le navigateur) ou 'reel' (enregistrements, si installés : dossier sons/)
    debloque: false,
    voulu: null,
    charger() {
      try {
        const s = JSON.parse(localStorage.getItem(this.cle) || 'null');
        if (s) {
          if (typeof s.on === 'boolean') this.on = s.on;
          if (typeof s.vol === 'number') this.volume = Math.max(0, Math.min(1, s.vol));
          if (s.so && this.SONORITES[s.so]) this.sonorite = s.so;
          if (typeof s.fx === 'boolean') this.fx = s.fx;
          if (typeof s.fxVol === 'number') this.fxVol = Math.max(0, Math.min(1, s.fxVol));
          if (s.fxMode === 'synthe' || s.fxMode === 'reel') this.fxMode = s.fxMode;
        }
      } catch (e) { /* stockage indisponible : réglages par défaut */ }
    },
    sauver() {
      try { localStorage.setItem(this.cle, JSON.stringify({ on: this.on, vol: this.volume, so: this.sonorite, fx: this.fx, fxVol: this.fxVol, fxMode: this.fxMode })); } catch (e) { /* ignore */ }
    },
    // Le contexte audio, partagé avec les effets sonores : créé au premier besoin (après un appui du joueur).
    contexte() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    // La musique baisse un instant (générique, pouvoir) puis revient : niveau = part du volume gardée.
    duck(secondes, niveau) {
      const c = this.current;
      if (!c || !this.ctx) return;
      const g = c.B.sortie.gain, now = this.ctx.currentTime;
      g.setTargetAtTime(this.volume * niveau, now, 0.05);
      g.setTargetAtTime(this.volume, now + secondes, 0.3);
    },
    basculerFx() { this.fx = !this.fx; this.sauver(); return this.fx; },
    reglerFx(v) { this.fxVol = Math.max(0, Math.min(1, v)); this.sauver(); if (window.PA && PA.Sons) PA.Sons.volume(); },
    demande(id) { this.voulu = id; this.appliquer(); },
    appliquer() {
      if (!this.debloque) return;
      if (!this.on || !this.voulu) { this.stop(); return; }
      const c = this.current;
      if (c && c.id === this.voulu && c.sonorite === this.sonorite) return;
      this.play(this.voulu);
    },
    debloquer() { if (!this.debloque) { this.debloque = true; this.appliquer(); if (this.fxMode === 'reel' && window.PA && PA.Sons) { this.contexte(); PA.Sons.chargerReel().then(() => PA.Sons.precharger()); } } },
    basculer() { this.on = !this.on; this.sauver(); this.appliquer(); return this.on; },
    choisirSonorite(so) { if (this.SONORITES[so]) { this.sonorite = so; this.sauver(); this.appliquer(); } },
    regler(v) { this.setVolume(v); this.sauver(); },

    partition(id) { return this.cache[id] || (this.cache[id] = construire(TRACKS[id])); },
    duree(id) { return this.partition(id).len * 15 / TRACKS[id].bpm; },   // secondes d'une boucle

    play(id, sonorite) {
      if (!TRACKS[id]) return;
      this.stop();
      if (sonorite) this.sonorite = sonorite;
      const ctx = this.contexte();
      if (!ctx) return;
      const part = this.partition(id), B = banc(ctx, this.sonorite, this.volume);
      B.epique = part.epique;
      const c = this.current = { id, sonorite: this.sonorite, B, part, s: 15 / TRACKS[id].bpm, debut: ctx.currentTime + 0.08, i: 0 };
      const avance = () => {
        // on programme les notes des 300 prochaines millisecondes ; la boucle repart sans coupure
        while (true) {
          if (c.i >= c.part.evts.length) { c.i = 0; c.debut += c.part.len * c.s; }
          const e = c.part.evts[c.i], t = c.debut + e.t * c.s;
          if (t > ctx.currentTime + 0.3) break;
          if (t >= ctx.currentTime - 0.05) jouer(c.B, e, Math.max(t, ctx.currentTime), c.s);
          c.i++;
        }
      };
      avance();
      c.minuteur = setInterval(avance, 40);
    },

    stop() {
      const c = this.current;
      if (!c) return;
      clearInterval(c.minuteur);
      const g = c.B.sortie.gain, now = this.ctx.currentTime;
      g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0.0001, now + 0.25);
      setTimeout(() => { try { c.B.sortie.disconnect(); } catch (e) { /* déjà débranché */ } }, 3000);
      this.current = null;
    },

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      if (this.current) this.current.B.sortie.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    },

    // Où en est la boucle en cours : 0 au début, 1 à la fin (null si rien ne joue).
    position() {
      const c = this.current;
      if (!c) return null;
      const L = c.part.len * c.s;
      return (((this.ctx.currentTime - c.debut) % L) + L) % L / L;
    },

    // Rendu hors ligne (plus vite que le temps réel) : pour mesurer le niveau ou exporter un fichier.
    render(id, sonorite, secondes) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const part = this.partition(id), s = 15 / TRACKS[id].bpm;
      const duree = secondes || part.len * s;
      const ctx = new OAC(2, Math.ceil(duree * 44100), 44100);
      const B = banc(ctx, sonorite || this.sonorite, this.volume);
      B.epique = part.epique;
      for (let boucle = 0; boucle * part.len * s < duree; boucle++) {
        for (const e of part.evts) {
          const t = (boucle * part.len + e.t) * s;
          if (t < duree) jouer(B, e, t, s);
        }
      }
      return ctx.startRendering();
    },
  };

  PA.Music = Music;

  // Application en arrière-plan : on coupe le son (économie de batterie, et le téléphone se tait quand on le range).
  document.addEventListener('visibilitychange', () => {
    const ctx = Music.ctx;
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (Music.current) ctx.resume();
  });
})();

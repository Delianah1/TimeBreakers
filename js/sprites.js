/* =========================================================================
   PERSONNAGES DESSINÉS : des images (planches faites avec Gemini) à la place des dessins en code.
   Âge par âge : tant que l'image d'un âge n'est pas chargée (ou s'il n'en a pas), le jeu garde
   les dessins en code de js/art/*.js.

   Une planche = un atlas images/sprites/<âge>.webp, préparé par outils/decoupe-sprites.js :
   personnages tournés vers la droite, couleur d'équipe en bleu (recolorée en rouge pour l'ennemi).
   Pour chaque unité : ses poses [x, y, w, h, ax] en pixels d'atlas (ax : centre des pieds),
   et quelles poses pour le repos, la marche et l'attaque.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  // Le souffle du dragon est coupé net au bord de sa planche : on le prolonge par une flamme
  // dessinée (qui recouvre la coupure), vivante, qui s'effile au bout.
  // Prolongement : le bout de la flamme d'origine, retourné comme dans un miroir au bord de la
  // coupure (le raccord est donc parfait), qui s'efface en fondu ; il vacille.
  function souffle(ctx, u, k, ax, now, img) {
    const F = this, [px, py, pw, ph] = F.p;
    if (!F.cv) {
      const w = pw - F.x, c = document.createElement('canvas'); c.width = w * 2; c.height = ph;
      const x = c.getContext('2d');
      x.translate(w * 2, 0); x.scale(-1, 1);              // miroir…
      x.drawImage(img, px + F.x, py, w, ph, 0, 0, w * 2, ph);   // …étiré ×2 en longueur
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.globalCompositeOperation = 'destination-out';
      const g = x.createLinearGradient(0, 0, w * 2, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.35, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      x.fillStyle = g; x.fillRect(0, 0, w * 2, ph);
      F.cv = c;
    }
    const c = F.cv, sx = 1 + Math.sin(now / 70) * 0.1, sy = 1 + Math.sin(now / 53 + 1) * 0.07;
    const x0 = (pw - ax - 1.5) * k, yc = (F.y - ph) * k;
    ctx.save(); ctx.translate(x0, yc); ctx.scale(sx, sy);
    ctx.drawImage(c, 0, -F.y * k, c.width * k, ph * k);
    ctx.restore();
  }

  const ATLAS = {
    // Âge jurassique (21 novembre) : 4 unités et 3 champions (2 planches Gemini, poses fixes) ; le raptor et le cracheur ont leur planche 8 poses (25 novembre).
    jurassique: { qual: 2, unites: {
      raptor: { anim: { repos: 7, marche: [0, 1, 2, 3, 4, 5, 6], attaque: [8, 9, 10, 11] }, poses: [[0, 0, 170, 140, 89.4], [172, 0, 164, 136, 79.9], [338, 0, 169, 139, 89.2], [509, 0, 166, 137, 86.9], [677, 0, 175, 136, 90.8], [854, 0, 184, 133, 92.6], [1040, 0, 180, 140, 84.1], [1222, 0, 156, 129, 83.4], [1380, 0, 169, 88, 100.8], [1551, 0, 179, 127, 71.3], [1732, 0, 188, 139, 55.5], [1922, 0, 177, 92, 96.7]] },
      cracheur: { anim: { repos: 7, marche: [0, 1, 2, 3, 4, 5, 6], attaque: [8, 9, 10, 11] }, poses: [[0, 142, 168, 125, 89.9], [170, 142, 168, 118, 93], [340, 142, 181, 102, 88.5], [523, 142, 168, 133, 91.7], [693, 142, 167, 119, 87.9], [862, 142, 172, 106, 84.5], [1036, 142, 195, 103, 89.5], [1233, 142, 165, 154, 91.7], [1400, 142, 164, 154, 91.2], [1566, 142, 159, 155, 92.1], [1727, 142, 158, 145, 86.1], [1887, 142, 167, 154, 93.5]] },
      tricera: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 299, 147, 107, 68.2], [149, 299, 150, 103, 68.5], [301, 299, 151, 103, 68.8], [454, 299, 151, 102, 69.2], [607, 299, 152, 102, 68.3], [761, 299, 152, 93, 71.7], [915, 299, 156, 99, 62.5]] },
      ankylosaure: { anim: { repos: 0, marche: [1, 2, 3], attaque: [4, 5] }, poses: [[0, 408, 166, 80, 100.8], [168, 408, 150, 80, 81.2], [320, 408, 138, 81, 71.7], [460, 408, 171, 83, 97.2], [633, 408, 159, 91, 87.7], [794, 408, 142, 118, 79.1]] },
      'ch-spinosaure': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 528, 168, 100, 72.6], [170, 528, 169, 98, 75.2], [341, 528, 169, 99, 70.8], [512, 528, 169, 98, 67], [683, 528, 169, 98, 76.8], [854, 528, 162, 98, 57.9], [1018, 528, 178, 99, 83]] },
      'ch-reine-raptors': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 630, 129, 97, 83.3], [131, 630, 137, 95, 85.6], [270, 630, 141, 95, 83.3], [413, 630, 140, 98, 83.7], [555, 630, 139, 96, 83.6], [696, 630, 113, 80, 61.7], [811, 630, 92, 96, 29.7], [905, 630, 117, 98, 73.4]] },
      'ch-quetzal': { anim: { repos: 0, marche: [1, 2, 3], attaque: [4, 5] }, poses: [[0, 730, 194, 103, 71.1], [196, 730, 171, 122, 58.9], [369, 730, 184, 105, 57.5], [555, 730, 163, 90, 32.1], [720, 730, 165, 120, 56.7], [887, 730, 177, 110, 70.7]] },
    } },
    // 24 novembre : Magma (caché), Pierre, Antiquité (sans le char ni Hannibal, à refaire).
    magma: { qual: 2, unites: {
      salamandre: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 0, 133, 61, 74.8], [135, 0, 122, 64, 66.6], [259, 0, 133, 65, 82.5], [394, 0, 123, 65, 63.4], [519, 0, 133, 61, 74.8], [654, 0, 97, 79, 35.9], [753, 0, 144, 71, 53.6]] },
      cendreux: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 81, 71, 102, 28.4], [73, 81, 70, 103, 28.5], [145, 81, 76, 101, 28.3], [223, 81, 75, 103, 31.2], [300, 81, 76, 101, 30.1], [378, 81, 80, 108, 30.6], [460, 81, 123, 103, 29.4]] },
      'golem-obsidienne': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 191, 115, 120, 59.2], [117, 191, 113, 121, 55.9], [232, 191, 112, 123, 58], [346, 191, 108, 123, 57.3], [456, 191, 112, 122, 58.1], [570, 191, 117, 129, 45.7], [689, 191, 111, 114, 58.5]] },
      'elementaire-lave': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 322, 94, 80, 41.5], [96, 322, 97, 80, 42.7], [195, 322, 111, 79, 49.3], [308, 322, 110, 80, 48.1], [420, 322, 96, 79, 43], [518, 322, 80, 80, 33.3], [600, 322, 107, 81, 53.1]] },
      'petit-elementaire': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 405, 65, 62, 31], [67, 405, 66, 63, 30.3], [135, 405, 66, 63, 30.9], [203, 405, 67, 64, 31.2], [272, 405, 67, 64, 30.8], [341, 405, 64, 63, 23.6], [407, 405, 74, 63, 31.3]] },
      'ch-titan-magma': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 471, 150, 131, 63.3], [152, 471, 149, 131, 64], [303, 471, 110, 118, 55.1], [415, 471, 126, 132, 52.3], [543, 471, 98, 116, 50.5], [643, 471, 124, 122, 70.5], [769, 471, 142, 115, 74.9]] },
      'ch-reine-salamandres': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 605, 146, 95, 69.7], [148, 605, 146, 92, 70.2], [296, 605, 145, 97, 69.7], [443, 605, 139, 99, 65.1], [584, 605, 146, 95, 65.8], [732, 605, 140, 90, 68.1], [874, 605, 131, 90, 64.3]] },
      'ch-phenix': { anim: { repos: 0, marche: [0, 1, 2], attaque: [3, 4] }, poses: [[0, 706, 141, 134, 44], [143, 706, 88, 152, 27.8], [233, 706, 121, 148, 30.1], [356, 706, 107, 146, 35.5], [465, 706, 87, 147, 21.8], [554, 706, 116, 149, 55.4], [672, 706, 113, 151, 49.3]] },
    } },
    pierre: { qual: 2, unites: {
      cogneur: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 0, 99, 109, 43.7], [101, 0, 77, 101, 34], [180, 0, 83, 99, 42.2], [265, 0, 80, 101, 39.2], [347, 0, 80, 101, 31.1], [429, 0, 84, 123, 37.6], [515, 0, 108, 119, 41.3]] },
      frondeur: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 125, 62, 100, 28.6], [64, 125, 73, 98, 31.6], [139, 125, 82, 93, 40.2], [223, 125, 83, 97, 44.6], [308, 125, 78, 94, 37.4], [388, 125, 97, 113, 45.5], [487, 125, 114, 98, 28.6]] },
      mammouth: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 240, 126, 120, 54.1], [128, 240, 126, 120, 52.9], [256, 240, 127, 120, 51.4], [385, 240, 126, 120, 52.2], [513, 240, 128, 120, 52.7], [643, 240, 127, 121, 41.1], [772, 240, 138, 113, 67.2]] },
      chaman: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 363, 82, 81, 36.1], [84, 363, 87, 82, 37.7], [173, 363, 94, 82, 39.4], [269, 363, 95, 84, 40.5], [366, 363, 91, 83, 40.5], [459, 363, 78, 84, 30], [539, 363, 110, 80, 30.1]] },
      'ch-mammouth-clan': { anim: { repos: 0, marche: [1, 2, 3], attaque: [5, 6] }, poses: [[0, 449, 127, 100, 53.2], [129, 449, 127, 100, 52.1], [258, 449, 127, 100, 51.5], [387, 449, 127, 100, 54.6], [516, 449, 131, 97, 55.6], [649, 449, 125, 94, 51.6], [776, 449, 125, 110, 39.2]] },
      'ch-grand-chaman': { anim: { repos: 0, marche: [1, 2, 3], attaque: [5, 6] }, poses: [[0, 561, 73, 111, 29.4], [75, 561, 80, 110, 29], [157, 561, 86, 109, 28.9], [245, 561, 84, 110, 30.1], [331, 561, 103, 108, 50.2], [436, 561, 118, 113, 56.8], [556, 561, 125, 100, 29.5]] },
      'ch-ours-cavernes': { anim: { repos: 0, marche: [1, 2, 3], attaque: [4, 6] }, poses: [[0, 676, 120, 100, 50.3], [122, 676, 120, 100, 47.9], [244, 676, 125, 99, 49.1], [371, 676, 125, 102, 45.7], [498, 676, 124, 110, 8.7], [624, 676, 120, 85, 57.6], [746, 676, 119, 111, 32]] },
    } },
    antiquite: { qual: 2, unites: {
      hoplite: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 0, 76, 121, 35.4], [78, 0, 121, 116, 50.7], [201, 0, 121, 116, 57.3], [324, 0, 121, 116, 55.8], [447, 0, 121, 115, 51.5], [570, 0, 124, 110, 62.4], [696, 0, 138, 110, 61.8]] },
      archer: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 123, 72, 100, 27.2], [74, 123, 77, 98, 28.7], [153, 123, 81, 93, 28.8], [236, 123, 82, 97, 30], [320, 123, 79, 94, 26.2], [401, 123, 93, 109, 30], [496, 123, 128, 107, 32]] },
      elephant: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 234, 131, 145, 58.3], [133, 234, 131, 145, 58.6], [266, 234, 130, 145, 55.1], [398, 234, 131, 145, 58.5], [531, 234, 131, 145, 56.8], [664, 234, 130, 150, 47.8], [796, 234, 127, 134, 62.6]] },
      'ch-centurion': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [4, 5] }, poses: [[0, 386, 77, 118, 42.2], [79, 386, 82, 115, 42.2], [163, 386, 89, 117, 49.6], [254, 386, 91, 116, 51.7], [347, 386, 86, 115, 44.5], [435, 386, 120, 110, 56.6], [557, 386, 97, 97, 52.5]] },
      'ch-pharaon': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [4, 5] }, poses: [[0, 506, 76, 101, 28.7], [78, 506, 86, 100, 28.6], [166, 506, 87, 98, 27.6], [255, 506, 88, 100, 28.8], [345, 506, 100, 109, 42.2], [447, 506, 117, 102, 28.6], [566, 506, 85, 110, 41.5]] },
    } },
    // Âge médiéval (21 novembre) : 4 unités et 3 champions (3 planches Gemini).
    medieval: { qual: 2, unites: {
      mangonneau: { echelle: 1.6, roule: true, anim: { repos: 0, marche: [1, 2, 3, 5], attaque: [6, 7] }, poses: [[0, 355, 212, 142, 104.9], [214, 355, 228, 143, 115.2], [444, 355, 225, 143, 114], [671, 355, 211, 143, 106.5], [884, 355, 198, 135, 98.1], [1084, 355, 250, 133, 127.5], [1336, 355, 227, 133, 115], [1565, 355, 213, 161, 101.4]] },
      'ch-chevalier-noir': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 518, 123, 152, 55.8], [125, 518, 125, 150, 58.3], [252, 518, 130, 139, 65], [384, 518, 130, 139, 63.9], [516, 518, 131, 139, 62.7], [649, 518, 138, 160, 71], [789, 518, 139, 162, 70.7]] },
      'ch-roi-sorcier': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 682, 107, 140, 43.7], [109, 682, 111, 141, 48.4], [222, 682, 120, 141, 61.2], [344, 682, 121, 141, 59.3], [467, 682, 120, 140, 58.1], [589, 682, 120, 163, 53.9], [711, 682, 151, 140, 65.9]] },
      'ch-dragon': { feu: { pose: 5, x: 172, y: 59, p: [833, 847, 226, 137], dessiner: souffle }, anim: { repos: 0, marche: [1, 2, 3], attaque: [4, 5] }, poses: [[0, 847, 164, 138, 78.4], [166, 847, 165, 138, 77.5], [333, 847, 166, 140, 71.9], [501, 847, 168, 138, 71.1], [671, 847, 160, 137, 74.1], [833, 847, 226, 137, 78.2]] },
      fantassin: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 0, 65, 105, 32.9], [67, 0, 72, 105, 34.9], [141, 0, 71, 106, 34.1], [214, 0, 63, 105, 27.6], [279, 0, 66, 105, 30], [347, 0, 94, 109, 52.1], [443, 0, 116, 102, 33.2]] },
      arbaletrier: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 111, 71, 101, 30.2], [73, 111, 85, 102, 26.7], [160, 111, 89, 103, 27.9], [251, 111, 85, 103, 27], [338, 111, 86, 102, 26.9], [426, 111, 89, 100, 25.9], [517, 111, 122, 100, 26.2]] },
      chevalier: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 216, 100, 137, 42.3], [102, 216, 118, 137, 46.1], [222, 216, 116, 137, 58.6], [340, 216, 116, 137, 58.3], [458, 216, 116, 137, 58.2], [576, 216, 148, 137, 57.6], [726, 216, 158, 137, 67]] },
    } },
  };

  // ANIMATIONS (GIF animé de Gemini → outils/decoupe-gif.js → images/sprites/<âge>-anim.webp).
  // Pour ces unités, de vrais clips image par image remplacent les poses fixes ci-dessus.
  // Par clip : taille du cadre (w, h), accroche (ax : centre du corps, sol : ligne des pieds),
  // nombre d'images n, et pour l'attaque l'image où le coup porte. Les images sont rangées dans
  // l'ordre, en lignes de 2048 px (même rangement que l'outil).
  const ANIM = {
    medieval: {
      fantassin: { repos: [45, 73, 22.3, 73, 30], marche: [51, 76, 27.1, 75, 30], attaque: [92, 82, 45.2, 82, 30, 13] },
      arbaletrier: { repos: [50, 71, 19.6, 71, 30], marche: [60, 73, 21.7, 73, 30], attaque: [77, 70, 24.2, 70, 17, 16] },
      chevalier: { repos: [74, 96, 36.5, 96, 30], marche: [83, 96, 45.6, 96, 30], attaque: [92, 96, 46.4, 96, 30, 19] },
      // servant d'un GIF, catapulte d'un autre (outils/decoupe-gif.js, assembler) ; repos = une image
      // (echelle : le servant fait à peu près la taille d'un fantassin ; la catapulte est à côté)
      mangonneau: { echelle: 1.2, repos: [220, 116, 101, 116, 1], marche: [241, 117, 121, 116, 20], attaque: [260, 159, 121, 159, 12, 3] },
      // champions : images choisies case par case dans leur GIF (le dragon garde ses poses fixes)
      'ch-chevalier-noir': { repos: [87, 104, 43.5, 104, 30], marche: [88, 100, 44.6, 99, 18], attaque: [93, 112, 45.1, 111, 14, 9] },
      'ch-roi-sorcier': { repos: [73, 97, 34.9, 97, 30], marche: [79, 97, 39.4, 97, 17], attaque: [108, 122, 38.8, 121, 13, 4] },
    },
  };
  function ranger(T) {
    let x = 0, y = 0, hl = 0;
    const res = {};
    for (const id in T) {
      res[id] = {};
      for (const nom of ['repos', 'marche', 'attaque']) {
        const [w, h, ax, sol, n, coup] = T[id][nom], i = [];
        for (let k = 0; k < n; k++) {
          if (x + w > 2048) { x = 0; y += hl + 1; hl = 0; }
          i.push([x, y]); x += w + 1; hl = Math.max(hl, h);
        }
        res[id][nom] = { w, h, ax, sol, n, coup: coup || 0, i };
      }
    }
    return res;
  }
  const IPS = 10;   // images par seconde du GIF

  // Poussière sous les pas : de petits nuages beiges qui naissent aux pieds et s'étirent vers l'arrière.
  // Sans état : chaque nuage a un âge tiré de la distance parcourue (un nuage par ~14 px), il dure 3 pas.
  function poussiere(ctx, u, larg) {
    const PAS = 14, dist = (u.walk || 0) / 0.18, n0 = Math.floor(dist / PAS);
    const gros = Math.min(1.8, Math.max(0.8, larg / 60));
    ctx.save();
    for (let j = 0; j < 3; j++) {
      const age = (dist - (n0 - j) * PAS) / (PAS * 3);   // 0 → 1
      if (age < 0 || age > 1) continue;
      const cote = ((n0 - j) & 1) ? -0.15 : 0.15;        // un pied, puis l'autre
      const px = (cote - 0.25) * larg * 0.5 - age * 14 * gros, py = -2 - age * 6 * gros, r = (2.5 + age * 5) * gros;
      ctx.globalAlpha = 0.42 * (1 - age);
      ctx.fillStyle = '#d9c39a';
      ctx.beginPath(); ctx.ellipse(px, py, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#efe2c4';
      ctx.beginPath(); ctx.ellipse(px + r * 0.3, py - r * 0.3, r * 0.6, r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function brancherClips(T, bleu, rouge) {
    const R = ranger(T);
    for (const id in R) {
      const art = PA.Art && PA.Art.units[id];
      if (!art) continue;
      const Cl = R[id], code = art.drawCode || art.draw;
      const k = art.h * (T[id].echelle || ECHELLE) / Cl.repos.h;
      art.drawCode = code; art.clips = true;
      art.draw = function (ctx, u, team, dark, atk, R2) {
        if (PA.Sprites.coupe) return code.call(this, ctx, u, team, dark, atk, R2);
        const now = performance.now();
        // un nouveau coup : la recharge repart, le clip d'attaque se cale dessus
        if ((u.attackAnim || 0) > (u._spA || 0) + 0.01) { u._spAt = now; u._spCd = Math.max(0.15, u.cd || 0); }
        u._spA = u.attackAnim || 0;
        if (u.walk !== u._spW) { u._spW = u.walk; u._spT = now; }
        const marche = u.moving || now - (u._spT || -1e9) < 150;
        const combat = !marche && u._spAt && now - u._spAt < u._spCd * 1000 + 400;
        let C, i;
        if (combat) {
          // l'image du coup tombe à l'instant des dégâts ; la suite du clip (relâche, armé) remplit la recharge
          C = Cl.attaque;
          const ph = Math.min(1, Math.max(0, 1 - (u.cd || 0) / u._spCd));
          i = (C.coup + Math.floor(ph * C.n)) % C.n;
        } else if (marche) {
          // image liée à la distance parcourue : les pas suivent le déplacement (≈ 11 images/s à vitesse normale)
          C = Cl.marche;
          const dist = (u.walk || 0) / 0.18, pas = Math.max(1, (u.speed || 40) / 11);
          i = Math.floor(dist / pas) % C.n;
        } else {
          C = Cl.repos;
          i = Math.floor(now / (1000 / IPS) + (u.id || 0) * 7) % C.n;
        }
        const [x, y] = C.i[i], img = u.side === -1 ? rouge : bleu;
        if (marche) poussiere(ctx, u, C.w * k);
        ctx.drawImage(img, x, y, C.w, C.h, -C.ax * k, -C.sol * k, C.w * k, C.h * k);
        if (u.flash > 0) {
          ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(img, x, y, C.w, C.h, -C.ax * k, -C.sol * k, C.w * k, C.h * k);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      };
    }
  }

  // Copie de l'atlas où le bleu d'équipe devient rouge (l'ennemi).
  function rougir(img) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (b > r + 40 && b > g + 20) { d[i] = b; d[i + 1] = Math.round(g * 0.3); d[i + 2] = Math.round(r * 0.9); }
    }
    x.putImageData(im, 0, 0);
    return c;
  }

  // Taille : la pose de repos fait ECHELLE × la hauteur du dessin en code qu'elle remplace (art.h),
  // pour que chaque unité garde à peu près sa place à l'écran.
  const ECHELLE = 1.14;

  // Point d'accroche de chaque pose : le centre de masse du dessin (et non le pied avant, qui
  // change d'une pose de marche à l'autre et faisait sautiller le personnage d'avant en arrière).
  // Les poses d'attaque gardent leurs pieds (une fente vers l'avant doit avancer), décalés comme au repos.
  function accroches(U, img) {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const centre = ([px, py, w, h]) => {
      const d = x.getImageData(px, py, w, h).data;
      let s = 0, m = 0;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const a = d[(yy * w + xx) * 4 + 3]; s += a; m += a * xx; }
      return s ? m / s : w / 2;
    };
    const cx = U.poses.map(centre), an = U.anim, repos = U.poses[an.repos];
    const ecart = cx[an.repos] - repos[4];
    return U.poses.map((p, i) => an.attaque.includes(i) ? p[4] + ecart : cx[i]);
  }

  // Poses fixes rendues vivantes (24 novembre) :
  //  - fondu court d'une pose à la suivante (plus de saut d'une image à l'autre) ;
  //  - dans le pas : le corps s'écrase un peu quand le pied touche le sol et s'étire entre deux appuis ;
  //  - le coup : le corps se ramasse en arrière, puis se jette en avant au moment des dégâts ;
  //  - touché : un petit recul écrasé, en plus de l'éclair blanc ;
  //  - poussière sous les pas (comme les clips du médiéval), sauf pour ce qui vole.
  // Planches « 8 poses » (assets/prompts-gemini.md) : marche sur 8 poses, attaque sur 4
  // (préparation, élan, coup, retour). Préparation et élan remplissent la fin de la recharge,
  // le coup tombe à l'instant des dégâts, le retour le suit.
  const FONDU = 90;   // ms
  function poseAttaque(an, u, now) {
    const A = an.attaque;
    if (A.length < 4) return u.attackAnim > 0 ? A[(1 - u.attackAnim / 0.25) < 0.45 ? 0 : 1] : -1;
    if (u.attackAnim > 0) return A[(1 - u.attackAnim / 0.25) < 0.55 ? 2 : 3];
    // entre deux coups : la recharge qui s'achève arme le suivant
    if (!u._spAt || now - u._spAt > (u._spCd || 1) * 1000 + 300 || u.moving) return -1;
    const reste = u.cd || 0;
    return reste < 0.14 ? A[1] : reste < 0.38 ? A[0] : A[3];
  }
  function brancher(A, bleu, rouge) {
    for (const id in A.unites) {
      const art = PA.Art && PA.Art.units[id];
      if (!art || art.clips) continue;   // déjà animée par un clip (plus fin que les poses fixes)
      const U = A.unites[id], code = art.drawCode || art.draw;
      const k = art.h * (U.echelle || ECHELLE) / U.poses[U.anim.repos][3];
      const AX = accroches(U, bleu);
      const vole = /quetzal|phenix/.test(id);   // en vol : pas de poussière
      art.drawCode = code;
      const pose = (ctx, img, i, alpha) => {
        const [x, y, w, h] = U.poses[i], ax = AX[i];
        if (alpha < 1) ctx.globalAlpha = alpha;
        ctx.drawImage(img, x, y, w, h, -ax * k, -h * k, w * k, h * k);
        ctx.globalAlpha = 1;
      };
      art.draw = function (ctx, u, team, dark, atk, R) {
        if (PA.Sprites.coupe) return code.call(this, ctx, u, team, dark, atk, R);
        const an = U.anim, now = performance.now(), H = art.h;
        // En marche si l'unité a avancé il y a peu : une file qui piétine ne clignote plus
        // entre la pose de repos et la marche à chaque image.
        if (u.walk !== u._spW) { u._spW = u.walk; u._spT = now; }
        const marche = u.moving || now - (u._spT || -1e9) < 220;
        // un nouveau coup : on note quand, et la recharge qui suit
        if ((u.attackAnim || 0) > (u._spA || 0) + 0.01) { u._spAt = now; u._spCd = Math.max(0.3, u.cd || 0.3); }
        u._spA = u.attackAnim || 0;
        const ph = (((u.walk || 0) / (Math.PI * 2)) % 1 + 1) % 1;   // 0 → 1 sur un cycle de marche
        let i = an.repos, dx = 0, dy = 0, rot = 0, sx = 1, sy = 1;
        const ia = poseAttaque(an, u, now);
        if (ia >= 0) {
          i = ia;
          if (u.attackAnim > 0) {
            const p = 1 - u.attackAnim / 0.25;            // 0 : l'instant du coup → 1
            dx = H * 0.07 * Math.max(0, 1 - p * 1.6);    // jeté en avant, puis revient
            sx = 1 + 0.05 * Math.max(0, 1 - p * 2.5); sy = 2 - sx;
          } else if (an.attaque.length >= 4 && i === an.attaque[0]) {
            dx = -H * 0.03; sx = 0.97; sy = 1.03;        // il se ramasse avant de frapper
          }
        } else if (marche && U.roule) {   // engin sur roues : il cahote, sans pas
          i = an.marche[Math.floor(ph * an.marche.length)];
          dy = -Math.abs(Math.sin(ph * Math.PI * 4)) * H * 0.012;
        } else if (marche) {
          i = an.marche[Math.floor(ph * an.marche.length)];
          // deux appuis par cycle : écrasé au contact, étiré et monté entre deux appuis, et un peu de tangage
          const c = Math.cos(ph * Math.PI * 4);
          dy = -Math.max(0, -c) * H * 0.035;
          sy = 1 - 0.045 * Math.max(0, c) + 0.025 * Math.max(0, -c); sx = 1 + 0.035 * Math.max(0, c) - 0.015 * Math.max(0, -c);
          rot = Math.sin(ph * Math.PI * 2) * 0.025;
        } else sy = 1 + Math.sin(now / 520 + (u.id || 0)) * 0.012;   // respiration au repos
        if (u.flash > 0) { const f = u.flash / 0.1; dx -= H * 0.035 * f; sy *= 1 - 0.05 * f; sx *= 1 + 0.03 * f; }
        // fondu : la pose précédente s'efface pendant FONDU ms
        if (i !== u._spI) { u._spP = u._spI; u._spI = i; u._spIt = now; }
        const f = u._spP != null ? Math.min(1, (now - u._spIt) / FONDU) : 1;
        const img = u.side === -1 ? rouge : bleu;
        if (marche && !vole && !U.roule && !(u.alt > 0)) poussiere(ctx, u, U.poses[i][2] * k);
        ctx.save(); ctx.translate(dx, dy); ctx.rotate(rot); ctx.scale(sx, sy);
        pose(ctx, img, i, 1);
        if (f < 1) pose(ctx, img, u._spP, (1 - f) * 0.85);
        if (u.flash > 0) {   // touché : un éclair blanc par-dessus
          ctx.globalCompositeOperation = 'lighter'; pose(ctx, img, i, 0.5); ctx.globalCompositeOperation = 'source-over';
        }
        if (U.feu && i === U.feu.pose) U.feu.dessiner(ctx, u, k, AX[i], now, bleu);   // le souffle suit le corps
        ctx.restore();
      };
    }
  }

  // TOURELLES dessinées (24 novembre) : 3 poses par tourelle, repos, tir, recharge.
  // Repère des tourelles (js/art.js) : origine sur le toit de la base, pied à y = 8, environ 27 de haut.
  const TOURELLES = {
    jurassique: {
      'lance-epines': [[0, 0, 248, 169, 101.6], [250, 0, 222, 167, 104.2], [474, 0, 363, 170, 222.4]],
      'canon-ambre': [[0, 172, 240, 145, 86.1], [242, 172, 307, 162, 86.5], [551, 172, 225, 162, 87.3]],
      geyser: [[0, 336, 184, 139, 94.6], [186, 336, 180, 179, 91.5], [368, 336, 181, 163, 92.1]],
    },
    magma: {
      brasero: [[0, 0, 130, 116, 63.7], [132, 0, 235, 142, 81.8], [369, 0, 144, 131, 67.9]],
      'geyser-magma': [[0, 144, 170, 186, 85.8], [172, 144, 256, 186, 86.7], [430, 144, 170, 186, 86.3]],
      'mortier-obsidienne': [[0, 332, 173, 153, 79.1], [175, 332, 249, 175, 81.4], [426, 332, 182, 175, 97.8]],
    },
  };
  const HAUT_TOURELLE = 27;
  function brancherTourelles(T, bleu, rouge) {
    for (const id in T) {
      const P = T[id], code = PA.Art.turrets[id];
      const k = HAUT_TOURELLE / P[0][3];
      PA.Art.turrets[id] = function (ctx, a, team, dark) {
        if (PA.Sprites.coupe && code) return code(ctx, a, team, dark);
        // a : 1 au tir, puis redescend à 0 en 0,2 s
        const [x, y, w, h, ax] = P[a > 0.55 ? 1 : a > 0 ? 2 : 0];
        // l'ennemi (ctx déjà retourné par render.js) reçoit la couleur d'équipe rouge, #cf4338
        const img = team === '#cf4338' ? rouge : bleu;
        ctx.drawImage(img, x, y, w, h, -ax * k, 8 - h * k, w * k, h * k);
      };
    }
  }

  // PROJECTILES dessinés (planches d'effets, outils/decoupe-effets.js) :
  // [x, y, w, h, tête x, tête y, angle du vol dans le dessin], atlas à 2 px par pixel d'écran.
  // Seulement des looks propres à ces âges : les autres âges gardent leurs projectiles.
  const PROJ = {
    venom: [0, 0, 60, 17, 55, 8.6, 0], spike: [62, 0, 60, 24, 57.1, 12, 0], amber: [124, 0, 48, 22, 36.2, 10.9, 0],
    lava: [174, 0, 48, 44, 32.3, 29.7, 0.75], braise: [224, 0, 48, 11, 42.9, 6.3, 0], cendre: [274, 0, 60, 29, 44.4, 14.4, 0],
    obsidienne: [336, 0, 44, 15, 33.6, 7.7, 0], pebble: [382, 0, 24, 10, 19.2, 4.8, 0], flint: [408, 0, 40, 12, 36.1, 6.1, 0],
    boulder: [450, 0, 52, 27, 34.2, 14.6, 0.35], 'pot-braises': [504, 0, 48, 30, 39.2, 21.7, 0.6],
  };
  // Pouvoirs ultimes, même atlas : ce qui tombe (drops) et ce qui charge au sol (4 poses de course).
  const CHUTES = { meteor: [554, 0, 92, 80, 72.1, 64.4, 0.6], lavabomb: [648, 0, 72, 69, 49.7, 54.9, 0.75], rock: [722, 0, 64, 64, 39.3, 42.2, 1.1] };
  const CHARGES = {
    raptor: [[788, 0, 168, 84, 84], [958, 0, 160, 84, 80], [1120, 0, 168, 84, 84], [1290, 0, 168, 84, 84]],
    mammouth: [[1460, 0, 340, 157, 170], [1802, 0, 346, 157, 173], [2150, 0, 312, 157, 156], [2464, 0, 304, 157, 152]],
  };
  function brancherUltimes(img) {
    for (const look in CHUTES) {
      const [x, y, w, h, hx, hy, angle] = CHUTES[look], code = PA.Art.drops[look];
      PA.Art.drops[look] = function (ctx, d) {
        if (PA.Sprites.coupe && code) return code(ctx, d);
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.PI / 2 - angle + 0.35);   // tombe presque à la verticale
        ctx.drawImage(img, x, y, w, h, -hx / 2, -hy / 2, w / 2, h / 2);
        ctx.restore();
      };
    }
    const charge0 = PA.Pouvoirs && PA.Pouvoirs.charge;
    if (!charge0) return;
    PA.Pouvoirs.charge = function (ctx, s) {
      const P = CHARGES[s.look];
      if (!P || PA.Sprites.coupe) return charge0.call(this, ctx, s);
      const [x, y, w, h, ax] = P[Math.floor((s.walk || 0) * 1.3 / Math.PI * 2) % 4 & 3];
      ctx.drawImage(img, x, y, w, h, s.x - ax / 2, PA.CONFIG.world.groundY - h / 2 + 2, w / 2, h / 2);
      return true;
    };
  }
  // Impacts des tirs en zone, même atlas : [x, y, w, h, milieu du bas x, y]. L'image grossit vite puis s'efface.
  const IMPACTS = {
    lava: [2770, 0, 144, 121, 70.4, 117.8], obsidienne: [2916, 0, 120, 90, 60, 86.5],
    boulder: [3038, 0, 140, 84, 69.2, 81], 'pot-braises': [3180, 0, 116, 92, 58, 88],
    // ce qui tombe du ciel (pouvoirs ultimes)
    meteor: [3298, 0, 192, 125, 96, 117.9], lavabomb: [3492, 0, 180, 149, 88.5, 145.2], rock: [3674, 0, 180, 120, 90, 115.3],
  };
  // Le reste des pouvoirs ultimes (25 novembre), même atlas : [x, y, w, h, accroche x, y]
  const ULT = {
    cri: [3856, 0, 240, 194, 4.6, 189.2],          // tête de T-rex du Rugissement (accroche : en bas à gauche)
    flaque: [4098, 0, 220, 78, 110, 70],           // flaques de l'Éruption
    coulee: [4320, 0, 640, 75, 320, 64],           // rivière de lave de la Coulée
    carapace: [4962, 0, 300, 201, 149.6, 193.7],   // dôme de la Carapace d'obsidienne
    fosse: [5264, 0, 480, 150, 239.6, 81],         // Fosse à pieux (accroche : le niveau du sol)
  };
  // Dessine une image de ULT : son accroche en (x, y), largeur l à l'écran, hauteur h (proportionnelle si absente).
  function ult(ctx, nom, x, y, l, h) {
    const [sx, sy, w, hh, ax, ay] = ULT[nom], kx = l / w, ky = h != null ? h / hh : kx;
    ctx.drawImage(imgImpacts, sx, sy, w, hh, x - ax * kx, y - ay * ky, w * kx, hh * ky);
  }
  function brancherPouvoirs() {
    const P = PA.Pouvoirs, sol0 = P && P.sol, des0 = P && P.dessiner;
    if (!sol0 || !des0) return;
    const G = PA.CONFIG.world.groundY, K = PA.BattleConst || {};
    const PF = K.PLAYER_FRONT || PA.CONFIG.world.baseWidth || 120;
    const dessinee = z => z.look === 'fosse' || z.look === 'flaque' || z.image === 'coulee';
    // Au sol : fosse, flaques, rivière de lave (les autres zones gardent leur dessin en code)
    P.sol = function (ctx, b) {
      const pw = b.pw;
      if (!pw || PA.Sprites.coupe || !imgImpacts) return sol0.call(this, ctx, b);
      const toutes = pw.zones;
      for (const z of toutes) {
        if (!dessinee(z)) continue;
        const a = Math.max(0, Math.min(1, z.t / 0.3, (z.max - z.t) / 0.4)), cx = (z.x0 + z.x1) / 2, L = z.x1 - z.x0;
        ctx.save(); ctx.globalAlpha = a;
        if (z.look === 'fosse') {
          const o = Math.min(1, z.t / 0.25);   // le piège s'ouvre
          ult(ctx, 'fosse', cx, G + 2, L * 1.15, 150 / 2 * (L * 1.15) / 240 * o);
        } else if (z.look === 'flaque') ult(ctx, 'flaque', cx, G + 6, L * 1.3);
        else {
          const k = Math.sin(performance.now() / 300) * 0.02;   // la lave ondule
          ult(ctx, 'coulee', cx, G + 9, L * 1.04, 40 * (1 + k));
        }
        ctx.restore();
      }
      pw.zones = toutes.filter(z => !dessinee(z));
      try { sol0.call(this, ctx, b); } finally { pw.zones = toutes; }
    };
    // Par-dessus : dôme d'obsidienne, tête du T-rex ; plus de flammes en code sur la lave dessinée
    P.dessiner = function (ctx, b) {
      const pw = b.pw;
      if (!pw || PA.Sprites.coupe || !imgImpacts) return des0.call(this, ctx, b);
      const toutes = pw.zones, look = pw.guardLook, dome = pw.guard > 0 && pw.guardImage === 'carapace';
      pw.zones = toutes.filter(z => !dessinee(z));
      if (dome) pw.guardLook = '';
      try { des0.call(this, ctx, b); } finally { pw.zones = toutes; pw.guardLook = look; }
      if (dome) {
        // le dôme couvre tes unités, de ta base à la tête de ta ligne ; il pousse, puis s'efface
        const tete = b.pu.filter(u => !u.dead).reduce((m, u) => Math.max(m, u.x), 0);
        const x1 = Math.max(PF + 120, tete + 60), L = x1 + 20, monte = Math.min(1, ((pw.guardMax || 5) - pw.guard) / 0.35);
        ctx.save(); ctx.globalAlpha = 0.5 * Math.min(1, pw.guard * 2);
        ult(ctx, 'carapace', (x1 - 20) / 2, G + 6, L, Math.min(260, L * 0.55) * monte);
        ctx.restore();
      }
      if (pw.onde > 0 && pw.ondeLook === 'cri') {
        // la tête surgit derrière ta base au moment du cri, puis se retire
        const k = 1 - pw.onde / 0.9, s = Math.min(1, k * 5) * (1 - Math.max(0, k - 0.75) * 2);
        ctx.save(); ctx.globalAlpha = Math.min(1, pw.onde * 3);
        ult(ctx, 'cri', PF - 120, G - 55, 165 * (0.6 + 0.4 * s));
        ctx.restore();
      }
    };
  }
  let imgImpacts = null;
  function dessinerImpact(ctx, p, a) {
    const I = IMPACTS[p.impact];
    if (!I || !imgImpacts || PA.Sprites.coupe) return;
    const [x, y, w, h, bx, by] = I;
    const t = 1 - a, k = (0.55 + 0.6 * Math.min(1, t * 3)) * Math.max(0.7, (p.taille || 50) / 50) / 2;
    ctx.globalAlpha = Math.min(1, a * 2.2);
    ctx.drawImage(imgImpacts, x, y, w, h, p.x - bx * k, p.y - by * k, w * k, h * k);
    ctx.globalAlpha = 1;
  }
  function brancherProjectiles(img) {
    brancherUltimes(img);
    imgImpacts = img;
    for (const look in IMPACTS) PA.Sprites.impact[look] = true;
    brancherPouvoirs();
    for (const look in PROJ) {
      const [x, y, w, h, hx, hy, angle] = PROJ[look], code = PA.Art.projectiles[look];
      PA.Art.projectiles[look] = function (ctx, p, dir) {
        if (PA.Sprites.coupe && code) return code(ctx, p, dir);
        ctx.translate(p.x, p.y);
        const g = Math.cos(dir) < 0;          // vers la gauche : on garde le dessin à l'endroit
        ctx.rotate(dir); if (g) ctx.scale(1, -1);
        ctx.rotate(-angle);
        ctx.drawImage(img, x, y, w, h, -hx / 2, -hy / 2, w / 2, h / 2);
      };
    }
  }

  PA.Sprites = {
    ATLAS, ANIM, ranger, rougir, dessinerImpact,
    impact: {},     // looks de projectiles qui ont une image d'impact (remplie au chargement)
    coupe: false,   // vrai : on revient aux dessins en code (comparaison)
    charges: {},
    charger() {
      // chaque image est suivie par l'écran de chargement (js/prechargement.js)
      const Image = function () { const im = new window.Image(); if (PA.Precharge) PA.Precharge.suivre(im); return im; };
      for (const age in ATLAS) {
        const img = new Image();
        img.onload = () => { try { brancher(ATLAS[age], img, rougir(img)); this.charges[age] = true; } catch (e) { /* dessins en code */ } };
        img.src = 'images/sprites/' + age + '.webp';
      }
      for (const age in ANIM) {
        const img = new Image();
        img.onload = () => { try { brancherClips(ANIM[age], img, rougir(img)); this.charges[age + '-anim'] = true; } catch (e) { /* poses fixes */ } };
        img.src = 'images/sprites/' + age + '-anim.webp';
      }
      { const img = new Image();
        img.onload = () => { try { brancherProjectiles(img); this.charges.projectiles = true; } catch (e) { /* dessins en code */ } };
        img.src = 'images/sprites/projectiles.webp'; }
      for (const age in TOURELLES) {
        const img = new Image();
        img.onload = () => { try { brancherTourelles(TOURELLES[age], img, rougir(img)); this.charges[age + '-tourelles'] = true; } catch (e) { /* dessins en code */ } };
        img.src = 'images/sprites/' + age + '-tourelles.webp';
      }
    },
  };
  PA.Sprites.charger();
})();

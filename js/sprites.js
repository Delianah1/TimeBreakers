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
  const ATLAS = {
    // Âge médiéval (21 novembre) : 4 unités et 3 champions (3 planches Gemini).
    medieval: { qual: 2, unites: {
      mangonneau: { echelle: 1, anim: { repos: 0, marche: [1, 2, 3, 5], attaque: [6, 7] }, poses: [[0, 355, 212, 142, 104.9], [214, 355, 228, 143, 115.2], [444, 355, 225, 143, 114], [671, 355, 211, 143, 106.5], [884, 355, 198, 135, 98.1], [1084, 355, 250, 133, 127.5], [1336, 355, 227, 133, 115], [1565, 355, 213, 161, 101.4]] },
      'ch-chevalier-noir': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 518, 123, 152, 55.8], [125, 518, 125, 150, 58.3], [252, 518, 130, 139, 65], [384, 518, 130, 139, 63.9], [516, 518, 131, 139, 62.7], [649, 518, 138, 160, 71], [789, 518, 139, 162, 70.7]] },
      'ch-roi-sorcier': { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 682, 107, 140, 43.7], [109, 682, 111, 141, 48.4], [222, 682, 120, 141, 61.2], [344, 682, 121, 141, 59.3], [467, 682, 120, 140, 58.1], [589, 682, 120, 163, 53.9], [711, 682, 151, 140, 65.9]] },
      'ch-dragon': { anim: { repos: 0, marche: [1, 2, 3], attaque: [4, 5] }, poses: [[0, 847, 164, 138, 78.4], [166, 847, 165, 138, 77.5], [333, 847, 166, 140, 71.9], [501, 847, 168, 138, 71.1], [671, 847, 160, 137, 74.1], [833, 847, 226, 137, 78.2]] },
      fantassin: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 0, 65, 105, 32.9], [67, 0, 72, 105, 34.9], [141, 0, 71, 106, 34.1], [214, 0, 63, 105, 27.6], [279, 0, 66, 105, 30], [347, 0, 94, 109, 52.1], [443, 0, 116, 102, 33.2]] },
      arbaletrier: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 111, 71, 101, 30.2], [73, 111, 85, 102, 26.7], [160, 111, 89, 103, 27.9], [251, 111, 85, 103, 27], [338, 111, 86, 102, 26.9], [426, 111, 89, 100, 25.9], [517, 111, 122, 100, 26.2]] },
      chevalier: { anim: { repos: 0, marche: [1, 2, 3, 4], attaque: [5, 6] }, poses: [[0, 216, 100, 137, 42.3], [102, 216, 118, 137, 46.1], [222, 216, 116, 137, 58.6], [340, 216, 116, 137, 58.3], [458, 216, 116, 137, 58.2], [576, 216, 148, 137, 57.6], [726, 216, 158, 137, 67]] },
    } },
  };

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
  function brancher(A, bleu, rouge) {
    for (const id in A.unites) {
      const art = PA.Art && PA.Art.units[id];
      if (!art) continue;
      const U = A.unites[id], code = art.draw;
      const k = art.h * (U.echelle || ECHELLE) / U.poses[U.anim.repos][3];
      art.drawCode = code;
      art.draw = function (ctx, u, team, dark, atk, R) {
        if (PA.Sprites.coupe) return code.call(this, ctx, u, team, dark, atk, R);
        const an = U.anim;
        let i = an.repos;
        if (u.attackAnim > 0) i = an.attaque[(1 - u.attackAnim / 0.25) < 0.45 ? 0 : 1];
        else if (u.moving) i = an.marche[Math.floor((((u.walk || 0) / (Math.PI * 2)) % 1 + 1) % 1 * an.marche.length)];
        const [x, y, w, h, ax] = U.poses[i], img = u.side === -1 ? rouge : bleu;
        ctx.drawImage(img, x, y, w, h, -ax * k, -h * k, w * k, h * k);
        if (u.flash > 0) {   // touché : un éclair blanc par-dessus
          ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(img, x, y, w, h, -ax * k, -h * k, w * k, h * k);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
      };
    }
  }

  PA.Sprites = {
    ATLAS, rougir,
    coupe: false,   // vrai : on revient aux dessins en code (comparaison)
    charges: {},
    charger() {
      for (const age in ATLAS) {
        const img = new Image();
        img.onload = () => { try { brancher(ATLAS[age], img, rougir(img)); this.charges[age] = true; } catch (e) { /* dessins en code */ } };
        img.src = 'images/sprites/' + age + '.webp';
      }
    },
  };
  PA.Sprites.charger();
})();

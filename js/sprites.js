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

  function brancher(A, bleu, rouge) {
    for (const id in A.unites) {
      const art = PA.Art && PA.Art.units[id];
      if (!art || art.clips) continue;   // déjà animée par un clip (plus fin que les poses fixes)
      const U = A.unites[id], code = art.drawCode || art.draw;
      const k = art.h * (U.echelle || ECHELLE) / U.poses[U.anim.repos][3];
      const AX = accroches(U, bleu);
      art.drawCode = code;
      art.draw = function (ctx, u, team, dark, atk, R) {
        if (PA.Sprites.coupe) return code.call(this, ctx, u, team, dark, atk, R);
        const an = U.anim, now = performance.now();
        // En marche si l'unité a avancé il y a peu : une file qui piétine ne clignote plus
        // entre la pose de repos et la marche à chaque image.
        if (u.walk !== u._spW) { u._spW = u.walk; u._spT = now; }
        const marche = u.moving || now - (u._spT || -1e9) < 220;
        const ph = (((u.walk || 0) / (Math.PI * 2)) % 1 + 1) % 1;   // 0 → 1 sur un cycle de marche
        let i = an.repos, dy = 0, rot = 0, sy = 1;
        if (u.attackAnim > 0) i = an.attaque[(1 - u.attackAnim / 0.25) < 0.45 ? 0 : 1];
        else if (marche && U.roule) {   // engin sur roues : il cahote, sans pas
          i = an.marche[Math.floor(ph * an.marche.length)];
          dy = -Math.abs(Math.sin(ph * Math.PI * 4)) * art.h * 0.012;
        } else if (marche) {
          i = an.marche[Math.floor(ph * an.marche.length)];
          // entre deux poses, le corps monte et redescend à chaque pas, et tangue un peu
          dy = -Math.abs(Math.sin(ph * Math.PI * 2)) * art.h * 0.035;
          rot = Math.sin(ph * Math.PI * 2) * 0.03;
        } else sy = 1 + Math.sin(now / 520 + (u.id || 0)) * 0.012;   // respiration au repos
        const [x, y, w, h] = U.poses[i], img = u.side === -1 ? rouge : bleu, ax = AX[i];
        if (dy || rot || sy !== 1) { ctx.save(); ctx.translate(0, dy); ctx.rotate(rot); ctx.scale(1, sy); }
        ctx.drawImage(img, x, y, w, h, -ax * k, -h * k, w * k, h * k);
        if (u.flash > 0) {   // touché : un éclair blanc par-dessus
          ctx.globalAlpha = 0.5; ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(img, x, y, w, h, -ax * k, -h * k, w * k, h * k);
          ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
        }
        if (dy || rot || sy !== 1) ctx.restore();
        if (U.feu && i === U.feu.pose) U.feu.dessiner(ctx, u, k, ax, now, bleu);
      };
    }
  }

  PA.Sprites = {
    ATLAS, ANIM, ranger, rougir,
    coupe: false,   // vrai : on revient aux dessins en code (comparaison)
    charges: {},
    charger() {
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
    },
  };
  PA.Sprites.charger();
})();

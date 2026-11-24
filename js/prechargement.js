/* =========================================================================
   PRÉCHARGEMENT : toutes les images du jeu sont chargées (et décodées) au lancement,
   derrière un écran « Chargement », pour qu'il n'y ait plus aucune attente en partie.
   sprites.js et decors.js déclarent chaque image avec PA.Precharge.suivre(img).
   L'écran se retire quand tout est prêt, ou au bout de 20 s (une image en erreur ne bloque pas).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const suivies = [];
  let faites = 0, fini = false;

  // Écran de chargement, posé avant tout le reste
  const ecran = document.createElement('div');
  ecran.id = 'chargement';
  ecran.innerHTML = '<div><b>Timebreakers</b><span class="barre"><i></i></span><small>Chargement…</small></div>';
  const css = document.createElement('style');
  css.textContent = '#chargement{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;'
    + 'background:#0b1f4c;color:#fff;font:600 16px system-ui,sans-serif;transition:opacity .35s}'
    + '#chargement>div{display:flex;flex-direction:column;align-items:center;gap:14px}'
    + '#chargement b{font-size:30px;letter-spacing:.04em}'
    + '#chargement .barre{width:min(60vw,320px);height:10px;border-radius:5px;background:rgba(255,255,255,.18);overflow:hidden}'
    + '#chargement .barre i{display:block;height:100%;width:0;background:#ffc94a;transition:width .15s}'
    + '#chargement small{opacity:.7;font-weight:400}'
    + '#chargement.parti{opacity:0;pointer-events:none}';
  document.head.appendChild(css);
  const poser = () => document.body.appendChild(ecran);
  if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);

  function majEcran() {
    const n = suivies.length;
    ecran.querySelector('i').style.width = (n ? Math.round(faites / n * 100) : 0) + '%';
    if (!fini && n && faites >= n) terminer();
  }
  function terminer() {
    if (fini) return;
    fini = true;
    ecran.querySelector('i').style.width = '100%';
    ecran.classList.add('parti');
    setTimeout(() => ecran.remove(), 400);
  }
  // Filet : on ne bloque jamais le jeu plus de 20 s
  setTimeout(terminer, 20000);
  // Si aucune image n'est déclarée (ancienne version d'un fichier), on retire l'écran au chargement de la page
  addEventListener('load', () => { if (!suivies.length) terminer(); });

  PA.Precharge = {
    suivre(img) {
      suivies.push(img);
      let compte = false;
      const fait = () => { if (compte) return; compte = true; faites++; majEcran(); };
      // decode() : l'image est prête à dessiner sans à-coup ; s'il échoue (ancien navigateur), load suffit
      img.addEventListener('load', () => { (img.decode ? img.decode() : Promise.resolve()).then(fait, fait); setTimeout(fait, 3000); }, { once: true });
      img.addEventListener('error', fait, { once: true });
      majEcran();
      return img;
    },
    get pret() { return fini; },
  };
})();

/* =========================================================================
   PRÉCHARGEMENT : toutes les images du jeu sont chargées (et décodées) au lancement,
   derrière un écran de chargement, pour qu'il n'y ait plus aucune attente en partie.
   sprites.js et decors.js déclarent chaque image avec PA.Precharge.suivre(img).
   L'écran se retire quand tout est prêt (au moins 1,2 s, pour qu'on ait le temps de le voir),
   ou au bout de 20 s : une image en erreur ne bloque pas.

   L'écran (25 novembre) : une faille temporelle qui tourne derrière le logo, le titre doré,
   une barre façon arcade, les 11 âges qui s'allument l'un après l'autre, et une astuce.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const suivies = [];
  let faites = 0, fini = false, affiche = 0;
  const debut = performance.now();
  const AGES = ['Jurassique', 'Pierre', 'Antiquité', 'Médiéval', 'Renaissance', 'Vapeur', 'Moderne', 'Héros', 'Post-apo', 'Futur', 'Alien'];
  const ASTUCES = [
    'Évolue au bon moment : un âge d’avance fait toute la différence.',
    'Tes tourelles se posent sur les remparts de ta base.',
    'Ton pouvoir ultime peut renverser un combat perdu.',
    'Ce qui vole passe au-dessus des pièges posés au sol.',
    'Pendant l’assaut final, bats en retraite à temps pour garder ton prestige.',
    'Envoie tes troupes par vagues pour percer les défenses.',
    'Le prestige gagné débloque de nouveaux âges et de nouvelles améliorations.',
    'Les tireurs et les tourelles sont les seuls à toucher ce qui vole.',
  ];

  const ecran = document.createElement('div');
  ecran.id = 'chargement';
  ecran.innerHTML =
    '<div class="ch-ciel"></div><div class="ch-faille"><i></i><i></i><i></i></div><div class="ch-etincelles"></div>'
    + '<div class="ch-centre">'
    + '<img class="ch-logo" src="icones/icone-512.png" alt="">'
    + '<h1 class="ch-titre">TIMEBREAKERS</h1>'
    + '<p class="ch-sous">Brise le temps, âge après âge</p>'
    + '<div class="ch-barre"><b></b><span>0 %</span></div>'
    + '<ol class="ch-ages">' + AGES.map(a => `<li>${a}</li>`).join('') + '</ol>'
    + '<p class="ch-astuce"></p>'
    + '</div>';
  const css = document.createElement('style');
  css.textContent = `
#chargement{position:fixed;inset:0;z-index:9999;overflow:hidden;display:grid;place-items:center;color:#fff;
  font-family:'Lilita One','Arial Rounded MT Bold','Trebuchet MS',sans-serif;
  background:radial-gradient(ellipse at 50% 45%,#3b2a8c 0%,#1a1f5e 45%,#0b1f4c 75%,#060d22 100%);
  transition:opacity .45s ease, transform .45s ease}
#chargement.parti{opacity:0;transform:scale(1.04);pointer-events:none}
#chargement .ch-ciel{position:absolute;inset:-10%;opacity:.55;
  background-image:radial-gradient(1.5px 1.5px at 12% 22%,#fff 50%,transparent 51%),radial-gradient(1px 1px at 72% 14%,#fff 50%,transparent 51%),
  radial-gradient(1.5px 1.5px at 38% 78%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 86% 64%,#fff 50%,transparent 51%),
  radial-gradient(2px 2px at 58% 40%,#ffe9a0 50%,transparent 51%),radial-gradient(1px 1px at 22% 58%,#fff 50%,transparent 51%),
  radial-gradient(1.5px 1.5px at 92% 30%,#cfe0ff 50%,transparent 51%),radial-gradient(1px 1px at 6% 86%,#fff 50%,transparent 51%);
  background-size:340px 260px;animation:ch-derive 40s linear infinite}
@keyframes ch-derive{to{transform:translate(-340px,-130px)}}
#chargement .ch-faille{position:absolute;left:50%;top:44%;width:0;height:0}
#chargement .ch-faille i{position:absolute;left:0;top:0;border-radius:50%;transform:translate(-50%,-50%);
  background:conic-gradient(from 0deg,transparent 0 10%,rgba(255,210,63,.55) 18%,transparent 28% 50%,rgba(111,176,255,.5) 62%,transparent 72%);
  -webkit-mask:radial-gradient(circle,transparent 54%,#000 56%,#000 62%,transparent 64%);mask:radial-gradient(circle,transparent 54%,#000 56%,#000 62%,transparent 64%);
  animation:ch-tourne 6s linear infinite}
#chargement .ch-faille i:nth-child(1){width:min(78vmin,620px);height:min(78vmin,620px)}
#chargement .ch-faille i:nth-child(2){width:min(60vmin,480px);height:min(60vmin,480px);animation-duration:4.2s;animation-direction:reverse;opacity:.8}
#chargement .ch-faille i:nth-child(3){width:min(96vmin,780px);height:min(96vmin,780px);animation-duration:11s;opacity:.45}
@keyframes ch-tourne{to{transform:translate(-50%,-50%) rotate(360deg)}}
#chargement .ch-etincelles{position:absolute;inset:0;pointer-events:none}
#chargement .ch-etincelles s{position:absolute;bottom:-10px;width:6px;height:6px;border-radius:50%;background:#ffd23f;box-shadow:0 0 10px #ffd23f;
  animation:ch-monte linear infinite;opacity:0}
@keyframes ch-monte{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-105vh);opacity:0}}
#chargement .ch-centre{position:relative;display:flex;flex-direction:column;align-items:center;gap:min(1.6vmin,12px);width:min(92vw,760px);text-align:center}
#chargement .ch-logo{width:min(22vmin,150px);height:auto;border-radius:24%;filter:drop-shadow(0 0 18px rgba(255,210,63,.55)) drop-shadow(0 6px 0 rgba(6,13,34,.6));
  animation:ch-flotte 2.6s ease-in-out infinite}
@keyframes ch-flotte{50%{transform:translateY(-6px) rotate(-2deg)}}
#chargement .ch-titre{margin:0;font-weight:400;font-size:min(10vmin,76px);letter-spacing:.04em;line-height:1;
  background:linear-gradient(#fff6c8 0%,#ffd23f 45%,#e39a12 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  -webkit-text-stroke:min(.9vmin,6px) #0a1838;paint-order:stroke fill;filter:drop-shadow(0 5px 0 #0a1838)}
#chargement .ch-sous{margin:0 0 min(1.2vmin,8px);font-family:Fredoka,'Trebuchet MS',system-ui,sans-serif;font-weight:600;font-size:min(3vmin,20px);color:#cfe0ff;letter-spacing:.06em}
#chargement .ch-barre{position:relative;width:min(70vw,520px);height:min(5vmin,34px);border:min(.7vmin,4px) solid #0a1838;border-radius:999px;
  background:#12306e;box-shadow:0 min(.8vmin,5px) 0 #0a1838,inset 0 3px 0 rgba(255,255,255,.12);overflow:hidden}
#chargement .ch-barre b{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:999px;transition:width .25s ease;
  background:repeating-linear-gradient(-45deg,rgba(255,255,255,.22) 0 10px,transparent 10px 20px),linear-gradient(#ffe680,#ffd23f 50%,#e39a12);
  background-size:28px 28px,100% 100%;animation:ch-rayures .6s linear infinite;box-shadow:inset 0 3px 0 rgba(255,255,255,.5)}
@keyframes ch-rayures{to{background-position:28px 0,0 0}}
#chargement .ch-barre span{position:absolute;inset:0;display:grid;place-items:center;font-size:min(3vmin,19px);color:#fff;
  -webkit-text-stroke:min(.5vmin,3px) #0a1838;paint-order:stroke fill}
#chargement .ch-ages{display:flex;flex-wrap:wrap;justify-content:center;gap:min(.8vmin,6px) min(1.2vmin,9px);margin:min(.6vmin,4px) 0 0;padding:0;list-style:none;
  font-size:min(2.4vmin,15px)}
#chargement .ch-ages li{padding:.15em .6em;border-radius:999px;border:2px solid rgba(169,196,242,.35);color:rgba(207,224,255,.45);transition:all .3s ease}
#chargement .ch-ages li.on{color:#0a1838;background:#ffd23f;border-color:#0a1838;box-shadow:0 3px 0 #0a1838;transform:translateY(-2px)}
#chargement .ch-astuce{min-height:2.6em;margin:min(1vmin,6px) 0 0;font-family:Fredoka,'Trebuchet MS',system-ui,sans-serif;font-weight:500;
  font-size:min(2.8vmin,18px);color:#e8efff;transition:opacity .35s}
#chargement .ch-astuce::before{content:'Astuce · ';font-family:'Lilita One','Trebuchet MS',sans-serif;color:#ffd23f}
@media (prefers-reduced-motion:reduce){#chargement *{animation:none!important}}
`;
  document.head.appendChild(css);

  // étincelles qui montent (positions et vitesses au hasard)
  const etinc = ecran.querySelector('.ch-etincelles');
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('s');
    const t = 3.5 + Math.random() * 4;
    s.style.cssText = `left:${Math.random() * 100}%;animation-duration:${t}s;animation-delay:${-Math.random() * t}s;` +
      `transform:scale(${0.5 + Math.random()});background:${Math.random() < 0.3 ? '#9fd0ff' : '#ffd23f'}`;
    etinc.appendChild(s);
  }
  // astuce qui change toutes les 3 s
  const astuce = ecran.querySelector('.ch-astuce');
  let ia = Math.floor(Math.random() * ASTUCES.length);
  astuce.textContent = ASTUCES[ia];
  const tourAstuce = setInterval(() => {
    astuce.style.opacity = 0;
    setTimeout(() => { ia = (ia + 1) % ASTUCES.length; astuce.textContent = ASTUCES[ia]; astuce.style.opacity = 1; }, 350);
  }, 3200);

  const poser = () => document.body.appendChild(ecran);
  if (document.body) poser(); else document.addEventListener('DOMContentLoaded', poser);

  const barre = ecran.querySelector('.ch-barre b'), pct = ecran.querySelector('.ch-barre span'), ages = ecran.querySelectorAll('.ch-ages li');
  function dessiner(k) {
    barre.style.width = Math.round(k * 100) + '%';
    pct.textContent = Math.round(k * 100) + ' %';
    ages.forEach((li, i) => li.classList.toggle('on', k >= (i + 1) / ages.length - 0.001));
  }
  // La barre avance en douceur vers la vraie progression (elle ne saute pas d'un coup à 100 %).
  function animer() {
    if (fini && affiche >= 1) return;
    const vrai = suivies.length ? faites / suivies.length : 0;
    affiche += (vrai - affiche) * 0.12 + (vrai > affiche ? 0.004 : 0);
    affiche = Math.min(affiche, vrai);
    dessiner(affiche);
    if (vrai >= 1 && affiche > 0.995 && performance.now() - debut > 1200) return terminer();
    requestAnimationFrame(animer);
  }
  requestAnimationFrame(animer);

  function verifier() {
    if (fini || !suivies.length || faites < suivies.length) return;
    if (document.hidden) return terminer();
    // sécurité : si l'animation est gelée (onglet en arrière-plan…), on retire quand même l'écran
    setTimeout(() => { if (faites >= suivies.length) terminer(); }, Math.max(0, 1200 - (performance.now() - debut)) + 1500);
  }
  function terminer() {
    if (fini) return;
    fini = true;
    dessiner(1);
    clearInterval(tourAstuce);
    ecran.classList.add('parti');
    setTimeout(() => ecran.remove(), 500);
  }
  // Filet : on ne bloque jamais le jeu plus de 20 s
  setTimeout(terminer, 20000);
  // Si aucune image n'est déclarée (ancienne version d'un fichier), on retire l'écran au chargement de la page
  addEventListener('load', () => { if (!suivies.length) setTimeout(terminer, 800); });

  PA.Precharge = {
    suivre(img) {
      suivies.push(img);
      let compte = false;
      const fait = () => { if (compte) return; compte = true; faites++; verifier(); };
      // decode() : l'image est prête à dessiner sans à-coup ; s'il échoue (ancien navigateur), load suffit
      img.addEventListener('load', () => { (img.decode ? img.decode() : Promise.resolve()).then(fait, fait); setTimeout(fait, 3000); }, { once: true });
      img.addEventListener('error', fait, { once: true });
      return img;
    },
    get pret() { return fini; },
  };
})();

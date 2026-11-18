/* =========================================================================
   TUTORIEL ET VISITE GUIDÉE
     PA.Tuto.guide()    : visite des menus (lancée toute seule au premier lancement du jeu)
     PA.Tuto.lancer()   : tutoriel = le premier niveau, expliqué pas à pas (bouton « Tutoriel » de l'accueil)
     PA.Tuto.confirmer(): « Jouer sans tutoriel ? », posée une seule fois à qui appuie sur JOUER sans l'avoir fait

   Le tutoriel se joue sur une sauvegarde à part, jetée à la fin : rien n'est gagné ni perdu dans la vraie progression.
   Ce qui a été vu est noté dans le navigateur (clé timebreakers-tuto) : { guide, tuto, sans }.

   Une étape : { cible, titre, texte, avant, action, boutons }
     cible  : sélecteur CSS, ou fonction qui renvoie un rectangle écran, ou rien (carte au centre) ;
     avant  : préparation de l'étape ;
     action : condition à remplir par le joueur pour passer à la suite (le combat tourne) ; sans elle, bouton « Suivant »
              et le combat est figé ;
     boutons: boutons propres à l'étape, à la place de « Suivant ».
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, CLE = 'timebreakers-tuto';
  const $ = s => document.querySelector(s);

  // Un rectangle du terrain (coordonnées du monde, 1280 × 720) converti en rectangle écran.
  const monde = (x, y, w, h) => () => {
    const r = document.getElementById('canvas').getBoundingClientRect(), kx = r.width / C.world.width, ky = r.height / C.world.height;
    return { left: r.left + x * kx, top: r.top + y * ky, width: w * kx, height: h * ky };
  };

  // Le rectangle qui entoure tous les éléments d'un sélecteur.
  const union = sel => () => {
    const rs = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    if (!rs.length) return null;
    const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top));
    return { left: l, top: t, width: Math.max(...rs.map(r => r.right)) - l, height: Math.max(...rs.map(r => r.bottom)) - t };
  };

  const Tuto = {
    actif: false,       // le tutoriel de combat est en cours
    ancien: false,       // joueur qui avait déjà une sauvegarde : ni visite forcée, ni question
    etapes: null, i: 0, el: null, t0: 0,

    etat() { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; } },
    noter(k) { try { const s = this.etat(); s[k] = true; localStorage.setItem(CLE, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ } },

    // Appelé une fois au lancement du jeu, l'accueil étant affiché.
    premierLancement() {
      try { this.ancien = ['facile', 'difficile'].some(d => PA.Meta.load(d).runs > 0); } catch (e) { this.ancien = false; }
      if (!this.etat().guide) this.guide();     // proposée à tout le monde tant qu'elle n'a été ni suivie ni passée
    },
    doitConfirmer() { const s = this.etat(); return !this.ancien && !s.tuto && !s.sans; },
    confirmer() {
      const g = PA.Game;
      PA.UI.overlay(`
        <h2>Jouer sans tutoriel ?</h2>
        <p>Le tutoriel dure deux minutes : il te fait jouer le premier niveau en expliquant l’or, les troupes, les tourelles, le pouvoir et le prestige.</p>
        <p class="muted">Tu pourras toujours le lancer plus tard avec le bouton « Tutoriel » de l’accueil.</p>
        <div class="actions">
          <button data-action="tuto">Faire le tutoriel</button>
          <button data-action="sans">Jouer sans tutoriel</button>
          <button data-action="retour">Retour</button>
        </div>`, {
        tuto: () => this.lancer(),
        sans: () => { this.noter('sans'); PA.UI.campTab = 'play'; g.newRun(); },
        retour: () => g.showCamp(),
      });
    },

    // ------------------------------------------------------------ la bulle et le cadre
    creer() {
      if (this.el) return;
      const d = this.el = document.createElement('div');
      d.id = 'tuto'; d.hidden = true;
      d.innerHTML = '<div class="tuto-bloc"></div><div class="tuto-cadre"></div><div class="tuto-bulle"><b class="t"></b><p></p><div class="tuto-bas"><span class="n"></span><span class="b"></span></div></div>';
      document.body.appendChild(d);
      const boucle = () => { if (this.etapes) this.suivre(); requestAnimationFrame(boucle); };
      requestAnimationFrame(boucle);
    },
    jouer(etapes, quitter) {
      this.creer();
      this.etapes = etapes; this.i = 0; this.quitterFn = quitter;
      this.el.hidden = false;
      this.montrer();
    },
    fermer() { this.etapes = null; if (this.el) this.el.hidden = true; },
    montrer() {
      const e = this.etapes[this.i], g = PA.Game, el = this.el;
      if (e.avant) e.avant(g.battle);
      this.t0 = performance.now();
      if (this.actif) g.blocked = !e.action;                 // explication : combat figé ; action : le combat tourne
      el.querySelector('.t').textContent = e.titre;
      el.querySelector('p').innerHTML = typeof e.texte === 'function' ? e.texte(g.battle) : e.texte;
      el.querySelector('.n').textContent = `${this.i + 1} / ${this.etapes.length}`;
      el.querySelector('.tuto-bloc').style.display = e.action ? 'none' : 'block';
      el.classList.toggle('action', !!e.action);
      const bas = el.querySelector('.b'); bas.innerHTML = '';
      const bouton = (txt, fn, cls) => { const b = document.createElement('button'); b.textContent = txt; if (cls) b.className = cls; b.onclick = fn; bas.appendChild(b); };
      if (!e.boutons) bouton(this.actif ? 'Quitter' : 'Passer', () => this.quitterFn(), 'discret');
      if (e.boutons) e.boutons.forEach(([txt, fn, cls]) => bouton(txt, fn, cls));
      else if (!e.action) bouton(this.i === this.etapes.length - 1 ? (e.dernier || 'Terminer') : 'Suivant', () => this.suite(), 'ok');
      this.suivre();
    },
    suite() {
      if (!this.etapes) return;
      if (this.i >= this.etapes.length - 1) { const fin = this.finFn; this.fermer(); if (fin) fin(); return; }
      this.i++; this.montrer();
    },
    // À chaque image : le cadre suit sa cible, la bulle se place à côté, et une étape d'action passe à la suite dès que c'est fait.
    suivre() {
      const e = this.etapes[this.i], el = this.el, cadre = el.querySelector('.tuto-cadre'), bulle = el.querySelector('.tuto-bulle');
      const cible = typeof e.cible === 'function' ? e.cible() : e.cible ? ($(e.cible) ? $(e.cible).getBoundingClientRect() : null) : null;
      const W = innerWidth, H = innerHeight, bw = bulle.offsetWidth, bh = bulle.offsetHeight;
      el.classList.toggle('centre', !cible);
      if (cible && cible.width > 0) {
        const m = 6;
        cadre.style.display = 'block';
        cadre.style.left = cible.left - m + 'px'; cadre.style.top = cible.top - m + 'px';
        cadre.style.width = cible.width + 2 * m + 'px'; cadre.style.height = cible.height + 2 * m + 'px';
        let y = cible.top + cible.height + 16;
        if (y + bh > H - 8) y = cible.top - bh - 16;                       // pas la place dessous : au-dessus
        if (y < 8) y = Math.max(8, H - bh - Math.max(70, H * 0.14));       // ni l'un ni l'autre : en bas de l'écran
        bulle.style.left = Math.max(8, Math.min(W - bw - 8, cible.left + cible.width / 2 - bw / 2)) + 'px';
        bulle.style.top = y + 'px';
      } else {
        cadre.style.display = 'none';
        bulle.style.left = (W - bw) / 2 + 'px';
        bulle.style.top = (e.action ? Math.max(8, H * 0.2) : (H - bh) / 2) + 'px';
      }
      if (e.action && PA.Game.battle && e.action(PA.Game.battle, (performance.now() - this.t0) / 1000)) this.suite();
    },

    // ------------------------------------------------------------ la visite des menus
    guide() {
      const g = PA.Game, onglet = (t, sous) => () => { PA.UI.campTab = t; PA.UI.campSous = sous || 'bonus'; PA.UI.showCamp(); };
      const fin = () => { this.noter('guide'); this.fermer(); onglet('play')(); };
      this.actif = false; this.finFn = fin;
      this.jouer([
        { avant: onglet('play'), titre: 'Bienvenue dans Timebreakers !', texte: 'Tu mènes une armée à travers <b>11 âges</b>, des dinosaures aux extra-terrestres. Chaque partie te rapporte du prestige, qui te rend plus fort pour la suivante. Veux-tu faire le tour des menus ? Cela prend une minute.',
          boutons: [['Non merci', fin, 'discret'], ['Oui, montre-moi', () => this.suite(), 'ok']] },
        { cible: '.hero .play', titre: 'Jouer', texte: 'Lance une partie : une suite de niveaux de plus en plus durs, puis un assaut final sans fin. Si ta base tombe, la partie s’arrête et tu reviens ici.' },
        { cible: '.hero .decouvrir', titre: 'Découvrir le jeu', texte: 'Ces deux boutons restent là : « Visite des menus » relance cette présentation, « Tutoriel » t’apprend à te battre.' },
        { cible: '.hero .tuto', titre: 'Le tutoriel', texte: 'Il te fait jouer le premier niveau en expliquant tout ce qu’il y a à l’écran. À faire avant ta première vraie partie.' },
        { cible: '.camp-top .cur', titre: 'Tes points de prestige ✦', texte: 'Tu en gagnes à chaque partie, même perdue. C’est la monnaie de tous les menus qui suivent, et ce que tu achètes est gardé pour toujours.' },
        { cible: '.camp-top .seg', titre: 'La difficulté', texte: 'Facile ou Difficile. Chacune a sa propre progression : ce que tu débloques dans l’une ne compte pas dans l’autre.' },
        { cible: union('.camp-top .side button'), titre: 'Son et aide', texte: 'La note coupe ou remet la musique. Le <b>?</b> ouvre les réglages du son et les règles du jeu.' },
        { cible: 'nav.tabs', titre: 'Les menus', texte: 'Cinq onglets. « Bataille » est l’accueil ; les quatre autres sont des boutiques où dépenser ton prestige.' },
        { avant: onglet('ups', 'bonus'), cible: '.camp-body', titre: 'Améliorations', texte: 'Des bonus permanents : plus de dégâts, plus de vie, plus d’or… Chacun a plusieurs niveaux.' },
        { avant: onglet('ups', 'speed'), cible: '.sous-onglets', titre: 'Vitesse', texte: 'Dans Améliorations, la sous-catégorie « Vitesse » permet de jouer en ×2 puis en ×3 quand tu connais le jeu. Cela ne change pas ce que tu gagnes.' },
        { avant: onglet('ages'), cible: '.camp-body', titre: 'Âges', texte: 'Chaque âge acheté ajoute 5 niveaux à tes parties, avec ses troupes, ses tourelles et son champion. Ils se débloquent dans l’ordre.' },
        { avant: onglet('elites'), cible: '.camp-body', titre: 'Élites', texte: 'La 4e troupe de chaque âge : plus chère, elle frappe plusieurs ennemis à la fois. L’ennemi n’en a pas.' },
        { avant: onglet('pouvoirs'), cible: '.camp-body', titre: 'Pouvoirs', texte: 'Chaque âge a quatre pouvoirs ultimes. Celui de contrôle est offert, les trois autres s’achètent. Tu en équipes un par âge.' },
        { avant: onglet('play'), titre: 'Prêt ?', texte: 'Le mieux est de commencer par le tutoriel : deux minutes, sur le premier niveau.',
          boutons: [['Plus tard', fin, 'discret'], ['Faire le tutoriel', () => { this.noter('guide'); this.lancer(); }, 'ok']] },
      ], fin);
    },

    // ------------------------------------------------------------ le tutoriel : le premier niveau, pas à pas
    lancer() {
      const g = PA.Game;
      this.fermer();
      if (!this.sauve) this.sauve = { meta: g.meta, save: PA.Meta.save };
      PA.Meta.save = function () {};                         // sauvegarde à part : rien ne touche à la vraie progression
      g.meta = PA.Meta.defaults('facile');
      this.actif = true; this.libre = false;
      PA.UI.campTab = 'play';
      g.newRun();
      g.run.xp = 0; g.speed = 1;
      const b0 = g.battle;
      b0.enemyBase.hp = b0.enemyBase.maxHp = Math.round(b0.enemyBase.maxHp * 0.6);   // un premier niveau un peu plus court
      const age = C.ages[0], sp = b0.special, tour = age.turrets[0];
      this.finFn = () => { this.noter('tuto'); this.libre = true; g.blocked = false; };
      this.jouer([
        { titre: 'Bienvenue, chef !', texte: 'Ta base est à gauche, celle de l’ennemi à droite. Ton but : <b>détruire la sienne</b> avant qu’il ne détruise la tienne. Le combat attend pendant les explications.' },
        { cible: monde(0, 320, 210, 310), titre: 'Ta base', texte: 'La barre verte au-dessus, c’est sa vie. Si elle tombe à zéro, la partie s’arrête.' },
        { cible: monde(1070, 320, 210, 310), titre: 'La base ennemie', texte: 'Même principe : vide sa barre de vie pour gagner le niveau.' },
        { cible: '.pill.gold', titre: 'L’or', texte: 'Il sert à acheter des troupes et des tourelles. Chaque ennemi tué t’en rapporte.' },
        { cible: '#unit-buttons', titre: 'Tes troupes', texte: 'Un bouton par troupe, avec son prix en dessous. Une fois achetée, elle avance et se bat toute seule. La 4e, avec l’étoile, est l’unité d’élite : elle se débloque plus tard, au camp.' },
        { cible: '#unit-buttons', titre: 'À toi !', texte: `Achète ta première troupe : touche le premier bouton (${age.units[0].name}).`,
          avant: b => { g.run.gold = Math.max(g.run.gold, b.unitCost(age.units[0]) * 3); this.n0 = b.pu.length + b.queue.length; },
          action: b => b.pu.length + b.queue.length > this.n0 },
        { cible: '#queue', titre: 'L’entraînement', texte: 'Ta troupe s’entraîne ici quelques secondes avant de sortir de la base. Tu peux en commander plusieurs d’avance.' },
        { titre: 'Le combat', texte: 'Tes troupes attaquent la première cible devant elles. Achètes-en d’autres si tu veux. On continue dès qu’un ennemi tombe.',
          avant: b => { this.k0 = b.kills; this.tb = b.time; }, action: b => b.kills > this.k0 || b.time - this.tb > 30 },
        { cible: '.hud-c .xp', titre: 'L’expérience', texte: 'Chaque ennemi tué remplit cette barre. Quand elle est pleine, le bouton <b>Évoluer</b> te fait passer à l’âge suivant : nouvelles troupes, nouvelles tourelles, base plus solide.' },
        { cible: '#turret-buttons', titre: 'Les tourelles', texte: 'Elles se posent sur ta base et tirent sur les ennemis qui approchent. Il faut un emplacement libre : tu en as un au départ, les suivants s’achètent avec le bouton <b>+</b>.' },
        { cible: '#turret-buttons', titre: 'À toi !', texte: `Je t’offre de l’or : achète une tourelle (${tour.name}).`,
          avant: () => { g.run.gold = Math.max(g.run.gold, tour.cost); },
          action: () => g.run.turrets.some(t => t) },
        { cible: '#slots', titre: 'Tes emplacements', texte: 'Ta tourelle est posée ici. Pour la revendre, touche-la deux fois. Le <b>+</b> achète un emplacement de plus.' },
        { cible: '#btn-special', titre: 'Ton pouvoir', texte: `<b>${sp.name}</b>. ${sp.desc} Il met ensuite ${sp.cooldown} secondes à se recharger.` },
        { cible: '#btn-special', titre: 'À toi !', texte: 'Il est prêt : lance-le !', avant: b => { b.specialCd = 0; }, action: b => b.specialCd > 1 },
        { cible: '.pill.pp', titre: 'Le prestige ✦', texte: 'Tu en gagnes en tuant des ennemis et en finissant des niveaux. Les points d’un niveau sont mis à l’abri quand tu le termines. Au camp, ils achètent ce qui reste pour toujours : âges, élites, pouvoirs, bonus.' },
        { cible: '.hud-l', titre: 'Le niveau', texte: 'Tu es au niveau 1. Il y a 5 niveaux par âge, et le dernier de chaque âge cache un champion.' },
        { cible: '.hud-r', titre: 'Temps et réglages', texte: 'Le chrono (finir vite rapporte plus de prestige), puis la vitesse du jeu, la pause et la croix pour abandonner.' },
        { titre: 'À toi de jouer', texte: 'Détruis la base ennemie ! Dans une vraie partie, tu choisis une récompense parmi trois entre deux niveaux. Ici, le tutoriel s’arrête à la victoire.', dernier: 'C’est parti' },
      ], () => this.quitter());
    },
    // Rend la vraie sauvegarde et revient à l'accueil.
    rendre() {
      const g = PA.Game;
      if (this.sauve) { g.meta = this.sauve.meta; PA.Meta.save = this.sauve.save; this.sauve = null; }
      this.actif = false; this.libre = false;
      this.fermer();
    },
    quitter() { this.rendre(); PA.Game.showCamp(); },
    // Fin du combat du tutoriel (appelé par le jeu à la place de la fin de niveau normale).
    finCombat(resultat) {
      const g = PA.Game, gagne = resultat === 'victory';
      this.fermer(); g.blocked = true;
      if (gagne) this.noter('tuto');
      PA.UI.overlay(gagne ? `
        <h2>Tutoriel réussi !</h2>
        <p>Tu sais l’essentiel : acheter des troupes, poser des tourelles, lancer ton pouvoir, évoluer.</p>
        <p class="muted">Dans une vraie partie, les niveaux s’enchaînent et le prestige gagné s’ajoute à ton compteur. Rien de ce tutoriel n’a été compté.</p>
        <div class="actions"><button data-action="jouer">Jouer pour de vrai</button><button data-action="camp">Retour à l’accueil</button></div>` : `
        <h2>Ta base est tombée</h2>
        <p>Ce n’est qu’un essai. Astuce : garde toujours quelques troupes devant ta base, et pose une tourelle dès que tu peux.</p>
        <div class="actions"><button data-action="encore">Recommencer le tutoriel</button><button data-action="camp">Retour à l’accueil</button></div>`, {
        jouer: () => { this.rendre(); PA.UI.campTab = 'play'; g.newRun(); },
        encore: () => this.lancer(),
        camp: () => this.quitter(),
      });
    },
  };

  PA.Tuto = Tuto;
})();

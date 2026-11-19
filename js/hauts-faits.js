/* =========================================================================
   HAUTS FAITS : 100 défis permanents, plus 4 secrets liés à l'âge caché du Magma.
   Ils sont communs à toutes les difficultés : sauvegarde à part (clé HF.KEY).
     { obtenus: { id: date }, c: { compteurs } }
   Chaque haut fait obtenu rapporte un peu de prestige (✦) dans la campagne en cours.

   Ce fichier se branche sur le reste sans le modifier : il enveloppe des méthodes du combat
   (PA.Battle), de la partie (PA.Game), des modes (PA.Modes) et du camp (PA.UI.showCamp).
   Deux façons de débloquer :
     - un événement (victoire, mort d'un champion, achat…) appelle donner(id) ;
     - un état (sauvegarde du camp) est relu par verifierCamp().
   Ceux qui ont un compteur (but) affichent une barre de progression.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG, PF = C.world.baseWidth, GAINS = [0, 15, 50, 150, 400];
  // La galerie se compte sur les 33 champions « normaux » (l'âge caché n'en fait pas partie).
  const GALERIE = PA.Champions.DEFS.flat().map(d => d.id);

  // ---------------------------------------------------------------- la liste
  // t : thème · n : palier (récompense GAINS[n]) · but + cle : compteur · secret : caché tant qu'il n'est pas obtenu
  const AGES = ['', 'Pierre qui roule|atteins l’âge de pierre en partie', 'Ave !|atteins l’Antiquité', 'Gente dame, preux chevalier|atteins le Médiéval',
    'Lumières|atteins la Renaissance', 'Pleine vapeur|atteins l’âge de la Vapeur', 'Temps modernes|atteins l’âge Moderne', 'Plus haut, plus fort|atteins l’âge des Héros',
    'Après la fin|atteins le Post-apo', 'Futur antérieur|atteins le Futur', 'Premier contact|atteins l’âge Alien'];
  const LISTE = [
    // Progression
    { id: 'premier-pas', t: 'Progression', n: 1, nom: 'Premier pas', desc: 'Termine ton premier niveau.' },
    { id: 'vieux-os', t: 'Progression', n: 1, nom: 'Vieux os', desc: 'Bats le boss du Jurassique.' },
    ...AGES.slice(1).map((s, i) => { const [nom, desc] = s.split('|'); return { id: 'age-' + (i + 1), t: 'Progression', n: i < 3 ? 1 : i < 7 ? 2 : 3, nom, desc: desc[0].toUpperCase() + desc.slice(1) + '.' }; }),
    // Parties
    { id: 'timebreaker', t: 'Parties', n: 4, nom: 'Timebreaker', desc: 'Atteins l’assaut final avec les 11 âges débloqués.' },
    { id: 'encore-une', t: 'Parties', n: 1, nom: 'Encore une', desc: 'Joue 10 parties.', cle: 'parties', but: 10 },
    { id: 'veteran', t: 'Parties', n: 2, nom: 'Vétéran', desc: 'Joue 50 parties.', cle: 'parties', but: 50 },
    { id: 'accro', t: 'Parties', n: 3, nom: 'Accro du temps', desc: 'Joue 200 parties.', cle: 'parties', but: 200 },
    { id: 'cadran', t: 'Parties', n: 2, nom: 'Le tour du cadran', desc: 'Joue pendant 7 jours différents.', cle: 'jours', but: 7 },
    { id: 'fidele', t: 'Parties', n: 3, nom: 'Fidèle au poste', desc: 'Joue 10 heures de combat au total.', cle: 'heures', but: 10 },
    // Combat
    { id: 'premier-sang', t: 'Combat', n: 1, nom: 'Premier sang', desc: 'Tue 100 ennemis.', cle: 'kills', but: 100 },
    { id: 'boucher', t: 'Combat', n: 2, nom: 'Boucher des âges', desc: 'Tue 10 000 ennemis.', cle: 'kills', but: 10000 },
    { id: 'hecatombe', t: 'Combat', n: 4, nom: 'Hécatombe', desc: 'Tue 100 000 ennemis.', cle: 'kills', but: 100000 },
    { id: 'mur-vivant', t: 'Combat', n: 2, nom: 'Mur vivant', desc: 'Gagne un niveau sans que ta base perde un seul PV.' },
    { id: 'sur-le-fil', t: 'Combat', n: 2, nom: 'Sur le fil', desc: 'Gagne un niveau avec moins de 5 % de PV à ta base.' },
    { id: 'eclair', t: 'Combat', n: 2, nom: 'Éclair', desc: 'Gagne un niveau en moins de 45 secondes.' },
    { id: 'blitz', t: 'Combat', n: 3, nom: 'Blitz', desc: 'Gagne un niveau de boss en moins de 90 secondes.' },
    { id: 'armee-seul', t: 'Combat', n: 2, nom: 'Armée d’un seul', desc: 'Gagne un niveau avec un seul type d’unité.' },
    { id: 'de-loin', t: 'Combat', n: 2, nom: 'De loin, c’est mieux', desc: 'Gagne un niveau de boss sans unité de mêlée.' },
    { id: 'au-contact', t: 'Combat', n: 2, nom: 'Au contact', desc: 'Gagne un niveau de boss sans tireur ni tourelle.' },
    { id: 'embouteillage', t: 'Combat', n: 2, nom: 'Embouteillage', desc: 'Aie 20 unités sur le terrain en même temps.' },
    { id: 'ruee-stoppee', t: 'Combat', n: 2, nom: 'Ruée stoppée', desc: 'Repousse une ruée d’ouverture sans que ta base soit touchée.' },
    { id: 'outsider', t: 'Combat', n: 2, nom: 'Outsider', desc: 'Gagne un niveau contre des ennemis deux âges plus avancés.' },
    { id: 'david', t: 'Combat', n: 3, nom: 'David contre Goliath', desc: 'Gagne un niveau contre des ennemis trois âges plus avancés.' },
    // Endurance
    { id: 'renforts', t: 'Endurance', n: 2, nom: 'Les renforts ? Quels renforts ?', desc: 'Gagne un niveau après le 3e palier de renforts.' },
    { id: 'marathon', t: 'Endurance', n: 2, nom: 'Marathon', desc: 'Reste 15 minutes dans un même niveau et gagne-le.' },
    { id: 'egratignure', t: 'Endurance', n: 3, nom: 'Pas une égratignure', desc: 'Finis tout un âge (5 niveaux) sans que ta base descende sous 50 %.' },
    // Économie et camp
    { id: 'tirelire', t: 'Économie', n: 1, nom: 'Tirelire', desc: 'Aie 1 000 or en même temps.' },
    { id: 'tresor', t: 'Économie', n: 3, nom: 'Trésor de dragon', desc: 'Aie 1 000 000 d’or en même temps.' },
    { id: 'poches-vides', t: 'Économie', n: 2, nom: 'Poches vides', desc: 'Gagne un niveau en finissant avec moins de 10 or.' },
    { id: 'investisseur', t: 'Économie', n: 1, nom: 'Investisseur', desc: 'Achète ta première amélioration.' },
    { id: 'au-max', t: 'Économie', n: 2, nom: 'Au maximum', desc: 'Pousse une amélioration à son niveau maximum.' },
    { id: 'plus-rien', t: 'Économie', n: 4, nom: 'Plus rien à acheter', desc: 'Pousse toutes les améliorations au maximum.' },
    { id: 'riche', t: 'Économie', n: 2, nom: 'Riche en prestige', desc: 'Possède 10 000 ✦ en même temps.' },
    { id: 'elite', t: 'Économie', n: 1, nom: 'Élite', desc: 'Débloque ta première unité d’élite.' },
    { id: 'garde-elite', t: 'Économie', n: 3, nom: 'Garde d’élite', desc: 'Débloque les 11 unités d’élite.' },
    { id: 'presse', t: 'Économie', n: 2, nom: 'Pressé', desc: 'Débloque la vitesse ×3.' },
    // Tourelles
    { id: 'batisseur', t: 'Tourelles', n: 1, nom: 'Bâtisseur', desc: 'Pose ta première tourelle.' },
    { id: 'forteresse', t: 'Tourelles', n: 2, nom: 'Forteresse', desc: 'Remplis tes 4 emplacements de tourelle.' },
    { id: 'sans-murailles', t: 'Tourelles', n: 3, nom: 'Sans murailles', desc: 'Atteins l’assaut final sans jamais poser de tourelle.' },
    { id: 'brocanteur', t: 'Tourelles', n: 1, nom: 'Brocanteur', desc: 'Vends 20 tourelles.', cle: 'ventes', but: 20 },
    { id: 'barrage', t: 'Tourelles', n: 2, nom: 'Tir de barrage', desc: 'Tue 50 ennemis avec tes tourelles dans un même niveau.' },
    { id: 'dca', t: 'Tourelles', n: 3, nom: 'DCA', desc: 'Abats un champion volant seulement avec tes tourelles.' },
    // Pouvoirs
    { id: 'premier-pouvoir', t: 'Pouvoirs', n: 1, nom: 'Premier pouvoir', desc: 'Utilise un pouvoir spécial.' },
    { id: 'coup-maitre', t: 'Pouvoirs', n: 2, nom: 'Coup de maître', desc: 'Tue 10 ennemis d’un seul pouvoir.' },
    { id: 'collectionneur', t: 'Pouvoirs', n: 2, nom: 'Collectionneur', desc: 'Achète 10 pouvoirs ultimes.' },
    { id: 'arsenal', t: 'Pouvoirs', n: 4, nom: 'Arsenal complet', desc: 'Achète tous les pouvoirs ultimes.' },
    { id: 'mains-nues', t: 'Pouvoirs', n: 3, nom: 'À mains nues', desc: 'Finis tout un âge (5 niveaux) sans utiliser de pouvoir.' },
    { id: 'coup-grace', t: 'Pouvoirs', n: 2, nom: 'Coup de grâce', desc: 'Achève un champion avec un pouvoir.' },
    { id: 'vole', t: 'Pouvoirs', n: 3, nom: 'On m’a volé mon pouvoir', desc: 'Gagne le niveau du Docteur Néant après qu’il t’a volé ton pouvoir.' },
    // Éléments et récompenses
    { id: 'pyromane', t: 'Éléments', n: 2, nom: 'Pyromane', desc: 'Pousse l’élément Feu à son niveau maximum.' },
    { id: 'glaciaire', t: 'Éléments', n: 2, nom: 'Ère glaciaire', desc: 'Pousse l’élément Glace à son niveau maximum.' },
    { id: 'haute-tension', t: 'Éléments', n: 2, nom: 'Haute tension', desc: 'Pousse l’élément Foudre à son niveau maximum.' },
    { id: 'brule-vif', t: 'Éléments', n: 2, nom: 'Brûlé vif', desc: 'Tue 500 ennemis par brûlure.', cle: 'brulures', but: 500 },
    { id: 'statues', t: 'Éléments', n: 2, nom: 'Statues de glace', desc: 'Ralentis 1 000 ennemis avec la glace.', cle: 'gel', but: 1000 },
    { id: 'chaine', t: 'Éléments', n: 3, nom: 'Réaction en chaîne', desc: 'Un même éclair de Foudre touche 4 ennemis.' },
    { id: 'chineur', t: 'Éléments', n: 2, nom: 'Chineur', desc: 'Prends 15 récompenses dans une même partie.' },
    { id: 'inventaire', t: 'Éléments', n: 3, nom: 'Inventaire complet', desc: 'Prends au moins une fois chaque récompense.', cle: 'recompenses', but: C.relics.length },
    // Champions et galerie
    { id: 'premier-tombe', t: 'Champions', n: 1, nom: 'Le premier tombe', desc: 'Vaincs ton premier champion.' },
    { id: 'chasseur', t: 'Champions', n: 2, nom: 'Chasseur de têtes', desc: '10 champions dans ta galerie.', cle: 'galerie', but: 10 },
    { id: 'galerie', t: 'Champions', n: 4, nom: 'Galerie complète', desc: `Les ${GALERIE.length} champions dans ta galerie.`, cle: 'galerie', but: GALERIE.length },
    { id: 'argenterie', t: 'Champions', n: 3, nom: 'Argenterie', desc: `Une médaille d’argent ou mieux pour les ${GALERIE.length} champions.`, cle: 'argent', but: GALERIE.length },
    { id: 'tout-or', t: 'Champions', n: 4, nom: 'Tout en or', desc: `Une médaille d’or pour les ${GALERIE.length} champions.`, cle: 'or', but: GALERIE.length },
    { id: 'tais-toi', t: 'Champions', n: 2, nom: 'Tais-toi !', desc: 'Tue la Reine des raptors avant son premier cri.' },
    { id: 'vraie-reine', t: 'Champions', n: 3, nom: 'La vraie reine', desc: 'Tue la vraie Reine des ombres sans toucher un seul de ses clones.' },
    { id: 'deraillement', t: 'Champions', n: 2, nom: 'Déraillement', desc: 'Arrête la Locomotive cuirassée avant qu’elle n’atteigne ta base.' },
    { id: 'esprit-libre', t: 'Champions', n: 2, nom: 'Esprit libre', desc: 'Bats le Cerveau suprême sans qu’il prenne le contrôle d’une de tes unités.' },
    { id: 'tortue-retournee', t: 'Champions', n: 2, nom: 'Tortue retournée', desc: 'Achève le Centurion pendant qu’il est en tortue.' },
    { id: 'bouclier-brise', t: 'Champions', n: 3, nom: 'Bouclier brisé', desc: 'Brise le bouclier du Méca-gardien d’un seul pouvoir.' },
    { id: 'pas-piratage', t: 'Champions', n: 2, nom: 'Pas de piratage', desc: 'Bats l’IA-mère sans qu’elle retourne une de tes tourelles.' },
    { id: 'trop-petit', t: 'Champions', n: 2, nom: 'Trop petit pour moi', desc: 'Bats le Monstre-camion sans qu’il écrase une seule unité.' },
    { id: 'atterrissage', t: 'Champions', n: 3, nom: 'Atterrissage forcé', desc: 'Abats le Quetzalcoatlus géant pendant qu’il emporte une de tes unités.' },
    // Boss rush
    { id: 'premier-rush', t: 'Boss rush', n: 1, nom: 'Premier rush', desc: 'Vaincs les trois champions d’un âge au boss rush.' },
    { id: 'mi-parcours', t: 'Boss rush', n: 2, nom: 'Mi-parcours', desc: 'Vaincs 16 champions d’affilée au boss rush.' },
    { id: 'rush-complet', t: 'Boss rush', n: 3, nom: 'Rush complet', desc: 'Vaincs les 33 champions d’un même rush.' },
    { id: 'rush-dore', t: 'Boss rush', n: 4, nom: 'Rush doré', desc: 'Finis un rush avec une médaille d’or sur chacun des 33 champions.' },
    { id: 'contre-montre', t: 'Boss rush', n: 3, nom: 'Contre la montre', desc: 'Finis un rush complet en moins de 30 minutes.' },
    { id: 'base-fer', t: 'Boss rush', n: 3, nom: 'Base de fer', desc: 'Finis un rush complet sans que ta base descende sous 25 %.' },
    { id: 'abonne', t: 'Boss rush', n: 1, nom: 'Abonné', desc: 'Lance 10 boss rushs.', cle: 'rushs', but: 10 },
    // Défi du jour
    { id: 'defi-releve', t: 'Défi du jour', n: 1, nom: 'Défi relevé', desc: 'Réussis un défi du jour.' },
    { id: 'semaine', t: 'Défi du jour', n: 2, nom: 'Une semaine', desc: 'Réussis le défi 7 jours d’affilée.', cle: 'serie', but: 7 },
    { id: 'mois', t: 'Défi du jour', n: 4, nom: 'Un mois', desc: 'Réussis le défi 30 jours d’affilée.', cle: 'serie', but: 30 },
    { id: 'coureur', t: 'Défi du jour', n: 2, nom: 'Coureur', desc: 'Réussis une course en moins de 8 minutes.' },
    { id: 'sprinter', t: 'Défi du jour', n: 3, nom: 'Sprinter', desc: 'Réussis une course en moins de 5 minutes.' },
    { id: 'regles', t: 'Défi du jour', n: 3, nom: 'Toutes les règles', desc: 'Réussis un défi avec chacune des 6 règles.', cle: 'regles', but: 6 },
    { id: 'et-alors', t: 'Défi du jour', n: 2, nom: 'Sans élites ni améliorations, et alors ?', desc: 'Réussis un défi avec ta base intacte.' },
    // Assaut final
    { id: 'assaut', t: 'Assaut final', n: 1, nom: 'À l’assaut', desc: 'Atteins l’assaut final.' },
    { id: 'vague-25', t: 'Assaut final', n: 2, nom: 'Vague 25', desc: 'Franchis la vague 25.' },
    { id: 'vague-50', t: 'Assaut final', n: 4, nom: 'Vague 50', desc: 'Franchis la vague 50.' },
    { id: 'tout-ou-rien', t: 'Assaut final', n: 3, nom: 'Tout ou rien', desc: 'Continue à 5 fenêtres de retraite d’affilée dans un même assaut.' },
    { id: 'cagnotte', t: 'Assaut final', n: 3, nom: 'Cagnotte royale', desc: 'Retire-toi avec au moins 10 000 ✦ de cagnotte.' },
    { id: 'legende', t: 'Assaut final', n: 4, nom: 'Légende', desc: 'Franchis la vague 25 en difficile.' },
    // Secrets : l'âge caché du Magma
    { id: 'soufre', t: 'Secrets', n: 1, secret: true, nom: 'Ça sent le soufre', desc: 'Fais fumer le volcan.' },
    { id: 'coulee', t: 'Secrets', n: 2, secret: true, nom: 'Coulée de lave', desc: 'Fais déborder la lave sur le terrain.' },
    { id: 'enfant-magma', t: 'Secrets', n: 3, secret: true, nom: 'Enfant du magma', desc: 'Plonge dans l’âge caché du Magma.' },
    { id: 'seigneur-feu', t: 'Secrets', n: 4, secret: true, nom: 'Seigneur du feu', desc: 'Bats les trois champions du Magma.', cle: 'magmaCh', but: 3 },
  ];
  const PAR_ID = Object.fromEntries(LISTE.map(h => [h.id, h]));
  const ICONES = { 'Progression': '⏳', 'Parties': '🎲', 'Combat': '⚔', 'Endurance': '🛡', 'Économie': '🪙', 'Tourelles': '🏰', 'Pouvoirs': '✦',
    'Éléments': '🔥', 'Champions': '♛', 'Boss rush': '💀', 'Défi du jour': '☀', 'Assaut final': '🚩', 'Secrets': '🌋' };

  // ---------------------------------------------------------------- sauvegarde
  const HF = PA.HautsFaits = {
    KEY: 'timebreakers-hauts-faits', LISTE, PAR_ID, GAINS,
    s: null,
    charger() {
      let s = null;
      try { s = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { /* ignore */ }
      s = Object.assign({ obtenus: {}, c: {} }, s || {});
      s.c = Object.assign({ parties: 0, jours: [], secondes: 0, kills: 0, brulures: 0, gel: 0, ventes: 0, recompenses: [], rushs: 0, regles: [], magmaCh: [] }, s.c);
      this.s = s;
      return s;
    },
    sauver() { try { localStorage.setItem(this.KEY, JSON.stringify(this.s)); } catch (e) { /* ignore */ } },
    a(id) { return !!this.s.obtenus[id]; },
    nb() { return Object.keys(this.s.obtenus).filter(id => PAR_ID[id]).length; },

    // Valeur d'un compteur (certains se lisent dans la campagne en cours).
    valeur(cle, meta) {
      const c = this.s.c;
      meta = meta || (PA.Game && PA.Game.meta);
      if (cle === 'jours' || cle === 'recompenses' || cle === 'regles' || cle === 'magmaCh') return c[cle].length;
      if (cle === 'heures') return c.secondes / 3600;
      if (cle === 'galerie' || cle === 'argent' || cle === 'or') {
        const min = { galerie: 1, argent: 2, or: 3 }[cle];
        return meta ? GALERIE.filter(id => (meta.champs && meta.champs[id] || 0) >= min).length : 0;
      }
      if (cle === 'serie') return meta && meta.defi ? meta.defi.serie || 0 : 0;
      return c[cle] || 0;
    },

    // Débloque un haut fait (une seule fois) : prestige, sauvegarde, bandeau.
    donner(id) {
      const h = PAR_ID[id];
      if (!h || this.a(id) || (PA.Tuto && PA.Tuto.actif) || (PA.Game && PA.Game.demo)) return false;
      this.s.obtenus[id] = Date.now();
      this.sauver();
      const meta = PA.Game && PA.Game.meta;
      const gain = meta ? PA.Meta.bank(meta, GAINS[h.n]) : 0;
      if (this.lot) this.lot.push({ h, gain }); else this.bandeau(h, gain);
      return true;
    },
    // Les compteurs : à chaque hausse, on regarde les hauts faits qui en dépendent.
    compter(cle, n) {
      if (n != null) this.s.c[cle] = (this.s.c[cle] || 0) + n;
      this.verifierCompteurs(cle);
    },
    ajouter(cle, val) {
      const l = this.s.c[cle];
      if (!l.includes(val)) { l.push(val); this.sauver(); }
      this.verifierCompteurs(cle);
    },
    verifierCompteurs(cle) {
      for (const h of LISTE) if (h.cle && (!cle || h.cle === cle) && !this.a(h.id) && this.valeur(h.cle) >= h.but) this.donner(h.id);
    },

    // État du camp : améliorations, élites, pouvoirs, galerie, records…
    verifierCamp(meta) {
      if (!meta) return;
      this.lot = [];
      try { this.verifierCamp_(meta); } finally {
        const lot = this.lot; this.lot = null;
        if (lot.length <= 2) lot.forEach(o => this.bandeau(o.h, o.gain));
        else this.bandeau({ t: '', nom: `${lot.length} hauts faits obtenus`, desc: lot.map(o => o.h.nom).slice(0, 4).join(' · ') + (lot.length > 4 ? '…' : '') }, lot.reduce((n, o) => n + o.gain, 0));
      }
    },
    verifierCamp_(meta) {
      const ups = C.upgrades, lvl = id => PA.Meta.level(meta, id);
      if (ups.some(u => lvl(u.id) > 0)) this.donner('investisseur');
      if (ups.some(u => lvl(u.id) >= u.max)) this.donner('au-max');
      if (ups.every(u => lvl(u.id) >= u.max)) this.donner('plus-rien');
      if (meta.balance >= 10000) this.donner('riche');
      const elites = Object.keys(meta.elites || {}).length;
      if (elites >= 1) this.donner('elite');
      if (C.ages.every((a, i) => PA.Meta.hasElite(meta, i))) this.donner('garde-elite');
      if (PA.Meta.maxSpeed(meta) >= 3) this.donner('presse');
      const achetables = []; C.ages.forEach((a, i) => PA.Pouvoirs.liste(i).forEach(p => { if (!p.gratuit) achetables.push(p.id); }));
      const achetes = achetables.filter(id => meta.powers && meta.powers[id]).length;
      if (achetes >= 10) this.donner('collectionneur');
      if (achetes >= achetables.length) this.donner('arsenal');
      // Rattrapage : ce que la sauvegarde montre déjà (parties jouées avant les hauts faits).
      this.s.c.parties = Math.max(this.s.c.parties, meta.runs || 0);
      if (meta.bestLevel >= 1) this.donner('premier-pas');
      if (meta.bestLevel >= C.levels.perAge) this.donner('vieux-os');
      if (meta.rushOuvert) this.donner('assaut');
      if (GALERIE.some(id => meta.champs && meta.champs[id])) this.donner('premier-tombe');
      const rush = meta.rush && meta.rush.v === 2 ? meta.rush : null;
      if (rush && rush.best >= 3) this.donner('premier-rush');
      if (rush && rush.best >= 16) this.donner('mi-parcours');
      if (rush && rush.complets > 0) this.donner('rush-complet');
      if (meta.defi && meta.defi.dernierReussi) this.donner('defi-releve');
      if (meta.magma && meta.magma.trouve) this.donner('enfant-magma');
      if (meta.bestWave >= 25) this.donner('vague-25');
      if (meta.bestWave >= 50) this.donner('vague-50');
      if (meta.bestWave >= 25 && meta.difficulty === 'difficile') this.donner('legende');
      this.verifierCompteurs();
    },

    // ---------------------------------------------------------------- affichage
    // Bandeau qui glisse en haut de l'écran.
    file: [], enCours: false,
    bandeau(h, gain) {
      this.file.push({ h, gain });
      if (!this.enCours) this.suivant();
    },
    suivant() {
      const o = this.file.shift();
      if (!o) { this.enCours = false; return; }
      this.enCours = true;
      // En pleine partie : la missive sur le terrain plutôt que le bandeau du haut.
      const jeu = PA.Game, st = document.getElementById('stage');
      if (jeu && jeu.battle && st && !document.body.classList.contains('in-menu')) return this.effetPartie(o, st, jeu.battle);
      const hote = document.body;
      const el = document.createElement('div');
      el.className = 'hf-bandeau';
      el.innerHTML = `<i>${ICONES[o.h.t] || '🏆'}</i><div><small>Haut fait${o.h.secret ? ' secret' : ''}</small><b>${o.h.nom}</b><span>${o.h.desc}</span></div>${o.gain ? `<em>+${o.gain} ✦</em>` : ''}`;
      hote.appendChild(el);
      if (PA.Sons && PA.Sons.evolution && PA.Music && PA.Music.fx) { try { PA.Sons.evolution(0); } catch (e) { /* ignore */ } }
      requestAnimationFrame(() => el.classList.add('on'));
      setTimeout(() => el.classList.remove('on'), 3600);
      setTimeout(() => { el.remove(); this.suivant(); }, 4100);
    },

    // En partie : une missive scellée arrive en volant, le sceau saute, le parchemin se déroule, des feux d'artifice éclatent,
    // puis elle se renroule et repart.
    effetPartie(o, st, b) {
      // le bandeau « NIVEAU n » est encore affiché : on attend qu'il soit parti pour ne pas le recouvrir
      const ov = document.getElementById('overlay');   // fenêtre de fin de niveau ouverte : on attend aussi
      if ((b.introT || 0) < 2.9 || (ov && !ov.classList.contains('hidden'))) {
        return setTimeout(() => {
          const jeu = PA.Game;
          if (jeu && jeu.battle && !document.body.classList.contains('in-menu')) this.effetPartie(o, st, jeu.battle);
          else { this.file.unshift(o); this.enCours = false; this.suivant(); }
        }, 200);
      }
      const h = o.h, ico = ICONES[h.t] || '🏆', gain = o.gain ? `<em>+${o.gain} ✦</em>` : '';
      const titre = `Haut fait${h.secret ? ' secret' : ''} !`;
      const el = document.createElement('div');
      const W = PA.CONFIG.world.width;
      const rand = (a, c) => a + Math.random() * (c - a);
      const COULEURS = ['#ffd23f', '#6fb0ff', '#ff6a5a', '#8dff7a', '#d58bff', '#ffffff'];
      const duree = 4300;
      el.className = 'hf-fx hf-missive';
      el.innerHTML = `<div class="rouleau"><div class="papier"><i>${ico}</i><div><small>${titre}</small><b>${h.nom}</b><span>${h.desc}</span></div>${gain}</div>`
        + `<div class="bout g"></div><div class="bout d"></div><div class="sceau">✦</div></div>`;
      st.appendChild(el);
      if (PA.Sons && PA.Sons.evolution && PA.Music && PA.Music.fx) { try { PA.Sons.evolution(0); } catch (e) { /* ignore */ } }
      requestAnimationFrame(() => el.classList.add('on'));
      // feux d'artifice une fois la missive ouverte (« fete » : affichés quel que soit le style d'effets)
      for (let k = 0; k < 6; k++) setTimeout(() => {
        if (!PA.Game || PA.Game.battle !== b) return;
        const x = rand(160, W - 160), y = rand(230, 340), col = COULEURS[k % COULEURS.length];
        b.particles.push({ ring: true, fete: true, x, y, r: 6, maxR: 90, life: 0.5, max: 0.5, color: col });
        for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, v = rand(160, 300); b.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.8, 1.3), max: 1.3, color: i % 3 ? col : '#fff', size: rand(3, 5), fete: true }); }
      }, 1000 + k * 380);
      setTimeout(() => el.classList.add('fin'), duree - 750);
      setTimeout(() => { el.remove(); this.suivant(); }, duree);
    },

    // L'onglet du camp : une grille par thème ; les secrets restent « ??? » tant qu'ils ne sont pas obtenus.
    panneau(meta) {
      const fmt = n => Math.floor(n).toLocaleString('fr-FR');
      const themes = [...new Set(LISTE.map(h => h.t))];
      const total = LISTE.filter(h => !h.secret).length, fait = LISTE.filter(h => !h.secret && this.a(h.id)).length;
      const secrets = LISTE.filter(h => h.secret && this.a(h.id)).length;
      const corps = themes.map(t => {
        const hs = LISTE.filter(h => h.t === t);
        if (t === 'Secrets' && !hs.some(h => this.a(h.id))) return '';
        const cartes = hs.map(h => {
          const ok = this.a(h.id), cache = h.secret && !ok;
          let barre = '';
          if (h.cle && !ok) {
            const v = Math.min(h.but, this.valeur(h.cle, meta));
            barre = `<div class="hf-barre"><div style="width:${v / h.but * 100}%"></div><span>${h.cle === 'heures' ? v.toFixed(1).replace('.', ',') : fmt(v)} / ${fmt(h.but)}</span></div>`;
          }
          return `<div class="hf ${ok ? 'ok' : ''}"><i>${ok ? ICONES[t] : cache ? '?' : '🔒'}</i><div><b>${cache ? '???' : h.nom}</b><span>${cache ? 'Un secret à découvrir.' : h.desc}</span>${barre}</div><em>${ok ? '✓' : `+${GAINS[h.n]} ✦`}</em></div>`;
        }).join('');
        return `<h3 class="hf-theme">${ICONES[t]} ${t} <small>${hs.filter(h => this.a(h.id)).length} / ${hs.length}</small></h3><div class="hf-grille">${cartes}</div>`;
      }).join('');
      return `<p class="camp-hint">Des défis pour toutes les campagnes. Chacun rapporte du prestige la première fois. <b>${fait} / ${total}</b>${secrets ? ` · ${secrets} secret${secrets > 1 ? 's' : ''}` : ''}</p><div class="hf-liste">${corps}</div>`;
    },
  };
  HF.charger();

  // ================================================================ branchements
  const B = PA.Battle.prototype, M = PA.Magma;
  const etat = b => b.hf || (b.hf = { types: new Set(), kinds: new Set(), baseTouchee: false, killsT: 0, pvT: -99, pvN: 0, clone: false, locoBase: false, controle: false, pirate: false, ecrase: false, vole: false, t: 0 });
  const runHf = run => run.hf || (run.hf = { tourelle: false, rec: 0, bloc: null, min25: true });
  const pouvoir = src => src == null || src === 'pouvoir';

  // --- dégâts : d'où vient le coup ?
  const damageUnit0 = B.damageUnit;
  B.damageUnit = function (u, dmg, quiet, src) {
    if (u.dead || u.cache) return damageUnit0.call(this, u, dmg, quiet, src);
    const e = etat(this);
    let bouclier = false;
    if (u.side === -1) {
      u._src = this._tourelle ? 'tourelle' : src;
      if (!this._tourelle && src !== 'brulure') u._pasTour = true;
      if (u.clone) e.clone = true;
      if (u.cs && u.def.cap && u.def.cap.type === 'bouclier') bouclier = u.cs.bou >= u.cs.bouMax * 0.999;
      if (this._chaine != null) this._chaine++;
    }
    const r = damageUnit0.call(this, u, dmg, quiet, src);
    if (bouclier && u.cs.bou <= 0 && pouvoir(src)) HF.donner('bouclier-brise');
    return r;
  };
  const chain0 = B.chain;
  B.chain = function (from, dmg) {
    this._chaine = 0;
    const r = chain0.call(this, from, dmg);
    if (this._chaine >= 3) HF.donner('chaine');   // la cible + 3 rebonds = 4 ennemis touchés
    this._chaine = null;
    return r;
  };
  // Tirs des tourelles : le projectile garde la marque jusqu'à l'impact.
  const updateTurrets0 = B.updateTurrets, fire0 = B.fire, hit0 = B.hit;
  B.updateTurrets = function (side, turrets, dt) { this._tirT = side === 1; const r = updateTurrets0.call(this, side, turrets, dt); this._tirT = false; return r; };
  B.fire = function (p) { if (this._tirT) p.tour = true; return fire0.call(this, p); };
  B.hit = function (p, x) { this._tourelle = !!p.tour; const r = hit0.call(this, p, x); this._tourelle = false; return r; };
  const damageBase0 = B.damageBase;
  B.damageBase = function (side, dmg) { if (side === 1) etat(this).baseTouchee = true; return damageBase0.call(this, side, dmg); };

  // --- morts
  const mort0 = B.onUnitDeath;
  B.onUnitDeath = function (u) {
    const e = etat(this);
    if (u.side === -1 && !u.retourne && !u.clone && !this.game.demo) {
      HF.s.c.kills++;
      if (u._src === 'brulure') HF.s.c.brulures++;
      if (u._src === 'tourelle' && this.mode === 'level' && ++e.killsT >= 50) HF.donner('barrage');
      if (pouvoir(u._src) && this.time - e.pvT < 6 && ++e.pvN >= 10) HF.donner('coup-maitre');
      if (u.isChampion) {
        HF.donner('premier-tombe');
        if (pouvoir(u._src)) HF.donner('coup-grace');
        const id = u.def.id, cs = u.cs || {};
        if (id === 'ch-reine-raptors' && !u._aCrie) HF.donner('tais-toi');
        if (id === 'ch-reine-ombres' && !e.clone) HF.donner('vraie-reine');
        if (id === 'ch-locomotive' && !e.locoBase) HF.donner('deraillement');
        if (id === 'ch-cerveau' && !e.controle) HF.donner('esprit-libre');
        if (id === 'ch-centurion' && u.garde) HF.donner('tortue-retournee');
        if (id === 'ch-ia-mere' && !e.pirate) HF.donner('pas-piratage');
        if (id === 'ch-monstre-camion' && !e.ecrase) HF.donner('trop-petit');
        if (id === 'ch-quetzal' && cs.proie) HF.donner('atterrissage');
        if (u.def.vol && !u._pasTour) HF.donner('dca');
        if (M && M.CHAMPIONS.some(d => d.id === id)) HF.ajouter('magmaCh', id);
      }
      HF.verifierCompteurs('kills'); HF.verifierCompteurs('brulures');
    }
    return mort0.call(this, u);
  };

  // --- actions du joueur
  const useSpecial0 = B.useSpecial;
  B.useSpecial = function () {
    const pret = this.specialCd <= 0 && !this.over;
    const r = useSpecial0.call(this);
    if (pret) {
      const e = etat(this); e.pvT = this.time; e.pvN = 0;
      const rh = runHf(this.run); if (rh.bloc) rh.bloc.pouvoir = true;
      HF.donner('premier-pouvoir');
    }
    return r;
  };
  const buyUnit0 = B.buyUnit;
  B.buyUnit = function (idx) {
    const n = this.queue.length, r = buyUnit0.call(this, idx);
    if (this.queue.length > n) { const d = this.queue[this.queue.length - 1].def, e = etat(this); e.types.add(d.id); e.kinds.add(d.kind); }
    return r;
  };
  const buyTurret0 = B.buyTurret;
  B.buyTurret = function (idx) {
    const n = this.run.turrets.filter(Boolean).length, r = buyTurret0.call(this, idx);
    if (this.run.turrets.filter(Boolean).length > n) {
      runHf(this.run).tourelle = true;
      HF.donner('batisseur');
      if (this.run.turrets.length >= 4 && this.run.turrets.every(Boolean)) HF.donner('forteresse');
    }
    return r;
  };
  const sell0 = B.sellTurret;
  B.sellTurret = function (slot) { const t = this.run.turrets[slot], r = sell0.call(this, slot); if (t && !this.run.turrets[slot]) HF.compter('ventes', 1); return r; };
  const evolve0 = B.evolve;
  B.evolve = function () {
    const a = this.run.age, r = evolve0.call(this);
    if (this.run.age > a && !this.run.mode) { for (let i = 1; i <= this.run.age; i++) HF.donner('age-' + i); }
    return r;
  };

  // --- à chaque pas : ce qui se lit dans l'état du combat
  const update0 = B.update;
  B.update = function (dt) {
    const r = update0.call(this, dt);
    if (this.game.demo || (PA.Tuto && PA.Tuto.actif)) return r;
    const e = etat(this), run = this.run;
    HF.s.c.secondes += dt;
    e.t += dt;
    if (e.t < 0.25) return r;           // le reste, quatre fois par seconde
    const pas = e.t; e.t = 0;
    if ((HF.s.c.secondes | 0) % 20 === 0) { HF.sauver(); HF.verifierCompteurs('heures'); }
    if (run.gold >= 1000) HF.donner('tirelire');
    if (run.gold >= 1e6) HF.donner('tresor');
    if (this.pu.filter(u => !u.dead).length >= 20) HF.donner('embouteillage');
    const pct = run.base.hp / Math.max(1, run.base.maxHp), rh = runHf(run);
    if (rh.bloc && pct < 0.5) rh.bloc.ok50 = false;
    if (run.mode === 'rush' && pct < 0.25) rh.min25 = false;
    for (const u of this.eu) {
      if (u.dead) continue;
      if (u.chill && !u._gele) { u._gele = true; HF.s.c.gel++; }
      if (!u.cs) continue;
      const id = u.def.id;
      if (id === 'ch-reine-raptors' && u.cs.cri > 0) u._aCrie = true;
      if (id === 'ch-locomotive' && u.x - u.w / 2 <= PF + 12) e.locoBase = true;
      if (id === 'ch-cerveau' && u.cs.cible) e.controle = true;
      if (id === 'ch-docteur-neant' && u.cs.fx > 0) e.vole = true;
    }
    if (run.turrets.some(t => t && t.pirate > 0)) e.pirate = true;
    if (this.pu.some(p => p.ecrase > 0)) e.ecrase = true;
    if (HF.s.c.gel >= 1000) HF.verifierCompteurs('gel');
    // Ruée d'ouverture repoussée sans dégâts à la base
    if (this.rushTotal > 0 && !e.ruee && this.rushLeft === 0 && this.time > 2 && !this.eu.some(u => u.rush && !u.dead)) { e.ruee = true; if (!e.baseTouchee) HF.donner('ruee-stoppee'); }
    // Âge caché
    if (this.volcan >= 1) HF.donner('soufre');
    if (this.lave && this.lave.etat === 'arrivee') HF.donner('coulee');
    // Assaut final
    if (this.mode === 'assault' && this.wave) {
      const passees = this.wave.n - 1;
      if (passees >= 25) { HF.donner('vague-25'); if (this.meta.difficulty === 'difficile') HF.donner('legende'); }
      if (passees >= 50) HF.donner('vague-50');
    }
    return r;
  };

  // --- début d'un âge : on suit les 5 niveaux (base au-dessus de 50 %, aucun pouvoir)
  const Battle1 = PA.Battle;
  PA.Battle = class extends Battle1 {
    constructor(game, opts) {
      super(game, opts);
      if (this.mode === 'level' && !this.special_ && game.run && !game.run.mode) {
        const rh = runHf(game.run);
        if (this.blockIndex === 0) rh.bloc = { age: this.enemyAge, ok50: true, pouvoir: false };
        else if (rh.bloc && rh.bloc.age !== this.enemyAge) rh.bloc = null;
      }
    }
  };

  // --- la partie : PA.Game est créé par js/main.js, chargé après ce fichier, qui démarre aussitôt.
  // On se branche au moment où il est rangé dans PA (avant son init), pour que le premier camp affiche déjà le bouton.
  let jeu = PA.Game;
  Object.defineProperty(PA, 'Game', { configurable: true, enumerable: true, get: () => jeu, set: g => { jeu = g; if (g) brancherJeu(g); } });
  if (jeu) brancherJeu(jeu);
  function brancherJeu(G) {
  const jour =() => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const newRun0 = G.newRun;
  G.newRun = function () {
    HF.s.c.parties++; HF.ajouter('jours', jour()); HF.compter('parties');
    return newRun0.apply(this, arguments);
  };
  const victoire0 = G.levelVictory;
  G.levelVictory = function (b) {
    const run = this.run, e = etat(b), pct = run.base.hp / Math.max(1, run.base.maxHp), gap = b.enemyAge - run.age;
    HF.donner('premier-pas');
    if (b.levelNumber === C.levels.perAge) HF.donner('vieux-os');
    if (!e.baseTouchee) HF.donner('mur-vivant');
    if (pct < 0.05) HF.donner('sur-le-fil');
    if (b.time < 45) HF.donner('eclair');
    if (b.isBoss && b.time < 90) HF.donner('blitz');
    if (e.types.size === 1) HF.donner('armee-seul');
    if (b.isBoss && e.types.size && !e.kinds.has('melee')) HF.donner('de-loin');
    if (b.isBoss && e.types.size && !e.kinds.has('ranged') && run.turrets.every(t => !t)) HF.donner('au-contact');
    if (gap >= 2) HF.donner('outsider');
    if (gap >= 3) HF.donner('david');
    if (b.reinf >= 3) HF.donner('renforts');
    if (b.time >= 900) HF.donner('marathon');
    if (run.gold < 10) HF.donner('poches-vides');
    if (e.vole) HF.donner('vole');
    const rh = runHf(run);
    if (rh.bloc && b.blockIndex === C.levels.perAge - 1 && rh.bloc.age === b.enemyAge) {
      if (rh.bloc.ok50) HF.donner('egratignure');
      if (!rh.bloc.pouvoir) HF.donner('mains-nues');
    }
    HF.sauver();
    return victoire0.apply(this, arguments);
  };
  const relique0 = G.chooseRelic;
  G.chooseRelic = function (id) {
    const run = this.run, rh = runHf(run);
    if (++rh.rec >= 15) HF.donner('chineur');
    HF.ajouter('recompenses', id);
    const r = C.relics.find(x => x.id === id);
    if (r && r.element) {
      const n = run.relics.filter(x => x === id).length + 1;
      if (n >= PA.elementMax(r.element)) HF.donner({ fire: 'pyromane', ice: 'glaciaire', shock: 'haute-tension' }[r.element]);
    }
    return relique0.apply(this, arguments);
  };
  const assaut0 = G.startAssault;
  G.startAssault = function () {
    HF.donner('assaut');
    if (this.playableAges >= C.ages.length) HF.donner('timebreaker');
    if (!runHf(this.run).tourelle) HF.donner('sans-murailles');
    const r = assaut0.apply(this, arguments);
    etat(this.battle).continues = 0;
    return r;
  };
  const continuer0 = G.continueAssault;
  G.continueAssault = function () { const e = etat(this.battle); if (++e.continues >= 5) HF.donner('tout-ou-rien'); return continuer0.apply(this, arguments); };
  const retraite0 = G.retreat;
  G.retreat = function () { if (this.battle && this.battle.cagnotte >= 10000) HF.donner('cagnotte'); return retraite0.apply(this, arguments); };

  }

  // --- boss rush et défi du jour
  const MO = PA.Modes;
  const lancerRush0 = MO.lancerRush;
  MO.lancerRush = function () { HF.compter('rushs', 1); const r = lancerRush0.apply(this, arguments); if (PA.Game.run) runHf(PA.Game.run); return r; };
  const championTue0 = MO.championTue;
  MO.championTue = function (b, u) {
    const r = championTue0.apply(this, arguments);
    const run = b.run;
    if (run.mode === 'rush' && run.medailles) {
      if (run.medailles.length >= 16) HF.donner('mi-parcours');
      if (b.rushB && b.rushB.tues >= b.rushB.total) HF.donner('premier-rush');
    }
    return r;
  };
  const fin0 = MO.fin;
  MO.fin = function (b, result) {
    const run = PA.Game.run;
    const r = fin0.apply(this, arguments);
    if (run.mode === 'defi' && result === 'victory') {
      HF.donner('defi-releve');
      if (run.defi.type === 'course' && b.time < 480) HF.donner('coureur');
      if (run.defi.type === 'course' && b.time < 300) HF.donner('sprinter');
      if (run.base.hp >= run.base.maxHp - 0.5) HF.donner('et-alors');
      HF.ajouter('regles', run.defi.regle.id);
      HF.verifierCompteurs('serie');
    }
    return r;
  };
  const finRush0 = MO.finRush;
  MO.finRush = function (run, result) {
    const complet = run.medailles.length >= this.nbChampions();
    if (complet) {
      HF.donner('rush-complet');
      if (run.medailles.every(m => m.m === 3)) HF.donner('rush-dore');
      if (run.temps < 1800) HF.donner('contre-montre');
      if (runHf(run).min25) HF.donner('base-fer');
    }
    return finRush0.apply(this, arguments);
  };

  // --- âge caché
  if (M) M.surDecouverte = () => HF.donner('enfant-magma');

  // --- camp
  const camp0 = PA.UI.showCamp;
  PA.UI.showCamp = function () {
    const avant = HF.nb();
    let r = camp0.apply(this, arguments);
    HF.sauver();
    HF.verifierCamp(PA.Game.meta);
    if (HF.nb() !== avant) r = camp0.apply(this, arguments);   // le compteur du bouton 🏆 change
    return r;
  };
})();

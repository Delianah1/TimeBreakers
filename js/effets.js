/* =========================================================================
   EFFETS VISUELS : trois styles au choix (version perso seulement), réglables dans l'aide du camp.
     origine   : les particules d'avant (carrés, anneaux)
     bd        : bande dessinée (éclats à contour, nuages cerclés, onomatopées)
     lumiere   : lueurs additives, traînées, ondes de choc
     pixels    : gros carrés, palette réduite, peu d'images

   Le combat appelle ces fonctions aux bons moments (voir battle.js) :
     PA.Fx.etincelle(b, x, y, couleur, n)   un impact (n petit) ou une explosion (n >= 8)
     PA.Fx.mort(b, unite)                   une unité disparaît
     PA.Fx.tir(b, x, y, cote)               un tir part (éclair de bouche)
     PA.Fx.evolue(b)                        montée en âge
   et le rendu appelle PA.Fx.dessiner(ctx, b). Dans la version publique, PA.DEV est faux : rien ne change.
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const TAU = Math.PI * 2, GROUND = PA.CONFIG.world.groundY, INK = '#0a1838';
  const out = x => 1 - Math.pow(1 - x, 3);
  const cl = (x, a, b) => Math.max(a, Math.min(b, x));
  const mk = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const snap = v => Math.round(v / 4) * 4;                  // la « grille » des pixels : 4 pixels du terrain
  const MOTS = ['POW!', 'BAM!', 'PAF!', 'CRAC!', 'TCHAK!'];

  function rgb(col) {                                        // '#rrggbb' ou '#rgb' → 'r,g,b'
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(col || '');
    if (!m) return '255,240,200';
    let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return `${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)}`;
  }
  const lueur = (c, x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb(col)},${a})`); g.addColorStop(1, `rgba(${rgb(col)},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
  function etoile(c, x, y, r1, r2, n, rot) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
  function eclat(c, x, y, r, rot, fill) { c.lineJoin = 'round'; c.lineWidth = Math.max(2, r * 0.13); c.strokeStyle = INK; c.fillStyle = fill; etoile(c, x, y, r, r * 0.58, 9, rot); c.stroke(); c.fill(); }
  function nuage(c, x, y, r, a) {
    c.save(); c.globalAlpha *= a; c.lineWidth = Math.max(2, r * 0.18); c.strokeStyle = INK; c.fillStyle = '#fff';
    const P = [[0, 0, 1], [-0.8, 0.25, 0.7], [0.8, 0.25, 0.7], [0.1, -0.55, 0.65]];
    P.forEach(([dx, dy, k]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r, r * k, 0, TAU); c.stroke(); });
    P.forEach(([dx, dy, k]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r, Math.max(1, r * k - c.lineWidth * 0.5), 0, TAU); c.fill(); });
    c.restore();
  }
  function mot(c, s, x, y, taille, rot, fill) {
    c.save(); c.translate(x, y); c.rotate(rot); c.font = `${taille}px 'Lilita One', 'Arial Black', sans-serif`; c.textAlign = 'center';
    c.lineJoin = 'round'; c.lineWidth = taille * 0.28; c.strokeStyle = INK; c.strokeText(s, 0, 0); c.fillStyle = fill; c.fillText(s, 0, 0); c.restore();
  }
  const carre = (c, x, y, s, col) => { c.fillStyle = col; c.fillRect(snap(x), snap(y), s, s); };
  function disque(c, x, y, r, col) { c.fillStyle = col; const R = Math.max(1, Math.round(r / 4)), cx = snap(x), cy = snap(y); for (let j = -R; j <= R; j++) { const w = Math.floor(Math.sqrt(R * R - j * j)); c.fillRect(cx - w * 4, cy + j * 4, w * 8 + 4, 4); } }

  // ---------------------------------------------------------------- dessin de chaque effet
  // e : { x, y, r, col, w, h, mot, t, dur } ; k : avancement de 0 à 1 ; r : hasard (toujours le même pour un effet)
  const DESS = {
    coup: {
      bd(c, e, k, r) {
        c.globalAlpha = 1 - k * k; eclat(c, e.x, e.y, e.r * (0.5 + 1.1 * out(k)), k * 0.6, e.col || '#ffd23f');
        for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + e.seed, d = e.r * (0.9 + 1.8 * out(k)); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 1.5; etoile(c, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, e.r * 0.3, e.r * 0.13, 4, k * 4); c.fill(); c.stroke(); }
        if (e.mot) mot(c, e.mot, e.x, e.y - e.r * 2.2 - 14 * out(k), e.r * 1.3, -0.12, '#ffd23f');
      },
      lumiere(c, e, k, r) {
        c.globalCompositeOperation = 'lighter'; lueur(c, e.x, e.y, e.r * 3.2 * (1 - k * 0.4), e.col, 0.8 * (1 - k));
        c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; c.lineWidth = 2.5 * (1 - k) + 0.5; c.beginPath(); c.arc(e.x, e.y, e.r * 0.5 + e.r * 2.6 * out(k), 0, TAU); c.stroke();
        for (let i = 0; i < 9; i++) { const a = r() * TAU, d = e.r * (1 + 3 * r()) * out(k), l = e.r * 0.8 * (1 - k); c.strokeStyle = `rgba(${rgb(e.col)},${1 - k})`; c.lineWidth = 1.8; c.beginPath(); c.moveTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d); c.lineTo(e.x + Math.cos(a) * (d - l), e.y + Math.sin(a) * (d - l)); c.stroke(); }
      },
      pixels(c, e, k, r) {
        if (k > 0.85) return;
        for (let i = 0; i < 8; i++) { const a = r() * TAU, d = (e.r * 0.5 + e.r * 2.2 * out(k)) * (0.5 + r() * 0.5); carre(c, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d + 22 * k * k, 4, i % 2 ? '#ffffff' : (e.col || '#ffd23f')); }
      },
    },
    boom: {
      bd(c, e, k, r) {
        const R = e.r * 0.62 * (0.35 + 0.85 * out(k)) * (1 - k * 0.25); c.globalAlpha = 1 - Math.max(0, (k - 0.7) / 0.3);
        eclat(c, e.x, e.y, R, k * 0.5, '#ff5a4a'); eclat(c, e.x, e.y, R * 0.7, -k * 0.4, '#ffd23f'); eclat(c, e.x, e.y, R * 0.34, k, '#ffffff');
        for (let i = 0; i < 3; i++) nuage(c, e.x - R * 0.6 + i * R * 0.6, e.y - R * 0.4 - R * 0.7 * out(k), R * 0.22, Math.min(1, k * 4) * (1 - k));
        for (let i = 0; i < 6; i++) { const a = -Math.PI + r() * Math.PI, d = R * (0.8 + 1.4 * r()) * out(k); c.save(); c.translate(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d + 40 * k * k); c.rotate(k * 8 + i); c.fillStyle = '#5a3d28'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(-4, -4, 8, 8); c.strokeRect(-4, -4, 8, 8); c.restore(); }
        if (e.mot) mot(c, e.mot, e.x, e.y - R - 18, Math.min(34, e.r * 0.6), 0.1, '#ffd23f');
      },
      lumiere(c, e, k, r) {
        c.globalCompositeOperation = 'lighter';
        lueur(c, e.x, e.y, e.r * 1.6 * (0.4 + 0.6 * out(k)), '#ff8c3c', 0.9 * (1 - k)); lueur(c, e.x, e.y, e.r * 0.8 * (0.3 + 0.5 * out(k)), '#fff0b4', 1 - k * 1.3);
        c.strokeStyle = `rgba(255,200,140,${0.9 * (1 - k)})`; c.lineWidth = 4 * (1 - k) + 1; c.beginPath(); c.ellipse(e.x, GROUND - 2, 10 + e.r * 1.4 * out(k), 4 + e.r * 0.28 * out(k), 0, 0, TAU); c.stroke();
        for (let i = 0; i < 22; i++) { const a = -Math.PI + r() * Math.PI, d = e.r * (0.4 + 1.6 * r()) * out(k), x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d + 60 * k * k; c.strokeStyle = `rgba(255,${120 + (i % 4) * 30},60,${1 - k})`; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(a) * 12 * (1 - k), y - Math.sin(a) * 12 * (1 - k) - 6); c.stroke(); }
      },
      pixels(c, e, k, r) {
        const pal = ['#ffffff', '#ffd23f', '#ff8a3c', '#ff5a4a', '#8f2a23', '#3a2230'], n = Math.min(5, Math.floor(k * 6)), R = e.r * (0.4 + 0.6 * out(Math.min(1, k * 1.4)));
        if (k > 0.95) return;
        disque(c, e.x, e.y, R, pal[n]); disque(c, e.x, e.y, Math.max(8, R - 16), pal[Math.max(0, n - 1)]); disque(c, e.x, e.y, Math.max(4, R - 34), pal[Math.max(0, n - 2)]);
        for (let i = 0; i < 8; i++) { const a = -Math.PI + r() * Math.PI, d = e.r * (0.6 + r() * 1.2) * out(k); carre(c, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d + 50 * k * k, 8, i % 2 ? '#5a3d28' : '#ffd23f'); }
      },
    },
    mort: {
      bd(c, e, k, r) {
        c.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
        for (let i = 0; i < 3; i++) nuage(c, e.x + (i - 1) * e.w * 0.38, e.y + (i % 2 ? 4 : -3) - 12 * k, e.w * (0.26 + 0.16 * out(k)), 1);
        for (let i = 0; i < 3; i++) { const a = k * 6 + i * TAU / 3; c.fillStyle = '#ffd23f'; c.strokeStyle = INK; c.lineWidth = 1.5; etoile(c, e.x + Math.cos(a) * e.w * 0.65, e.y - e.h * 0.5 + Math.sin(a) * 5, 4.5, 2, 4, k * 3); c.fill(); c.stroke(); }
      },
      lumiere(c, e, k, r) {
        c.globalCompositeOperation = 'lighter'; lueur(c, e.x, e.y, e.h * 1.1 * (1 - k * 0.5), e.col, 0.5 * (1 - k));
        for (let i = 0; i < 26; i++) { const x0 = e.x + (r() - 0.5) * e.w, y0 = e.y + (r() - 0.5) * e.h, v = 20 + r() * 50, x = x0 + (r() - 0.5) * 30 * out(k), y = y0 - v * out(k) - 20 * k; c.fillStyle = `rgba(${rgb(e.col)},${1 - k})`; c.beginPath(); c.arc(x, y, 2.4 * (1 - k * 0.5), 0, TAU); c.fill(); }
      },
      pixels(c, e, k, r) {
        if (k > 0.9) return;
        for (let i = 0; i < 14; i++) { const x0 = e.x + (r() - 0.5) * e.w, y0 = e.y + (r() - 0.5) * e.h; carre(c, x0 + (r() - 0.5) * 16 * k, y0 + 40 * k * k, 4, i % 3 ? e.col : '#f3d4b0'); }
      },
    },
    tir: {
      bd(c, e, k) { c.globalAlpha = 1 - k; nuage(c, e.x + e.cote * 8 * k, e.y - 4 * k, e.r * (0.5 + 0.7 * k), 1); },
      lumiere(c, e, k) { c.globalCompositeOperation = 'lighter'; lueur(c, e.x, e.y, e.r * 3 * (1 - k * 0.4), '#ffdc8c', 1 - k); },
      pixels(c, e, k) { if (k > 0.5) return; carre(c, e.x - 2, e.y - 10, 4, '#ffd23f'); carre(c, e.x - 2, e.y + 6, 4, '#ffd23f'); c.fillStyle = '#fff'; c.fillRect(snap(e.x) - 8, snap(e.y) - 2, 16, 4); },
    },
    evolue: {
      bd(c, e, k, r) {
        c.globalAlpha = 1 - Math.max(0, (k - 0.7) / 0.3); c.save(); c.translate(e.x, e.y); c.rotate(e.t * 0.8);
        for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = i % 2 ? '#fff3b0' : '#ffd23f'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(24, -5); c.lineTo(24 + 150 * out(Math.min(1, k * 1.6)), 0); c.lineTo(24, 5); c.closePath(); c.fill(); c.stroke(); } c.restore();
        for (let i = 0; i < 12; i++) { const a = r() * TAU, d = 50 + r() * 130; c.fillStyle = ['#ffd23f', '#ff5a4a', '#6fb0ff', '#5fd14a'][i % 4]; c.strokeStyle = INK; c.lineWidth = 1.5; etoile(c, e.x + Math.cos(a) * d * out(k), e.y + Math.sin(a) * d * out(k) - 40 * k, 9, 4, 5, k * 5 + i); c.fill(); c.stroke(); }
      },
      lumiere(c, e, k, r) {
        const f = 1 - Math.max(0, (k - 0.6) / 0.4); c.globalCompositeOperation = 'lighter';
        const g = c.createLinearGradient(0, e.y - 260, 0, GROUND); g.addColorStop(0, 'rgba(255,215,106,0)'); g.addColorStop(1, `rgba(255,235,170,${0.8 * f})`); c.fillStyle = g; c.fillRect(e.x - 34 * out(Math.min(1, k * 2)), e.y - 260, 68 * out(Math.min(1, k * 2)), 260 + (GROUND - e.y));
        for (let i = 0; i < 3; i++) { const q = cl((k - i * 0.15) / 0.7, 0, 1); if (q > 0 && q < 1) { c.strokeStyle = `rgba(255,225,150,${0.9 * (1 - q)})`; c.lineWidth = 3 * (1 - q) + 1; c.beginPath(); c.ellipse(e.x, GROUND - 2, 14 + 130 * out(q), 4 + 20 * out(q), 0, 0, TAU); c.stroke(); } }
        for (let i = 0; i < 40; i++) { const x = e.x + (r() - 0.5) * 70, y = GROUND - r() * 20 - (70 + r() * 160) * out(k); c.fillStyle = `rgba(255,${210 + (i % 3) * 15},${120 + (i % 3) * 40},${f})`; c.beginPath(); c.arc(x, y, 2.6, 0, TAU); c.fill(); }
      },
      pixels(c, e, k, r) {
        const f = ['#ffffff', '#ffd23f', '#ffffff', '#c9a7ff'];
        if (k < 0.3) { const i = Math.floor(k / 0.075) % 4; if (i % 2 === 0) { c.globalAlpha = 0.45; c.fillStyle = f[i]; c.fillRect(e.x - 120, e.y - 160, 240, 220); c.globalAlpha = 1; } }
        if (k > 0.2) for (let i = 0; i < 14; i++) { const x = e.x - 40 + (i % 7) * 12, y = GROUND - 20 - ((i * 23) % 120) - 120 * out(k); carre(c, x, y, 8, i % 2 ? '#ffd23f' : '#fff'); carre(c, x + 2, y - 8, 4, '#fff'); carre(c, x + 2, y + 8, 4, '#fff'); }
      },
    },
  };

  // traînée derrière un projectile en vol
  const SILLAGE = {
    bd(c, p, dx, dy) { c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(p.x - dx * 10, p.y - dy * 10 + i * 5); c.lineTo(p.x - dx * 34, p.y - dy * 34 + i * 5); c.stroke(); } },
    lumiere(c, p, dx, dy) { c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(p.x - dx * 70, p.y - dy * 70, p.x, p.y); g.addColorStop(0, 'rgba(111,232,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.85)'); c.strokeStyle = g; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x - dx * 70, p.y - dy * 70); c.lineTo(p.x, p.y); c.stroke(); lueur(c, p.x, p.y, 14, '#b4f0ff', 0.9); },
    pixels(c, p, dx, dy) { for (let i = 1; i <= 3; i++) carre(c, p.x - dx * i * 12, p.y - dy * i * 12, i === 1 ? 6 : 4, i === 1 ? '#ffd23f' : '#c9a36a'); },
  };

  // D « cartoon du jeu » : les impacts, morts, tirs et montées en âge sont ceux de la bande dessinée (contour épais, aplats) ;
  // la différence est dans les éléments (glace, feu, foudre), dessinés plus bas par Fx.glace / Fx.flammes / Fx.eclair.
  for (const k of Object.keys(DESS)) DESS[k].cartoon = DESS[k].bd;
  SILLAGE.cartoon = SILLAGE.bd;

  function trait(c, fill, lw) { c.lineJoin = 'round'; c.lineCap = 'round'; if (fill) { c.fillStyle = fill; c.fill(); } if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); } }
  function flamme(c, x, b, h, w, sw, fill, lw) { c.beginPath(); c.moveTo(x - w, b); c.bezierCurveTo(x - w * 1.15, b - h * 0.45, x - w * 0.3 + sw * 0.4, b - h * 0.7, x + sw, b - h); c.bezierCurveTo(x + w * 0.3 + sw * 0.4, b - h * 0.65, x + w * 1.15, b - h * 0.45, x + w, b); c.closePath(); trait(c, fill, lw); }
  function flamme3(c, x, b, h, w, sw, lw) { flamme(c, x, b, h, w, sw, '#e8431f', lw); flamme(c, x, b - 0.5, h * 0.72, w * 0.62, sw * 0.7, '#ff9a2a', 0); flamme(c, x, b - 1, h * 0.42, w * 0.34, sw * 0.4, '#ffe36a', 0); }
  function eclair(c, pts, w, fill, lw) {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, wi = w * (1 - 0.7 * i / (n - 1)) / 2 + 0.6; L.push([pts[i][0] + nx * wi, pts[i][1] + ny * wi]); R.push([pts[i][0] - nx * wi, pts[i][1] - ny * wi]); }
    c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); R.reverse().forEach(([x, y]) => c.lineTo(x, y)); c.closePath(); trait(c, fill, lw);
  }

  const Fx = {
    STYLES: { cartoon: 'D · Cartoon du jeu', origine: 'Original', bd: 'A · Bande dessinée', lumiere: 'B · Lumière', pixels: 'C · Pixels' },
    style: 'cartoon',
    cle: 'timebreakers-fx',
    // La version perso propose tous les styles (PA.DEV) ; la publique est toujours en « cartoon du jeu ».
    actif() { return this.style !== 'origine'; },
    cartoon() { return this.style === 'cartoon'; },
    charger() { if (!PA.DEV) { this.style = 'cartoon'; return; } try { const s = localStorage.getItem(this.cle); if (s && this.STYLES[s]) this.style = s; } catch (e) { /* ignore */ } },

    // Éléments dessinés sur les unités (repère de l'unité : pieds en y = 0, hw = demi-largeur, h = hauteur). Renvoient false si le style n'est pas D.
    glace(c, hw, h) {
      if (!this.cartoon()) return false;
      c.beginPath(); c.ellipse(0, 0, hw * 1.25, 3, 0, 0, TAU); trait(c, '#d9f5ff', 1.8);
      [[-1.05, 5.5, 0.34, -0.4], [1.05, 5.5, 0.36, 0.4], [-0.62, 7, 0.52, -0.18], [0.62, 7, 0.58, 0.18]].forEach(([k, w, q, tilt]) => {
        c.save(); c.translate(hw * k, 0); c.rotate(tilt); const H = h * q, W = w / 2;
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W, -H * 0.75); c.lineTo(0, -H); c.lineTo(W, -H * 0.75); c.lineTo(W, 0); c.closePath(); c.fillStyle = '#8fd8ff'; c.fill();
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W, -H * 0.75); c.lineTo(0, -H); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#d9f5ff'; c.fill();
        c.beginPath(); c.moveTo(W, 0); c.lineTo(W, -H * 0.75); c.lineTo(0, -H); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#4fa6e8'; c.fill();
        c.beginPath(); c.moveTo(-W, 0); c.lineTo(-W, -H * 0.75); c.lineTo(0, -H); c.lineTo(W, -H * 0.75); c.lineTo(W, 0); c.closePath(); trait(c, null, 1.8); c.restore();
      });
      return true;
    },
    flammes(c, hw, h, temps) {
      if (!this.cartoon()) return false;
      const T = temps * 8;
      [[-0.62, 0.34, 0.2], [0.62, 0.3, 1.1]].forEach(([k, q, p]) => flamme(c, hw * k, -h * 0.1, h * q * (1 + 0.15 * Math.sin(T + p)), 5, Math.sin(T * 0.8 + p) * 2, '#c42f17', 2));
      [[-0.9, 0.2, 0.4], [-0.3, 0.28, 1.7], [0.3, 0.25, 0.9], [0.9, 0.2, 2.6]].forEach(([k, q, p]) => flamme3(c, hw * k, -h * 0.05, h * q * (1 + 0.18 * Math.sin(T * 1.1 + p)), 4, Math.sin(T + p) * 2, 2));
      return true;
    },
    // L'éclair de la Foudre : une vraie forme jaune, épaisse au départ et fine au bout, avec un cœur blanc ; une étoile à l'impact.
    eclair(c, pts, a) {
      if (!this.cartoon() || !pts || pts.length < 2) return false;
      c.globalAlpha = a; eclair(c, pts, 9, '#ffe94a', 3);
      c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
      const e = pts[pts.length - 1]; c.beginPath(); etoile(c, e[0], e[1], 15 - 6 * (1 - a), 7, 8, a * 2); trait(c, '#ffd23f', 3); c.beginPath(); etoile(c, e[0], e[1], 7, 3.2, 8, a * 2); trait(c, '#fff', 0);
      return true;
    },
    choisir(s) { if (!this.STYLES[s]) return; this.style = s; try { localStorage.setItem(this.cle, s); } catch (e) { /* ignore */ } },

    ajouter(b, e) {
      const l = b.fx || (b.fx = []);
      if (l.length > 70) l.shift();
      e.t = 0; e.seed = Math.floor(Math.random() * 100000); l.push(e);
    },
    // impact (n petit) ou explosion (n >= 8) ; col : couleur de l'impact
    etincelle(b, x, y, col, n) {
      if (!this.actif()) return;
      if (n >= 8) this.ajouter(b, { type: 'boom', x, y: GROUND - 30, r: 34 + n * 4, col, dur: 0.75, mot: Math.random() < 0.3 ? 'BOUM!' : null });
      else this.ajouter(b, { type: 'coup', x, y, r: 10 + n * 2.5, col, dur: 0.4, mot: n >= 3 && Math.random() < 0.08 ? MOTS[Math.floor(Math.random() * MOTS.length)] : null });
    },
    mort(b, u) { if (this.actif()) this.ajouter(b, { type: 'mort', x: u.x, y: GROUND - u.h / 2, w: u.w, h: u.h, col: u.side === 1 ? '#6f8fd8' : '#d36a5f', dur: 0.7 }); },
    tir(b, x, y, cote) { if (this.actif()) this.ajouter(b, { type: 'tir', x, y, cote, r: 10, dur: 0.18 }); },
    evolue(b) { if (this.actif()) this.ajouter(b, { type: 'evolue', x: 70, y: GROUND - 90, dur: 1.3 }); },
    maj(b, dt) { if (!b.fx) return; for (const e of b.fx) e.t += dt; b.fx = b.fx.filter(e => e.t < e.dur); },

    dessiner(c, b) {
      if (!this.actif()) return;
      const st = this.style;
      for (const e of b.fx || []) { c.save(); DESS[e.type][st](c, e, e.t / e.dur, mk(e.seed)); c.restore(); }
      for (const p of b.projectiles) {
        if (p.dead || p.arc) continue;
        const ax = p.x - (p.px == null ? p.x - p.owner * 5 : p.px), ay = p.y - (p.py == null ? p.y : p.py), n = Math.hypot(ax, ay) || 1;
        c.save(); SILLAGE[st](c, p, ax / n, ay / n); c.restore();
      }
    },
  };
  PA.Fx = Fx;
})();

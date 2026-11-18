/* =========================================================================
   RENDU : tout est dessiné à la main sur le canvas (aucune image externe).
   ========================================================================= */
window.PA = window.PA || {};

(function () {
  const C = PA.CONFIG;
  const W = C.world.width, H = C.world.height, GROUND = C.world.groundY;
  const TEAM = { 1: '#3d6fd6', '-1': '#cf4338' };
  const TEAM_DARK = { 1: '#284c99', '-1': '#8f2a23' };
  const SKIN = '#e9c39b';
  // direction d'un projectile, d'après sa position précédente
  const dirOf = p => Math.atan2(p.y - (p.py == null ? p.y : p.py), p.x - (p.px == null ? p.x - p.owner : p.px));
  // Nombre court pour l'interface : 9 500 · 12,3 k · 328 k · 1,46 M · 2,1 Md (toujours arrondi vers le bas).
  PA.court = n => {
    n = Math.floor(n);
    const cut = (x, d) => (Math.floor(x * 10 ** d) / 10 ** d).toLocaleString('fr-FR', { maximumFractionDigits: d });
    if (n < 10000) return n.toLocaleString('fr-FR');
    if (n < 1e6) return cut(n / 1e3, n < 1e5 ? 1 : 0) + ' k';
    if (n < 1e9) return cut(n / 1e6, n < 1e7 ? 2 : n < 1e8 ? 1 : 0) + ' M';
    return cut(n / 1e9, 2) + ' Md';
  };
  const ASSAULT_PALETTE ={ skyTop: '#2e1d2c', skyBottom: '#b0583f', hills: '#4a3438', hillsFar: '#6b4547', ground: '#3b2d2b', groundTop: '#56413b' };

  const R = {
    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.clouds = [];
      for (let i = 0; i < 6; i++) this.clouds.push({ x: Math.random() * W, y: 60 + Math.random() * 160, s: 0.6 + Math.random() * 0.8, v: 6 + Math.random() * 10 });
      this.tufts = [];
      for (let i = 0; i < 70; i++) this.tufts.push({ x: Math.random() * W, y: GROUND + 14 + Math.random() * 90, s: 0.5 + Math.random() });
      this.stars = [];
      for (let i = 0; i < 90; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * 380, r: 0.6 + Math.random() * 1.2, p: Math.random() * 6 });
      // silhouettes d'immeubles (âge des super-héros)
      this.city = [[], []];
      for (let layer = 0; layer < 2; layer++) {
        for (let x = -40; x < W + 40;) {
          const w = 36 + Math.random() * 50;
          this.city[layer].push({ x, w, h: (layer ? 50 : 110) + Math.random() * (layer ? 70 : 130) });
          x += w + 4 + Math.random() * 10;
        }
      }
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.canvas.width = W * dpr;
      this.canvas.height = H * dpr;
    },

    draw(game, t, dt) {
      const ctx = this.ctx;
      const b = game.battle;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      let pal = C.ages[0].palette;
      if (b) pal = b.mode === 'assault' ? ASSAULT_PALETTE : C.ages[b.enemyAge].palette;

      // Nouveaux graphismes (js/art.js) : quand un élément y a sa version, elle remplace l'ancienne.
      const A = this.art = PA.Art && PA.Art.on ? PA.Art : null;
      const sceneAge = !b ? C.ages[0] : b.mode === 'assault' ? null : C.ages[b.enemyAge];
      const backdrop = A && A.backdrops[sceneAge ? sceneAge.id : 'assaut'];

      ctx.save();
      if (b && b.shake > 0) ctx.translate((Math.random() - 0.5) * b.shake * 30, (Math.random() - 0.5) * b.shake * 20);
      if (backdrop) backdrop(ctx, t, dt, this);
      else this.background(ctx, pal, t, dt);

      if (!b) {
        this.base(ctx, 1, C.ages[0].base, null);
        this.base(ctx, -1, C.ages[0].base, null);
        ctx.restore();
        return;
      }

      const playerBase = C.ages[game.run.age].base;
      const enemyBase = b.mode === 'assault' ? { look: 'citadel', height: 210 } : C.ages[b.enemyAge].base;
      this.base(ctx, 1, playerBase, { hp: game.run.base.hp, maxHp: game.run.base.maxHp });
      this.base(ctx, -1, enemyBase, b.enemyBase.invulnerable ? { infinite: true } : b.enemyBase);
      this.turrets(ctx, b, 1, game.run.turrets);
      this.turrets(ctx, b, -1, b.enemyTurrets);

      this.elemColor = b.element ? C.elements[b.element].color : null;
      if (PA.Pouvoirs) PA.Pouvoirs.sol(ctx, b);           // pouvoirs : ce qui est posé au sol (fosse, flaques, mines)
      if (PA.Champions) PA.Champions.sol(ctx, b);         // champions : flaques, œufs, galeries, aura
      // Les volants passent devant les autres.
      const all = b.pu.concat(b.eu).sort((u, v) => ((u.alt || 0) > 0) - ((v.alt || 0) > 0) || u.x - v.x);
      for (const u of all) this.unit(ctx, u);
      if (PA.Champions) PA.Champions.dessiner(ctx, b);    // champions : souffle, bouclier, parachutes, rayons…
      for (const u of all) this.unitBar(ctx, u);
      for (const p of b.projectiles) this.projectile(ctx, p);
      for (const d of b.drops) if (d.delay <= 0 && d.x != null) this.drop(ctx, d);
      if (b.sweeps) for (const s of b.sweeps) if (s.delay <= 0) this.sweep(ctx, s);
      if (b.airship) this.airship(ctx, b.airship);
      if (PA.Pouvoirs) PA.Pouvoirs.dessiner(ctx, b);      // pouvoirs : flammes, nuages, dômes, vaisseaux
      this.particles(ctx, b);
      if (PA.Fx) PA.Fx.dessiner(ctx, b);
      this.texts(ctx, b);
      ctx.restore();

      if (b.mode === 'assault') this.assaultBanner(ctx, b, game);
      if (b.mode === 'level' && b.reinf > 0) this.reinforcements(ctx, b, t);
      this.levelBanner(ctx, b, game, dt);
    },

    // Renforts : lueur rouge côté ennemi à chaque palier, et badge permanent.
    reinforcements(ctx, b, t) {
      const R = C.levels.reinforcements;
      if (b.reinfFlash > 0) {
        const g = ctx.createLinearGradient(W, 0, W - 360, 0);
        g.addColorStop(0, `rgba(220,40,30,${0.45 * b.reinfFlash / 1.2})`);
        g.addColorStop(1, 'rgba(220,40,30,0)');
        ctx.fillStyle = g;
        ctx.fillRect(W - 360, 0, 360, H);
      }
      const label = `⚠ RENFORTS +${Math.round(R.statPerStep * b.reinf * 100)} %`;
      ctx.font = 'bold 16px system-ui, sans-serif';
      const w = ctx.measureText(label).width + 24;
      const pulse = 0.75 + 0.25 * Math.sin(t * 5);
      ctx.fillStyle = `rgba(150,28,22,${0.85 * pulse})`;
      // au centre, juste sous le bandeau de l'interface (le coin droit est pris par le bouton du pouvoir)
      ctx.fillRect(W / 2 - w / 2, 70, w, 30);
      ctx.fillStyle = '#ffe2d6';
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 91);
    },

    // Grand bandeau au début de chaque niveau (temps réel, figé pendant la pause).
    levelBanner(ctx, b, game, dt) {
      const DUR = 2.8;
      b.introT = (b.introT || 0) + (dt || 0);
      const T = b.introT;
      if (T > DUR) return;
      let title, sub, color = '#ffd76a';
      let sub2 = '';
      if (b.mode === 'assault') {
        title = 'ASSAUT FINAL';
        sub = 'Les vagues ne s’arrêtent plus';
        color = '#ffb08a';
      } else {
        title = `NIVEAU ${b.levelNumber}`;
        sub = `${C.ages[b.enemyAge].name} · ${b.blockIndex + 1} / ${C.levels.perAge}`;
        if (b.isBoss) { title += ' — BOSS'; color = '#ff8a6a'; sub += ` · ${b.champDef.name} approche`; }
        else if (b.blockIndex === 0 && b.enemyAge > 0) sub = `Nouvel âge ennemi : ${C.ages[b.enemyAge].name} !`;
        const gap = b.enemyAge - game.run.age;
        if (gap > 0) sub2 = `Outsider : +${Math.round(gap * C.prestige.outsiderPerAge * 100)} % de prestige si tu gagnes`;
      }
      const a = Math.max(0, Math.min(1, T / 0.25, (DUR - T) / 0.5));
      const slide = (1 - Math.min(1, T / 0.35)) * 80;
      const y = 250;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(15,10,18,0.74)';
      ctx.fillRect(0, y - 72, W, sub2 ? 172 : 144);
      ctx.fillStyle = color;
      ctx.fillRect(0, y - 72, W, 3);
      ctx.fillRect(0, y + (sub2 ? 97 : 69), W, 3);
      ctx.textAlign = 'center';
      ctx.font = 'bold 62px system-ui, sans-serif';
      ctx.fillText(title, W / 2 + slide, y + 8);
      ctx.fillStyle = '#f1ebe4';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(sub, W / 2 - slide, y + 46);
      if (sub2) {
        ctx.fillStyle = '#c9a7ff';
        ctx.font = 'bold 18px system-ui, sans-serif';
        ctx.fillText(sub2, W / 2, y + 78);
      }
      ctx.restore();
    },

    // ------------------------------------------------------------ décor
    background(ctx, pal, t, dt) {
      const g = ctx.createLinearGradient(0, 0, 0, GROUND);
      g.addColorStop(0, pal.skyTop);
      g.addColorStop(1, pal.skyBottom);
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, W + 80, GROUND + 40);

      if (pal.night) {
        // ciel étoilé et planète (âge futur)
        for (const s of this.stars) {
          ctx.fillStyle = `rgba(220,230,255,${0.35 + 0.35 * Math.sin(t * 1.5 + s.p)})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = pal.planet || '#8b7fd8';
        ctx.beginPath(); ctx.arc(960, 130, 54, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(30,20,70,0.35)';
        ctx.beginPath(); ctx.arc(978, 118, 50, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(200,190,255,0.6)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(960, 130, 86, 16, -0.25, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = pal.sun || 'rgba(255,248,220,0.85)';
        ctx.beginPath(); ctx.arc(980, 120, 46, 0, Math.PI * 2); ctx.fill();
      }

      ctx.fillStyle = pal.clouds || 'rgba(255,255,255,0.55)';
      for (const c of this.clouds) {
        c.x += c.v * (dt || 0);
        if (c.x > W + 120) c.x = -120;
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, 50 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(c.x + 30 * c.s, c.y - 10 * c.s, 34 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      if (pal.city) {
        // deux rangées d'immeubles avec fenêtres
        [pal.hillsFar, pal.hills].forEach((color, layer) => {
          for (const bld of this.city[layer]) {
            ctx.fillStyle = color;
            ctx.fillRect(bld.x, GROUND - bld.h, bld.w, bld.h);
            ctx.fillStyle = layer ? 'rgba(255,240,170,0.35)' : 'rgba(255,255,255,0.18)';
            for (let y = GROUND - bld.h + 10; y < GROUND - 14; y += 16) {
              for (let x = bld.x + 6; x < bld.x + bld.w - 8; x += 12) ctx.fillRect(x, y, 5, 7);
            }
          }
        });
      } else {
        this.hills(ctx, pal.hillsFar, 470, 40, 0.004, 1.3);
        if (pal.smoke) this.chimneys(ctx, t);
        if (pal.acropolis) this.acropolis(ctx);
        this.hills(ctx, pal.hills, 540, 30, 0.007, 4.1);
      }

      ctx.fillStyle = pal.ground;
      ctx.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
      ctx.fillStyle = pal.groundTop;
      ctx.fillRect(-40, GROUND, W + 80, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (const f of this.tufts) {
        ctx.beginPath(); ctx.ellipse(f.x, f.y, 6 * f.s, 2.5 * f.s, 0, 0, Math.PI * 2); ctx.fill();
      }
    },

    // Hauteur de la ligne des collines lointaines en x (même formule que hills()).
    farHillY(x) { return 470 - Math.sin(x * 0.004 + 1.3) * 40 - Math.sin(x * 0.004 * 2.7 + 2.6) * 16; },

    // Âge de la vapeur : cheminées d'usines au loin, qui fument.
    chimneys(ctx, t) {
      const tt = t || 0;
      for (const [x, hh] of [[150, 64], [196, 92], [520, 58], [780, 84], [812, 60], [1120, 74]]) {
        const top = this.farHillY(x) - hh;
        ctx.fillStyle = 'rgba(64,52,46,0.6)';
        ctx.fillRect(x, top, 11, GROUND - top);
        ctx.fillRect(x - 2, top, 15, 4);
        for (let k = 0; k < 4; k++) {
          const ph = (tt * 0.12 + k / 4 + x * 0.0013) % 1;
          ctx.fillStyle = `rgba(95,88,84,${0.38 * (1 - ph)})`;
          ctx.beginPath(); ctx.arc(x + 6 + ph * 40, top - 8 - ph * 70, 7 + ph * 18, 0, Math.PI * 2); ctx.fill();
        }
      }
    },

    // Antiquité : deux temples en silhouette sur les collines lointaines.
    acropolis(ctx) {
      ctx.fillStyle = 'rgba(244,236,214,0.55)';
      for (const [x, s] of [[250, 1], [905, 0.7]]) {
        const y = this.farHillY(x + 45 * s) + 4;
        ctx.fillRect(x - 4 * s, y - 6 * s, 98 * s, 6 * s);
        for (let i = 0; i < 6; i++) ctx.fillRect(x + (3 + i * 16) * s, y - 36 * s, 7 * s, 30 * s);
        ctx.fillRect(x - 2 * s, y - 43 * s, 94 * s, 7 * s);
        ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 43 * s); ctx.lineTo(x + 45 * s, y - 60 * s); ctx.lineTo(x + 94 * s, y - 43 * s); ctx.fill();
      }
    },

    hills(ctx, color, y, amp, freq, phase) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-40, GROUND);
      for (let x = -40; x <= W + 40; x += 20) {
        ctx.lineTo(x, y - Math.sin(x * freq + phase) * amp - Math.sin(x * freq * 2.7 + phase * 2) * amp * 0.4);
      }
      ctx.lineTo(W + 40, GROUND);
      ctx.closePath();
      ctx.fill();
    },

    // ------------------------------------------------------------ bases
    base(ctx, side, def, hpInfo) {
      ctx.save();
      if (side === -1) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      const h = def.height;
      const baseArt = this.art && this.art.bases[def.look];
      if (baseArt) {
        baseArt(ctx, side, def, TEAM[side], TEAM_DARK[side], this);
      } else if (def.look === 'cave') {
        ctx.fillStyle = '#8c7c6a';
        ctx.beginPath();
        ctx.moveTo(0, GROUND); ctx.lineTo(0, GROUND - 98); ctx.lineTo(22, GROUND - h); ctx.lineTo(62, GROUND - 112);
        ctx.lineTo(98, GROUND - 78); ctx.lineTo(114, GROUND); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6d5f50'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(10, GROUND - 70); ctx.lineTo(40, GROUND - 82); ctx.moveTo(55, GROUND - 95); ctx.lineTo(85, GROUND - 70); ctx.stroke();
        ctx.fillStyle = '#2b221b';
        ctx.beginPath(); ctx.ellipse(62, GROUND, 24, 36, 0, Math.PI, 0); ctx.fill();
        this.flag(ctx, 24, GROUND - h, side);
      } else if (def.look === 'castle') {
        ctx.fillStyle = '#9b9a94';
        ctx.fillRect(6, GROUND - h, 100, h);
        for (let i = 0; i < 5; i++) ctx.fillRect(6 + i * 22, GROUND - h - 14, 13, 14);
        ctx.strokeStyle = '#7c7b76'; ctx.lineWidth = 1.5;
        for (let y = GROUND - h + 20; y < GROUND; y += 20) {
          ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(106, y); ctx.stroke();
        }
        ctx.fillStyle = '#3a2c22';
        ctx.beginPath(); ctx.moveTo(40, GROUND); ctx.lineTo(40, GROUND - 40); ctx.arc(58, GROUND - 40, 18, Math.PI, 0); ctx.lineTo(76, GROUND); ctx.fill();
        ctx.fillStyle = TEAM[side];
        ctx.fillRect(20, GROUND - h + 30, 16, 30);
        this.flag(ctx, 56, GROUND - h - 14, side);
      } else if (def.look === 'citadel') {
        ctx.fillStyle = '#3c3038';
        ctx.fillRect(0, GROUND - h, 116, h);
        for (let i = 0; i < 6; i++) {
          ctx.beginPath(); ctx.moveTo(i * 20, GROUND - h); ctx.lineTo(i * 20 + 10, GROUND - h - 22); ctx.lineTo(i * 20 + 20, GROUND - h); ctx.fill();
        }
        ctx.fillStyle = '#ff7a4a';
        for (let i = 0; i < 3; i++) ctx.fillRect(20 + i * 30, GROUND - h + 40, 10, 18);
        ctx.fillStyle = '#1e161b';
        ctx.beginPath(); ctx.moveTo(36, GROUND); ctx.lineTo(36, GROUND - 50); ctx.arc(58, GROUND - 50, 22, Math.PI, 0); ctx.lineTo(80, GROUND); ctx.fill();
      } else if (def.look === 'fort') {
        // bastion à murs en talus, tour de guet
        ctx.fillStyle = '#c2ad86';
        ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(0, GROUND - 100); ctx.lineTo(100, GROUND - 100); ctx.lineTo(118, GROUND); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d8c7a2'; ctx.fillRect(0, GROUND - 104, 104, 7);
        ctx.fillStyle = '#b39d76'; ctx.fillRect(6, GROUND - h, 44, h - 100);
        for (let i = 0; i < 3; i++) ctx.fillRect(6 + i * 17, GROUND - h - 10, 10, 10);
        ctx.fillStyle = TEAM[side]; ctx.fillRect(20, GROUND - h + 12, 16, 26);
        ctx.fillStyle = '#2f261d';
        ctx.beginPath(); ctx.ellipse(84, GROUND - 72, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(38, GROUND); ctx.lineTo(38, GROUND - 34); ctx.arc(56, GROUND - 34, 18, Math.PI, 0); ctx.lineTo(74, GROUND); ctx.fill();
        ctx.strokeStyle = '#a8946d'; ctx.lineWidth = 1.5;
        for (let y = GROUND - 80; y < GROUND; y += 22) { ctx.beginPath(); ctx.moveTo(2, y); ctx.lineTo(100 + (y - GROUND + 100) * 0.18, y); ctx.stroke(); }
        this.flag(ctx, 28, GROUND - h - 10, side);
      } else if (def.look === 'bunker') {
        // bunker de béton, sacs de sable, antenne
        ctx.fillStyle = '#8d8f88';
        ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(0, GROUND - h); ctx.lineTo(78, GROUND - h); ctx.lineTo(112, GROUND - 56); ctx.lineTo(116, GROUND); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#74766f'; ctx.fillRect(0, GROUND - h, 78, 8);
        ctx.fillStyle = TEAM[side]; ctx.fillRect(0, GROUND - h + 16, 70, 6);
        ctx.fillStyle = '#1f201d'; ctx.fillRect(44, GROUND - 96, 40, 7);
        ctx.fillRect(16, GROUND - 52, 26, 52);
        ctx.fillStyle = '#b3a27a';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.ellipse(68 + i * 14, GROUND - 6, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
          if (i < 3) { ctx.beginPath(); ctx.ellipse(75 + i * 14, GROUND - 16, 8, 6, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.strokeStyle = '#3d3f3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, GROUND - h); ctx.lineTo(12, GROUND - h - 34); ctx.stroke();
        ctx.fillStyle = '#e0533f'; ctx.beginPath(); ctx.arc(12, GROUND - h - 35, 2.5, 0, Math.PI * 2); ctx.fill();
        this.flag(ctx, 50, GROUND - h, side);
      } else if (def.look === 'dome') {
        // base futuriste : socle lumineux, flèche centrale, bouclier en dôme
        ctx.fillStyle = '#3a3f55'; ctx.fillRect(0, GROUND - 60, 116, 60);
        ctx.fillStyle = '#4fd8ff'; ctx.fillRect(0, GROUND - 62, 116, 3);
        ctx.fillStyle = '#545b78'; ctx.fillRect(32, GROUND - 150, 46, 90);
        ctx.beginPath(); ctx.moveTo(40, GROUND - 150); ctx.lineTo(55, GROUND - h + 8); ctx.lineTo(70, GROUND - 150); ctx.fill();
        ctx.fillStyle = TEAM[side];
        for (let i = 0; i < 3; i++) ctx.fillRect(40, GROUND - 140 + i * 24, 30, 10);
        ctx.fillStyle = '#9fe8ff'; ctx.beginPath(); ctx.arc(55, GROUND - h + 6, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#151827'; ctx.fillRect(44, GROUND - 44, 24, 44);
        ctx.strokeStyle = '#4fd8ff'; ctx.lineWidth = 1.5; ctx.strokeRect(44, GROUND - 44, 24, 44);
        ctx.fillStyle = 'rgba(120,220,255,0.10)';
        ctx.strokeStyle = 'rgba(140,230,255,0.45)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(56, GROUND, 66, 160, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      } else if (def.look === 'volcano') {
        // volcan fumant, coulée de lave, os
        ctx.fillStyle = '#4a3a30';
        ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(0, GROUND - 120); ctx.lineTo(30, GROUND - h); ctx.lineTo(70, GROUND - h); ctx.lineTo(118, GROUND); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.ellipse(50, GROUND - h, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff8a3c'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(60, GROUND - h + 2); ctx.quadraticCurveTo(82, GROUND - 110, 96, GROUND - 40); ctx.stroke();
        ctx.fillStyle = 'rgba(90,80,75,0.5)';
        ctx.beginPath(); ctx.arc(46, GROUND - h - 18, 12, 0, Math.PI * 2); ctx.arc(58, GROUND - h - 34, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = TEAM[side]; ctx.fillRect(12, GROUND - 100, 14, 24);
        ctx.fillStyle = '#1e1612';
        ctx.beginPath(); ctx.moveTo(40, GROUND); ctx.lineTo(40, GROUND - 30); ctx.arc(58, GROUND - 30, 18, Math.PI, 0); ctx.lineTo(76, GROUND); ctx.fill();
        ctx.strokeStyle = '#efe6cc'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(20, GROUND - 8 - i * 7, 8, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
        this.flag(ctx, 34, GROUND - h, side);
      } else if (def.look === 'scrapyard') {
        // baraque de tôle, échafaudage, pneus
        ctx.fillStyle = '#7a6a5a'; ctx.fillRect(0, GROUND - 100, 104, 100);
        ctx.strokeStyle = '#66574a'; ctx.lineWidth = 1.5;
        for (let x = 4; x < 104; x += 7) { ctx.beginPath(); ctx.moveTo(x, GROUND - 98); ctx.lineTo(x, GROUND); ctx.stroke(); }
        ctx.fillStyle = '#a0522d'; ctx.fillRect(8, GROUND - 70, 18, 12); ctx.fillRect(70, GROUND - 92, 14, 10);
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath(); ctx.moveTo(-4, GROUND - 98); ctx.lineTo(110, GROUND - 112); ctx.lineTo(110, GROUND - 104); ctx.lineTo(-4, GROUND - 92); ctx.fill();
        ctx.strokeStyle = '#4a4038'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(12, GROUND - 100); ctx.lineTo(12, GROUND - h); ctx.moveTo(42, GROUND - 104); ctx.lineTo(42, GROUND - h);
        ctx.moveTo(12, GROUND - 104); ctx.lineTo(42, GROUND - h + 6); ctx.moveTo(42, GROUND - 104); ctx.lineTo(12, GROUND - h + 6);
        ctx.stroke();
        ctx.fillStyle = '#6a5a48'; ctx.fillRect(6, GROUND - h - 4, 42, 7);
        ctx.fillStyle = TEAM[side]; ctx.fillRect(56, GROUND - 80, 34, 8);
        ctx.fillStyle = '#1f1a16'; ctx.fillRect(34, GROUND - 44, 22, 44);
        ctx.fillStyle = '#2a2622';
        [[88, 10], [106, 10], [97, 25]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, GROUND - y, 9, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = '#4a4440';
        [[88, 10], [106, 10], [97, 25]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, GROUND - y, 3, 0, Math.PI * 2); ctx.fill(); });
        this.flag(ctx, 28, GROUND - h - 4, side);
      } else if (def.look === 'herotower') {
        // quartier général des héros : tour vitrée, emblème
        ctx.fillStyle = '#9aa3b2'; ctx.fillRect(0, GROUND - 40, 114, 40);
        ctx.fillStyle = '#d8dde6'; ctx.fillRect(16, GROUND - h, 66, h - 40);
        ctx.fillStyle = '#7fb6e8';
        for (let y = GROUND - h + 56; y < GROUND - 50; y += 18) { ctx.fillRect(22, y, 22, 10); ctx.fillRect(54, y, 22, 10); }
        ctx.fillStyle = TEAM[side]; ctx.beginPath(); ctx.arc(49, GROUND - h + 28, 15, 0, Math.PI * 2); ctx.fill();
        this.star(ctx, 49, GROUND - h + 28, 9, '#ffffff');
        ctx.strokeStyle = '#5a6070'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(49, GROUND - h); ctx.lineTo(49, GROUND - h - 26); ctx.stroke();
        ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(49, GROUND - h - 27, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a3a54'; ctx.fillRect(38, GROUND - 40, 22, 40);
      } else if (def.look === 'hive') {
        // ruche extra-terrestre : dômes organiques, pores lumineux
        ctx.fillStyle = '#4a2a5e';
        ctx.beginPath(); ctx.ellipse(56, GROUND, 60, 125, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(44, GROUND - 118); ctx.lineTo(56, GROUND - h); ctx.lineTo(68, GROUND - 118); ctx.fill();
        ctx.fillStyle = '#5e3a74';
        ctx.beginPath(); ctx.ellipse(24, GROUND, 30, 72, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(90, GROUND, 28, 58, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#8dff7a';
        [[30, 50], [52, 90], [74, 64], [18, 28], [92, 34], [62, 120]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, GROUND - y, 3.5, 0, Math.PI * 2); ctx.fill(); });
        ctx.fillStyle = TEAM[side]; ctx.beginPath(); ctx.arc(56, GROUND - h + 4, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#140a1c'; ctx.beginPath(); ctx.ellipse(56, GROUND, 16, 28, 0, Math.PI, 0); ctx.fill();
      } else if (def.look === 'temple') {
        // temple à colonnes : marches, cella sombre, fronton, frise aux couleurs de l'équipe
        ctx.fillStyle = '#d6cbae';
        ctx.fillRect(-6, GROUND - 9, 126, 9); ctx.fillRect(0, GROUND - 17, 114, 8);
        ctx.fillStyle = '#b3a684'; ctx.fillRect(6, GROUND - 120, 102, 103);
        ctx.fillStyle = '#2e241c'; ctx.fillRect(45, GROUND - 66, 24, 49);
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(45, GROUND - 68, 24, 3);
        for (const x of [4, 26, 76, 98]) {
          ctx.fillStyle = '#efe7cf'; ctx.fillRect(x, GROUND - 120, 12, 103);
          ctx.fillStyle = '#d2c7a8'; ctx.fillRect(x + 8, GROUND - 120, 3, 103);
          ctx.fillStyle = '#efe7cf'; ctx.fillRect(x - 2, GROUND - 124, 16, 5);
        }
        ctx.fillStyle = '#e4dabe'; ctx.fillRect(-2, GROUND - 136, 118, 13);
        ctx.fillStyle = TEAM[side]; ctx.fillRect(-2, GROUND - 132, 118, 4);
        ctx.fillStyle = '#efe7cf';
        ctx.beginPath(); ctx.moveTo(-6, GROUND - 136); ctx.lineTo(57, GROUND - h); ctx.lineTo(120, GROUND - 136); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#d2c7a8';
        ctx.beginPath(); ctx.moveTo(12, GROUND - 139); ctx.lineTo(57, GROUND - h + 7); ctx.lineTo(102, GROUND - 139); ctx.closePath(); ctx.fill();
        ctx.fillStyle = TEAM[side]; ctx.beginPath(); ctx.arc(57, GROUND - 145, 4, 0, Math.PI * 2); ctx.fill();
        // braseros de part et d'autre de la porte
        const fl = Math.sin(performance.now() / 120) * 1.5;
        ctx.fillStyle = '#6a5040'; ctx.fillRect(38, GROUND - 30, 4, 13); ctx.fillRect(72, GROUND - 30, 4, 13);
        ctx.fillStyle = 'rgba(255,150,50,0.9)';
        ctx.beginPath(); ctx.ellipse(40, GROUND - 34, 3.5, 5 + fl, 0, 0, Math.PI * 2); ctx.ellipse(74, GROUND - 34, 3.5, 5 - fl, 0, 0, Math.PI * 2); ctx.fill();
        this.flag(ctx, 57, GROUND - h, side);
      } else if (def.look === 'factory') {
        // usine de briques : toit en dents de scie, deux cheminées fumantes, roue dentée
        const tt = performance.now() / 1000;
        ctx.fillStyle = '#8a4a36'; ctx.fillRect(0, GROUND - 96, 112, 96);
        ctx.strokeStyle = '#74392a'; ctx.lineWidth = 1;
        for (let y = GROUND - 88; y < GROUND; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(112, y); ctx.stroke(); }
        ctx.fillStyle = '#5a4a40';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 28, GROUND - 96); ctx.lineTo(i * 28, GROUND - 114); ctx.lineTo(i * 28 + 28, GROUND - 96); ctx.fill(); }
        ctx.fillStyle = '#9fc4d8';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 28 + 2, GROUND - 98); ctx.lineTo(i * 28 + 2, GROUND - 109); ctx.lineTo(i * 28 + 13, GROUND - 98); ctx.fill(); }
        ctx.fillStyle = '#6e3a2c'; ctx.fillRect(14, GROUND - h, 14, h - 110); ctx.fillRect(70, GROUND - h + 28, 12, h - 136);
        ctx.fillStyle = '#3a2a24'; ctx.fillRect(12, GROUND - h - 4, 18, 6); ctx.fillRect(68, GROUND - h + 24, 16, 6);
        for (const [cx, cy] of [[21, GROUND - h - 6], [76, GROUND - h + 22]]) {
          for (let k = 0; k < 4; k++) {
            const ph = (tt * 0.45 + k / 4 + cx * 0.01) % 1;
            ctx.fillStyle = `rgba(92,86,82,${0.5 * (1 - ph)})`;
            ctx.beginPath(); ctx.arc(cx - ph * 16, cy - ph * 46, 5 + ph * 11, 0, Math.PI * 2); ctx.fill();
          }
        }
        ctx.fillStyle = TEAM[side]; ctx.fillRect(0, GROUND - 100, 112, 5);
        ctx.fillStyle = `rgba(255,${190 + Math.round(Math.sin(tt * 3) * 25)},110,0.9)`;
        for (let i = 0; i < 3; i++) ctx.fillRect(8 + i * 34, GROUND - 78, 18, 14);
        ctx.fillStyle = '#5a3a2c'; for (let i = 0; i < 3; i++) ctx.fillRect(16 + i * 34, GROUND - 78, 2, 14);
        ctx.fillStyle = '#2a1e18'; ctx.fillRect(38, GROUND - 42, 30, 42);
        ctx.strokeStyle = '#4a3a30'; ctx.lineWidth = 1.5;
        for (let x = 41; x < 68; x += 6) { ctx.beginPath(); ctx.moveTo(x, GROUND - 40); ctx.lineTo(x, GROUND); ctx.stroke(); }
        // roue dentée qui tourne
        ctx.save(); ctx.translate(92, GROUND - 32); ctx.rotate(tt * 0.8);
        ctx.fillStyle = '#b8893a';
        for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-2.5, -15, 5, 6); }
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        this.flag(ctx, 76, GROUND - h + 24, side);
      }
      ctx.restore();

      if (hpInfo) this.baseBar(ctx, side, GROUND - def.height - 66, hpInfo);
    },

    // Barre de vie d'une base : assez grande pour être lue sur un téléphone.
    baseBar(ctx, side, by, hpInfo) {
      const bw = 172, bh = 24, bx = side === 1 ? 8 : W - bw - 8;
      const box = () => { ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 9); };
      ctx.save();
      box(); ctx.fillStyle = '#0a1838'; ctx.fill();
      const k = hpInfo.infinite ? 1 : Math.max(0, Math.min(1, hpInfo.hp / hpInfo.maxHp));
      ctx.save();
      box(); ctx.clip();
      ctx.fillStyle = hpInfo.infinite ? '#c9a7ff' : k > 0.5 ? '#5fd14a' : k > 0.25 ? '#ffc93f' : '#ff5a4a';
      ctx.fillRect(side === 1 ? bx : bx + bw * (1 - k), by, bw * k, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(bx, by + 3, bw, 5);
      ctx.restore();
      box(); ctx.lineWidth = 3; ctx.strokeStyle = '#0a1838'; ctx.stroke();
      const label = hpInfo.infinite ? '∞' : `${PA.court(Math.ceil(hpInfo.hp))} / ${PA.court(Math.round(hpInfo.maxHp))}`;
      ctx.font = '17px "Lilita One", "Arial Rounded MT Bold", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.lineWidth = 4; ctx.strokeStyle = '#0a1838'; ctx.strokeText(label, bx + bw / 2, by + 18);
      ctx.fillStyle = '#fff'; ctx.fillText(label, bx + bw / 2, by + 18);
      ctx.restore();
    },

    // Vignette d'une unité ou d'une tourelle pour les boutons : le même dessin que sur le terrain,
    // recadré au plus juste. kind = 'unit' ou 'turret'. Renvoie une image (data URL), gardée en mémoire.
    portrait(kind, def) {
      const art = PA.Art && PA.Art.on ? PA.Art : null;
      const key = `${kind}:${def.id}:${art ? 1 : 0}`;
      this.portraits = this.portraits || {};
      if (this.portraits[key]) return this.portraits[key];
      const S = 320, c = document.createElement('canvas');
      c.width = c.height = S;
      const ctx = c.getContext('2d');
      const savedArt = this.art, savedElem = this.elemColor;
      this.art = art; this.elemColor = null;
      ctx.save();
      if (kind === 'unit') {
        const k = Math.min(2.6, (S * 0.56) / Math.max(def.w, def.h));
        ctx.translate(S / 2, S * 0.8); ctx.scale(k, k); ctx.translate(0, -GROUND);
        this.unit(ctx, { def, side: 1, kind: def.kind, cost: def.cost, w: def.w, h: def.h, x: 0, speed: def.speed, hp: 1, maxHp: 1,
          cd: 0, walk: 0.8, moving: false, attackAnim: 0, flash: 0, burn: null, chill: null, dead: false, isChampion: false, ageIdx: 0 });
      } else {
        ctx.translate(S / 2, S * 0.62); ctx.scale(5, 5);
        const turretArt = art && art.turrets[def.id];
        if (turretArt) turretArt(ctx, 0, TEAM[1], TEAM_DARK[1]);
        else this.turretShape(ctx, def.shape || def.proj, 0);
      }
      ctx.restore();
      this.art = savedArt; this.elemColor = savedElem;
      // recadrage sur les pixels dessinés
      const d = ctx.getImageData(0, 0, S, S).data;
      let x0 = S, y0 = S, x1 = 0, y1 = 0;
      for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) {
        if (d[(y * S + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0 || y1 <= y0) { x0 = y0 = 0; x1 = y1 = S; }
      const side = Math.max(x1 - x0, y1 - y0) + 12, O = 128;
      const out = document.createElement('canvas');
      out.width = out.height = O;
      out.getContext('2d').drawImage(c, (x0 + x1) / 2 - side / 2, (y0 + y1) / 2 - side / 2, side, side, 0, 0, O, O);
      return (this.portraits[key] = out.toDataURL());
    },

    // étoile à 5 branches
    star(ctx, x, y, r, color, rot) {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    },

    flag(ctx, x, y, side) {
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 40); ctx.stroke();
      ctx.fillStyle = TEAM[side];
      ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x + 28, y - 32); ctx.lineTo(x, y - 24); ctx.fill();
    },

    // ------------------------------------------------------------ tourelles
    turrets(ctx, b, side, list) {
      for (let i = 0; i < list.length; i++) {
        const pos = b.turretPos(side, i);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(side, 1);
        // Avec les nouveaux graphismes, c'est la base qui dessine les supports des tourelles.
        if (!this.art) { ctx.fillStyle = '#5b4332'; ctx.fillRect(-14, 6, 30, 5); }
        const t = list[i];
        if (!t) {
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
          ctx.strokeRect(-10, -12, 20, 18); ctx.setLineDash([]);
        } else {
          const def = C.ages[t.age].turrets[t.idx];
          const turretArt = this.art && this.art.turrets[def.id];
          const a = t.anim > 0 ? t.anim / 0.2 : 0;
          if (turretArt) turretArt(ctx, a, TEAM[side], TEAM_DARK[side]);
          else this.turretShape(ctx, def.shape || def.proj, a);
        }
        ctx.restore();
        if (t && t.anim > 0) t.anim -= 1 / 60;
      }
    },

    turretShape(ctx, look, a) {
      ctx.lineCap = 'round';
      switch (look) {
        case 'pebble':
          ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -4); ctx.lineTo(-6, -14); ctx.moveTo(0, -4); ctx.lineTo(6, -14); ctx.stroke();
          ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(-2 - a * 6, -10); ctx.lineTo(6, -14); ctx.stroke();
          break;
        case 'flint':
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-8, -8, 16, 14);
          ctx.fillStyle = '#4b3a2a'; ctx.fillRect(6, -6, 10 - a * 3, 4); ctx.fillRect(6, 0, 10 - a * 3, 4);
          break;
        case 'boulder':
        case 'fireball':
          ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-10, 0, 20, 6);
          ctx.save(); ctx.translate(-4, 0); ctx.rotate(-0.4 - (1 - a) * 0.6 + a * 1.2);
          ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
          ctx.fillStyle = look === 'fireball' ? '#ff8a32' : '#7d6a55';
          ctx.beginPath(); ctx.arc(0, -21, 4, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          break;
        case 'bolt':
          ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-10, -4, 26, 5);
          ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(10 - a * 2, -2, 10, -Math.PI / 2, Math.PI / 2); ctx.stroke();
          break;
        case 'oil':
          ctx.fillStyle = '#2c2c2c';
          ctx.beginPath(); ctx.arc(0, -4, 10, 0, Math.PI); ctx.fill();
          ctx.fillRect(-11, -6, 22, 3);
          ctx.fillStyle = '#ff9a3c'; ctx.fillRect(-6, 7, 12, 3);
          break;
        // ---- Renaissance
        case 'falconet':
          ctx.fillStyle = '#6b4a2c'; ctx.beginPath(); ctx.arc(-3, 2, 5, 0, Math.PI * 2); ctx.fill();
          ctx.save(); ctx.rotate(-0.15);
          ctx.fillStyle = '#4b4a48'; ctx.fillRect(-9 - a * 3, -6, 24, 7);
          ctx.fillStyle = '#2f2e2c'; ctx.fillRect(13 - a * 3, -7, 4, 9);
          ctx.restore();
          this.muzzle(ctx, 20, -8, a);
          break;
        case 'mortar':
          ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-10, -2, 20, 8);
          ctx.save(); ctx.translate(-2, -1); ctx.rotate(-0.95);
          ctx.fillStyle = '#3f3e3b'; ctx.fillRect(-2, -5, 18 - a * 3, 10);
          ctx.fillStyle = '#2b2a28'; ctx.fillRect(14 - a * 3, -6, 3, 12);
          ctx.restore();
          break;
        case 'volleygun':
          ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-10, -2, 18, 8);
          ctx.fillStyle = '#4b4a48';
          for (let i = 0; i < 4; i++) ctx.fillRect(-5 - a * 2, -13 + i * 3, 22, 2);
          this.muzzle(ctx, 19, -8, a);
          break;
        // ---- Moderne
        case 'mg':
          ctx.strokeStyle = '#2f3237'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(-8, 6); ctx.moveTo(0, -2); ctx.lineTo(7, 6); ctx.stroke();
          ctx.fillStyle = '#3b3f45'; ctx.fillRect(-9, -9, 15, 7); ctx.fillRect(5 - a * 2, -7, 15, 3);
          ctx.fillStyle = '#5d6a45'; ctx.fillRect(-7, -14, 8, 5);
          this.muzzle(ctx, 21, -5.5, a);
          break;
        case 'atgun':
          ctx.fillStyle = '#2f3237'; ctx.beginPath(); ctx.arc(0, 3, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5d6a45'; ctx.fillRect(-6, -15, 5, 19);
          ctx.fillStyle = '#3b3f45'; ctx.fillRect(-10 - a * 4, -8, 32, 4); ctx.fillRect(20 - a * 4, -9, 4, 6);
          this.muzzle(ctx, 25, -6, a);
          break;
        case 'rocketpod':
          ctx.fillStyle = '#4b4f3d'; ctx.fillRect(-8, -2, 16, 8);
          ctx.save(); ctx.translate(-2, -4); ctx.rotate(-0.5);
          ctx.fillStyle = '#5d6a45'; ctx.fillRect(-6, -7, 22, 12);
          ctx.fillStyle = '#1f201d';
          ctx.beginPath(); ctx.arc(16, -3, 2.5, 0, Math.PI * 2); ctx.arc(16, 2, 2.5, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          break;
        // ---- Futur
        case 'laserturret':
          ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.arc(0, 0, 9, Math.PI, 0); ctx.fill(); ctx.fillRect(-10, 0, 20, 6);
          ctx.fillStyle = '#9aa3b2'; ctx.fillRect(4, -7, 16, 3);
          ctx.fillStyle = a > 0 ? '#ffffff' : '#4fd8ff';
          ctx.beginPath(); ctx.arc(20, -5.5, 2.5 + a * 2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'ioncannon':
          ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-10, -11, 14, 17);
          ctx.fillStyle = '#9aa3b2'; ctx.fillRect(2 - a * 3, -7, 20, 6);
          ctx.fillStyle = '#8c8cff';
          for (let i = 0; i < 3; i++) ctx.fillRect(6 + i * 5 - a * 3, -9, 2, 10);
          if (a > 0) { ctx.fillStyle = `rgba(160,160,255,${a})`; ctx.beginPath(); ctx.arc(23, -4, 4 + a * 4, 0, Math.PI * 2); ctx.fill(); }
          break;
        case 'plasmalauncher':
          ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-10, -2, 20, 8);
          ctx.save(); ctx.translate(-2, -2); ctx.rotate(-0.6);
          ctx.fillStyle = '#d8dde6'; ctx.fillRect(-2, -5, 20, 10);
          ctx.fillStyle = '#7ef0c8'; ctx.beginPath(); ctx.arc(18, 0, 3.5 + a * 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          break;
        // ---- Jurassique
        case 'spikes':
          ctx.fillStyle = '#5f7a34'; ctx.beginPath(); ctx.arc(0, 5, 11, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#efe6cc';
          for (let i = 0; i < 3; i++) {
            const y = -9 + i * 5;
            ctx.beginPath(); ctx.moveTo(3, y); ctx.lineTo(18 - a * 4, y + 1.5); ctx.lineTo(3, y + 3); ctx.fill();
          }
          break;
        case 'ambercannon':
          ctx.save(); ctx.rotate(-0.1);
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-6 - a * 3, -8, 26, 7);
          ctx.fillStyle = '#efe6cc'; ctx.fillRect(16 - a * 3, -9, 3, 9);
          ctx.restore();
          ctx.fillStyle = '#f2a93b'; ctx.beginPath(); ctx.arc(-6, -2, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-8, -4, 2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'geyser':
          ctx.fillStyle = '#5a4a3a';
          ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(-3, -12); ctx.lineTo(3, -12); ctx.lineTo(12, 6); ctx.fill();
          ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.ellipse(0, -12, 4 + a * 3, 2 + a * 3, 0, 0, Math.PI * 2); ctx.fill();
          break;
        // ---- Post-apo
        case 'scrapgun':
          ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(0, 4, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7a6a5a'; ctx.fillRect(-9, -10, 15, 9);
          ctx.fillStyle = '#a0522d'; ctx.fillRect(-7, -9, 5, 3);
          ctx.fillStyle = '#4a4440'; ctx.fillRect(5 - a * 2, -8, 15, 3);
          this.muzzle(ctx, 21, -6.5, a);
          break;
        case 'harpoon':
          ctx.fillStyle = '#6a5a48'; ctx.fillRect(-10, -4, 14, 9);
          ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(18 - a * 5, -7); ctx.stroke();
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(22 - a * 5, -7); ctx.lineTo(16 - a * 5, -11); ctx.lineTo(16 - a * 5, -3); ctx.fill();
          break;
        case 'barrelcat':
          ctx.fillStyle = '#6a5a48'; ctx.fillRect(-10, 0, 20, 6);
          ctx.save(); ctx.translate(-4, 0); ctx.rotate(-0.4 - (1 - a) * 0.6 + a * 1.2);
          ctx.strokeStyle = '#4a4440'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.stroke();
          ctx.fillStyle = '#c0392b'; ctx.fillRect(-4, -26, 8, 9);
          ctx.restore();
          break;
        // ---- Super-héros
        case 'starthrower':
          ctx.fillStyle = '#2b4f9e'; ctx.beginPath(); ctx.arc(-2, -3, 10, 0, Math.PI * 2); ctx.fill();
          this.star(ctx, 10 - a * 3, -4, 7, '#f2c230', a * 2);
          break;
        case 'sonic':
          ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-10, -11, 10, 16);
          ctx.fillStyle = '#c8ccd8';
          ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(15, -12); ctx.lineTo(15, 4); ctx.lineTo(0, -1); ctx.fill();
          if (a > 0) {
            ctx.strokeStyle = `rgba(200,220,255,${a})`; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(14, -4, 8 + (1 - a) * 8, -0.8, 0.8); ctx.stroke();
          }
          break;
        case 'tesla':
          ctx.fillStyle = '#5a5048'; ctx.fillRect(-7, 0, 14, 6);
          ctx.fillStyle = '#c97a3a';
          for (let i = 0; i < 4; i++) ctx.fillRect(-4, -2 - i * 4, 8, 3);
          ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.arc(0, -19, 5 + a * 2, 0, Math.PI * 2); ctx.fill();
          break;
        // ---- Extra-terrestre
        case 'rayturret':
          ctx.fillStyle = '#5a4a6a'; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.fill(); ctx.fillRect(-11, 0, 22, 6);
          ctx.fillStyle = '#3a2f48'; ctx.fillRect(4, -8, 14, 4);
          ctx.fillStyle = a > 0 ? '#ffffff' : '#8dff7a'; ctx.beginPath(); ctx.arc(19, -6, 3 + a * 2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'antimatter':
          ctx.fillStyle = '#2a1f3a'; ctx.fillRect(-10, -11, 12, 17); ctx.fillRect(0 - a * 3, -8, 22, 7);
          ctx.fillStyle = '#c08dff';
          for (let i = 0; i < 3; i++) ctx.fillRect(5 + i * 5 - a * 3, -10, 2, 11);
          break;
        case 'sporepod':
          ctx.fillStyle = '#4a2a5e'; ctx.fillRect(-9, 0, 18, 6);
          ctx.save(); ctx.translate(-1, -2); ctx.rotate(-0.6);
          ctx.fillStyle = '#6a3a7a'; ctx.beginPath(); ctx.ellipse(6, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#9cff5a'; ctx.beginPath(); ctx.arc(17, 0, 3 + a * 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          break;
        // ---- Antiquité
        case 'scorpion':
          // trépied de bois, bras de torsion en V qui se referment au tir
          ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-1, -5); ctx.moveTo(6, 6); ctx.lineTo(-1, -5); ctx.moveTo(-1, 6); ctx.lineTo(-1, -5); ctx.stroke();
          ctx.fillStyle = '#7a5634'; ctx.fillRect(-10, -8, 26, 4);
          ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(-1 + a * 4, -16); ctx.moveTo(6, -6); ctx.lineTo(-1 + a * 4, 4); ctx.stroke();
          ctx.strokeStyle = '#e8e2d0'; ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(-1 + a * 4, -16); ctx.lineTo(-9 + a * 10, -6); ctx.lineTo(-1 + a * 4, 4); ctx.stroke();
          ctx.fillStyle = '#c08a3a'; ctx.fillRect(3, -9, 6, 6);
          if (a < 0.5) { ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(18, -6); ctx.stroke(); }
          break;
        case 'mirror':
          // grand miroir de bronze sur un socle de marbre ; il flamboie au tir
          ctx.fillStyle = '#ddd2b6'; ctx.fillRect(-5, -4, 10, 10);
          ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -12); ctx.stroke();
          ctx.save(); ctx.translate(2, -19); ctx.rotate(0.35);
          ctx.fillStyle = '#a8742a'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 12, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = a > 0 ? '#fffbe0' : '#f2d27a'; ctx.beginPath(); ctx.ellipse(1.2, 0, 2.2, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          if (a > 0) { ctx.fillStyle = `rgba(255,240,160,${a * 0.6})`; ctx.beginPath(); ctx.arc(5, -19, 8 + a * 9, 0, Math.PI * 2); ctx.fill(); }
          break;
        case 'onager':
          // onagre : écheveau de torsion, bras couché qui se redresse contre le butoir
          ctx.fillStyle = '#7a5634'; ctx.fillRect(-12, 0, 24, 6);
          ctx.fillStyle = '#5a3d24'; ctx.fillRect(6, -15, 4, 15);
          ctx.fillStyle = '#3a2a1a'; ctx.fillRect(4, -17, 8, 3);
          ctx.fillStyle = '#c08a3a'; ctx.beginPath(); ctx.arc(-6, 2, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.save(); ctx.translate(-6, 2); ctx.rotate(-1.2 + a * 1.5);
          ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.stroke();
          if (a < 0.3) { ctx.fillStyle = '#b8683a'; ctx.beginPath(); ctx.ellipse(0, -21, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill(); }
          ctx.restore();
          break;
        // ---- Vapeur
        case 'gatling': {
          // mitrailleuse à manivelle : les canons tournent pendant le tir
          const spin = a > 0 ? performance.now() / 35 : 0;
          ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(-4, 3, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.arc(-4, 3, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#b8893a'; ctx.fillRect(-11, -10, 13, 8);
          ctx.fillStyle = '#4a4440';
          for (let i = 0; i < 3; i++) { const o = Math.sin(spin + i * 2.1) * 2.4; ctx.fillRect(1, -6.8 + o, 18, 1.8); }
          ctx.fillStyle = '#2f2e2c'; ctx.fillRect(17, -9.5, 3, 7); ctx.fillRect(3, -9.5, 2, 7);
          ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(-15 + Math.cos(spin) * 3, -6 + Math.sin(spin) * 3); ctx.stroke();
          this.muzzle(ctx, 22, -5.5, a);
          break;
        }
        case 'steamcannon':
          ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-12, -2, 16, 8);
          ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(-8, -6, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e8e2da'; ctx.beginPath(); ctx.arc(-8, -6, 2.6, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-6.5 + a, -7.5); ctx.stroke();
          ctx.save(); ctx.rotate(-0.12);
          ctx.fillStyle = '#b8893a'; ctx.fillRect(-3 - a * 4, -9, 26, 7);
          ctx.fillStyle = '#8a6430'; ctx.fillRect(20 - a * 4, -10, 4, 9); ctx.fillRect(5 - a * 4, -10, 2, 9);
          ctx.restore();
          if (a > 0) { ctx.fillStyle = `rgba(240,240,240,${a * 0.7})`; ctx.beginPath(); ctx.arc(-6, -16 - (1 - a) * 6, 4 + (1 - a) * 6, 0, Math.PI * 2); ctx.fill(); }
          this.muzzle(ctx, 27, -9, a);
          break;
        case 'boilermortar':
          ctx.fillStyle = '#6a4a34'; ctx.beginPath(); ctx.ellipse(0, 1, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c9a24a'; ctx.fillRect(-11, 0, 22, 2);
          ctx.save(); ctx.translate(-1, -3); ctx.rotate(-1.0);
          ctx.fillStyle = '#3f3a34'; ctx.fillRect(-2, -6, 16 - a * 3, 12);
          ctx.fillStyle = '#b8893a'; ctx.fillRect(12 - a * 3, -7, 3, 14);
          ctx.restore();
          ctx.fillStyle = 'rgba(240,240,240,0.45)'; ctx.beginPath(); ctx.arc(-9, -8 - a * 6, 3 + a * 4, 0, Math.PI * 2); ctx.fill();
          break;
      }
    },

    // flamme de bouche pendant le tir (a = 1 au moment du tir)
    muzzle(ctx, x, y, a) {
      if (a < 0.5) return;
      ctx.fillStyle = `rgba(255,214,110,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + a * 3, 0, Math.PI * 2); ctx.fill();
    },

    // ------------------------------------------------------------ unités
    unit(ctx, u) {
      const team = u.flash > 0 ? '#ffffff' : TEAM[u.side];
      const dark = TEAM_DARK[u.side];
      const body = u.def.look.body;
      const unitArt = this.art && this.art.units[u.def.id];
      const baseH = unitArt ? unitArt.h : { mammoth: 58, horse: 64, tank: 44, mech: 76, raptor: 40, trike: 56, trex: 80, warrig: 50, alien: 48, tripod: 84,
        ankylo: 40, siege: 46, drone: 50, chariot: 56, elephant: 70, automaton: 76, spider: 44 }[body] || 46;
      const s = u.h / baseH;
      if (u.cache) return;                     // champion sous terre (js/champions.js) : on ne voit que la galerie
      const alt = u.alt || 0;                  // unité en l'air : volant, saut, parachute
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(u.x, GROUND + 1, u.w * 0.55 * (alt ? 0.7 : 1), alt ? 3 : 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.translate(u.x, GROUND - alt);
      if (u.renverse > 0) ctx.rotate(-u.side * 0.5 * Math.min(1, u.renverse));   // renversé par une charge
      if (u.ecrase > 0) ctx.scale(1, 1 - 0.4 * u.ecrase);                       // écrasé par le Monstre-camion
      // Élément de la run : un anneau coloré aux pieds de tes unités.
      if (u.side === 1 && this.elemColor) {
        ctx.strokeStyle = this.elemColor; ctx.lineWidth = 2; ctx.globalAlpha = 0.75;
        ctx.beginPath(); ctx.ellipse(0, 1, u.w * 0.6, 5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // Unité enragée (ruée d'ouverture) : anneau rouge aux pieds et traînées de vitesse derrière elle.
      if (u.rush) {
        ctx.strokeStyle = '#ff3b2a'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.ellipse(0, 1, u.w * 0.62, 5.5, 0, 0, Math.PI * 2); ctx.stroke();
        if (u.moving) {
          ctx.lineWidth = 2; ctx.globalAlpha = 0.55; ctx.lineCap = 'round';
          const bx = -u.side * (u.w * 0.5 + 4);
          for (const k of [0.25, 0.5, 0.75]) {
            ctx.beginPath(); ctx.moveTo(bx, -u.h * k); ctx.lineTo(bx - u.side * (10 + 8 * k), -u.h * k); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
      ctx.scale(u.side * s, s);
      const atk = u.attackAnim > 0 ? Math.sin((1 - u.attackAnim / 0.25) * Math.PI) : 0;
      if (unitArt) unitArt.draw(ctx, u, team, dark, atk, this);
      else if (body === 'mammoth') this.mammoth(ctx, u, team, dark, atk);
      else if (body === 'horse') this.horse(ctx, u, team, dark, atk);
      else if (body === 'tank') this.tank(ctx, u, team, dark, atk);
      else if (body === 'mech') this.mech(ctx, u, team, dark, atk);
      else if (body === 'raptor') this.raptor(ctx, u, team, dark, atk);
      else if (body === 'trike') this.trike(ctx, u, team, dark, atk);
      else if (body === 'trex') this.trex(ctx, u, team, dark, atk);
      else if (body === 'warrig') this.warrig(ctx, u, team, dark, atk);
      else if (body === 'alien') this.alien(ctx, u, team, dark, atk);
      else if (body === 'tripod') this.tripod(ctx, u, team, dark, atk);
      else if (body === 'ankylo') this.ankylo(ctx, u, team, dark, atk);
      else if (body === 'siege') this.siege(ctx, u, team, dark, atk);
      else if (body === 'drone') this.drone(ctx, u, team, dark, atk);
      else if (body === 'chariot') this.chariot(ctx, u, team, dark, atk);
      else if (body === 'elephant') this.elephant(ctx, u, team, dark, atk);
      else if (body === 'automaton') this.automaton(ctx, u, team, dark, atk);
      else if (body === 'spider') this.spider(ctx, u, team, dark, atk);
      else this.human(ctx, u, team, dark, atk);
      // Unité d'élite : une petite étoile dorée au-dessus de la tête.
      if (u.def.elite) {
        const lk = u.def.look;
        const top = unitArt && unitArt.top ? unitArt.top : lk.bighead ? 62 : lk.hat === 'bearskin' ? 66 : lk.hat === 'horns' ? 61 : baseH + 3;
        this.star(ctx, 0, -top, 3.5, '#f2c230', 0);
      }
      const hw = u.w / s / 2;   // demi-largeur dans le repère du dessin
      // Glace : une gangue bleutée et des cristaux aux pieds.
      if (u.chill && !(PA.Fx && PA.Fx.glace(ctx, hw, baseH))) {
        ctx.fillStyle = 'rgba(170,230,255,0.28)';
        ctx.beginPath(); ctx.ellipse(0, -baseH * 0.5, hw * 1.15, baseH * 0.56, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(220,245,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#e4f7ff';
        for (const k of [-0.7, -0.1, 0.55]) {
          const x = hw * k;
          ctx.beginPath(); ctx.moveTo(x - 3, 0); ctx.lineTo(x, -9); ctx.lineTo(x + 3, 0); ctx.fill();
        }
      }
      // Brûlure : des flammes qui dansent.
      if (u.burn && !(PA.Fx && PA.Fx.flammes(ctx, hw, baseH, performance.now() / 1000 + u.x * 0.01))) {
        for (let i = 0; i < 3; i++) {
          const x = hw * (-0.55 + i * 0.55), y = -baseH * (0.42 + 0.14 * (i % 2));
          const fh = 15 + Math.random() * 9;
          ctx.fillStyle = 'rgba(255,90,20,0.85)';
          ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x - 5, y - fh * 0.6, x, y - fh); ctx.quadraticCurveTo(x + 5, y - fh * 0.6, x + 6, y); ctx.fill();
          ctx.fillStyle = 'rgba(255,225,110,0.95)';
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.quadraticCurveTo(x - 2, y - fh * 0.35, x, y - fh * 0.6); ctx.quadraticCurveTo(x + 2, y - fh * 0.35, x + 3, y); ctx.fill();
        }
      }
      ctx.restore();
    },

    human(ctx, u, team, dark, atk) {
      const look = u.def.look;
      const swing = u.moving ? Math.sin(u.walk) * 5 : 0;
      ctx.lineCap = 'round';
      if (look.cape) {
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(-13 - swing * 0.4, -10); ctx.lineTo(-2, -13); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#3a2c22'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-3 + swing, 0); ctx.moveTo(0, -18); ctx.lineTo(3 - swing, 0); ctx.stroke();
      if (look.weapon === 'flamer') {
        // réservoir dorsal du lance-flammes
        ctx.fillStyle = '#7a6a4a'; ctx.fillRect(-12, -34, 7, 15);
        ctx.fillStyle = '#c0392b'; ctx.fillRect(-12, -30, 7, 2);
      }
      ctx.fillStyle = team;
      ctx.fillRect(-6, -34, 12, 17);
      ctx.fillStyle = dark; ctx.fillRect(-6, -20, 12, 3);
      ctx.fillStyle = SKIN;
      ctx.beginPath(); ctx.arc(0, -40, 6, 0, Math.PI * 2); ctx.fill();
      if (look.helmet) {
        ctx.fillStyle = '#8d9096';
        ctx.beginPath(); ctx.arc(0, -41, 6.5, Math.PI, 0); ctx.fill();
        ctx.fillRect(1, -42, 2, 7);
      } else if (look.hat === 'feather') {
        ctx.fillStyle = '#3a2a22';
        ctx.fillRect(-8, -46, 16, 2.5);
        ctx.beginPath(); ctx.arc(0, -46, 5, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#f4efe2'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-2, -49); ctx.quadraticCurveTo(-8, -56, -13, -51); ctx.stroke();
      } else if (look.hat === 'modern') {
        ctx.fillStyle = '#5d6a45';
        ctx.beginPath(); ctx.arc(0, -41, 7, Math.PI, 0); ctx.fill();
        ctx.fillRect(-8.5, -42, 17, 2.5);
      } else if (look.hat === 'visor') {
        ctx.fillStyle = '#e4e8ef';
        ctx.beginPath(); ctx.arc(0, -40, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4fd8ff'; ctx.fillRect(0, -43, 7, 4);
        ctx.fillStyle = '#9aa3b2'; ctx.fillRect(-7, -29, 6, 4); ctx.fillRect(1, -29, 6, 4);
      } else if (look.hat === 'mohawk') {
        ctx.fillStyle = '#d6452a';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(-5 + i * 2.6, -45); ctx.lineTo(-4 + i * 2.6, -52); ctx.lineTo(-2.5 + i * 2.6, -45); ctx.fill();
        }
      } else if (look.hat === 'horns') {
        // coiffe de fourrure à cornes (chaman)
        ctx.fillStyle = '#6a4426';
        ctx.beginPath(); ctx.arc(0, -42, 6.8, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = '#efe6cc'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-4, -46); ctx.quadraticCurveTo(-10, -50, -8, -56);
        ctx.moveTo(4, -46); ctx.quadraticCurveTo(10, -50, 8, -56);
        ctx.stroke();
      } else if (look.hat === 'bearskin') {
        // haut bonnet de fourrure (grenadier)
        ctx.fillStyle = '#1e1a18';
        ctx.beginPath(); ctx.ellipse(0, -51, 7, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(-6.5, -44, 13, 2);
      } else if (look.hat === 'goggles') {
        // cheveux en bataille et lunettes de soudeur (artificier)
        ctx.fillStyle = '#6a5040';
        ctx.beginPath(); ctx.arc(-1, -42, 6.5, Math.PI * 1.0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a3a36'; ctx.fillRect(-6, -43, 13, 2.5);
        ctx.fillStyle = '#e0a040';
        ctx.beginPath(); ctx.arc(2, -42, 2.4, 0, Math.PI * 2); ctx.arc(6.5, -42, 2.4, 0, Math.PI * 2); ctx.fill();
      } else if (look.hat === 'crested') {
        // casque de bronze à cimier de crin (hoplite)
        ctx.fillStyle = '#c08a3a';
        ctx.beginPath(); ctx.arc(0, -41, 6.8, Math.PI, 0); ctx.fill();
        ctx.fillRect(-6.8, -41, 3, 6); ctx.fillRect(2.5, -41, 1.8, 5);
        ctx.fillStyle = '#b0302a';
        ctx.beginPath(); ctx.moveTo(-9, -43); ctx.quadraticCurveTo(-3, -57, 6, -47); ctx.lineTo(3, -46); ctx.quadraticCurveTo(-2, -51, -6, -43); ctx.fill();
      } else if (look.hat === 'band') {
        // cheveux noués d'un bandeau (archer)
        ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.arc(-1, -42, 6, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
        ctx.fillRect(-8, -42, 3, 5);
        ctx.fillStyle = '#e8e2d0'; ctx.fillRect(-6, -43.5, 12, 2);
      } else if (look.hat === 'flatcap') {
        // casquette d'ouvrier (mécano)
        ctx.fillStyle = '#5a4a3c';
        ctx.beginPath(); ctx.ellipse(-0.5, -44.5, 7, 4, 0, Math.PI, 0); ctx.fill();
        ctx.fillRect(-7, -45, 14, 2.5); ctx.fillRect(4, -44, 6.5, 1.8);
      } else if (look.hat === 'tophat') {
        // haut-de-forme (fusilier à vapeur)
        ctx.fillStyle = '#26201c';
        ctx.fillRect(-8, -46, 16, 2.5); ctx.fillRect(-5, -58, 10, 12);
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(-5, -49, 10, 2);
      } else {
        ctx.fillStyle = '#4a3020';
        ctx.beginPath(); ctx.arc(-1, -42, 6, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      }
      if (look.hat === 'gasmask') {
        ctx.fillStyle = '#3a3a36'; ctx.beginPath(); ctx.arc(3, -38, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6a6a62'; ctx.beginPath(); ctx.arc(6.5, -37, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9fd0d8'; ctx.fillRect(1, -43, 5, 2.5);
      } else if (look.hat === 'mask') {
        ctx.fillStyle = '#1a1a24'; ctx.fillRect(-2, -43, 9, 3);
      }
      if (look.crown) this.crown(ctx, 0, -48);
      this.weapon(ctx, look.weapon, atk, -28);
    },

    weapon(ctx, weapon, atk, handY) {
      ctx.lineCap = 'round';
      ctx.save();
      ctx.translate(5, handY);
      switch (weapon) {
        case 'club':
          ctx.rotate(0.3 + atk * 1.5);
          ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -15); ctx.stroke();
          ctx.fillStyle = '#6a4426'; ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'sword':
          ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(-11, -2, 6, 0, Math.PI * 2); ctx.fill();
          ctx.rotate(0.4 + atk * 1.4);
          ctx.strokeStyle = '#c9ccd2'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -19); ctx.stroke();
          ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.stroke();
          break;
        case 'sling':
          ctx.rotate(-0.6 - atk * 1.8);
          ctx.strokeStyle = SKIN; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
          ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(4, -15); ctx.stroke();
          ctx.fillStyle = '#7d7d7d'; ctx.beginPath(); ctx.arc(4, -15, 2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'crossbow':
          ctx.translate(-atk * 2, 0);
          ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-2, -2, 16, 4);
          ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.arc(12, 0, 6, -Math.PI / 2, Math.PI / 2); ctx.stroke();
          break;
        case 'spear':
        case 'lance':
          ctx.translate(atk * 8, 0);
          ctx.strokeStyle = weapon === 'lance' ? '#d6d2c8' : '#8a6440'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(weapon === 'lance' ? 34 : 24, -4); ctx.stroke();
          ctx.fillStyle = '#c9ccd2';
          ctx.beginPath(); ctx.moveTo(weapon === 'lance' ? 34 : 24, -7); ctx.lineTo(weapon === 'lance' ? 40 : 29, -4); ctx.lineTo(weapon === 'lance' ? 34 : 24, -1); ctx.fill();
          break;
        case 'rapier':
          ctx.translate(atk * 7, 0);
          ctx.rotate(-0.25 + atk * 0.25);
          ctx.strokeStyle = '#dfe3ea'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(23, 0); ctx.stroke();
          ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(1, 0, 3, 0, Math.PI * 2); ctx.fill();
          break;
        case 'saber':
          ctx.rotate(0.3 + atk * 1.5);
          ctx.strokeStyle = '#d6d9de'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(5, -10, 1, -21); ctx.stroke();
          ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(3, -1); ctx.stroke();
          break;
        case 'musket':
        case 'rifle':
          ctx.translate(-atk * 3, 0);
          ctx.fillStyle = weapon === 'rifle' ? '#4a3d2c' : '#6b4a2c'; ctx.fillRect(-6, -1, 12, 4);
          ctx.fillStyle = weapon === 'rifle' ? '#3b3f45' : '#55524c'; ctx.fillRect(4, -1, weapon === 'rifle' ? 20 : 23, 2.5);
          if (weapon === 'rifle') ctx.fillRect(8, -4, 7, 2);
          this.muzzle(ctx, weapon === 'rifle' ? 26 : 29, 0, atk);
          break;
        case 'bayonet':
          ctx.translate(atk * 8, 0);
          ctx.fillStyle = '#4a3d2c'; ctx.fillRect(-6, -1, 12, 4);
          ctx.fillStyle = '#3b3f45'; ctx.fillRect(4, -1, 18, 2.5);
          ctx.strokeStyle = '#dfe3ea'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(30, 0); ctx.stroke();
          break;
        case 'energyblade':
          ctx.rotate(0.4 + atk * 1.4);
          ctx.strokeStyle = 'rgba(120,230,255,0.35)'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -23); ctx.stroke();
          ctx.strokeStyle = '#d4f8ff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, -23); ctx.stroke();
          ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-1.5, -3, 3, 6);
          break;
        case 'laserrifle':
          ctx.translate(-atk * 2, 0);
          ctx.fillStyle = '#d8dde6'; ctx.fillRect(-5, -2, 24, 5);
          ctx.fillStyle = '#3a3f4a'; ctx.fillRect(-5, 2, 6, 3); ctx.fillRect(16, -1, 6, 3);
          ctx.fillStyle = '#4fd8ff'; ctx.fillRect(4, -1, 8, 2);
          break;
        case 'chainsaw':
          ctx.translate(atk * 6, 0);
          ctx.fillStyle = '#d6452a'; ctx.fillRect(-4, -3, 9, 7);
          ctx.fillStyle = '#9aa0a8'; ctx.fillRect(5, -2, 17, 4);
          ctx.fillStyle = '#3a3a36';
          for (let x = 6; x < 22; x += 3) ctx.fillRect(x, -3, 1.5, 1);
          break;
        case 'shotgun':
          ctx.translate(-atk * 3, 0);
          ctx.fillStyle = '#5a4030'; ctx.fillRect(-6, -1, 10, 4);
          ctx.fillStyle = '#55524c'; ctx.fillRect(3, -2, 16, 4);
          this.muzzle(ctx, 21, 0, atk);
          break;
        case 'fist':
          ctx.translate(atk * 9, 0);
          ctx.strokeStyle = SKIN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(2, 0); ctx.stroke();
          ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(4, 0, 4, 0, Math.PI * 2); ctx.fill();
          break;
        case 'spark':
          ctx.strokeStyle = SKIN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, -2); ctx.stroke();
          ctx.fillStyle = 'rgba(160,220,255,0.5)'; ctx.beginPath(); ctx.arc(7, -2, 5 + atk * 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(7, -2, 2.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'claw':
          ctx.rotate(0.3 + atk * 1.4);
          ctx.strokeStyle = '#d8f0c0'; ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let i = 0; i < 3; i++) { ctx.moveTo(i * 2 - 2, 0); ctx.lineTo(i * 2 + 1, -10); }
          ctx.stroke();
          break;
        case 'raygun':
          ctx.translate(-atk * 2, 0);
          ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.ellipse(5, -1, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#8dff7a'; ctx.fillRect(10, -3, 2, 4); ctx.fillRect(13, -2.5, 2, 3);
          ctx.fillStyle = '#5a5f6e'; ctx.fillRect(-1, 0, 3, 5);
          break;
        // --- armes des unités d'élite
        case 'staff':
          // bâton à crâne, la braise au sommet grossit au moment du lancer
          ctx.rotate(-0.15 + atk * 0.8);
          ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -20); ctx.stroke();
          ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.arc(0, -22, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2a2018'; ctx.fillRect(0, -23, 1.5, 1.5);
          ctx.fillStyle = 'rgba(255,140,40,0.85)'; ctx.beginPath(); ctx.arc(0, -28, 2.5 + atk * 2.5, 0, Math.PI * 2); ctx.fill();
          break;
        case 'grenade':
          // bras qui lance : la grenade quitte la main à mi-geste
          ctx.rotate(-0.4 - atk * 2.0);
          ctx.strokeStyle = SKIN; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
          if (atk < 0.5) {
            ctx.fillStyle = '#2f2e2c'; ctx.beginPath(); ctx.arc(0, -12, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffb057'; ctx.fillRect(1, -17, 1.5, 3);
          }
          break;
        case 'flamer':
          ctx.fillStyle = '#4a4a40'; ctx.fillRect(-4, -2, 10, 5);
          ctx.fillStyle = '#3b3f45'; ctx.fillRect(5, -1, 14, 3);
          if (atk > 0.2) {
            ctx.fillStyle = `rgba(255,120,30,${atk})`;
            ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(34, -6); ctx.lineTo(36, 5); ctx.fill();
            ctx.fillStyle = `rgba(255,225,110,${atk})`;
            ctx.beginPath(); ctx.moveTo(19, 0); ctx.lineTo(28, -2); ctx.lineTo(29, 2.5); ctx.fill();
          }
          break;
        case 'gauntlet':
          // gantelet levé puis abattu sur le sol
          ctx.rotate(-1.0 + atk * 1.9);
          ctx.strokeStyle = SKIN; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, 0); ctx.stroke();
          ctx.fillStyle = '#8a7a6a'; ctx.fillRect(7, -4.5, 9, 9);
          ctx.fillStyle = 'rgba(255,200,90,0.9)'; ctx.fillRect(14, -3, 3, 6);
          break;
        case 'launcher':
          // tube de récupération porté sur l'épaule
          ctx.translate(-atk * 3, -6);
          ctx.rotate(-0.25);
          ctx.fillStyle = '#5d6a45'; ctx.fillRect(-12, -3, 28, 6);
          ctx.fillStyle = '#3a3a36'; ctx.fillRect(14, -4, 4, 8); ctx.fillRect(-14, -3.5, 3, 7);
          ctx.fillStyle = '#c0392b'; ctx.fillRect(-4, -4, 3, 8);
          this.muzzle(ctx, 19, 0, atk);
          break;
        // --- Antiquité et Vapeur
        case 'spearshield':
          // lance tenue haute qui part en avant, grand bouclier rond de bronze devant le torse
          ctx.save(); ctx.translate(atk * 9, 0);
          ctx.strokeStyle = '#8a6440'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(24, -9); ctx.stroke();
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(24, -12); ctx.lineTo(31, -9.5); ctx.lineTo(24, -6); ctx.fill();
          ctx.restore();
          ctx.fillStyle = '#a8742a'; ctx.beginPath(); ctx.arc(2, 2, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#d9a44a'; ctx.beginPath(); ctx.arc(2, 2, 6.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#a8742a'; ctx.beginPath(); ctx.arc(2, 2, 2.2, 0, Math.PI * 2); ctx.fill();
          break;
        case 'bow': {
          // arc courbe ; la corde se tend un instant au tir
          const ty = 11 * Math.sin(1.15), tx = 2 + 11 * Math.cos(1.15);
          ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(2, 0, 11, -1.15, 1.15); ctx.stroke();
          ctx.strokeStyle = '#e8e2d0'; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(tx, -ty); ctx.lineTo(1 - atk * 5, 0); ctx.lineTo(tx, ty); ctx.stroke();
          break;
        }
        case 'wrench':
          ctx.rotate(0.3 + atk * 1.5);
          ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -14); ctx.stroke();
          ctx.fillStyle = '#8a8f98'; ctx.beginPath(); ctx.arc(0, -18, 5.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3a3430'; ctx.fillRect(-1.6, -24.5, 3.2, 6);
          ctx.fillStyle = '#6a4a34'; ctx.fillRect(-2, 0, 4, 5);
          break;
        case 'airgun':
          // fusil à air comprimé : réservoir de laiton sous le canon, jet de vapeur au tir
          ctx.translate(-atk * 3, 0);
          ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-6, -1, 10, 4);
          ctx.fillStyle = '#4a4440'; ctx.fillRect(3, -2, 23, 3);
          ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.ellipse(11, 3.5, 6.5, 2.7, 0, 0, Math.PI * 2); ctx.fill();
          if (atk > 0.3) { ctx.fillStyle = `rgba(240,240,240,${atk * 0.7})`; ctx.beginPath(); ctx.arc(29, -1, 3 + atk * 3, 0, Math.PI * 2); ctx.fill(); }
          break;
        case 'orb':
          ctx.strokeStyle = '#b8c0c8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(4, -3); ctx.stroke();
          ctx.fillStyle = 'rgba(212,155,255,0.45)'; ctx.beginPath(); ctx.arc(8, -6, 6 + atk * 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f3e6ff'; ctx.beginPath(); ctx.arc(8, -6, 2.8, 0, Math.PI * 2); ctx.fill();
          break;
      }
      ctx.restore();
    },

    raptor(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 1.2) * 6 : 0;
      const crest = u.def.look.crest;
      const skin = crest ? '#6f8f3a' : '#7a8f4a';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4f5f2a'; ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-3, -20); ctx.lineTo(-6 + step, -9); ctx.lineTo(-3 + step, 0);
      ctx.moveTo(3, -20); ctx.lineTo(4 - step, -9); ctx.lineTo(7 - step, 0);
      ctx.stroke();
      ctx.fillStyle = skin;
      ctx.beginPath(); ctx.moveTo(-6, -27); ctx.quadraticCurveTo(-20, -30, -27, -23); ctx.quadraticCurveTo(-18, -22, -6, -18); ctx.fill();
      ctx.beginPath(); ctx.ellipse(1, -24, 11, 7, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(9, -28); ctx.rotate(-0.3 + atk * 0.4);
      ctx.fillRect(0, -3, 8, 6);
      ctx.beginPath(); ctx.ellipse(10, -4, 7, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4f5f2a';
      ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(17, -1 + atk * 3); ctx.lineTo(8, 2); ctx.fill();
      ctx.fillStyle = '#ffeb6a'; ctx.beginPath(); ctx.arc(11, -6, 1.3, 0, Math.PI * 2); ctx.fill();
      if (crest) {
        ctx.fillStyle = team;
        ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(6, -14); ctx.lineTo(10, -7); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = team; ctx.beginPath(); ctx.ellipse(-1, -29, 7, 3, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = skin; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(12, -19); ctx.stroke();
    },

    trike(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.7) * 3 : 0;
      ctx.fillStyle = '#6a5a3e';
      [-20, -10, 10, 20].forEach((x, i) => ctx.fillRect(x - 4 + (i % 2 ? step : -step), -18, 8, 18));
      ctx.fillStyle = '#8a7a52';
      ctx.beginPath(); ctx.moveTo(-26, -28); ctx.lineTo(-40, -18); ctx.lineTo(-24, -20); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -27, 28, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(24 + atk * 6, -26);
      ctx.fillStyle = team; ctx.beginPath(); ctx.ellipse(0, -6, 9, 15, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a7a52'; ctx.beginPath(); ctx.ellipse(9, 1, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f3ecdc';
      ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(24, -13); ctx.lineTo(11, -2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(15, -2); ctx.lineTo(25, -5); ctx.lineTo(16, 2); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(8, -2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = dark; ctx.fillRect(-14, -40, 22, 4);
    },

    trex(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.7) * 5 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#4f5a3a'; ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-6, -38); ctx.lineTo(-12 + step, -18); ctx.lineTo(-6 + step, -2);
      ctx.moveTo(4, -38); ctx.lineTo(2 - step, -18); ctx.lineTo(8 - step, -2);
      ctx.stroke();
      ctx.fillStyle = '#5f6f42';
      ctx.beginPath(); ctx.moveTo(-10, -50); ctx.lineTo(-52, -30); ctx.lineTo(-8, -36); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, -46, 22, 15, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(14, -62); ctx.rotate(-0.1 + atk * 0.2);
      ctx.beginPath(); ctx.ellipse(14, 0, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4f5a3a';
      ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(30, 4 + atk * 7); ctx.lineTo(4, 11); ctx.fill();
      ctx.fillStyle = '#f3ecdc';
      for (let x = 10; x < 28; x += 5) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + 2, 8); ctx.lineTo(x + 4, 4); ctx.fill(); }
      ctx.fillStyle = '#ffeb6a'; ctx.beginPath(); ctx.arc(17, -3, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = '#5f6f42'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(14, -48); ctx.lineTo(20, -42); ctx.stroke();
      ctx.fillStyle = team; ctx.beginPath(); ctx.ellipse(-2, -54, 11, 5, -0.4, 0, Math.PI * 2); ctx.fill();
      if (u.def.look.crown) this.crown(ctx, 26, -74);
    },

    warrig(ctx, u, team, dark, atk) {
      const spin = u.moving ? u.walk : 0;
      ctx.save(); ctx.translate(atk * 6, 0);
      ctx.fillStyle = '#6a5a48'; ctx.fillRect(-34, -22, 64, 10);
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-32, -34, 34, 12);
      ctx.fillStyle = '#4a4440'; ctx.fillRect(-4, -50, 3, 16); ctx.fillRect(1, -46, 3, 12);
      ctx.fillStyle = team; ctx.fillRect(4, -42, 22, 20);
      ctx.fillStyle = '#2a3a44'; ctx.fillRect(14, -38, 10, 8);
      ctx.fillStyle = '#5a5048'; ctx.fillRect(28, -28, 4, 18);
      ctx.fillStyle = '#c9ccd2';
      [-26, -18, -12].forEach(y => { ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(42, y + 2); ctx.lineTo(32, y + 4); ctx.fill(); });
      ctx.restore();
      [-24, -8, 20].forEach(x => {
        ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(x, -9, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a6a5a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(spin) * 5, -9 + Math.sin(spin) * 5); ctx.lineTo(x - Math.cos(spin) * 5, -9 - Math.sin(spin) * 5); ctx.stroke();
      });
      if (u.def.look.crown) this.crown(ctx, 15, -48);
    },

    alien(ctx, u, team, dark, atk) {
      const look = u.def.look;
      const swing = u.moving ? Math.sin(u.walk) * 5 : 0;
      const skin = look.bighead ? '#c3a6e0' : look.weapon === 'raygun' ? '#b8c0c8' : '#8fd6a0';
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#3f4a52'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-3 + swing, 0); ctx.moveTo(0, -18); ctx.lineTo(3 - swing, 0); ctx.stroke();
      ctx.fillStyle = team; ctx.fillRect(-5, -32, 10, 15);
      ctx.fillStyle = dark; ctx.fillRect(-5, -20, 10, 3);
      ctx.fillStyle = skin;
      ctx.fillRect(-1.5, -35, 3, 4);
      if (look.bighead) {
        // psion : crâne énorme, veines lumineuses
        ctx.beginPath(); ctx.ellipse(0, -46, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(212,155,255,0.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-6, -52); ctx.quadraticCurveTo(-1, -55, 2, -50); ctx.moveTo(-3, -56); ctx.quadraticCurveTo(3, -58, 6, -53); ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.save(); ctx.translate(5, -44); ctx.rotate(0.4); ctx.beginPath(); ctx.ellipse(0, 0, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        ctx.beginPath(); ctx.ellipse(1, -42, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111';
        ctx.save(); ctx.translate(5, -43); ctx.rotate(0.4); ctx.beginPath(); ctx.ellipse(0, 0, 3, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      this.weapon(ctx, look.weapon, atk, -27);
    },

    tripod(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.6) * 5 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#4a3a5a'; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -50); ctx.lineTo(-18 + step, -24); ctx.lineTo(-22 + step, 0);
      ctx.moveTo(0, -50); ctx.lineTo(16 - step, -24); ctx.lineTo(20 - step, 0);
      ctx.moveTo(0, -50); ctx.lineTo(2, -22); ctx.lineTo(4 + step * 0.5, 0);
      ctx.stroke();
      ctx.fillStyle = '#6a5a7a'; ctx.beginPath(); ctx.ellipse(0, -58, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = team; ctx.beginPath(); ctx.ellipse(0, -64, 14, 10, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#8dff7a'; ctx.beginPath(); ctx.arc(16, -58, 4, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(18, -52);
      ctx.fillStyle = '#5a4a6a'; ctx.fillRect(0, -3, 18 + atk * 8, 6);
      ctx.fillStyle = '#8dff7a'; ctx.fillRect(17 + atk * 8, -2, 4, 4);
      ctx.restore();
      if (u.def.look.crown) this.crown(ctx, 0, -76);
    },

    tank(ctx, u, team, dark, atk) {
      const roll = u.moving ? (u.walk * 3) % 12 : 0;
      // chenilles
      ctx.fillStyle = '#2f2f2c';
      ctx.beginPath(); ctx.ellipse(0, -7, 31, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a5a52';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-22 + i * 11, -7, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#1d1d1b'; ctx.lineWidth = 1.5;
      for (let x = -28 + roll; x < 28; x += 12) { ctx.beginPath(); ctx.moveTo(x, -14); ctx.lineTo(x + 2, -12); ctx.stroke(); }
      // caisse
      ctx.fillStyle = team;
      ctx.beginPath(); ctx.moveTo(-30, -12); ctx.lineTo(-25, -25); ctx.lineTo(24, -25); ctx.lineTo(31, -12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-25, -17, 50, 3);
      // tourelle et canon (recul au tir)
      ctx.fillStyle = team;
      ctx.beginPath(); ctx.moveTo(-14, -25); ctx.lineTo(-10, -36); ctx.lineTo(10, -36); ctx.lineTo(14, -25); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3b3f45'; ctx.fillRect(10 - atk * 5, -33, 26, 4);
      ctx.fillRect(34 - atk * 5, -34, 4, 6);
      this.muzzle(ctx, 41 - atk * 5, -31, atk);
      if (u.def.look.crown) this.crown(ctx, -2, -41);
    },

    mech(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.8) * 6 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = '#4a4f5c'; ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-8, -38); ctx.lineTo(-13 + step, -19); ctx.lineTo(-9 + step, -3);
      ctx.moveTo(8, -38); ctx.lineTo(13 - step, -19); ctx.lineTo(10 - step, -3);
      ctx.stroke();
      ctx.fillStyle = '#3a3f4a';
      ctx.fillRect(-16 + step, -4, 14, 4); ctx.fillRect(3 - step, -4, 14, 4);
      // torse
      ctx.fillStyle = team; ctx.fillRect(-19, -66, 38, 30);
      ctx.fillStyle = dark; ctx.fillRect(-19, -42, 38, 4);
      ctx.fillStyle = '#5a606e'; ctx.fillRect(-24, -66, 8, 14);
      ctx.fillStyle = '#9fe8ff'; ctx.fillRect(5, -60, 11, 5);
      // bras-canon (coup de poing vers l'avant)
      ctx.save(); ctx.translate(14 + atk * 10, -52);
      ctx.fillStyle = '#5a606e'; ctx.fillRect(0, -5, 22, 9);
      ctx.fillStyle = '#9fe8ff'; ctx.fillRect(21, -4, 4, 7);
      ctx.restore();
      ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, -66); ctx.lineTo(-8, -76); ctx.stroke();
      if (u.def.look.crown) this.crown(ctx, 4, -72);
    },

    mammoth(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.7) * 3 : 0;
      ctx.fillStyle = '#5e4533';
      [-17, -8, 8, 17].forEach((x, i) => ctx.fillRect(x - 4 + (i % 2 ? step : -step), -18, 8, 18));
      ctx.fillStyle = '#7a5c45';
      ctx.beginPath(); ctx.ellipse(0, -28, 25, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(22 + atk * 4, -30, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#634a37';
      ctx.beginPath(); ctx.ellipse(16, -31, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7a5c45'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(30 + atk * 4, -26); ctx.quadraticCurveTo(38 + atk * 6, -14, 33 + atk * 4, -4); ctx.stroke();
      ctx.strokeStyle = '#f3ecdc'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(27 + atk * 4, -22); ctx.quadraticCurveTo(36 + atk * 4, -18, 40 + atk * 6, -24); ctx.stroke();
      ctx.fillStyle = team;
      ctx.fillRect(-14, -46, 22, 8);
      ctx.fillStyle = team; ctx.fillRect(-4, -60, 10, 14);
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(1, -64, 5, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(0, -26); this.weapon(ctx, u.def.look.weapon, atk, -28); ctx.restore();
    },

    horse(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk) * 5 : 0;
      ctx.strokeStyle = '#4e3424'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, -24); ctx.lineTo(-16 + step, 0);
      ctx.moveTo(-8, -24); ctx.lineTo(-7 - step, 0);
      ctx.moveTo(10, -24); ctx.lineTo(12 - step, 0);
      ctx.moveTo(16, -24); ctx.lineTo(18 + step, 0);
      ctx.stroke();
      ctx.fillStyle = '#8a5a3a';
      ctx.beginPath(); ctx.ellipse(0, -30, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -36); ctx.lineTo(24, -52); ctx.lineTo(32, -48); ctx.lineTo(22, -30); ctx.fill();
      ctx.beginPath(); ctx.ellipse(31, -48, 8, 5, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-22, -32); ctx.quadraticCurveTo(-30, -26, -28, -16); ctx.stroke();
      ctx.fillStyle = team;
      ctx.beginPath(); ctx.ellipse(0, -26, 20, 6, 0, 0, Math.PI); ctx.fill();
      ctx.fillRect(-4, -56, 12, 18);
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(2, -62, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8d9096'; ctx.beginPath(); ctx.arc(2, -63, 6, Math.PI, 0); ctx.fill();
      if (u.def.look.crown) this.crown(ctx, 2, -70);
      ctx.save(); ctx.translate(2, -20); this.weapon(ctx, u.def.look.weapon, atk, -28); ctx.restore();
    },

    // --- corps des unités d'élite
    // Ankylosaure : carapace à pointes, la massue de la queue passe par-dessus le dos pour frapper.
    ankylo(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.7) * 3 : 0;
      ctx.fillStyle = '#5a5a3a';
      [-18, -8, 8, 18].forEach((x, i) => ctx.fillRect(x - 4 + (i % 2 ? step : -step), -14, 8, 14));
      ctx.save(); ctx.translate(-24, -20); ctx.rotate(0.1 + atk * 1.8);
      ctx.strokeStyle = '#6d6a44'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-16, -4); ctx.stroke();
      ctx.fillStyle = '#9a9262'; ctx.beginPath(); ctx.ellipse(-19, -5, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#7d7a4e';
      ctx.beginPath(); ctx.ellipse(0, -21, 27, 13, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(-27, -21, 54, 7);
      ctx.fillStyle = '#b0a674';
      for (let x = -20; x <= 20; x += 8) {
        const y = -31 + Math.abs(x) * 0.3;
        ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y - 6); ctx.lineTo(x + 3, y); ctx.fill();
      }
      ctx.fillStyle = team; ctx.fillRect(-22, -18, 44, 4);
      ctx.fillStyle = '#7d7a4e'; ctx.beginPath(); ctx.ellipse(30 + atk * 3, -16, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(33 + atk * 3, -18, 1.4, 0, Math.PI * 2); ctx.fill();
    },

    // Mangonneau : chariot à bras de lancer ; le bras bascule vers l'avant au tir.
    siege(ctx, u, team, dark, atk) {
      const spin = u.moving ? u.walk * 0.5 : 0;
      ctx.fillStyle = '#6b4a2c'; ctx.fillRect(-26, -17, 50, 7);
      ctx.fillStyle = team; ctx.fillRect(-26, -12, 50, 3);
      ctx.strokeStyle = '#5a3d24'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-6, -17); ctx.lineTo(2, -36); ctx.lineTo(10, -17); ctx.stroke();
      ctx.save(); ctx.translate(2, -35); ctx.rotate(-0.5 + atk * 2.4);
      ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-24, 0); ctx.stroke();
      ctx.fillStyle = '#4a4440'; ctx.fillRect(7, -5, 8, 10);           // contrepoids
      ctx.fillStyle = '#5a3d24'; ctx.beginPath(); ctx.arc(-25, 0, 4.5, 0, Math.PI); ctx.fill();
      if (atk < 0.3) { ctx.fillStyle = '#7d6a55'; ctx.beginPath(); ctx.arc(-25, -2, 3.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      [-17, 15].forEach(x => {
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x, -7, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(spin) * 6, -7 + Math.sin(spin) * 6); ctx.lineTo(x - Math.cos(spin) * 6, -7 - Math.sin(spin) * 6);
        ctx.moveTo(x - Math.sin(spin) * 6, -7 + Math.cos(spin) * 6); ctx.lineTo(x + Math.sin(spin) * 6, -7 - Math.cos(spin) * 6);
        ctx.stroke();
      });
    },

    // Drone d'assaut : flotte au-dessus du sol, deux rotors, canon sous le ventre.
    drone(ctx, u, team, dark, atk) {
      const t = performance.now() / 1000;
      const bob = Math.sin(t * 3 + u.x * 0.05) * 3;
      ctx.fillStyle = 'rgba(120,230,255,0.13)';
      ctx.beginPath(); ctx.moveTo(-7, -24 + bob); ctx.lineTo(7, -24 + bob); ctx.lineTo(13, 0); ctx.lineTo(-13, 0); ctx.fill();
      ctx.save(); ctx.translate(0, bob);
      ctx.strokeStyle = '#5a606e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, -38); ctx.lineTo(-19, -44); ctx.moveTo(12, -38); ctx.lineTo(19, -44); ctx.stroke();
      const r = Math.abs(Math.cos(t * 30)) * 8 + 3;
      ctx.fillStyle = 'rgba(200,210,225,0.65)';
      ctx.beginPath(); ctx.ellipse(-19, -45, r, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(19, -45, r, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8dde6'; ctx.beginPath(); ctx.ellipse(0, -34, 16, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = team; ctx.fillRect(-12, -36, 22, 4);
      ctx.fillStyle = '#4fd8ff'; ctx.beginPath(); ctx.arc(11, -33, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a3f4a'; ctx.fillRect(1 - atk * 2, -28, 11, 3);
      ctx.restore();
    },

    // --- Antiquité
    // Char de guerre : un cheval au galop, la caisse du char, une roue à rayons armée d'une faux.
    chariot(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 1.3) * 5 : 0;
      const spin = u.moving ? u.walk * 0.8 : 0;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#4e3424'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, -20); ctx.lineTo(8 + step, 0); ctx.moveTo(15, -20); ctx.lineTo(17 - step, 0);
      ctx.moveTo(27, -20); ctx.lineTo(25 - step, 0); ctx.moveTo(32, -20); ctx.lineTo(34 + step, 0);
      ctx.stroke();
      ctx.fillStyle = '#7a4e30';
      ctx.beginPath(); ctx.ellipse(21, -25, 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(29, -29); ctx.lineTo(38, -42 - atk * 3); ctx.lineTo(43, -38 - atk * 3); ctx.lineTo(35, -23); ctx.fill();
      ctx.beginPath(); ctx.ellipse(43, -39 - atk * 3, 6.5, 3.5, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(30, -33); ctx.lineTo(37, -44 - atk * 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(7, -27); ctx.quadraticCurveTo(1, -22, 3, -14); ctx.stroke();
      ctx.fillStyle = team; ctx.fillRect(14, -31, 13, 5);
      ctx.strokeStyle = '#5a3d24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -16); ctx.lineTo(13, -24); ctx.stroke();
      ctx.fillStyle = '#9a6a3a';
      ctx.beginPath(); ctx.moveTo(-27, -14); ctx.lineTo(-25, -32); ctx.lineTo(-5, -32); ctx.lineTo(-2, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = team; ctx.fillRect(-25, -28, 21, 5);
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(-25, -33, 21, 2);
      ctx.fillStyle = team; ctx.fillRect(-19, -46, 10, 14);
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(-14, -50, 5, 0, Math.PI * 2); ctx.fill();
      if (u.def.look.crown) this.crown(ctx, -14, -57);
      else { ctx.fillStyle = '#c08a3a'; ctx.beginPath(); ctx.arc(-14, -51, 5.5, Math.PI, 0); ctx.fill(); }
      ctx.save(); ctx.translate(-12, -12); this.weapon(ctx, 'spear', atk, -28); ctx.restore();
      ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.arc(-14, -10, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b08a5a'; ctx.beginPath(); ctx.arc(-14, -10, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = spin + k * Math.PI / 3;
        ctx.moveTo(-14 + Math.cos(a) * 7.5, -10 + Math.sin(a) * 7.5); ctx.lineTo(-14 - Math.cos(a) * 7.5, -10 - Math.sin(a) * 7.5);
      }
      ctx.stroke();
      ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(-33, -9); ctx.lineTo(-15, -8); ctx.fill();
    },

    // Éléphant de guerre : grosses pattes, trompe qui frappe, défenses, nacelle sur le dos.
    elephant(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.6) * 3 : 0;
      ctx.lineCap = 'round';
      ctx.fillStyle = '#74767d';
      [-19, -8, 9, 20].forEach((x, i) => ctx.fillRect(x - 5 + (i % 2 ? step : -step), -22, 10, 22));
      ctx.strokeStyle = '#7d7f86'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-27, -36); ctx.quadraticCurveTo(-33, -28, -31, -18); ctx.stroke();
      ctx.fillStyle = '#8e9098';
      ctx.beginPath(); ctx.ellipse(0, -32, 28, 17, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = team; ctx.beginPath(); ctx.ellipse(-2, -40, 19, 9, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(-21, -41, 38, 2);
      ctx.save(); ctx.translate(26, -38); ctx.rotate(-0.1 + atk * 0.3);
      ctx.fillStyle = '#8e9098'; ctx.beginPath(); ctx.ellipse(4, 0, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8e9098'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(12, 4); ctx.quadraticCurveTo(20, 14 - atk * 14, 15 + atk * 10, 27 - atk * 26); ctx.stroke();
      ctx.strokeStyle = '#f3ecdc'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(10, 8); ctx.quadraticCurveTo(20, 15, 25, 8); ctx.stroke();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.arc(9, -3, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#777980'; ctx.beginPath(); ctx.ellipse(21, -38, 8, 12, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9a6a3a'; ctx.fillRect(-14, -58, 24, 12);
      ctx.fillStyle = team; ctx.fillRect(-14, -54, 24, 3);
      ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(-2, -61, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a5230'; ctx.fillRect(-14, -67, 2, 9); ctx.fillRect(8, -67, 2, 9);
      ctx.fillStyle = dark; ctx.fillRect(-16, -70, 28, 4);
    },

    // --- Vapeur
    // Automate : chaudière de laiton sur pattes à pistons, cheminée dorsale qui crache de la vapeur.
    automaton(ctx, u, team, dark, atk) {
      const step = u.moving ? Math.sin(u.walk * 0.7) * 5 : 0;
      const t = performance.now() / 1000;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-7, -34); ctx.lineTo(-9 + step, -4); ctx.moveTo(7, -34); ctx.lineTo(9 - step, -4); ctx.stroke();
      ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-7, -30); ctx.lineTo(-8.5 + step, -12); ctx.moveTo(7, -30); ctx.lineTo(8.5 - step, -12); ctx.stroke();
      ctx.fillStyle = '#4a3e30'; ctx.fillRect(-15 + step, -5, 13, 5); ctx.fillRect(3 - step, -5, 13, 5);
      ctx.fillStyle = '#3a3430'; ctx.fillRect(-20, -76, 7, 24);
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.8 + k / 3 + u.x * 0.01) % 1;
        ctx.fillStyle = `rgba(235,235,235,${0.55 * (1 - ph)})`;
        ctx.beginPath(); ctx.arc(-17 - ph * 10, -80 - ph * 20, 3 + ph * 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#b8893a'; ctx.beginPath(); ctx.ellipse(0, -49, 17, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = team; ctx.fillRect(-16.5, -52, 33, 6);
      ctx.fillStyle = '#7a5a2a';
      for (const [x, y] of [[-10, -61], [0, -64], [10, -61], [-12, -39], [12, -39]]) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = `rgba(255,${140 + Math.round(Math.sin(t * 6) * 40)},40,0.95)`; ctx.fillRect(-5, -43, 10, 6);
      ctx.fillStyle = '#9a7432'; ctx.beginPath(); ctx.arc(2, -70, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(5, -71, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(12 + atk * 11, -55);
      ctx.fillStyle = '#6a5a3a'; ctx.fillRect(0, -3, 15, 6);
      ctx.fillStyle = '#c9a24a'; ctx.fillRect(13, -6.5, 8, 13);
      ctx.restore();
      if (u.def.look.crown) this.crown(ctx, 2, -80);
    },

    // Araignée mécanique : huit pattes articulées, un mortier sur le dos.
    spider(ctx, u, team, dark, atk) {
      const ph = u.moving ? u.walk * 1.4 : 0;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const legs = (color, off) => {
        ctx.strokeStyle = color; ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) {
          const x0 = -10 + k * 7, dir = k < 2 ? -1 : 1, lift = Math.sin(ph + k * 1.6 + off) * 4;
          ctx.beginPath(); ctx.moveTo(x0, -23); ctx.lineTo(x0 + dir * 12 + lift, -34); ctx.lineTo(x0 + dir * 21 + lift, 0); ctx.stroke();
        }
      };
      legs('#4a3c2c', Math.PI);
      ctx.fillStyle = '#a07a36'; ctx.beginPath(); ctx.ellipse(0, -24, 18, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = team; ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(-2, -32, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(15, -27, 2, 0, Math.PI * 2); ctx.arc(17, -22, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(-1, -36); ctx.rotate(-0.9);
      ctx.fillStyle = '#3f3a34'; ctx.fillRect(-2 - atk * 3, -4, 14, 8);
      ctx.fillStyle = '#2b2622'; ctx.fillRect(11 - atk * 3, -5, 3, 10);
      ctx.restore();
      legs('#6a5640', 0);
      if (atk > 0.3) { ctx.fillStyle = `rgba(235,235,235,${atk * 0.6})`; ctx.beginPath(); ctx.arc(8, -50, 4 + atk * 4, 0, Math.PI * 2); ctx.fill(); }
    },

    // Couronne des chefs et des champions : or en deux tons, contour brun fin, perles aux pointes, bandeau à pierres.
    // Repère : centrée en x, posée sur y + 3 (bas du bandeau), environ 15 de large et 11 de haut.
    crown(ctx, x, y) {
      const INK = '#2b1d14', OR = '#f2c230', OR_D = '#c98f1c', OR_L = '#ffe58a';
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.translate(x, y + 3); ctx.scale(1.15, 1.15); ctx.translate(-x, -y - 3);   // un peu plus grande, posée au même endroit
      const pointes = () => {
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 0.6); ctx.lineTo(x - 6.6, y - 3.6); ctx.quadraticCurveTo(x - 4.6, y - 1.4, x - 2.6, y - 1.2);
        ctx.lineTo(x, y - 5); ctx.lineTo(x + 2.6, y - 1.2); ctx.quadraticCurveTo(x + 4.6, y - 1.4, x + 6.6, y - 3.6); ctx.lineTo(x + 6, y + 0.6);
        ctx.closePath();
      };
      pointes(); ctx.fillStyle = OR; ctx.fill();
      ctx.save(); pointes(); ctx.clip();                         // ombre sur le côté droit de chaque pointe
      ctx.fillStyle = OR_D;
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 2.6, y - 1.2); ctx.lineTo(x + 0.6, y + 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + 6.6, y - 3.6); ctx.lineTo(x + 6, y + 1); ctx.lineTo(x + 4.6, y + 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 6.6, y - 3.6); ctx.lineTo(x - 5.4, y + 1); ctx.lineTo(x - 4.6, y - 1.3); ctx.closePath(); ctx.fill();
      ctx.restore();
      pointes(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
      // perles au bout des pointes
      for (const [px, py, r] of [[x - 6.6, y - 3.9, 1.1], [x, y - 5.4, 1.25], [x + 6.6, y - 3.9, 1.1]]) {
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fillStyle = OR_L; ctx.fill(); ctx.lineWidth = 0.8; ctx.stroke();
      }
      // bandeau
      ctx.beginPath(); ctx.moveTo(x - 6.4, y + 0.2); ctx.lineTo(x + 6.4, y + 0.2); ctx.lineTo(x + 6.2, y + 3); ctx.lineTo(x - 6.2, y + 3); ctx.closePath();
      ctx.fillStyle = OR_D; ctx.fill(); ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 5.4, y + 1.1); ctx.lineTo(x + 5.4, y + 1.1); ctx.strokeStyle = 'rgba(255,229,138,0.8)'; ctx.lineWidth = 0.7; ctx.stroke();
      // pierres : rubis au centre, émeraudes sur les côtés
      ctx.strokeStyle = INK; ctx.lineWidth = 0.6;
      for (const [px, r, col] of [[x, 1.25, '#d8362f']]) {
        ctx.beginPath(); ctx.arc(px, y + 1.7, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - 0.4, y + 1.3, 0.4, 0, Math.PI * 2); ctx.fill();
      // reflet sur la pointe du milieu
      ctx.beginPath(); ctx.moveTo(x - 0.6, y - 3.4); ctx.lineTo(x - 1.6, y - 1.2); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.restore();
    },

    unitBar(ctx, u) {
      if (u.hp >= u.maxHp && !u.isChampion || u.cache) return;
      const bw = Math.max(24, u.w * 0.8);
      const x = u.x - bw / 2, y = GROUND - (u.alt || 0) - u.h - 12;
      const k = Math.max(0, u.hp / u.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, bw, 4);
      ctx.fillStyle = u.side === 1 ? '#6fd06b' : '#f06a55';
      ctx.fillRect(x, y, bw * k, 4);
      if (u.isChampion) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(u.def.name, u.x, y - 4);
      }
    },

    // ------------------------------------------------------------ projectiles
    projectile(ctx, p) {
      ctx.save();
      // Élément de la run : un halo coloré autour de tes tirs.
      if (p.elem) {
        ctx.fillStyle = C.elements[p.elem].color; ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const projArt = this.art && this.art.projectiles[p.look];
      if (projArt) { projArt(ctx, p, dirOf(p)); ctx.restore(); return; }
      switch (p.look) {
        case 'pebble':
          ctx.fillStyle = '#7d7d7d'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); break;
        case 'flint':
          ctx.fillStyle = '#3d3a36'; ctx.beginPath(); ctx.moveTo(p.x + 3, p.y); ctx.lineTo(p.x - 2, p.y - 2); ctx.lineTo(p.x - 2, p.y + 2); ctx.fill(); break;
        case 'boulder':
          ctx.fillStyle = '#7d6a55'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#5c4b3a'; ctx.lineWidth = 1.5; ctx.stroke(); break;
        case 'fireball':
          ctx.fillStyle = 'rgba(255,170,60,0.45)'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff7a22'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); break;
        case 'oil':
          ctx.fillStyle = '#2f2418'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); break;
        case 'bolt': {
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(-2, -2.5); ctx.lineTo(-2, 2.5); ctx.fill();
          break;
        }
        case 'bullet':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(255,230,150,0.9)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(0, 0); ctx.stroke();
          break;
        case 'shell':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(255,220,140,0.5)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-4, 0); ctx.stroke();
          ctx.fillStyle = '#c8a24a'; ctx.fillRect(-5, -2.5, 8, 5);
          break;
        case 'cannonball':
          ctx.fillStyle = '#2f2e2c'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); break;
        case 'mortar':
          ctx.fillStyle = '#2f2e2c'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffb057'; ctx.beginPath(); ctx.arc(p.x - 4, p.y - 5, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'rocket':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.fillStyle = 'rgba(255,150,60,0.8)'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-18 - Math.random() * 6, -3); ctx.lineTo(-18 - Math.random() * 6, 3); ctx.fill();
          ctx.fillStyle = '#5d6a45'; ctx.fillRect(-8, -2.5, 12, 5);
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(4, -2.5); ctx.lineTo(4, 2.5); ctx.fill();
          break;
        case 'laser': {
          const col = p.owner === 1 ? '120,235,255' : '255,110,140';
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = `rgba(${col},0.35)`; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(0, 0); ctx.stroke();
          break;
        }
        case 'ion':
          ctx.fillStyle = 'rgba(150,150,255,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#d8d8ff'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); break;
        case 'plasma':
          ctx.fillStyle = 'rgba(126,240,200,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c8ffe9'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill(); break;
        case 'venom':
          ctx.fillStyle = 'rgba(156,255,90,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#9cff5a'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill(); break;
        case 'spike':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.fillStyle = '#efe6cc'; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-10, -2); ctx.lineTo(-10, 2); ctx.fill(); break;
        case 'amber':
          ctx.fillStyle = '#f2a93b'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(p.x - 2, p.y - 2, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'lava':
          ctx.fillStyle = 'rgba(255,120,40,0.4)'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#4a2a1a'; ctx.beginPath(); ctx.arc(p.x + 2, p.y - 1, 2.5, 0, Math.PI * 2); ctx.fill(); break;
        case 'harpoon':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.fill(); break;
        case 'barrel':
          ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.05);
          ctx.fillStyle = '#c0392b'; ctx.fillRect(-5, -6, 10, 12);
          ctx.fillStyle = '#f2c230'; ctx.fillRect(-5, -1.5, 10, 3); break;
        case 'star':
          this.star(ctx, p.x, p.y, 7, '#f2c230', p.x * 0.1); break;
        case 'sonic':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(210,225,255,0.85)'; ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-i * 6, 0, 6 + i * 3, -0.9, 0.9); ctx.stroke(); }
          break;
        case 'lightning': {
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(160,220,255,0.5)'; ctx.lineWidth = 5;
          const zig = () => { ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-17, -4); ctx.lineTo(-11, 3); ctx.lineTo(-5, -3); ctx.lineTo(0, 0); ctx.stroke(); };
          zig(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; zig();
          break;
        }
        case 'ray':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(141,255,122,0.4)'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.strokeStyle = '#eaffe4'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(0, 0); ctx.stroke();
          break;
        case 'antimatter':
          ctx.fillStyle = 'rgba(192,141,255,0.4)'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2a1f3a'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'flame':
          ctx.fillStyle = 'rgba(255,120,30,0.5)'; ctx.beginPath(); ctx.arc(p.x, p.y, 9 + Math.random() * 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); break;
        case 'psi':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(212,155,255,0.9)'; ctx.lineWidth = 2.5;
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-i * 7, 0, 5 + i * 3, -1.1, 1.1); ctx.stroke(); }
          break;
        case 'spore':
          ctx.fillStyle = 'rgba(156,255,90,0.35)'; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#6a3a7a'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#9cff5a';
          for (let i = 0; i < 5; i++) { const a = i * 1.26 + p.x * 0.05; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, 1.8, 0, Math.PI * 2); ctx.fill(); }
          break;
        // ---- Antiquité
        case 'arrow':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(-2, -2); ctx.lineTo(-2, 2); ctx.fill();
          ctx.fillStyle = '#e9e2d0'; ctx.fillRect(-15, -1.8, 4, 3.6);
          break;
        case 'dart':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.fillStyle = '#c08a3a'; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-2, -3); ctx.lineTo(-2, 3); ctx.fill();
          break;
        case 'sunbeam':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(255,220,110,0.4)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-34, 0); ctx.lineTo(0, 0); ctx.stroke();
          ctx.strokeStyle = '#fff8d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(0, 0); ctx.stroke();
          break;
        case 'jar':
          ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.04);
          ctx.fillStyle = '#b8683a'; ctx.beginPath(); ctx.ellipse(0, 1, 5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(-2, -8, 4, 4);
          ctx.fillStyle = '#2a1e18'; ctx.fillRect(-4.5, 0, 9, 1.5);
          break;
        // ---- Vapeur
        case 'rivet':
          ctx.translate(p.x, p.y); ctx.rotate(dirOf(p));
          ctx.strokeStyle = 'rgba(255,150,70,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-2, 0); ctx.stroke();
          ctx.fillStyle = '#ffb060'; ctx.fillRect(-3, -2, 6, 4);
          break;
        case 'steambomb':
          ctx.fillStyle = 'rgba(240,240,240,0.5)'; ctx.beginPath(); ctx.arc(p.x - 5, p.y - 7, 3.5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#3a3430'; ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c9a24a'; ctx.fillRect(p.x - 6, p.y - 1, 12, 2);
          break;
        case 'boiler':
          ctx.fillStyle = 'rgba(240,240,240,0.45)'; ctx.beginPath(); ctx.arc(p.x - 6, p.y - 10, 5, 0, Math.PI * 2); ctx.fill();
          ctx.translate(p.x, p.y); ctx.rotate(p.x * 0.03);
          ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-7, -5, 14, 10);
          ctx.fillStyle = '#c9a24a'; ctx.fillRect(-7, -5, 2, 10); ctx.fillRect(5, -5, 2, 10);
          ctx.fillStyle = 'rgba(255,140,40,0.95)'; ctx.fillRect(-2, -2, 4, 4);
          break;
      }
      ctx.restore();
    },

    // Charge des éléphants : la bête court vers l'ennemi, avec un halo doré pour la distinguer des unités.
    sweep(ctx, s) {
      if (PA.Pouvoirs && s.look !== 'elephant' && PA.Pouvoirs.charge(ctx, s)) return;
      if (this.art && this.art.fx.sweep) return this.art.fx.sweep(ctx, s, TEAM[1], TEAM_DARK[1], this);
      ctx.save();
      ctx.translate(s.x, GROUND);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(0, 1, 36, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = 'rgba(255,215,106,0.9)'; ctx.shadowBlur = 14;
      const fake = { moving: true, walk: s.walk, x: s.x, def: { look: {} } };
      this.elephant(ctx, fake, TEAM[1], TEAM_DARK[1], Math.max(0, Math.sin(s.walk * 0.45)) * 0.7);
      ctx.restore();
    },

    // Raid de dirigeable : il traverse le ciel pendant que ses bombes tombent sous lui.
    airship(ctx, s) {
      if (this.art && this.art.fx.airship) return this.art.fx.airship(ctx, s, TEAM[1], TEAM_DARK[1], this);
      const x = s.x0 + (s.x1 - s.x0) * s.t / s.dur, y = 90;
      ctx.save();
      ctx.globalAlpha = Math.min(1, s.t / 0.3, (s.dur + 1.6 - s.t) / 0.4);
      ctx.translate(x, y);
      ctx.fillStyle = '#8a7a64';
      ctx.beginPath(); ctx.moveTo(-56, -6); ctx.lineTo(-82, -24); ctx.lineTo(-76, -2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-56, 6); ctx.lineTo(-82, 22); ctx.lineTo(-76, 2); ctx.fill();
      ctx.fillStyle = '#c2b298'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9a8a72'; ctx.lineWidth = 1.5;
      for (const dx of [-42, -16, 12, 38]) {
        const hh = 20 * Math.sqrt(1 - (dx / 70) * (dx / 70));
        ctx.beginPath(); ctx.moveTo(dx, -hh); ctx.quadraticCurveTo(dx + 5, 0, dx, hh); ctx.stroke();
      }
      ctx.fillStyle = TEAM[1]; ctx.fillRect(-30, -3, 60, 6);
      ctx.strokeStyle = '#4a3e34'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-14, 18); ctx.lineTo(-11, 26); ctx.moveTo(14, 18); ctx.lineTo(11, 26); ctx.stroke();
      ctx.fillStyle = '#6a4a34'; ctx.fillRect(-17, 26, 34, 9);
      ctx.fillStyle = '#ffcf7a'; for (const wx of [-11, -3, 5]) ctx.fillRect(wx, 28, 4, 3);
      const r = Math.abs(Math.cos(s.t * 40)) * 8 + 2;
      ctx.fillStyle = 'rgba(70,60,50,0.75)'; ctx.beginPath(); ctx.ellipse(-20, 30, 1.8, r, 0, 0, Math.PI * 2); ctx.fill();
      for (let k = 0; k < 3; k++) {
        const ph = (s.t * 1.5 + k / 3) % 1;
        ctx.fillStyle = `rgba(110,100,95,${0.45 * (1 - ph)})`;
        ctx.beginPath(); ctx.arc(-24 - ph * 40, 24 - ph * 10, 3 + ph * 7, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    drop(ctx, d) {
      if (PA.Pouvoirs && PA.Pouvoirs.chute(ctx, d)) return;
      const dropArt = this.art && this.art.drops[d.look];
      if (dropArt) return dropArt(ctx, d);
      if (d.look === 'rock') {
        ctx.fillStyle = 'rgba(120,100,80,0.3)';
        ctx.beginPath(); ctx.ellipse(d.x, d.y - 18, 6, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8d7f70'; ctx.beginPath(); ctx.arc(d.x, d.y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6b5f52'; ctx.lineWidth = 2; ctx.stroke();
      } else if (d.look === 'cannonball') {
        ctx.fillStyle = 'rgba(60,55,50,0.25)';
        ctx.beginPath(); ctx.ellipse(d.x, d.y - 20, 4, 20, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2f2e2c'; ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI * 2); ctx.fill();
      } else if (d.look === 'bomb') {
        ctx.save(); ctx.translate(d.x, d.y);
        ctx.fillStyle = '#3b3f45';
        ctx.beginPath(); ctx.ellipse(0, -6, 5, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(6, -20); ctx.lineTo(0, -12); ctx.fill();
        ctx.fillStyle = '#c8a24a'; ctx.fillRect(-5, -9, 10, 2);
        ctx.restore();
      } else if (d.look === 'beam') {
        const r = d.radius * 0.35;
        ctx.fillStyle = 'rgba(120,230,255,0.25)'; ctx.fillRect(d.x - r, 0, r * 2, d.y);
        ctx.fillStyle = 'rgba(230,250,255,0.9)'; ctx.fillRect(d.x - r * 0.3, 0, r * 0.6, d.y);
      } else if (d.look === 'meteor') {
        ctx.fillStyle = 'rgba(255,140,40,0.35)';
        ctx.beginPath(); ctx.ellipse(d.x, d.y - 28, 8, 28, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 2.5; ctx.stroke();
      } else if (d.look === 'barrel') {
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.y * 0.02);
        ctx.fillStyle = '#c0392b'; ctx.fillRect(-7, -9, 14, 18);
        ctx.fillStyle = '#f2c230'; ctx.fillRect(-7, -2, 14, 4);
        ctx.restore();
      } else if (d.look === 'fist') {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(d.x + i * 7, d.y - 22); ctx.lineTo(d.x + i * 7, d.y - 42); ctx.stroke(); }
        ctx.fillStyle = '#f2c230';
        ctx.beginPath(); ctx.ellipse(d.x, d.y - 4, 11, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#b8901c'; ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(d.x + i * 5, d.y + 2); ctx.lineTo(d.x + i * 5, d.y + 8); ctx.stroke(); }
      } else if (d.look === 'steambomb') {
        ctx.fillStyle = 'rgba(230,230,230,0.32)';
        ctx.beginPath(); ctx.ellipse(d.x, d.y - 18, 4, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(d.x, d.y);
        ctx.fillStyle = '#3a3430'; ctx.beginPath(); ctx.ellipse(0, -4, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9a24a'; ctx.fillRect(-6, -5, 12, 2);
        ctx.beginPath(); ctx.moveTo(-5, -15); ctx.lineTo(5, -15); ctx.lineTo(0, -9); ctx.fill();
        ctx.restore();
      } else if (d.look === 'saucer') {
        const r = d.radius * 0.35;
        ctx.fillStyle = 'rgba(141,255,122,0.25)';
        ctx.beginPath(); ctx.moveTo(d.x - 8, 50); ctx.lineTo(d.x + 8, 50); ctx.lineTo(d.x + r, d.y); ctx.lineTo(d.x - r, d.y); ctx.fill();
        ctx.fillStyle = '#b8c0c8'; ctx.beginPath(); ctx.ellipse(d.x, 46, 26, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8dff7a'; ctx.beginPath(); ctx.ellipse(d.x, 42, 11, 9, 0, Math.PI, 0); ctx.fill();
      } else {
        ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(Math.PI / 2 + 0.25);
        ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(-2, -2.5); ctx.lineTo(-2, 2.5); ctx.fill();
        ctx.fillStyle = '#e9e2d0'; ctx.fillRect(-17, -2, 4, 4);
        ctx.restore();
      }
    },

    particles(ctx, b) {
      const nouveau = PA.Fx && PA.Fx.actif();   // un autre style d'effets remplace les carrés et les anneaux d'avant
      for (const p of b.particles) {
        if (nouveau && !p.bolt) continue;
        const a = Math.max(0, p.life / p.max);
        if (p.ring) {
          ctx.strokeStyle = p.color; ctx.globalAlpha = a; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
        } else if (p.bolt) {
          // Éclair de la Foudre : un halo large, puis un trait fin et blanc.
          if (PA.Fx && PA.Fx.eclair(ctx, p.pts, a)) { ctx.globalAlpha = 1; continue; }
          const path = () => { ctx.beginPath(); p.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
          ctx.lineJoin = 'round';
          ctx.strokeStyle = p.color; ctx.globalAlpha = a * 0.45; ctx.lineWidth = 6; path(); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = a; ctx.lineWidth = 1.8; path(); ctx.stroke();
        } else {
          ctx.globalAlpha = a; ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
    },

    texts(ctx, b) {
      ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (const t of b.texts) {
        ctx.globalAlpha = Math.min(1, t.life * 1.5);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(t.text, t.x + 1, t.y + 1);
        ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    },

    assaultBanner(ctx, b, game) {
      const A = C.assault;
      const n = Math.max(1, b.wave.n);
      const nextWindow = Math.ceil(n / A.windowEvery) * A.windowEvery;
      const lines = [
        `ASSAUT FINAL — Vague ${b.wave.n}`,
        `Multiplicateur ×${b.assaultMult().toFixed(1)}   ·   Cagnotte ${b.cagnotte.toFixed(0)} ✦   ·   Fenêtre de retraite après la vague ${nextWindow}`,
      ];
      ctx.fillStyle = 'rgba(20,10,20,0.6)';
      ctx.fillRect(W / 2 - 360, 68, 720, 58);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd9a8'; ctx.font = 'bold 19px system-ui, sans-serif';
      ctx.fillText(lines[0], W / 2, 92);
      ctx.fillStyle = '#e8dcff'; ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(lines[1], W / 2, 115);
    },
  };

  PA.Render = R;
})();

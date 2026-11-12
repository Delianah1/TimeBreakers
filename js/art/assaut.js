/* =========================================================================
   NOUVEAUX GRAPHISMES — ASSAUT FINAL
   Ciel de braise, lune éclipsée, citadelle noire de l'ennemi.
   ========================================================================= */
(function () {
  const A = PA.Art, K = A.kit;
  const { W, H, GROUND, TAU, INK, IVORY, now, blob, limb, dk, poly, line, rect, disc, oval, puffs, flame, halo, backdrop, sky, hills, ridge, range, flock } = K;
  const OBS = '#2e2430', OBS_L = '#463848', OBS_D = '#1c151e', LAVA = '#ff7a2a';

  /* ---------------------------------------------------------- base : citadelle */
  A.bases.citadel = function (ctx, side, def, team, dark) {
    const G = GROUND, T = now(), fl = Math.sin(T * 7) * 0.5 + Math.sin(T * 11.3) * 0.5;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    puffs(ctx, 30, G - 206, { n: 5, speed: 0.14, rise: 60, drift: -26, r0: 8, r1: 18, rgb: '40,30,36', a: 0.5 });
    // tours à pointes
    for (const [x, w, top] of [[-14, 30, G - 178], [22, 26, G - 206], [54, 24, G - 160]]) {
      rect(ctx, x, top, w, G - top, OBS, 1.6); rect(ctx, x + w - 7, top, 7, G - top, 'rgba(0,0,0,0.3)');
      for (let i = 0; i < 3; i++) poly(ctx, [x + i * w / 3, top, x + (i + 0.5) * w / 3, top - 15, x + (i + 1) * w / 3, top], OBS_L, 1.3);
      for (let y = top + 22; y < G - 70; y += 26) { halo(ctx, x + w / 2, y, 10, '255,120,40', 0.35 + fl * 0.1); blob(ctx, LAVA, () => { ctx.moveTo(x + w / 2 - 3, y + 7); ctx.lineTo(x + w / 2 - 3, y - 2); ctx.lineTo(x + w / 2, y - 7); ctx.lineTo(x + w / 2 + 3, y - 2); ctx.lineTo(x + w / 2 + 3, y + 7); }, 1); }
    }
    // rempart et gueule de la porte
    rect(ctx, -14, G - 78, 92, 78, OBS_L, 1.6); for (let i = 0; i < 6; i++) poly(ctx, [-14 + i * 15.4, G - 78, -6.3 + i * 15.4, G - 92, 1.4 + i * 15.4, G - 78], OBS, 1.2);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = G - 64; y < G - 4; y += 13) { ctx.moveTo(-14, y); ctx.lineTo(78, y); } ctx.stroke();
    const mg = ctx.createRadialGradient(32, G - 6, 3, 32, G - 6, 52); mg.addColorStop(0, '#ffc45a'); mg.addColorStop(0.3, '#d6452a'); mg.addColorStop(1, '#1a0c10');
    blob(ctx, mg, () => { ctx.moveTo(10, G); ctx.lineTo(10, G - 34); ctx.quadraticCurveTo(12, G - 58, 32, G - 62); ctx.quadraticCurveTo(52, G - 58, 54, G - 34); ctx.lineTo(54, G); }, 2);
    ctx.fillStyle = IVORY; ctx.strokeStyle = INK; ctx.lineWidth = 0.9;
    for (const [x, hh] of [[15, 10], [22, 14], [29, 16], [35, 16], [42, 14], [49, 10]]) { const y = G - 58 + Math.abs(x - 32) * 0.36; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x, y + hh); ctx.lineTo(x + 3, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const x of [14, 21, 43, 50]) { ctx.beginPath(); ctx.moveTo(x - 2.6, G); ctx.lineTo(x, G - 8); ctx.lineTo(x + 2.6, G); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    for (const x of [20, 44]) { halo(ctx, x, G - 70, 8, '255,120,40', 0.6); oval(ctx, x, G - 70, 4.4, 2.6, LAVA, 1, x < 32 ? 0.4 : -0.4); }
    // bannières d'équipe, braseros
    for (const x of [62, -6]) { rect(ctx, x, G - 76, 2, 4, OBS_D); blob(ctx, team, () => { ctx.moveTo(x - 5, G - 72); ctx.lineTo(x + 7, G - 72); ctx.lineTo(x + 7, G - 44); ctx.lineTo(x + 1, G - 50); ctx.lineTo(x - 5, G - 44); }, 1.2); disc(ctx, x + 1, G - 62, 2.6, dark); }
    for (const x of [-2, 70]) { limb(ctx, [x, G, x, G - 14], 2, OBS_D); oval(ctx, x, G - 15, 5, 2, OBS_D, 1); flame(ctx, x, G - 15, 13, 8, x); }
    // corniches des tourelles
    rect(ctx, 82, G - 140, 22, 140, OBS, 1.5);
    for (let s = 0; s < 4; s++) { const y = G - 23 - s * 30; rect(ctx, 76, y - 1, 34, 4.4, OBS_L, 1.2); poly(ctx, [78, y - 1, 82, y - 8, 86, y - 1], OBS_D, 0.9); }
    poly(ctx, [80, G - 140, 93, G - 164, 106, G - 140], OBS_L, 1.3);
    // étendard au sommet
    const wv = Math.sin(T * 2.4 + side) * 2;
    limb(ctx, [35, G - 221, 35, G - 239], 1.8, OBS_D);
    blob(ctx, team, () => { ctx.moveTo(35, G - 238); ctx.quadraticCurveTo(48, G - 240 + wv, 60, G - 235 + wv); ctx.lineTo(54, G - 230 + wv * 0.7); ctx.lineTo(60, G - 225 + wv * 0.5); ctx.quadraticCurveTo(48, G - 223 + wv * 0.5, 35, G - 226); });
  };

  /* -------------------------------------------------------------------- décor */
  const EMBERS = [];
  A.backdrops.assaut = backdrop('assaut', 666, (g, r) => {
    sky(g, [[0, '#120810'], [0.45, '#4a1420'], [0.78, '#b0402a'], [1, '#f08a3a']]);
    // lune éclipsée
    halo(g, 640, 200, 240, '255,110,50', 0.55);
    g.fillStyle = '#ffb46a'; g.beginPath(); g.arc(640, 200, 62, 0, TAU); g.fill(); g.fillStyle = '#160a10'; g.beginPath(); g.arc(640, 200, 55, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,200,130,0.8)'; g.lineWidth = 2; g.beginPath(); g.arc(640, 200, 58.5, 0, TAU); g.stroke();
    range(g, ridge(r, 480, 210, 50, 110), 480, '#3a1a22', 'rgba(0,0,0,0.28)', false);
    range(g, ridge(r, 510, 120, 40, 90), 510, '#22101a', 'rgba(0,0,0,0.3)', false);
    // coulées de lave au loin
    g.strokeStyle = 'rgba(255,130,50,0.75)'; g.lineWidth = 2.4;
    for (const [x, y] of [[210, 420], [520, 400], [870, 430], [1120, 410]]) { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 12, y + 30, x - 14, y + 60, x + 8, y + 100); g.stroke(); }
    const gr = g.createLinearGradient(0, 420, 0, 560); gr.addColorStop(0, 'rgba(240,138,58,0)'); gr.addColorStop(1, 'rgba(240,120,50,0.55)');
    g.fillStyle = gr; g.fillRect(-40, 420, W + 80, 200);
  }, (f, r) => {
    const h2 = x => 566 - Math.sin(x * 0.006 + 1.2) * 15 - Math.sin(x * 0.019 + 3.3) * 6;
    hills(f, h2, 0, '#1c0e16');
    // arbres morts, ruines, pieux
    f.strokeStyle = '#0e070c'; f.lineCap = 'round';
    for (const [x, s] of [[90, 1.2], [300, 1], [520, 1.3], [780, 1.1], [1010, 1.3], [1210, 1]]) { const y = h2(x) + 2; f.lineWidth = 4 * s; f.beginPath(); f.moveTo(x, y + 4); f.lineTo(x + 2 * s, y - 34 * s); f.stroke(); f.lineWidth = 2.2 * s; f.beginPath(); f.moveTo(x + 1, y - 18 * s); f.lineTo(x + 14 * s, y - 32 * s); f.moveTo(x + 1.4, y - 26 * s); f.lineTo(x - 11 * s, y - 38 * s); f.moveTo(x + 2 * s, y - 34 * s); f.lineTo(x + 7 * s, y - 46 * s); f.stroke(); }
    f.fillStyle = '#0e070c'; for (const [x, w, hh] of [[400, 60, 44], [900, 80, 52]]) { const y = h2(x + w / 2) + 6; f.beginPath(); f.moveTo(x, y); f.lineTo(x, y - hh); f.lineTo(x + w * 0.2, y - hh * 0.7); f.lineTo(x + w * 0.4, y - hh * 0.9); f.lineTo(x + w * 0.62, y - hh * 0.4); f.lineTo(x + w * 0.8, y - hh * 0.62); f.lineTo(x + w, y); f.fill(); }
    // sol calciné, fissures de braise
    let gr = f.createLinearGradient(0, GROUND, 0, H + 40); gr.addColorStop(0, '#3a2326'); gr.addColorStop(1, '#170d10');
    f.fillStyle = gr; f.fillRect(-40, GROUND, W + 80, H - GROUND + 40);
    for (let i = 0; i < 30; i++) {
      let x = r() * W, y = GROUND + 18 + r() * 86; const pts = [[x, y]]; for (let k = 0; k < 3; k++) { x += 10 + r() * 18; y += (r() - 0.5) * 14; pts.push([x, y]); }
      f.strokeStyle = 'rgba(255,110,40,0.35)'; f.lineWidth = 4; f.beginPath(); pts.forEach(([px, py], k) => k ? f.lineTo(px, py) : f.moveTo(px, py)); f.stroke();
      f.strokeStyle = '#ffb04a'; f.lineWidth = 1.2; f.stroke();
    }
    for (let i = 0; i < 30; i++) { const x = r() * W, y = GROUND + 18 + r() * 86, s = 2.4 + r() * 4; f.fillStyle = '#120a0c'; f.beginPath(); f.ellipse(x, y, s, s * 0.6, 0, 0, TAU); f.fill(); }
    f.fillStyle = '#4a2a2a'; f.fillRect(-40, GROUND, W + 80, 7); f.fillStyle = '#6a3a34'; f.fillRect(-40, GROUND, W + 80, 2);
    f.fillStyle = '#4a2a2a'; f.beginPath(); for (let x = -40; x < W + 40; x += 9) { f.moveTo(x, GROUND + 6.5); f.lineTo(x + 4.5, GROUND + 10 + r() * 5); f.lineTo(x + 9, GROUND + 6.5); } f.fill();
  }, (ctx, t, dt) => {
    // éclairs dans les nuées, vol de corbeaux
    const k = Math.sin(t * 0.9) * Math.sin(t * 2.3 + 1);
    if (k > 0.86) { ctx.fillStyle = `rgba(255,200,170,${(k - 0.86) * 2.2})`; ctx.fillRect(-40, -40, W + 80, 460); }
    flock(ctx, t, dt, 'assaut', '#0e070c', 7);
  }, (ctx, t, dt) => {
    // braises qui montent
    if (!EMBERS.length) for (let i = 0; i < 46; i++) EMBERS.push({ x: Math.random() * W, y: Math.random() * H, v: 18 + Math.random() * 30, s: 1 + Math.random() * 1.8, p: Math.random() * 6 });
    for (const e of EMBERS) {
      e.y -= e.v * (dt || 0); e.x += Math.sin(t * 1.4 + e.p) * 10 * (dt || 0); if (e.y < 300) { e.y = H; e.x = Math.random() * W; }
      ctx.fillStyle = `rgba(255,${150 + Math.round(Math.sin(e.p + t * 3) * 50)},60,${Math.min(1, (e.y - 300) / 200) * 0.8})`; ctx.fillRect(e.x, e.y, e.s, e.s);
    }
  });
})();

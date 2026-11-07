/* ===== Illustrated home backdrops, one scene per page ===== */
const SW = 1600, SH = 600, GY = 478;
function seeded(seed) { let s = (seed >>> 0) || 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function ridge(y0, amp, freq, phase) {
  let d = 'M0 ' + SH + ' L0 ' + y0.toFixed(1);
  for (let x = 0; x <= SW; x += 32) {
    const y = y0 - amp * (0.55 * Math.sin(x * freq + phase) + 0.3 * Math.sin(x * freq * 2.3 + phase * 1.7) + 0.15 * Math.sin(x * freq * 5.1 + phase * 0.6));
    d += ' L' + x + ' ' + y.toFixed(1);
  }
  return d + ' L' + SW + ' ' + SH + ' Z';
}
const SCENES = {
  home: { sky: ['#1C1F4A', '#55397A', '#E9875E'], sun: [1240, 395, 82, '#FFC98C'], stars: 1, far: '#3B2D63', near: '#2A2250', ground: '#191632', walls: ['#3F3567', '#4A3C70', '#352B5C'], roofs: ['#221B40', '#2B2250'], win: '#FFD38A', lit: 1, tree: ['round', '#1E1A3B'], style: 'mixed', seed: 11 },
  assumable: { sky: ['#0E6168', '#3FAFA6', '#D3F1EB'], sun: [1320, 140, 58, '#FFF6DE'], far: '#2E8F86', near: '#22736B', ground: '#17524D', walls: ['#F3EFE6', '#E2EAE5', '#F6E6D2'], roofs: ['#2F4858', '#3B5F6E', '#5A3E36'], win: '#9FD4E6', tree: ['round', '#1D5A53'], style: 'two', seed: 23 },
  placer: { sky: ['#EFA857', '#F6CF8C', '#FCEBC6'], sun: [1180, 330, 96, '#FFF2CC'], far: '#C98A40', near: '#A8702F', ground: '#7E5223', walls: ['#EBDCC1', '#F2E4CD', '#E4D2B4'], roofs: ['#6B4A2E', '#7A5634'], win: '#7FB3C9', tree: ['oak', '#5C5A2A'], style: 'ranch', seed: 37 },
  payment: { sky: ['#0D3A2F', '#2C7A5A', '#AEE0C1'], sun: [1360, 210, 46, '#F4FFE9'], far: '#22604A', near: '#1A4D3B', ground: '#12382B', walls: ['#E7EFEA', '#D6E6DD', '#F1EDE3'], roofs: ['#1F3D33', '#2C4C40'], win: '#FFD38A', lit: 1, tree: ['round', '#163F31'], style: 'row', seed: 41 },
  'zero-down': { sky: ['#1D3E85', '#4E86D8', '#F8C885'], sun: [1250, 470, 112, '#FFE4A8'], far: '#2C4F8E', near: '#233F75', ground: '#1A2F57', walls: ['#EEF2F8', '#DDE6F2', '#F5EFE6'], roofs: ['#2B3A55', '#36486A'], win: '#FFD38A', lit: 1, tree: ['round', '#1C3563'], style: 'modern', sign: 1, seed: 53 },
  'new-builds': { sky: ['#4A2617', '#B65F34', '#F4C29A'], sun: [1360, 300, 70, '#FFE3C6'], far: '#7A3E22', near: '#5E2F1A', ground: '#3F2013', walls: ['#F1E6DA', '#E6D6C6'], roofs: ['#4B2A1C', '#3A2117'], win: '#FFD7A0', tree: ['round', '#4A2A1A'], style: 'frame', crane: 1, seed: 61 },
  stockton: { sky: ['#0F2E44', '#2D6E8E', '#F2B661'], sun: [1200, 410, 86, '#FFE0A3'], far: '#1F4F66', ground: '#16384A', walls: ['#F1E9DD', '#E3DCCF', '#DDE7EE'], roofs: ['#284A5E', '#5A3E36'], win: '#FFD38A', lit: 1, tree: ['palm', '#173B4C'], style: 'two', water: 1, seed: 71 },
  placer2: null,
  refinance: { sky: ['#1E0C24', '#6E2A55', '#E2889F'], moon: [1250, 150, 46, '#FFF3E6'], stars: 1, far: '#3E1A3D', near: '#2C1430', ground: '#1D0D22', walls: ['#4A2E52', '#3E2648'], roofs: ['#24122B', '#2E1735'], win: '#FFD38A', lit: 1, tree: ['pine', '#271330'], style: 'two', water: 1, seed: 83 },
  build: { blueprint: 1, seed: 97 },
  about: { sky: ['#2E1006', '#B83F22', '#F7A35C'], sun: [1120, 470, 150, '#FFD08A'], far: '#5A1E10', near: '#3E150B', ground: '#250C05', walls: ['#4A1E12', '#5A2616'], roofs: ['#2A0F08', '#33130A'], win: '#FFD38A', lit: 1, tree: ['round', '#2E0F07'], style: 'mixed', seed: 101 },
  alerts: { sky: ['#103C35', '#3E8E7E', '#CDECE1'], sun: [1300, 190, 64, '#FFF8E0'], far: '#2F7566', near: '#245D51', ground: '#18433A', walls: ['#F4F0E6', '#E5EEE9', '#F7E8D4'], roofs: ['#2C4A44', '#4E3B33'], win: '#9FD4E6', tree: ['round', '#1B4A40'], style: 'mixed', mailbox: 1, seed: 113 }
};
const sceneCache = {};
function scene(key, thumb) {
  const id = key + (thumb ? '-t' : '');
  if (sceneCache[id]) return sceneCache[id];
  const c = SCENES[key] || SCENES.home;
  const r = seeded(c.seed);
  const u = 'sc-' + id;
  const view = thumb ? '700 120 900 480' : '0 0 ' + SW + ' ' + SH;
  let s = '<svg viewBox="' + view + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">';
  if (c.blueprint) { s += blueprint(r, u) + '</svg>'; sceneCache[id] = s; return s; }
  s += '<defs><linearGradient id="' + u + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.sky[0] + '"/><stop offset="0.6" stop-color="' + c.sky[1] + '"/><stop offset="1" stop-color="' + c.sky[2] + '"/></linearGradient>' +
    '<radialGradient id="' + u + 'g"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>';
  s += '<rect width="' + SW + '" height="' + SH + '" fill="url(#' + u + 'k)"/>';
  if (c.stars) for (let i = 0; i < 90; i++) s += '<circle cx="' + (r() * SW).toFixed(0) + '" cy="' + (r() * 260).toFixed(0) + '" r="' + (r() * 1.6 + 0.4).toFixed(1) + '" fill="#FFFFFF" opacity="' + (r() * 0.6 + 0.25).toFixed(2) + '"/>';
  const orb = c.sun || c.moon;
  if (orb) {
    s += '<circle cx="' + orb[0] + '" cy="' + orb[1] + '" r="' + orb[2] * 2.6 + '" fill="url(#' + u + 'g)"/>';
    s += '<circle cx="' + orb[0] + '" cy="' + orb[1] + '" r="' + orb[2] + '" fill="' + orb[3] + '"/>';
    if (c.moon) s += '<circle cx="' + (orb[0] - 12) + '" cy="' + (orb[1] - 8) + '" r="9" fill="#000000" opacity="0.06"/><circle cx="' + (orb[0] + 14) + '" cy="' + (orb[1] + 12) + '" r="6" fill="#000000" opacity="0.05"/>';
  }
  for (let i = 0; i < 5; i++) {
    const cx = r() * SW, cy = 60 + r() * 150, w = 80 + r() * 140;
    s += '<g opacity="' + (c.stars ? 0.12 : 0.35) + '" fill="#FFFFFF"><ellipse cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" rx="' + w.toFixed(0) + '" ry="16"/><ellipse cx="' + (cx + w * 0.35).toFixed(0) + '" cy="' + (cy - 12).toFixed(0) + '" rx="' + (w * 0.5).toFixed(0) + '" ry="18"/></g>';
  }
  s += '<path d="' + ridge(330, 70, 0.0042, r() * 6) + '" fill="' + c.far + '" opacity="0.92"/>';
  if (c.near) s += '<path d="' + ridge(405, 42, 0.0061, r() * 6) + '" fill="' + c.near + '"/>';
  if (c.water) {
    s += '<rect x="0" y="' + (GY + 20) + '" width="' + SW + '" height="' + (SH - GY - 20) + '" fill="' + c.sky[1] + '" opacity="0.85"/>';
    for (let i = 0; i < 26; i++) {
      const x = r() * SW, y = GY + 30 + r() * (SH - GY - 40), w = 40 + r() * 160;
      s += '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + w.toFixed(0) + '" height="2.5" fill="#FFFFFF" opacity="' + (0.15 + r() * 0.3).toFixed(2) + '"/>';
    }
    if (orb) s += '<rect x="' + (orb[0] - 40) + '" y="' + (GY + 30) + '" width="80" height="' + (SH - GY - 40) + '" fill="' + orb[3] + '" opacity="0.25"/>';
    s += '<path d="M0 ' + (GY + 24) + ' Q ' + SW / 2 + ' ' + (GY - 6) + ' ' + SW + ' ' + (GY + 22) + ' L' + SW + ' ' + (GY + 34) + ' L0 ' + (GY + 34) + ' Z" fill="' + c.ground + '"/>';
  } else {
    s += '<path d="M0 ' + GY + ' Q ' + SW / 2 + ' ' + (GY - 18) + ' ' + SW + ' ' + GY + ' L' + SW + ' ' + SH + ' L0 ' + SH + ' Z" fill="' + c.ground + '"/>';
  }
  if (c.crane) s += crane(1080, GY - 6);
  // homes and trees across the scene, bigger and more detailed toward the right
  let x = 360 + r() * 60;
  let i = 0;
  while (x < SW + 60) {
    const right = x / SW;
    const w = (120 + r() * 110) * (0.75 + right * 0.55);
    const h = (c.style === 'ranch' ? 64 : c.style === 'row' ? 120 : 76 + r() * 70) * (0.75 + right * 0.55);
    const base = (c.water ? GY + 22 : GY) - (c.water ? 0 : 4 - right * 4);
    if (c.tree && r() < 0.55) s += tree(c.tree[0], x - 26 - r() * 20, base, (0.7 + right * 0.6), c.tree[1], r);
    const frame = c.style === 'frame' && (i % 3 === 1);
    s += homeShape(r, x, base, w, h, c, frame);
    if (c.sign && i === 2) s += sign(x + w + 16, base);
    if (c.mailbox && i === 1) s += mailbox(x + w + 18, base, c.ground);
    x += w + 28 + r() * 70;
    i++;
  }
  if (c.tree) for (let k = 0; k < 4; k++) s += tree(c.tree[0], 40 + r() * 300, (c.water ? GY + 22 : GY), 0.8 + r() * 0.4, c.tree[1], r);
  s += '</svg>';
  sceneCache[id] = s;
  return s;
}
function homeShape(r, x, base, w, h, c, frame) {
  const top = base - h;
  const wall = c.walls[Math.floor(r() * c.walls.length)];
  const roof = c.roofs[Math.floor(r() * c.roofs.length)];
  const roofH = c.style === 'modern' ? 14 : c.style === 'ranch' ? h * 0.42 : h * (0.38 + r() * 0.2);
  let s = '';
  if (frame) {
    s += '<g stroke="#F6D2B0" stroke-width="3" fill="none" opacity="0.9"><rect x="' + x.toFixed(0) + '" y="' + top.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '"/>';
    for (let sx = x + 14; sx < x + w; sx += 14) s += '<line x1="' + sx.toFixed(0) + '" y1="' + top.toFixed(0) + '" x2="' + sx.toFixed(0) + '" y2="' + base.toFixed(0) + '"/>';
    s += '<polyline points="' + (x - 6).toFixed(0) + ',' + top.toFixed(0) + ' ' + (x + w / 2).toFixed(0) + ',' + (top - roofH).toFixed(0) + ' ' + (x + w + 6).toFixed(0) + ',' + top.toFixed(0) + '"/>';
    for (let k = 1; k < 4; k++) { const px = x + (w / 4) * k; const py = top - roofH * (1 - Math.abs(px - (x + w / 2)) / (w / 2 + 6)); s += '<line x1="' + px.toFixed(0) + '" y1="' + top.toFixed(0) + '" x2="' + px.toFixed(0) + '" y2="' + py.toFixed(0) + '"/>'; }
    return s + '</g>';
  }
  if (r() < 0.45 && c.style !== 'modern') s += '<rect x="' + (x + w * 0.68).toFixed(0) + '" y="' + (top - roofH * 0.9).toFixed(0) + '" width="' + (w * 0.08).toFixed(0) + '" height="' + (roofH * 0.7).toFixed(0) + '" fill="' + roof + '"/>';
  s += '<rect x="' + x.toFixed(0) + '" y="' + top.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + (h + 2).toFixed(0) + '" fill="' + wall + '"/>';
  if (c.style === 'modern') {
    s += '<rect x="' + (x - 10).toFixed(0) + '" y="' + (top - roofH).toFixed(0) + '" width="' + (w + 20).toFixed(0) + '" height="' + roofH.toFixed(0) + '" fill="' + roof + '"/>';
  } else if (r() < 0.5 || c.style === 'ranch') {
    s += '<polygon points="' + (x - 10).toFixed(0) + ',' + top.toFixed(0) + ' ' + (x + w * 0.22).toFixed(0) + ',' + (top - roofH).toFixed(0) + ' ' + (x + w * 0.78).toFixed(0) + ',' + (top - roofH).toFixed(0) + ' ' + (x + w + 10).toFixed(0) + ',' + top.toFixed(0) + '" fill="' + roof + '"/>';
  } else {
    s += '<polygon points="' + (x - 10).toFixed(0) + ',' + top.toFixed(0) + ' ' + (x + w / 2).toFixed(0) + ',' + (top - roofH).toFixed(0) + ' ' + (x + w + 10).toFixed(0) + ',' + top.toFixed(0) + '" fill="' + roof + '"/>';
  }
  const rows = h > 110 ? 2 : 1;
  const cols = Math.max(2, Math.floor(w / 46));
  const ww = Math.min(26, w / (cols * 2.1)), wh = Math.min(30, h / (rows * 2.6));
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      if (ry === rows - 1 && cx === Math.floor(cols / 2)) continue;
      const wx = x + (w / cols) * (cx + 0.5) - ww / 2;
      const wy = top + (h / rows) * (ry + 0.32);
      const on = c.lit && r() < 0.75;
      if (on) s += '<rect x="' + (wx - 5).toFixed(0) + '" y="' + (wy - 5).toFixed(0) + '" width="' + (ww + 10).toFixed(0) + '" height="' + (wh + 10).toFixed(0) + '" fill="' + c.win + '" opacity="0.22"/>';
      s += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="' + ww.toFixed(0) + '" height="' + wh.toFixed(0) + '" fill="' + (on || !c.lit ? c.win : '#1A1530') + '" opacity="' + (on ? 1 : 0.85) + '"/>';
    }
  }
  const dw = Math.max(14, w * 0.1), dh = Math.min(h * 0.55, 46);
  const dx = x + w / 2 - dw / 2;
  s += '<rect x="' + dx.toFixed(0) + '" y="' + (base - dh).toFixed(0) + '" width="' + dw.toFixed(0) + '" height="' + dh.toFixed(0) + '" fill="' + roof + '"/>';
  if (c.lit) s += '<circle cx="' + (dx + dw + 6).toFixed(0) + '" cy="' + (base - dh * 0.7).toFixed(0) + '" r="3" fill="' + c.win + '"/>';
  return s;
}
function tree(kind, x, base, k, col, r) {
  if (kind === 'palm') {
    const h = 150 * k;
    let s = '<path d="M' + x.toFixed(0) + ' ' + base + ' q ' + (10 * k).toFixed(0) + ' ' + (-h / 2).toFixed(0) + ' ' + (4 * k).toFixed(0) + ' ' + (-h).toFixed(0) + '" stroke="' + col + '" stroke-width="' + (7 * k).toFixed(1) + '" fill="none"/>';
    const tx = x + 4 * k, ty = base - h;
    for (let a = 0; a < 7; a++) {
      const ang = (-160 + a * 30) * Math.PI / 180, L = 70 * k;
      s += '<path d="M' + tx.toFixed(0) + ' ' + ty.toFixed(0) + ' q ' + (Math.cos(ang) * L * 0.5).toFixed(0) + ' ' + (Math.sin(ang) * L * 0.5 - 18 * k).toFixed(0) + ' ' + (Math.cos(ang) * L).toFixed(0) + ' ' + (Math.sin(ang) * L + 10 * k).toFixed(0) + '" stroke="' + col + '" stroke-width="' + (5 * k).toFixed(1) + '" fill="none" stroke-linecap="round"/>';
    }
    return s;
  }
  if (kind === 'pine') {
    const h = 130 * k, w = 46 * k;
    return '<polygon points="' + x.toFixed(0) + ',' + (base - h).toFixed(0) + ' ' + (x - w).toFixed(0) + ',' + base + ' ' + (x + w).toFixed(0) + ',' + base + '" fill="' + col + '"/>';
  }
  if (kind === 'oak') {
    const h = 70 * k, w = 80 * k;
    let s = '<rect x="' + (x - 5 * k).toFixed(0) + '" y="' + (base - h).toFixed(0) + '" width="' + (10 * k).toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + col + '"/>';
    for (let i = 0; i < 5; i++) s += '<ellipse cx="' + (x + (r() - 0.5) * w).toFixed(0) + '" cy="' + (base - h - r() * 26 * k).toFixed(0) + '" rx="' + (w * (0.35 + r() * 0.25)).toFixed(0) + '" ry="' + (26 * k + r() * 10).toFixed(0) + '" fill="' + col + '"/>';
    return s;
  }
  const h = 95 * k, rad = 34 * k;
  return '<rect x="' + (x - 4 * k).toFixed(0) + '" y="' + (base - h * 0.6).toFixed(0) + '" width="' + (8 * k).toFixed(0) + '" height="' + (h * 0.6).toFixed(0) + '" fill="' + col + '"/>' +
    '<circle cx="' + x.toFixed(0) + '" cy="' + (base - h * 0.7).toFixed(0) + '" r="' + rad.toFixed(0) + '" fill="' + col + '"/>' +
    '<circle cx="' + (x + rad * 0.6).toFixed(0) + '" cy="' + (base - h * 0.55).toFixed(0) + '" r="' + (rad * 0.75).toFixed(0) + '" fill="' + col + '"/>';
}
function crane(x, base) {
  const top = base - 330;
  return '<g stroke="#F6C08A" stroke-width="4" fill="none" opacity="0.85">' +
    '<line x1="' + x + '" y1="' + base + '" x2="' + x + '" y2="' + top + '"/><line x1="' + (x + 18) + '" y1="' + base + '" x2="' + (x + 18) + '" y2="' + top + '"/>' +
    Array.from({ length: 12 }, (_, i) => '<line x1="' + x + '" y1="' + (base - i * 27) + '" x2="' + (x + 18) + '" y2="' + (base - (i + 1) * 27) + '"/>').join('') +
    '<line x1="' + (x - 120) + '" y1="' + top + '" x2="' + (x + 300) + '" y2="' + top + '"/><line x1="' + (x + 9) + '" y1="' + (top - 40) + '" x2="' + (x + 300) + '" y2="' + top + '"/>' +
    '<line x1="' + (x + 9) + '" y1="' + (top - 40) + '" x2="' + (x - 120) + '" y2="' + top + '"/><line x1="' + (x + 240) + '" y1="' + top + '" x2="' + (x + 240) + '" y2="' + (top + 120) + '"/>' +
    '<rect x="' + (x + 226) + '" y="' + (top + 120) + '" width="28" height="18" fill="#F6C08A"/></g>';
}
function sign(x, base) {
  return '<rect x="' + x + '" y="' + (base - 70) + '" width="5" height="70" fill="#F4F1EA"/><rect x="' + (x + 5) + '" y="' + (base - 66) + '" width="56" height="36" rx="3" fill="#F2A33A"/>' +
    '<rect x="' + (x + 13) + '" y="' + (base - 56) + '" width="40" height="5" fill="#2A1600" opacity="0.55"/><rect x="' + (x + 13) + '" y="' + (base - 46) + '" width="26" height="5" fill="#2A1600" opacity="0.55"/>';
}
function mailbox(x, base, col) {
  return '<rect x="' + x + '" y="' + (base - 54) + '" width="6" height="54" fill="' + col + '"/><rect x="' + (x - 14) + '" y="' + (base - 74) + '" width="34" height="22" rx="10" fill="#F4F0E6"/>' +
    '<rect x="' + (x + 14) + '" y="' + (base - 86) + '" width="4" height="18" fill="#E4572E"/><rect x="' + (x + 14) + '" y="' + (base - 86) + '" width="12" height="7" fill="#E4572E"/>';
}
function blueprint(r, u) {
  let s = '<defs><pattern id="' + u + 'm" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="1"/></pattern>' +
    '<pattern id="' + u + 'M" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#' + u + 'm)"/><path d="M100 0H0V100" fill="none" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1.2"/></pattern></defs>' +
    '<rect width="' + SW + '" height="' + SH + '" fill="#1B4F95"/><rect width="' + SW + '" height="' + SH + '" fill="url(#' + u + 'M)"/>';
  const L = 'stroke="#EAF2FF" fill="none" stroke-width="3"';
  const x = 760, y = 470, w = 640, h = 190;
  s += '<g ' + L + '>' +
    '<rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '"/>' +
    '<polyline points="' + (x - 30) + ',' + (y - h) + ' ' + (x + 200) + ',' + (y - h - 120) + ' ' + (x + w - 200) + ',' + (y - h - 120) + ' ' + (x + w + 30) + ',' + (y - h) + '"/>' +
    '<rect x="' + (x + 60) + '" y="' + (y - 120) + '" width="120" height="80"/><line x1="' + (x + 120) + '" y1="' + (y - 120) + '" x2="' + (x + 120) + '" y2="' + (y - 40) + '"/>' +
    '<rect x="' + (x + 270) + '" y="' + (y - 130) + '" width="70" height="130"/><circle cx="' + (x + 328) + '" cy="' + (y - 64) + '" r="4"/>' +
    '<rect x="' + (x + 420) + '" y="' + (y - 120) + '" width="160" height="80"/><line x1="' + (x + 500) + '" y1="' + (y - 120) + '" x2="' + (x + 500) + '" y2="' + (y - 40) + '"/>' +
    '<rect x="' + (x + 470) + '" y="' + (y - h - 150) + '" width="34" height="80"/>' +
    '<line x1="' + (x - 80) + '" y1="' + y + '" x2="' + (x + w + 80) + '" y2="' + y + '"/></g>';
  s += '<g stroke="#EAF2FF" stroke-opacity="0.7" stroke-width="1.5" fill="none">' +
    '<line x1="' + x + '" y1="' + (y + 34) + '" x2="' + (x + w) + '" y2="' + (y + 34) + '"/><line x1="' + x + '" y1="' + (y + 24) + '" x2="' + x + '" y2="' + (y + 44) + '"/><line x1="' + (x + w) + '" y1="' + (y + 24) + '" x2="' + (x + w) + '" y2="' + (y + 44) + '"/>' +
    '<line x1="' + (x + w + 50) + '" y1="' + (y - h) + '" x2="' + (x + w + 50) + '" y2="' + y + '"/><line x1="' + (x + w + 40) + '" y1="' + (y - h) + '" x2="' + (x + w + 60) + '" y2="' + (y - h) + '"/><line x1="' + (x + w + 40) + '" y1="' + y + '" x2="' + (x + w + 60) + '" y2="' + y + '"/></g>' +
    '<text x="' + (x + w / 2) + '" y="' + (y + 60) + '" fill="#EAF2FF" fill-opacity="0.8" font-family="IBM Plex Mono, monospace" font-size="20" text-anchor="middle">64\'-0"</text>' +
    '<text x="' + (x + w + 70) + '" y="' + (y - h / 2) + '" fill="#EAF2FF" fill-opacity="0.8" font-family="IBM Plex Mono, monospace" font-size="20">10\'-0"</text>' +
    '<g stroke="#EAF2FF" stroke-opacity="0.5" fill="none" stroke-width="2"><rect x="80" y="400" width="300" height="150"/><line x1="80" y1="450" x2="380" y2="450"/><line x1="230" y1="450" x2="230" y2="550"/></g>' +
    '<text x="96" y="434" fill="#EAF2FF" fill-opacity="0.75" font-family="IBM Plex Mono, monospace" font-size="18">FRONT ELEVATION</text>';
  return s;
}

// Everything the player sees: the night-market stall, the order board, the
// counter bins, the wok, the serving plates and every screen. All art is drawn
// in code — no images, no fonts loaded from anywhere.

import { FIELD, FONT, INGREDIENTS, LAYOUT, MAX_PLATES, PALETTE, RECIPES, SHIFT_SECONDS } from './config.js';
import { binRect, customerRect, dumpRect, plateRect, wokRect } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '600') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id);
}

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

/** One ingredient's icon, drawn at (cx, cy) with radius r. */
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  // The bowl.
  ctx.fillStyle = '#3a2b3f';
  ctx.beginPath();
  ctx.arc(0, r * 0.15, r * 0.95, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#241a2e';
  ctx.lineWidth = 2;
  ctx.stroke();
  switch (id) {
    case 'nasi':
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.15, r * 0.42, Math.PI, 0);
      ctx.arc(r * 0.25, -r * 0.2, r * 0.4, Math.PI, 0);
      ctx.fill();
      break;
    case 'mie':
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = r * 0.18;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.1 + i * r * 0.28);
        ctx.quadraticCurveTo(0, -r * 0.35 + i * r * 0.28, r * 0.7, -r * 0.1 + i * r * 0.28);
        ctx.stroke();
      }
      break;
    case 'telur':
      ctx.fillStyle = '#fdf3d0';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.1, r * 0.72, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0a92e';
      ctx.beginPath();
      ctx.arc(r * 0.12, -r * 0.12, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ayam':
      ctx.fillStyle = '#e07840';
      ctx.beginPath();
      ctx.arc(-r * 0.1, -r * 0.1, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5efe0';
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.moveTo(r * 0.3, r * 0.25);
      ctx.lineTo(r * 0.72, r * 0.6);
      ctx.stroke();
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.arc(r * 0.76, r * 0.64, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'sayur':
      ctx.fillStyle = '#58b368';
      for (const [dx, dy, rot] of [[-0.3, 0, -0.5], [0.25, -0.1, 0.4], [0, -0.35, 0]]) {
        ctx.save();
        ctx.translate(dx * r, dy * r);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'sambal':
      ctx.fillStyle = '#e5383b';
      ctx.beginPath();
      ctx.arc(0, -r * 0.15, r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8f1d1d';
      for (const [dx, dy] of [[-0.25, -0.3], [0.2, -0.05], [0, -0.45]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'kecap':
      ctx.fillStyle = '#5b3a29';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.1, r * 0.45, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2c94c';
      ctx.fillRect(-r * 0.45, -r * 0.35, r * 0.9, r * 0.22);
      break;
    default:
      break;
  }
  ctx.restore();
}

/** A finished dish drawn on a plate at (cx, cy) with radius r. */
function drawDish(ctx, recipe, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#f5efe0';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cbbf9f';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = recipe.color;
  ctx.beginPath();
  ctx.arc(0, -r * 0.08, r * 0.62, 0, Math.PI * 2);
  ctx.fill();
  // Garnish: a few dots of the dish's own ingredients.
  ctx.fillStyle = '#58b368';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.35, r * 0.12, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e5383b';
  ctx.beginPath();
  ctx.arc(0, -r * 0.5, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A customer's face: skin, hair, shirt and a mood (waiting/happy/angry). */
function drawCustomer(ctx, c, x, y, w, h, t) {
  const bob = Math.sin(t * 2 + c.bob) * 2;
  const cx = x + 52;
  const cy = y + 52 + bob;
  // Body / shirt.
  ctx.fillStyle = c.shirt;
  rr(ctx, x + 18, y + 84, 68, 34, 10);
  ctx.fill();
  // Head.
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  // Hair.
  ctx.fillStyle = c.hair;
  ctx.beginPath();
  ctx.arc(cx, cy - 8, 30, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - 22, cy - 2, 8, 0, Math.PI * 2);
  ctx.arc(cx + 22, cy - 2, 8, 0, Math.PI * 2);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = '#1d1d1d';
  const eyeY = cy - 2;
  if (c.mood === 'angry') {
    ctx.fillRect(cx - 18, eyeY - 4, 12, 3);
    ctx.fillRect(cx + 6, eyeY - 4, 12, 3);
    ctx.save();
    ctx.translate(cx - 12, eyeY - 6);
    ctx.rotate(0.4);
    ctx.fillRect(-6, -1.5, 12, 3);
    ctx.restore();
    ctx.save();
    ctx.translate(cx + 12, eyeY - 6);
    ctx.rotate(-0.4);
    ctx.fillRect(-6, -1.5, 12, 3);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(cx - 11, eyeY, 3.4, 0, Math.PI * 2);
    ctx.arc(cx + 11, eyeY, 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Mouth.
  ctx.strokeStyle = '#1d1d1d';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (c.mood === 'happy') {
    ctx.arc(cx, cy + 8, 11, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (c.mood === 'angry') {
    ctx.arc(cx, cy + 22, 10, 1.15 * Math.PI, 1.85 * Math.PI);
  } else {
    ctx.moveTo(cx - 8, cy + 14);
    ctx.lineTo(cx + 8, cy + 14);
  }
  ctx.stroke();
}

function drawPatienceBar(ctx, c, x, y, w) {
  const frac = Math.max(0, c.patience / c.maxPatience);
  const color = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#ff9d2e' : '#e5383b';
  ctx.fillStyle = '#17101f';
  rr(ctx, x, y, w, 10, 5);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(8, w * frac), 10, 5);
    ctx.fill();
  }
  if (frac <= 0.25 && c.mood === 'waiting') {
    ctx.fillStyle = '#e5383b';
    ctx.font = `700 13px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('BURU-BURU!', x + w, y - 12);
  }
}

function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function drawSky(t) {
    const g = ctx.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.6, PALETTE.skyMid);
    g.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, 300);
    // Stars.
    ctx.fillStyle = 'rgba(253, 243, 208, 0.8)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 173) % 1280;
      const y = (i * 97) % 150;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i));
      ctx.globalAlpha = tw * 0.8;
      ctx.fillRect(x, y, 2.5, 2.5);
    }
    ctx.globalAlpha = 1;
    // Paper lanterns strung across the stall, below the top bar.
    for (let i = 0; i < 9; i++) {
      const x = 70 + i * 145;
      const sway = Math.sin(t * 0.9 + i * 1.3) * 4;
      const y = 96 + Math.sin(i * 2.1) * 8;
      ctx.strokeStyle = '#241a2e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 64);
      ctx.lineTo(x + sway, y - 14);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? '#e5383b' : '#f2c94c';
      ctx.beginPath();
      ctx.ellipse(x + sway, y, 15, 19, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 224, 102, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x + sway, y, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTopBar(state, timeLeft, best) {
    const bar = LAYOUT.topBar;
    ctx.fillStyle = 'rgba(23, 16, 31, 0.85)';
    ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
    text(ctx, 'WARUNG SENJA', 24, 33, 26, PALETTE.stallAwning, 'left', '800');
    text(ctx, 'Night Market Rush', 272, 36, 14, PALETTE.muted);
    // Shift clock.
    const cx = 640;
    text(ctx, `SHIFT ${formatClock(timeLeft)}`, cx, 22, 20, PALETTE.text, 'center', '700');
    const frac = Math.max(0, timeLeft / SHIFT_SECONDS);
    ctx.fillStyle = '#17101f';
    rr(ctx, cx - 130, 38, 260, 10, 5);
    ctx.fill();
    ctx.fillStyle = frac > 0.33 ? PALETTE.coin : PALETTE.bad;
    rr(ctx, cx - 130, 38, Math.max(8, 260 * frac), 10, 5);
    ctx.fill();
    // Coins, hearts, combo.
    text(ctx, `🪙 ${state.coins}`, 1000, 26, 22, PALETTE.coin, 'right', '800');
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < state.hearts ? PALETTE.heart : '#3a2b3f';
      const hx = 1030 + i * 28;
      ctx.beginPath();
      ctx.arc(hx, 24, 8, 0, Math.PI * 2);
      ctx.arc(hx + 9, 24, 8, 0, Math.PI * 2);
      ctx.moveTo(hx - 7, 28);
      ctx.lineTo(hx + 16, 28);
      ctx.lineTo(hx + 4.5, 40);
      ctx.closePath();
      ctx.fill();
    }
    if (state.combo >= 2) {
      text(ctx, `KOMBO x${Math.min(state.combo, 3)}`, 1000, 54, 14, PALETTE.good, 'right', '800');
    } else if (best > 0) {
      text(ctx, `Terbaik: ${best}`, 1000, 54, 13, PALETTE.muted, 'right');
    }
    // Rush hour lives in the top bar so it never covers the order board.
    if (state.rush) {
      ctx.fillStyle = 'rgba(229, 56, 59, 0.95)';
      rr(ctx, 786, 14, 122, 30, 8);
      ctx.fill();
      text(ctx, '⚡ JAM SIBUK', 847, 30, 14, '#fdf3d0', 'center', '800');
    }
  }

  function drawBoard(state, t) {
    const b = LAYOUT.board;
    ctx.fillStyle = PALETTE.board;
    rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.lineWidth = 2;
    rr(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, 14);
    ctx.stroke();
    if (state.customers.length === 0) {
      text(ctx, 'Belum ada pelanggan — siap-siap!', b.x + 16, b.y + b.h / 2, 18, PALETTE.muted, 'left', '600');
      return;
    }
    state.customers.forEach((c, i) => {
      const r = customerRect(i);
      ctx.fillStyle = i % 2 ? '#2c2138' : '#2a1e33';
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      if (c.mood === 'angry') {
        ctx.strokeStyle = PALETTE.bad;
        ctx.lineWidth = 2;
        rr(ctx, r.x, r.y, r.w, r.h, 10);
        ctx.stroke();
      }
      drawCustomer(ctx, c, r.x + 6, r.y + 4, 104, 120, t);
      const tx = r.x + 112;
      text(ctx, c.recipe.name, tx, r.y + 20, 17, PALETTE.text, 'left', '800');
      text(ctx, `${c.recipe.price} koin`, tx, r.y + 42, 13, PALETTE.coin, 'left', '700');
      c.recipe.needs.forEach((id, j) => {
        drawIngredientIcon(ctx, id, tx + 16 + j * 34, r.y + 66, 13);
      });
      drawPatienceBar(ctx, c, tx, r.y + 100, r.w - 128);
    });
  }

  function drawBins(state) {
    const b = LAYOUT.bins;
    INGREDIENTS.forEach((ing, i) => {
      const r = binRect(i);
      const inWok = state.wok.filter((item) => item.id === ing.id).length;
      ctx.fillStyle = '#3a2b3f';
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fill();
      ctx.strokeStyle = inWok > 0 ? PALETTE.coin : PALETTE.panelEdge;
      ctx.lineWidth = inWok > 0 ? 3 : 2;
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.stroke();
      drawIngredientIcon(ctx, ing.id, r.x + r.w / 2, r.y + 48, 30);
      text(ctx, ing.name, r.x + r.w / 2, r.y + 96, 15, PALETTE.text, 'center', '700');
      text(ctx, `${i + 1}`, r.x + 10, r.y + 14, 12, PALETTE.muted, 'left', '700');
      if (inWok > 0) {
        ctx.fillStyle = PALETTE.coin;
        ctx.beginPath();
        ctx.arc(r.x + r.w - 16, r.y + 16, 11, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, String(inWok), r.x + r.w - 16, r.y + 17, 12, '#17101f', 'center', '800');
      }
    });
  }

  function drawWok(state, t) {
    const w = wokRect();
    // Stove.
    ctx.fillStyle = PALETTE.stallWoodDark;
    rr(ctx, w.x + 20, w.y + 210, w.w - 40, 70, 10);
    ctx.fill();
    // The wok itself.
    ctx.fillStyle = PALETTE.wok;
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + 130, 130, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a5060';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + 130, 130, 62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#1a1e28';
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + 126, 112, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ingredients in the wok, each with its cook ring.
    state.wok.forEach((item, i) => {
      const cols = 2;
      const ix = w.x + 95 + (i % cols) * 110;
      const iy = w.y + 108 + Math.floor(i / cols) * 44;
      const ing = ingredientById(item.id);
      ctx.globalAlpha = item.state === 'burnt' ? 0.55 : 1;
      drawIngredientIcon(ctx, item.id, ix, iy, 24);
      ctx.globalAlpha = 1;
      // Cook progress ring.
      ctx.strokeStyle = 'rgba(23, 16, 31, 0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(ix, iy, 31, 0, Math.PI * 2);
      ctx.stroke();
      const frac = item.state === 'done' || item.state === 'burnt' ? 1 : item.progress;
      ctx.strokeStyle = item.state === 'burnt' ? PALETTE.bad : item.state === 'done' ? PALETTE.good : PALETTE.coin;
      ctx.beginPath();
      ctx.arc(ix, iy, 31, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      if (item.state === 'done') text(ctx, '✓', ix, iy - 40, 15, PALETTE.good, 'center', '800');
      if (item.state === 'burnt') text(ctx, 'GOSONG!', ix, iy - 40, 13, PALETTE.bad, 'center', '800');
    });
    if (state.wok.length === 0) {
      text(ctx, 'Wok kosong', w.x + w.w / 2, w.y + 126, 15, '#6b6f7d', 'center');
    }
    // Flame licking up the sides of the wok, drawn last so it shows.
    const flameH = 32 + Math.sin(t * 9) * 5 + (state.wok.length ? 10 : 0);
    ctx.fillStyle = PALETTE.flame;
    ctx.beginPath();
    ctx.moveTo(w.x + 34, w.y + 212);
    for (let i = 0; i <= 10; i++) {
      const fx = w.x + 34 + (i / 10) * (w.w - 68);
      const fy = w.y + 212 - Math.abs(Math.sin(i * 1.7 + t * 7)) * flameH;
      ctx.lineTo(fx, fy);
    }
    ctx.lineTo(w.x + w.w - 34, w.y + 212);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.flameCore;
    ctx.beginPath();
    ctx.ellipse(w.x + w.w / 2, w.y + 202, 70, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Steam particles.
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * 0.5;
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (state.burnt) {
      text(ctx, 'Gosong! Buang wok (X)', w.x + w.w / 2, w.y + 252, 15, PALETTE.bad, 'center', '800');
    }
  }

  function drawPlates(state) {
    const p = LAYOUT.plates;
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.fill();
    for (let i = 0; i < MAX_PLATES; i++) {
      const r = plateRect(i);
      const plate = state.plates[i];
      ctx.fillStyle = '#241a2e';
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fill();
      if (plate) {
        drawDish(ctx, plate.recipe, r.x + 44, r.y + r.h / 2, 26);
        text(ctx, plate.recipe.name, r.x + 82, r.y + r.h / 2 - 10, 15, PALETTE.text, 'left', '800');
        text(ctx, 'siap disajikan', r.x + 82, r.y + r.h / 2 + 12, 12, PALETTE.good, 'left', '700');
        if (state.selectedPlate === i) {
          ctx.strokeStyle = PALETTE.coin;
          ctx.lineWidth = 3;
          rr(ctx, r.x, r.y, r.w, r.h, 10);
          ctx.stroke();
          text(ctx, '➤ pilih pelanggan', r.x + 82, r.y + r.h / 2 + 30, 12, PALETTE.coin, 'left', '700');
        }
      } else {
        text(ctx, '— kosong —', r.x + r.w / 2, r.y + r.h / 2, 14, '#6b6f7d', 'center');
      }
    }
  }

  function drawBottom(state) {
    const b = LAYOUT.bottom;
    // The wooden counter front.
    ctx.fillStyle = PALETTE.stallWood;
    rr(ctx, b.x, b.y, b.w, 92, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.stallWoodDark;
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(b.x + 14 + i * 104, b.y + 8, 4, 76);
    }
    // Wok contents line.
    const contents = state.wok.map((item) => {
      const ing = ingredientById(item.id);
      const mark = item.state === 'done' ? ' ✓' : item.state === 'burnt' ? ' ✗' : '';
      return ing.name + mark;
    });
    const line = state.wok.length
      ? `Di wok: ${contents.join(' + ')}${state.wok.every((item) => item.state === 'done') ? ' — semua matang, sajikan!' : ''}`
      : 'Di wok: (kosong) — klik bahan 1–7 untuk memasak';
    text(ctx, line, b.x + 16, b.y + 118, 16, PALETTE.text, 'left', '600');
    // Dump button.
    const d = dumpRect();
    ctx.fillStyle = state.wok.length ? PALETTE.bad : '#3a2b3f';
    rr(ctx, d.x, d.y, d.w, d.h, 10);
    ctx.fill();
    text(ctx, 'BUANG WOK [X]', d.x + d.w / 2, d.y + d.h / 2, 16, '#fdf3d0', 'center', '800');
    // Hints.
    text(ctx, 'Klik bahan untuk memasak • Klik piring lalu pelanggan untuk menyajikan • P jeda • M bisu', b.x + 16, b.y + 140, 13, PALETTE.muted, 'left');
  }

  function drawFloaters(state) {
    for (const f of state.floaters) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life / (f.maxLife * 0.6)));
      text(ctx, f.text, f.x, f.y, 20, f.color, 'center', '800');
    }
    ctx.globalAlpha = 1;
  }

  function drawTitle(state, best, t) {
    ctx.fillStyle = 'rgba(23, 16, 31, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'WARUNG SENJA', 640, 170, 72, PALETTE.stallAwning, 'center', '800');
    text(ctx, '— Night Market Rush —', 640, 228, 24, PALETTE.text, 'center', '600');
    text(ctx, 'Kamu juru masak di warung pinggir jalan. Pelanggan datang dengan pesanan,', 640, 300, 19, PALETTE.text, 'center');
    text(ctx, 'masak di wok sebelum mereka kehabisan sabar, sajikan selagi hangat!', 640, 328, 19, PALETTE.text, 'center');
    // How to play card.
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, 340, 368, 600, 150, 14);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    rr(ctx, 340, 368, 600, 150, 14);
    ctx.stroke();
    const lines = [
      '1. Klik bahan (atau tekan 1–7) untuk memasukkannya ke wok.',
      '2. Tunggu sampai semua bahan matang — jangan sampai gosong!',
      '3. Hidangan jadi naik ke piring saji. Klik piring, lalu pelanggan.',
      '4. Sajikan cepat untuk tip besar. Tiga pelanggan kabur = shift usai.',
    ];
    lines.forEach((line, i) => text(ctx, line, 370, 396 + i * 30, 16, PALETTE.text, 'left', '600'));
    if (best > 0) text(ctx, `Skor terbaik: ${best} koin`, 640, 548, 17, PALETTE.coin, 'center', '700');
    const pulse = 0.7 + 0.3 * Math.sin(t * 3);
    ctx.globalAlpha = pulse;
    text(ctx, 'Klik atau tekan Spasi untuk mulai', 640, 596, 22, PALETTE.stallAwning, 'center', '800');
    ctx.globalAlpha = 1;
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(23, 16, 31, 0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'JEDA', 640, 330, 56, PALETTE.text, 'center', '800');
    text(ctx, 'Tekan P atau Spasi untuk lanjut', 640, 390, 20, PALETTE.muted, 'center');
  }

  function drawOver(state, best, isNewBest) {
    ctx.fillStyle = 'rgba(23, 16, 31, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, 340, 150, 600, 400, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.lineWidth = 2;
    rr(ctx, 340, 150, 600, 400, 16);
    ctx.stroke();
    text(ctx, 'SHIFT SELESAI', 640, 200, 40, PALETTE.stallAwning, 'center', '800');
    text(ctx, state.overReason, 640, 242, 16, PALETTE.muted, 'center');
    const rows = [
      ['Koin didapat', `${state.coins}`],
      ['Hidangan disajikan', `${state.served}`],
      ['Pelanggan kabur', `${state.lost}`],
      ['Kombo terbaik', `x${Math.min(state.bestCombo, COMBO_CAP)}`],
      ['Skor terbaik', `${best}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 292 + i * 34;
      text(ctx, label, 400, y, 18, PALETTE.text, 'left', '600');
      text(ctx, value, 880, y, 18, PALETTE.coin, 'right', '800');
    });
    if (isNewBest) text(ctx, '★ SKOR TERBAIK BARU! ★', 640, 478, 20, PALETTE.coin, 'center', '800');
    text(ctx, 'Tekan Spasi untuk main lagi', 640, 516, 18, PALETTE.text, 'center', '700');
  }

  function draw(state, screen, best, isNewBest, timeLeft, t) {
    ctx.save();
    if (state.shake > 0) {
      const mag = state.shake * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    drawSky(t);
    // The stall: roof + awning over the kitchen area.
    ctx.fillStyle = PALETTE.stallRoof;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(640, 150);
    ctx.lineTo(1280, 210);
    ctx.lineTo(1280, 226);
    ctx.lineTo(0, 226);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.stallAwning;
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(i * 80, 214, 40, 12);
    }
    drawTopBar(state, timeLeft, best);
    drawBoard(state, t);
    drawBins(state);
    drawWok(state, t);
    drawPlates(state);
    drawBottom(state);
    drawFloaters(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best, t);
    else if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best, isNewBest);
    ctx.restore();
  }

  return { draw, drawIngredientIcon, drawDish };
}

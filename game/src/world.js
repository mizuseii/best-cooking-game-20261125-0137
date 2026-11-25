// The game state and its rules: customers arrive with orders, ingredients cook
// in the wok, matching recipes plate up, and plates are served before patience
// runs out. Everything here is pure state — drawing lives in render.js.

import {
  BURN_AFTER_COOKED, COMBO_CAP, FOUR_INGREDIENT_AFTER, HEARTS, INGREDIENTS,
  LAYOUT, MAX_CUSTOMERS, MAX_PLATES, PATIENCE, RECIPES, RUSH_AT_SECONDS_LEFT,
  RUSH_DURATION, SHIFT_SECONDS, SPAWN, TIP_SHARE, WOK_SLOTS, WRONG_PATIENCE_COST,
} from './config.js';
import { pick, shuffle } from './random.js';

export const EVENT_SERVE = 1;
export const EVENT_WRONG = 2;
export const EVENT_LEAVE = 4;
export const EVENT_PLATE = 8;
export const EVENT_OVER = 16;
export const EVENT_ARRIVE = 32;
export const EVENT_BURN = 64;
export const EVENT_DUMP = 128;
export const EVENT_ADD = 256;

const SKINS = ['#f2c89b', '#d9a066', '#a06b3f', '#8a5a2e', '#f7d7b0'];
const SHIRTS = ['#e5383b', '#2e86de', '#58b368', '#f2c94c', '#9b59b6', '#e07840', '#4fc3f7'];
const HAIRS = ['#1d1d1d', '#4a2c17', '#8f8f8f', '#e5383b', '#2e7d32'];

/** The rectangle of ingredient bin i (0-6), in logical pixels. */
export function binRect(i) {
  const b = LAYOUT.bins;
  const col = i % b.cols;
  const row = Math.floor(i / b.cols);
  return {
    x: b.x + col * (b.binW + b.gap),
    y: b.y + row * (b.binH + b.gap),
    w: b.binW,
    h: b.binH,
  };
}

/** The rectangle of serving-plate slot i (0-2). */
export function plateRect(i) {
  const p = LAYOUT.plates;
  const h = (p.h - 16) / MAX_PLATES;
  return { x: p.x + 8, y: p.y + 8 + i * h, w: p.w - 16, h: h - 8 };
}

/** The rectangle of customer card i (0-3) on the order board. */
export function customerRect(i) {
  const b = LAYOUT.board;
  return {
    x: b.x + i * (b.cardW + b.gap),
    y: b.y,
    w: b.cardW,
    h: b.h,
  };
}

/** The rectangle of the wok. */
export function wokRect() {
  const w = LAYOUT.wok;
  return { x: w.x, y: w.y, w: w.w, h: w.h };
}

/** The rectangle of the dump-wok button in the bottom strip. */
export function dumpRect() {
  const b = LAYOUT.bottom;
  return { x: b.x + b.w - 210, y: b.y + 28, w: 190, h: 56 };
}

function inside(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createWorld(random) {
  const state = {
    screen: 'title',
    elapsed: 0,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    customers: [],
    wok: [],
    plates: [],
    selectedPlate: -1,
    spawnTimer: 4,
    rush: false,
    rushTimer: 0,
    rushShown: false,
    burnt: false,
    particles: [],
    floaters: [],
    nextCustomerId: 1,
    overReason: '',
    shake: 0,
  };

  function difficulty() {
    return Math.min(1, state.elapsed / SHIFT_SECONDS);
  }

  function pickRecipe() {
    const d = difficulty();
    const pool = RECIPES.filter((r) => r.needs.length === 3 || state.elapsed >= FOUR_INGREDIENT_AFTER);
    // Later in the shift the pricier dishes show up more often.
    const weighted = [];
    for (const r of pool) {
      const w = 1 + (r.price - 12) * 0.15 * d;
      for (let i = 0; i < Math.max(1, Math.round(w * 2)); i++) weighted.push(r);
    }
    return pick(random, weighted);
  }

  function spawnCustomer() {
    if (state.customers.length >= MAX_CUSTOMERS) return;
    const d = difficulty();
    const maxPatience = lerp(PATIENCE.start, PATIENCE.end, d);
    const recipe = pickRecipe();
    state.customers.push({
      id: state.nextCustomerId++,
      recipe,
      patience: maxPatience,
      maxPatience,
      mood: 'waiting',
      moodTimer: 0,
      skin: pick(random, SKINS),
      shirt: pick(random, SHIRTS),
      hair: pick(random, HAIRS),
      bob: random() * Math.PI * 2,
    });
    return true;
  }

  function addFloater(x, y, text, color) {
    state.floaters.push({ x, y, text, color, life: 1.4, maxLife: 1.4 });
  }

  function addSteam(x, y) {
    state.particles.push({
      x: x + (random() - 0.5) * 60,
      y,
      vx: (random() - 0.5) * 8,
      vy: -26 - random() * 18,
      life: 0.9 + random() * 0.5,
      maxLife: 1.4,
      size: 5 + random() * 7,
    });
  }

  function wokMatchesRecipe() {
    if (state.wok.length === 0) return null;
    if (state.wok.some((item) => item.state !== 'done')) return null;
    const ids = state.wok.map((item) => item.id).sort();
    for (const recipe of RECIPES) {
      const needs = recipe.needs.slice().sort();
      if (ids.length === needs.length && ids.every((id, i) => id === needs[i])) return recipe;
    }
    return null;
  }

  function tryPlate() {
    const recipe = wokMatchesRecipe();
    if (!recipe || state.plates.length >= MAX_PLATES) return 0;
    state.plates.push({ recipe });
    state.wok = [];
    state.burnt = false;
    state.selectedPlate = state.plates.length - 1;
    return EVENT_PLATE;
  }

  function serve(plateIndex, customerIndex) {
    const plate = state.plates[plateIndex];
    const customer = state.customers[customerIndex];
    if (!plate || !customer || customer.mood !== 'waiting') return 0;
    if (plate.recipe.id !== customer.recipe.id) {
      customer.patience *= 1 - WRONG_PATIENCE_COST;
      customer.mood = 'angry';
      customer.moodTimer = 0.9;
      state.combo = 0;
      const r = customerRect(customerIndex);
      addFloater(r.x + r.w / 2, r.y + 30, 'Salah!', '#e5383b');
      return EVENT_WRONG;
    }
    const mult = 1 + Math.min(state.combo, COMBO_CAP - 1) * 0.5;
    const tip = Math.round(plate.recipe.price * TIP_SHARE * (customer.patience / customer.maxPatience));
    const earned = Math.round(plate.recipe.price * mult) + tip;
    state.coins += earned;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const r = customerRect(customerIndex);
    addFloater(r.x + r.w / 2, r.y + 24, `+${earned} koin`, '#f2c94c');
    if (state.combo >= 2) {
      addFloater(r.x + r.w / 2, r.y + 52, `Kombo x${Math.min(state.combo, COMBO_CAP)}!`, '#58b368');
    }
    state.plates.splice(plateIndex, 1);
    state.customers.splice(customerIndex, 1);
    state.selectedPlate = -1;
    return EVENT_SERVE;
  }

  function dumpWok() {
    if (state.wok.length === 0) return 0;
    state.wok = [];
    state.burnt = false;
    const w = wokRect();
    addFloater(w.x + w.w / 2, w.y + 20, 'Wok dibuang', '#b8a88f');
    return EVENT_DUMP;
  }

  function endShift(reason) {
    if (state.screen !== 'play') return 0;
    state.screen = 'over';
    state.overReason = reason;
    return EVENT_OVER;
  }

  function handleClick(x, y) {
    if (state.screen !== 'play') return 0;
    // Ingredient bins: drop the ingredient into the wok.
    for (let i = 0; i < INGREDIENTS.length; i++) {
      if (inside(binRect(i), x, y)) {
        if (state.wok.length >= WOK_SLOTS) return 0;
        const ing = INGREDIENTS[i];
        state.wok.push({ id: ing.id, cook: ing.cook, progress: 0, state: 'cooking', burnTimer: 0 });
        const w = wokRect();
        addSteam(w.x + w.w / 2, w.y + 90);
        return EVENT_ADD;
      }
    }
    // Dump button: empty a burnt or wrong wok.
    if (inside(dumpRect(), x, y)) return dumpWok();
    // Plates: select one to serve (click again to deselect).
    for (let i = 0; i < state.plates.length; i++) {
      if (inside(plateRect(i), x, y)) {
        state.selectedPlate = state.selectedPlate === i ? -1 : i;
        return 0;
      }
    }
    // Customers: serve the selected plate to the one clicked.
    if (state.selectedPlate >= 0) {
      for (let i = 0; i < state.customers.length; i++) {
        if (inside(customerRect(i), x, y)) return serve(state.selectedPlate, i);
      }
    }
    return 0;
  }

  function step(dt, clicks, ingredientKey) {
    let events = 0;
    if (state.screen === 'title') {
      // The stall idles behind the title: steam drifts, lanterns glow.
      if (random() < dt * 2) addSteam(790, 330);
    }
    if (state.screen !== 'play') {
      // Floaters and particles still animate on every screen.
      updateAmbient(dt);
      return events;
    }
    for (const click of clicks) events |= handleClick(click.x, click.y);
    if (ingredientKey >= 0 && ingredientKey < INGREDIENTS.length) {
      if (state.wok.length < WOK_SLOTS) {
        const ing = INGREDIENTS[ingredientKey];
        state.wok.push({ id: ing.id, cook: ing.cook, progress: 0, state: 'cooking', burnTimer: 0 });
        events |= EVENT_ADD;
      }
    }

    state.elapsed += dt;
    const timeLeft = SHIFT_SECONDS - state.elapsed;

    // Rush hour: the last minute gets twice the customers.
    if (!state.rushShown && timeLeft <= RUSH_AT_SECONDS_LEFT) {
      state.rush = true;
      state.rushTimer = RUSH_DURATION;
      state.rushShown = true;
    }
    if (state.rush) {
      state.rushTimer -= dt;
      if (state.rushTimer <= 0) state.rush = false;
    }

    // New customers arrive on a timer that quickens through the shift.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const interval = lerp(SPAWN.start, SPAWN.end, difficulty()) * (state.rush ? 0.55 : 1);
      state.spawnTimer = interval;
      if (spawnCustomer()) events |= EVENT_ARRIVE;
    }

    // Patience drains; a customer with none storms off.
    for (let i = state.customers.length - 1; i >= 0; i--) {
      const c = state.customers[i];
      if (c.mood === 'waiting') {
        c.patience -= dt;
        if (c.patience <= 0) {
          state.customers.splice(i, 1);
          state.lost += 1;
          state.hearts -= 1;
          state.combo = 0;
          state.shake = 0.4;
          events |= EVENT_LEAVE;
          if (state.hearts <= 0) events |= endShift('Tiga pelanggan kabur — shift berakhir lebih awal.');
        }
      } else {
        c.moodTimer -= dt;
        if (c.moodTimer <= 0) c.mood = 'waiting';
      }
    }

    // The wok cooks: each ingredient ripens, then burns if left too long.
    // A finished dish waiting for a free plate does not burn.
    const dishReady = wokMatchesRecipe() !== null;
    let cooking = false;
    for (const item of state.wok) {
      if (item.state === 'cooking') {
        cooking = true;
        item.progress += dt / item.cook;
        if (item.progress >= 1) {
          item.progress = 1;
          item.state = 'done';
          item.burnTimer = 0;
        }
      } else if (item.state === 'done' && !dishReady) {
        item.burnTimer += dt;
        if (item.burnTimer >= BURN_AFTER_COOKED) {
          item.state = 'burnt';
          state.burnt = true;
          state.shake = 0.25;
          events |= EVENT_BURN;
        }
      }
    }
    if (cooking && random() < dt * 14) {
      const w = wokRect();
      addSteam(w.x + w.w / 2, w.y + 90);
    }
    if (!state.burnt) events |= tryPlate();

    updateAmbient(dt);
    if (state.shake > 0) state.shake -= dt;

    if (state.elapsed >= SHIFT_SECONDS) {
      events |= endShift('Shift selesai! Waktunya tutup warung.');
    }
    return events;
  }

  function updateAmbient(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
    for (let i = state.floaters.length - 1; i >= 0; i--) {
      const f = state.floaters[i];
      f.y -= 34 * dt;
      f.life -= dt;
      if (f.life <= 0) state.floaters.splice(i, 1);
    }
  }

  function reset() {
    state.screen = 'play';
    state.elapsed = 0;
    state.coins = 0;
    state.served = 0;
    state.lost = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = HEARTS;
    state.customers = [];
    state.wok = [];
    state.plates = [];
    state.selectedPlate = -1;
    state.spawnTimer = 3;
    state.rush = false;
    state.rushTimer = 0;
    state.rushShown = false;
    state.burnt = false;
    state.particles = [];
    state.floaters = [];
    state.overReason = '';
    state.shake = 0;
    // The first two customers arrive together so the board is never empty.
    spawnCustomer();
    spawnCustomer();
  }

  return {
    state,
    step,
    reset,
    spawnCustomer,
    timeLeft() { return Math.max(0, SHIFT_SECONDS - state.elapsed); },
    level() { return 1 + Math.floor(state.elapsed / 30); },
    /** True while the wok holds a finished dish waiting for a free plate. */
    dishWaiting() {
      return wokMatchesRecipe() !== null && state.plates.length >= MAX_PLATES;
    },
  };
}

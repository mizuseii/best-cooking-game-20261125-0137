// Every tuning number, colour and recipe in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds. */
export const SHIFT_SECONDS = 150;

/** Hearts lost when a customer storms off; at zero the shift ends early. */
export const HEARTS = 3;

/** Seconds a customer waits before leaving, at shift start and at its hardest. */
export const PATIENCE = { start: 48, end: 30 };

/** Seconds between new customers arriving, at shift start and at its hardest. */
export const SPAWN = { start: 13, end: 6.5 };

/** At most this many customers wait at the counter at once. */
export const MAX_CUSTOMERS = 4;

/** At most this many finished plates wait on the serving counter. */
export const MAX_PLATES = 3;

/** At most this many ingredients fit in the wok at once. */
export const WOK_SLOTS = 4;

/** A wrong dish costs the customer this share of their remaining patience. */
export const WRONG_PATIENCE_COST = 0.3;

/** Tip is this share of the dish price, scaled by the patience still left. */
export const TIP_SHARE = 0.5;

/** Combo multiplier caps here (x1, x2, x3). */
export const COMBO_CAP = 3;

/** A rush hour starts with this many seconds left on the shift clock. */
export const RUSH_AT_SECONDS_LEFT = 60;
export const RUSH_DURATION = 15;

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'warung-senja.best';

/** The seven ingredients on the counter, in bin order (keys 1-7). */
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',   short: 'Nasi',  color: '#f5efe0', dark: '#cbbf9f', cook: 2.2 },
  { id: 'mie',    name: 'Mie',    short: 'Mie',   color: '#f2c94c', dark: '#b98a1d', cook: 2.0 },
  { id: 'telur',  name: 'Telur',  short: 'Telur', color: '#fdf3d0', dark: '#e0a92e', cook: 2.6 },
  { id: 'ayam',   name: 'Ayam',   short: 'Ayam',  color: '#e07840', dark: '#9c4a1e', cook: 3.4 },
  { id: 'sayur',  name: 'Sayur',  short: 'Sayur', color: '#58b368', dark: '#2e7d32', cook: 1.8 },
  { id: 'sambal', name: 'Sambal', short: 'Sambal', color: '#e5383b', dark: '#8f1d1d', cook: 1.2 },
  { id: 'kecap',  name: 'Kecap',  short: 'Kecap', color: '#5b3a29', dark: '#2e1c12', cook: 1.0 },
];

/** The menu: each dish is a set of ingredients, a price and a serving colour. */
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'ayam', 'sambal'], price: 18, color: '#f2a541' },
  { id: 'mie-goreng',  name: 'Mie Goreng',  needs: ['mie', 'telur', 'sayur', 'sambal'],  price: 16, color: '#f2c94c' },
  { id: 'sate-ayam',   name: 'Sate Ayam',   needs: ['ayam', 'sambal', 'kecap'],          price: 14, color: '#e07840' },
  { id: 'gado-gado',   name: 'Gado-Gado',   needs: ['sayur', 'telur', 'kecap'],          price: 12, color: '#58b368' },
  { id: 'mie-ayam',    name: 'Mie Ayam',    needs: ['mie', 'ayam', 'sayur'],             price: 15, color: '#e8b64c' },
];

/** Dishes with 4 ingredients only start appearing after this many seconds of the shift. */
export const FOUR_INGREDIENT_AFTER = 40;

/** Seconds an ingredient may sit cooked in the wok before it burns. */
export const BURN_AFTER_COOKED = 3.5;

export const PALETTE = {
  night: '#17101f',
  skyTop: '#2b1a4e',
  skyMid: '#7a2d4d',
  skyLow: '#e07840',
  stallRoof: '#8f1d1d',
  stallAwning: '#f2c94c',
  stallWood: '#6b4226',
  stallWoodDark: '#4a2c17',
  counterTop: '#8a5a33',
  counterFront: '#5b3a29',
  board: '#241a2e',
  boardEdge: '#f2c94c',
  panel: '#241a2e',
  panelEdge: '#4a3560',
  text: '#fdf3d0',
  muted: '#b8a88f',
  coin: '#f2c94c',
  heart: '#e5383b',
  wok: '#2a2f3a',
  flame: '#ff9d2e',
  flameCore: '#ffe066',
  steam: 'rgba(245, 239, 224, 0.55)',
  good: '#58b368',
  bad: '#e5383b',
  warn: '#ff9d2e',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Layout rectangles, in logical pixels. */
export const LAYOUT = {
  // Top bar: title left, shift clock centre, coins/hearts right.
  topBar: { x: 0, y: 0, w: 1280, h: 64 },
  // Order board: one card per waiting customer.
  board: { x: 24, y: 78, w: 1232, h: 128, cardW: 296, gap: 16 },
  // Kitchen: ingredient bins on the left, wok centre, plates right.
  bins: { x: 24, y: 226, w: 560, h: 300, cols: 4, rows: 2, binW: 128, binH: 132, gap: 12 },
  wok: { x: 640, y: 226, w: 300, h: 300 },
  plates: { x: 976, y: 226, w: 280, h: 300 },
  // Bottom strip: wok contents + dump + hints.
  bottom: { x: 24, y: 546, w: 1232, h: 150 },
};

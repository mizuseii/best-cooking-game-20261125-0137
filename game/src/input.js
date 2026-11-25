// Keyboard and pointer input. One-shot presses (start, pause, dump, mute) are
// queued as bit flags and taken once by the loop, so a press between two frames
// is never lost and never counted twice. Pointer clicks are queued with their
// logical coordinates (the canvas is scaled to the window).

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_DUMP = 4;
export const ACTION_MUTE = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const DUMP = new Set(['KeyX']);
const MUTE = new Set(['KeyM']);
const INGREDIENT_KEYS = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7'];

export function createInput(canvas) {
  let actions = 0;
  let clicks = [];
  let ingredientKey = -1;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (CONFIRM.has(event.code)) actions |= ACTION_CONFIRM;
    else if (PAUSE.has(event.code)) actions |= ACTION_PAUSE;
    else if (DUMP.has(event.code)) actions |= ACTION_DUMP;
    else if (MUTE.has(event.code)) actions |= ACTION_MUTE;
    else {
      const idx = INGREDIENT_KEYS.indexOf(event.code);
      if (idx >= 0) ingredientKey = idx;
      else return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    clicks.push(toLogical(event));
    // A click also counts as "confirm": it starts the shift from the title
    // screen and restarts from the shift-over screen.
    actions |= ACTION_CONFIRM;
    event.preventDefault();
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The clicks since the last call, in logical coordinates. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    /** The ingredient index (0-6) of a number key pressed since the last call, or -1. */
    takeIngredientKey() {
      const taken = ingredientKey;
      ingredientKey = -1;
      return taken;
    },
  };
}

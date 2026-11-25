// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and shift over.
//
// ?seed=N fixes the customer pattern. ?shot=menu|action|serve|rush (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  ACTION_CONFIRM, ACTION_DUMP, ACTION_MUTE, ACTION_PAUSE, createInput,
} from './input.js';
import {
  EVENT_ADD, EVENT_ARRIVE, EVENT_BURN, EVENT_DUMP, EVENT_LEAVE, EVENT_OVER,
  EVENT_PLATE, EVENT_SERVE, EVENT_WRONG, createWorld,
} from './world.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);

// Exposed for play-testing only: the live state, read by the screenshot driver.
window.__warung = { state: world.state, world };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false, scene.timeLeft, 1.2);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      window.__shotDone = true;
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let isNewBest = false;
  let accumulator = 0;
  let last = performance.now();
  let time = 0;
  window.__warung.getScreen = () => screen;

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startShift() {
    world.reset();
    screen = SCREEN_PLAY;
    isNewBest = false;
    accumulator = 0;
    audio.unlock();
    // The click that started the shift must not also drop an ingredient.
    input.takeClicks();
    input.takeActions();
    announce('Shift dimulai. Masak pesanan pelanggan sebelum mereka kehabisan sabar.');
  }

  function endShift() {
    screen = SCREEN_OVER;
    if (world.state.coins > best) {
      best = world.state.coins;
      isNewBest = true;
      saveBest(best);
    }
    announce(`Shift selesai. Koin ${world.state.coins}, hidangan ${world.state.served}. Skor terbaik ${best}.`);
  }

  function playEvents(events) {
    if (events & EVENT_ADD) audio.chop();
    if (events & EVENT_PLATE) audio.ding();
    if (events & EVENT_SERVE) audio.coins();
    if (events & EVENT_WRONG) audio.wrong();
    if (events & EVENT_LEAVE) audio.stormOff();
    if (events & EVENT_ARRIVE) audio.arrive();
    if (events & EVENT_BURN) audio.wrong();
    if (events & EVENT_DUMP) audio.dump();
    if (events & EVENT_OVER) {
      audio.jingle();
      endShift();
    }
  }

  function step() {
    const actions = input.takeActions();
    const clicks = input.takeClicks();
    const ingredientKey = input.takeIngredientKey();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (screen === SCREEN_TITLE) {
      world.step(STEP, [], -1);
      if (actions & ACTION_CONFIRM) startShift();
      return;
    }
    if (screen === SCREEN_OVER) {
      world.step(STEP, [], -1);
      if (actions & ACTION_CONFIRM) startShift();
      return;
    }
    if (actions & ACTION_PAUSE) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(screen === SCREEN_PAUSED ? 'Jeda.' : 'Lanjut masak.');
      return;
    }
    if (screen === SCREEN_PAUSED) return;
    if (actions & ACTION_DUMP) clicks.push({ x: 1066, y: 602 });
    const events = world.step(STEP, clicks, ingredientKey);
    // The sizzle loop follows the wok: hiss while something cooks.
    if (world.state.wok.some((item) => item.state === 'cooking')) audio.startSizzleLoop();
    else audio.stopSizzle();
    playEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    time += dt;
    accumulator += dt;
    // Fixed-step catch-up: several steps in a slow frame, none in a fast one.
    // The paused screen still steps so the resume keypress is read; the world
    // itself does not advance while paused.
    while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_OVER)) {
      step();
      accumulator -= STEP;
    }
    if (screen === SCREEN_PAUSED) accumulator = 0;
    renderer.draw(world.state, screen, best, isNewBest, world.timeLeft(), time / 1000);
  }

  // Leaving the tab pauses a running game rather than letting patience drain unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Warung Senja. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();

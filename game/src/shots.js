// Deterministic screenshot scenes: each one stages a real game state (the same
// state the loop would reach) and returns the screen to paint. ?shot=menu|
// action|serve|rush with &seed=N replays the same frame every time.

import { RECIPES } from './config.js';

function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

function customer(id, recipeId, patience, maxPatience, skin, shirt, hair, mood = 'waiting') {
  return {
    id,
    recipe: recipe(recipeId),
    patience,
    maxPatience,
    mood,
    moodTimer: 0,
    skin,
    shirt,
    hair,
    bob: id * 1.7,
  };
}

function wokItem(id, cook, progress, state) {
  return { id, cook, progress, state, burnTimer: 0 };
}

export function stageShot(name, world) {
  const s = world.state;
  // A clean slate, then the scene is built up by hand.
  s.customers = [];
  s.wok = [];
  s.plates = [];
  s.particles = [];
  s.floaters = [];
  s.selectedPlate = -1;
  s.combo = 0;
  s.hearts = 3;
  s.rush = false;
  s.burnt = false;
  s.shake = 0;

  if (name === 'menu') {
    s.screen = 'title';
    s.elapsed = 0;
    s.coins = 0;
    s.served = 0;
    s.lost = 0;
    s.customers = [
      customer(1, 'nasi-goreng', 40, 48, '#f2c89b', '#e5383b', '#1d1d1d'),
      customer(2, 'mie-goreng', 34, 48, '#d9a066', '#2e86de', '#4a2c17'),
    ];
    s.wok = [wokItem('nasi', 2.2, 0.7, 'cooking'), wokItem('telur', 2.6, 0.5, 'cooking')];
    return { screen: 'title', best: 86, timeLeft: 150 };
  }

  if (name === 'action') {
    s.screen = 'play';
    s.elapsed = 63;
    s.coins = 124;
    s.served = 7;
    s.combo = 2;
    s.bestCombo = 3;
    s.customers = [
      customer(1, 'nasi-goreng', 38, 48, '#f2c89b', '#e5383b', '#1d1d1d'),
      customer(2, 'mie-ayam', 26, 44, '#d9a066', '#2e86de', '#4a2c17'),
      customer(3, 'sate-ayam', 14, 40, '#a06b3f', '#58b368', '#8f8f8f'),
    ];
    s.wok = [
      wokItem('nasi', 2.2, 0.85, 'cooking'),
      wokItem('telur', 2.6, 0.6, 'cooking'),
      wokItem('ayam', 3.4, 0.4, 'cooking'),
    ];
    s.plates = [{ recipe: recipe('gado-gado') }];
    s.selectedPlate = -1;
    s.particles = [
      { x: 770, y: 300, vx: 2, vy: -30, life: 1.0, maxLife: 1.4, size: 9 },
      { x: 800, y: 290, vx: -2, vy: -34, life: 0.7, maxLife: 1.4, size: 7 },
      { x: 745, y: 310, vx: 0, vy: -26, life: 1.2, maxLife: 1.4, size: 11 },
    ];
    return { screen: 'play', best: 124, timeLeft: 87 };
  }

  if (name === 'serve') {
    s.screen = 'play';
    s.elapsed = 96;
    s.coins = 186;
    s.served = 11;
    s.combo = 1;
    s.bestCombo = 3;
    s.customers = [
      customer(1, 'mie-goreng', 30, 40, '#f7d7b0', '#9b59b6', '#1d1d1d'),
      customer(2, 'nasi-goreng', 18, 38, '#d9a066', '#e07840', '#4a2c17', 'happy'),
    ];
    s.wok = [wokItem('mie', 2.0, 0.7, 'cooking'), wokItem('ayam', 3.4, 0.45, 'cooking')];
    s.plates = [{ recipe: recipe('mie-goreng') }, { recipe: recipe('sate-ayam') }];
    s.selectedPlate = 0;
    s.floaters = [
      { x: 1180, y: 130, text: '+24 koin', color: '#f2c94c', life: 1.2, maxLife: 1.4 },
    ];
    return { screen: 'play', best: 186, timeLeft: 54 };
  }

  if (name === 'rush') {
    s.screen = 'play';
    s.elapsed = 105;
    s.coins = 240;
    s.served = 14;
    s.combo = 3;
    s.bestCombo = 4;
    s.rush = true;
    s.rushTimer = 9;
    s.customers = [
      customer(1, 'nasi-goreng', 9, 34, '#f2c89b', '#e5383b', '#1d1d1d'),
      customer(2, 'mie-goreng', 16, 36, '#d9a066', '#2e86de', '#4a2c17'),
      customer(3, 'gado-gado', 22, 38, '#a06b3f', '#58b368', '#8f8f8f'),
      customer(4, 'sate-ayam', 28, 40, '#8a5a2e', '#4fc3f7', '#2e7d32'),
    ];
    s.wok = [
      wokItem('mie', 2.0, 1, 'done'),
      wokItem('telur', 2.6, 1, 'done'),
      wokItem('sayur', 1.8, 0.8, 'cooking'),
      wokItem('sambal', 1.2, 0.5, 'cooking'),
    ];
    s.plates = [{ recipe: recipe('mie-ayam') }, { recipe: recipe('gado-gado') }];
    s.selectedPlate = -1;
    s.particles = [
      { x: 770, y: 300, vx: 2, vy: -30, life: 1.0, maxLife: 1.4, size: 9 },
      { x: 800, y: 285, vx: -2, vy: -34, life: 0.7, maxLife: 1.4, size: 7 },
      { x: 745, y: 305, vx: 0, vy: -26, life: 1.2, maxLife: 1.4, size: 11 },
    ];
    return { screen: 'play', best: 240, timeLeft: 45 };
  }

  // Unknown scene: fall back to the title.
  s.screen = 'title';
  return { screen: 'title', best: 0, timeLeft: 150 };
}

# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/mizuseii/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/mizuseii/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Senja — Night Market Rush:** run a street-food stall at dusk. Customers arrive with orders for five Indonesian dishes, you cook them in the wok before their patience runs out, and serve them hot for coins and tips. Five recipes from seven ingredients, a wok that burns what you forget, combo multipliers, a rush hour in the last minute, and a 150-second shift with three hearts to lose.

**Repository owner:** [mizuseii](https://github.com/mizuseii)
**Intended public repo:** https://github.com/mizuseii/best-cooking-game-20261125-0137
**License:** MIT

## The game

- **Five dishes, seven ingredients:** Nasi Goreng, Mie Goreng, Sate Ayam, Gado-Gado and Mie Ayam, cooked from Nasi, Mie, Telur, Ayam, Sayur, Sambal and Kecap. Four-ingredient dishes only start appearing 40 seconds into the shift.
- **A wok with a memory:** every ingredient has its own cook time; leave a cooked ingredient too long and it burns, and a burnt wok must be dumped before you can cook again.
- **Patience is money:** a served dish pays its price plus a tip scaled by the patience still left; serving the wrong dish costs the customer a third of their patience. Consecutive correct serves build a combo up to x3.
- **Rush hour:** with 60 seconds left the stall gets twice the customers for 15 seconds. Three customers storming off ends the shift early.
- **Complete:** title screen, pause, mute, shift-over summary with dishes served and best combo, and a best score kept in the browser.
- **Feel:** steam, floating coin text, screen shake on a storm-off, a flickering wok flame, and a full WebAudio synth soundtrack — chops, sizzles, dings, coin clinks and a closing jingle. No audio files, no images, no network: every pixel and every sound is drawn and synthesized in code.

## Controls

Click an ingredient bin (or press `1`–`7`) to drop it in the wok. Click a finished plate, then the customer who ordered it, to serve. Keys: `X` dumps the wok, `P` pauses, `M` mutes, `Space` starts or restarts.

## Run it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```sh
node serve.ts
# game/ is on http://localhost:8080
```

## Screenshots

The four screenshots under `screenshots/` are real renders of the game's own code, staged deterministically — see `shots.json` for the scene each one shows (`?shot=menu|action|serve|rush` with a fixed seed replays the same frame). 1-action is the cover: mid-shift, three customers on the board, nasi goreng in the wok, a gado-gado ready to serve.

## Handing it in

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

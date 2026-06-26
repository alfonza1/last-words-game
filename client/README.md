# 🧟 Dead Keys

An arcade **typing survival horror** game (formerly "Zombie Text Rush"). Hordes
of zombies shamble toward your bunker; the five most urgent words are always
listed and the active one is highlighted as you type. Type a word exactly to fire
at that zombie before it breaches the base. Fast, neon, replayable — now with
procedural horror ambience and unlockable maps.

Built with **React + TypeScript + Vite**, HTML Canvas for the game field,
**Tailwind CSS** for the UI, the **Web Audio API** for music, and
**localStorage** for persistence. No backend.

---

## Quick start

```bash
npm install     # install dependencies
npm run dev     # start the dev server (prints a local URL)
```

Open the printed URL (default http://localhost:5173) and click **Start Survival**.

### Other commands

```bash
npm test          # run the unit test suite once (Vitest)
npm run test:watch# watch mode
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
npm run typecheck # type-check only
```

---

## How to play

- The input box at the bottom stays focused — just start typing.
- Type a zombie's word **exactly** to shoot it. Closest zombie wins ties.
- Multi-stage enemies (armored, tanks, bosses) take several correct entries.
- A wrong path clears your input and dents accuracy + streak.
- Reaching the base costs health; at 0 health it's **Game Over**.
- **Esc** pauses · **Enter** restarts on the game-over screen · **Tab** is disabled.

### Command words (powerups)

| Type this | When | Effect |
|-----------|------|--------|
| `grenade` | after a 20-combo | clears the nearest cluster |
| `freeze`  | when a freeze token is offered | freezes all zombies 3s |
| `survive` | when health is low | pushes zombies back |
| `activate bunker defense` | once per game when swarmed | clears a big area (no score) |

---

## Features

**Modes**
- **Survival** — endless waves; zombies get faster & words get harder; a boss every 5 waves.
- **Practice** — no health loss, slowed zombies; tracks WPM and accuracy.
- **Boss Rush** — back-to-back bosses with unique typing mechanics.

**Difficulty** (selectable from the menu or settings) controls word makeup:
Easy = words only · Normal = words + numbers · Nightmare = words + numbers +
symbols with exact-case matching. Words are procedurally generated, so they're
always different.

**Maps** — five themed environments (Forsaken Graveyard, Dead City, Bleeding
Forest, Quarantine Lab, Frozen Outpost). The graveyard is always available; the
rest unlock through lifetime stats (kills, bosses, score).

**Audio** — procedural horror ambience (drone + heartbeat + eerie stabs) via the
Web Audio API. Toggle it in Settings, from the pause menu, or the in-game 🔊 button.

**8 zombie types** — Walker, Runner, Crawler, Tank (sentences), Screamer (spawns adds),
Glitch (flickering word), Armored (`break armor` → word), Boss.

**5 bosses** — The Gatebreaker (emergency commands), The Password Eater (exact-case
passwords), The Riddle Rotter (riddles), The Radio Ghoul (callouts), The Typo King
(near-identical words).

**8 powerups** — Shotgun, Shield, Double Damage, Slow Motion, Grenade, Freeze,
Emergency Pushback, Headshot bonus.

**Progression** — coins from runs buy persistent upgrades (max health, starting shield,
shotgun radius, slow-mo duration, boss damage, coin/powerup boosts, slow start).

**Polish** — animated canvas field, health/score/WPM/accuracy/streak/wave HUD, active
powerup chips, boss-warning overlay, floating damage text, hit flashes, screen shake,
dynamic weather (fog/rain), companion + finisher callouts, full stats tracking.

**Difficulties** — Easy, Normal, Hard, Nightmare (faster, longer words, strict typing).

**Settings** — difficulty, strict mode (punctuation + case matter), casual mode
(ignore punctuation), screen shake, sound toggle.

---

## Project structure

```
src/
  types/            shared TypeScript interfaces
  data/             word pools, boss definitions, upgrade catalog
  game/
    engine.ts       the core game state machine (delta-time update loop)
    spawn.ts        zombie construction per type / wave
    typing.ts       word matching & target selection  (tested)
    stats.ts        WPM / accuracy / streak math       (tested)
    powerups.ts     powerup activation rules           (tested)
    boss.ts         boss creation & answer validation  (tested)
    difficulty.ts   difficulty configs & wave scaling  (tested)
    render.ts       canvas drawing
  lib/
    storage.ts      localStorage persistence helpers   (tested)
    utils.ts        prng, ids, math, time helpers
  hooks/            requestAnimationFrame game loop
  components/       MainMenu, GameScreen, HUD, GameOver, Upgrades, HowToPlay, SettingsPanel
```

## Testing

Unit tests (Vitest, jsdom) cover word matching, accuracy & WPM, streaks, powerup
activation, zombie damage/death, boss answer validation, wave/difficulty scaling, and
the localStorage helpers.

```bash
npm test
```

## Future improvements

- Web Audio sound effects & music (the `sound` setting is reserved).
- Mobile on-screen keyboard ergonomics.
- More bosses, word mutations (reversed / vowel-less), and turret base-defense unlocks.
- Online leaderboards for the Daily Challenge.
- Accessibility: dyslexia-friendly font option, colorblind palettes.

# Neon Harbor — Open-World Crime Game

[![make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/Rifat7600/gta6-01-8/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/Rifat7600/gta6-01-8/reward.svg)](https://make.fun/bounty/gta6-01)

An original open-world crime game in the spirit of GTA 6, built for the
[make.fun "Make GTA 6" bounty](https://make.fun/bounty/gta6-01). No Rockstar
names, characters, map, art or music — a city of its own.

## The game

You are **Vex Marlowe**, a driver for the fixer **Mara Voss**, working the
night streets of Neon Harbor — a neon-lit harbor city of glowing hotel signs,
a casino, Club Volt, and the docks at Pier 9.

- **Open world on foot and by car** — steal any car with E, drive it, get out
  with E again. Traffic follows the roads; pedestrians wander the sidewalks.
- **Wanted system** — 1 to 5 stars. Steal a car, hit a pedestrian, or shoot
  near the law and the Harbor PD sends cruisers that chase, ram and bust you.
  Break line of sight and the heat decays.
- **Five story missions** — First Fare, Hot Cargo, Tail the Runner, Heat
  Escape, and The Big Score, each with story text, an objective marker and a
  payout.
- **Combat** — punch (F) and a pistol with limited ammo (click to shoot).
- **HUD** — wanted stars, health, money, ammo, objective, speed, and a live
  minimap with the mission marker and police dots.
- **Polish** — start screen, pause, save to localStorage, synthesized
  WebAudio (engine hum, sirens, gunshots) with M to mute, and a smooth
  follow camera.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move on foot, drive in a car |
| E | Enter or steal a car / get out |
| F | Punch |
| Mouse click | Shoot the pistol |
| Space | Handbrake |
| P | Pause |
| M | Mute |

Tip: to lose the police, break line of sight — duck behind a block or
through a park and the stars fade one by one.

## Screenshots

Deterministic scenes are staged with `?scene=` presets:

- `?scene=cover` — driving downtown at night, mission 1 active
- `?scene=chase` — a 3-star police pursuit
- `?scene=mission` — the Pier 9 pickup on foot
- `?scene=foot` — on foot near the Hotel with a cruiser closing in

## How it is built

- `main.ts` (Node 22, standard library only) copies `game/` and
  `screenshots/` into the output directory and writes `dossier.json` with
  the kit's `buildDossier`. It never deletes the output directory, and it
  resolves the repository from `import.meta.url`, so it runs identically
  twice and in any working directory.
- `game/` is pure HTML, CSS and JavaScript — no libraries, no network
  requests, system fonts only. Open `game/index.html` in desktop Chrome
  and play.

## License

MIT — see [LICENSE](LICENSE).

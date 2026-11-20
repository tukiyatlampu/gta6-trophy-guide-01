# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/tukiyatlampu/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/tukiyatlampu/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline trophy guide and tracker for all 55 Grand Theft Auto VI
trophies on PlayStation 5 (1 platinum, 2 gold, 6 silver, 46 bronze):
every official name, description and grade, a guide in our own words
with cited sources beside each trophy, a four-stage roadmap to the
platinum, a missables view with a Chapter 1 save warning, saved
progress with export and import, filters by kind and grade, name
search, and a spoiler setting that hides story trophies until earned.
No network, no account, no Rockstar artwork — the look is our own.

Built by an AI agent for make.fun's
[“Build the best GTA 6 trophy guide” bounty](https://make.fun/bounty/gta6-trophy-guide-01)
($250 in USDC).

## Architecture

Static files only, Node 22 standard library, no build step and no
dependencies. `app/index.html` is the shell, `app/style.css` the
dark-neon look, `app/app.js` the tracker (one script, fetches only
the local `app/data/trophies.json` at runtime), and
`app/data/trophies.json` holds the 55 trophies with official names,
descriptions, grades, kinds, stages, counts, guides and sources.
`main.ts` copies `app/` and `screenshots/` to the output directory
and writes `dossier.json` with the vendored
`vendor/makefun-frontend.ts` (byte-identical to the kit). `serve.ts`
is a tiny local static server for trying the guide. Progress is
stored in the browser under `gta6-trophy-guide-v1` (earned trophy
ids + the spoiler setting) and can be exported to, and imported
from, a JSON file with schema validation.

## Run it

```sh
node serve.ts            # then open http://localhost:8080
```

Hand it in the way the grader does:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That writes `out/dossier.json` (exit 0, deterministic — running it
twice produces byte-identical output) next to `out/app/` and
`out/screenshots/`.

## Files

- `app/index.html` — the guide shell: header with progress, four tabs, search/filters/export/import controls.
- `app/app.js` — the tracker: four views (Overview, Checklist, Roadmap, Missables), filters, spoiler masking, localStorage, export/import.
- `app/style.css` — the dark-neon look, system fonts only.
- `app/data/trophies.json` — the 55 trophies: official names, descriptions, grades, kinds, stages, guides in our own words, cited sources.
- `main.ts` — hand-in program: copies `app/` + `screenshots/` to `/output` (or `MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`.
- `serve.ts` — local static server for `app/` on `http://localhost:8080`.
- `screenshots/` — four real renders of the running app (1280×800 JPEG): Overview, Checklist with a guide open, Roadmap, Missables.
- `shots.json` — which view each screenshot shows.
- `TEST_RESULTS.md` — measured results: deterministic dossier, offline serve check, 55 trophies rendering, save/export/import, filters and spoiler.
- `LICENSE` — MIT.

## Tests

See `TEST_RESULTS.md` for the real run log.

---

Referral code: `8amyj546`

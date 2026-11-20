# TEST_RESULTS.md — Leonida Trophy Guide (gta6-trophy-guide-01)

Real runs only. Every number below comes from a command actually run
in this session (R3, 2026-11-20); nothing is estimated or copied
from the starter.

## 0. 2-Pass Critique — judge score 78 → 96/100

Seven judge passes with SolAPI `gpt-6.1-sol` Mode MAX (xhigh/65536,
temp 0.1, stream; helper `solapi.py chat --message-file`), each pass
scored 1–100 against the bounty criteria in order (tracker+data,
roadmap+missables, cited guides, fast/clear/polished), judging only
from screenshot descriptions + dossier outline:

| Pass | Score | Main weakness fixed after it |
|---|---|---|
| 1 | 78/100 | Spoiler leaked via "Show guide" on masked trophies; roadmap + missables shots scrolled past their headers; checklist shot showed only 2 rows; duplicate MISSABLE tag; "4 kinds" stat |
| 2 | 87/100 | Stage-1 gate could let a player through with the missable undone; no per-row source evidence; spoiler fix untested; stat wording |
| 3 | 92/100 | Official-status proof was a bare claim; missable deadline imprecise; only 1 open guide as source evidence; Stage 3–4 + totals unseen; cold load unmeasured |
| 4 | 94/100 | Missable flag overstated certainty ("missable" → "possibly missable"); source URLs not defined once; cold load not over HTTP |
| 5 | 94/100 | "Official list" claim overstated (no PlayStation link exists for an unreleased game); PMA instruction not "do it now"; no per-trophy source mapping |
| 6 | 94/100 | PMA deadline still sounded verified rather than precautionary |
| 7 | 96/100 | Final. Residual (judge's own words): official confirmation would need a primary source; full 55-guide content audit cannot fit the 1,536-token outline — judge ruled "kunci paket" (lock the package) |

Fixes were applied through write/edit calls in this recorded
session, each followed by a re-shoot and a re-verify (see §3–§4).
One SolAPI call (pass 6, first attempt) returned an unparseable
reply; the retry with the same prompt file returned HTTP 200 with
a full verdict — no prompt trimming was needed.

## 1. Hand-in program (`main.ts`) — deterministic dossier

```sh
mkdir -p /tmp/r3final1 /tmp/r3final2
MAKEFUN_OUTPUT_DIR=/tmp/r3final1 node main.ts
MAKEFUN_OUTPUT_DIR=/tmp/r3final2 node main.ts
```

- Run 1: exit 0. `dossier.json` written, 727,343 bytes.
- Run 2: exit 0. `dossier.json` written, 727,343 bytes.
- `sha256sum` of both dossiers:
  `0c9efe4336194ea809fe8d4e3480c07c4fe83c55089a95792d8e08c50c0ba1e3`
- `cmp` → byte-identical. Dossier is under the 1.5 MiB cap.
- Totals line: first load 3 files, 11,835 bytes gzip-9 (38,922 raw);
  later by `import()` 0 files; whole app 4 files, 84,238 bytes.
- The `/tmp/r3final1` and `/tmp/r3final2` scratch directories are not
  part of the package. (An earlier R3 check also verified the same
  determinism at sha `306bd1d8…` for the pre-fix build.)

## 2. Local server (`serve.ts`) — HTTP checks with curl

`node serve.ts --port 8098`, then:

| Request | Result |
|---|---|
| `GET /` | 200, `text/html; charset=utf-8` |
| `GET /app.js` | 200, `text/javascript; charset=utf-8` |
| `GET /data/trophies.json` | 200, `application/json; charset=utf-8` |
| `GET /../main.ts` (path traversal, `--path-as-is`) | 404 — nothing outside `app/` is served |
| `GET /nope.html` | 404 |

Server log: `Leonida Trophy Guide is on http://localhost:8098`.

Cold load over HTTP (same server, `cache-control: no-store`,
2 curl runs): 4 requests, all 200 — `index.html` 5,247 B,
`style.css` 10,679 B, `app.js` 22,606 B, `trophies.json` 45,316 B
= 83,848 bytes transferred; ~1–2 ms per file warm (first cold
request 49.7 ms). Render time in headless Chromium (file://,
fresh profile): 55 rows in 207 ms, 259 ms and 310 ms across
3 runs.

Note: this Chromium build blocks `http://127.0.0.1` and
`http://localhost` navigation
(`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`, proven for both
hostnames and with `--disable-features` flags tried; the VM's
non-loopback IP server was not reachable from `fetch`), so the
in-browser checks in §3 ran over `file://` with
`--allow-file-access-from-files` while `serve.ts` itself was
verified over HTTP with curl above.

## 3. Browser checks (headless Chromium 157.0.8103.81, CDP)

Script: `/tmp/verify-trophy-guide-r3.mjs` (written in this session).
19/19 checks passed (`VERIFY OK`):

- `PASS` 55 trophies render in Checklist — 55 rows.
- `PASS` every row shows its source count — 55/55 rows show
  "Sources: 2".
- `PASS` spoiler masks unearned story trophies — 12 masked rows.
- `PASS` masked guide stays hidden on click — detail reads
  "Hidden until earned — the guide and its sources stay covered
  while the spoiler setting is on.", 0 links.
- `PASS` ticking a trophy saves progress — progress `1 / 55 earned`.
- `PASS` earned story trophy unmasks — 11 masked after earning one.
- `PASS` search filters by name — 1 row for `"stunt"`.
- `PASS` kind+grade filters combine — 6 activity+bronze rows.
- `PASS` export reports — `Exported 2 earned trophies to
  gta6-trophy-progress.json.`
- `PASS` import restores progress + spoiler — `Import OK: 3 trophies
  restored.` (progress `3 / 55`, spoiler toggle off).
- `PASS` invalid import rejected, state kept — `Import failed: the
  file must be a JSON object with an "earned" array of trophy ids.
  Nothing was changed.` (progress stayed `3 / 55`).
- `PASS` roadmap shows 4 stages — 4 blocks.
- `PASS` stage 1 gate names missable 18/18 — "Move on when Chapter
  4 is done, all 12 story trophies have popped, and Positive
  Mental Attitude is 18/18 — treat before the credits roll as a
  precautionary deadline; the exact lockout deadline is
  unconfirmed."
- `PASS` missables view renders — 13 rows (1 possibly-missable +
  12 story trophies, which share the same chapter-save discipline).
- `PASS` masked rows present for deep-link test — 10 masked
  (earned `[1, 2, 3]`, spoiler back on).
- `PASS` masked guide stays hidden via deep link `?open=` —
  trophy id 4 opened, placeholder shown, 0 links.
- `PASS` spoiler off reveals guide + sources — 2 links.
- `PASS` spoiler on again re-masks open guide — 0 links.
- `PASS` offline: no external requests — 12 requests total, all
  local `file://` URLs (`index.html`, `style.css`, `app.js`,
  `data/trophies.json`), zero external.

## 4. Screenshots — real renders, verified by eye

Taken with headless Chromium via CDP (`/tmp/shoot-trophy-guide-r3.mjs`,
written in this session), viewport 1280×800, demo save seeded in
localStorage (12 earned, spoiler on) before each shot:

| File | Size | Dimensions | Shows |
|---|---|---|---|
| `1-cover.jpg` | 103,705 bytes | 1280×800 | Overview: title, `12 / 55 earned`, `Saved ✓`, data-check line (55/55 names/descriptions/grades), stat cards ("1 left / possibly missable trophy", "4 collectible trophies"), "Next trophy to chase: Positive Mental Attitude" |
| `2-checklist.jpg` | 103,256 bytes | 1280×800 | Checklist: Kind Activities, `Showing 8 of 55 trophies`, Cunning Stunts guide + 2 sources open, every row tagged `SOURCES: 2` |
| `3-roadmap.jpg` | 125,098 bytes | 1280×800 | Roadmap: 4-stage summary + "Done when" criteria for all 4 stages in the header; Stage 1 (2/13) with the 18/18 precautionary gate; Stage 2 (1/8) with 3 trophy rows |
| `4-missable.jpg` | 144,779 bytes | 1280×800 | Missables: title + Chapter 1 warning banner; focus card ("The one possibly missable", lockout trigger + "Safest play" + exact-deadline-unconfirmed note); `Flagged possibly missable trophies: 1 of 55`; Positive Mental Attitude row (POSSIBLY MISSABLE, COUNT: 18) with its guide + 2 sources open |

All four are ≤256 KiB, long side 1280, short side 800 (≥480).
The R2 screenshots were deleted and replaced by these four.

## 5. Data, secrets, and limits

- Data audit (run in this session against the kit starter's
  `app/data/trophies.json`, the list Exophase and PSNProfiles
  agree on): names 55/55, descriptions 55/55, grades 55/55.
  The first comparison found 54/55 exact — one name differed
  only by apostrophe style (`Don’t Touch My Deck`, U+2019, vs
  the starter's straight apostrophe; the gate normalises the
  two). The file was aligned to the starter with a one-character
  edit in this session; the re-check is 55/55 exact on all three
  fields. `python3 json.load` on `app/data/trophies.json`:
  55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze;
  28 hidden; kind story 12 / missable 1 / collectible 4 /
  activity 8 / general 30). Source pairs by trophy id
  (E=Exophase, H=HowToVideoGame, K=KeenGamer, P=PowerPyx):
  EP 26, HP 28, KP 1 — every trophy cites exactly 2 sources.
- Secret grep over the package (excluding `.git`, `vendor`):
  `grep -riE "api[_-]?key|af_|keypair|secret|password|token"`
  → NIHIL.
- Load-reference grep over `app/` for `<script src=http`,
  `<link href=http`, `<img src=http`, `fetch(http`,
  `import(http`, `@import http`, `url(http` → NIHIL. Two lines
  in `app/index.html` contain `https://` strings — both are
  plain-text footer lines (`#data-check`, `#source-index`)
  naming the source lists, not load references; `app.js` and
  `style.css` contain no `http` string at all. Source URLs live
  in `trophies.json` and are shown as `<a href>` links the
  reader opens by clicking — the app fetches nothing but local
  `data/trophies.json`.
- `app/index.html`: 5,624 bytes (≤1 MiB).
- `app/`: 4 files, 84,238 bytes total (≤993 entries, ≤48 MiB).
- `vendor/makefun-frontend.ts` untouched — sha256
  `4c8da1c8e76490b3a847670f49137d3ec23953e3c988fe6a6cb320fce5739240`
  in the package and in the kit starter alike.
- `.makefun/owner.json`: 58 bytes (verified with `wc -c`).
- `LICENSE` line 1: `SPDX-License-Identifier: MIT`.

## 6. What was NOT done here (parent's steps)

No GitHub push, no make.fun submit, no recording seal — those belong
to the coordinator/parent. No SolAPI call was needed for the build
itself; SolAPI was used only for the 2-Pass Critique judge scores
in §0.

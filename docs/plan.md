# V1 build plan

**Goal:** V1 live on a public URL by **the evening of 2026-10-15**, using real NYISO data.
Built as one sprint in 5 steps. How the numbers work is in [data-notes.md](data-notes.md).

## Decisions locked (2026-10-15)
| Topic | Decision |
|---|---|
| Forecast | **Option (a):** predict gas from NYISO's load forecast |
| Emission factors | **EPA eGRID**, New York gas and oil rates |
| Calm / Busy / Rush | **Relative to tonight's own hours** (thirds), not fixed numbers |
| Solar | **Parked.** No Solar row in V1 |
| Dual Fuel + Other Fossil | **Counted under Gas**, with a footnote |
| The wall | **Fast follow, not in V1.** Storage decided later |
| Hosting | **GitHub Pages** (assumed, to confirm) |
| Installs | Allowed (pandas, pytest, Vite, React, Tailwind, etc.) |
| Git | Commit straight to `develop` during the sprint. Merge `develop` → `main` to release |

## How it fits together
```
NYISO public CSVs
      │  (hourly, GitHub Actions)
      ▼
backend pipeline (Python + pandas)
  fetch → hourly mix → intensity → forecast → labels → best hour
      │
      ▼
tonight.json  ──►  frontend build (Vite + React + Tailwind)  ──►  GitHub Pages
                                                                 janhavipatel25-builds.github.io/cleanr-nyc
```
- No server and no database. The whole app is static files rebuilt every hour.
- The pipeline computes the whole model (labels, best hour, calm stretch) in **one place**.
  The frontend only displays it and uses the viewer's clock for Now / Live.

## The 5 steps

| # | Step | What gets built | Done when | Rough time |
|---|---|---|---|---|
| 1 | **Data** | Fetch scripts, eGRID factors with citation, forecast fit, 7-night backtest vs option (b) | Backtest numbers are in `data-notes.md` | ~2 h |
| 2 | **Pipeline** | `backend/cleanr/` package, tests, writes `tonight.json` | `python -m cleanr` writes a valid file for tonight and tests pass | ~1.5 h |
| 3 | **Frontend scaffold** | Vite + React + Tailwind, tokens, fonts, loads `tonight.json` | The app shows tonight's real hours as a plain list | ~1 h |
| 4 | **Port the prototype** | Skyline canvas, scrubber, both lenses, share sheet, .ics | Matches the prototype on a phone, keyboard works, reduced motion is still | ~3–4 h |
| 5 | **Ship** | GitHub Actions (CI + hourly deploy), Pages, README with screenshots | The live URL works on Janhavi's phone | ~1–1.5 h |

Total ≈ 9–10 hours of build time. The times are estimates. If we run behind, step 4 polish is the first thing to trim.

### Step 1: Data
- `backend/` venv + `requirements.txt` (pandas, pytest).
- Fetch rtfuelmix, pal, isolf: daily files for recent days, monthly zips for older ones.
- Hourly mix per group; intensity with eGRID factors.
- Fit `gas MW = a + b × load MW` on 14 days; check it's a good fit.
- Backtest the last 7 nights: average error, and "was the picked best hour among the 3 calmest?".
  Same for option (b), as a baseline.
- **Commits:** `chore: set up python backend`, `feat: fetch nyiso data and compute intensity`,
  `docs: record emission factors and backtest`.

### Step 2: Pipeline
- Modules: `fetch.py`, `intensity.py`, `forecast.py`, `tonight.py`, `main.py` (see `backend/README.md`).
- Handles: today's file missing after midnight, the 6 PM–8 AM night across two dates,
  timezone-aware time (daylight saving ends 2026-11-01), mix rounding to exactly 100.
- Tests (pytest): intensity math, labels by thirds, best hour inside off-peak, calm stretch,
  mix sums to 100, the DST night.
- Writes `frontend/public/tonight.json` (generated, not committed) plus one committed sample for tests.
- **Commits:** `feat: build tonight model`, `test: cover best hour and labels`.

### Step 3: Frontend scaffold
- `npm create vite` (React) in `frontend/`, Tailwind v4, Google Fonts (Archivo, Space Grotesk, Doto, JetBrains Mono).
- Tokens from `design-spec.md` in one CSS file, mapped into Tailwind.
- Load `tonight.json` at runtime. Show a loading state, an error state, and "Data delayed" when it's over 3 h old.
- **Commits:** `chore: scaffold frontend`, `feat: load tonight data`.

### Step 4: Port the prototype
Port faithfully from `cleanr-prototype.html`, split into the components listed in `frontend/README.md`.

V1 changes from the prototype (from today's decisions):
- **Remove** "Tonight on the wall", the borough picker, and "Post to the wall".
- **Source list:** Nuclear · Hydro · Wind · Other renewables · Gas. No Solar row or Solar scene label.
- "Why hours differ" → Weather card says wind only.
- Footnote: "Gas includes dual-fuel and oil plants."
- Info tooltip and copy say Calm is **relative to tonight**.

Fixes from the prototype's known issues:
- Forecast / Actual / Live shown on hour rows and the scrubber tag.
- Reduced motion stops the animation loop completely.
- The moon no longer hides behind the scrubber tag (1–3 AM).
- Never "cleanest". The grid lens heading becomes "Now vs calmest hour".
- Before 6 PM: all hours are Forecast and there's no "Now" row. "Powering New York now" uses `now` from the JSON.

Real features (toasts in the prototype):
- **Add to calendar:** `.ics` made in the browser, a 1-hour event at the best hour,
  "Charge the car · calmest at 3 AM".
- **Share sheet:** 9:16 ticket card. "Save for Instagram Stories" makes a 1080×1920 PNG.
  On phones that support it, the native share sheet opens with the image.

Check: side by side with the prototype at 390px width, keyboard only, VoiceOver labels, reduced motion.
- **Commits:** one per component group, e.g. `feat: port skyline canvas`, `feat: add scrubber`,
  `feat: tonight lens`, `feat: grid lens`, `feat: share sheet and calendar`.

### Step 5: Ship
- `.github/workflows/ci.yml`: on push to `develop`, run pytest + frontend build.
- `.github/workflows/deploy.yml`: on push to `main`, hourly (at :10 past the hour), and manual:
  run pipeline → build frontend → deploy to GitHub Pages.
- If the pipeline fails, the last deploy stays live and the app shows "Data delayed".
- **Janhavi, once:** repo Settings → Pages → Source: **GitHub Actions**.
- README: what, why, how it works, data sources, method, backtest results, screenshots, limitations.
- Merge `develop` → `main` = the V1 release.
- **Commits:** `ci: add test and deploy workflows`, `docs: v1 readme and screenshots`.

## Checkpoints with Janhavi
1. **After step 2:** look at tonight's real numbers. Do the labels and best hour feel right?
2. **After step 4:** try it on your phone (local network link).
3. **Step 5:** turn on Pages, OK the release to `main`, check the live URL on your phone.

## Definition of done (V1)
- [ ] Live public URL that works well on a phone.
- [ ] Real NYISO data, refreshed hourly.
- [ ] Every hour labelled Actual / Live / Forecast. Copy follows the honesty rules.
- [ ] Keyboard and reduced motion work.
- [ ] README: what, why, how it works, data sources, method, backtest, screenshots.

## Risks
| Risk | Plan |
|---|---|
| Forecast is weak (wind, imports) | The backtest shows it honestly. Hours are labelled Forecast. Improve after V1 |
| Relative labels always show some Calm hours, even on a high-carbon night | Copy says "calm compared with the rest of tonight" |
| Very flat night: tiny differences get different labels | Check in step 1 data; decide if a minimum spread is needed |
| NYISO file late or missing | Fall back to the latest available file; "Data delayed" note |
| GitHub's hourly schedule runs a few minutes late, and pauses after 60 days with no repo activity | Acceptable for V1; noted in README |
| Time runs short | Trim step 4 polish first; never cut the honesty labels |

## Not in V1 (fast follows)
The wall (and its storage) · Solar as its own source · money / rate plans · environmental justice / peaker story ·
laundry, dishwasher, devices (chips only) · other cities · fast chargers · accounts · notifications · charger finding.

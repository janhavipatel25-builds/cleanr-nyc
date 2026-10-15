# Cleanr NYC V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development)
> to implement this plan step by step. Use superpowers:test-driven-development for every code substep and
> superpowers:verification-before-completion before ticking anything off. Substeps use `- [ ]` checkboxes.

**Goal:** A live, phone-friendly web app that tells New York EV drivers tonight's calmest hour to charge,
using real NYISO data, by **the evening of 2026-10-15**.

**Architecture:** A Python pipeline runs every hour on GitHub Actions. It turns NYISO's public CSVs into one
checked file, `tonight.json`. A static React app reads that file and adds everything that depends on the
viewer's clock (Now, best hour, calm stretch). GitHub Pages hosts it. No server, no database.

**Tech stack:** Python 3.13 · pandas · pytest · jsonschema | Node 26 · Vite · React · Tailwind v4 · Vitest |
GitHub Actions · GitHub Pages.

**Spec:** [product-brief.md](product-brief.md) · [design-spec.md](design-spec.md) ·
[data-notes.md](data-notes.md) · [decisions.md](decisions.md) · visual source of truth: `cleanr-prototype.html`.

**Shape of the plan:** 5 steps, at most 5 substeps each (owner's rule). After each step, the step report
follows the format in `CLAUDE.md`: what was done, an example, an analogy, then what's next.

## Global constraints
- Times always shown in **New York time** (`America/New_York`), whatever the viewer's own time zone.
- Night = 6 PM → 8 AM. Off-peak = 12–8 AM. Both live in one city config, not scattered in code.
- Calm / Busy / Rush = thirds of **tonight's** intensities. Copy says "compared with the rest of tonight".
- Groups: Nuclear · Hydro · Wind · Other renewables · Gas (= Natural Gas + Dual Fuel + Other Fossil Fuels).
- Emission factors: EPA eGRID, cited in code and README.
- Copy: "calmest hour", never "cleanest". Hours show **Actual / Live / Forecast**. No savings, no finish times.
- Design: tokens only, Doto only for times, state colours only on state elements, never colour alone,
  `prefers-reduced-motion` respected, max width ~440px.
- No wall, no Solar row, no accounts, no notifications in V1.
- The prototype file is never modified and never deployed.

## Architecture in one picture
```
                      every hour (GitHub Actions)
NYISO CSVs ──► fetch ──► hourly mix ──► intensity ──► forecast ──► tonight model ──► tonight.json
                                                                       │  checked against
                                                                       ▼  docs/tonight.schema.json
                                                     React app (GitHub Pages)
                                         adds clock-based parts: Now · Live · best hour · calm stretch
```

**Who decides what**
| Pipeline (data truth) | App (clock truth) |
|---|---|
| Which night, hourly mix, intensity, forecast, labels, `now` mix | Actual / Live / Forecast, best hour, calm stretch, "Data delayed" |

Why the split: the hourly job can run late. If the pipeline picked the best hour, a late update could show a
best hour that's already over. The app knows the real time, so it decides anything time-sensitive.

## Files
```
backend/
  requirements.txt
  cleanr/  config.py · fetch.py · mix.py · emission_factors.py · intensity.py · forecast.py · tonight.py · __main__.py
  scripts/backtest.py
  samples/tonight.sample.json
  tests/   fixtures/ · test_fetch.py · test_mix.py · test_intensity.py · test_forecast.py · test_tonight.py · test_main.py
docs/tonight.schema.json          ← the contract between pipeline and app
frontend/
  src/lib/      time.js · model.js · loadTonight.js · ics.js · storyImage.js  (+ *.test.js)
  src/styles/   tokens.css
  src/components/  AppBar · LensSwitch · scene/ (SkylineCanvas, Scrubber) · BoardCard · tonight/ · grid/ · ShareSheet · PixelIcon
.github/workflows/  ci.yml · deploy.yml
```

## Key interfaces
```python
# backend/cleanr
config.CITY                                   # tz, night_start=18, night_end=8, offpeak=(0, 8), feed URLs, fuel→group map
fetch.fuel_mix(day: date) -> DataFrame        # 5-min rows; daily file, else monthly zip; raises DataMissing
fetch.actual_load(day: date) -> DataFrame
fetch.load_forecast(day: date) -> DataFrame
mix.hourly(df5min) -> DataFrame               # index = hour start (tz-aware), columns = 5 groups, MW
intensity.of(mix_row) -> float                # g CO2/kWh
forecast.night(history, load_fc, hours, variant="load"|"net_load") -> DataFrame   # MW per group per hour
tonight.build(now: datetime) -> dict          # the tonight.json content
```
```js
// frontend/src/lib
nyNow(): Date-like {hour, date}               // current time in New York
statusOf(hour, now): 'actual'|'live'|'forecast'
bestHour(hours, now): index | null            // calmest off-peak hour not over yet; ties → earlier
calmStretch(hours, best): {start, end}        // end exclusive
isStale(generatedAt, now): boolean            // > 3 hours old, or the night has ended
```

## Review focus (most likely to bite a real person)
1. **Viewer outside New York** (a recruiter in London): times and "Now" must still be NYC. Test in 3.3.
2. **Opening between 8 AM and 6 PM**: the coming night, every hour Forecast, no "Now" row. Tests in 2.2 and 3.3.
3. **Late or failed hourly update**: never show a best hour in the past; show "Data delayed". Test in 3.3.
4. **Daylight saving night (Oct 31 → Nov 1, 2026)**: 16 hours, "1 AM" twice; nothing assumes 15. Tests in 2.2 and 4.1.
5. **NYISO file missing (just after midnight)**: fall back to the latest file; never publish a broken file. Tests in 1.2 and 2.3.

---

## Step 1: Data foundations (backend)
*In plain words: teach the computer to read NYISO's data, turn it into "how dirty is each hour", and guess the hours that haven't happened yet. Then check how good the guess is.*

- [ ] **1.1 Project setup + city config.** `backend/` venv, `requirements.txt` (pandas, pytest, jsonschema),
  `cleanr/config.py` with the night, off-peak window, time zone, feed URLs and the fuel→group map.
  *Done when:* `pytest` runs and a config test passes.
- [ ] **1.2 Fetching.** `fetch.py`: daily file first, monthly zip if older, a clear `DataMissing` error if absent.
  Local download cache (git-ignored). Tests use small saved CSVs, never the network.
  *Done when:* tests cover daily, zip fallback and missing file.
- [ ] **1.3 Hourly mix + intensity.** `mix.py` averages 5-minute rows into clock hours (timestamps mark interval
  ends). `emission_factors.py` holds eGRID values + citation. `intensity.py` does the weighted average.
  *Done when:* tests pass for a hand-worked hour and for the DST day.
- [ ] **1.4 Forecast.** `forecast.py`: gas from forecast load (variant `load`) or from load minus the clean
  sources (variant `net_load`); nuclear and wind hold their latest value; hydro and other renewables use the
  7-day same-hour average. Never negative.
  *Done when:* tests recover a known straight line from made-up data.
- [ ] **1.5 Backtest.** `scripts/backtest.py` replays the last 7 nights for `load`, `net_load` and the
  typical-pattern baseline (b). Reports average error (g/kWh) and "best hour among the actual 3 calmest".
  *Done when:* results and the chosen variant are written in `data-notes.md`.

## Step 2: The tonight model + contract
*In plain words: put everything for tonight into one tidy file, with a rulebook that the file must follow.*

- [ ] **2.1 Contract.** `docs/tonight.schema.json` (JSON Schema) and `backend/samples/tonight.sample.json`.
  *Done when:* a test validates the sample against the schema.
- [ ] **2.2 Tonight model.** `tonight.py`: picks the night (current night before 8 AM, else the coming one),
  joins actual + forecast hours, labels by thirds, rounds the mix to exactly 100, adds `now`.
  *Done when:* tests pass for thirds, rounding, the which-night rule and the 16-hour DST night.
- [ ] **2.3 Command.** `python -m cleanr --out <path>`: builds, validates against the schema, writes the file
  only if valid (write to a temp file, then rename), exits non-zero on failure.
  *Done when:* tests prove a bad model never gets written.
- [ ] **2.4 Real run.** Run on live NYISO data and read tonight's numbers by eye.
  *Done when:* **Checkpoint 1:** Janhavi looks at tonight's labels and the best hour.

## Step 3: Frontend foundations
*In plain words: build the empty house with the right paint and wiring, and make it read the data file.*

- [ ] **3.1 Scaffold.** Vite + React in `frontend/`, Tailwind v4 with the tokens in `tokens.css`, the 4 Google
  Fonts, base path `/cleanr-nyc/`, Vitest.
  *Done when:* `npm run dev`, `npm test` and `npm run build` all work.
- [ ] **3.2 Data loading.** `loadTonight.js` fetches `tonight.json` (cache-busted) with loading, error and
  stale states.
  *Done when:* tests cover OK, error and stale.
- [ ] **3.3 Clock logic.** `time.js` (New York time, "3 AM" formatting) and `model.js`
  (`statusOf`, `bestHour`, `calmStretch`, `isStale`), test-first.
  *Done when:* tests pass, including a run with the machine set to a non-NYC time zone and a stale file.
- [ ] **3.4 App shell.** `App.jsx` holds `{ lens, selectedHour }`; AppBar, LensSwitch and a plain hour list.
  *Done when:* the browser shows tonight's real hours as a list.

## Step 4: Port the prototype
*In plain words: dress the house to look exactly like the approved design, with the V1 changes.*

- [ ] **4.1 Scene + scrubber.** Port the skyline drawing; hour count comes from the data; reduced motion =
  one still frame, no loop; pause when off screen; fix the moon hiding behind the tag. Scrubber with pointer +
  keyboard + slider labels.
  *Done when:* it matches the prototype side by side, and works with 15 and 16 hours.
- [ ] **4.2 Board card + calendar.** Both lens versions, info tooltip (relative-label copy), and
  `ics.js` for "Add to calendar" (1-hour event at the best hour).
  *Done when:* the .ics test passes and the file opens in Apple Calendar.
- [ ] **4.3 Tonight lens.** Hour rows with Actual / Live / Forecast tags, "Why 3 AM?" card that jumps to
  The grid, Coming soon chips.
- [ ] **4.4 The grid lens.** 100-dot mix, 5-row source list, Now vs calmest hour bars, "Why hours differ",
  footnotes (statewide; gas includes dual-fuel and oil), labels over the scene.
- [ ] **4.5 Share sheet.** Ticket card, "Save for Instagram Stories" (1080×1920 PNG, `storyImage.js`),
  native share on phones, focus handling.
  *Done when:* **Checkpoint 2:** checked at 390px wide, keyboard only, VoiceOver, reduced motion,
  and on Janhavi's phone.

## Step 5: Ship
*In plain words: put the house on the internet, set it to refresh itself every hour, and write the guidebook.*

- [ ] **5.1 CI.** `ci.yml`: on push to `develop`, run pytest, Vitest and the build.
  *Done when:* the first run is green on GitHub.
- [ ] **5.2 Deploy.** `deploy.yml`: on push to `main`, hourly at :10 and manual. Runs the pipeline, builds, deploys
  to Pages. Minimal permissions, one deploy at a time. If the pipeline fails, the old site stays up.
- [ ] **5.3 Go live.** Janhavi turns on Pages (Settings → Pages → Source: GitHub Actions). First deploy.
  *Done when:* the URL works, and the JSON updates on the next hourly run.
- [ ] **5.4 README.** What, why, how it works (the picture above), data and method, backtest results,
  screenshots, limitations, credits.
- [ ] **5.5 Release.** Final whole-project review (superpowers:requesting-code-review), merge `develop` →
  `main`, tag `v1.0.0`, update `progress.md`.
  *Done when:* **Checkpoint 3:** the live URL works on Janhavi's phone.

---

## Definition of done (V1)
- [ ] Live public URL that works well on a phone.
- [ ] Real NYISO data, refreshed every hour.
- [ ] Every hour shows Actual / Live / Forecast, and the copy follows the honesty rules.
- [ ] Keyboard, screen reader labels and reduced motion all work.
- [ ] README: what, why, how, data sources, method, backtest, screenshots.
- [ ] All tests pass in CI.

## Risks
| Risk | Plan |
|---|---|
| Forecast is weak (wind, imports) | The backtest shows it honestly; hours say Forecast; improve after V1 |
| Thirds always produce some Calm hours, even on a bad night | Copy says "compared with the rest of tonight" |
| Very flat night: tiny differences get different labels | Look at the spread in the step 1 data; decide then |
| GitHub's hourly schedule runs late or pauses after 60 days with no activity | "Data delayed" state; noted in README |
| Time runs short | Trim step 4 polish first; never cut the honesty labels or tests |

## Not in V1 (fast follows)
The wall · Solar as its own source · money / rate plans · environmental justice / peaker story ·
laundry, dishwasher, devices (chips only) · other cities · fast chargers · accounts · notifications · charger finding.

# Decision log

Newest at the bottom. Format: **date · decision · why**.

| Date | Decision | Why |
|---|---|---|
| 2026-10-14 | Primary users are NYC EV drivers who charge at home or in a garage overnight. Fast chargers are hidden in V1. | Overnight charging is the case where shifting a few hours is easy. Keeps V1 focused. |
| 2026-10-14 | The night runs 6 PM → 8 AM, one row per hour. | Covers the evening plug-in through morning, matching how people charge at home. |
| 2026-10-14 | Each hour gets a carbon intensity (g CO₂/kWh) from the fuel mix, labelled Calm / Busy / Rush hour. | One simple number per hour, translated into words people understand at a glance. |
| 2026-10-14 | Placeholder thresholds: Calm < 200, Busy 200–249, Rush ≥ 250 g/kWh. Tune with real data. | Taken from the prototype. Real data may need different or percentile-based cut-offs. |
| 2026-10-14 | Best time to charge = lowest-intensity future hour inside Con Ed off-peak (12–8 AM). | Calmest grid and cheapest pricing point the same way. Never recommends a past hour. |
| 2026-10-14 | Calm stretch = consecutive Calm hours around the best hour, inside off-peak. | Gives flexibility ("any time in this stretch works") without promising finish times. |
| 2026-10-14 | No finish times or "ready by" promises. | We don't know battery level or charge length. |
| 2026-10-14 | No dollar savings in V1. TOU vs SmartCharge is parked. | Rate plans vary per person; showing wrong numbers would hurt trust. |
| 2026-10-14 | Say "calmest hour", never "cleanest hour". | Avoids sounding like greenwashing. |
| 2026-10-14 | Don't claim individual impact ("you saved X grams"). | One car's effect is hard to measure honestly. "Fewer gas plants running" is true. |
| 2026-10-14 | Label hours Actual / Live / Forecast. | Be clear about what's measured and what's predicted. |
| 2026-10-14 | Data view titled "Powering New York", with a note that the mix is statewide. | NYISO's fuel mix is statewide; NYC runs on the state grid. |
| 2026-10-14 | Imports excluded from V1. | Not in the NYISO fuel mix feed. |
| 2026-10-14 | Parked: money, environmental justice / peaker story, laundry / dishwasher / devices (chips only), other cities, fast chargers, accounts, notifications, charger finding. | Keeps V1 small and shippable. Code stays city-agnostic where cheap. |
| 2026-10-14 | `cleanr-prototype.html` is the visual source of truth. Port it, don't redesign it. Never ship it. | The design is approved. It runs on mock data. |
| 2026-10-14 | Single dark "night" theme; pixel art only; Doto only for times; state colours only on state elements. | A consistent, recognisable visual system. |
| 2026-10-14 | Git: `main` = released, `develop` = integration, short-lived branches + PRs into `develop`. | Learn a real workflow; keep `main` always deployable. |
| 2026-10-14 | Ship V1 by the evening of 2026-10-15 as one sprint. Commit straight to `develop` during the sprint. | Owner's deadline. Branches + PRs slow a one-day sprint down. |
| 2026-10-15 | Forecast: predict gas from NYISO's load forecast (option a). Backtest against the typical-pattern baseline (option b). | Gas follows demand, and NYISO's load forecast already includes the weather. The backtest keeps us honest. |
| 2026-10-15 | Emission factors from EPA eGRID (New York gas and oil rates). | Official, citable, New York-specific. |
| 2026-10-15 | Calm / Busy / Rush are relative to tonight's own hours (thirds). Replaces the fixed placeholder thresholds. | Labels come from what NYISO's data says about tonight, not an arbitrary number. |
| 2026-10-15 | Solar parked for V1. | NYISO's fuel mix has no separate Solar category. |
| 2026-10-15 | Dual Fuel and Other Fossil Fuels counted under Gas, with a footnote. | Keeps the source list simple. All three burn fossil fuel. |
| 2026-10-15 | "Tonight on the wall" moved to a fast follow; storage decided later. | Needs shared storage. Not needed to ship V1. |
| 2026-10-15 | Installing packages and tools is allowed for the sprint. | Needed to build in one day. |
| 2026-10-15 | Use the Superpowers skills (plan, test first, verify before claiming done). Plan shape: 5 steps × at most 5 substeps. | Owner's request. A disciplined process with a plan that's easy to follow. |
| 2026-10-15 | The pipeline owns the data (mix, intensity, forecast, labels). The app owns anything clock-based (Live, best hour, calm stretch, stale). | The hourly job can run late; the best hour must never be in the past. |
| 2026-10-15 | All times in New York time, whatever the viewer's time zone. | Recruiters may view from anywhere; the answer is about New York nights. |
| 2026-10-15 | A JSON Schema file is the contract between pipeline and app. A file that breaks it is never published. | Catches mistakes before users see them; the app can trust its input. |
| 2026-10-15 | City settings (time zone, night, off-peak, feeds) live in one config file. | Keeps the code city-agnostic at almost no cost. |
| 2026-10-15 | Backtest two forecast versions (`load`, `net_load`) against the baseline; ship the best. | Let the data choose, and get an honest accuracy number for the README. |
| 2026-10-15 | Host on GitHub Pages. | Free for public repos; the hourly job can deploy without adding commits. |
| 2026-10-15 | "Other renewables" row uses the `--src-solar` colour token. | Keeps the approved palette; no new colour. |
| 2026-10-15 | Janhavi runs the commit commands at the end of each step. | Learning by doing, and the definition of done asks for it. |
| 2026-10-15 | Build "Native": Claude builds each step in this session; one fresh review at the end. | Fastest and cheapest for a one-day deadline. |

## Build rulings (V1 sprint, 2026-10-15)
Calls made while building, each with why and what it costs if wrong. Copied from the build ledger.

- plan uses "Step N / N.M" headings, not "### Task N"; task-start/task-brief scripts not used, ledger kept by hand — cost if wrong: none (format only).
- no git worktree; work on develop directly — owner's instruction (sprint) — cost if wrong: messier history, low.
- stop after each Step for the owner's step report + commit (owner instruction overrides "continuous execution") — cost: slower.
- Claude does not commit; Janhavi runs the commit commands given at each step end — owner instruction.
- plan said mix.hourly() + intensity.of(mix_row); split into mix.hourly_by_category/to_groups + intensity.gas_factor/of — gas group mixes gas+oil factors, so intensity must be weighted at category level — cost if wrong: none, internal API.
- eGRID2023 rev2 state-level NY rates (ST23) used, not subregion — NYISO mix is statewide — cost if wrong: small factor difference.
- added cleanr/history.py and cleanr/labels.py (not in plan file list) — backtest and pipeline both need them; one place each — cost if wrong: none.
- added CITY.night_hours/is_offpeak to config — night/off-peak are city rules — cost: none.
- added "hybrid" forecast variant to the backtest — honest comparison; kept for the README story — cost: ~10 lines.
- ran 21 nights, not 7 — 7 nights flipped the order; 21 is fairer — cost: none.
- shipped variant = "load" (option a) — lowest error 9.5 g/kWh, best-hour 15/21 — matches owner's choice.
- Janhavi asked Claude to run the step 1 commits ("okay commit step 1") — owner's direct instruction — cost: none.
- extra rules (mix sums to 100, hours 1h apart, valid times) live in cleanr/contract.py since JSON Schema can't express them — cost: none.
- tonight.assemble() is pure (tested), tonight.build() fetches then assembles — testability — cost: none.
- 8 AM switches to the next night (night_for) — night ends at the 8 AM row — cost: the 8 AM hour itself is never "Live".
- actual data after `now` is ignored; dataThrough capped at now — honest replays — tests RED→GREEN.
- CLI logic in cleanr/cli.py, __main__.py just calls it — testable without subprocess — cost: none.
- hand-wrote the Vite app instead of `npm create vite` (frontend/ wasn't empty; avoids template clutter) — cost: none.
- tests run with TZ=Europe/London always — proves NYC-time handling (Review Focus #1) — cost: none.
- OFFPEAK duplicated in frontend/src/lib/model.js (mirrors backend config) — keeps the contract unchanged — cost if wrong: two places to edit for another city.
- added frontend/scripts/screenshot.mjs + playwright-core (uses system Chrome) — headless Chrome can't go below ~500px; needed for real phone-width checks and README screenshots — cost: one dev dependency.
- prototype CSS ported as plain CSS (src/styles/app.css) using the same tokens; Tailwind for app shell only — fastest faithful port — cost: two styling styles in one app.
- haze follows tonight's relative intensity (prototype had fixed 200 g/kWh) — matches relative labels — cost: none.
- scene maps 14–16 hours onto the prototype's 15-step sky (t = f·14/(N−1)) — DST nights — tested.
- best row shows "Best" + status on two lines so every hour keeps its Forecast/Actual/Live label — cost: slightly taller best row.
- Why-card/hint copy branches when "now" (daytime) has LESS gas than the best hour — never claim a drop that isn't there.
- Stories → share sheet only on touch devices; download on computers — macOS Chrome can share, but download is expected — found by ui-check.
- ticket footer "CLEANR / NYC" instead of prototype's "cleanr.nyc" (domain not owned).
- "Powering New York at now", "Charged at 3 AM", date chip at midnight, Live by clock, 8 AM row, colour-only ticks — prototype/spec behaviour, kept — cost: none new.
- shipping `load` despite `typical` 16/21 vs 15/21 best-hour hits — owner's choice, documented, within noise — cost: maybe slightly worse picks; revisit with more nights.
- unknown new NYISO fuel category fails the run (fail closed) — better than a wrong file; "Data delayed" shows — cost: manual fix needed if NYISO adds a category.

## Deferred minor review findings
- OFFPEAK + "12–8 AM" duplicated in frontend (reviewer disagrees with 3.3 ruling) — move to tonight.json meta in a fast follow.
- Actions cache key per run → ~24 entries/day; key by day + prune old files.
- yesterday's daily file can be cached before complete (fetch.py cacheable=day<today) → use day < today-1.
- contract doesn't cross-check night.start/end vs hours, hourOfDay vs time, dataThrough/now.time parsing.
- unexpected errors share exit code 1 with contract failures (cli.py).
- selected hour index may point at another hour after a refresh switches nights (App.jsx).
- .ics long lines not folded (RFC 5545 recommends 75 octets); nyParts unused.

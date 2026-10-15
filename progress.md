# Progress

## Current phase
**Step 4 done. Checkpoint 2: Janhavi tries it on her phone. Then step 5 (Ship).**
**Deadline: V1 live by the evening of 2026-10-15.** Full plan: [docs/plan.md](docs/plan.md).

## Plan steps
- [x] 1. Data foundations (backend)
- [x] 2. The tonight model + contract
- [x] 3. Frontend foundations
- [x] 4. Port the prototype
- [ ] 5. Ship

## Done
- 2026-10-14: Created the GitHub repo with `main` and `develop` branches.
- 2026-10-14: Added `cleanr-prototype.html` (approved prototype, mock data) to the repo root.
- 2026-10-14: Created the starter template (CLAUDE.md, progress, README, .gitignore, docs, frontend/backend READMEs).
- 2026-10-14: Checked the NYISO CSV feeds. There's no separate Solar category.
- 2026-10-15: Locked the open decisions (see `docs/decisions.md`). Wrote plan v1.
- 2026-10-15: Installed the Superpowers plugin (v6.4.1). Rewrote the plan as v2: 5 steps × ≤5 substeps, with an architecture review.
- 2026-10-15: **Step 1 done.** Python backend: fetch NYISO (daily + zip + DST), hourly mix, eGRID intensity,
  forecast, labels, 21-night backtest. 41 tests pass. Forecast `load` (option a) wins: 9.5 g/kWh average error.
- 2026-10-15: **Step 2 done.** `docs/tonight.schema.json` contract, `tonight.py` model, `python -m cleanr` command
  (checks before writing, never overwrites a good file with a bad one). First real run: tonight's calmest hour 3 AM. 73 tests pass.
- 2026-10-15: Checkpoint 1 approved ("looks good").
- 2026-10-15: **Step 3 done.** Vite + React 19 + Tailwind 4 app with the prototype's tokens and fonts; loads `tonight.json`;
  clock logic (Live, best hour, calm stretch, stale) in New York time; 28 frontend tests; works at 320–390px.
- 2026-10-15: **Step 4 done.** Ported the prototype: skyline + scrubber, both lenses, info tooltip, .ics calendar,
  share sheet with 1080×1920 Stories image. Fixed: moon/tag overlap, reduced motion, desktop tooltip, 320px layout.
  43 frontend tests + 35/35 click-through checks.

## Next up
1. Checkpoint 2: Janhavi tries it on her phone (local Wi-Fi link).
2. Commit step 4.
3. Step 5: ship (GitHub Actions, Pages, README, release).

## Open questions
- None right now.

## Session log
- **2026-10-14**
  - Read the kickoff brief and the prototype.
  - Created the project template (docs + empty skeleton).
  - Verified the NYISO feed URLs, columns and fuel categories.
  - Deadline set: V1 live by the evening of 2026-10-15. Committing straight to `develop` for this sprint.
- **2026-10-15**
  - Locked decisions: forecast (a), EPA eGRID, relative labels, Solar parked, fossil under Gas, wall is a fast follow.
  - Installed Superpowers. Architecture review → plan v2: the app owns clock-based logic, NYC time everywhere,
    a JSON Schema contract, one city config, and a backtest of two forecast versions.
  - Added the step-report format (what we did · example · analogy · what's next) to `CLAUDE.md`.
  - Built step 1 test-first. Found and fixed a daylight-saving bug (the night was 1 hour short).
  - Backtest over 21 nights picked option (a), Janhavi's original choice.
  - Built step 2 test-first. First live run of the pipeline on real NYISO data.
  - Built step 3 test-first. Checked the real app at phone width with a screenshot script.
  - Built step 4. A click-through script found 3 real bugs (desktop tooltip, desktop Stories, 320px overflow); all fixed.

# Progress

## Current phase
**Phase 0: Project template.** Docs and an empty folder skeleton are in place. No app code yet.

**Deadline: V1 live by the evening of 2026-10-15.** One sprint, not multiple sessions.

## Sprint plan (2026-10-14 → 2026-10-15 evening)
1. **Data:** fetch real NYISO data, compute hourly intensity, tune thresholds, pick the forecast method.
2. **Pipeline:** Python script → `tonight.json`, small tests, hourly GitHub Action.
3. **Frontend:** Vite + React + Tailwind with the design tokens, reading `tonight.json`.
4. **Port the prototype:** skyline canvas, scrubber, both lenses, share sheet, .ics download.
5. **Ship:** deploy, README with screenshots, merge `develop` → `main`.

## Done
- 2026-10-14: Created the GitHub repo with `main` and `develop` branches.
- 2026-10-14: Added `cleanr-prototype.html` (approved prototype, mock data) to the repo root.
- 2026-10-14: Created the starter template: `CLAUDE.md`, `progress.md`, `README.md`, `.gitignore`,
  `docs/` (brief, design spec, data notes, decisions), `frontend/README.md`, `backend/README.md`.
- 2026-10-14: Checked the NYISO CSV feeds. All three URLs work over https.
  There's no separate Solar category in the fuel mix (see `docs/data-notes.md`).

## Next up
1. Jahnavi answers the open questions below.
2. Start sprint step 1 (data).

## Open questions
- **Forecast approach:** estimate gas share from the NYISO load forecast, or use the typical hourly pattern from recent days?
- **Wall storage:** drop from V1, keep local-only, or add a tiny hosted store later?
- **Hosting:** GitHub Pages or Vercel?
- **Emission factors:** which source (e.g. EPA eGRID) and which value per fuel category?
- **Label thresholds:** keep Calm < 200 / Busy 200–249 / Rush ≥ 250 g/kWh, or switch to percentiles once we see real data?
- **Solar in the UI:** the feed has no Solar category (it's likely inside "Other Renewables").
  How should the 5-source list (Nuclear, Hydro, Wind, Solar, Gas) map onto the real categories?
- **Dual Fuel / Other Fossil:** show these as "Gas", or as their own group?
- **Name spelling** in the docs: "Jahnavi" or "Janhavi"?

## Session log
- **2026-10-14**
  - Read the kickoff brief and the prototype.
  - Created the project template (docs + empty skeleton).
  - Verified the NYISO feed URLs, columns and fuel categories.
  - Deadline set: V1 live by the evening of 2026-10-15. Committing straight to `develop` for this sprint.

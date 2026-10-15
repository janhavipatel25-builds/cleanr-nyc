# Progress

## Current phase
**Plan locked. Next: sprint step 1 (Data).**
**Deadline: V1 live by the evening of 2026-10-15.** Full plan: [docs/plan.md](docs/plan.md).

## Sprint steps
- [ ] 1. Data: fetch NYISO, intensity, forecast fit, backtest
- [ ] 2. Pipeline: `tonight.json` + tests
- [ ] 3. Frontend scaffold
- [ ] 4. Port the prototype
- [ ] 5. Ship: workflows, GitHub Pages, README with screenshots

## Done
- 2026-10-14: Created the GitHub repo with `main` and `develop` branches.
- 2026-10-14: Added `cleanr-prototype.html` (approved prototype, mock data) to the repo root.
- 2026-10-14: Created the starter template: `CLAUDE.md`, `progress.md`, `README.md`, `.gitignore`,
  `docs/` (brief, design spec, data notes, decisions), `frontend/README.md`, `backend/README.md`.
- 2026-10-14: Checked the NYISO CSV feeds. There's no separate Solar category.
- 2026-10-15: Answered the open questions (see `docs/decisions.md`). Wrote `docs/plan.md`.
- 2026-10-15: Confirmed the repo is public, and that NYISO daily files go back ~10 days (older ones in monthly zips).

## Next up
1. Janhavi confirms the two assumptions below.
2. Start step 1: set up the Python backend and fetch real data.

## Open questions
- **Hosting:** GitHub Pages assumed. OK?
- **"Other renewables" row:** with Solar parked, the mix still has an "Other Renewables" category (~a few %).
  Show it as its own row, using the existing `--src-solar` colour token? (It must go somewhere for the mix to add up to 100.)

## Session log
- **2026-10-14**
  - Read the kickoff brief and the prototype.
  - Created the project template (docs + empty skeleton).
  - Verified the NYISO feed URLs, columns and fuel categories.
  - Deadline set: V1 live by the evening of 2026-10-15. Committing straight to `develop` for this sprint.
- **2026-10-15**
  - Locked decisions: forecast (a), EPA eGRID, relative labels, Solar parked, fossil under Gas, wall is a fast follow.
  - Wrote the full V1 build plan (`docs/plan.md`) and updated all docs to match.

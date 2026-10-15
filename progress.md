# Progress

## Current phase
**Plan revised (v2). Waiting for Janhavi's approval before building.**
**Deadline: V1 live by the evening of 2026-10-15.** Full plan: [docs/plan.md](docs/plan.md).

## Plan steps
- [ ] 1. Data foundations (backend)
- [ ] 2. The tonight model + contract
- [ ] 3. Frontend foundations
- [ ] 4. Port the prototype
- [ ] 5. Ship

## Done
- 2026-10-14: Created the GitHub repo with `main` and `develop` branches.
- 2026-10-14: Added `cleanr-prototype.html` (approved prototype, mock data) to the repo root.
- 2026-10-14: Created the starter template (CLAUDE.md, progress, README, .gitignore, docs, frontend/backend READMEs).
- 2026-10-14: Checked the NYISO CSV feeds. There's no separate Solar category.
- 2026-10-15: Locked the open decisions (see `docs/decisions.md`). Wrote plan v1.
- 2026-10-15: Installed the Superpowers plugin (v6.4.1). Rewrote the plan as v2: 5 steps × ≤5 substeps, with an architecture review.

## Next up
1. Janhavi approves plan v2 and answers the 3 questions below.
2. Push to `develop`.
3. Start step 1.1.

## Open questions
- **Defaults:** GitHub Pages for hosting, and the yellow `--src-solar` colour for the "Other renewables" row. OK?
- **Commits:** the brief's definition of done says Janhavi makes a meaningful number of commits.
  Should Janhavi run the commit command at the end of each substep, or should Claude commit?
- **Build approach (Superpowers):** "Native" (Claude builds each step, one fresh review at the end) or
  "Subagent-driven" (a fresh helper builds and a fresh reviewer checks every task; slower, costs more)?

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

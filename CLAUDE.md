# CLAUDE.md — standing instructions for Cleanr NYC

## Project in 5 lines
- **Cleanr NYC** is a mobile-first web app that tells New York EV drivers the **best time to charge tonight**.
- "Best" = the calmest hour on the grid (fewest gas plants running) inside Con Ed's off-peak window (12–8 AM).
- Mental model: **a weather app for the grid**. "Right now" plus a forecast from 6 PM to 8 AM.
- Data: public NYISO CSVs → a Python + pandas pipeline → one static `tonight.json` → a React + Tailwind frontend.
- It's a portfolio piece. The owner must be able to explain every part of it.

## Docs (read before working on that area)
- [docs/plan.md](docs/plan.md): **the V1 build plan** (steps, checkpoints, definition of done)
- [docs/product-brief.md](docs/product-brief.md): what, who, goals, product rules, out of scope
- [docs/design-spec.md](docs/design-spec.md): IA, components, tokens, fonts, motion, scene encodings
- [docs/data-notes.md](docs/data-notes.md): NYISO sources, intensity method, forecast, open data questions
- [docs/decisions.md](docs/decisions.md): decision log (date · decision · why)
- [progress.md](progress.md): current phase, next steps, open questions, session log
- [frontend/README.md](frontend/README.md) and [backend/README.md](backend/README.md): planned structure

## Session ritual
- **Start of every session:** read `progress.md`.
- **End of every session:** update `progress.md` (Done, Next up, Open questions, Session log).
- Log any new decision in `docs/decisions.md`.

## How to work with the owner (Janhavi)
- Janhavi is a product designer/PM, new to coding and GitHub. Teach as you go.
- Short, clear bullets. One step at a time. **Always end with the single next step.**
- Explain the *why* in one line when introducing a new concept, tool or command.
- No walls of text. No jargon without a one-line explanation.
- When Janhavi needs to run a command, put it in a code block and say what it does.
- If something is unclear or contradictory, ask. At most 3 questions at a time.
- **Ask before you:** push, open a PR, install packages, add dependencies, delete files,
  change git history, or touch anything outside this repo.
- **Janhavi makes the commits.** Prefer giving the git commands to run over running them silently.

## Git workflow
- **V1 sprint (deadline 2026-10-15 evening):** commit straight to `develop` when Janhavi asks.
  Feature branches + PRs below are the normal workflow after the sprint.
- `main` = live / released. `develop` = integration.
- All work happens on a short-lived branch off `develop`:
  `feature/...`, `fix/...`, `chore/...`, `docs/...`.
- Open a PR into `develop`. Merge `develop` → `main` only to release.
- Small commits with conventional messages: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Never commit to `main` directly. Never force-push.

## Design rules (full detail in docs/design-spec.md)
- `cleanr-prototype.html` is the **visual source of truth**. Port it; don't redesign it without asking.
  It is reference only and is never shipped as the app. Don't modify it.
- Single dark "night" theme. Pixel art is the only illustration language. Crisp and modern, not retro-arcade.
- Use the colour tokens only. No new hex values without asking.
- **Doto (pixel font) is ONLY for times** ("3 AM", hour labels, the scrubber tag). Nowhere else.
- **State colours (calm / busy / rush) go only on state elements.** Everything else uses theme tokens.
- Never rely on colour alone. Always pair it with a text label.
- Respect `prefers-reduced-motion`. Mobile-first, max content width ~440px.

## Honesty and copy rules
- Say **"calmest hour"**, never "cleanest hour".
- Calm / Busy / Rush are **relative to tonight's hours**. Copy must not imply a fixed standard.
- Don't overclaim individual impact: "fewer gas plants running", not "you saved X grams".
- Future hours = **Forecast**, past hours = **Actual**, now = **Live**.
- NYISO data is **statewide**. Title the data view "Powering New York" and note that NYC runs on the state grid.
- Imports from other states are not in the feed. Excluded from V1.
- No finish times / "ready by" promises. No dollar savings.
- Tone: warm, clear, a little playful. Never guilt-tripping.

## Out of scope for V1 (don't build)
The wall (fast follow) · Solar as its own source ·
Money/rate plans · environmental justice / peaker story · laundry, dishwasher, devices
(only "Coming soon" chips) · other cities (keep code city-agnostic where cheap) ·
fast-charger mode · accounts · notifications · charger finding.

## Commands
_To be filled in once they exist._
- Frontend dev server: `TBD`
- Frontend build: `TBD`
- Frontend tests: `TBD`
- Backend pipeline run: `TBD`
- Backend tests: `TBD`

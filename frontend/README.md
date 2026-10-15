# Frontend

The **React + Vite + Tailwind** app will live here. Nothing is installed yet.

- **Vite:** the dev server and build tool (fast reloads, outputs static files).
- **React:** UI components.
- **Tailwind:** utility CSS, with its theme mapped to the colour tokens in `docs/design-spec.md`.

It reads one static file, `tonight.json`, made by the backend pipeline.
No server and no database.

## Planned structure (sprint steps 3–4, see `docs/plan.md`)
```
frontend/
├── index.html
├── public/
│   └── tonight.json           ← written by the pipeline (generated, not committed)
└── src/
    ├── main.jsx               ← entry point
    ├── App.jsx                ← holds UI state: { lens, selectedHour }
    ├── styles/tokens.css      ← colour + font tokens from the design spec
    ├── lib/                   ← time.js (NYC time), model.js (Live, best hour, calm stretch, stale),
    │                            loadTonight.js, ics.js, storyImage.js (+ tests)
    └── components/
        ├── AppBar.jsx
        ├── LensSwitch.jsx
        ├── scene/             ← SkylineCanvas (ported from the prototype), Scrubber
        ├── BoardCard.jsx
        ├── tonight/           ← HourRows, WhyCard, ComingSoon
        ├── grid/              ← MixDots, SourceList, CompareBars, WhyHoursDiffer
        ├── ShareSheet.jsx
        └── PixelIcon.jsx
```

## Commands
Run from `frontend/`:
```
npm install          # one-time setup
npm run dev          # http://localhost:5173/cleanr-nyc/  (needs public/tonight.json, see backend/README.md)
npm test             # Vitest, on London time on purpose (proves New York time handling)
npm run build        # production build → dist/
node scripts/screenshot.mjs http://localhost:5173/cleanr-nyc/ shot.png 390 844   # phone-size screenshot
```

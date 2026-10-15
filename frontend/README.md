# Frontend

The **React + Vite + Tailwind** app will live here. Nothing is installed yet.

- **Vite:** the dev server and build tool (fast reloads, outputs static files).
- **React:** UI components.
- **Tailwind:** utility CSS, with its theme mapped to the colour tokens in `docs/design-spec.md`.

It reads one static file, `tonight.json`, made by the backend pipeline.
No server and no database.

## Planned structure (to confirm in Phase 3)
```
frontend/
├── index.html
├── public/
│   └── mock/tonight.json      ← mock data until the pipeline is live
└── src/
    ├── main.jsx               ← entry point
    ├── App.jsx                ← holds UI state: { lens, selectedHour }
    ├── styles/tokens.css      ← colour + font tokens from the design spec
    ├── lib/                   ← time formatting, data loading
    └── components/
        ├── AppBar.jsx
        ├── LensSwitch.jsx
        ├── scene/             ← SkylineCanvas (ported from the prototype), Scrubber
        ├── BoardCard.jsx
        ├── tonight/           ← HourRows, WhyCard, Wall, ComingSoon
        ├── grid/              ← MixDots, SourceList, CompareBars, WhyHoursDiffer
        ├── ShareSheet.jsx
        └── PixelIcon.jsx
```

## Commands
_To be filled in once the app exists._

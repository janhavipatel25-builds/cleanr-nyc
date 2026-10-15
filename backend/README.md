# Backend

The **Python + pandas data pipeline** will live here. Nothing is installed yet.

It's a **pipeline, not a server**: a script that runs on a schedule, does its work, writes a file, and exits.

1. **Fetch** NYISO public CSVs (real-time fuel mix + load forecast).
2. **Compute** hourly carbon intensity from the fuel mix, using cited emission factors.
3. **Build** the 6 PM → 8 AM hour model: label each hour, pick the best hour and the calm stretch.
4. **Write** one static `tonight.json` for the frontend.

A **GitHub Actions** cron job will run it (e.g. hourly) and publish the JSON.
See `docs/data-notes.md` for sources, method and open questions.

## Planned structure (to confirm in Phase 1–2)
```
backend/
├── notebooks/        ← Phase 1 data spike (explore one day of real data)
├── cleanr/
│   ├── fetch.py      ← download NYISO CSVs
│   ├── intensity.py  ← fuel mix → g CO₂/kWh
│   ├── tonight.py    ← hour model, labels, best hour, calm stretch
│   └── main.py       ← runs the steps, writes tonight.json
├── tests/            ← small tests for the logic (e.g. best-hour picking)
└── emission_factors  ← factors + citations (format TBD)
```

## Commands
_To be filled in once the pipeline exists._

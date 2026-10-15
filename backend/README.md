# Backend

The **Python + pandas data pipeline** will live here. Nothing is installed yet.

It's a **pipeline, not a server**: a script that runs on a schedule, does its work, writes a file, and exits.

1. **Fetch** NYISO public CSVs (real-time fuel mix + load forecast).
2. **Compute** hourly carbon intensity from the fuel mix, using cited emission factors.
3. **Build** the 6 PM → 8 AM hour model: label each hour, pick the best hour and the calm stretch.
4. **Write** one static `tonight.json` for the frontend.

A **GitHub Actions** cron job will run it (e.g. hourly) and publish the JSON.
See `docs/data-notes.md` for sources, method and open questions.

## Planned structure (sprint steps 1–2, see `docs/plan.md`)
```
backend/
├── requirements.txt
├── cleanr/
│   ├── fetch.py              ← download NYISO CSVs (daily files + monthly zips)
│   ├── intensity.py          ← fuel mix → g CO₂/kWh
│   ├── emission_factors.py   ← EPA eGRID factors + citation
│   ├── forecast.py           ← gas from the load forecast (option a)
│   ├── tonight.py            ← hour model, labels, best hour, calm stretch
│   └── main.py               ← runs the steps, writes tonight.json
├── scripts/backtest.py       ← step 1: test the forecast on past nights
├── samples/tonight.sample.json
└── tests/                    ← pytest: intensity, labels, best hour, calm stretch, DST
```

## Commands
_To be filled in once the pipeline exists._

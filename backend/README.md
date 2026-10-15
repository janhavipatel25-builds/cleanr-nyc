# Backend

The **Python + pandas data pipeline** will live here. Nothing is installed yet.

It's a **pipeline, not a server**: a script that runs on a schedule, does its work, writes a file, and exits.

1. **Fetch** NYISO public CSVs (real-time fuel mix + load forecast).
2. **Compute** hourly carbon intensity from the fuel mix, using cited emission factors.
3. **Build** the 6 PM → 8 AM hour model: label each hour, pick the best hour and the calm stretch.
4. **Write** one static `tonight.json` for the frontend.

A **GitHub Actions** cron job will run it (e.g. hourly) and publish the JSON.
See `docs/data-notes.md` for sources, method and open questions.

## Planned structure (plan steps 1–2, see `docs/plan.md`)
```
backend/
├── requirements.txt
├── cleanr/
│   ├── config.py             ← city settings: time zone, night, off-peak, feeds, fuel groups
│   ├── fetch.py              ← download NYISO CSVs (daily files + monthly zips)
│   ├── mix.py                ← 5-minute rows → hourly MW per group
│   ├── emission_factors.py   ← EPA eGRID factors + citation
│   ├── intensity.py          ← hourly mix → g CO₂/kWh
│   ├── forecast.py           ← predict the hours that haven't happened yet
│   ├── tonight.py            ← tonight's hours + labels → the tonight.json content
│   ├── history.py            ← recent actual hours (mix, load, intensity)
│   ├── labels.py             ← Calm / Busy / Rush by thirds
│   ├── contract.py           ← checks a file against docs/tonight.schema.json
│   ├── cli.py, __main__.py   ← `python -m cleanr --out <path>`: build, check, write
├── scripts/backtest.py       ← test the forecast on past nights
├── samples/tonight.sample.json
└── tests/                    ← pytest, with small saved CSVs (no network)
```
The output must follow `docs/tonight.schema.json`. The best hour and calm stretch are worked out in the app.

## Commands
Run from `backend/`:
```
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt   # one-time setup
.venv/bin/pytest                                                      # run the tests
.venv/bin/python -m cleanr --out ../frontend/public/tonight.json --cache .cache   # build tonight's file
.venv/bin/python scripts/backtest.py --nights 21                      # how good is the forecast?
```
Exit codes: `0` written · `1` broke the contract (nothing written) · `2` NYISO data missing (nothing written).

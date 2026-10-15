"""Replay recent nights: how good is each forecast version?

For each night, pretend it's 5 PM that day: use only the data we'd have had then,
forecast the whole night, and compare with what actually happened.

Run:  .venv/bin/python scripts/backtest.py [--nights 7]
"""

import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cleanr import fetch, forecast, history, intensity, labels  # noqa: E402
from cleanr.config import CITY  # noqa: E402

CACHE = Path(__file__).resolve().parents[1] / ".cache"
ISSUE_HOUR = 17  # we pretend to forecast at 5 PM


def score(pred: pd.Series, actual: pd.Series, offpeak: np.ndarray) -> dict:
    pred_labels, _ = labels.by_thirds(pred)
    actual_labels, _ = labels.by_thirds(actual)
    best = pred[offpeak].idxmin()
    calmest3 = actual[offpeak].nsmallest(3).index
    return {
        "mae": float((pred - actual).abs().mean()),
        "best_hit": best in calmest3,
        "label_match": float(np.mean([p == a for p, a in zip(pred_labels, actual_labels)])),
    }


def main(n_nights: int) -> None:
    today = datetime.now(CITY.tz).date()
    nights = [today - timedelta(days=k) for k in range(n_nights, 0, -1)]
    opts = dict(cache_dir=CACHE)
    hist = history.load(
        nights[0] - timedelta(days=forecast.FIT_DAYS + 1), today,
        fuel_mix=lambda d: fetch.fuel_mix(d, **opts),
        actual_load=lambda d: fetch.actual_load(d, **opts),
    )

    rows = []
    for day in nights:
        hours = CITY.night_hours(day)
        issue = pd.Timestamp(datetime.combine(day, datetime.min.time())).tz_localize(CITY.tz.key) \
            + pd.Timedelta(hours=ISSUE_HOUR)
        known = hist[hist.index < issue]
        load_fc = fetch.load_forecast(day, **opts).set_index("time")["mw"]
        actual = hist["intensity"].reindex(hours)
        if actual.isna().any():
            print(f"skip {day}: actual data incomplete")
            continue
        gas_f = known["gasFactor"].iloc[-7 * 24:].mean()
        offpeak = np.array([CITY.is_offpeak(h) for h in hours])
        row = {"night": day.isoformat(), "spread": float(actual.max() - actual.min())}
        for variant in forecast.VARIANTS:
            mix = forecast.night(known, load_fc, hours, variant=variant)
            pred = intensity.of(mix, pd.Series(gas_f, index=hours))
            for k, v in score(pred, actual, offpeak).items():
                row[f"{variant}.{k}"] = v
        rows.append(row)

    df = pd.DataFrame(rows).set_index("night")
    print("\nPer night (MAE = average error, g CO2/kWh; spread = calmest-to-busiest hour, actual):")
    print(df[["spread"] + [f"{v}.mae" for v in forecast.VARIANTS]].round(1).to_string())
    print("\nSummary over", len(df), "nights:")
    summary = pd.DataFrame({
        v: {
            "avg error (g/kWh)": round(df[f"{v}.mae"].mean(), 1),
            "best hour in actual calmest 3": f"{int(df[f'{v}.best_hit'].sum())}/{len(df)}",
            "labels matching": f"{df[f'{v}.label_match'].mean():.0%}",
        }
        for v in forecast.VARIANTS
    })
    print(summary.to_string())
    a, b = forecast.fit_gas(hist.dropna(subset=["load"]), "net_load")
    print(f"\nnet_load fit on latest 14 days: gas = {a:.0f} + {b:.3f} × (load − clean)")
    print(f"average night spread: {df['spread'].mean():.1f} g/kWh")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--nights", type=int, default=7)
    main(parser.parse_args().nights)

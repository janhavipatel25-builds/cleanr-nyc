"""Predict the fuel mix for hours that haven't happened yet.

NYISO forecasts demand (load), not carbon. Gas plants follow demand, so:
  - gas:   a straight line fitted on the last 14 days
           ("load": gas vs load, "net_load": gas vs load minus clean power)
  - nuclear, wind: hold the latest value (nuclear barely moves; no wind forecast in the feed)
  - hydro, other renewables: the same hour's average over the last 7 days
"typical" is the simple baseline: every group = the same hour's average over the last 7 days.
"hybrid" starts from the typical hour, then moves gas up or down by how far forecast
demand is from that hour's typical demand (slope from the "load" fit).
"""

import numpy as np
import pandas as pd

from .config import CLEAN_GROUPS, GROUPS

VARIANTS = ("load", "net_load", "typical", "hybrid")
FIT_DAYS = 14
PATTERN_DAYS = 7


def night(history: pd.DataFrame, load_fc: pd.Series, hours: pd.DatetimeIndex,
          variant: str = "load") -> pd.DataFrame:
    """MW per group for each requested hour.

    history: hourly actuals, columns = GROUPS + "load", index = hour start (New York time).
    load_fc: forecast statewide load (MW) indexed by hour start; must cover `hours`.
    """
    if variant not in VARIANTS:
        raise ValueError(f"Unknown forecast variant {variant!r}; use one of {VARIANTS}")

    out = pd.DataFrame(index=hours, columns=list(GROUPS), dtype=float)
    for group in ("hydro", "otherRenewables"):
        out[group] = _same_hour_mean(history[group], hours)
    if variant == "typical":
        for group in ("nuclear", "wind", "gas"):
            out[group] = _same_hour_mean(history[group], hours)
        return out

    out["nuclear"] = history["nuclear"].iloc[-1]
    out["wind"] = history["wind"].iloc[-1]

    load = load_fc.reindex(hours).to_numpy(dtype=float)
    if variant == "hybrid":
        _, b = fit_gas(history, "load")
        typical_gas = _same_hour_mean(history["gas"], hours)
        typical_load = _same_hour_mean(history["load"], hours)
        out["gas"] = np.clip(typical_gas + b * (load - typical_load), 0, None)
        return out

    a, b = fit_gas(history, variant)
    x = load if variant == "load" else load - out[list(CLEAN_GROUPS)].sum(axis=1).to_numpy()
    out["gas"] = np.clip(a + b * x, 0, None)
    return out


def fit_gas(history: pd.DataFrame, variant: str) -> tuple[float, float]:
    """Least-squares line gas = a + b·x over the last 14 days. Returns (a, b)."""
    recent = history[history.index >= history.index.max() - pd.Timedelta(days=FIT_DAYS)]
    recent = recent.dropna(subset=["gas", "load"])
    x = recent["load"] if variant == "load" else recent["load"] - recent[list(CLEAN_GROUPS)].sum(axis=1)
    b, a = np.polyfit(x.to_numpy(dtype=float), recent["gas"].to_numpy(dtype=float), 1)
    return float(a), float(b)


def _same_hour_mean(series: pd.Series, hours: pd.DatetimeIndex) -> np.ndarray:
    values = []
    for hour in hours.hour:
        same = series[series.index.hour == hour].dropna().iloc[-PATTERN_DAYS:]
        values.append(same.mean() if len(same) else series.dropna().iloc[-1])
    return np.array(values, dtype=float)

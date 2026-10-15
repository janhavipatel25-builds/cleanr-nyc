"""Recent actual hours: mix per group, statewide load, gas factor and intensity."""

from datetime import date, timedelta

import pandas as pd

from . import fetch, intensity, mix


def load(first: date, last: date, *, fuel_mix=fetch.fuel_mix, actual_load=fetch.actual_load) -> pd.DataFrame:
    """Hourly actuals from `first` to `last` (inclusive). Days NYISO doesn't have are skipped.

    Columns: the five groups (MW), load (MW), gasFactor (g/kWh), intensity (g/kWh).
    Index: hour start, New York time.
    """
    fuel_days, load_days = [], []
    day = first
    while day <= last:
        try:
            fuel_days.append(fuel_mix(day))
        except fetch.DataMissing:
            pass
        try:
            load_days.append(actual_load(day))
        except fetch.DataMissing:
            pass
        day += timedelta(days=1)
    if not fuel_days:
        raise fetch.DataMissing(f"No NYISO fuel mix between {first} and {last}")

    by_category = mix.hourly_by_category(pd.concat(fuel_days, ignore_index=True))
    groups = mix.to_groups(by_category)
    out = groups.assign(
        gasFactor=intensity.gas_factor(by_category),
        intensity=intensity.of(groups, intensity.gas_factor(by_category)),
    )
    if load_days:
        out["load"] = mix.hourly_load(pd.concat(load_days, ignore_index=True)).reindex(out.index)
    else:
        out["load"] = float("nan")
    return out

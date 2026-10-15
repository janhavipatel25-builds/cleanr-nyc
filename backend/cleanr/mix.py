"""Turn 5-minute NYISO rows into hourly averages."""

import pandas as pd

from .config import CITY, GROUPS


def _hour_of(times: pd.Series, interval_end: bool) -> pd.Series:
    """The clock hour each reading belongs to, in New York time.

    Floor in UTC: New York's offset is whole hours, and UTC has no repeated 1 AM.
    """
    utc = times.dt.tz_convert("UTC")
    if interval_end:  # 01:00 closes the 12 AM slot
        utc = utc - pd.Timedelta(seconds=1)
    return utc.dt.floor("h").dt.tz_convert(CITY.tz.key)


def hourly_by_category(fuel5: pd.DataFrame) -> pd.DataFrame:
    """Mean MW per NYISO fuel category for each hour. Index: hour start."""
    unknown = set(fuel5["category"]) - set(CITY.fuel_groups)
    if unknown:
        raise ValueError(f"Unknown NYISO fuel categories: {sorted(unknown)}")
    df = fuel5.assign(hour=_hour_of(fuel5["time"], interval_end=True))
    per_reading = df.pivot_table(index=["hour", "time"], columns="category", values="mw", aggfunc="sum")
    hourly = per_reading.fillna(0.0).groupby(level="hour").mean()
    hourly = hourly.reindex(columns=list(CITY.fuel_groups), fill_value=0.0)
    hourly.columns.name = None
    return hourly


def to_groups(by_category: pd.DataFrame) -> pd.DataFrame:
    """Sum NYISO categories into the app's five groups."""
    grouped = by_category.T.groupby(CITY.fuel_groups).sum().T
    return grouped.reindex(columns=list(GROUPS), fill_value=0.0)


def hourly_load(load5: pd.DataFrame) -> pd.Series:
    """Mean statewide load (all zones summed) for each hour. Index: hour start."""
    statewide = load5.groupby("time")["mw"].sum()
    hours = _hour_of(statewide.index.to_series(), interval_end=False)
    return statewide.groupby(hours.to_numpy()).mean().rename_axis("hour")

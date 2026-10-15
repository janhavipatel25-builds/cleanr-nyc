from datetime import date

import pandas as pd
import pytest

from cleanr import history
from cleanr.emission_factors import G_PER_KWH
from cleanr.fetch import DataMissing

NY = "America/New_York"


def fake_fuel(day):
    t = pd.Timestamp(day).tz_localize(NY) + pd.Timedelta(minutes=5)
    return pd.DataFrame({
        "time": [t, t],
        "category": ["Nuclear", "Natural Gas"],
        "mw": [3000.0, 1000.0],
    })


def fake_load(day):
    t = pd.Timestamp(day).tz_localize(NY)
    return pd.DataFrame({"time": [t, t], "zone": ["CAPITL", "N.Y.C."], "mw": [1000.0, 3000.0]})


def test_history_joins_mix_load_and_intensity_across_days():
    df = history.load(date(2026, 10, 1), date(2026, 10, 2), fuel_mix=fake_fuel, actual_load=fake_load)
    assert len(df) == 2
    assert {"nuclear", "gas", "load", "gasFactor", "intensity"} <= set(df.columns)
    first = df.iloc[0]
    assert first["load"] == 4000
    assert first["gasFactor"] == pytest.approx(G_PER_KWH["gas"])
    assert first["intensity"] == pytest.approx(G_PER_KWH["gas"] * 1000 / 4000)


def test_history_remembers_the_latest_reading_time():
    df = history.load(date(2026, 10, 1), date(2026, 10, 2), fuel_mix=fake_fuel, actual_load=fake_load)
    assert df.attrs["dataThrough"] == "2026-10-02T00:05:00-04:00"


def test_a_missing_day_is_skipped_not_fatal():
    def fuel(day):
        if day == date(2026, 10, 2):
            raise DataMissing("nope")
        return fake_fuel(day)

    df = history.load(date(2026, 10, 1), date(2026, 10, 2), fuel_mix=fuel, actual_load=fake_load)
    assert len(df) == 1

from datetime import date

import numpy as np
import pandas as pd
import pytest

from cleanr import contract, intensity, tonight

NY = "America/New_York"


def ny(s):
    return pd.Timestamp(s, tz=NY)


def make_history(until, start="2026-10-01 00:00"):
    """Hourly actuals with a daily rhythm: busier evenings, calmer nights."""
    idx = pd.date_range(ny(start).tz_convert("UTC"), ny(until).tz_convert("UTC"), freq="h").tz_convert(NY)
    h = idx.hour.to_numpy()
    load = 13000 + 3000 * np.cos((h - 19) / 24 * 2 * np.pi)
    df = pd.DataFrame({
        "nuclear": 3300.0, "hydro": 2500.0, "wind": 600.0, "otherRenewables": 200.0,
        "gas": 100 + 0.5 * load, "load": load,
    }, index=idx)
    df["gasFactor"] = 422.8
    df["intensity"] = intensity.of(df[["nuclear", "hydro", "wind", "otherRenewables", "gas"]], df["gasFactor"])
    df.attrs["dataThrough"] = (idx.max() + pd.Timedelta(minutes=35)).isoformat()
    return df


def make_load_forecast(start="2026-10-15 00:00", days=6):
    idx = pd.date_range(ny(start).tz_convert("UTC"), periods=days * 24, freq="h").tz_convert(NY)
    h = idx.hour.to_numpy()
    return pd.Series(13000 + 3000 * np.cos((h - 19) / 24 * 2 * np.pi), index=idx)


@pytest.mark.parametrize("clock, night", [
    ("2026-10-15 10:00", date(2026, 10, 15)),  # daytime → the coming night
    ("2026-10-15 19:00", date(2026, 10, 15)),  # evening → tonight
    ("2026-10-16 02:00", date(2026, 10, 15)),  # after midnight → still last night
    ("2026-10-16 07:59", date(2026, 10, 15)),
    ("2026-10-16 08:00", date(2026, 10, 16)),  # 8 AM → the next night
])
def test_which_night_is_tonight(clock, night):
    assert tonight.night_for(ny(clock)) == night


def test_percentages_always_add_up_to_100():
    pct = tonight.percentages({"nuclear": 33.4, "hydro": 33.3, "wind": 33.3, "otherRenewables": 0, "gas": 0})
    assert pct == {"nuclear": 34, "hydro": 33, "wind": 33, "otherRenewables": 0, "gas": 0}
    pct = tonight.percentages({"nuclear": 3300, "hydro": 2500, "wind": 650, "otherRenewables": 210, "gas": 6900})
    assert sum(pct.values()) == 100
    assert all(isinstance(v, int) for v in pct.values())


def test_evening_run_mixes_actual_and_forecast_hours():
    now = ny("2026-10-15 21:35")
    doc = tonight.assemble(now, make_history("2026-10-15 21:00"), make_load_forecast())
    contract.validate(doc)
    sources = [h["source"] for h in doc["hours"]]
    assert sources[:4] == ["actual"] * 4          # 6, 7, 8, 9 PM
    assert set(sources[4:]) == {"forecast"}
    assert doc["now"]["time"] == "2026-10-15T21:00:00-04:00"
    assert doc["night"]["start"] == "2026-10-15T18:00:00-04:00"


def test_labels_are_thirds_of_tonight():
    doc = tonight.assemble(ny("2026-10-15 21:35"), make_history("2026-10-15 21:00"), make_load_forecast())
    found = [h["label"] for h in doc["hours"]]
    assert found.count("calm") == 5 and found.count("busy") == 5 and found.count("rush") == 5


def test_daytime_run_forecasts_the_whole_coming_night():
    doc = tonight.assemble(ny("2026-10-15 10:10"), make_history("2026-10-15 10:00"), make_load_forecast())
    contract.validate(doc)
    assert {h["source"] for h in doc["hours"]} == {"forecast"}
    assert doc["now"]["time"] == "2026-10-15T10:00:00-04:00"


def test_daylight_saving_night_has_16_hours_and_passes_the_contract():
    now = ny("2026-10-31 20:10")
    doc = tonight.assemble(now, make_history("2026-10-31 20:00"), make_load_forecast("2026-10-31 00:00", 3))
    contract.validate(doc)
    assert len(doc["hours"]) == 16


def test_a_missing_actual_hour_is_marked_forecast():
    hist = make_history("2026-10-15 21:00").drop(ny("2026-10-15 19:00"))
    doc = tonight.assemble(ny("2026-10-15 21:35"), hist, make_load_forecast())
    assert [h["source"] for h in doc["hours"][:4]] == ["actual", "forecast", "actual", "actual"]


def test_data_from_after_now_is_ignored():
    hist = make_history("2026-10-16 08:00")  # history runs past "now"
    doc = tonight.assemble(ny("2026-10-15 21:35"), hist, make_load_forecast())
    assert [h["source"] for h in doc["hours"]].count("actual") == 4
    assert doc["now"]["time"] == "2026-10-15T21:00:00-04:00"
    assert doc["meta"]["dataThrough"] == "2026-10-15T21:35:00-04:00"  # never later than now


def test_meta_records_method_factors_and_data_time():
    hist = make_history("2026-10-15 21:00")
    doc = tonight.assemble(ny("2026-10-15 21:35"), hist, make_load_forecast())
    assert doc["meta"]["forecastMethod"] == "load-v1"
    assert doc["meta"]["dataThrough"] == hist.attrs["dataThrough"]
    assert doc["meta"]["emissionFactors"]["gas"] == pytest.approx(422.8, abs=0.1)
    assert doc["generatedAt"] == "2026-10-15T21:35:00-04:00"

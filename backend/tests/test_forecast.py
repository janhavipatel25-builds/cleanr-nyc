import numpy as np
import pandas as pd
import pytest

from cleanr import forecast
from cleanr.config import GROUPS

NY = "America/New_York"


def make_history(days=14, gas_rule=None):
    """Made-up hourly history with a known straight-line link between demand and gas."""
    hours = pd.date_range("2026-10-01 00:00", periods=days * 24, freq="h", tz=NY)
    h = hours.hour.to_numpy()
    load = 12000 + 3000 * np.sin(h / 24 * 2 * np.pi)
    df = pd.DataFrame({
        "nuclear": 3300.0,
        "hydro": 2500 + 10 * h,          # depends on the hour of day
        "wind": np.linspace(500, 900, len(hours)),  # last value = 900
        "otherRenewables": 200.0,
        "load": load,
    }, index=hours)
    clean = df[["nuclear", "hydro", "wind", "otherRenewables"]].sum(axis=1)
    df["gas"] = gas_rule(df["load"], clean) if gas_rule else 100 + 0.5 * df["load"]
    return df


def future(n=3, start="2026-10-15 00:00"):
    return pd.date_range(start, periods=n, freq="h", tz=NY)


def test_shape_matches_the_requested_hours():
    hist = make_history()
    hours = future()
    out = forecast.night(hist, pd.Series(13000.0, index=hours), hours, variant="load")
    assert list(out.index) == list(hours)
    assert list(out.columns) == list(GROUPS)


def test_load_variant_recovers_the_straight_line():
    hist = make_history(gas_rule=lambda load, clean: 100 + 0.5 * load)
    hours = future(1)
    out = forecast.night(hist, pd.Series([10000.0], index=hours), hours, variant="load")
    assert out["gas"].iloc[0] == pytest.approx(100 + 0.5 * 10000, rel=1e-6)


def test_net_load_variant_subtracts_predicted_clean_power():
    hist = make_history(gas_rule=lambda load, clean: 50 + 0.9 * (load - clean))
    hours = future(1)  # midnight
    out = forecast.night(hist, pd.Series([12000.0], index=hours), hours, variant="net_load")
    clean = out[["nuclear", "hydro", "wind", "otherRenewables"]].sum(axis=1).iloc[0]
    assert out["gas"].iloc[0] == pytest.approx(50 + 0.9 * (12000 - clean), rel=1e-6)


def test_nuclear_and_wind_hold_their_latest_value():
    hist = make_history()
    hours = future()
    out = forecast.night(hist, pd.Series(13000.0, index=hours), hours, variant="load")
    assert (out["nuclear"] == 3300).all()
    assert list(out["wind"]) == pytest.approx([900, 900, 900])


def test_hydro_uses_the_same_hour_over_the_last_7_days():
    hist = make_history()
    hours = future(3, start="2026-10-15 05:00")
    out = forecast.night(hist, pd.Series(13000.0, index=hours), hours, variant="load")
    assert list(out["hydro"]) == [2550, 2560, 2570]


def test_gas_is_never_negative():
    hist = make_history(gas_rule=lambda load, clean: -20000 + 2 * load)
    hours = future(1)
    out = forecast.night(hist, pd.Series([1000.0], index=hours), hours, variant="load")
    assert out["gas"].iloc[0] == 0


def test_typical_variant_is_the_same_hour_average():
    hist = make_history()
    hours = future(1, start="2026-10-15 03:00")
    out = forecast.night(hist, pd.Series([99999.0], index=hours), hours, variant="typical")
    expected = hist[hist.index.hour == 3].iloc[-7:]["gas"].mean()
    assert out["gas"].iloc[0] == pytest.approx(expected)


def test_hybrid_adjusts_the_typical_hour_by_how_far_demand_differs():
    hist = make_history(gas_rule=lambda load, clean: 100 + 0.5 * load)
    hours = future(1, start="2026-10-15 03:00")
    typical_load = hist[hist.index.hour == 3].iloc[-7:]["load"].mean()
    out = forecast.night(hist, pd.Series([typical_load + 1000], index=hours), hours, variant="hybrid")
    typical_gas = hist[hist.index.hour == 3].iloc[-7:]["gas"].mean()
    assert out["gas"].iloc[0] == pytest.approx(typical_gas + 0.5 * 1000, rel=1e-6)


def test_unknown_variant_is_an_error():
    hist = make_history()
    hours = future(1)
    with pytest.raises(ValueError):
        forecast.night(hist, pd.Series([1.0], index=hours), hours, variant="magic")

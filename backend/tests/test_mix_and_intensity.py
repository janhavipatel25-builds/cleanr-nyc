import pandas as pd
import pytest

from cleanr import emission_factors, intensity, mix

NY = "America/New_York"


def five_min(rows):
    """rows: (local time string, category, mw). Times are interval ends, like NYISO."""
    return pd.DataFrame({
        "time": pd.to_datetime([r[0] for r in rows]).tz_localize(NY),
        "category": [r[1] for r in rows],
        "mw": [float(r[2]) for r in rows],
    })


def test_interval_end_times_belong_to_the_hour_before():
    df = five_min([
        ("2026-10-13 00:05", "Nuclear", 100),
        ("2026-10-13 01:00", "Nuclear", 200),  # last slot of 12 AM
        ("2026-10-13 01:05", "Nuclear", 900),  # first slot of 1 AM
    ])
    hourly = mix.hourly_by_category(df)
    assert hourly.loc[pd.Timestamp("2026-10-13 00:00", tz=NY), "Nuclear"] == 150
    assert hourly.loc[pd.Timestamp("2026-10-13 01:00", tz=NY), "Nuclear"] == 900


def test_daylight_saving_night_has_two_1am_hours():
    edt = pd.Timestamp("2025-11-02 01:30").tz_localize(NY, ambiguous=True)
    est = pd.Timestamp("2025-11-02 01:30").tz_localize(NY, ambiguous=False)
    df = pd.DataFrame({"time": [edt, est], "category": ["Wind", "Wind"], "mw": [10.0, 20.0]})
    hourly = mix.hourly_by_category(df)
    assert len(hourly) == 2
    assert list(hourly["Wind"]) == [10.0, 20.0]


def test_fossil_categories_are_summed_into_gas():
    df = five_min([
        ("2026-10-13 00:05", "Natural Gas", 100),
        ("2026-10-13 00:05", "Dual Fuel", 50),
        ("2026-10-13 00:05", "Other Fossil Fuels", 10),
        ("2026-10-13 00:05", "Nuclear", 300),
    ])
    groups = mix.to_groups(mix.hourly_by_category(df))
    assert list(groups.columns) == ["nuclear", "hydro", "wind", "otherRenewables", "gas"]
    row = groups.iloc[0]
    assert row["gas"] == 160
    assert row["nuclear"] == 300
    assert row["wind"] == 0


def test_unknown_category_is_an_error():
    df = five_min([("2026-10-13 00:05", "Fusion", 1)])
    with pytest.raises(ValueError, match="Fusion"):
        mix.hourly_by_category(df)


def test_statewide_load_sums_zones_per_hour():
    load = pd.DataFrame({
        "time": pd.to_datetime(["2026-10-13 00:00", "2026-10-13 00:00", "2026-10-13 00:55"]).tz_localize(NY),
        "zone": ["CAPITL", "N.Y.C.", "CAPITL"],
        "mw": [1000.0, 4000.0, 1200.0],
    })
    hourly = mix.hourly_load(load)
    # 00:00 → 5000 statewide, 00:55 → 1200 (only one zone reported): mean 3100
    assert hourly.iloc[0] == 3100


def test_egrid_factors_are_converted_to_grams_per_kwh():
    assert emission_factors.LB_PER_MWH["gas"] == 932.164
    assert emission_factors.G_PER_KWH["gas"] == pytest.approx(422.82, abs=0.01)
    assert emission_factors.G_PER_KWH["oil"] == pytest.approx(508.55, abs=0.01)
    assert "eGRID2023" in emission_factors.SOURCE


def test_gas_group_factor_weights_gas_and_oil():
    cats = pd.DataFrame({"Natural Gas": [100.0], "Dual Fuel": [0.0], "Other Fossil Fuels": [100.0]})
    expected = (emission_factors.G_PER_KWH["gas"] + emission_factors.G_PER_KWH["oil"]) / 2
    assert intensity.gas_factor(cats).iloc[0] == pytest.approx(expected)


def test_intensity_is_gas_share_times_gas_factor():
    groups = pd.DataFrame({"nuclear": [500.0], "hydro": [0.0], "wind": [0.0],
                           "otherRenewables": [0.0], "gas": [500.0]})
    result = intensity.of(groups, pd.Series([400.0]))
    assert result.iloc[0] == pytest.approx(200.0)


def test_intensity_for_a_hand_worked_hour():
    df = five_min([
        ("2026-10-13 00:05", "Nuclear", 3300),
        ("2026-10-13 00:05", "Hydro", 2700),
        ("2026-10-13 00:05", "Natural Gas", 2700),
        ("2026-10-13 00:05", "Dual Fuel", 3300),
    ])
    cats = mix.hourly_by_category(df)
    value = intensity.of(mix.to_groups(cats), intensity.gas_factor(cats)).iloc[0]
    # half the power is gas-fired, at the gas rate
    assert value == pytest.approx(emission_factors.G_PER_KWH["gas"] / 2)

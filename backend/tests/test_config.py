from cleanr.config import CITY, GROUPS


def test_city_is_new_york_time():
    assert CITY.key == "nyc"
    assert CITY.tz.key == "America/New_York"


def test_night_and_offpeak_windows():
    assert (CITY.night_start, CITY.night_end) == (18, 8)
    assert CITY.offpeak == (0, 8)


def test_every_nyiso_fuel_category_maps_to_a_group():
    nyiso_categories = {
        "Dual Fuel", "Hydro", "Natural Gas", "Nuclear",
        "Other Fossil Fuels", "Other Renewables", "Wind",
    }
    assert set(CITY.fuel_groups) == nyiso_categories
    assert set(CITY.fuel_groups.values()) == set(GROUPS)


def test_fossil_categories_count_as_gas():
    for category in ("Natural Gas", "Dual Fuel", "Other Fossil Fuels"):
        assert CITY.fuel_groups[category] == "gas"


def test_a_normal_night_has_15_hours_from_6pm_to_8am():
    from datetime import date
    hours = CITY.night_hours(date(2026, 10, 15))
    assert len(hours) == 15
    assert hours[0].isoformat() == "2026-10-15T18:00:00-04:00"
    assert hours[-1].isoformat() == "2026-10-16T08:00:00-04:00"


def test_the_daylight_saving_night_has_16_hours():
    from datetime import date
    hours = CITY.night_hours(date(2026, 10, 31))
    assert len(hours) == 16
    assert [h.hour for h in hours].count(1) == 2


def test_offpeak_is_midnight_to_8am():
    import pandas as pd
    ny = "America/New_York"
    assert CITY.is_offpeak(pd.Timestamp("2026-10-16 00:00", tz=ny))
    assert CITY.is_offpeak(pd.Timestamp("2026-10-16 07:00", tz=ny))
    assert not CITY.is_offpeak(pd.Timestamp("2026-10-16 08:00", tz=ny))
    assert not CITY.is_offpeak(pd.Timestamp("2026-10-15 23:00", tz=ny))


def test_feed_urls():
    assert CITY.daily_url("rtfuelmix", "20261014") == (
        "https://mis.nyiso.com/public/csv/rtfuelmix/20261014rtfuelmix.csv"
    )
    assert CITY.monthly_zip_url("pal", "202609") == (
        "https://mis.nyiso.com/public/csv/pal/20260901pal_csv.zip"
    )

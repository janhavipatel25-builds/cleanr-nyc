import io
import zipfile
from datetime import date

import pytest

from cleanr import fetch

FUEL_CSV = b"""Time Stamp,Time Zone,Fuel Category,Gen MW
10/13/2026 00:05:00,EDT,Nuclear,3305.0
10/13/2026 00:05:00,EDT,Natural Gas,2724.0
10/13/2026 00:10:00,EDT,Nuclear,3301.0
"""

DST_FUEL_CSV = b"""Time Stamp,Time Zone,Fuel Category,Gen MW
11/02/2025 01:55:00,EDT,Nuclear,3000.0
11/02/2025 01:00:00,EST,Nuclear,3001.0
"""

PAL_CSV = b'''"Time Stamp","Time Zone","Name","PTID","Load"
"10/13/2026 00:00:00","EDT","CAPITL",61757,1120.5
"10/13/2026 00:00:00","EDT","N.Y.C.",61761,4400.0
'''

ISOLF_DST_CSV = b'''"Time Stamp","Capitl","N.Y.C.","NYISO"
"11/02/2025 00:00",1067,4100,13000
"11/02/2025 01:00",1043,4000,12500
"11/02/2025 01:00",1043,4000,12500
"11/02/2025 02:00",1030,3900,12300
'''


def fake_get(responses):
    """A pretend internet: URL → bytes, anything else is a 404 (None)."""
    calls = []

    def get(url):
        calls.append(url)
        return responses.get(url)

    get.calls = calls
    return get


def zipped(name, data):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(name, data)
    return buf.getvalue()


DAILY = "https://mis.nyiso.com/public/csv/rtfuelmix/20261013rtfuelmix.csv"
MONTHLY = "https://mis.nyiso.com/public/csv/rtfuelmix/20261001rtfuelmix_csv.zip"


def test_reads_the_daily_file_with_new_york_times():
    df = fetch.fuel_mix(date(2026, 10, 13), get=fake_get({DAILY: FUEL_CSV}))
    assert list(df.columns) == ["time", "category", "mw"]
    assert len(df) == 3
    first = df["time"].iloc[0]
    assert str(first.tz) == "America/New_York"
    assert first.isoformat() == "2026-10-13T00:05:00-04:00"


def test_falls_back_to_the_monthly_zip():
    get = fake_get({MONTHLY: zipped("20261013rtfuelmix.csv", FUEL_CSV)})
    df = fetch.fuel_mix(date(2026, 10, 13), get=get)
    assert len(df) == 3
    assert get.calls == [DAILY, MONTHLY]


def test_missing_everywhere_raises_data_missing():
    with pytest.raises(fetch.DataMissing):
        fetch.fuel_mix(date(2026, 10, 13), get=fake_get({}))


def test_an_html_error_page_counts_as_missing():
    get = fake_get({DAILY: b"<html><body>Not found</body></html>"})
    with pytest.raises(fetch.DataMissing):
        fetch.fuel_mix(date(2026, 10, 13), get=get)


def test_daylight_saving_uses_the_time_zone_column():
    url = "https://mis.nyiso.com/public/csv/rtfuelmix/20251102rtfuelmix.csv"
    df = fetch.fuel_mix(date(2025, 11, 2), get=fake_get({url: DST_FUEL_CSV}))
    t1, t2 = df["time"]
    # 1:55 EDT and 1:00 EST are 5 minutes apart in real time.
    assert (t2 - t1).total_seconds() == 5 * 60


def test_actual_load_reads_zones():
    url = "https://mis.nyiso.com/public/csv/pal/20261013pal.csv"
    df = fetch.actual_load(date(2026, 10, 13), get=fake_get({url: PAL_CSV}))
    assert list(df.columns) == ["time", "zone", "mw"]
    assert df["mw"].sum() == pytest.approx(5520.5)


def test_load_forecast_keeps_both_1am_hours_on_the_dst_day():
    url = "https://mis.nyiso.com/public/csv/isolf/20251102isolf.csv"
    df = fetch.load_forecast(date(2025, 11, 2), get=fake_get({url: ISOLF_DST_CSV}))
    assert list(df.columns) == ["time", "mw"]
    assert len(df) == 4
    assert df["time"].is_unique
    assert list(df["mw"]) == [13000, 12500, 12500, 12300]


def test_past_files_are_cached_on_disk(tmp_path):
    get = fake_get({DAILY: FUEL_CSV})
    fetch.fuel_mix(date(2026, 10, 13), get=get, cache_dir=tmp_path, today=date(2026, 10, 15))
    fetch.fuel_mix(date(2026, 10, 13), get=get, cache_dir=tmp_path, today=date(2026, 10, 15))
    assert get.calls == [DAILY]


def test_todays_file_is_never_cached(tmp_path):
    get = fake_get({DAILY: FUEL_CSV})
    fetch.fuel_mix(date(2026, 10, 13), get=get, cache_dir=tmp_path, today=date(2026, 10, 13))
    fetch.fuel_mix(date(2026, 10, 13), get=get, cache_dir=tmp_path, today=date(2026, 10, 13))
    assert get.calls == [DAILY, DAILY]

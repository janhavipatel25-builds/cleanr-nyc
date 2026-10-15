"""Download NYISO CSVs and turn them into tidy tables with New York times.

Each feed has a daily file (kept ~10 days) and a monthly zip (older days).
We try the daily file first, then the zip. Past files are cached on disk.
"""

import io
import urllib.error
import urllib.request
import zipfile
from datetime import date, datetime
from pathlib import Path

import pandas as pd

from .config import CITY

USER_AGENT = "cleanr-nyc (https://github.com/janhavipatel25-builds/cleanr-nyc)"


class DataMissing(Exception):
    """NYISO doesn't have this file (yet)."""


def http_get(url: str) -> bytes | None:
    """Fetch a URL. Returns None on 404; raises on other errors."""
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as err:
            if err.code == 404:
                return None
            if attempt == 1:
                raise
        except urllib.error.URLError:
            if attempt == 1:
                raise
    return None


def fuel_mix(day: date, **opts) -> pd.DataFrame:
    """5-minute generation by fuel. Columns: time (end of interval), category, mw."""
    raw = _read(_feed_bytes("rtfuelmix", day, **opts))
    return pd.DataFrame({
        "time": _localize(raw["Time Stamp"], raw["Time Zone"]),
        "category": raw["Fuel Category"],
        "mw": raw["Gen MW"].astype(float),
    })


def actual_load(day: date, **opts) -> pd.DataFrame:
    """5-minute actual load by zone. Columns: time, zone, mw."""
    raw = _read(_feed_bytes("pal", day, **opts))
    return pd.DataFrame({
        "time": _localize(raw["Time Stamp"], raw["Time Zone"]),
        "zone": raw["Name"],
        "mw": raw["Load"].astype(float),
    })


def load_forecast(day: date, **opts) -> pd.DataFrame:
    """Hourly statewide load forecast from this day's file. Columns: time (hour start), mw."""
    raw = _read(_feed_bytes("isolf", day, **opts))
    df = pd.DataFrame({
        "time": _localize(raw["Time Stamp"], None),
        "mw": raw["NYISO"].astype(float),
    })
    return df.dropna(subset=["time"]).drop_duplicates("time").reset_index(drop=True)


# --- helpers -------------------------------------------------------------


def _feed_bytes(feed: str, day: date, *, get=http_get, cache_dir=None, today=None) -> bytes:
    today = today or datetime.now(CITY.tz).date()
    ymd, ym = day.strftime("%Y%m%d"), day.strftime("%Y%m")

    data = _cached(CITY.daily_url(feed, ymd), get, cache_dir, cacheable=day < today)
    if data is None:
        past_month = (day.year, day.month) < (today.year, today.month)
        archive = _cached(CITY.monthly_zip_url(feed, ym), get, cache_dir, cacheable=past_month)
        if archive is not None:
            with zipfile.ZipFile(io.BytesIO(archive)) as z:
                name = f"{ymd}{feed}.csv"
                if name in z.namelist():
                    data = z.read(name)
    if data is None:
        raise DataMissing(f"NYISO {feed} for {day.isoformat()} is not available")
    return data


def _cached(url: str, get, cache_dir, cacheable: bool) -> bytes | None:
    path = Path(cache_dir) / url.rsplit("/", 1)[-1] if cache_dir else None
    if path and cacheable and path.exists():
        return path.read_bytes()
    data = get(url)
    if data is not None and data.lstrip()[:1] == b"<":  # an HTML error page, not a CSV
        data = None
    if data is not None and path and cacheable:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    return data


def _read(data: bytes) -> pd.DataFrame:
    return pd.read_csv(io.BytesIO(data), skipinitialspace=True)


def _localize(stamps: pd.Series, zones: pd.Series | None) -> pd.Series:
    """Turn NYISO's local clock times into real New York times.

    With a Time Zone column (EDT/EST) the repeated 1 AM hour is exact.
    Without one (load forecast), pandas infers it from the repeated rows.
    """
    naive = pd.to_datetime(stamps, format="mixed")
    if zones is not None:
        is_dst = (zones.str.strip() == "EDT").to_numpy()
        return naive.dt.tz_localize(CITY.tz.key, ambiguous=is_dst, nonexistent="NaT")
    try:
        return naive.dt.tz_localize(CITY.tz.key, ambiguous="infer", nonexistent="NaT")
    except Exception:  # can't infer (e.g. a single 1 AM row): drop the unclear hour
        return naive.dt.tz_localize(CITY.tz.key, ambiguous="NaT", nonexistent="NaT")

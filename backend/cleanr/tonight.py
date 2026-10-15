"""Build tonight's model: the content of tonight.json.

The pipeline owns the data: which night, each hour's mix and intensity (actual or forecast),
and the Calm / Busy / Rush labels. The app owns anything that depends on the viewer's clock
(Live, best hour, calm stretch, "data delayed").
"""

from datetime import date, datetime, timedelta

import pandas as pd

from . import emission_factors, fetch, forecast, history, intensity, labels
from .config import CITY, GROUPS

FORECAST_METHOD = "load-v1"
HISTORY_DAYS = forecast.FIT_DAYS + 2


def night_for(now: pd.Timestamp) -> date:
    """Before 8 AM it's still last night. From 8 AM on, it's the night that starts today."""
    local = now.tz_convert(CITY.tz.key)
    if local.hour < CITY.night_end:
        return local.date() - timedelta(days=1)
    return local.date()


def percentages(mw: dict) -> dict[str, int]:
    """Whole-number shares that always add up to exactly 100 (largest remainder)."""
    total = sum(mw.values())
    exact = {k: v / total * 100 for k, v in mw.items()}
    whole = {k: int(v) for k, v in exact.items()}
    short = 100 - sum(whole.values())
    for k in sorted(exact, key=lambda k: exact[k] - whole[k], reverse=True)[:short]:
        whole[k] += 1
    return {k: whole[k] for k in GROUPS}


def assemble(now: pd.Timestamp, hist: pd.DataFrame, load_fc: pd.Series) -> dict:
    """Pure function: recent actuals + NYISO load forecast → tonight.json content."""
    now = now.tz_convert(CITY.tz.key)
    hours = CITY.night_hours(night_for(now))
    actual = hist.dropna(subset=list(GROUPS))
    actual = actual[actual.index <= now.floor("h")]  # nothing from the future (matters for replays)

    is_actual = hours.isin(actual.index)
    future = hours[~is_actual]
    groups = actual.reindex(hours[is_actual])[list(GROUPS)]
    gas_f = actual.reindex(hours[is_actual])["gasFactor"]
    if len(future):
        predicted = forecast.night(actual, load_fc, future, variant="load")
        recent_factor = actual["gasFactor"].iloc[-7 * 24:].mean()
        groups = pd.concat([groups, predicted]).sort_index()
        gas_f = pd.concat([gas_f, pd.Series(recent_factor, index=future)]).sort_index()
    values = intensity.of(groups, gas_f)
    night_labels, thresholds = labels.by_thirds(values)

    latest = actual.index.max()
    return {
        "version": 1,
        "generatedAt": _iso(now.floor("s")),
        "city": CITY.key,
        "timezone": CITY.tz.key,
        "night": {"start": _iso(hours[0]), "end": _iso(hours[-1])},
        "now": {
            "time": _iso(latest),
            "intensity": round(float(actual.loc[latest, "intensity"])),
            "mix": percentages(actual.loc[latest, list(GROUPS)].to_dict()),
        },
        "hours": [
            {
                "time": _iso(hour),
                "hourOfDay": hour.hour,
                "intensity": round(float(values.loc[hour])),
                "label": night_labels[i],
                "mix": percentages(groups.loc[hour].to_dict()),
                "source": "actual" if is_actual[i] else "forecast",
            }
            for i, hour in enumerate(hours)
        ],
        "meta": {
            "dataThrough": _iso(min(pd.Timestamp(hist.attrs.get("dataThrough", latest)), now.floor("s"))),
            "thresholds": {k: round(v, 1) for k, v in thresholds.items()},
            "forecastMethod": FORECAST_METHOD,
            "emissionFactors": {
                "source": emission_factors.SOURCE,
                "gas": round(emission_factors.G_PER_KWH["gas"], 1),
                "oil": round(emission_factors.G_PER_KWH["oil"], 1),
            },
            "sources": [
                "https://mis.nyiso.com/public/csv/rtfuelmix/",
                "https://mis.nyiso.com/public/csv/isolf/",
                "https://mis.nyiso.com/public/csv/pal/",
                "https://www.epa.gov/egrid",
            ],
        },
    }


def build(now: datetime | None = None, **fetch_opts) -> dict:
    """Fetch what's needed from NYISO, then assemble tonight's model."""
    now = pd.Timestamp(now or datetime.now(CITY.tz)).tz_convert(CITY.tz.key)
    today = now.date()
    hist = history.load(
        today - timedelta(days=HISTORY_DAYS), today,
        fuel_mix=lambda d: fetch.fuel_mix(d, **fetch_opts),
        actual_load=lambda d: fetch.actual_load(d, **fetch_opts),
    )
    return assemble(now, hist, _latest_load_forecast(today, **fetch_opts))


def _latest_load_forecast(today: date, **fetch_opts) -> pd.Series:
    """Today's forecast file, or yesterday's if today's isn't out yet (just after midnight)."""
    for day in (today, today - timedelta(days=1)):
        try:
            return fetch.load_forecast(day, **fetch_opts).set_index("time")["mw"]
        except fetch.DataMissing:
            continue
    raise fetch.DataMissing(f"No NYISO load forecast for {today} or the day before")


def _iso(ts: pd.Timestamp) -> str:
    return ts.tz_convert(CITY.tz.key).isoformat()

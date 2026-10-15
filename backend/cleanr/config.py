"""City settings. Everything city-specific lives here, so another city is one new entry."""

from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pandas as pd

# The five groups the app shows. Keys match tonight.json.
GROUPS = ("nuclear", "hydro", "wind", "otherRenewables", "gas")
CLEAN_GROUPS = ("nuclear", "hydro", "wind", "otherRenewables")

NYISO_BASE = "https://mis.nyiso.com/public/csv"


@dataclass(frozen=True)
class City:
    key: str
    name: str
    tz: ZoneInfo
    night_start: int  # hour the night starts (6 PM)
    night_end: int  # hour the night ends (8 AM, next day)
    offpeak: tuple[int, int]  # Con Ed off-peak: [start, end) hours
    fuel_groups: dict[str, str] = field(default_factory=dict)

    def night_hours(self, day: date) -> pd.DatetimeIndex:
        """Every hour of the night that starts on `day`: 6 PM → 8 AM, one per hour.
        Built in real time, so the daylight-saving night gets its extra 1 AM."""
        # Wall-clock times, not "midnight + N hours" (that drifts by an hour on DST nights).
        start = pd.Timestamp(datetime.combine(day, time(self.night_start))).tz_localize(self.tz.key)
        end = pd.Timestamp(datetime.combine(day + timedelta(days=1), time(self.night_end))).tz_localize(self.tz.key)
        return pd.date_range(start.tz_convert("UTC"), end.tz_convert("UTC"), freq="h").tz_convert(self.tz.key)

    def is_offpeak(self, hour: pd.Timestamp) -> bool:
        return self.offpeak[0] <= hour.hour < self.offpeak[1]

    def daily_url(self, feed: str, ymd: str) -> str:
        return f"{NYISO_BASE}/{feed}/{ymd}{feed}.csv"

    def monthly_zip_url(self, feed: str, ym: str) -> str:
        return f"{NYISO_BASE}/{feed}/{ym}01{feed}_csv.zip"


CITY = City(
    key="nyc",
    name="New York",
    tz=ZoneInfo("America/New_York"),
    night_start=18,
    night_end=8,
    offpeak=(0, 8),
    fuel_groups={
        "Nuclear": "nuclear",
        "Hydro": "hydro",
        "Wind": "wind",
        "Other Renewables": "otherRenewables",
        "Natural Gas": "gas",
        "Dual Fuel": "gas",
        "Other Fossil Fuels": "gas",
    },
)

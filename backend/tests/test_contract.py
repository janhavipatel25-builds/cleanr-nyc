import copy
import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

from cleanr import contract

SAMPLE = Path(__file__).resolve().parents[1] / "samples" / "tonight.sample.json"
MIX = {"nuclear": 24, "hydro": 20, "wind": 4, "otherRenewables": 2, "gas": 50}


def valid_doc(n_hours=15):
    hours = []
    for i in range(n_hours):
        hour_of_day = (18 + i) % 24
        day = 15 if hour_of_day >= 18 else 16
        hours.append({
            "time": f"2026-10-{day}T{hour_of_day:02d}:00:00-04:00",
            "hourOfDay": hour_of_day,
            "intensity": 200 + i,
            "label": "calm",
            "mix": dict(MIX),
            "source": "forecast",
        })
    return {
        "version": 1,
        "generatedAt": "2026-10-15T21:10:00-04:00",
        "city": "nyc",
        "timezone": "America/New_York",
        "night": {"start": "2026-10-15T18:00:00-04:00", "end": "2026-10-16T08:00:00-04:00"},
        "now": {"time": "2026-10-15T21:00:00-04:00", "intensity": 231, "mix": dict(MIX)},
        "hours": hours,
        "meta": {
            "dataThrough": "2026-10-15T21:05:00-04:00",
            "thresholds": {"p33": 204.0, "p67": 209.0},
            "forecastMethod": "load-v1",
            "emissionFactors": {"source": "EPA eGRID2023", "gas": 422.8, "oil": 508.5},
            "sources": ["https://mis.nyiso.com/public/"],
        },
    }


def test_a_valid_document_passes():
    contract.validate(valid_doc())


def test_the_schema_file_lives_in_docs():
    assert contract.SCHEMA_PATH.name == "tonight.schema.json"
    assert contract.SCHEMA_PATH.parent.name == "docs"


@pytest.mark.parametrize("breaks", [
    lambda d: d.pop("hours"),
    lambda d: d["hours"][0].update(label="sunny"),
    lambda d: d["hours"][0].update(source="guess"),
    lambda d: d["hours"][0]["mix"].update(gas=51),               # mix adds up to 101
    lambda d: d["hours"][0]["mix"].pop("wind"),
    lambda d: d["now"]["mix"].update(nuclear=-1),
    lambda d: d.update(hours=d["hours"][:10]),                   # too few hours
    lambda d: d["hours"][3].update(time="2026-10-15T23:30:00-04:00"),  # not one hour apart
    lambda d: d.update(generatedAt="yesterday"),
    lambda d: d.update(extra="not allowed"),
])
def test_broken_documents_are_rejected(breaks):
    doc = copy.deepcopy(valid_doc())
    breaks(doc)
    with pytest.raises(contract.ContractError):
        contract.validate(doc)


def test_the_daylight_saving_night_with_16_hours_is_allowed():
    doc = valid_doc(16)
    start = datetime.fromisoformat("2026-10-31T18:00:00-04:00")
    for i, hour in enumerate(doc["hours"]):
        hour["time"] = (start + timedelta(hours=i)).isoformat()  # one real hour apart
    contract.validate(doc)


def test_the_committed_sample_follows_the_contract():
    contract.validate(json.loads(SAMPLE.read_text()))

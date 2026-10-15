"""Check a tonight.json document against the contract before it's published."""

import json
from datetime import datetime, timedelta
from pathlib import Path

import jsonschema

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "docs" / "tonight.schema.json"


class ContractError(ValueError):
    """The document breaks the contract. It must not be published."""


def validate(doc: dict) -> None:
    """Raise ContractError if `doc` breaks the schema or the extra rules."""
    schema = json.loads(SCHEMA_PATH.read_text())
    errors = sorted(jsonschema.Draft202012Validator(schema).iter_errors(doc), key=lambda e: list(e.path))
    if errors:
        first = errors[0]
        where = "/".join(str(p) for p in first.path) or "(top)"
        raise ContractError(f"{where}: {first.message}")

    for where, mix in [("now", doc["now"]["mix"])] + [(f"hours/{i}", h["mix"]) for i, h in enumerate(doc["hours"])]:
        if sum(mix.values()) != 100:
            raise ContractError(f"{where}/mix adds up to {sum(mix.values())}, not 100")

    times = [_time(h["time"], f"hours/{i}/time") for i, h in enumerate(doc["hours"])]
    for i in range(1, len(times)):
        if times[i] - times[i - 1] != timedelta(hours=1):
            raise ContractError(f"hours/{i}/time is not one hour after the hour before")
    for key in ("generatedAt",):
        _time(doc[key], key)


def _time(value: str, where: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as err:
        raise ContractError(f"{where}: not a valid time ({value})") from err

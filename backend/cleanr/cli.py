"""`python -m cleanr --out <path>`: build tonight's model, check it, write it safely.

Exit codes: 0 written · 1 broke the contract (nothing written) · 2 NYISO data missing (nothing written).
A failed run never touches the last good file.
"""

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

from . import contract, fetch, tonight


def main(argv=None, build=tonight.build) -> int:
    parser = argparse.ArgumentParser(prog="python -m cleanr", description=__doc__.splitlines()[0])
    parser.add_argument("--out", required=True, type=Path, help="where to write tonight.json")
    parser.add_argument("--now", type=datetime.fromisoformat, help="pretend it's this time (ISO 8601)")
    parser.add_argument("--cache", type=Path, help="folder for downloaded NYISO files")
    args = parser.parse_args(argv)

    opts = {"cache_dir": args.cache} if args.cache else {}
    try:
        doc = build(now=args.now, **opts)
        contract.validate(doc)
    except fetch.DataMissing as err:
        print(f"cleanr: NYISO data missing: {err}", file=sys.stderr)
        return 2
    except contract.ContractError as err:
        print(f"cleanr: model breaks the contract, not written: {err}", file=sys.stderr)
        return 1

    _write_atomically(args.out, json.dumps(doc, indent=1) + "\n")
    print(f"cleanr: wrote {args.out} ({len(doc['hours'])} hours, data through {doc['meta']['dataThrough']})")
    return 0


def _write_atomically(path: Path, text: str) -> None:
    """Write to a temp file next to the target, then swap it in. Readers never see half a file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tonight-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise

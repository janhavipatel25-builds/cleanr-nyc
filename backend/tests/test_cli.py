import json

from cleanr import cli
from cleanr.fetch import DataMissing

from .test_contract import valid_doc


def test_a_valid_model_is_written(tmp_path):
    out = tmp_path / "tonight.json"
    code = cli.main(["--out", str(out)], build=lambda **_: valid_doc())
    assert code == 0
    assert json.loads(out.read_text())["version"] == 1
    assert list(tmp_path.iterdir()) == [out]  # no temp files left behind


def test_a_broken_model_is_never_written(tmp_path):
    out = tmp_path / "tonight.json"
    out.write_text('{"old": "file"}')
    broken = valid_doc()
    broken["hours"][0]["label"] = "sunny"
    code = cli.main(["--out", str(out)], build=lambda **_: broken)
    assert code == 1
    assert out.read_text() == '{"old": "file"}'  # the last good file stays


def test_missing_nyiso_data_exits_with_code_2(tmp_path):
    out = tmp_path / "tonight.json"

    def no_data(**_):
        raise DataMissing("NYISO is down")

    assert cli.main(["--out", str(out)], build=no_data) == 2
    assert not out.exists()


def test_now_can_be_set_for_replays(tmp_path):
    seen = {}

    def spy(now=None, **_):
        seen["now"] = now
        return valid_doc()

    cli.main(["--out", str(tmp_path / "t.json"), "--now", "2026-10-15T21:35:00-04:00"], build=spy)
    assert seen["now"].isoformat() == "2026-10-15T21:35:00-04:00"

from cleanr import labels


def test_fifteen_hours_split_into_three_equal_thirds():
    values = list(range(200, 215))  # 15 different intensities
    result, thresholds = labels.by_thirds(values)
    assert result.count("calm") == 5
    assert result.count("busy") == 5
    assert result.count("rush") == 5
    assert result[0] == "calm" and result[-1] == "rush"
    assert thresholds["p33"] < thresholds["p67"]


def test_order_follows_the_input_not_the_ranking():
    result, _ = labels.by_thirds([300, 100, 200])
    assert result == ["rush", "calm", "busy"]


def test_sixteen_hours_on_the_daylight_saving_night():
    result, _ = labels.by_thirds(list(range(16)))
    assert len(result) == 16
    assert set(result) == {"calm", "busy", "rush"}


def test_a_perfectly_flat_night_is_all_calm():
    result, _ = labels.by_thirds([210.0] * 15)
    assert result == ["calm"] * 15

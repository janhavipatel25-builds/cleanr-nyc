"""Calm / Busy / Rush hour, relative to tonight's own hours (thirds)."""

import numpy as np


def by_thirds(values) -> tuple[list[str], dict[str, float]]:
    """Calmest third → "calm", middle third → "busy", top third → "rush".

    Returns the labels (same order as `values`) and the two cut points.
    Equal values always get the same label, so a flat night is all calm.
    """
    arr = np.asarray(values, dtype=float)
    p33, p67 = np.percentile(arr, [100 / 3, 200 / 3])
    result = ["calm" if v <= p33 else "rush" if v > p67 else "busy" for v in arr]
    return result, {"p33": float(p33), "p67": float(p67)}

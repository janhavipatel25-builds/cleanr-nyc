"""Carbon intensity: grams of CO2 per kWh of in-state generation."""

import pandas as pd

from .emission_factors import CATEGORY_FUEL, G_PER_KWH


def gas_factor(by_category: pd.DataFrame) -> pd.Series:
    """Effective g/kWh of the "gas" group each hour (gas and oil plants, weighted by MW)."""
    fossil = by_category.reindex(columns=list(CATEGORY_FUEL), fill_value=0.0)
    grams = sum(fossil[cat] * G_PER_KWH[fuel] for cat, fuel in CATEGORY_FUEL.items())
    mw = fossil.sum(axis=1)
    # An hour with no fossil output: the factor doesn't matter, use the gas rate.
    return (grams / mw.where(mw > 0)).fillna(G_PER_KWH["gas"])


def of(groups: pd.DataFrame, gas_g_per_kwh: pd.Series) -> pd.Series:
    """Intensity per hour = gas MW × gas factor ÷ total MW. Clean groups count as 0."""
    total = groups.sum(axis=1)
    factor = pd.Series(gas_g_per_kwh.to_numpy(), index=groups.index)
    return groups["gas"] * factor / total

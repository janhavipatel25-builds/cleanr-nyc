# Data notes

## Sources: NYISO public CSVs
NYISO (New York Independent System Operator) runs the state grid and publishes free, public data.
No API key needed. Checked on **2026-10-14** (all return HTTP 200 over https).

| Feed | URL pattern | Shape |
|---|---|---|
| Real-time fuel mix | `https://mis.nyiso.com/public/csv/rtfuelmix/{YYYYMMDD}rtfuelmix.csv` | **5-minute** intervals |
| Load forecast | `https://mis.nyiso.com/public/csv/isolf/{YYYYMMDD}isolf.csv` | **Hourly**, ~6 days ahead |
| Actual load | `https://mis.nyiso.com/public/csv/pal/{YYYYMMDD}pal.csv` | 5-minute intervals, per zone |

### Real-time fuel mix (`rtfuelmix`)
- Columns: `Time Stamp`, `Time Zone`, `Fuel Category`, `Gen MW`
- Example row: `10/13/2026 00:05:00, EDT, Dual Fuel, 3408.0`
- **Fuel categories (7):** Dual Fuel · Hydro · Natural Gas · Nuclear · Other Fossil Fuels · Other Renewables · Wind
- About 288 timestamps per day (one every 5 minutes). We'll average them to hourly.

### Load forecast (`isolf`)
- Columns: `Time Stamp`, then one column per load zone
  (`Capitl`, `Centrl`, `Dunwod`, `Genese`, `Hud Vl`, `Longil`, `Mhk Vl`, `Millwd`, `N.Y.C.`, `North`, `West`),
  then `NYISO` (statewide total, MW).
- Hourly. The file for a given day runs from that day to ~5 days ahead.

### Actual load (`pal`)
- Columns: `Time Stamp`, `Time Zone`, `Name` (zone), `PTID`, `Load` (MW)
- Probably only needed if we compare the forecast with what actually happened.

### Things to know
- **There is no separate Solar category.** Utility-scale solar is most likely inside "Other Renewables".
  Rooftop (behind-the-meter) solar isn't counted as generation at all; it shows up as lower demand.
  This affects the prototype's 5-source list. **Open question.**
- **Dual Fuel** = plants that can burn gas or oil (usually gas). **Other Fossil Fuels** = oil, etc.
  Both count as carbon-emitting.
- **Imports** from neighbouring grids are **not** in this feed. Excluded from V1.
- **Statewide only.** The fuel mix isn't broken down by zone.
- **Timestamps are local time** (EDT/EST). Watch the daylight-saving changeovers.
- Older dates are archived as monthly zip files; the daily URL pattern is for recent days.
  (Confirm the archive URL in Phase 1 if we need history.)

## Carbon intensity method (draft)
For each hour:

```
intensity (g CO₂/kWh) = Σ (MW of fuel × emission factor of fuel) / Σ (MW of all fuels)
```

- **Carbon-emitting:** Natural Gas, Dual Fuel, Other Fossil Fuels.
- **~0:** Nuclear, Hydro, Wind, Other Renewables. (Other Renewables may include biomass/landfill gas;
  decide whether to treat it as ~0 and say so.)
- Imports are excluded, so this is the intensity of **in-state generation**.

### Emission factors: TBD
- **Must be sourced and cited** (e.g. EPA eGRID, New York subregions NYCW / NYLI / NYUP).
- Decide: direct combustion only, or lifecycle? Direct is simpler and matches "fewer gas plants running".
- The prototype used a rough placeholder: gas ≈ 440 g/kWh (`intensity = gas% × 4.4 + 8`). **Not a real value.**

| Fuel category | Factor (g CO₂/kWh) | Source |
|---|---|---|
| Natural Gas | TBD | TBD |
| Dual Fuel | TBD | TBD |
| Other Fossil Fuels | TBD | TBD |
| Nuclear, Hydro, Wind, Other Renewables | ~0 (direct) | TBD |

## Labels
- Placeholder thresholds: **Calm < 200 · Busy 200–249 · Rush ≥ 250** g CO₂/kWh.
- Tune them once we see a few weeks of real data. A percentile-based option:
  Calm = bottom third of recent hours, Rush = top third.

## The forecast (open question)
NYISO publishes **load** forecasts, not carbon forecasts. Two options:

- **(a) Model gas from the load forecast.** Gas flexes with demand, so fit a simple relationship
  (gas MW vs load MW) from recent days and apply it to tomorrow's forecast load.
  More "real", a little more code, needs a sanity check.
- **(b) Typical hourly pattern.** Average each hour's intensity over the last N days.
  Very simple; misses unusual nights (heat waves, windy nights).

Either is honest because the UI labels future hours **Forecast**. Recommendation goes in planning.

## Output: `tonight.json` (draft shape)
Both lenses render from this one model. That shared model is the "systems thinking" story.

```
{
  generatedAt, city: "nyc", timezone: "America/New_York",
  hours: [ { time, hourOfDay, intensity, label: "calm"|"busy"|"rush",
             mix: { nuclear, hydro, wind, solar, gas },     // % of total; categories TBD (see Solar note)
             status: "actual"|"live"|"forecast" } ],          // 6 PM → 8 AM
  best: <index of calmest off-peak future hour>,
  calmStretch: { start, end },
  meta: { thresholds, emissionFactors, sources }
}
```

UI-only state (not in the JSON): `{ lens: "tonight"|"grid", selectedHour }`.

## Open data questions
- Forecast method: (a) load-based or (b) typical pattern?
- Emission factor source and values.
- Label thresholds: fixed or percentile?
- How to show Solar (and Other Renewables) given the real categories.
- Group Dual Fuel + Other Fossil with Gas in the UI, or separate?
- What happens when a NYISO file is late or missing? (Show the last good data with a timestamp.)

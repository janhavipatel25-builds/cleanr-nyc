# Data notes

How the numbers are made. The build steps are in [plan.md](plan.md).

## Sources: NYISO public CSVs
NYISO (New York Independent System Operator) runs the state grid and publishes free, public data.
No API key needed. Checked on **2026-10-14/15**.

| Feed | URL pattern | Shape |
|---|---|---|
| Real-time fuel mix | `https://mis.nyiso.com/public/csv/rtfuelmix/{YYYYMMDD}rtfuelmix.csv` | **5-minute** intervals |
| Load forecast | `https://mis.nyiso.com/public/csv/isolf/{YYYYMMDD}isolf.csv` | **Hourly**, ~6 days ahead |
| Actual load | `https://mis.nyiso.com/public/csv/pal/{YYYYMMDD}pal.csv` | 5-minute intervals, per zone |
| Monthly archives | `https://mis.nyiso.com/public/csv/{feed}/{YYYYMM}01{feed}_csv.zip` | One zip per month (daily CSVs inside) |

### Availability
- **Daily files are kept for about 10 days.** On 2026-10-15, files back to 10/05 existed; 10/03 and older returned 404.
- **Older data is in the monthly zip** (the current month's zip exists too, with the days so far).
- **Today's file doesn't exist just after midnight.** At 00:04 on 10/15, `20261015rtfuelmix.csv` returned 404.
  The pipeline must fall back to yesterday's file and pick up today's when it appears.

### Real-time fuel mix (`rtfuelmix`)
- Columns: `Time Stamp`, `Time Zone`, `Fuel Category`, `Gen MW`
- Example row: `10/13/2026 00:05:00, EDT, Dual Fuel, 3408.0`
- **Fuel categories (7):** Dual Fuel · Hydro · Natural Gas · Nuclear · Other Fossil Fuels · Other Renewables · Wind
- About 288 timestamps per day. The first is 00:05, so each timestamp marks the **end** of a 5-minute interval.

### Load forecast (`isolf`)
- Columns: `Time Stamp`, one column per load zone
  (`Capitl`, `Centrl`, `Dunwod`, `Genese`, `Hud Vl`, `Longil`, `Mhk Vl`, `Millwd`, `N.Y.C.`, `North`, `West`),
  then `NYISO` (statewide total, MW). **We use `NYISO`.**
- Hourly. Each day's file runs from that day to ~5 days ahead.

### Actual load (`pal`)
- Columns: `Time Stamp`, `Time Zone`, `Name` (zone), `PTID`, `Load` (MW)
- Sum the zones to get statewide load. Used to **train** the forecast (actual load vs actual gas).

### Things to know
- **No separate Solar category.** Utility-scale solar is likely inside "Other Renewables".
  Rooftop solar isn't counted as generation at all; it shows up as lower demand. **Solar is parked for V1.**
- **Imports** from neighbouring grids are **not** in this feed. Excluded from V1.
  So intensity = intensity of **in-state generation**.
- **Statewide only.** The fuel mix isn't broken down by zone.
- **Timestamps are local time** (EDT/EST). **Daylight saving ends on 2026-11-01**, so that night has
  an extra hour. The pipeline works in timezone-aware time (`America/New_York`).

## From 5-minute data to hours
- Average the 5-minute readings in each clock hour → mean MW per fuel category per hour.
- Hour `1 AM` = readings from 1:00 to 2:00 (timestamps 1:05 … 2:00).
- The current hour is a **partial** average of the readings so far.

## Groups shown in the app
| App group | NYISO categories | Carbon |
|---|---|---|
| Nuclear | Nuclear | ~0 |
| Hydro | Hydro | ~0 |
| Wind | Wind | ~0 |
| Other renewables | Other Renewables (likely solar, biomass, landfill gas…) | treated as ~0 (see note) |
| **Gas** | **Natural Gas + Dual Fuel + Other Fossil Fuels** | yes |

- Footnote in the app: "Gas includes dual-fuel and oil plants."
- Mix percentages are whole numbers that **always add up to 100** (largest-remainder rounding),
  so the 100-dot mix works.
- Note: biomass and landfill gas do emit CO₂. Following common practice, we treat them as ~0
  (biogenic) and say so in the README.

## Carbon intensity
For each hour:

```
intensity (g CO₂/kWh) = Σ (MW of category × emission factor) / Σ (MW of all categories)
```

### Emission factors: EPA eGRID (decided 2026-10-15)
- Source: **EPA eGRID, latest edition**, New York subregions (NYCW, NYLI, NYUP).
- eGRID gives lb CO₂/MWh. Convert: **g/kWh = lb/MWh × 0.4536**.
- Mapping:
  - Natural Gas, Dual Fuel → New York **gas** output emission rate.
  - Other Fossil Fuels → New York **oil** output emission rate.
  - Nuclear, Hydro, Wind, Other Renewables → 0.
- The exact values, edition, and table name are recorded in `backend/` with the citation (sprint step 1).
- The prototype's placeholder (gas ≈ 440 g/kWh) is **not** used.

## Forecast: option (a), gas from the load forecast (decided 2026-10-15)
NYISO forecasts **demand**, not carbon. Gas plants follow demand, so we predict gas from demand.

For each future hour:
| Group | How it's predicted | Why |
|---|---|---|
| **Gas** | `gas MW = a + b × forecast load MW`, fitted on the last 14 days of hourly actuals | Gas flexes with demand |
| Nuclear | Hold the latest hour's value | Barely moves overnight |
| Hydro, Other renewables | Average for the same hour over the last 7 days | Fairly regular daily pattern |
| Wind | Hold the latest hour's value | No wind forecast in the feed; simplest honest choice |

- Forecast load = the `NYISO` column of the latest `isolf` file.
- Training data = actual load (`pal`, summed) + actual mix (`rtfuelmix`), from daily files + monthly zips.
- **Backtest (sprint step 1):** run the method on each of the last 7 nights and compare with what happened.
  Report the average error (g/kWh) and whether the picked best hour was among the actual 3 calmest.
  Compare with option (b), the typical-pattern baseline. Results go here and in the README.

## Labels: relative to tonight (decided 2026-10-15)
No fixed numbers. Labels come from **tonight's own hours** (actual + forecast, 6 PM → 8 AM):
- Rank the night's hours by intensity.
- **Calm** = the calmest third · **Busy** = the middle third · **Rush hour** = the top third
  (33rd and 67th percentiles of tonight's intensities).
- Copy must make this clear: "Calm" means calm **compared with the rest of tonight**.

## Best hour and calm stretch
- **Best hour** = the lowest-intensity hour inside Con Ed off-peak (12–8 AM) that isn't over yet
  (the current hour counts). Ties → the earlier hour.
- **Calm stretch** = the consecutive Calm hours around the best hour, still inside off-peak.

## Which night is "tonight"
- **8 AM → 6 PM:** the coming night. Every hour is Forecast.
- **6 PM → 8 AM:** the current night. Past hours Actual, current hour Live, later hours Forecast.

## Output: `tonight.json`
Both lenses render from this one model. That shared model is the "systems thinking" story.

```jsonc
{
  "generatedAt": "2026-10-15T21:10:00-04:00",
  "city": "nyc",
  "timezone": "America/New_York",
  "night": { "start": "2026-10-15T18:00:00-04:00", "end": "2026-10-16T08:00:00-04:00" },
  "now": { "time": "2026-10-15T21:00:00-04:00", "intensity": 231,
           "mix": { "nuclear": 24, "hydro": 20, "wind": 4, "otherRenewables": 2, "gas": 50 } },
  "hours": [
    { "time": "2026-10-15T18:00:00-04:00", "hourOfDay": 18, "intensity": 246, "label": "rush",
      "mix": { "nuclear": 22, "hydro": 19, "wind": 3, "otherRenewables": 3, "gas": 53 },
      "source": "actual" }          // "actual" | "forecast"
    // … one per hour, 6 PM → 8 AM
  ],
  "best": 9,                        // index into hours
  "calmStretch": { "start": 8, "end": 11 },   // end is exclusive
  "meta": { "thresholds": { "p33": 198, "p67": 224 }, "emissionFactors": {}, "sources": [],
            "forecastMethod": "gas-from-load-v1" }
}
```

- `now` is the latest actual hour, used for "Powering New York now" even before 6 PM.
- **Status shown in the app** is worked out from the viewer's clock:
  current hour = **Live**; otherwise **Actual** if `source` is `actual`, else **Forecast**.
  (A past hour that only has forecast data stays "Forecast". We never call a guess "Actual".)
- If `generatedAt` is more than 3 hours old, the app shows "Data delayed · updated [time]".

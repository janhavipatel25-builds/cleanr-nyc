# Decision log

Newest at the bottom. Format: **date · decision · why**.

| Date | Decision | Why |
|---|---|---|
| 2026-10-14 | Primary users are NYC EV drivers who charge at home or in a garage overnight. Fast chargers are hidden in V1. | Overnight charging is the case where shifting a few hours is easy. Keeps V1 focused. |
| 2026-10-14 | The night runs 6 PM → 8 AM, one row per hour. | Covers the evening plug-in through morning, matching how people charge at home. |
| 2026-10-14 | Each hour gets a carbon intensity (g CO₂/kWh) from the fuel mix, labelled Calm / Busy / Rush hour. | One simple number per hour, translated into words people understand at a glance. |
| 2026-10-14 | Placeholder thresholds: Calm < 200, Busy 200–249, Rush ≥ 250 g/kWh. Tune with real data. | Taken from the prototype. Real data may need different or percentile-based cut-offs. |
| 2026-10-14 | Best time to charge = lowest-intensity future hour inside Con Ed off-peak (12–8 AM). | Calmest grid and cheapest pricing point the same way. Never recommends a past hour. |
| 2026-10-14 | Calm stretch = consecutive Calm hours around the best hour, inside off-peak. | Gives flexibility ("any time in this stretch works") without promising finish times. |
| 2026-10-14 | No finish times or "ready by" promises. | We don't know battery level or charge length. |
| 2026-10-14 | No dollar savings in V1. TOU vs SmartCharge is parked. | Rate plans vary per person; showing wrong numbers would hurt trust. |
| 2026-10-14 | Say "calmest hour", never "cleanest hour". | Avoids sounding like greenwashing. |
| 2026-10-14 | Don't claim individual impact ("you saved X grams"). | One car's effect is hard to measure honestly. "Fewer gas plants running" is true. |
| 2026-10-14 | Label hours Actual / Live / Forecast. | Be clear about what's measured and what's predicted. |
| 2026-10-14 | Data view titled "Powering New York", with a note that the mix is statewide. | NYISO's fuel mix is statewide; NYC runs on the state grid. |
| 2026-10-14 | Imports excluded from V1. | Not in the NYISO fuel mix feed. |
| 2026-10-14 | Parked: money, environmental justice / peaker story, laundry / dishwasher / devices (chips only), other cities, fast chargers, accounts, notifications, charger finding. | Keeps V1 small and shippable. Code stays city-agnostic where cheap. |
| 2026-10-14 | `cleanr-prototype.html` is the visual source of truth. Port it, don't redesign it. Never ship it. | The design is approved. It runs on mock data. |
| 2026-10-14 | Single dark "night" theme; pixel art only; Doto only for times; state colours only on state elements. | A consistent, recognisable visual system. |
| 2026-10-14 | Git: `main` = released, `develop` = integration, short-lived branches + PRs into `develop`. | Learn a real workflow; keep `main` always deployable. |
| 2026-10-14 | Ship V1 by the evening of 2026-10-15 as one sprint. Commit straight to `develop` during the sprint. | Owner's deadline. Branches + PRs slow a one-day sprint down. |
| 2026-10-15 | Forecast: predict gas from NYISO's load forecast (option a). Backtest against the typical-pattern baseline (option b). | Gas follows demand, and NYISO's load forecast already includes the weather. The backtest keeps us honest. |
| 2026-10-15 | Emission factors from EPA eGRID (New York gas and oil rates). | Official, citable, New York-specific. |
| 2026-10-15 | Calm / Busy / Rush are relative to tonight's own hours (thirds). Replaces the fixed placeholder thresholds. | Labels come from what NYISO's data says about tonight, not an arbitrary number. |
| 2026-10-15 | Solar parked for V1. | NYISO's fuel mix has no separate Solar category. |
| 2026-10-15 | Dual Fuel and Other Fossil Fuels counted under Gas, with a footnote. | Keeps the source list simple. All three burn fossil fuel. |
| 2026-10-15 | "Tonight on the wall" moved to a fast follow; storage decided later. | Needs shared storage. Not needed to ship V1. |
| 2026-10-15 | Installing packages and tools is allowed for the sprint. | Needed to build in one day. |

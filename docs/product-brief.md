# Product brief

## The product in one paragraph
**Cleanr NYC** is a mobile-first web app that tells New York EV drivers **the best time to charge tonight**:
when the electricity grid is calmest (fewest gas plants running) and inside Con Edison's cheap
off-peak hours (12–8 AM). The mental model is **a weather app for the grid**: "right now" plus a forecast
through the night. It leads with an action ("Best time to charge: 3 AM"), not with data.

## Goals
- Show **visual craft + systems thinking** to recruiters and hiring managers.
- Be **genuinely functional** with real NYISO data, not a mockup.
- Learn to ship code properly: branches, PRs, small commits, a clear README.
- **Not a goal:** retention. No accounts, no notifications.

## Definition of done for V1
- A live public URL that works well on a phone.
- A public GitHub repo with a clear README (what, why, how it works, data sources, screenshots).
- The owner can explain every part of how it works.
- The owner made a meaningful number of the commits.

## Users
- **Primary:** NYC EV drivers who charge **at home or in a garage, overnight**.
- **Secondary:** recruiters and hiring managers looking at the work.
- **Out of scope:** fast-charger users. Hidden in V1, not shown at all.

## Product rules (requirements)

### Core logic
- The night runs **6 PM → 8 AM**, one row per hour.
- Each hour gets a **carbon intensity** (g CO₂/kWh), computed from the fuel mix.
- Each hour gets a label: **Calm / Busy / Rush hour**, **relative to tonight's own hours**:
  the calmest third is Calm, the middle third Busy, the top third Rush hour. No fixed numbers.
  (The prototype's fixed thresholds, Calm < 200 / Busy 200–249 / Rush ≥ 250 g/kWh, are not used.)
- **Best time to charge** = the **lowest-intensity future hour inside Con Ed's off-peak window (12–8 AM)**.
- **Calm stretch** = the consecutive Calm hours around the best hour, still inside off-peak.
  Shown as an outline on the scrubber and a highlight on the hour rows.
- **No finish times or "ready by" times.** We don't know the car's battery level or charge length.
- **No dollar savings.** (TOU rate vs SmartCharge is parked.)

### Language and honesty
- Say **"calmest hour"**, never "cleanest hour". Avoids sounding like greenwashing.
- Don't overclaim individual impact. "Fewer gas plants running," not "you saved X grams."
- Every future hour is labelled **Forecast**, every past hour **Actual**. "Now" is **Live**.
- The NYISO fuel mix is **statewide**, not NYC-only. The data view is titled **"Powering New York"**,
  with a one-line note that it's statewide and NYC runs on the state grid.
- **Imports** (power from other states) aren't in the NYISO fuel mix feed. Excluded from V1.
- Tone: warm, clear, a little playful. **Never guilt-tripping.**

## Parked for later (do not build)
- **"Tonight on the wall"**: a fast follow after V1. Storage decided later.
- **Solar** as its own source. NYISO's feed has no separate Solar category.
- Money / rate plans (TOU vs SmartCharge).
- The environmental justice / peaker-plant story.
- Laundry, dishwasher, device charging. Shown only as "Coming soon" chips.
- More cities. Keep the architecture city-agnostic where it's cheap to do so.
- Fast-charger mode, accounts, notifications, finding chargers.

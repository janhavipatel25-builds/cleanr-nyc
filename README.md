# Cleanr NYC

**The best time to charge your EV tonight, in New York.**

Cleanr NYC is a mobile-first web app for New York EV drivers who charge at home or in a garage overnight.
It finds tonight's **calmest hour on the grid** (when the fewest gas plants are running)
inside Con Edison's off-peak window (12–8 AM), and leads with one answer: *"Best time to charge: 3 AM."*

Think of it as **a weather app for the grid**: what's powering New York right now,
plus a forecast through the night.

## Why
Electricity in New York isn't equally clean at every hour. Nuclear and hydro run steadily,
wind comes and goes, and gas plants ramp up and down to follow demand. Late at night, demand drops,
fewer gas plants run, and each kWh carries less carbon. Shifting a charge by a few hours
is an easy way to use a calmer grid, and it fits inside off-peak pricing.

## How it works (planned)
1. A small **Python + pandas** pipeline fetches public data from **NYISO**, New York's grid operator
   (real-time fuel mix + load forecast).
2. It computes the **carbon intensity** of each hour from the fuel mix, labels each hour
   **Calm / Busy / Rush hour**, and picks the best hour and the calm stretch around it.
3. It writes one static `tonight.json`. A scheduled GitHub Action refreshes it.
4. A **React + Tailwind** app reads that file and shows it two ways:
   **Tonight** (when to charge) and **The grid** (what's powering New York).

The fuel mix is **statewide**. NYC runs on the state grid. Future hours are forecasts and may shift.

## Status
🚧 **Early days.** The design prototype is done (`cleanr-prototype.html`, mock data).
The real app and data pipeline are being planned. See [progress.md](progress.md).

## Coming soon
- Live public URL
- Screenshots
- Data sources and method write-up

## Docs
- [Product brief](docs/product-brief.md)
- [Design spec](docs/design-spec.md)
- [Data notes](docs/data-notes.md)
- [Decision log](docs/decisions.md)

---

This line was added by Claude Code (the Claude agent), not by the user.

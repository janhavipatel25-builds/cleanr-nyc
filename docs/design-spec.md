# Design spec

`cleanr-prototype.html` (repo root) is the **visual and interaction source of truth**.
Port it faithfully. It runs on mock data and is never shipped as the app.
This doc summarises it so we can talk about it without reading the code.

> **V1 changes from the prototype** (decided 2026-10-15, see `plan.md` step 4):
> no wall, no borough picker, no "Post to the wall"; no Solar row or Solar scene label;
> source list = Nuclear · Hydro · Wind · Other renewables · Gas; Calm / Busy / Rush are relative to tonight.
> Sections below marked *(not in V1)* stay documented for the fast follow.

## Information architecture
**One app, two "lenses" on the same scene and the same hours.**

1. **App bar:** `CLEANR / NYC` (mono) + a date chip (e.g. "Tue, Oct 14").
2. **Lens switch** (segmented control, `role="tablist"`): **Tonight | The grid**. Arrow keys switch lenses.
3. **Shared pixel-art NYC skyline** (`<canvas>`, 160×112 logical pixels, scaled up with `image-rendering: pixelated`)
   with a **time scrubber on its top edge**.
4. **Board card** below the skyline (same width, 8px gap). Content changes per lens.
5. **Lens content** (below).
6. **Footer:** statewide data note.
7. **Share sheet** (modal).

### Scrubber
- One colour block per hour (Calm / Busy / Rush colours, all the same height). Past hours dimmer.
- An outline around the **calm stretch**.
- A thumb (LED colour) with a **tag** showing the time (Doto) and the label (state colour).
- A dashed vertical timeline from the thumb down through the scene.
- End labels: "6 PM" and "8 AM".
- Draggable (pointer events) and keyboard accessible: `role="slider"`, ←/→/↑/↓, Home, End.
  `aria-valuetext` reads e.g. "9 PM, Busy".

### Scene encodings (what moves and why)
The background stays calm. Only the meaningful elements move.

| Element | Encodes | Prototype formula (for reference) |
|---|---|---|
| Sky gradient | Time of night: sunset → night → dawn | 15 colour stops, one per hour |
| Moon / sun | Time of night | Sun at the ends, moon arcs across the night |
| Stars | Deep night | Shown when "night" > 0.45, a few twinkle |
| **Lit windows** | **Demand** | share lit = clamp((gas − 34) / 40, 0.06, 0.6) |
| **Smokestack smoke** | **Gas share** | puff rate = max(0, (gas − 38) / 22) |
| **Offshore turbine speed** | **Wind share** | spin = wind × 0.016 |
| **Haze band** | **Carbon intensity** | density = max(0, (intensity − 200) / 160) |
| Dimming | Past hours | Past ticks/rows at reduced opacity |

- The scene eases toward the selected hour (it doesn't jump).
- The skyline layout is generated from a fixed seed, so it's identical on every load.

### Board card
- **Tonight lens:** car pixel icon · "Best time to charge" · the time in Doto (e.g. **3 AM**) ·
  an **(i) info button** with a tooltip (calmest hour, calm stretch, inside Con Ed off-peak) ·
  **Add to calendar** (.ics download, primary) + **Share** (ghost) buttons.
- **The grid lens:** "Powering New York at [time]" + "**62% clean**" (Archivo). No action buttons.

### Tonight lens
- "Tonight, hour by hour": rows from **Now → 8 AM**. Each row: time (Doto) · 10-dot intensity bar ·
  label · tag (Live / Best). Tapping a row moves the scrubber. Calm-stretch rows are highlighted.
- "Why 3 AM?" card, with a link that opens **The grid** at that hour.
- *(not in V1)* "Tonight on the wall": anonymous, templated posts with borough ("Someone in Brooklyn charged at 3 AM.").
- "Coming soon" chips: Laundry, Dishwasher, Devices.

### The grid lens
- One-line lede ("Right now, 48% of New York's power is clean.").
- **100-dot mix**: one dot per %, coloured by source, plus a Clean % / Gas % split.
- **Source list:** Nuclear, Hydro, Wind, Other renewables, Gas, each with a short note, % and change vs now.
  (Prototype has Solar instead of Other renewables; Solar is parked.)
- **Now vs calmest hour**: stacked bars (plus the selected hour if different).
- "Why hours differ": **Steady** (nuclear and hydro) · **Weather** (wind comes and goes) · **Flex** (gas follows demand).
- Source labels float over the scene in this lens (Gas, Wind, Upstate: nuclear + hydro). No Solar label in V1.
- Footnotes: statewide data; "Gas includes dual-fuel and oil plants."

### Share sheet
- A 9:16 ticket-style card: mini skyline at the best hour · "Charged at **3 AM**" · "Tonight's calmest hour" · date.
- *(not in V1)* Borough picker (Brooklyn, Bronx, Manhattan, Queens, Staten Island) and "Post to the wall anonymously".
- "Save for Instagram Stories". In V1 it's the main action (1080×1920 PNG; native share sheet on phones that support it).
- Modal: focus moves in, Esc / backdrop closes, focus returns.

## Visual system

### Theme
- **Single dark "night" theme.** Pixel art is the only illustration language.
- Crisp and modern, not retro-arcade.
- Background: `--bg` with a faint 16px grid.

### Colour tokens
| Group | Token | Value |
|---|---|---|
| Surfaces | `--bg` | `#121113` |
| | `--card` | `#19181A` |
| | `--surface` | `#222124` |
| | `--border` | `#2E2C30` |
| Text | `--fg` | `#ECE8E3` |
| | `--muted` | `#9A958F` |
| | `--faint` | `#6E6A66` |
| Action | `--primary` | `#E78A53` (text on it: `#121113`) |
| Grid state | `--calm` | `#7FB0B0` |
| | `--busy` | `#F2B57A` |
| | `--rush` | `#E5574B` |
| Time / LED | `--led` | `#FFB547` |
| Sources | `--src-nuclear` | `#A08BD6` |
| | `--src-hydro` | `#4FA3AE` |
| | `--src-wind` | `#8CC3E6` |
| | `--src-solar` | `#F2B632` |
| | `--src-gas` | `#9A928B` |

The prototype also uses a few supporting values (`--led-dim #2B2420`, `--board #0B0A0A`,
`--board-line #2A2622`, grid line `rgba(255,255,255,0.04)`) and fixed pixel-art colours inside the canvas.

### Fonts (Google Fonts)
| Font | Use |
|---|---|
| **Archivo** | Display, headings, big numbers |
| **Space Grotesk** | Body and UI |
| **Doto** | **Only times** ("3 AM", hour labels, scrubber tag). Nowhere else. |
| **JetBrains Mono** | Tiny uppercase labels |

### Rules
- State colours (calm / busy / rush) go **only on state elements**. Everything else uses theme tokens.
- Never rely on colour alone. Always pair it with a text label.
- Mobile-first. Max content width ~440px. 16px side padding.
- Radius: cards 14px, scene and board 18px, sheets 20px.

### Motion
- Respect `prefers-reduced-motion`: no view/sheet entrance animations, no thumb/dot transitions,
  and the scene is drawn as a still frame.
- Entrance: views fade up 6px over 0.28s. Sheets slide up 16px.
- Buttons scale to 0.97 on press.
- Mix dots change colour in a quick staggered wave.

## Known issues and gaps in the prototype (fix while porting)
- **Moon behind the tag:** the moon can sit behind the scrubber tag around 1–3 AM.
- **Reduced motion:** the prototype draws a still frame but still starts the animation loop,
  so turbines and smoke keep moving. The port should fully stop the loop.
- **Forecast / Actual labels:** the brief requires every hour to be labelled Forecast / Actual / Live.
  The prototype only shows "Live" and "Best" tags. This needs a design pass.
- **Copy:** the grid lens heading says "Now vs the best hour" and a code comment says "cleanest".
  Use "calmest hour" in the port.
- **Solar:** NYISO's feed has no Solar category. Solar is parked; the row becomes "Other renewables".
- **Relative labels:** the info tooltip must say Calm means calm compared with the rest of tonight.
- **Before 6 PM:** every hour is Forecast and there's no "Now" row. This state isn't in the prototype.
- **Hour count:** the prototype hard-codes 15 hours. The daylight-saving night has 16, so the port reads the count from the data.
- **"Data delayed":** a small note when the data is over 3 hours old or the night has ended. Not in the prototype.
- **Calendar and Stories buttons** only show toasts in the prototype. They need real implementations.

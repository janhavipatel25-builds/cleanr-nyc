// Clock-based parts of the model. The pipeline owns the data; the app owns anything that
// depends on what time it is now (see docs/plan.md, "Who decides what").
// All comparisons use absolute times (ms since 1970), so the viewer's time zone never matters.

const HOUR = 60 * 60 * 1000
const STALE_AFTER = 3 * HOUR

// Con Ed off-peak, 12–8 AM. Mirrors OFFPEAK in backend/cleanr/config.py.
export const OFFPEAK = [0, 8]

const start = (hour) => Date.parse(hour.time)
export const isOffpeak = (hour) => hour.hourOfDay >= OFFPEAK[0] && hour.hourOfDay < OFFPEAK[1]
export const isOver = (hour, now) => now >= start(hour) + HOUR

/** 'live' for the hour we're in; otherwise 'actual' only if it's real data, else 'forecast'. */
export function statusOf(hour, now) {
  const s = start(hour)
  if (now >= s && now < s + HOUR) return 'live'
  return hour.source === 'actual' ? 'actual' : 'forecast'
}

/** Index of the hour we're in, or -1 (before 6 PM / after the night). */
export function liveIndex(hours, now) {
  return hours.findIndex((h) => statusOf(h, now) === 'live')
}

/** Calmest off-peak hour that isn't over yet (current hour counts). Ties → earlier. Null if none. */
export function bestHour(hours, now) {
  let best = null
  hours.forEach((h, i) => {
    if (!isOffpeak(h) || isOver(h, now)) return
    if (best === null || h.intensity < hours[best].intensity) best = i
  })
  return best
}

/** Consecutive Calm, off-peak, not-over hours around the best hour. { start, end } with end exclusive.
 *  Null when the best hour left isn't Calm itself (late in the night): no "calm stretch" to show. */
export function calmStretch(hours, best, now) {
  if (best === null || best === undefined || hours[best].label !== 'calm') return null
  const ok = (i) => i >= 0 && i < hours.length && isOffpeak(hours[i]) && !isOver(hours[i], now) && hours[i].label === 'calm'
  let s = best
  let e = best + 1
  while (ok(s - 1)) s--
  while (ok(e)) e++
  return { start: s, end: e }
}

/** True if the best hour is still tonight's calmest off-peak hour (no calmer one has already passed).
 *  Late in the night it may only be "the calmest off-peak hour left", and the copy must say so. */
export function isTonightsCalmest(hours, best) {
  if (best === null || best === undefined) return false
  return !hours.some((h) => isOffpeak(h) && h.intensity < hours[best].intensity)
}

/** True if the run or the NYISO data behind it is more than 3 hours old, or the night it describes has ended. */
export function isStale(doc, now) {
  const age = now - Math.min(Date.parse(doc.generatedAt), Date.parse(doc.meta?.dataThrough ?? doc.generatedAt))
  return age > STALE_AFTER || now >= Date.parse(doc.night.end) + HOUR
}

/** Where the scrubber starts: the Live hour during the night, otherwise the best hour. */
export function initialSelection(hours, now) {
  const live = liveIndex(hours, now)
  if (live >= 0) return live
  return bestHour(hours, now) ?? 0
}

/** % of power that isn't gas (nuclear + hydro + wind + other renewables). */
export const cleanShare = (mix) => 100 - mix.gas

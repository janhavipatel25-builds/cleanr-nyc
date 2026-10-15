// Everything is shown in New York time, whatever time zone the viewer is in.
export const TIMEZONE = 'America/New_York'

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
})

/** The New York wall clock at `date`: { year, month, day, hour, minute }. */
export function nyParts(date = new Date()) {
  const out = {}
  for (const { type, value } of partsFormat.formatToParts(date)) {
    if (type !== 'literal') out[type] = Number(value)
  }
  return out
}

const split = (h) => ({ n: h % 12 === 0 ? 12 : h % 12, s: h < 12 ? 'AM' : 'PM' })

/** 3 → "3 AM", 0 → "12 AM", 18 → "6 PM" */
export function hourLabel(h) {
  const { n, s } = split(((h % 24) + 24) % 24)
  return `${n} ${s}`
}

/** 3 → "3A", 21 → "9P" (hour rows) */
export function hourShort(h) {
  const { n, s } = split(((h % 24) + 24) % 24)
  return `${n}${s[0]}`
}

/** (1, 6) → "1–6 AM", (23, 2) → "11 PM–2 AM" */
export function rangeLabel(startH, endH) {
  const a = split(((startH % 24) + 24) % 24)
  const b = split(((endH % 24) + 24) % 24)
  return a.s === b.s ? `${a.n}–${b.n} ${b.s}` : `${a.n} ${a.s}–${b.n} ${b.s}`
}

/** "Thu, Oct 15" in New York */
export function dateChip(date = new Date()) {
  return date.toLocaleDateString('en-US', { timeZone: TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' })
}

/** "Oct 15" in New York */
export function shortDate(date = new Date()) {
  return date.toLocaleDateString('en-US', { timeZone: TIMEZONE, month: 'short', day: 'numeric' })
}

/** ISO time → "9:35 PM" in New York */
export function timeOfDay(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit' })
}

/** "7:10 PM" if it's today in New York, else "Aug 20, 7:10 AM" (so old data is obvious). */
export function updatedLabel(iso, now = Date.now()) {
  const day = (d) => d.toLocaleDateString('en-US', { timeZone: TIMEZONE, year: 'numeric', month: 'numeric', day: 'numeric' })
  const sameDay = day(new Date(iso)) === day(new Date(now))
  return sameDay ? timeOfDay(iso) : `${shortDate(new Date(iso))}, ${timeOfDay(iso)}`
}

// "Add to calendar": a standard .ics file, made in the browser. No server, no account.
import { hourLabel } from './time.js'

const HOUR = 60 * 60 * 1000

// 2026-10-16T07:00:00.000Z → 20261016T070000Z (UTC, so every calendar app agrees on the moment)
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** A 1-hour event at `hour` (an item from tonight.json `hours`). */
export function makeIcs(hour, { now = Date.now() } = {}) {
  const start = Date.parse(hour.time)
  const label = hourLabel(hour.hourOfDay)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cleanr NYC//Calmest hour//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:cleanr-nyc-${stamp(start)}@cleanr-nyc`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + HOUR)}`,
    `SUMMARY:Charge the car · calmest at ${label}`,
    `DESCRIPTION:${label} is tonight's calmest hour on New York's grid: fewer gas plants running\\, inside Con Ed off-peak (12–8 AM). It's a forecast and may shift.`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function calendarFileName(hour) {
  return `cleanr-nyc-charge-${hour.time.slice(0, 10)}.ics`
}

/** Hand the file to the browser (download / "open in Calendar" on phones). */
export function downloadIcs(hour) {
  const blob = new Blob([makeIcs(hour)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: calendarFileName(hour) })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

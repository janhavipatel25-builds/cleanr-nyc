import { expect, test } from 'vitest'
import { calendarFileName, foldLine, makeIcs } from './ics.js'

const hour = { time: '2026-10-16T03:00:00-04:00', hourOfDay: 3 }
const ics = makeIcs(hour, { now: Date.parse('2026-10-15T21:35:00-04:00') })

test('is a calendar file with one event', () => {
  expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
  expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
})

test('uses CRLF line endings, as the standard requires', () => {
  expect(ics.split('\r\n').length).toBeGreaterThan(8)
  expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/)
})

test('a 1-hour event at the calmest hour, in exact UTC time', () => {
  expect(ics).toContain('DTSTART:20261016T070000Z') // 3 AM New York = 07:00 UTC
  expect(ics).toContain('DTEND:20261016T080000Z')
  expect(ics).toContain('DTSTAMP:20261016T013500Z')
})

test('says what and why, without promising a finish time', () => {
  expect(ics).toContain('SUMMARY:Charge the car · calmest at 3 AM')
  expect(ics).not.toMatch(/ready by|finish/i)
})

test('file name includes the night', () => {
  expect(calendarFileName(hour)).toBe('cleanr-nyc-charge-2026-10-16.ics')
})

test('late in the night it says "left tonight", and only forecasts say "forecast" (review fix)', () => {
  const live = makeIcs({ ...hour, source: 'actual' }, { now: 0, tonightsCalmest: false })
  expect(live).toContain('the calmest off-peak hour left tonight')
  expect(live).not.toContain('forecast')
  expect(makeIcs({ ...hour, source: 'forecast' }, { now: 0, tonightsCalmest: true })).toContain('tonight’s calmest hour')
  expect(makeIcs({ ...hour, source: 'forecast' }, { now: 0, tonightsCalmest: true })).toContain('forecast')
})

test('no line is longer than 75 bytes, as the standard requires', () => {
  const enc = new TextEncoder()
  for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75)
})

test('folding loses nothing: unfolded, the description is back in one piece', () => {
  const unfolded = ics.replace(/\r\n /g, '')
  expect(unfolded).toMatch(/DESCRIPTION:3 AM is tonight’s calmest hour on New York's grid.*inside Con Ed off-peak \(12–8 AM\)\./)
})

test('foldLine never splits a multi-byte character', () => {
  const long = 'X:' + '–'.repeat(60) // each dash is 3 bytes
  const folded = foldLine(long).split('\r\n')
  expect(folded.length).toBeGreaterThan(1)
  expect(folded.slice(1).every((l) => l.startsWith(' '))).toBe(true)
  expect(folded.join('').replace(/ /g, '')).toBe(long)
})

import { expect, test } from 'vitest'
import { dateChip, hourLabel, hourShort, nyParts, rangeLabel, timeOfDay, updatedLabel } from './time.js'

test('the machine running these tests is NOT on New York time', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).not.toBe('America/New_York')
})

test('nyParts reads the clock in New York, wherever the viewer is', () => {
  // 07:00 UTC = 3 AM in New York (EDT), 8 AM in London
  expect(nyParts(new Date('2026-10-16T07:00:00Z'))).toMatchObject({ hour: 3, day: 16, month: 10 })
})

test('hour labels', () => {
  expect(hourLabel(0)).toBe('12 AM')
  expect(hourLabel(3)).toBe('3 AM')
  expect(hourLabel(12)).toBe('12 PM')
  expect(hourLabel(18)).toBe('6 PM')
  expect(hourShort(3)).toBe('3A')
  expect(hourShort(21)).toBe('9P')
})

test('ranges', () => {
  expect(rangeLabel(1, 6)).toBe('1–6 AM')
  expect(rangeLabel(23, 2)).toBe('11 PM–2 AM')
})

test('date chip and time of day are in New York', () => {
  const lateLondon = new Date('2026-10-16T02:30:00Z') // 10:30 PM Oct 15 in New York
  expect(dateChip(lateLondon)).toBe('Thu, Oct 15')
  expect(timeOfDay('2026-10-15T21:35:00-04:00')).toBe('9:35 PM')
})

test('"updated" shows the date when it is not today in New York (review fix)', () => {
  const now = Date.parse('2026-10-15T21:35:00-04:00')
  expect(updatedLabel('2026-10-15T19:10:00-04:00', now)).toBe('7:10 PM')
  expect(updatedLabel('2026-08-20T07:10:00-04:00', now)).toBe('Aug 20, 7:10 AM')
})

import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { bestHour, calmStretch, cleanShare, initialSelection, isStale, isTonightsCalmest, liveIndex, statusOf } from './model.js'

// Replay of 2026-10-14 at 9:35 PM: 6–9 PM actual, 10 PM onward forecast. Best hour 3 AM.
const sample = JSON.parse(readFileSync(new URL('../../../backend/samples/tonight.sample.json', import.meta.url)))
const at = (iso) => Date.parse(iso)
const NOW = at('2026-10-14T21:35:00-04:00')
const idx = (hourOfDay) => sample.hours.findIndex((h) => h.hourOfDay === hourOfDay)

describe('statusOf', () => {
  test('the current hour is Live, past actual hours are Actual, later hours are Forecast', () => {
    expect(statusOf(sample.hours[idx(21)], NOW)).toBe('live')
    expect(statusOf(sample.hours[idx(18)], NOW)).toBe('actual')
    expect(statusOf(sample.hours[idx(2)], NOW)).toBe('forecast')
  })

  test('a past hour that only has forecast data is never called Actual', () => {
    const later = at('2026-10-15T01:30:00-04:00') // 10 PM is over but was a forecast
    expect(statusOf(sample.hours[idx(22)], later)).toBe('forecast')
  })
})

describe('liveIndex', () => {
  test('finds the hour we are in', () => {
    expect(liveIndex(sample.hours, NOW)).toBe(idx(21))
  })
  test('is -1 before the night starts', () => {
    expect(liveIndex(sample.hours, at('2026-10-14T15:00:00-04:00'))).toBe(-1)
  })
})

describe('bestHour', () => {
  test('is the calmest off-peak hour (12–8 AM)', () => {
    expect(sample.hours[bestHour(sample.hours, NOW)].hourOfDay).toBe(3)
  })

  test('never points at an hour that is already over (late update)', () => {
    const fourThirty = at('2026-10-15T04:30:00-04:00')
    const best = sample.hours[bestHour(sample.hours, fourThirty)]
    expect(best.hourOfDay).toBe(4) // 3 AM is over; 4 AM is the calmest left
  })

  test('the current hour still counts', () => {
    const threeTen = at('2026-10-15T03:10:00-04:00')
    expect(sample.hours[bestHour(sample.hours, threeTen)].hourOfDay).toBe(3)
  })

  test('ties go to the earlier hour', () => {
    const hours = sample.hours.map((h) => ({ ...h, intensity: h.hourOfDay < 8 ? 150 : 300 }))
    expect(hours[bestHour(hours, NOW)].hourOfDay).toBe(0)
  })

  test('is null once off-peak is over', () => {
    expect(bestHour(sample.hours, at('2026-10-15T08:20:00-04:00'))).toBeNull()
  })
})

describe('calmStretch', () => {
  test('is the run of Calm off-peak hours around the best hour', () => {
    const best = bestHour(sample.hours, NOW)
    expect(calmStretch(sample.hours, best, NOW)).toEqual({ start: idx(1), end: idx(5) + 1 })
  })

  test('drops hours that are already over', () => {
    const twoThirty = at('2026-10-15T02:30:00-04:00')
    const best = bestHour(sample.hours, twoThirty)
    expect(calmStretch(sample.hours, best, twoThirty)).toEqual({ start: idx(2), end: idx(5) + 1 })
  })

  test('is null without a best hour', () => {
    expect(calmStretch(sample.hours, null, NOW)).toBeNull()
  })
})

describe('isStale', () => {
  test('fresh data is not stale', () => {
    expect(isStale(sample, NOW)).toBe(false)
  })
  test('data older than 3 hours is stale', () => {
    expect(isStale(sample, at('2026-10-15T00:40:00-04:00'))).toBe(true)
  })
  test('a night that has ended is stale', () => {
    const doc = { ...sample, generatedAt: '2026-10-15T08:30:00-04:00' }
    expect(isStale(doc, at('2026-10-15T09:05:00-04:00'))).toBe(true)
  })
})

describe('initialSelection', () => {
  test('starts on the Live hour during the night', () => {
    expect(initialSelection(sample.hours, NOW)).toBe(idx(21))
  })
  test('starts on the best hour before the night begins', () => {
    expect(sample.hours[initialSelection(sample.hours, at('2026-10-14T15:00:00-04:00'))].hourOfDay).toBe(3)
  })
})

test('cleanShare is everything that is not gas', () => {
  expect(cleanShare({ nuclear: 24, hydro: 20, wind: 4, otherRenewables: 2, gas: 50 })).toBe(50)
})

describe('after the calmest hour has passed (review fix)', () => {
  const sixThirty = at('2026-10-15T06:30:00-04:00')
  const fourThirty = at('2026-10-15T04:30:00-04:00')

  test('no calm stretch when the best hour left is not Calm', () => {
    const best = bestHour(sample.hours, sixThirty)
    expect(sample.hours[best].label).not.toBe('calm')
    expect(calmStretch(sample.hours, best, sixThirty)).toBeNull()
  })

  test('isTonightsCalmest is true before the calmest hour has passed', () => {
    expect(isTonightsCalmest(sample.hours, bestHour(sample.hours, NOW))).toBe(true)
  })

  test('isTonightsCalmest is false once a calmer hour is over', () => {
    expect(isTonightsCalmest(sample.hours, bestHour(sample.hours, fourThirty))).toBe(false) // 3 AM (186) beat 4 AM (187)
  })
})

describe('isStale also checks how old the NYISO data is (review fix)', () => {
  test('fresh run but 4-hour-old data is stale', () => {
    const doc = { ...sample, generatedAt: '2026-10-14T21:35:00-04:00', meta: { ...sample.meta, dataThrough: '2026-10-14T17:30:00-04:00' } }
    expect(isStale(doc, NOW)).toBe(true)
  })
})

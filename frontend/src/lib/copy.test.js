import { expect, test } from 'vitest'
import { calmestPhrase, gasHint } from './copy.js'

test('calmest phrase is honest about hours that already passed', () => {
  expect(calmestPhrase(true)).toBe('tonight’s calmest hour')
  expect(calmestPhrase(false)).toBe('the calmest off-peak hour left tonight')
})

test('hint: less gas than now', () => {
  expect(gasHint({ diff: 10, bestLabel: '3 AM', tonightsCalmest: true, daytime: false }))
    .toBe('Clean sources on the left, gas on the right. Tonight’s calmest hour (3 AM) runs on 10 points less gas than now.')
})

test('hint: singular point, and "left tonight" late in the night', () => {
  expect(gasHint({ diff: 1, bestLabel: '6 AM', tonightsCalmest: false, daytime: false }))
    .toContain('The calmest off-peak hour left tonight (6 AM) runs on 1 point less gas than now.')
})

test('hint: only blames daytime demand during the day', () => {
  expect(gasHint({ diff: -2, bestLabel: '3 AM', tonightsCalmest: true, daytime: true })).toContain('Daytime demand can be lower')
  const night = gasHint({ diff: -2, bestLabel: '3 AM', tonightsCalmest: true, daytime: false })
  expect(night).toContain('runs on 2 points more gas than right now.')
  expect(night).not.toContain('Daytime')
})

test('hint: same gas', () => {
  expect(gasHint({ diff: 0, bestLabel: '3 AM', tonightsCalmest: true, daytime: false })).toContain('about the same gas as now')
})

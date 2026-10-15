import { expect, test } from 'vitest'
import { STORY, storyFileName, storyText } from './storyImage.js'

test('Instagram Stories size, 9:16', () => {
  expect(STORY).toEqual({ width: 1080, height: 1920 })
})

test('the card says the hour and stays honest (calmest, not cleanest)', () => {
  const t = storyText({ hourOfDay: 3 }, 'Oct 15')
  expect(t).toEqual({ kicker: 'Charged at', time: '3 AM', line: 'Tonight’s calmest hour', brand: 'CLEANR / NYC', date: 'Oct 15' })
  expect(JSON.stringify(t)).not.toMatch(/clean(est)? hour/i)
})

test('file name', () => {
  expect(storyFileName({ time: '2026-10-16T03:00:00-04:00' })).toBe('cleanr-nyc-story-2026-10-16.png')
})

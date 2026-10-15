import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { MOON_MIN_Y, createSkyline, moonAt, sceneValues } from './skyline.js'

const sample = JSON.parse(readFileSync(new URL('../../../../backend/samples/tonight.sample.json', import.meta.url)))

function fakeCanvas() {
  let rects = 0
  return { ctx: { fillStyle: '', fillRect: () => { rects++ } }, count: () => rects }
}

const withHours = (n) => Array.from({ length: n }, (_, i) => sample.hours[Math.min(i, sample.hours.length - 1)])

test.each([14, 15, 16])('draws a full frame for a %i-hour night', (n) => {
  const { ctx, count } = fakeCanvas()
  createSkyline().draw(ctx, withHours(n), n - 1, { still: true })
  expect(count()).toBeGreaterThan(1000)
})

test('the scene maps the last hour to dawn whatever the hour count', () => {
  expect(sceneValues(withHours(15), 14).t).toBe(14)
  expect(sceneValues(withHours(16), 15).t).toBe(14)
})

test('values blend smoothly between hours', () => {
  const hours = [{ ...sample.hours[0], mix: { ...sample.hours[0].mix, gas: 40 } },
    { ...sample.hours[1], mix: { ...sample.hours[1].mix, gas: 50 } }]
  expect(sceneValues(hours, 0.5).gas).toBe(45)
})

test('haze follows tonight\'s relative intensity: 0 at the calmest hour, 1 at the busiest', () => {
  const calmest = sample.hours.reduce((a, h, i) => (h.intensity < sample.hours[a].intensity ? i : a), 0)
  const busiest = sample.hours.reduce((a, h, i) => (h.intensity > sample.hours[a].intensity ? i : a), 0)
  expect(sceneValues(sample.hours, calmest).rel).toBe(0)
  expect(sceneValues(sample.hours, busiest).rel).toBe(1)
})

test('the moon never rises into the scrubber tag (fix for 1–3 AM overlap)', () => {
  for (let t = 1.2; t <= 12.4; t += 0.1) {
    const moon = moonAt(t)
    if (moon.kind === 'moon') expect(moon.y - moon.r).toBeGreaterThanOrEqual(MOON_MIN_Y)
  }
})

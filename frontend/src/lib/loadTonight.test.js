import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { loadTonight } from './loadTonight.js'

const sample = JSON.parse(readFileSync(new URL('../../../backend/samples/tonight.sample.json', import.meta.url)))

const respond = (status, body) => async (url) => {
  respond.lastUrl = url
  return { ok: status === 200, status, json: async () => (typeof body === 'string' ? JSON.parse(body) : body) }
}

test('loads a good file', async () => {
  const result = await loadTonight({ fetchImpl: respond(200, sample), base: '/cleanr-nyc/', now: 0 })
  expect(result.ok).toBe(true)
  expect(result.data.hours).toHaveLength(15)
})

test('asks for a fresh copy every minute (no stale cache)', async () => {
  await loadTonight({ fetchImpl: respond(200, sample), base: '/cleanr-nyc/', now: 5 * 60_000 })
  expect(respond.lastUrl).toBe('/cleanr-nyc/tonight.json?v=5')
})

test('a missing file is an error, not a crash', async () => {
  const result = await loadTonight({ fetchImpl: respond(404, {}), base: '/', now: 0 })
  expect(result).toEqual({ ok: false, error: 'HTTP 404' })
})

test('a network failure is an error, not a crash', async () => {
  const offline = async () => { throw new TypeError('Failed to fetch') }
  const result = await loadTonight({ fetchImpl: offline, base: '/', now: 0 })
  expect(result.ok).toBe(false)
})

test('a file in the wrong shape is rejected', async () => {
  const result = await loadTonight({ fetchImpl: respond(200, { version: 2 }), base: '/', now: 0 })
  expect(result.ok).toBe(false)
})

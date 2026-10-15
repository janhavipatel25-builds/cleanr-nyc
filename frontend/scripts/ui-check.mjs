// Click through the running app like a person would, using your installed Chrome.
// Usage: node scripts/ui-check.mjs [url=http://localhost:5173/cleanr-nyc/]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:5173/cleanr-nyc/'
const sample = JSON.parse(readFileSync(new URL('../../backend/samples/tonight.sample.json', import.meta.url), 'utf8'))
const NIGHT = '2026-10-14T21:35:00-04:00' // sample = replay of this moment

const results = []
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail })

/** A 16-hour daylight-saving night (Oct 31 → Nov 1, 2026), built from the sample's hours. */
function dstNight() {
  const start = Date.parse('2026-10-31T22:00:00Z') // 6 PM EDT
  const hours = Array.from({ length: 16 }, (_, i) => {
    const t = new Date(start + i * 3600_000)
    const hourOfDay = Number(t.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }))
    return { ...sample.hours[Math.min(i, 14)], time: t.toISOString(), hourOfDay }
  })
  return { ...sample, generatedAt: '2026-10-31T21:35:00-04:00', hours,
    night: { start: hours[0].time, end: hours[15].time } }
}

async function open(browser, { width = 390, time = NIGHT, data = sample, reduced = false } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: reduced ? 'reduce' : 'no-preference', acceptDownloads: true })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.clock.install({ time: new Date(time) })
  await page.route('**/tonight.json*', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(data) }))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('[role=slider]')
  return { page, errors }
}

const browser = await chromium.launch({ channel: 'chrome' })
try {
  // 1. keyboard on the scrubber
  {
    const { page, errors } = await open(browser)
    const slider = page.getByRole('slider')
    await slider.focus()
    await page.keyboard.press('End'); check('End → last hour', (await slider.getAttribute('aria-valuenow')) === '14')
    await page.keyboard.press('Home'); check('Home → first hour', (await slider.getAttribute('aria-valuenow')) === '0')
    await page.keyboard.press('ArrowRight'); check('→ moves one hour', (await slider.getAttribute('aria-valuenow')) === '1')
    check('slider speaks time, label and status', /PM, (Calm|Busy|Rush hour), actual/.test(await slider.getAttribute('aria-valuetext')), await slider.getAttribute('aria-valuetext'))

    // 2. tapping a row moves the scrubber
    await page.getByRole('button', { name: /^3 AM:/ }).click()
    check('tapping 3 AM row selects it', (await slider.getAttribute('aria-valuenow')) === '9')

    // 3. live row and honesty labels
    check('a Now row exists', await page.getByRole('button', { name: /9 PM: .*live/ }).count() === 1)
    check('future rows say Forecast', await page.getByRole('button', { name: /^2 AM: .*forecast/ }).count() === 1)

    // 4. info tooltip: click opens, Esc closes
    await page.getByRole('button', { name: 'Why this time' }).click()
    const tip = page.getByRole('tooltip')
    check('info tooltip opens', await tip.isVisible())
    check('tooltip says calm is relative', /compared with the rest of tonight/.test(await tip.textContent()))
    await page.keyboard.press('Escape')
    check('Esc closes tooltip', (await tip.count()) === 0)

    // 5. calendar download
    const [ics] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Add to calendar' }).click()])
    check('Add to calendar downloads an .ics', ics.suggestedFilename() === 'cleanr-nyc-charge-2026-10-15.ics', ics.suggestedFilename())

    // 6. share sheet: open, focus inside, Stories image, Esc, focus returns
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    check('share sheet opens', await page.getByRole('dialog').isVisible())
    check('focus moves into the sheet', await page.evaluate(() => document.activeElement?.textContent) === 'Save for Instagram Stories')
    const [png] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save for Instagram Stories' }).click()])
    const size = await page.evaluate(async (u) => {
      const img = new Image(); img.src = u; await img.decode(); return `${img.naturalWidth}x${img.naturalHeight}`
    }, `data:image/png;base64,${readFileSync(await png.path()).toString('base64')}`)
    check('Stories image is 1080×1920', size === '1080x1920', size)
    await page.keyboard.press('Escape')
    check('Esc closes the sheet', (await page.getByRole('dialog').count()) === 0)
    check('focus returns to Share', await page.evaluate(() => document.activeElement?.id) === 'shareBtn')

    // 7. "See the grid" jumps to the grid lens at the best hour
    await page.getByRole('button', { name: /See the grid at 3 AM/ }).click()
    check('opens The grid', (await page.getByRole('tab', { name: 'The grid' }).getAttribute('aria-selected')) === 'true')
    check('at the best hour', (await page.getByRole('slider').getAttribute('aria-valuenow')) === '9')
    check('grid shows Powering New York', await page.getByText('Powering New York at').isVisible())

    // 8. lens switch with arrow keys
    await page.getByRole('tab', { name: 'The grid' }).focus()
    await page.keyboard.press('ArrowLeft')
    check('← switches back to Tonight', (await page.getByRole('tab', { name: 'Tonight' }).getAttribute('aria-selected')) === 'true')
    check('no console errors (night)', errors.length === 0, errors.join(' | '))
    await page.close()
  }

  // 9. reduced motion: the scene doesn't move
  {
    const { page, errors } = await open(browser, { reduced: true })
    const frame = () => page.evaluate(() => document.querySelector('canvas').toDataURL())
    const a = await frame()
    await page.clock.runFor(2000)
    check('reduced motion: scene is still', a === (await frame()))
    check('no console errors (reduced motion)', errors.length === 0, errors.join(' | '))
    await page.close()
  }
  {
    const { page } = await open(browser)
    const frame = () => page.evaluate(() => document.querySelector('canvas').toDataURL())
    const a = await frame()
    await page.clock.runFor(2000)
    check('normal motion: scene animates', a !== (await frame()))
    await page.close()
  }

  // 10. the 16-hour daylight-saving night
  {
    const { page, errors } = await open(browser, { time: '2026-10-31T21:35:00-04:00', data: dstNight() })
    check('DST night: 16 hours on the scrubber', (await page.getByRole('slider').getAttribute('aria-valuemax')) === '15')
    check('DST night: two 1 AM rows', await page.getByRole('button', { name: /^1 AM:/ }).count() === 2)
    check('no console errors (DST night)', errors.length === 0, errors.join(' | '))
    await page.close()
  }

  // 11. narrow phones and daytime (before 6 PM: all Forecast, no Now row)
  for (const width of [320, 390, 440]) {
    const { page, errors } = await open(browser, { width, time: '2026-10-14T15:00:00-04:00', data: { ...sample, generatedAt: '2026-10-14T14:10:00-04:00' } })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    check(`${width}px: no sideways scroll`, overflow === 0, `${overflow}px`)
    if (width === 390) {
      check('daytime: no Now row', await page.getByRole('button', { name: /: .*live/ }).count() === 0)
      check('daytime: starts on the best hour', (await page.getByRole('slider').getAttribute('aria-valuenow')) === '9')
    }
    check(`${width}px: no console errors`, errors.length === 0, errors.join(' | '))
    await page.close()
  }
} finally {
  await browser.close()
}

for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok || !r.detail ? '' : `  (${r.detail})`}`)
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)

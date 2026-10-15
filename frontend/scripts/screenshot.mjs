// Phone-sized screenshots with your installed Chrome (no browser download).
// Usage: node scripts/screenshot.mjs <url> <out.png> [width=390] [height=844]
//          [--viewport] [--reduced-motion] [--click=<selector>] [--time=<ISO>] [--data=<tonight.json path>]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const [url, out, width = '390', height = '844', ...flags] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 2,
  reducedMotion: flags.includes('--reduced-motion') ? 'reduce' : 'no-preference',
})
const flag = (name) => flags.find((f) => f.startsWith(`--${name}=`))?.slice(name.length + 3)
if (flag('time')) await page.clock.setFixedTime(new Date(flag('time')))
if (flag('data')) {
  const body = readFileSync(flag('data'), 'utf8')
  await page.route('**/tonight.json*', (route) => route.fulfill({ contentType: 'application/json', body }))
}
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(url, { waitUntil: 'networkidle' })
for (const f of flags.filter((f) => f.startsWith('--click='))) await page.click(f.slice(8))
await page.waitForTimeout(600)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
await page.screenshot({ path: out, fullPage: !flags.includes('--viewport') })
await browser.close()
console.log(JSON.stringify({ out, horizontalOverflowPx: overflow, errors }))

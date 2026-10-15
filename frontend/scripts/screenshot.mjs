// Phone-sized screenshots with your installed Chrome (no browser download).
// Usage: node scripts/screenshot.mjs <url> <out.png> [width=390] [height=844] [--reduced-motion] [--click=<selector>]
import { chromium } from 'playwright-core'

const [url, out, width = '390', height = '844', ...flags] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  deviceScaleFactor: 2,
  reducedMotion: flags.includes('--reduced-motion') ? 'reduce' : 'no-preference',
})
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto(url, { waitUntil: 'networkidle' })
for (const f of flags.filter((f) => f.startsWith('--click='))) await page.click(f.slice(8))
await page.waitForTimeout(600)
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(JSON.stringify({ out, horizontalOverflowPx: overflow, errors }))

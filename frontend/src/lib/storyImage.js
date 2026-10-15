// "Save for Instagram Stories": a 1080×1920 PNG made in the browser from the ticket design.
import { H, W, createSkyline } from '../components/scene/skyline.js'
import { hourLabel } from './time.js'

export const STORY = { width: 1080, height: 1920 }

export function storyText(hour, dateText, { tonightsCalmest = true } = {}) {
  const line = tonightsCalmest ? 'Tonight’s calmest hour' : 'Calmest hour left tonight'
  return { kicker: 'Charged at', time: hourLabel(hour.hourOfDay), line, brand: 'CLEANR / NYC', date: dateText }
}

export function storyFileName(hour) {
  return `cleanr-nyc-story-${hour.time.slice(0, 10)}.png`
}

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Draw the story card. Resolves to a PNG Blob. */
export async function renderStory(hours, bestIndex, dateText, tonightsCalmest = true) {
  const text = storyText(hours[bestIndex], dateText, { tonightsCalmest })
  await Promise.all([
    document.fonts.load('900 200px Doto'),
    document.fonts.load('600 48px "Space Grotesk"'),
    document.fonts.load('500 30px "JetBrains Mono"'),
  ])

  // the skyline at the calmest hour, as a still frame, scaled up with crisp pixels
  const sky = Object.assign(document.createElement('canvas'), { width: W, height: H })
  createSkyline().draw(sky.getContext('2d'), hours, bestIndex, { still: true })

  const out = Object.assign(document.createElement('canvas'), STORY)
  const c = out.getContext('2d')
  c.fillStyle = css('--board') || '#0B0A0A'
  c.fillRect(0, 0, STORY.width, STORY.height)
  const skyH = Math.round((STORY.width * H) / W) // 756
  c.imageSmoothingEnabled = false
  c.drawImage(sky, 0, 0, STORY.width, skyH)

  // dashed "ticket" tear line
  c.strokeStyle = css('--board-line') || '#2A2622'
  c.lineWidth = 6
  c.setLineDash([24, 18])
  c.beginPath(); c.moveTo(0, skyH + 3); c.lineTo(STORY.width, skyH + 3); c.stroke()

  const x = 96
  c.textBaseline = 'alphabetic'
  c.fillStyle = css('--muted') || '#9A958F'
  c.font = '500 48px "Space Grotesk"'
  c.fillText(text.kicker, x, skyH + 190)
  c.fillStyle = css('--led') || '#FFB547'
  c.font = '900 260px Doto'
  c.fillText(text.time, x - 10, skyH + 450)
  c.fillStyle = css('--calm') || '#7FB0B0'
  c.font = '600 54px "Space Grotesk"'
  c.fillText(text.line, x, skyH + 560)
  c.fillStyle = css('--muted') || '#9A958F'
  c.font = '500 30px "JetBrains Mono"'
  c.fillText(text.brand, x, STORY.height - 110)
  c.textAlign = 'right'
  c.fillText(text.date.toUpperCase(), STORY.width - x, STORY.height - 110)

  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make image'))), 'image/png'))
}

/** On phones, open the share sheet (Save Image / Instagram); on computers, download. Returns 'shared' | 'saved'. */
export async function shareOrSave(blob, fileName) {
  const file = new File([blob], fileName, { type: 'image/png' })
  const touch = matchMedia('(pointer: coarse)').matches // desktop Chrome can share too, but a download is expected there
  if (touch && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Cleanr NYC' })
    return 'shared'
  }
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'saved'
}

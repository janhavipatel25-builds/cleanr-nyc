// Share sheet: a 9:16 ticket card, "Save for Instagram Stories", and share link.
import { useEffect, useRef, useState } from 'react'
import { renderStory, shareOrSave, storyFileName, storyText } from '../lib/storyImage.js'
import { shortDate } from '../lib/time.js'
import { H, W, createSkyline } from './scene/skyline.js'

export default function ShareSheet({ hours, best, tonightsCalmest, onClose, toast }) {
  const sheet = useRef(null)
  const ticket = useRef(null)
  const [busy, setBusy] = useState(false)
  const date = shortDate(new Date(Date.parse(hours[0].time)))
  const text = storyText(hours[best], date, { tonightsCalmest })
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    createSkyline().draw(ticket.current.getContext('2d'), hours, best, { still: true })
  }, [hours, best])

  // Focus moves in, Tab stays inside, Esc closes, focus returns to where it was.
  // Runs once per opening (onClose via a ref), so re-renders never move focus.
  useEffect(() => {
    const before = document.activeElement
    sheet.current.querySelector('.btn')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') close.current()
      if (e.key !== 'Tab') return
      const items = [...sheet.current.querySelectorAll('button')]
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); before?.focus?.() }
  }, [])

  const saveStory = async () => {
    setBusy(true)
    try {
      const blob = await renderStory(hours, best, date, tonightsCalmest)
      const how = await shareOrSave(blob, storyFileName(hours[best]))
      toast(how === 'shared' ? 'Shared.' : 'Image saved. Add it to your Story.')
    } catch (err) {
      if (err?.name !== 'AbortError') toast('Couldn’t make the image. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const shareLink = async () => {
    const url = window.location.href.split('?')[0]
    try {
      if (navigator.share) await navigator.share({ title: 'Cleanr NYC', text: `Best time to charge tonight in New York: ${text.time}`, url })
      else { await navigator.clipboard.writeText(url); toast('Link copied.') }
    } catch (err) {
      if (err?.name !== 'AbortError') toast('Couldn’t share the link.')
    }
  }

  return (
    <div className="sheet-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-labelledby="shareH">
        <div className="sheet-h">
          <h3 id="shareH">Share tonight’s best time</h3>
          <button className="x" type="button" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="ticket" role="img" aria-label={`${text.kicker} ${text.time}. ${text.line}. ${date}.`}>
          <canvas ref={ticket} width={W} height={H} />
          <div className="tb" aria-hidden="true">
            <div>
              <div className="k">{text.kicker}</div>
              <div className="big">{text.time}</div>
              <div className="lb">{text.line}</div>
            </div>
            <div className="ft"><span>{text.brand}</span><span>{date.toUpperCase()}</span></div>
          </div>
        </div>
        <button className="btn btn-p" type="button" onClick={saveStory} disabled={busy}>
          {busy ? 'Making your image…' : 'Save for Instagram Stories'}
        </button>
        <button className="btn btn-g" type="button" onClick={shareLink}>Share link</button>
      </div>
    </div>
  )
}

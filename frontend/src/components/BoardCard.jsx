// The card under the skyline. Tonight: the answer + actions. The grid: what's powering New York.
import { useEffect, useRef, useState } from 'react'
import { cleanShare, statusOf } from '../lib/model.js'
import { hourLabel, rangeLabel } from '../lib/time.js'
import PixelIcon from './PixelIcon.jsx'

function InfoTip({ hours, best, stretch }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)
  const hovering = useRef(false) // mouse hover already opened it: a click shouldn't close it again
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (!wrap.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const b = hours[best]
  const startH = hours[stretch.start].hourOfDay
  const endH = (hours[stretch.end - 1].hourOfDay + 1) % 24
  const single = stretch.end - stretch.start === 1
  return (
    <div ref={wrap} style={{ display: 'contents' }}>
      <button className="info" type="button" aria-expanded={open} aria-controls="infoTip" aria-label="Why this time"
        onClick={() => setOpen((o) => (hovering.current ? true : !o))}
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') { hovering.current = true; setOpen(true) } }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') { hovering.current = false; setOpen(false) } }}>
        i
      </button>
      {open && (
        <div className="tip" id="infoTip" role="tooltip">
          <span><b>{hourLabel(b.hourOfDay)} is tonight’s calmest hour</b>: compared with the rest of tonight, the fewest gas plants are running.</span>
          <span>
            {single
              ? 'It’s inside Con Ed’s cheapest hours (12–8 AM).'
              : `The grid stays calm from ${rangeLabel(startH, endH)}, all inside Con Ed’s cheapest hours (12–8 AM). Charging any time in that stretch works.`}
          </span>
          {b.source === 'forecast' && <span>It’s a forecast, so it may shift a little.</span>}
        </div>
      )}
    </div>
  )
}

export default function BoardCard({ lens, hours, best, stretch, selected, base, now, onCalendar, onShare }) {
  if (lens === 'grid') {
    const h = hours[selected]
    const isNow = statusOf(h, now) === 'live'
    return (
      <div className="boardcard">
        <div className="board" aria-live="polite">
          <span className="ic" style={{ color: 'var(--src-hydro)' }}><PixelIcon name="wind" /></span>
          <span className="txt">
            <span className="k">Powering New York at <span className="tm">{isNow ? 'now' : hourLabel(h.hourOfDay)}</span></span>
            <span className="big">{cleanShare(isNow ? base.mix : h.mix)}% clean</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="boardcard">
      <div className="board" aria-live="polite">
        <span className="ic"><PixelIcon name="car" /></span>
        <span className="txt">
          <span className="k">Best time to charge</span>
          {best === null
            ? <span className="none">Off-peak is over. Check back this evening.</span>
            : <span className="time">{hourLabel(hours[best].hourOfDay)}</span>}
        </span>
        {best !== null && <InfoTip hours={hours} best={best} stretch={stretch} />}
      </div>
      {best !== null && (
        <div className="btns">
          <button className="btn btn-p" type="button" onClick={onCalendar}><PixelIcon name="cal" />Add to calendar</button>
          <button className="btn btn-g" type="button" onClick={onShare} id="shareBtn">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M5 5l3-3 3 3M3 9v4h10V9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            Share
          </button>
        </div>
      )}
    </div>
  )
}

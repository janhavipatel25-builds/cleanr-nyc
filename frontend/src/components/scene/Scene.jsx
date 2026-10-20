// The shared pixel skyline with the time scrubber on its top edge (both lenses).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isOver, statusOf } from '../../lib/model.js'
import { hourLabel } from '../../lib/time.js'
import { STATUS, WORD } from '../../lib/words.js'
import { H, W, createSkyline } from './skyline.js'

const TICK_MS = 50 // ~20 frames a second is plenty for pixel art

function useSkyline(canvasRef, hours, selected, reduced) {
  const sky = useRef(null)
  if (!sky.current) sky.current = createSkyline()
  const live = useRef({ hours, target: selected, shown: selected })
  live.current.hours = hours
  live.current.target = selected

  // Reduced motion: one still frame per change, no loop.
  useEffect(() => {
    if (!reduced) return
    live.current.shown = selected
    sky.current.draw(canvasRef.current.getContext('2d'), hours, selected, { still: true })
  }, [reduced, hours, selected, canvasRef])

  // Otherwise: a gentle loop that eases toward the selected hour; paused when off screen.
  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf = 0
    let last = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(canvas)
    const frame = (t) => {
      raf = requestAnimationFrame(frame)
      if (!visible || t - last < TICK_MS) return
      last = t
      const s = live.current
      s.shown += (s.target - s.shown) * 0.22
      if (Math.abs(s.target - s.shown) < 0.01) s.shown = s.target
      sky.current.step()
      sky.current.draw(ctx, s.hours, s.shown)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); io.disconnect() }
  }, [reduced, canvasRef])
}

function Scrubber({ hours, selected, onSelect, stretch, now, onX }) {
  const track = useRef(null)
  const tag = useRef(null)
  const [width, setWidth] = useState(0)
  const [tagW, setTagW] = useState(130)
  const n = hours.length
  const h = hours[selected]
  const status = statusOf(h, now)

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width + 14)) // + padding + border
    ro.observe(track.current)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => { if (tag.current) setTagW(tag.current.offsetWidth) }, [selected, status])

  const colX = (i) => 6 + ((i + 0.5) * (width - 12)) / n
  const x = colX(selected)
  useLayoutEffect(() => { onX(12 + x) }, [x, onX])
  const tagLeft = Math.min(Math.max(x, tagW / 2 - 6), width - tagW / 2 + 6)

  const indexAt = (clientX) => {
    const r = track.current.getBoundingClientRect()
    return Math.max(0, Math.min(n - 1, Math.floor(((clientX - r.left - 6) / (r.width - 12)) * n)))
  }
  const dragging = useRef(false)
  const onKeyDown = (e) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key]
    if (step) { e.preventDefault(); onSelect(Math.max(0, Math.min(n - 1, selected + step))) }
    if (e.key === 'Home') { e.preventDefault(); onSelect(0) }
    if (e.key === 'End') { e.preventDefault(); onSelect(n - 1) }
  }
  const stepCss = `((100% - 12px) / ${n})`
  // One smooth gradient: each hour's state colour sits at the middle of its slot.
  const gradient = `linear-gradient(to right, ${hours.map((hr, i) => `var(--${hr.label}) ${(((i + 0.5) / n) * 100).toFixed(2)}%`).join(', ')})`
  const pastShare = (hours.filter((hr) => isOver(hr, now)).length / n) * 100
  const timeText = status === 'live' ? 'NOW' : hourLabel(h.hourOfDay)

  return (
    <div className="scrub">
      <div
        ref={track}
        className="scrub-track"
        role="slider"
        tabIndex={0}
        aria-label="Time of night"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={selected}
        aria-valuetext={`${hourLabel(h.hourOfDay)}, ${WORD[h.label]}, ${STATUS[status].toLowerCase()}`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); onSelect(indexAt(e.clientX)) }}
        onPointerMove={(e) => { if (dragging.current) onSelect(indexAt(e.clientX)) }}
        onPointerUp={() => { dragging.current = false }}
        onPointerCancel={() => { dragging.current = false }}
      >
        <span className="scrub-bar" style={{ '--grad': gradient }}>
          <span className="scrub-past" style={{ '--past': `${pastShare}%` }} />
        </span>
        {stretch && (
          <span className="win" style={{
            left: `calc(6px + ${stretch.start} * ${stepCss} - 3px)`,
            width: `calc(${stretch.end - stretch.start} * ${stepCss} + 6px)`,
          }} />
        )}
        <span className="thumb" style={{ left: `${x}px` }} />
        <span ref={tag} className="thumb-tag" style={{ left: `${tagLeft}px` }}>
          <span className="tm">{timeText}</span>
          <span style={{ color: `var(--${h.label})` }}>{WORD[h.label]}</span>
          {status !== 'live' && <span className="st">{STATUS[status]}</span>}
        </span>
      </div>
      <div className="scrub-ends" aria-hidden="true">
        <span>{hourLabel(hours[0].hourOfDay)}</span>
        <span>{hourLabel(hours[n - 1].hourOfDay)}</span>
      </div>
    </div>
  )
}

export default function Scene({ hours, selected, onSelect, stretch, now, lens, reduced }) {
  const canvas = useRef(null)
  const [lineX, setLineX] = useState(0)
  useSkyline(canvas, hours, selected, reduced)
  const h = hours[selected]
  const m = h.mix

  return (
    <div className="scene" id="scene">
      <canvas ref={canvas} width={W} height={H} role="img"
        aria-label={`Pixel New York skyline at ${hourLabel(h.hourOfDay)}: ${WORD[h.label].toLowerCase()}, ${m.gas}% gas`} />
      {lens === 'grid' && (
        <div className="srclabels" aria-hidden="true">
          <span className="srclabel" style={{ left: '3%', top: '66%' }}><i style={{ '--c': 'var(--src-gas)' }} />Gas {m.gas}%</span>
          <span className="srclabel" style={{ right: '3%', top: '58%' }}><i style={{ '--c': 'var(--src-wind)' }} />Wind {m.wind}%</span>
          <span className="srclabel" style={{ left: '3%', top: '44%' }}><i style={{ '--c': 'var(--src-nuclear)' }} />↖ Upstate: nuclear + hydro {m.nuclear + m.hydro}%</span>
        </div>
      )}
      <div className="timeline" style={{ left: `${lineX}px` }} />
      <Scrubber hours={hours} selected={selected} onSelect={onSelect} stretch={stretch} now={now} onX={setLineX} />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import AppBar from './components/AppBar.jsx'
import LensSwitch from './components/LensSwitch.jsx'
import StatusNote from './components/StatusNote.jsx'
import { loadTonight } from './lib/loadTonight.js'
import { bestHour, calmStretch, initialSelection, isStale, statusOf } from './lib/model.js'
import { hourShort } from './lib/time.js'

const MINUTE = 60_000
const REFRESH = 15 * MINUTE

/** Ticks once a minute so Live / best hour move on without a reload. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), MINUTE)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function App() {
  const now = useNow()
  const [result, setResult] = useState(null) // null = loading
  const [lens, setLens] = useState('tonight')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let alive = true
    const load = () => loadTonight().then((r) => alive && setResult(r))
    load()
    const id = setInterval(load, REFRESH)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const doc = result?.ok ? result.data : null
  const hours = doc?.hours ?? []
  const best = useMemo(() => (doc ? bestHour(hours, now) : null), [doc, hours, now])
  const stretch = useMemo(() => calmStretch(hours, best, now), [hours, best, now])
  const sel = selected ?? (doc ? initialSelection(hours, now) : 0)

  const state = result === null ? 'loading' : !result.ok ? 'error' : isStale(doc, now) ? 'stale' : 'ok'

  return (
    <main className="mx-auto grid max-w-[440px]">
      <AppBar now={now} />
      <LensSwitch lens={lens} onChange={setLens} />
      <StatusNote state={state} doc={doc} />
      {doc && (
        // Step 3 placeholder: plain list of tonight's real hours. Replaced by the ported design in step 4.
        <ol className="rounded-[var(--r)] border border-border bg-card py-1">
          {hours.map((h, i) => {
            const status = statusOf(h, now)
            return (
              <li key={h.time}>
                <button type="button" onClick={() => setSelected(i)} aria-pressed={i === sel}
                  className="grid w-full cursor-pointer grid-cols-[52px_1fr_72px_72px] items-center gap-2.5 border-b border-border px-3.5 py-2 text-left text-sm last:border-0 aria-pressed:shadow-[inset_3px_0_0_var(--led)]">
                  <span className="font-dot text-[15px] font-extrabold text-led">{hourShort(h.hourOfDay)}</span>
                  <span>{h.intensity} g/kWh</span>
                  <span style={{ color: `var(--${h.label})` }}>{h.label === 'rush' ? 'Rush hr' : h.label === 'busy' ? 'Busy' : 'Calm'}</span>
                  <span className="text-right text-xs text-faint">
                    {i === best ? 'Best · ' : stretch && i >= stretch.start && i < stretch.end ? 'Stretch · ' : ''}
                    {status === 'live' ? 'Live' : status === 'actual' ? 'Actual' : 'Forecast'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}

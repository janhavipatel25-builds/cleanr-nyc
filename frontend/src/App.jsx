// One app, two lenses on the same scene and the same hours.
// State: { lens, selectedHour }. Everything else is derived from tonight.json + the clock.
import { useCallback, useEffect, useMemo, useState } from 'react'
import AppBar from './components/AppBar.jsx'
import BoardCard from './components/BoardCard.jsx'
import Footer from './components/Footer.jsx'
import LensSwitch from './components/LensSwitch.jsx'
import ShareSheet from './components/ShareSheet.jsx'
import StatusNote from './components/StatusNote.jsx'
import Toast from './components/Toast.jsx'
import GridView from './components/grid/GridView.jsx'
import Scene from './components/scene/Scene.jsx'
import TonightView from './components/tonight/TonightView.jsx'
import { downloadIcs } from './lib/ics.js'
import { loadTonight } from './lib/loadTonight.js'
import { bestHour, calmStretch, initialSelection, isStale, isTonightsCalmest, liveIndex } from './lib/model.js'
import { useReducedMotion } from './lib/useReducedMotion.js'

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

function useTonight() {
  const [result, setResult] = useState(null) // null = still loading
  useEffect(() => {
    let alive = true
    const load = () => loadTonight().then((r) => alive && setResult((prev) => (r.ok || !prev?.ok ? r : prev)))
    load()
    const id = setInterval(load, REFRESH)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return result
}

export default function App() {
  const now = useNow()
  const result = useTonight()
  const reduced = useReducedMotion()
  const [lens, setLens] = useState('tonight')
  const [picked, setPicked] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [message, setMessage] = useState('')
  const clearMessage = useCallback(() => setMessage(''), [])
  const closeShare = useCallback(() => setSharing(false), [])

  const doc = result?.ok ? result.data : null
  const hours = useMemo(() => doc?.hours ?? [], [doc])
  const best = useMemo(() => (doc ? bestHour(hours, now) : null), [doc, hours, now])
  const stretch = useMemo(() => calmStretch(hours, best, now), [hours, best, now])
  const tonightsCalmest = isTonightsCalmest(hours, best)
  const selected = doc ? Math.min(picked ?? initialSelection(hours, now), hours.length - 1) : 0

  // "Now" for comparisons: the Live hour if it has real data, else the latest actual hour.
  const live = doc ? liveIndex(hours, now) : -1
  const base = live >= 0 && hours[live].source === 'actual' ? hours[live] : doc?.now

  const state = result === null ? 'loading' : !result.ok ? 'error' : isStale(doc, now) ? 'stale' : 'ok'

  const seeGrid = () => {
    setLens('grid')
    setPicked(best)
    document.getElementById('scene')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }
  const addToCalendar = () => {
    downloadIcs(hours[best], tonightsCalmest)
    setMessage('Calendar invite downloaded.')
  }

  return (
    <main className="mx-auto grid max-w-[440px] grid-cols-[minmax(0,1fr)]">
      <AppBar now={now} />
      <LensSwitch lens={lens} onChange={setLens} />
      <StatusNote state={state} doc={doc} now={now} />
      {doc && (
        <>
          <Scene hours={hours} selected={selected} onSelect={setPicked} stretch={stretch} now={now} lens={lens} reduced={reduced} />
          <BoardCard lens={lens} hours={hours} best={best} stretch={stretch} tonightsCalmest={tonightsCalmest} selected={selected} base={base} now={now}
            onCalendar={addToCalendar} onShare={() => setSharing(true)} />
          {lens === 'tonight'
            ? <TonightView hours={hours} best={best} stretch={stretch} selected={selected} onSelect={setPicked} now={now} base={base} tonightsCalmest={tonightsCalmest} onSeeGrid={seeGrid} />
            : <GridView hours={hours} selected={selected} best={best} base={base} now={now} tonightsCalmest={tonightsCalmest} />}
        </>
      )}
      <Footer doc={doc} now={now} />
      {sharing && best !== null && <ShareSheet hours={hours} best={best} tonightsCalmest={tonightsCalmest} onClose={closeShare} toast={setMessage} />}
      <Toast message={message} onDone={clearMessage} />
    </main>
  )
}

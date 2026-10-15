import { timeOfDay } from '../lib/time.js'

/** Loading, error and "data delayed" states. Calm, factual, never alarming. */
export default function StatusNote({ state, doc }) {
  const text = {
    loading: 'Loading tonight’s grid…',
    error: 'Can’t reach tonight’s data right now. Try again in a few minutes.',
    stale: doc && `Data delayed · last updated ${timeOfDay(doc.generatedAt)}. Times may be out of date.`,
  }[state]
  if (!text) return null
  return (
    <p role="status" className="my-3 rounded-[var(--r)] border border-border bg-card px-4 py-3 text-sm text-muted">
      {text}
    </p>
  )
}

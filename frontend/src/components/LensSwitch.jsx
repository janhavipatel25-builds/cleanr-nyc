const LENSES = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'grid', label: 'The grid' },
]

// Segmented control. Arrow keys switch lenses (tabs pattern).
export default function LensSwitch({ lens, onChange }) {
  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const next = lens === 'tonight' ? 'grid' : 'tonight'
    onChange(next)
    document.getElementById(`tab-${next}`)?.focus()
  }
  return (
    <div role="tablist" aria-label="View" onKeyDown={onKeyDown}
      className="mb-3 grid grid-cols-2 rounded-xl border border-border bg-card p-[3px]">
      {LENSES.map(({ id, label }) => (
        <button key={id} id={`tab-${id}`} type="button" role="tab"
          aria-selected={lens === id} aria-controls={`view-${id}`} tabIndex={lens === id ? 0 : -1}
          onClick={() => onChange(id)}
          className="cursor-pointer rounded-[9px] border-0 bg-transparent px-2 py-[9px] text-sm font-semibold text-muted transition-colors duration-200 aria-selected:bg-fg aria-selected:text-bg">
          {label}
        </button>
      ))}
    </div>
  )
}

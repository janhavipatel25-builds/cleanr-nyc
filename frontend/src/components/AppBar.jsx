import { dateChip } from '../lib/time.js'

export default function AppBar({ now }) {
  return (
    <header className="flex items-center justify-between gap-3 pt-4 pb-3">
      <span className="whitespace-nowrap font-mono text-[13px] font-semibold tracking-[.14em]">CLEANR / NYC</span>
      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[.05em]">
        {dateChip(new Date(now))}
      </span>
    </header>
  )
}

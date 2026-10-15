// The grid lens: what's powering New York at the selected hour, and why hours differ.
import { cleanShare, statusOf } from '../../lib/model.js'
import { hourLabel, hourShort } from '../../lib/time.js'
import { SOURCES, STATUS, WORD } from '../../lib/words.js'
import PixelIcon from '../PixelIcon.jsx'

const points = (n) => `${n} ${n === 1 ? 'point' : 'points'}`

function Lede({ h, isNow, base }) {
  const cl = cleanShare(isNow ? base.mix : h.mix)
  if (isNow) {
    return <p className="lede"><b>Right now, {cl}% of New York’s power is clean.</b> <span className="m">Drag the timeline to watch the mix change through the night.</span></p>
  }
  const nowCl = cleanShare(base.mix)
  const vs = cl > nowCl ? `vs ${nowCl}% now. Demand is lower, so fewer gas plants run.`
    : cl < nowCl ? `vs ${nowCl}% now. Higher demand pulls in more gas.` : 'about the same as now.'
  return <p className="lede"><b>At {hourLabel(h.hourOfDay)}, {cl}% clean</b> <span className="m">{vs}</span></p>
}

function MixDots({ mix }) {
  const colours = SOURCES.flatMap(({ key }) => Array(mix[key]).fill(`var(--src-${key})`))
  return (
    <div className="dots" role="img" aria-label={SOURCES.map(({ key, name }) => `${name} ${mix[key]}%`).join(', ')}>
      {Array.from({ length: 100 }, (_, i) => <i key={i} style={{ '--i': i, '--c': colours[i] ?? 'var(--src-gas)' }} />)}
    </div>
  )
}

function Bar({ mix, label, t }) {
  return (
    <div className="cmp-row">
      <span className="t">{t}</span>
      <span className="bar" role="img" aria-label={`${label}: ${mix.gas}% gas`}>
        {SOURCES.map(({ key }) => <span key={key} style={{ width: `${mix[key]}%`, background: `var(--src-${key})` }} />)}
      </span>
      <span className="v">{mix.gas}% gas</span>
    </div>
  )
}

export default function GridView({ hours, selected, best, base, now }) {
  const h = hours[selected]
  const status = statusOf(h, now)
  const isNow = status === 'live'
  const m = isNow ? base.mix : h.mix
  const b = best === null ? null : hours[best]
  const diff = b ? base.mix.gas - b.mix.gas : 0

  return (
    <section className="view enter" id="view-grid" role="tabpanel" aria-labelledby="tab-grid">
      <Lede h={h} isNow={isNow} base={base} />

      <div className="mixwrap">
        <div className="mixhead">
          <span>Mix at <span className="tm">{isNow ? 'NOW' : hourLabel(h.hourOfDay)}</span>{!isNow && <span className="mono" style={{ marginLeft: 8, color: 'var(--muted)' }}>{STATUS[status]}</span>}</span>
          <span style={{ color: `var(--${h.label})` }}>{WORD[h.label]}</span>
        </div>
        <MixDots mix={m} />
        <div className="split"><span>Clean <b>{cleanShare(m)}%</b></span><span>Gas <b>{m.gas}%</b></span></div>
      </div>

      <ul className="srcs">
        {SOURCES.map(({ key, name, note }) => {
          const d = m[key] - base.mix[key]
          const dl = isNow ? '' : d === 0 ? '±0' : `${d > 0 ? '+' : '−'}${Math.abs(d)} ${Math.abs(d) === 1 ? 'pt' : 'pts'}`
          const cls = isNow || d === 0 ? '' : key === 'gas' ? (d > 0 ? 'up' : 'down') : d > 0 ? 'down' : 'up'
          return (
            <li key={key}>
              <span style={{ color: `var(--src-${key})` }}><PixelIcon name={key} /></span>
              <span className="nm">{name}<small>{note}</small></span>
              <span className={`dl ${cls}`}>{dl}{dl && <span className="sr-only"> vs now</span>}</span>
              <span className="pct">{m[key]}%</span>
            </li>
          )
        })}
      </ul>

      {b && (
        <>
          <div className="sec-h"><h2>Now vs calmest hour</h2><span className="mono">Gas share</span></div>
          <div className="card cmp">
            <Bar mix={base.mix} label="Now" t="Now" />
            <Bar mix={b.mix} label={hourLabel(b.hourOfDay)} t={hourShort(b.hourOfDay)} />
            {!isNow && selected !== best && <Bar mix={h.mix} label={hourLabel(h.hourOfDay)} t={hourShort(h.hourOfDay)} />}
            <p className="hint">
              Clean sources on the left, gas on the right. Tonight’s calmest hour ({hourLabel(b.hourOfDay)}){' '}
              {diff > 0 ? `runs on ${points(diff)} less gas than now.`
                : diff === 0 ? 'runs on about the same gas as now.'
                  : `runs on ${points(-diff)} more gas than right now. Daytime demand can be lower than you’d think.`}
            </p>
          </div>
        </>
      )}

      <div className="sec-h"><h2>Why hours differ</h2></div>
      <div className="roles">
        <div className="role"><b>Steady</b><span>Nuclear and hydro run about the same all night.</span></div>
        <div className="role"><b>Weather</b><span>Wind comes and goes with the weather.</span></div>
        <div className="role"><b>Flex</b><span>Gas plants ramp up and down to match demand. Busy hours burn more gas.</span></div>
      </div>
    </section>
  )
}

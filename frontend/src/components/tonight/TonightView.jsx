// Tonight lens: hour by hour from now, why the best hour, coming soon.
import { calmestPhrase } from '../../lib/copy.js'
import { liveIndex, statusOf } from '../../lib/model.js'
import { hourLabel, hourShort } from '../../lib/time.js'
import { SHORT, STATUS, WORD } from '../../lib/words.js'
import PixelIcon from '../PixelIcon.jsx'

function HourRows({ hours, best, stretch, selected, onSelect, now }) {
  const from = Math.max(0, liveIndex(hours, now))
  const lo = Math.min(...hours.map((h) => h.intensity))
  const hi = Math.max(...hours.map((h) => h.intensity))
  const inStretch = (i) => stretch && i >= stretch.start && i < stretch.end

  return (
    <ol className="rows">
      {hours.slice(from).map((h, k) => {
        const i = from + k
        const status = statusOf(h, now)
        // 1–10 dots, relative to tonight: the calmest hour has 1, the busiest has 10
        const on = hi > lo ? 1 + Math.round((9 * (h.intensity - lo)) / (hi - lo)) : 1
        const cls = ['row', status === 'live' && 'now', inStretch(i) && 'best', i === selected && 'sel'].filter(Boolean).join(' ')
        const spoken = `${hourLabel(h.hourOfDay)}: ${WORD[h.label]}, ${STATUS[status].toLowerCase()}${i === best ? ', best time to charge' : inStretch(i) ? ', in the calm stretch' : ''}`
        return (
          <li key={h.time}>
            <button type="button" className={cls} style={{ '--c': `var(--${h.label})` }} aria-pressed={i === selected} aria-label={spoken} onClick={() => onSelect(i)}>
              <span className="t">{status === 'live' ? 'Now' : hourShort(h.hourOfDay)}</span>
              <span className="bar" aria-hidden="true">
                {Array.from({ length: 10 }, (_, d) => <i key={d} className={d < on ? 'on' : ''} />)}
              </span>
              <span className="lab">{SHORT[h.label]}</span>
              <span className="tag">
                {i === best && <span className="best">Best</span>}
                <span>{STATUS[status]}</span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function WhyCard({ hours, best, base, tonightsCalmest, onSeeGrid }) {
  if (best === null) return null
  const b = hours[best]
  const label = hourLabel(b.hourOfDay)
  const drop = base.mix.gas - b.mix.gas
  return (
    <div className="card">
      <h3>Why {label}?</h3>
      {drop > 0 ? (
        <p>
          After midnight the city winds down. Nuclear and hydro keep running about the same, so gas drops from{' '}
          <b>{base.mix.gas}%</b> of the mix now to <b>{b.mix.gas}%</b> at {label}. Fewer gas plants running, and it’s off-peak pricing too.
        </p>
      ) : (
        <p>
          {label} is {calmestPhrase(tonightsCalmest)}, with gas at <b>{b.mix.gas}%</b> of the mix. It’s off-peak pricing too.
        </p>
      )}
      <button className="link" type="button" onClick={onSeeGrid}>See the grid at {label} →</button>
    </div>
  )
}

export default function TonightView({ hours, best, stretch, selected, onSelect, now, base, tonightsCalmest, onSeeGrid }) {
  return (
    <section className="view enter" id="view-tonight" role="tabpanel" aria-labelledby="tab-tonight">
      <div className="sec-h"><h2>Tonight, hour by hour</h2><span className="mono">Tap an hour</span></div>
      <HourRows hours={hours} best={best} stretch={stretch} selected={selected} onSelect={onSelect} now={now} />
      <WhyCard hours={hours} best={best} base={base} tonightsCalmest={tonightsCalmest} onSeeGrid={onSeeGrid} />
      <div className="sec-h"><h2>Coming soon</h2></div>
      <div className="soon">
        {[['laundry', 'Laundry'], ['dish', 'Dishwasher'], ['phone', 'Devices']].map(([icon, name]) => (
          <span key={icon}><PixelIcon name={icon} />{name}</span>
        ))}
      </div>
    </section>
  )
}

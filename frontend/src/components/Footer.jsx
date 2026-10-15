import { timeOfDay } from '../lib/time.js'

export default function Footer({ doc }) {
  return (
    <footer className="foot">
      <span className="mono">V1 · live NYISO data{doc ? ` · updated ${timeOfDay(doc.meta.dataThrough)}` : ''}</span>
      <span>Statewide fuel mix from NYISO, New York’s grid operator. NYC runs on the state grid. Future hours are forecasts and may shift.</span>
      <span>Calm, Busy and Rush compare tonight’s hours with each other. Gas includes dual-fuel and oil plants. Emissions: EPA eGRID.</span>
      <span><a href="https://github.com/janhavipatel25-builds/cleanr-nyc" style={{ color: 'inherit' }}>How it works (GitHub)</a></span>
    </footer>
  )
}

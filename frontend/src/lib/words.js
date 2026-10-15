// Copy used in more than one place. "Calmest", never "cleanest".
export const WORD = { calm: 'Calm', busy: 'Busy', rush: 'Rush hour' }
export const SHORT = { calm: 'Calm', busy: 'Busy', rush: 'Rush hr' }
export const STATUS = { live: 'Live', actual: 'Actual', forecast: 'Forecast' }

// Order = left-to-right in the mix bars: clean sources first, gas last.
export const SOURCES = [
  { key: 'nuclear', name: 'Nuclear', note: 'Steady, upstate' },
  { key: 'hydro', name: 'Hydro', note: 'Steady, Niagara & St. Lawrence' },
  { key: 'wind', name: 'Wind', note: 'Comes and goes with the weather' },
  { key: 'otherRenewables', name: 'Other renewables', note: 'Smaller clean sources' },
  { key: 'gas', name: 'Gas', note: 'Follows demand · incl. dual-fuel & oil' },
]

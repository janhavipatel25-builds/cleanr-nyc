// Honest copy shared by the board, cards, calendar and share image.
// Late in the night the calmest hour may already be over: then the best hour is only
// "the calmest off-peak hour left tonight", and we must not call it "tonight's calmest".

export const calmestPhrase = (tonightsCalmest) =>
  tonightsCalmest ? 'tonight’s calmest hour' : 'the calmest off-peak hour left tonight'

const capital = (s) => s[0].toUpperCase() + s.slice(1)
const points = (n) => `${n} ${n === 1 ? 'point' : 'points'}`

/** The note under "Now vs calmest hour". `diff` = gas points now minus gas points at the best hour. */
export function gasHint({ diff, bestLabel, tonightsCalmest, daytime }) {
  const who = `${capital(calmestPhrase(tonightsCalmest))} (${bestLabel})`
  const tail = diff > 0 ? `runs on ${points(diff)} less gas than now.`
    : diff === 0 ? 'runs on about the same gas as now.'
      : `runs on ${points(-diff)} more gas than right now.${daytime ? ' Daytime demand can be lower than you’d think.' : ''}`
  return `Clean sources on the left, gas on the right. ${who} ${tail}`
}

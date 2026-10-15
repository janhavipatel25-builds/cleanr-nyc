// The pixel New York skyline, ported from cleanr-prototype.html (drawScene).
// What moves and why (docs/design-spec.md): sky = time of night · lit windows = demand ·
// smoke = gas share · turbine speed = wind share · haze = tonight's relative intensity.
// The background stays calm; only the meaningful elements move.

export const W = 160
export const H = 112
const BASE = 82
const STEPS = 14 // the prototype's night had 15 hours (0..14); other nights are mapped onto it

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16))
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const mixc = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))
const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`

// Sky by night position (6 PM → 8 AM): sunset → night → dawn.
const SKY = [['#4A2E58', '#E58A5A'], ['#2C2445', '#8A4E5E'], ['#1C1D36', '#3D3049'], ['#121628', '#1E2238'], ['#0F1424', '#1A2033'], ['#0E1322', '#181E31'], ['#0D1220', '#171C2F'], ['#0D1220', '#171C2F'], ['#0D1220', '#171C2F'], ['#0E1424', '#1A2134'], ['#121A30', '#252D47'], ['#1A2645', '#3A3A5A'], ['#2C3E6A', '#7C6888'], ['#4F78A8', '#E5A276'], ['#7EA6CC', '#F0CDA2']].map((p) => p.map(hex))

function seeded(s) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// Same skyline on every load (fixed seed).
const CITY = (() => {
  const r = seeded(19), near = [], far = [], wins = []
  for (let x = 20; x < 132;) { const w = 4 + ((r() * 7) | 0), h = 10 + ((r() * 18) | 0); far.push({ x, w, h }); x += w }
  for (let x = 22; x < 126;) {
    let w = 5 + ((r() * 6) | 0), h = 14 + ((r() * 26) | 0), k = r() < 0.25 ? 'step' : 'flat'
    if (x > 58 && x < 68 && !near.some((b) => b.k === 'spire')) { w = 10; h = 52; k = 'spire' }
    if (x > 94 && x < 104 && !near.some((b) => b.k === 'crown')) { w = 9; h = 42; k = 'crown' }
    near.push({ x, w, h, k }); x += w + (r() < 0.3 ? 1 : 0)
  }
  near.forEach((b) => { for (let y = BASE - b.h + 4; y < BASE - 2; y += 3) for (let x = b.x + 1; x < b.x + b.w - 1; x += 2) wins.push({ x, y, seed: r() }) })
  return { near, far, wins }
})()
const STARS = (() => { const r = seeded(5), a = []; for (let i = 0; i < 40; i++) a.push({ x: (r() * W) | 0, y: ((r() * 50) | 0) + 2 }); return a })()

function line(c, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1)
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let e = dx + dy
  for (;;) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } }
}
function disc(c, cx, cy, r) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) c.fillRect(cx + x, cy + y, 1, 1) }

/** Values at position f (hour index, fractional while easing). t = position on the 0..14 sky scale. */
export function sceneValues(hours, f) {
  const n = hours.length
  const i = Math.max(0, Math.min(n - 1, Math.floor(f)))
  const j = Math.min(n - 1, i + 1)
  const w = f - i
  const lerp = (fn) => fn(hours[i]) * (1 - w) + fn(hours[j]) * w
  const lo = Math.min(...hours.map((h) => h.intensity))
  const hi = Math.max(...hours.map((h) => h.intensity))
  return {
    t: n > 1 ? (f * STEPS) / (n - 1) : 0,
    gas: lerp((h) => h.mix.gas),
    wind: lerp((h) => h.mix.wind),
    rel: hi > lo ? (lerp((h) => h.intensity) - lo) / (hi - lo) : 0,
  }
}

// The scrubber tag covers the sky down to about y = 37 on a phone-width scene.
// The moon's arc stays below it (fix for the moon hiding behind the tag around 1–3 AM).
export const MOON_MIN_Y = 37

/** Sun at dusk and dawn, moon across the night. t on the 0..14 scale. */
export function moonAt(t) {
  if (t < 1.2) return { kind: 'sun', x: 140, y: Math.round(60 + t * 18), r: 6 }
  if (t > 12.4) return { kind: 'sun', x: 18, y: Math.round(70 - (t - 12.4) * 16), r: 6 }
  const p = (t - 1.2) / 11.2
  return { kind: 'moon', x: Math.round(140 - p * 110), y: Math.round(47 - Math.sin(p * Math.PI) * 5), r: 5 }
}

export function createSkyline() {
  let tick = 0
  let puffs = []

  /** Draw one frame. `still` = no animation (reduced motion, share card). */
  function draw(c, hours, f, { still = false } = {}) {
    const { t, gas, wind, rel } = sceneValues(hours, f)
    const si = Math.max(0, Math.min(STEPS, Math.floor(t))), sj = Math.min(STEPS, si + 1)
    const top = mixc(SKY[si][0], SKY[sj][0], t - si)
    const bot = mixc(SKY[si][1], SKY[sj][1], t - si)
    const night = Math.max(0, 1 - Math.abs(t - 7.5) / 6.5) // 0 dusk/dawn → 1 deep night

    // sky: 6 flat bands with a light dithered seam
    const BANDS = 6, bh = Math.ceil(BASE / BANDS)
    for (let k = 0; k < BANDS; k++) { c.fillStyle = rgb(mixc(top, bot, Math.pow(k / (BANDS - 1), 1.6))); c.fillRect(0, k * bh, W, bh) }
    for (let k = 1; k < BANDS; k++) { c.fillStyle = rgb(mixc(top, bot, Math.pow((k - 1) / (BANDS - 1), 1.6))); for (let x = 0; x < W; x += 2) c.fillRect(x + (k & 1), k * bh, 1, 1) }

    // stars: a handful twinkle slowly
    if (night > 0.45) {
      STARS.slice(0, 20).forEach((s, i) => {
        const tw = i % 5 === 0 && !still ? (Math.sin(tick / 9 + i) + 1) / 2 : 1
        c.fillStyle = `rgba(236,232,227,${((night - 0.45) * 0.8 * (0.4 + 0.6 * tw)).toFixed(3)})`
        c.fillRect(s.x, s.y, 1, 1)
      })
    }

    const body = moonAt(t)
    if (body.kind === 'sun') { c.fillStyle = t < 1.2 ? '#F6B45F' : '#F7C77A'; disc(c, body.x, body.y, body.r) }
    else { c.fillStyle = '#E9E4D6'; disc(c, body.x, body.y, body.r); c.fillStyle = rgb(top); disc(c, body.x + 3, body.y - 2, 4) }

    // far skyline
    c.fillStyle = rgb(mixc(hex('#2E3540'), bot, 0.55))
    CITY.far.forEach((b) => c.fillRect(b.x, BASE - b.h, b.w, b.h))

    // gas stacks on the waterfront
    ;[[5, 34], [11, 30], [17, 26]].forEach(([x, h]) => {
      for (let y = BASE - h; y < BASE; y++) { c.fillStyle = ((y - (BASE - h)) >> 2) & 1 ? '#B9B4AE' : '#C2410C'; c.fillRect(x, y, 3, 1) }
      c.fillStyle = '#08080A'; c.fillRect(x - 1, BASE - 4, 5, 4)
    })

    // near skyline
    c.fillStyle = '#08080A'
    CITY.near.forEach((b) => {
      const y0 = BASE - b.h
      if (b.k === 'spire') { c.fillRect(b.x, y0 + 8, b.w, b.h - 8); c.fillRect(b.x + 2, y0 + 3, b.w - 4, 6); c.fillRect(b.x + 4, y0 - 2, 2, 6); c.fillRect(b.x + 4, y0 - 10, 1, 8) }
      else if (b.k === 'crown') { c.fillRect(b.x, y0 + 6, b.w, b.h - 6); for (let s = 0; s < 4; s++) c.fillRect(b.x + 1 + s, y0 + 6 - s * 2, b.w - 2 - s * 2, 2); c.fillRect(b.x + 4, y0 - 6, 1, 6) }
      else if (b.k === 'step') { c.fillRect(b.x, y0 + 4, b.w, b.h - 4); c.fillRect(b.x + 1, y0, b.w - 2, 5) }
      else c.fillRect(b.x, y0, b.w, b.h)
    })

    // lit windows = demand (more gas → more lights on)
    const lit = Math.max(0.06, Math.min(0.6, (gas - 34) / 40))
    c.fillStyle = '#FBCB97'
    CITY.wins.forEach((w) => {
      const flick = still ? 0 : (((tick >> 2) + w.seed * 997) | 0) % 401 === 0 ? 0.15 : 0
      if (w.seed < lit + flick) c.fillRect(w.x, w.y, 1, 1)
    })

    // water: calm base, slow sparse shimmer, window reflections
    c.fillStyle = '#0E1A22'; c.fillRect(0, BASE, W, H - BASE)
    c.fillStyle = '#16303C'; c.fillRect(0, BASE, W, 1)
    c.fillStyle = '#1E3C4A'
    for (let y = BASE + 3; y < H; y += 4) for (let x = 0; x < W; x++) if ((x + (tick >> 4) * ((y >> 2) & 1 ? 1 : -1) + y * 7) % 19 === 0) c.fillRect(x, y, 2, 1)
    c.fillStyle = '#7A6447'
    CITY.wins.forEach((w) => {
      if (w.seed < lit && w.seed > lit * 0.4) { const ry = BASE + ((BASE - w.y) >> 2) + 2; if (ry < H - 1 && (w.x + (tick >> 3)) % 5) c.fillRect(w.x, ry, 1, 1) }
    })

    // offshore wind: spin speed = wind share
    const spin = wind * 0.016
    ;[[136, 24], [147, 28], [156, 22]].forEach(([x, h], i) => {
      c.fillStyle = '#CFCAC4'; c.fillRect(x, BASE - h, 1, h + 3)
      const a0 = tick * spin + i * 1.3
      for (let k = 0; k < 3; k++) { const a = a0 + k * 2.094; line(c, x, BASE - h, x + Math.cos(a) * 7, BASE - h + Math.sin(a) * 7) }
      c.fillStyle = '#ff5a4a'; if ((tick >> 4) % 2) c.fillRect(x, BASE - h - 1, 1, 1)
    })

    // smoke from the stacks scales with gas share
    if (!still) {
      const rate = Math.max(0, (gas - 38) / 22)
      ;[[6, 34], [12, 30], [18, 26]].forEach(([x, h], i) => { if (Math.random() < rate * (i === 2 ? 0.5 : 0.8)) puffs.push({ x, y: BASE - h - 1, r: 1, l: 0, vx: 0.22 + Math.random() * 0.15 }) })
      puffs.forEach((p) => { p.l++; p.y -= 0.22; p.x += p.vx; if (p.l % 18 === 0 && p.r < 4) p.r++ })
      puffs = puffs.filter((p) => p.l < 150 && p.x < W + 4)
    }
    puffs.forEach((p) => {
      c.fillStyle = rgb(mixc(hex('#7A685A'), top, Math.min(0.85, p.l / 160)))
      for (let y = -p.r; y <= p.r; y++) for (let x = -p.r; x <= p.r; x++) if (x * x + y * y <= p.r * p.r) c.fillRect(Math.round(p.x) + x, Math.round(p.y) + y, 1, 1)
    })

    // haze: soft band low on the skyline, stronger at tonight's busier hours
    const dens = rel * 0.55
    if (dens > 0) {
      c.fillStyle = `rgba(122,104,90,${(dens * 0.35).toFixed(3)})`; c.fillRect(0, BASE - 34, W, 34)
      c.fillStyle = `rgba(122,104,90,${(dens * 0.2).toFixed(3)})`; c.fillRect(0, BASE - 50, W, 16)
      c.fillStyle = `rgba(122,104,90,${(dens * 0.3).toFixed(3)})`
      const off = tick >> 3
      for (let y = BASE - 54; y < BASE - 50; y++) for (let x = 0; x < W; x++) if (BAYER[y & 3][(x + off) & 3] < 0.4) c.fillRect(x, y, 1, 1)
    }
  }

  return { draw, step: () => { tick++ } }
}

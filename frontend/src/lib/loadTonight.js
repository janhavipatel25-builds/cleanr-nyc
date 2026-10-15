// Load tonight.json (written every hour by the pipeline). Never throws: returns { ok, data | error }.

/** A light shape check. The pipeline already enforces docs/tonight.schema.json before publishing. */
function looksRight(doc) {
  return doc?.version === 1 && Array.isArray(doc.hours) && doc.hours.length >= 14 && doc.now?.mix && doc.night?.end
}

export async function loadTonight({ fetchImpl = fetch, base = import.meta.env.BASE_URL, now = Date.now() } = {}) {
  // A new URL each minute, so a cached old copy is never shown for long.
  const url = `${base}tonight.json?v=${Math.floor(now / 60_000)}`
  try {
    const res = await fetchImpl(url, { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const doc = await res.json()
    if (!looksRight(doc)) return { ok: false, error: 'Unexpected data format' }
    return { ok: true, data: doc }
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error' }
  }
}

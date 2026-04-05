// Client-safe drill utilities — no Prisma, no server imports

export type DrillItem = {
  id: string
  english: string
  spanish: string
  spanishDisplay?: string
  spanishNormalized?: string
  emoji: string | null
  bucket: string
  score: number
}

function pickFromMastered(mastered: DrillItem[], excludeId?: string | null) {
  const pool = excludeId ? mastered.filter(i => i.id !== excludeId) : mastered
  const candidates = pool.length > 0 ? pool : mastered
  if (candidates.length === 0) return null
  const weights = candidates.map(i => 1 / (i.score + 1))
  const total = weights.reduce((a, b) => a + b, 0)
  let rand = Math.random() * total
  for (let i = 0; i < candidates.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1]
}

export function clientWeightedPick(items: DrillItem[], excludeId?: string | null, forceMastered = false): DrillItem | null {
  if (!items || items.length === 0) return null
  const learning = items.filter(i => i.bucket === 'learning')
  const learned = items.filter(i => i.bucket === 'learned')
  const mastered = items.filter(i => i.bucket === 'mastered')

  if (mastered.length > 0 && (forceMastered || Math.random() < 0.20)) {
    const picked = pickFromMastered(mastered, excludeId)
    if (picked) return picked
  }

  const nonMastered = [...learning, ...learned]
  if (nonMastered.length === 0) {
    return pickFromMastered(mastered, excludeId)
  }
  const pool = excludeId ? nonMastered.filter(i => i.id !== excludeId) : nonMastered
  const draw = pool.length > 0 ? pool : nonMastered
  return draw[Math.floor(Math.random() * draw.length)]
}

export function clientNormalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?¿¡;:\u201c\u201d\u2018\u2019'"]/g, '')
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .trim()
}

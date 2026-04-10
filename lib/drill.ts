import { prisma } from './prisma'
import { LEARNING_TARGET } from './vocab-data'

export type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
export type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'
export type MoveType = 'promote' | 'master' | 'demote' | null

export interface DrillItem {
  id: string
  english: string
  spanish: string
  spanishDisplay?: string
  spanishNormalized?: string
  emoji: string | null
  exampleEs: string | null
  exampleEn: string | null
  imageUrl: string | null
  bucket: Bucket
  score: number
}

export interface DrillState {
  item: DrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
  pool?: DrillItem[]  // candidate pool for client-side picking
}

interface ProgressCounts {
  learning: number
  learned: number
  mastered: number
  unseen: number
}

export function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,!?¿¡;:\u201c\u201d\u2018\u2019'"]/g, '')
    .replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')
    .trim()
}

// Pick a mastered word using inverse-score weighting: weight = 1/(score+1).
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

export function weightedPick(items: DrillItem[], excludeId?: string | null, forceMastered = false): DrillItem | null {
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

async function getCurrentUser(username: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new Error(`User not found: ${username}`)
  return user
}

async function fetchCounts(userId: string): Promise<ProgressCounts> {
  const grouped = await prisma.userVocabProgress.groupBy({
    by: ['bucket'],
    where: { userId },
    _count: { _all: true },
  })
  const counts: ProgressCounts = { learning: 0, learned: 0, mastered: 0, unseen: 0 }
  for (const row of grouped) {
    const bucket = row.bucket as keyof ProgressCounts
    if (bucket in counts) counts[bucket] = row._count._all
  }
  return counts
}

// Single query for all candidate items instead of 3 separate queries
async function fetchCandidateItems(userId: string, excludeId?: string | null, masteredOnly = false): Promise<DrillItem[]> {
  const rows = await prisma.userVocabProgress.findMany({
    where: {
      userId,
      bucket: masteredOnly ? 'mastered' : { in: ['learning', 'learned', 'mastered'] },
      ...(excludeId ? { NOT: { entryId: excludeId } } : {}),
    },
    include: { entry: true },
    orderBy: [{ score: 'asc' }, { lastSeenAt: 'asc' }],
    take: masteredOnly ? 150 : 66, // larger pool for mastered-only to sample all score levels
  })
  return rows.map((row) => ({
    id: row.entry.id,
    english: row.entry.englishPrimary ?? row.entry.spanish,
    spanish: row.entry.spanish,
    spanishDisplay: row.entry.spanishDisplay ?? row.entry.spanish,
    spanishNormalized: normalize(row.entry.spanish),
    emoji: row.entry.emoji,
    exampleEs: row.entry.exampleEs ?? null,
    exampleEn: row.entry.exampleEn ?? null,
    imageUrl: row.entry.imageUrl ?? null,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
}

export async function initializeDrillState(username: string, masteredOnly = false): Promise<DrillState> {
  const user = await getCurrentUser(username)
  const [counts, items] = await Promise.all([fetchCounts(user.id), fetchCandidateItems(user.id, null, masteredOnly)])
  const item = weightedPick(items)
  return { item, counts, unseenCount: counts.unseen, stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 }, lastMove: null, lastMoveType: null, pool: items }
}

export async function submitAttempt(params: { username: string; entryId: string; answer: string; attemptNumber: number }) {
  const user = await getCurrentUser(params.username)
  const progress = await prisma.userVocabProgress.findFirstOrThrow({ where: { userId: user.id, entryId: params.entryId }, include: { entry: true } })
  const expected = normalize(progress.entry.spanish)
  const normalized = normalize(params.answer)
  const isBlank = normalized === ''
  const isCorrect = normalized === expected

  if (params.attemptNumber === 1) {
    if (isBlank) {
      await prisma.drillAttempt.create({ data: { userId: user.id, entryId: params.entryId, correct: false } })
      const state = await nextState(user.id, params.entryId, false, true, progress)
      return { phase: 'revealed' as Phase, correct: false, answer: progress.entry.spanishDisplay ?? progress.entry.spanish, ...state }
    }
    if (!isCorrect) return { phase: 'wrong-first' as Phase, correct: false, answer: null }
  }

  const success = !isBlank && isCorrect
  await prisma.drillAttempt.create({ data: { userId: user.id, entryId: params.entryId, correct: success } })
  const state = await nextState(user.id, params.entryId, success, false, progress)
  return { phase: success ? ('correct' as Phase) : ('revealed' as Phase), correct: success, answer: progress.entry.spanishDisplay ?? progress.entry.spanish, ...state }
}

async function nextState(userId: string, entryId: string, success: boolean, immediateReveal: boolean, existingProgress?: any) {
  const progress = existingProgress ?? await prisma.userVocabProgress.findFirstOrThrow({ where: { userId, entryId } })
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  await prisma.$transaction(async (tx) => {
    if (success) {
      if (currentBucket === 'learning') {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { bucket: 'learned', score: progress.score + 1, lastSeenAt: new Date() } })
        lastMove = '↑ Promoted to Learned'; lastMoveType = 'promote'
        const learningCount = await tx.userVocabProgress.count({ where: { userId, bucket: 'learning' } })
        if (learningCount < LEARNING_TARGET) {
          const unseen = await tx.userVocabProgress.findFirst({ where: { userId, bucket: 'unseen' }, orderBy: { entry: { sortOrder: 'asc' } } })
          if (unseen) await tx.userVocabProgress.update({ where: { id: unseen.id }, data: { bucket: 'learning', score: 0 } })
        }
      } else if (currentBucket === 'learned') {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { bucket: 'mastered', score: progress.score + 1, lastSeenAt: new Date(), masteredAt: progress.masteredAt ?? new Date() } })
        await tx.masteredNetLog.create({ data: { userId, entryId, delta: 1 } })
        lastMove = '★ Mastered!'; lastMoveType = 'master'
      } else {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { score: progress.score + 1, lastSeenAt: new Date() } })
      }
    } else if (!immediateReveal || currentBucket !== 'learning') {
      if (currentBucket === 'mastered') {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        await tx.masteredNetLog.create({ data: { userId, entryId, delta: -1 } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else if (currentBucket === 'learned') {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else {
        await tx.userVocabProgress.update({ where: { id: progress.id }, data: { score: 0, lastSeenAt: new Date() } })
      }
    } else {
      await tx.userVocabProgress.update({ where: { id: progress.id }, data: { score: 0, lastSeenAt: new Date() } })
    }
  })

  const forceMastered = !success && currentBucket === 'mastered'
  const [counts, items] = await Promise.all([fetchCounts(userId), fetchCandidateItems(userId, entryId)])
  const item = weightedPick(items, entryId, forceMastered)
  return { item, counts, unseenCount: counts.unseen, stats: { correct: 0, wrong: 0, promoted: lastMoveType === 'promote' || lastMoveType === 'master' ? 1 : 0, demoted: lastMoveType === 'demote' ? 1 : 0 }, lastMove, lastMoveType, pool: items }
}

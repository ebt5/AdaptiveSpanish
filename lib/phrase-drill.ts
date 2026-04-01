import { prisma } from './prisma'

export type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
export type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'
export type MoveType = 'promote' | 'master' | 'demote' | null

const PHRASE_LEARNING_TARGET = 15

export interface PhraseDrillItem {
  id: string       // phraseId
  english: string
  spanish: string
  grammarTag: string
  grammarNote: string | null
  bucket: Bucket
  score: number
}

export interface PhraseDrillState {
  item: PhraseDrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')                  // strip accent marks
    .replace(/[\u00bf\u00a1]/g, '')                   // strip ¿ and ¡
    .replace(/[.,!?;:\u201c\u201d\u2018\u2019'"]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')                             // normalize spaces
    .trim()
}

function pickFromMastered(mastered: PhraseDrillItem[], excludeId?: string | null) {
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

function weightedPick(items: PhraseDrillItem[], excludeId?: string | null, forceMastered = false) {
  const learning = items.filter(i => i.bucket === 'learning')
  const learned = items.filter(i => i.bucket === 'learned')
  const mastered = items.filter(i => i.bucket === 'mastered')

  if (mastered.length > 0 && (forceMastered || Math.random() < 0.20)) {
    const picked = pickFromMastered(mastered, excludeId)
    if (picked) return picked
  }

  const nonMastered: PhraseDrillItem[] = [...learning, ...learned]
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

async function fetchCounts(userId: string) {
  const grouped = await prisma.userPhraseProgress.groupBy({
    by: ['bucket'],
    where: { userId },
    _count: { _all: true },
  })
  const counts = { learning: 0, learned: 0, mastered: 0, unseen: 0 }
  for (const row of grouped) {
    const bucket = row.bucket as keyof typeof counts
    if (bucket in counts) counts[bucket] = row._count._all
  }
  return counts
}

async function fetchCandidateItems(userId: string, tags?: string[], excludeId?: string | null): Promise<PhraseDrillItem[]> {
  const tagFilter = tags && tags.length > 0 ? { phrase: { grammarTag: { in: tags } } } : {}
  const excludeFilter = excludeId ? { NOT: { phraseId: excludeId } } : {}
  const baseWhere = { userId, ...tagFilter, ...excludeFilter }
  const [learning, learned, mastered] = await Promise.all([
    prisma.userPhraseProgress.findMany({
      where: { ...baseWhere, bucket: 'learning' },
      include: { phrase: true },
      take: 24,
    }),
    prisma.userPhraseProgress.findMany({
      where: { ...baseWhere, bucket: 'learned' },
      include: { phrase: true },
      take: 18,
    }),
    prisma.userPhraseProgress.findMany({
      where: { ...baseWhere, bucket: 'mastered' },
      include: { phrase: true },
      orderBy: [{ score: 'asc' }, { lastSeenAt: 'asc' }],
      take: 24,
    }),
  ])
  let allRows = [...learning, ...learned, ...mastered]

  // If nothing drillable for the selected tags, promote unseen phrases matching tags
  if (allRows.length === 0 && tags && tags.length > 0) {
    const unseenRows = await prisma.userPhraseProgress.findMany({
      where: { userId, bucket: 'unseen', phrase: { grammarTag: { in: tags } } },
      include: { phrase: true },
      orderBy: { phrase: { sortOrder: 'asc' } },
      take: PHRASE_LEARNING_TARGET,
    })
    for (const row of unseenRows) {
      await prisma.userPhraseProgress.update({ where: { id: row.id }, data: { bucket: 'learning' } })
      row.bucket = 'learning'
    }
    allRows = unseenRows
  }

  return allRows.map((row) => ({
    id: row.phraseId,
    english: row.phrase.english,
    spanish: row.phrase.spanish,
    grammarTag: row.phrase.grammarTag,
    grammarNote: row.phrase.grammarNote ?? null,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
}

export async function initializePhraseDrillState(username: string, tags?: string[]): Promise<PhraseDrillState> {
  const user = await getCurrentUser(username)

  // Ensure progress rows exist for all phrases
  const allPhrases = await prisma.phrase.findMany({ select: { id: true }, orderBy: { sortOrder: 'asc' } })
  const existingProgress = await prisma.userPhraseProgress.findMany({
    where: { userId: user.id },
    select: { phraseId: true },
  })
  const existingIds = new Set(existingProgress.map(p => p.phraseId))
  const missing = allPhrases.filter(p => !existingIds.has(p.id))

  if (missing.length > 0) {
    // Only create unseen rows — promotion to learning is handled per-tag by fetchCandidateItems
    await prisma.userPhraseProgress.createMany({
      data: missing.map(p => ({ userId: user.id, phraseId: p.id, bucket: 'unseen', score: 0 })),
      skipDuplicates: true,
    })
  }

  const [counts, items] = await Promise.all([fetchCounts(user.id), fetchCandidateItems(user.id, tags)])
  const item = weightedPick(items) ?? null
  return { item, counts, unseenCount: counts.unseen, stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 }, lastMove: null, lastMoveType: null }
}

export async function submitPhraseAttempt(params: { username: string; phraseId: string; answer: string; attemptNumber: number }) {
  const user = await getCurrentUser(params.username)
  const progress = await prisma.userPhraseProgress.findFirstOrThrow({
    where: { userId: user.id, phraseId: params.phraseId },
    include: { phrase: true },
  })
  const expected = normalize(progress.phrase.spanish)
  const normalized = normalize(params.answer)
  const isBlank = normalized === ''
  const isCorrect = normalized === expected

  if (params.attemptNumber === 1) {
    if (isBlank) {
      await prisma.phraseAttempt.create({ data: { userId: user.id, phraseId: params.phraseId, correct: false } })
      const state = await nextPhraseState(user.id, params.phraseId, false, true, progress.phrase.grammarNote ?? null)
      return { phase: 'revealed' as Phase, correct: false, answer: progress.phrase.spanish, ...state }
    }
    if (!isCorrect) return { phase: 'wrong-first' as Phase, correct: false, answer: null, grammarNote: null }
  }

  const success = !isBlank && isCorrect
  await prisma.phraseAttempt.create({ data: { userId: user.id, phraseId: params.phraseId, correct: success } })
  const state = await nextPhraseState(user.id, params.phraseId, success, false, progress.phrase.grammarNote ?? null)
  return { phase: success ? ('correct' as Phase) : ('revealed' as Phase), correct: success, answer: progress.phrase.spanish, ...state }
}

async function nextPhraseState(userId: string, phraseId: string, success: boolean, immediateReveal: boolean, grammarNote: string | null) {
  const progress = await prisma.userPhraseProgress.findFirstOrThrow({ where: { userId, phraseId } })
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  await prisma.$transaction(async (tx) => {
    if (success) {
      if (currentBucket === 'learning') {
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { bucket: 'learned', score: progress.score + 1, lastSeenAt: new Date() } })
        lastMove = '↑ Promoted to Learned'; lastMoveType = 'promote'
        const learningCount = await tx.userPhraseProgress.count({ where: { userId, bucket: 'learning' } })
        if (learningCount < PHRASE_LEARNING_TARGET) {
          const unseen = await tx.userPhraseProgress.findFirst({
            where: { userId, bucket: 'unseen' },
            orderBy: { phrase: { sortOrder: 'asc' } },
          })
          if (unseen) await tx.userPhraseProgress.update({ where: { id: unseen.id }, data: { bucket: 'learning', score: 0 } })
        }
      } else if (currentBucket === 'learned') {
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { bucket: 'mastered', score: progress.score + 1, lastSeenAt: new Date(), masteredAt: progress.masteredAt ?? new Date() } })
        await tx.phraseMasteredNetLog.create({ data: { userId, phraseId, delta: 1 } })
        lastMove = '★ Mastered!'; lastMoveType = 'master'
      } else {
        // Mastered correct — score grows unbounded
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { score: progress.score + 1, lastSeenAt: new Date() } })
      }
    } else if (!immediateReveal || currentBucket !== 'learning') {
      if (currentBucket === 'mastered') {
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        await tx.phraseMasteredNetLog.create({ data: { userId, phraseId, delta: -1 } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else if (currentBucket === 'learned') {
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else {
        await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { score: 0, lastSeenAt: new Date() } })
      }
    } else {
      await tx.userPhraseProgress.update({ where: { id: progress.id }, data: { score: 0, lastSeenAt: new Date() } })
    }
  })

  const forceMastered = !success && currentBucket === 'mastered'
  const [counts, items] = await Promise.all([fetchCounts(userId), fetchCandidateItems(userId, undefined, phraseId)])
  const item = weightedPick(items, phraseId, forceMastered) ?? null
  return {
    item,
    counts,
    unseenCount: counts.unseen,
    stats: { correct: 0, wrong: 0, promoted: lastMoveType === 'promote' || lastMoveType === 'master' ? 1 : 0, demoted: lastMoveType === 'demote' ? 1 : 0 },
    lastMove,
    lastMoveType,
    grammarNote,
  }
}

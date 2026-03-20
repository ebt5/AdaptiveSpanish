import { prisma } from './prisma'
import { DEMO_EMAIL, LEARNING_TARGET } from './vocab-data'

export type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
export type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'
export type MoveType = 'promote' | 'master' | 'demote' | null

export interface DrillItem {
  id: string
  english: string
  spanish: string
  emoji: string | null
  bucket: Bucket
}

export interface DrillState {
  item: DrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

interface ProgressCounts {
  learning: number
  learned: number
  mastered: number
  unseen: number
}

function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function weightedPick(items: (DrillItem & { score: number })[], excludeId?: string | null) {
  const learning = items.filter(i => i.bucket === 'learning')
  const learned = items.filter(i => i.bucket === 'learned')
  const mastered = items.filter(i => i.bucket === 'mastered')

  const weighted: (DrillItem & { score: number })[] = [
    ...learning, ...learning, ...learning,
    ...learned, ...learned,
  ]

  if (mastered.length > 0 && weighted.length > 0) {
    const masteredWeights = mastered.flatMap((item) => {
      const weight = Math.max(1, 12 - item.score)
      return Array.from({ length: weight }, () => item)
    })
    const masteredDrawCount = Math.max(1, Math.floor(weighted.length / 4))
    for (let i = 0; i < masteredDrawCount; i += 1) {
      const picked = masteredWeights[Math.floor(Math.random() * masteredWeights.length)]
      if (picked) weighted.push(picked)
    }
  }

  if (weighted.length === 0) return null
  const pool = excludeId ? weighted.filter(i => i.id !== excludeId) : weighted
  const draw = pool.length > 0 ? pool : weighted
  return draw[Math.floor(Math.random() * draw.length)]
}

async function getCurrentUser() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!user) {
    throw new Error(`Current test user not found: ${DEMO_EMAIL}. Run the seed/init step first.`)
  }
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

async function fetchCandidateItems(userId: string, excludeId?: string | null) {
  const [learning, learned, mastered] = await Promise.all([
    prisma.userVocabProgress.findMany({
      where: { userId, bucket: 'learning', ...(excludeId ? { NOT: { entryId: excludeId } } : {}) },
      include: { entry: true },
      take: 24,
    }),
    prisma.userVocabProgress.findMany({
      where: { userId, bucket: 'learned', ...(excludeId ? { NOT: { entryId: excludeId } } : {}) },
      include: { entry: true },
      take: 18,
    }),
    prisma.userVocabProgress.findMany({
      where: { userId, bucket: 'mastered', ...(excludeId ? { NOT: { entryId: excludeId } } : {}) },
      include: { entry: true },
      orderBy: [{ score: 'asc' }, { lastSeenAt: 'asc' }],
      take: 24,
    }),
  ])
  return [...learning, ...learned, ...mastered].map((row) => ({
    id: row.entry.id,
    english: row.entry.english,
    spanish: row.entry.spanish,
    emoji: row.entry.emoji,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
}

export async function initializeDrillState(): Promise<DrillState> {
  const user = await getCurrentUser()
  const [counts, items] = await Promise.all([
    fetchCounts(user.id),
    fetchCandidateItems(user.id),
  ])
  const item = weightedPick(items)
  return {
    item,
    counts,
    unseenCount: counts.unseen,
    stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 },
    lastMove: null,
    lastMoveType: null,
  }
}

export async function submitAttempt(params: { entryId: string; answer: string; attemptNumber: number }) {
  const user = await getCurrentUser()
  const progress = await prisma.userVocabProgress.findFirstOrThrow({
    where: { userId: user.id, entryId: params.entryId },
    include: { entry: true },
  })
  const expected = normalize(progress.entry.spanish)
  const normalized = normalize(params.answer)
  const isBlank = normalized === ''
  const isCorrect = normalized === expected

  if (params.attemptNumber === 1) {
    if (isBlank) {
      await prisma.drillAttempt.create({ data: { userId: user.id, entryId: params.entryId, correct: false } })
      const state = await nextState(user.id, params.entryId, false, true)
      return { phase: 'revealed' as Phase, correct: false, answer: progress.entry.spanish, ...state }
    }
    if (!isCorrect) {
      return { phase: 'wrong-first' as Phase, correct: false, answer: null }
    }
  }

  const success = !isBlank && isCorrect
  await prisma.drillAttempt.create({ data: { userId: user.id, entryId: params.entryId, correct: success } })
  const state = await nextState(user.id, params.entryId, success, false)
  return { phase: success ? ('correct' as Phase) : ('revealed' as Phase), correct: success, answer: progress.entry.spanish, ...state }
}

async function nextState(userId: string, entryId: string, success: boolean, immediateReveal: boolean) {
  const progress = await prisma.userVocabProgress.findFirstOrThrow({ where: { userId, entryId } })
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  await prisma.$transaction(async (tx) => {
    if (success) {
      if (currentBucket === 'learning') {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { bucket: 'learned', score: progress.score + 1, lastSeenAt: new Date() },
        })
        lastMove = '↑ Promoted to Learned'
        lastMoveType = 'promote'
        const learningCount = await tx.userVocabProgress.count({ where: { userId, bucket: 'learning' } })
        if (learningCount < LEARNING_TARGET) {
          const unseen = await tx.userVocabProgress.findFirst({ where: { userId, bucket: 'unseen' }, orderBy: { entry: { sortOrder: 'asc' } } })
          if (unseen) await tx.userVocabProgress.update({ where: { id: unseen.id }, data: { bucket: 'learning', score: 0 } })
        }
      } else if (currentBucket === 'learned') {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { bucket: 'mastered', score: progress.score + 1, lastSeenAt: new Date() },
        })
        lastMove = '★ Mastered!'
        lastMoveType = 'master'
      } else {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { score: progress.score + 1, lastSeenAt: new Date() },
        })
      }
    } else if (!immediateReveal || currentBucket !== 'learning') {
      if (currentBucket === 'mastered') {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { bucket: 'learned', score: 0, lastSeenAt: new Date() },
        })
        lastMove = '↓ Demoted to Learned'
        lastMoveType = 'demote'
      } else if (currentBucket === 'learned') {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { bucket: 'learning', score: 0, lastSeenAt: new Date() },
        })
        lastMove = '↓ Demoted to Learning'
        lastMoveType = 'demote'
      } else {
        await tx.userVocabProgress.update({
          where: { id: progress.id },
          data: { score: 0, lastSeenAt: new Date() },
        })
      }
    } else {
      await tx.userVocabProgress.update({
        where: { id: progress.id },
        data: { score: 0, lastSeenAt: new Date() },
      })
    }
  })

  const [counts, items] = await Promise.all([
    fetchCounts(userId),
    fetchCandidateItems(userId, entryId),
  ])
  const item = weightedPick(items, entryId)
  return {
    item,
    counts,
    unseenCount: counts.unseen,
    stats: { correct: 0, wrong: 0, promoted: lastMoveType === 'promote' || lastMoveType === 'master' ? 1 : 0, demoted: lastMoveType === 'demote' ? 1 : 0 },
    lastMove,
    lastMoveType,
  }
}

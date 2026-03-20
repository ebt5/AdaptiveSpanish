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

async function fetchProgress(userId: string) {
  const rows = await prisma.userVocabProgress.findMany({
    where: { userId },
    include: { entry: true },
  })
  const items = rows.map((row) => ({
    id: row.entry.id,
    english: row.entry.english,
    spanish: row.entry.spanish,
    emoji: row.entry.emoji,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
  const counts = {
    learning: items.filter(i => i.bucket === 'learning').length,
    learned: items.filter(i => i.bucket === 'learned').length,
    mastered: items.filter(i => i.bucket === 'mastered').length,
    unseen: items.filter(i => i.bucket === 'unseen').length,
  }
  return { items, counts }
}

async function sessionStats(userId: string) {
  const attempts = await prisma.drillAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  const correct = attempts.filter(a => a.correct).length
  const wrong = attempts.length - correct
  return { correct, wrong, promoted: 0, demoted: 0 }
}

export async function initializeDrillState(): Promise<DrillState> {
  const user = await getCurrentUser()
  const { items, counts } = await fetchProgress(user.id)
  const item = weightedPick(items)
  const stats = await sessionStats(user.id)
  return { item, counts, unseenCount: counts.unseen, stats, lastMove: null, lastMoveType: null }
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
  const progress = await prisma.userVocabProgress.findFirstOrThrow({ where: { userId, entryId }, include: { entry: true } })
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  if (success) {
    if (currentBucket === 'learning') {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { bucket: 'learned', score: progress.score + 1, lastSeenAt: new Date() },
      })
      lastMove = '↑ Promoted to Learned'
      lastMoveType = 'promote'
      const learningCount = await prisma.userVocabProgress.count({ where: { userId, bucket: 'learning' } })
      if (learningCount < LEARNING_TARGET) {
        const unseen = await prisma.userVocabProgress.findFirst({ where: { userId, bucket: 'unseen' }, include: { entry: true }, orderBy: { entry: { sortOrder: 'asc' } } })
        if (unseen) await prisma.userVocabProgress.update({ where: { id: unseen.id }, data: { bucket: 'learning', score: 0 } })
      }
    } else if (currentBucket === 'learned') {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { bucket: 'mastered', score: progress.score + 1, lastSeenAt: new Date() },
      })
      lastMove = '★ Mastered!'
      lastMoveType = 'master'
    } else {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { score: progress.score + 1, lastSeenAt: new Date() },
      })
    }
  } else if (!immediateReveal || currentBucket !== 'learning') {
    if (currentBucket === 'mastered') {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { bucket: 'learned', score: 0, lastSeenAt: new Date() },
      })
      lastMove = '↓ Demoted to Learned'
      lastMoveType = 'demote'
    } else if (currentBucket === 'learned') {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { bucket: 'learning', score: 0, lastSeenAt: new Date() },
      })
      lastMove = '↓ Demoted to Learning'
      lastMoveType = 'demote'
    } else {
      await prisma.userVocabProgress.update({
        where: { id: progress.id },
        data: { score: 0, lastSeenAt: new Date() },
      })
    }
  } else {
    await prisma.userVocabProgress.update({
      where: { id: progress.id },
      data: { score: 0, lastSeenAt: new Date() },
    })
  }

  const { items, counts } = await fetchProgress(userId)
  const item = weightedPick(items, entryId)
  const stats = await sessionStats(userId)
  if (lastMoveType === 'promote' || lastMoveType === 'master') stats.promoted += 1
  if (lastMoveType === 'demote') stats.demoted += 1
  return { item, counts, unseenCount: counts.unseen, stats, lastMove, lastMoveType }
}

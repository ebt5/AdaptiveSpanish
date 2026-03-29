import { prisma } from './prisma'

export type Bucket = 'unseen' | 'learning' | 'learned' | 'mastered'
export type Phase = 'answering' | 'wrong-first' | 'correct' | 'revealed'
export type MoveType = 'promote' | 'master' | 'demote' | null

const VERB_LEARNING_TARGET = 10

export interface VerbDrillItem {
  id: string           // conjugationId
  infinitive: string
  english: string
  tense: string
  pronoun: string
  form: string
  bucket: Bucket
  score: number
}

export interface VerbDrillState {
  item: VerbDrillItem | null
  counts: { learning: number; learned: number; mastered: number; unseen: number }
  unseenCount: number
  stats: { correct: number; wrong: number; promoted: number; demoted: number }
  lastMove: string | null
  lastMoveType: MoveType
}

function normalize(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function weightedPick(items: VerbDrillItem[], excludeId?: string | null) {
  const learning = items.filter(i => i.bucket === 'learning')
  const learned = items.filter(i => i.bucket === 'learned')
  const mastered = items.filter(i => i.bucket === 'mastered')
  const weighted: VerbDrillItem[] = [
    ...learning, ...learning, ...learning,
    ...learned, ...learned,
  ]
  if (mastered.length > 0 && weighted.length > 0) {
    const masteredWeights = mastered.flatMap((item) => {
      const weight = Math.max(1, 12 - item.score)
      return Array.from({ length: weight }, () => item)
    })
    const masteredDrawCount = Math.max(1, Math.floor(weighted.length / 4))
    for (let i = 0; i < masteredDrawCount; i++) {
      const picked = masteredWeights[Math.floor(Math.random() * masteredWeights.length)]
      if (picked) weighted.push(picked)
    }
  }
  if (weighted.length === 0) return null
  const pool = excludeId ? weighted.filter(i => i.id !== excludeId) : weighted
  const draw = pool.length > 0 ? pool : weighted
  return draw[Math.floor(Math.random() * draw.length)]
}

async function getCurrentUser(username: string) {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw new Error(`User not found: ${username}`)
  return user
}

async function fetchCounts(userId: string) {
  const grouped = await prisma.userVerbProgress.groupBy({
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

async function fetchCandidateItems(userId: string, excludeId?: string | null): Promise<VerbDrillItem[]> {
  const [learning, learned, mastered] = await Promise.all([
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'learning', ...(excludeId ? { NOT: { conjugationId: excludeId } } : {}) },
      include: { conjugation: { include: { verb: true } } },
      take: 24,
    }),
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'learned', ...(excludeId ? { NOT: { conjugationId: excludeId } } : {}) },
      include: { conjugation: { include: { verb: true } } },
      take: 18,
    }),
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'mastered', ...(excludeId ? { NOT: { conjugationId: excludeId } } : {}) },
      include: { conjugation: { include: { verb: true } } },
      orderBy: [{ score: 'asc' }, { lastSeenAt: 'asc' }],
      take: 24,
    }),
  ])
  return [...learning, ...learned, ...mastered].map((row) => ({
    id: row.conjugationId,
    infinitive: row.conjugation.verb.infinitive,
    english: row.conjugation.verb.english,
    tense: row.conjugation.tense,
    pronoun: row.conjugation.pronoun,
    form: row.conjugation.form,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
}

async function bootstrapUser(userId: string) {
  const allConjugations = await prisma.verbConjugation.findMany({
    include: { verb: true },
    orderBy: { verb: { sortOrder: 'asc' } },
  })

  // Create unseen progress for all conjugations (skip existing)
  for (const conj of allConjugations) {
    await prisma.userVerbProgress.upsert({
      where: { userId_conjugationId: { userId, conjugationId: conj.id } },
      update: {},
      create: { userId, conjugationId: conj.id, bucket: 'unseen', score: 0 },
    })
  }

  // Move first VERB_LEARNING_TARGET into learning
  const unseenRows = await prisma.userVerbProgress.findMany({
    where: { userId, bucket: 'unseen' },
    include: { conjugation: { include: { verb: true } } },
    orderBy: { conjugation: { verb: { sortOrder: 'asc' } } },
    take: VERB_LEARNING_TARGET,
  })
  for (const row of unseenRows) {
    await prisma.userVerbProgress.update({ where: { id: row.id }, data: { bucket: 'learning' } })
  }
}

export async function initializeVerbDrillState(username: string): Promise<VerbDrillState> {
  const user = await getCurrentUser(username)

  // Bootstrap if no progress exists yet
  const existingCount = await prisma.userVerbProgress.count({ where: { userId: user.id } })
  if (existingCount === 0) {
    await bootstrapUser(user.id)
  }

  const [counts, items] = await Promise.all([fetchCounts(user.id), fetchCandidateItems(user.id)])
  const item = weightedPick(items)
  return { item, counts, unseenCount: counts.unseen, stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 }, lastMove: null, lastMoveType: null }
}

export async function submitVerbAttempt(params: { username: string; conjugationId: string; answer: string; attemptNumber: number }) {
  const user = await getCurrentUser(params.username)
  const progress = await prisma.userVerbProgress.findFirstOrThrow({
    where: { userId: user.id, conjugationId: params.conjugationId },
    include: { conjugation: { include: { verb: true } } },
  })
  const expected = normalize(progress.conjugation.form)
  const normalized = normalize(params.answer)
  const isBlank = normalized === ''
  const isCorrect = normalized === expected

  if (params.attemptNumber === 1) {
    if (isBlank) {
      await prisma.verbAttempt.create({ data: { userId: user.id, conjugationId: params.conjugationId, correct: false } })
      const state = await nextVerbState(user.id, params.conjugationId, false, true)
      return { phase: 'revealed' as Phase, correct: false, answer: progress.conjugation.form, ...state }
    }
    if (!isCorrect) return { phase: 'wrong-first' as Phase, correct: false, answer: null }
  }

  const success = !isBlank && isCorrect
  await prisma.verbAttempt.create({ data: { userId: user.id, conjugationId: params.conjugationId, correct: success } })
  const state = await nextVerbState(user.id, params.conjugationId, success, false)
  return { phase: success ? ('correct' as Phase) : ('revealed' as Phase), correct: success, answer: progress.conjugation.form, ...state }
}

async function nextVerbState(userId: string, conjugationId: string, success: boolean, immediateReveal: boolean) {
  const progress = await prisma.userVerbProgress.findFirstOrThrow({ where: { userId, conjugationId } })
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  await prisma.$transaction(async (tx) => {
    if (success) {
      if (currentBucket === 'learning') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'learned', score: Math.min(10, progress.score + 1), lastSeenAt: new Date() } })
        lastMove = '↑ Promoted to Learned'; lastMoveType = 'promote'
        const learningCount = await tx.userVerbProgress.count({ where: { userId, bucket: 'learning' } })
        if (learningCount < VERB_LEARNING_TARGET) {
          const unseen = await tx.userVerbProgress.findFirst({
            where: { userId, bucket: 'unseen' },
            orderBy: { conjugation: { verb: { sortOrder: 'asc' } } },
          })
          if (unseen) await tx.userVerbProgress.update({ where: { id: unseen.id }, data: { bucket: 'learning', score: 0 } })
        }
      } else if (currentBucket === 'learned') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'mastered', score: Math.min(10, progress.score + 1), lastSeenAt: new Date(), masteredAt: progress.masteredAt ?? new Date() } })
        lastMove = '★ Mastered!'; lastMoveType = 'master'
      } else {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { score: Math.min(10, progress.score + 1), lastSeenAt: new Date() } })
      }
    } else if (!immediateReveal || currentBucket !== 'learning') {
      if (currentBucket === 'mastered') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'learned', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learned'; lastMoveType = 'demote'
      } else if (currentBucket === 'learned') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { score: Math.max(0, progress.score - 1), lastSeenAt: new Date() } })
      }
    } else {
      await tx.userVerbProgress.update({ where: { id: progress.id }, data: { score: Math.max(0, progress.score - 1), lastSeenAt: new Date() } })
    }
  })

  const [counts, items] = await Promise.all([fetchCounts(userId), fetchCandidateItems(userId, conjugationId)])
  const item = weightedPick(items, conjugationId)
  return {
    item,
    counts,
    unseenCount: counts.unseen,
    stats: { correct: 0, wrong: 0, promoted: lastMoveType === 'promote' || lastMoveType === 'master' ? 1 : 0, demoted: lastMoveType === 'demote' ? 1 : 0 },
    lastMove,
    lastMoveType,
  }
}

export async function fetchVerbHeatmap(username: string) {
  const user = await getCurrentUser(username)

  const progress = await prisma.userVerbProgress.findMany({
    where: { userId: user.id },
    include: { conjugation: { include: { verb: true } } },
  })

  const verbs: string[] = []
  const verbsSeen = new Set<string>()
  const verbEnglish: Record<string, string> = {}

  // Build ordered verb list
  const allVerbs = await prisma.verb.findMany({ orderBy: { sortOrder: 'asc' } })
  for (const v of allVerbs) {
    verbs.push(v.infinitive)
    verbEnglish[v.infinitive] = v.english
    verbsSeen.add(v.infinitive)
  }

  const pronouns = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']
  const tenses = ['present']

  const scores: Record<string, Record<string, Record<string, number>>> = {}
  for (const row of progress) {
    const inf = row.conjugation.verb.infinitive
    const tense = row.conjugation.tense
    const pronoun = row.conjugation.pronoun
    if (!scores[inf]) scores[inf] = {}
    if (!scores[inf][tense]) scores[inf][tense] = {}
    scores[inf][tense][pronoun] = row.score
  }

  return { verbs, pronouns, tenses, scores }
}

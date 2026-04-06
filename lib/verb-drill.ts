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
  exampleEs: string | null
  exampleEn: string | null
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

async function fetchCandidateItems(userId: string, tenses: string[], excludeId?: string | null): Promise<VerbDrillItem[]> {
  const tenseFilter = { conjugation: { tense: { in: tenses } } }
  const excludeFilter = excludeId ? { NOT: { conjugationId: excludeId } } : {}
  const [learning, learned, mastered] = await Promise.all([
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'learning', ...tenseFilter, ...excludeFilter },
      include: { conjugation: { include: { verb: true } } },
      take: 24,
    }),
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'learned', ...tenseFilter, ...excludeFilter },
      include: { conjugation: { include: { verb: true } } },
      take: 18,
    }),
    prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'mastered', ...tenseFilter, ...excludeFilter },
      include: { conjugation: { include: { verb: true } } },
      orderBy: [{ score: 'asc' }, { lastSeenAt: 'asc' }],
      take: 24,
    }),
  ])
  let allRows = [...learning, ...learned, ...mastered]
  // If nothing drillable, pull from unseen as fallback and promote them
  if (allRows.length === 0) {
    const unseenRows = await prisma.userVerbProgress.findMany({
      where: { userId, bucket: 'unseen', ...tenseFilter, ...excludeFilter },
      include: { conjugation: { include: { verb: true } } },
      take: VERB_LEARNING_TARGET,
    })
    for (const row of unseenRows) {
      await prisma.userVerbProgress.update({ where: { id: row.id }, data: { bucket: 'learning' } })
      row.bucket = 'learning'
    }
    allRows = unseenRows
  }
  return allRows.map((row) => ({
    id: row.conjugationId,
    infinitive: row.conjugation.verb.infinitive,
    english: row.conjugation.verb.english,
    tense: row.conjugation.tense,
    pronoun: row.conjugation.pronoun,
    form: row.conjugation.form,
    exampleEs: row.conjugation.exampleEs ?? null,
    exampleEn: row.conjugation.exampleEn ?? null,
    bucket: row.bucket as Bucket,
    score: row.score,
  }))
}

async function bootstrapUser(userId: string, tenses: string[]) {
  const allConjugations = await prisma.verbConjugation.findMany({
    where: { tense: { in: tenses } },
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

export async function initializeVerbDrillState(username: string, tenses: string[] = ['present']): Promise<VerbDrillState> {
  const user = await getCurrentUser(username)

  // Ensure progress rows exist for all conjugations in selected tenses
  // (handles both first-time users and users adding new tenses)
  const conjugationsForTenses = await prisma.verbConjugation.findMany({
    where: { tense: { in: tenses } },
    select: { id: true },
  })
  const existingProgress = await prisma.userVerbProgress.findMany({
    where: { userId: user.id, conjugationId: { in: conjugationsForTenses.map(c => c.id) } },
    select: { conjugationId: true },
  })
  const existingIds = new Set(existingProgress.map(p => p.conjugationId))
  const missing = conjugationsForTenses.filter(c => !existingIds.has(c.id))

  if (missing.length > 0) {
    // Create unseen rows for new conjugations
    await prisma.userVerbProgress.createMany({
      data: missing.map(c => ({ userId: user.id, conjugationId: c.id, bucket: 'unseen', score: 0 })),
      skipDuplicates: true,
    })
  }

  // Always ensure enough items in learning bucket (not just when creating new rows)
  const learningCount = await prisma.userVerbProgress.count({
    where: { userId: user.id, bucket: 'learning', conjugation: { tense: { in: tenses } } },
  })
  if (learningCount < VERB_LEARNING_TARGET) {
    const needed = VERB_LEARNING_TARGET - learningCount
    const unseenRows = await prisma.userVerbProgress.findMany({
      where: { userId: user.id, bucket: 'unseen', conjugation: { tense: { in: tenses } } },
      include: { conjugation: { include: { verb: true } } },
      orderBy: { conjugation: { verb: { sortOrder: 'asc' } } },
      take: needed,
    })
    for (const row of unseenRows) {
      await prisma.userVerbProgress.update({ where: { id: row.id }, data: { bucket: 'learning' } })
    }
  }

  const [counts, items] = await Promise.all([fetchCounts(user.id), fetchCandidateItems(user.id, tenses)])
  const item = weightedPick(items)
  return { item, counts, unseenCount: counts.unseen, stats: { correct: 0, wrong: 0, promoted: 0, demoted: 0 }, lastMove: null, lastMoveType: null }
}

export async function submitVerbAttempt(params: { username: string; conjugationId: string; answer: string; attemptNumber: number }) {
  const user = await getCurrentUser(params.username)
  const [progress, conjugation] = await Promise.all([
    prisma.userVerbProgress.findFirstOrThrow({ where: { userId: user.id, conjugationId: params.conjugationId } }),
    prisma.verbConjugation.findUniqueOrThrow({ where: { id: params.conjugationId } }),
  ])
  const expected = normalize(conjugation.form)
  const normalized = normalize(params.answer)
  const isBlank = normalized === ''
  const isCorrect = normalized === expected

  if (params.attemptNumber === 1) {
    if (isBlank) {
      await prisma.verbAttempt.create({ data: { userId: user.id, conjugationId: params.conjugationId, correct: false } })
      const state = await nextVerbState(user.id, params.conjugationId, false, true)
      return { phase: 'revealed' as Phase, correct: false, answer: conjugation.form, ...state }
    }
    if (!isCorrect) return { phase: 'wrong-first' as Phase, correct: false, answer: null }
  }

  const success = !isBlank && isCorrect
  await prisma.verbAttempt.create({ data: { userId: user.id, conjugationId: params.conjugationId, correct: success } })
  const state = await nextVerbState(user.id, params.conjugationId, success, false)
  return { phase: success ? ('correct' as Phase) : ('revealed' as Phase), correct: success, answer: conjugation.form, ...state }
}

async function nextVerbState(userId: string, conjugationId: string, success: boolean, immediateReveal: boolean) {
  const [progress, conjugation] = await Promise.all([
    prisma.userVerbProgress.findFirstOrThrow({ where: { userId, conjugationId } }),
    prisma.verbConjugation.findUniqueOrThrow({ where: { id: conjugationId } }),
  ])
  const currentBucket = progress.bucket as Bucket
  let lastMove: string | null = null
  let lastMoveType: MoveType = null

  const pronoun = conjugation.pronoun
  const tense = conjugation.tense

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
      // Update pronoun+tense heatmap score
      const existing = await tx.userPronounTenseScore.findUnique({ where: { userId_pronoun_tense: { userId, pronoun, tense } } })
      await tx.userPronounTenseScore.upsert({
        where: { userId_pronoun_tense: { userId, pronoun, tense } },
        update: { score: Math.min(10, (existing?.score ?? 0) + 1) },
        create: { userId, pronoun, tense, score: 1 },
      })
    } else if (!immediateReveal || currentBucket !== 'learning') {
      if (currentBucket === 'mastered') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'learned', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learned'; lastMoveType = 'demote'
      } else if (currentBucket === 'learned') {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { bucket: 'learning', score: 0, lastSeenAt: new Date() } })
        lastMove = '↓ Demoted to Learning'; lastMoveType = 'demote'
      } else {
        await tx.userVerbProgress.update({ where: { id: progress.id }, data: { score: Math.max(0, progress.score - 2), lastSeenAt: new Date() } })
      }
      // Update pronoun+tense heatmap score (penalize on wrong)
      const existing = await tx.userPronounTenseScore.findUnique({ where: { userId_pronoun_tense: { userId, pronoun, tense } } })
      await tx.userPronounTenseScore.upsert({
        where: { userId_pronoun_tense: { userId, pronoun, tense } },
        update: { score: Math.max(0, (existing?.score ?? 0) - 2) },
        create: { userId, pronoun, tense, score: 0 },
      })
    } else {
      await tx.userVerbProgress.update({ where: { id: progress.id }, data: { score: Math.max(0, progress.score - 2), lastSeenAt: new Date() } })
    }
  })

  const [counts, items] = await Promise.all([fetchCounts(userId), fetchCandidateItems(userId, [conjugation.tense], conjugationId)])
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

  const rows = await prisma.userPronounTenseScore.findMany({
    where: { userId: user.id },
  })

  const pronouns = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']
  const tenses = ['present','preterite','imperfect','future','conditional','present_subjunctive','imperfect_subjunctive','present_perfect','imperative','past_perfect','future_perfect','conditional_perfect','present_perfect_subjunctive']

  // Build scores: { pronoun: { tense: score } }
  const scores: Record<string, Record<string, number>> = {}
  for (const row of rows) {
    if (!scores[row.pronoun]) scores[row.pronoun] = {}
    scores[row.pronoun][row.tense] = row.score
  }

  return { pronouns, tenses, scores }
}

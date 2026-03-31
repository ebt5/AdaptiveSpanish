import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORY_ORDER = [
  'survival',
  'ser-estar',
  'tener-expressions',
  'hacer-expressions',
  'reflexive',
  'gustar-type',
  'verb-infinitive',
  'progressive',
  'object-pronouns',
  'por-para',
  'negative-constructions',
  'hay-que-impersonal',
  'unintentional',
  'subjunctive',
  'conditional',
  'idioms-discourse',
]

const CATEGORY_LABELS: Record<string, string> = {
  'survival': 'Survival',
  'ser-estar': 'Ser vs. Estar',
  'tener-expressions': 'Tener Expressions',
  'hacer-expressions': 'Hacer Expressions',
  'reflexive': 'Reflexive Verbs',
  'gustar-type': 'Gustar-type',
  'verb-infinitive': 'Verb + Infinitive',
  'progressive': 'Progressive',
  'object-pronouns': 'Object Pronouns',
  'por-para': 'Por vs. Para',
  'negative-constructions': 'Negatives',
  'hay-que-impersonal': 'Hay que / Impersonal',
  'unintentional': 'Unintentional se',
  'subjunctive': 'Subjunctive',
  'conditional': 'Conditional / Si',
  'idioms-discourse': 'Idioms & Discourse',
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  // Get all phrase progress for user, joined with phrase grammarTag
  const progress = await prisma.userPhraseProgress.findMany({
    where: { userId: user.id, bucket: { not: 'unseen' } },
    include: { phrase: { select: { grammarTag: true } } },
  })

  // Build per-category stats
  const stats: Record<string, { total: number; scoreSum: number; mastered: number; learned: number; learning: number }> = {}

  for (const tag of CATEGORY_ORDER) {
    stats[tag] = { total: 0, scoreSum: 0, mastered: 0, learned: 0, learning: 0 }
  }

  for (const row of progress) {
    const tag = row.phrase.grammarTag
    if (!stats[tag]) stats[tag] = { total: 0, scoreSum: 0, mastered: 0, learned: 0, learning: 0 }
    stats[tag].total++
    stats[tag].scoreSum += row.score
    if (row.bucket === 'mastered') stats[tag].mastered++
    else if (row.bucket === 'learned') stats[tag].learned++
    else if (row.bucket === 'learning') stats[tag].learning++
  }

  // Get total phrase count per category
  const totals = await prisma.phrase.groupBy({ by: ['grammarTag'], _count: true })
  const totalMap: Record<string, number> = {}
  for (const t of totals) totalMap[t.grammarTag] = t._count

  const categories = CATEGORY_ORDER.map(tag => ({
    tag,
    label: CATEGORY_LABELS[tag] ?? tag,
    total: totalMap[tag] ?? 0,
    seen: stats[tag]?.total ?? 0,
    avgScore: stats[tag]?.total > 0 ? Math.round(stats[tag].scoreSum / stats[tag].total) : 0,
    mastered: stats[tag]?.mastered ?? 0,
    learned: stats[tag]?.learned ?? 0,
    learning: stats[tag]?.learning ?? 0,
  }))

  return NextResponse.json({ categories })
}

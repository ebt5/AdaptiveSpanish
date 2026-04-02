import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const CATEGORY_ORDER = [
  'survival','ser-estar','tener-expressions','hacer-expressions','reflexive',
  'gustar-type','verb-infinitive','progressive','object-pronouns','por-para',
  'negative-constructions','hay-que-impersonal','unintentional','subjunctive',
  'conditional','idioms-discourse',
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  // Verify caller is a teacher
  const caller = await prisma.user.findFirst({ where: { username } })
  if (!caller || caller.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const student = await prisma.user.findFirst({ where: { id: userId } })
  if (!student) return NextResponse.json({ error: 'student not found' }, { status: 404 })

  const [vocabProgress, phraseProgress, verbScores, phraseTotals] = await Promise.all([
    prisma.userVocabProgress.groupBy({ by: ['bucket'], where: { userId }, _count: true }),
    prisma.userPhraseProgress.groupBy({ by: ['bucket'], where: { userId }, _count: true }),
    prisma.userPronounTenseScore.findMany({ where: { userId } }),
    prisma.phrase.groupBy({ by: ['grammarTag'], _count: true }),
  ])

  // Vocab counts
  const totalVocab = await prisma.dictionaryEntry.count()
  const vocabMap: Record<string, number> = { learning: 0, learned: 0, mastered: 0 }
  for (const r of vocabProgress) vocabMap[r.bucket] = r._count
  const vocabSeen = vocabMap.learning + vocabMap.learned + vocabMap.mastered
  const vocabCounts = { ...vocabMap, unseen: totalVocab - vocabSeen }

  // Phrase counts
  const totalPhrases = await prisma.phrase.count()
  const phraseMap: Record<string, number> = { learning: 0, learned: 0, mastered: 0 }
  for (const r of phraseProgress) phraseMap[r.bucket] = r._count
  const phraseSeen = phraseMap.learning + phraseMap.learned + phraseMap.mastered
  const phraseCounts = { ...phraseMap, unseen: totalPhrases - phraseSeen }

  // Verb heatmap
  const pronouns = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']
  const tenses = ['present','preterite','imperfect','future','conditional','present_subjunctive','imperfect_subjunctive','present_perfect','imperative','past_perfect','future_perfect','conditional_perfect','present_perfect_subjunctive']
  const verbScoresMap: Record<string, Record<string, number>> = {}
  for (const row of verbScores) {
    if (!verbScoresMap[row.pronoun]) verbScoresMap[row.pronoun] = {}
    verbScoresMap[row.pronoun][row.tense] = row.score
  }
  const verbHeatmap = { pronouns, tenses, scores: verbScoresMap }

  // Grammar heatmap
  const phraseProgressRows = await prisma.userPhraseProgress.findMany({
    where: { userId, bucket: { not: 'unseen' } },
    include: { phrase: { select: { grammarTag: true } } },
  })
  const grammarStats: Record<string, { total: number; scoreSum: number; mastered: number; learned: number; learning: number }> = {}
  for (const tag of CATEGORY_ORDER) grammarStats[tag] = { total: 0, scoreSum: 0, mastered: 0, learned: 0, learning: 0 }
  for (const row of phraseProgressRows) {
    const tag = row.phrase.grammarTag
    if (!grammarStats[tag]) grammarStats[tag] = { total: 0, scoreSum: 0, mastered: 0, learned: 0, learning: 0 }
    grammarStats[tag].total++
    grammarStats[tag].scoreSum += row.score
    if (row.bucket === 'mastered') grammarStats[tag].mastered++
    else if (row.bucket === 'learned') grammarStats[tag].learned++
    else if (row.bucket === 'learning') grammarStats[tag].learning++
  }
  const totalMap: Record<string, number> = {}
  for (const t of phraseTotals) totalMap[t.grammarTag] = t._count
  const grammarHeatmap = {
    categories: CATEGORY_ORDER.map(tag => ({
      tag,
      label: CATEGORY_LABELS[tag] ?? tag,
      total: totalMap[tag] ?? 0,
      seen: grammarStats[tag]?.total ?? 0,
      avgScore: grammarStats[tag]?.total > 0 ? Math.round(grammarStats[tag].scoreSum / grammarStats[tag].total) : 0,
      mastered: grammarStats[tag]?.mastered ?? 0,
      learned: grammarStats[tag]?.learned ?? 0,
      learning: grammarStats[tag]?.learning ?? 0,
    })),
  }

  return NextResponse.json({
    username: student.username,
    vocabCounts,
    phraseCounts,
    verbHeatmap,
    grammarHeatmap,
  })
}

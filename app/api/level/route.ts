import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateLevel } from '@/lib/levels'

const ALL_PRONOUNS = ['yo', 'tú', 'él', 'nosotros', 'vosotros', 'ellos']
const ALL_TENSES = ['present','preterite','imperfect','future','conditional','present_subjunctive','imperfect_subjunctive','present_perfect','imperative','past_perfect','future_perfect','conditional_perfect','present_perfect_subjunctive']

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const [vocabMastered, phraseMastered, verbScoreRows] = await Promise.all([
    prisma.userVocabProgress.count({ where: { userId: user.id, bucket: 'mastered' } }),
    prisma.userPhraseProgress.count({ where: { userId: user.id, bucket: 'mastered' } }),
    prisma.userPronounTenseScore.findMany({ where: { userId: user.id } }),
  ])

  // Build verb scores map: { pronoun: { tense: score } }
  const verbScores: Record<string, Record<string, number>> = {}
  for (const row of verbScoreRows) {
    if (!verbScores[row.pronoun]) verbScores[row.pronoun] = {}
    verbScores[row.pronoun][row.tense] = row.score
  }

  const state = calculateLevel(vocabMastered, phraseMastered, verbScores, ALL_TENSES, ALL_PRONOUNS)
  return NextResponse.json(state)
}

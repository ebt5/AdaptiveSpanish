import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const username = searchParams.get('username')
  const bucket = searchParams.get('bucket')
  const exclude = searchParams.get('exclude') ?? undefined
  const limit = Math.min(Number(searchParams.get('limit') ?? 30), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  if (!username || !bucket) return NextResponse.json({ error: 'username and bucket required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const where = {
    userId: user.id,
    bucket,
    ...(exclude ? { NOT: { entryId: exclude } } : {}),
  }

  const orderBy = bucket === 'mastered'
    ? [{ score: 'asc' as const }]
    : [{ lastSeenAt: 'asc' as const }]

  const [rows, total] = await Promise.all([
    prisma.userVocabProgress.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: { entry: { select: { spanish: true, englishPrimary: true } } },
    }),
    prisma.userVocabProgress.count({ where }),
  ])

  const items = rows.map(r => ({
    spanish: r.entry.spanish,
    english: r.entry.englishPrimary ?? r.entry.spanish,
    score: r.score,
  }))

  return NextResponse.json({ items, total })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) {
    return NextResponse.json({ error: 'username required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const rows = await prisma.userVocabProgress.findMany({
    where: { userId: user.id, bucket: 'mastered', masteredAt: { not: null } },
    select: { masteredAt: true },
  })

  const counts: Record<string, number> = {}
  for (const row of rows) {
    if (!row.masteredAt) continue
    const date = row.masteredAt.toISOString().slice(0, 10)
    counts[date] = (counts[date] ?? 0) + 1
  }

  const data = Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json(data)
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const rows = await prisma.phraseMasteredNetLog.findMany({
    where: { userId: user.id },
    select: { delta: true, createdAt: true },
  })

  const netByDate: Record<string, number> = {}
  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10)
    netByDate[date] = (netByDate[date] ?? 0) + row.delta
  }

  const data = Object.entries(netByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json(data)
}

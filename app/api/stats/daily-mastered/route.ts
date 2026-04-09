import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  const rows = await prisma.masteredNetLog.findMany({
    where: { userId: user.id },
    select: { delta: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  // Build daily net map
  const netByDate: Record<string, number> = {}
  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10)
    netByDate[date] = (netByDate[date] ?? 0) + row.delta
  }

  // Fill in all dates from first mastered to today (including zeros)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateKeys = Object.keys(netByDate).sort()
  const firstDate = dateKeys.length > 0 ? new Date(dateKeys[0]) : today

  const allDays: { date: string; count: number }[] = []
  const cursor = new Date(firstDate)
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10)
    allDays.push({ date: key, count: netByDate[key] ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  // Cumulative data
  let running = 0
  const cumulative = allDays.map(d => {
    running += d.count
    return { date: d.date, count: running }
  })

  // Stats
  const now = Date.now()
  const ms7  = 7  * 24 * 60 * 60 * 1000
  const ms30 = 30 * 24 * 60 * 60 * 1000

  const mastered7  = allDays.filter(d => new Date(d.date).getTime() >= now - ms7 ).reduce((s, d) => s + d.count, 0)
  const mastered30 = allDays.filter(d => new Date(d.date).getTime() >= now - ms30).reduce((s, d) => s + d.count, 0)
  const avgPerDay30 = allDays.length > 0 ? +(mastered30 / 30).toFixed(1) : 0

  return NextResponse.json({ daily: allDays, cumulative, mastered7, mastered30, avgPerDay30 })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const username = String(body.username || '').trim().toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.upsert({
    where: { username },
    update: {},
    create: { username },
  })

  const existing = await prisma.userVocabProgress.count({ where: { userId: user.id } })
  if (existing === 0) {
    const entries = await prisma.dictionaryEntry.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true } })
    await prisma.userVocabProgress.createMany({
      data: entries.map((entry, index) => ({
        userId: user.id,
        entryId: entry.id,
        bucket: index < 20 ? 'learning' : 'unseen',
        score: 0,
      })),
    })
  }

  return NextResponse.json({ ok: true, username: user.username })
}

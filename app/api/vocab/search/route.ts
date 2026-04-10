import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!username || q.length < 2) return NextResponse.json([])

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json([])

  // Search entries by Spanish or English
  const entries = await prisma.dictionaryEntry.findMany({
    where: {
      OR: [
        { spanish: { contains: q, mode: 'insensitive' } },
        { englishPrimary: { contains: q, mode: 'insensitive' } },
      ]
    },
    orderBy: { sortOrder: 'asc' },
    take: 20,
    select: { id: true, spanish: true, spanishDisplay: true, englishPrimary: true, sortOrder: true }
  })

  if (entries.length === 0) return NextResponse.json([])

  // Get user progress for these entries
  const progress = await prisma.userVocabProgress.findMany({
    where: { userId: user.id, entryId: { in: entries.map(e => e.id) } },
    select: { entryId: true, bucket: true }
  })
  const bucketMap = Object.fromEntries(progress.map(p => [p.entryId, p.bucket]))

  return NextResponse.json(entries.map(e => ({
    id: e.id,
    spanish: e.spanishDisplay ?? e.spanish,
    english: e.englishPrimary ?? e.spanish,
    bucket: bucketMap[e.id] ?? 'unseen',
  })))
}

export async function POST(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  const { entryId } = await request.json()
  if (!username || !entryId) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })

  // Upsert: create or update to learning bucket
  await prisma.userVocabProgress.upsert({
    where: { userId_entryId: { userId: user.id, entryId } },
    update: { bucket: 'learning', score: 0 },
    create: { userId: user.id, entryId, bucket: 'learning', score: 0 },
  })

  return NextResponse.json({ ok: true })
}

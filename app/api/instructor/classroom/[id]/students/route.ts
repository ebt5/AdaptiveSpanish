import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function verifyTeacher(username: string, classroomId: string) {
  const user = await prisma.user.findFirst({ where: { username } })
  if (!user || user.role !== 'teacher') return null
  const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, teacherId: user.id } })
  if (!classroom) return null
  return user
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const teacher = await verifyTeacher(username, id)
  if (!teacher) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const enrollments = await prisma.classroomStudent.findMany({
    where: { classroomId: id },
    include: { user: { select: { id: true, username: true } } },
  })

  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const results = await Promise.all(enrollments.map(async (enr) => {
    const userId = enr.user.id
    const uname = enr.user.username ?? enr.user.id

    const [
      drillAttempts30,
      phraseAttempts30,
      verbAttempts30,
      drillAttempts7,
      phraseAttempts7,
      vocabMastered,
      phrasesMastered,
      masteredNet30,
      masteredNetPrev30,
    ] = await Promise.all([
      prisma.drillAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true, createdAt: true } }),
      prisma.phraseAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true, createdAt: true } }),
      prisma.verbAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true } }),
      prisma.drillAttempt.findMany({ where: { userId, createdAt: { gte: since7 } }, select: { correct: true } }),
      prisma.phraseAttempt.findMany({ where: { userId, createdAt: { gte: since7 } }, select: { correct: true } }),
      prisma.userVocabProgress.count({ where: { userId, bucket: 'mastered' } }),
      prisma.userPhraseProgress.count({ where: { userId, bucket: 'mastered' } }),
      // Net vocab mastered in last 30 days
      prisma.masteredNetLog.aggregate({ where: { userId, createdAt: { gte: since30 } }, _sum: { delta: true } }),
      // Net vocab mastered in 30-60 days ago (for trend)
      prisma.masteredNetLog.aggregate({ where: { userId, createdAt: { gte: since60, lt: since30 } }, _sum: { delta: true } }),
    ])

    // Active days: distinct calendar days with any drill or phrase attempt
    const daySet = new Set<string>()
    for (const a of drillAttempts30) daySet.add(a.createdAt.toISOString().slice(0, 10))
    for (const a of phraseAttempts30) daySet.add(a.createdAt.toISOString().slice(0, 10))
    const activeDays30 = daySet.size

    function pct(attempts: { correct: boolean }[]) {
      if (attempts.length === 0) return null
      const correct = attempts.filter(a => a.correct).length
      return Math.round((correct / attempts.length) * 100)
    }

    // Last active: most recent attempt across all types
    const allDates = [
      ...drillAttempts30.map(a => a.createdAt),
      ...phraseAttempts30.map(a => a.createdAt),
    ]
    const lastActive = allDates.length > 0
      ? allDates.reduce((a, b) => a > b ? a : b).toISOString().slice(0, 10)
      : null

    const netVocab30 = masteredNet30._sum.delta ?? 0
    const netVocabPrev30 = masteredNetPrev30._sum.delta ?? 0
    const vocabTrend = netVocab30 > netVocabPrev30 ? 'up' : netVocab30 < netVocabPrev30 ? 'down' : 'flat'

    const totalDrills7 = drillAttempts7.length + phraseAttempts7.length
    const totalDrills30 = drillAttempts30.length + phraseAttempts30.length
    const allCorrect7 = [...drillAttempts7, ...phraseAttempts7].filter(a => a.correct).length
    const overallPct7 = totalDrills7 > 0 ? Math.round((allCorrect7 / totalDrills7) * 100) : null
    const allCorrect30 = [...drillAttempts30, ...phraseAttempts30].filter(a => a.correct).length
    const overallPct30 = totalDrills30 > 0 ? Math.round((allCorrect30 / totalDrills30) * 100) : null

    return {
      userId,
      username: uname,
      activeDays30,
      vocabMastered,
      phrasesMastered,
      vocabCorrectPct: pct(drillAttempts30),
      phrasesCorrectPct: pct(phraseAttempts30),
      verbsCorrectPct: pct(verbAttempts30),
      totalDrills7,
      overallPct7,
      totalDrills30,
      overallPct30,
      netVocab30,
      vocabTrend,
      lastActive,
    }
  }))

  return NextResponse.json(results)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const teacher = await verifyTeacher(username, id)
  if (!teacher) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await request.json()
  const studentUsername = String(body.studentUsername || '').trim().toLowerCase()
  if (!studentUsername) return NextResponse.json({ error: 'studentUsername required' }, { status: 400 })

  const student = await prisma.user.findFirst({ where: { username: studentUsername } })
  if (!student) return NextResponse.json({ error: 'student not found' }, { status: 404 })

  await prisma.classroomStudent.upsert({
    where: { classroomId_userId: { classroomId: id, userId: student.id } },
    update: {},
    create: { classroomId: id, userId: student.id },
  })

  return NextResponse.json({ ok: true, student: { userId: student.id, username: student.username } })
}

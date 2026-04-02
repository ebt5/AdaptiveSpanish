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

  const results = await Promise.all(enrollments.map(async (enr) => {
    const userId = enr.user.id
    const uname = enr.user.username ?? enr.user.id

    const [
      drillAttempts30,
      phraseAttempts30,
      verbAttempts30,
      vocabMastered,
      phrasesMastered,
    ] = await Promise.all([
      prisma.drillAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true, createdAt: true } }),
      prisma.phraseAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true, createdAt: true } }),
      prisma.verbAttempt.findMany({ where: { userId, createdAt: { gte: since30 } }, select: { correct: true } }),
      prisma.userVocabProgress.count({ where: { userId, bucket: 'mastered' } }),
      prisma.userPhraseProgress.count({ where: { userId, bucket: 'mastered' } }),
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

    return {
      userId,
      username: uname,
      activeDays30,
      vocabMastered,
      phrasesMastered,
      vocabCorrectPct: pct(drillAttempts30),
      phrasesCorrectPct: pct(phraseAttempts30),
      verbsCorrectPct: pct(verbAttempts30),
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

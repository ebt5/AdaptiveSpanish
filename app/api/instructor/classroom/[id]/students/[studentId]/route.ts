import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await params
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user || user.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const classroom = await prisma.classroom.findFirst({ where: { id, teacherId: user.id } })
  if (!classroom) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  await prisma.classroomStudent.deleteMany({
    where: { classroomId: id, userId: studentId },
  })

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 })
  if (user.role !== 'teacher') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId: user.id },
    include: { _count: { select: { students: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(classrooms.map(c => ({
    id: c.id,
    name: c.name,
    studentCount: c._count.students,
  })))
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, mode, id, fields } = body

  if (!username || !mode || !id || !fields) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
  }

  // Verify admin
  const user = await prisma.user.findFirst({ where: { username } })
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
  }

  try {
    if (mode === 'vocab') {
      await prisma.dictionaryEntry.update({
        where: { id },
        data: {
          englishPrimary: fields.englishPrimary,
          spanish: fields.spanish,
          spanishDisplay: fields.spanishDisplay || null,
          emoji: fields.emoji || null,
        },
      })
    } else if (mode === 'phrases') {
      await prisma.phrase.update({
        where: { id },
        data: {
          english: fields.english,
          spanish: fields.spanish,
          grammarNote: fields.grammarNote || null,
          grammarTag: fields.grammarTag,
          difficultyLevel: Number(fields.difficultyLevel) || 1,
        },
      })
    } else if (mode === 'verbs') {
      await prisma.verbConjugation.update({
        where: { id },
        data: {
          form: fields.form,
          exampleEs: fields.exampleEs || null,
          exampleEn: fields.exampleEn || null,
        },
      })
    } else {
      return NextResponse.json({ error: 'unknown mode' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

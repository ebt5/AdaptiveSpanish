import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'

const API_KEY = process.env.GOOGLE_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`

const STYLE = 'Claymation stop-motion illustration style. Single subject centered on clean white background. Charming handcrafted clay aesthetic, visible clay textures, warm soft studio lighting. Square 1:1 composition. IMPORTANT: Do NOT include any text, letters, words, labels, signs, or written characters anywhere in the image.'

export async function POST(request: NextRequest) {
  const { username, entryId } = await request.json()
  if (!username || !entryId) return NextResponse.json({ error: 'missing params' }, { status: 400 })

  const user = await prisma.user.findFirst({ where: { username } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'unauthorized' }, { status: 403 })

  const entry = await prisma.dictionaryEntry.findUnique({ where: { id: entryId } })
  if (!entry) return NextResponse.json({ error: 'entry not found' }, { status: 404 })

  const prompt = `Claymation illustration representing the Spanish word "${entry.spanish}" meaning "${entry.englishPrimary ?? entry.spanish}". ${STYLE}`

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    }),
  })

  const data = await res.json()

  for (const cand of data.candidates ?? []) {
    for (const part of cand.content?.parts ?? []) {
      if (part.inlineData) {
        const imgBuffer = Buffer.from(part.inlineData.data, 'base64')
        const filename = `vocab_${entry.spanish.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')}.jpg`
        const filePath = path.join(process.cwd(), 'public', 'vocab', filename)

        await writeFile(filePath, imgBuffer)

        const imageUrl = `/vocab/${filename}`
        await prisma.dictionaryEntry.update({ where: { id: entryId }, data: { imageUrl } })

        return NextResponse.json({ ok: true, imageUrl })
      }
    }
  }

  return NextResponse.json({ error: 'generation failed', detail: JSON.stringify(data).slice(0, 200) }, { status: 500 })
}

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File | null
    const language = (formData.get('language') as string) ?? 'es'

    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language,
      response_format: 'json',
    })

    return NextResponse.json({ text: transcription.text.trim() })
  } catch (e) {
    console.error('Transcription error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

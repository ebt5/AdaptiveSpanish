import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as File | null
    const language = (formData.get('language') as string) ?? 'es'
    const hint = (formData.get('hint') as string) ?? ''  // expected word/phrase hint

    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    // Prompt primes Whisper with Spanish context + the expected answer to dramatically improve accuracy
    const prompt = hint
      ? `Spanish language drill. The answer is a Spanish word or phrase. ${hint}`
      : 'hablar, comer, vivir, ser, estar, tener, ir, hacer, llamar, poder, querer, saber, ver, dar, venir'

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language,
      response_format: 'json',
      temperature: 0,
      prompt,
    })

    return NextResponse.json({ text: transcription.text.trim() })
  } catch (e) {
    console.error('Transcription error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

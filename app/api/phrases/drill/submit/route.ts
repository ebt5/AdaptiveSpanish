import { NextRequest, NextResponse } from 'next/server'
import { submitPhraseAttempt } from '@/lib/phrase-drill'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await submitPhraseAttempt({
    username: body.username,
    phraseId: body.phraseId,
    answer: body.answer ?? '',
    attemptNumber: Number(body.attemptNumber ?? 1),
  })
  return NextResponse.json(result)
}

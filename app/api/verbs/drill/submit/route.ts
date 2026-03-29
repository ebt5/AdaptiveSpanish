import { NextRequest, NextResponse } from 'next/server'
import { submitVerbAttempt } from '@/lib/verb-drill'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await submitVerbAttempt({
    username: body.username,
    conjugationId: body.conjugationId,
    answer: body.answer ?? '',
    attemptNumber: Number(body.attemptNumber ?? 1),
  })
  return NextResponse.json(result)
}

import { NextRequest, NextResponse } from 'next/server'
import { submitAttempt } from '@/lib/drill'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const result = await submitAttempt({
    username: body.username,
    entryId: body.entryId,
    answer: body.answer ?? '',
    attemptNumber: Number(body.attemptNumber ?? 1),
  })
  return NextResponse.json(result)
}

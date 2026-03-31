import { NextRequest, NextResponse } from 'next/server'
import { initializePhraseDrillState } from '@/lib/phrase-drill'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const tagsParam = request.nextUrl.searchParams.get('tags')
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : null
  const state = await initializePhraseDrillState(username, tags ?? undefined)
  return NextResponse.json(state)
}

import { NextRequest, NextResponse } from 'next/server'
import { initializeDrillState } from '@/lib/drill'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const masteredOnly = request.nextUrl.searchParams.get('masteredOnly') === 'true'
  const tagsParam = request.nextUrl.searchParams.get('tags')
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []
  const state = await initializeDrillState(username, masteredOnly, tags)
  return NextResponse.json(state)
}

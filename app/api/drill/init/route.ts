import { NextRequest, NextResponse } from 'next/server'
import { initializeDrillState } from '@/lib/drill'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const state = await initializeDrillState(username)
  return NextResponse.json(state)
}

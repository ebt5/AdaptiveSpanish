import { NextRequest, NextResponse } from 'next/server'
import { fetchVerbHeatmap } from '@/lib/verb-drill'

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const data = await fetchVerbHeatmap(username)
  return NextResponse.json(data)
}

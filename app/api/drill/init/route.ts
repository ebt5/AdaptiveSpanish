import { NextResponse } from 'next/server'
import { initializeDrillState } from '@/lib/drill'

export async function GET() {
  const state = await initializeDrillState()
  return NextResponse.json(state)
}

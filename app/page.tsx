'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUsername } from '@/lib/identity'
import DrillApp from '@/components/DrillApp'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [hasUser, setHasUser] = useState(false)

  useEffect(() => {
    const username = getStoredUsername()
    if (!username) {
      router.replace('/landing')
    } else {
      setHasUser(true)
      setReady(true)
    }
  }, [])

  if (!ready) return null

  return <DrillApp />
}

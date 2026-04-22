'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ApproveButton({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    await fetch(`/api/institutions/${institutionId}/approve`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      onClick={approve}
      disabled={loading}
      size="sm"
      className="text-white shrink-0"
      style={{ background: '#15803D' }}
    >
      {loading ? '...' : 'אשרי'}
    </Button>
  )
}

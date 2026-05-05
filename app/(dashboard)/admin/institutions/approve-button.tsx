'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ApproveButton({ institutionId }: { institutionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null)

  async function approve() {
    setLoading('approve')
    await fetch(`/api/institutions/${institutionId}/approve`, { method: 'POST' })
    setLoading(null)
    setDone('approved')
    router.refresh()
  }

  async function reject() {
    if (!confirm('לדחות את הבקשה?')) return
    setLoading('reject')
    await fetch(`/api/institutions/${institutionId}/reject`, { method: 'POST' })
    setLoading(null)
    setDone('rejected')
    router.refresh()
  }

  if (done === 'approved') {
    return <span className="text-[12px] font-bold px-3 py-1.5 rounded-[8px]" style={{ color: '#15803D', background: '#F0FDF4' }}>✓ אושר — הודעה נשלחה</span>
  }
  if (done === 'rejected') {
    return <span className="text-[12px] font-bold px-3 py-1.5 rounded-[8px]" style={{ color: '#DC2626', background: '#FEF2F2' }}>✗ נדחה</span>
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        onClick={approve}
        disabled={!!loading}
        size="sm"
        className="text-white"
        style={{ background: '#15803D' }}
      >
        {loading === 'approve' ? '...' : 'אשרי'}
      </Button>
      <Button
        onClick={reject}
        disabled={!!loading}
        size="sm"
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        {loading === 'reject' ? '...' : 'דחי'}
      </Button>
    </div>
  )
}

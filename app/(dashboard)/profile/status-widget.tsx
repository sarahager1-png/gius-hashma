'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle, Loader2 } from 'lucide-react'

const REACTIVATE_OPTIONS = ['פתוחה להצעות', "מחפשת סטאג'", 'בוגרת מחפשת משרה']

export default function StatusWidget({ status }: { status: string }) {
  const [loading, setLoading] = useState(false)
  const [target, setTarget]   = useState(REACTIVATE_OPTIONS[0])
  const router = useRouter()

  if (status !== 'משובצת') return null

  async function reactivate() {
    setLoading(true)
    await fetch('/api/candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate: { availability_status: target } }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="mb-6 rounded-[16px] overflow-hidden"
      style={{ border: '1px solid #86EFAC', boxShadow: '0 4px 20px rgba(22,163,74,.10)' }}>
      {/* Green header */}
      <div className="px-5 py-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #16A34A, #059669)' }}>
        <CheckCircle size={20} style={{ color: '#fff', flexShrink: 0 }} />
        <div className="flex-1">
          <p className="text-[15px] font-extrabold text-white">כרגע את משובצת 🎉</p>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'rgba(255,255,255,.75)' }}>
            המשרה אוישה בהצלחה — פרופילך אינו מוצג למוסדות כרגע
          </p>
        </div>
      </div>
      {/* Return to search */}
      <div className="px-5 py-4 flex items-center gap-4 flex-wrap"
        style={{ background: '#F0FDF4' }}>
        <p className="text-[13px] font-semibold" style={{ color: '#166534' }}>
          סיימת את ההשמה הנוכחית?
        </p>
        <div className="flex items-center gap-2 ms-auto flex-wrap">
          <select
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="h-9 px-3 rounded-[8px] border text-[13px] font-medium outline-none"
            style={{ borderColor: '#86EFAC', background: '#fff', color: '#166534' }}>
            {REACTIVATE_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <button
            onClick={reactivate}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-5 rounded-[8px] text-[13.5px] font-bold text-white transition-all"
            style={{ background: '#16A34A', boxShadow: '0 3px 10px rgba(22,163,74,.3)' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {loading ? 'מעדכן...' : 'חזרה למעגל'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReflectionPage({ params }: { params: Promise<{ dayId: string }> }) {
  const { dayId } = use(params)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('loading')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setStatus('error'); return }

    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('profile_id', user.id)
      .single()

    if (!candidate) { setStatus('error'); return }

    const res = await fetch(`/api/learning-days/${dayId}/reflections/${candidate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reflection_text: text }),
    })

    setStatus(res.ok ? 'done' : 'error')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#F0F9FF] to-white" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📚</div>
          <h1 className="text-2xl font-black text-gray-800">שיקוף יום לימוד</h1>
          <p className="text-gray-500 mt-2 text-sm">שתפי אותנו בחוויה שלך</p>
        </div>

        {status === 'done' ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-lg font-bold text-green-800">תודה!</h2>
            <p className="text-green-700 mt-1 text-sm">השיקוף שלך התקבל בהצלחה.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                מה לקחת איתך מהיום?
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={6}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
                placeholder="שתפי בחופשיות..."
              />
            </div>

            {status === 'error' && (
              <p className="text-red-500 text-sm text-center">שגיאה — נסי שוב או פני לצוות</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !text.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'שולחת...' : 'שלחי שיקוף'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type SurveyData = {
  id: string
  survey_type: 'candidate_about_institution' | 'institution_about_candidate'
  already_submitted?: boolean
  applications?: {
    jobs?: { title: string; institutions?: { institution_name: string } }
    candidates?: { profiles?: { full_name: string } }
  }
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="mb-5">
      <p className="text-[14px] font-semibold mb-2" style={{ color: '#374151' }}>{label}</p>
      <div className="flex gap-2" dir="ltr">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-3xl transition-transform hover:scale-110"
          >
            <span style={{ color: star <= (hover || value) ? '#F59E0B' : '#D1D5DB' }}>★</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SurveyForm({ token }: { token: string }) {
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [overallRating, setOverallRating] = useState(0)
  const [q2Rating, setQ2Rating] = useState(0)
  const [q3Rating, setQ3Rating] = useState(0)
  const [recommend, setRecommend] = useState<boolean | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch(`/api/surveys?t=${token}`)
      .then(r => r.json())
      .then(data => { setSurvey(data); setLoading(false) })
      .catch(() => { setError('שגיאה בטעינת הסקר'); setLoading(false) })
  }, [token])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!overallRating) { setError('נא לדרג את הדירוג הכללי'); return }
    setSubmitting(true)
    const res = await fetch(`/api/surveys?t=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overall_rating: overallRating, q2_rating: q2Rating || null, q3_rating: q3Rating || null, recommend, notes }),
    })
    setSubmitting(false)
    if (res.ok) setSubmitted(true)
    else setError('שגיאה בשליחת הסקר, נסי שוב')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
        <div className="text-[15px]" style={{ color: '#6B7280' }}>טוען...</div>
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
        <div className="rounded-[20px] p-8 text-center max-w-sm" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-bold text-[16px] mb-1">הסקר לא נמצא</p>
          <p className="text-[13px]" style={{ color: '#6B7280' }}>ייתכן שהקישור פג תוקף או שגוי</p>
        </div>
      </div>
    )
  }

  if (survey?.already_submitted || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
        <div className="rounded-[20px] p-8 text-center max-w-sm" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div className="text-5xl mb-4">✅</div>
          <p className="font-bold text-[18px] mb-2">תודה!</p>
          <p className="text-[14px]" style={{ color: '#6B7280' }}>המשוב שלך נשמר בהצלחה. אנו מעריכים את הזמן שהקדשת.</p>
        </div>
      </div>
    )
  }

  const isCandidate = survey?.survey_type === 'candidate_about_institution'
  const jobTitle = survey?.applications?.jobs?.title ?? ''
  const institutionName = survey?.applications?.jobs?.institutions?.institution_name ?? ''
  const candidateName = survey?.applications?.candidates?.profiles?.full_name ?? ''

  const otherParty = isCandidate ? institutionName : candidateName
  const q1Label = isCandidate
    ? `כיצד תדרגי את שביעות הרצון הכללית שלך מ${institutionName}?`
    : `כיצד תדרגי את ביצועי ${candidateName} בתפקיד?`
  const q2Label = isCandidate
    ? 'כיצד תדרגי את תנאי העבודה והסביבה?'
    : 'כיצד תדרגי את מקצועיות המועמדת?'
  const q3Label = isCandidate
    ? 'כיצד תדרגי את שביעות הרצון מהמשרה עצמה?'
    : 'כיצד תדרגי את ההתאמה לתפקיד?'

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#F2F0F8' }} dir="rtl">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-[13px] font-bold mb-1" style={{ color: '#5B3AAB', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            סקר שביעות רצון
          </div>
          <h1 className="text-[22px] font-black mb-1" style={{ color: '#1F1F2E' }}>
            {isCandidate ? 'המשוב שלך חשוב לנו' : 'הערכת המועמדת'}
          </h1>
          <p className="text-[13px]" style={{ color: '#6B7280' }}>
            {jobTitle}{jobTitle && otherParty ? ' · ' : ''}{otherParty}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[20px] p-6" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <StarRating value={overallRating} onChange={setOverallRating} label={q1Label} />
          <StarRating value={q2Rating} onChange={setQ2Rating} label={q2Label} />
          <StarRating value={q3Rating} onChange={setQ3Rating} label={q3Label} />

          {/* recommend */}
          <div className="mb-5">
            <p className="text-[14px] font-semibold mb-2" style={{ color: '#374151' }}>
              {isCandidate ? 'האם תמליצי על המוסד הזה לאחרות?' : 'האם תשקלי לגייס את המועמדת שוב?'}
            </p>
            <div className="flex gap-3">
              {[{ label: 'כן בהחלט', value: true }, { label: 'לא', value: false }].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setRecommend(opt.value)}
                  className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold border-2 transition-all"
                  style={{
                    borderColor: recommend === opt.value ? '#5B3AAB' : '#E5E7EB',
                    color: recommend === opt.value ? '#5B3AAB' : '#6B7280',
                    background: recommend === opt.value ? '#F2F0F8' : '#fff',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* notes */}
          <div className="mb-6">
            <label className="text-[14px] font-semibold mb-2 block" style={{ color: '#374151' }}>
              הערות נוספות (אופציונלי)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="ספרי על החוויה שלך..."
              className="w-full rounded-[10px] border px-3 py-2.5 text-[13px] resize-none outline-none transition-colors"
              style={{ borderColor: '#E5E7EB', color: '#374151' }}
              onFocus={e => (e.target.style.borderColor = '#5B3AAB')}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {error && <p className="text-red-500 text-[13px] mb-3">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !overallRating}
            className="w-full py-3 rounded-[12px] text-white font-bold text-[15px] transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #5B3AAB, #00B4CC)' }}
          >
            {submitting ? 'שולח...' : 'שליחת המשוב'}
          </button>
        </form>

        <p className="text-center text-[12px] mt-4" style={{ color: '#9CA3AF' }}>
          מערכת גיוס והשמה חב"ד · giuus.vercel.app
        </p>
      </div>
    </div>
  )
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
        <div className="text-[15px]" style={{ color: '#6B7280' }}>טוען...</div>
      </div>
    }>
      <SurveyPageInner />
    </Suspense>
  )
}

function SurveyPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('t')

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F2F0F8' }}>
        <div className="rounded-[20px] p-8 text-center max-w-sm" style={{ background: '#fff' }}>
          <div className="text-4xl mb-3">❌</div>
          <p className="font-bold text-[16px]">קישור לא תקין</p>
        </div>
      </div>
    )
  }

  return <SurveyForm token={token} />
}

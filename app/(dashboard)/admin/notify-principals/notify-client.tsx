'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Send, Check, AlertTriangle, Users } from 'lucide-react'

interface Preview {
  count: number
  sample: { institution: string; principal: string | null; phone: string }[]
  message: string
}

export default function NotifyPrincipalsClient() {
  const [preview, setPreview]       = useState<Preview | null>(null)
  const [loading, setLoading]       = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending]       = useState(false)
  const [result, setResult]         = useState<{ total: number; sent: number; failed: number } | null>(null)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/notify-principals')
      .then(r => (r.ok ? r.json() : Promise.reject(r)))
      .then(setPreview)
      .catch(() => setError('שגיאה בטעינת הרשימה'))
      .finally(() => setLoading(false))
  }, [])

  async function send() {
    setSending(true); setConfirming(false); setError(null)
    try {
      const res = await fetch('/api/admin/notify-principals', { method: 'POST' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error ?? 'failed')
      setResult({ total: j.total, sent: j.sent, failed: j.failed })
    } catch {
      setError('השליחה נכשלה — נסי שוב')
    } finally {
      setSending(false)
    }
  }

  const count = preview?.count ?? 0

  return (
    <div className="p-4 md:p-8 max-w-3xl" dir="rtl">
      <h1 className="page-title flex items-center gap-2">
        <Megaphone size={22} style={{ color: 'var(--purple)' }} />
        תזכורת למנהלות — לסגור משרות שאוישו
      </h1>
      <p className="text-[13px] mt-1 mb-6" style={{ color: 'var(--ink-4)' }}>
        שליחת הודעת וואטסאפ למנהלות שיש להן משרה פתוחה, שתבקש מהן לסמן "המשרה התאיישה" כשמשרה מתמלאת.
        ההודעה נשלחת מהמערכת, מותאמת אישית לכל מנהלת ומתועדת. שום דבר לא נשלח עד שתלחצי "שלח".
      </p>

      {loading ? (
        <div className="rounded-[16px] border p-10 text-center text-[14px]" style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--ink-4)' }}>
          טוען את הרשימה…
        </div>
      ) : error && !preview ? (
        <div className="rounded-[16px] border p-10 text-center text-[14px]" style={{ background: '#fff', borderColor: 'var(--line)', color: 'var(--red)' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Message preview */}
          <div className="rounded-[16px] border overflow-hidden mb-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="px-5 py-3 text-[13px] font-bold" style={{ borderBottom: '1px solid var(--line)', color: 'var(--ink)' }}>
              ההודעה שתישלח
            </div>
            <div className="p-5">
              <div
                className="rounded-[14px] p-4 text-[13.5px] leading-relaxed whitespace-pre-wrap"
                style={{ background: '#E7FCE3', color: '#111', border: '1px solid #CDEFC6' }}
              >
                {preview?.message}
              </div>
              <p className="text-[11.5px] mt-2" style={{ color: 'var(--ink-4)' }}>
                <span className="font-bold">[שם]</span> יוחלף אוטומטית בשם המנהלת.
              </p>
            </div>
          </div>

          {/* Recipients */}
          <div className="rounded-[16px] border overflow-hidden mb-6" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--line)' }}>
              <Users size={15} style={{ color: 'var(--teal)' }} />
              <span className="text-[13px] font-bold" style={{ color: 'var(--ink)' }}>נמענות</span>
              <span className="ms-auto text-[13px] font-extrabold px-2.5 py-0.5 rounded-full" style={{ background: 'var(--teal-050)', color: 'var(--teal)' }}>
                {count}
              </span>
            </div>
            {count === 0 ? (
              <div className="px-5 py-8 text-center text-[13.5px]" style={{ color: 'var(--ink-4)' }}>
                אין כרגע מנהלות עם משרות פתוחות ✓
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--line-soft)' }}>
                {preview?.sample.map((r, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {r.principal || r.institution}
                      </div>
                      {r.principal && (
                        <div className="text-[12px] truncate" style={{ color: 'var(--ink-4)' }}>{r.institution}</div>
                      )}
                    </div>
                    <span className="text-[12px] shrink-0" style={{ color: 'var(--ink-4)', direction: 'ltr' }}>{r.phone}</span>
                  </div>
                ))}
                {count > (preview?.sample.length ?? 0) && (
                  <div className="px-5 py-2.5 text-[12.5px] font-semibold" style={{ color: 'var(--ink-4)' }}>
                    + עוד {count - (preview?.sample.length ?? 0)} מנהלות…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result */}
          {result ? (
            <div className="rounded-[16px] border p-5 flex items-start gap-3" style={{ background: 'var(--green-bg)', borderColor: '#BBE7C9' }}>
              <Check size={20} style={{ color: 'var(--green)' }} />
              <div>
                <div className="text-[14.5px] font-bold" style={{ color: 'var(--green)' }}>
                  נשלחו {result.sent} מתוך {result.total}
                </div>
                {result.failed > 0 && (
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    {result.failed} לא נשלחו (טלפון חסר/שגוי או וואטסאפ לא זמין). מופיע ביומן ההודעות.
                  </div>
                )}
              </div>
            </div>
          ) : count > 0 && (
            <>
              {error && (
                <p className="text-[13px] font-semibold mb-3" style={{ color: 'var(--red)' }}>{error}</p>
              )}
              {confirming ? (
                <div className="rounded-[16px] border p-5" style={{ background: '#fff', borderColor: 'var(--amber)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: '#D97706' }} />
                    <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
                      לשלוח וואטסאפ ל-{count} מנהלות? אי אפשר לבטל אחרי השליחה.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={send}
                      disabled={sending}
                      className="flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-bold text-white disabled:opacity-60"
                      style={{ background: 'var(--green)' }}
                    >
                      <Send size={15} />{sending ? 'שולח…' : `כן, שלח ל-${count}`}
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      disabled={sending}
                      className="h-10 px-5 rounded-[10px] text-[14px] font-bold border"
                      style={{ borderColor: 'var(--line)', color: 'var(--ink-3)', background: '#fff' }}
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex items-center gap-2 h-11 px-6 rounded-[12px] text-[15px] font-bold text-white"
                  style={{ background: 'var(--purple)' }}
                >
                  <Send size={16} />שלח ל-{count} מנהלות
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

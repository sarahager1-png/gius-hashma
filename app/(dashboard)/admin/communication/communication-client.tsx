'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, List, Plus, Pencil, Trash2, CheckCircle2, XCircle, Clock, Send, X } from 'lucide-react'
import type { MessageTemplate, CommunicationLog } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const CHANNEL_LABELS: Record<string, string> = { wa: 'וואצאפ', sms: 'SMS', both: 'שניהם', email: 'מייל', in_app: 'במערכת' }
const STATUS_ICONS: Record<string, React.ReactNode> = {
  sent:      <CheckCircle2 size={13} className="text-green-500" />,
  delivered: <CheckCircle2 size={13} className="text-blue-500" />,
  failed:    <XCircle size={13} className="text-red-500" />,
  pending:   <Clock size={13} className="text-amber-500" />,
}

interface Props {
  templates: MessageTemplate[]
  logs: CommunicationLog[]
}

export default function CommunicationClient({ templates: initTemplates, logs: initLogs }: Props) {
  const [tab, setTab] = useState<'templates' | 'logs'>('templates')
  const [templates, setTemplates] = useState(initTemplates)
  const [logs] = useState(initLogs)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const emptyForm = (): Partial<MessageTemplate> => ({
    key: '', name: '', channel: 'both', wa_text: '', sms_text: '', variables: [], is_active: true,
  })
  const [form, setForm] = useState<Partial<MessageTemplate>>(emptyForm())

  function openNew() { setForm(emptyForm()); setShowNew(true); setEditing(null) }
  function openEdit(t: MessageTemplate) { setForm({ ...t }); setEditing(t); setShowNew(false) }
  function close() { setShowNew(false); setEditing(null); setForm(emptyNew()) }

  // dummy — same as emptyForm
  function emptyNew() { return { key: '', name: '', channel: 'both' as const, wa_text: '', sms_text: '', variables: [], is_active: true } }

  async function save() {
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/communication/templates/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const updated = await res.json()
        setTemplates(t => t.map(x => x.id === updated.id ? updated : x))
        toast.success('תבנית עודכנה')
      } else {
        const res = await fetch('/api/communication/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error((await res.json()).error)
        const created = await res.json()
        setTemplates(t => [...t, created])
        toast.success('תבנית נוצרה')
      }
      close()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('למחוק את התבנית?')) return
    const res = await fetch(`/api/communication/templates/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTemplates(t => t.filter(x => x.id !== id))
      toast.success('נמחקה')
    } else {
      toast.error('שגיאה במחיקה')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl" dir="rtl">
      <div className="page-header mb-6">
        <h1 className="page-title">תקשורת ואוטומציה</h1>
        <span className="brand-line" />
        <p className="page-subtitle">תבניות הודעות · יומן שליחות</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['templates', 'logs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={tab === t
              ? { background: 'var(--teal)', color: '#fff' }
              : { background: 'var(--bg-2)', color: 'var(--ink-3)', border: '1px solid var(--line)' }}>
            {t === 'templates' ? <><MessageSquare size={14} />תבניות</> : <><List size={14} />יומן שליחות</>}
          </button>
        ))}
      </div>

      {/* ── Templates tab ── */}
      {tab === 'templates' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all"
              style={{ background: 'var(--teal)' }}>
              <Plus size={14} /> תבנית חדשה
            </button>
          </div>

          <div className="grid gap-4">
            {templates.map(t => (
              <div key={t.id} className="rounded-2xl bg-white border p-5 flex flex-col gap-3"
                style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-[15px]" style={{ color: 'var(--ink)' }}>{t.name}</span>
                    <code className="mr-2 text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--ink-3)' }}>{t.key}</code>
                    <span className="mr-2 text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: '#E0F7F7', color: '#00B1AE' }}>{CHANNEL_LABELS[t.channel]}</span>
                    {!t.is_active && <span className="text-[11px] text-red-400 font-medium">לא פעילה</span>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: 'var(--ink-3)' }}><Pencil size={14} /></button>
                    <button onClick={() => deleteTemplate(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.variables.map(v => (
                      <code key={v} className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: '#FEF9EC', color: '#A07830' }}>
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </div>
                )}

                {t.wa_text && (
                  <div className="rounded-xl p-3 text-[12.5px] whitespace-pre-line leading-relaxed"
                    style={{ background: '#F0FDF4', color: 'var(--ink-2)' }}>
                    <span className="text-[10px] font-bold text-green-600 block mb-1">WA</span>
                    {t.wa_text}
                  </div>
                )}
                {t.sms_text && (
                  <div className="rounded-xl p-3 text-[12.5px] whitespace-pre-line"
                    style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}>
                    <span className="text-[10px] font-bold block mb-1" style={{ color: 'var(--ink-3)' }}>SMS</span>
                    {t.sms_text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Logs tab ── */}
      {tab === 'logs' && (
        <div>
          <p className="text-[13px] mb-4" style={{ color: 'var(--ink-3)' }}>{logs.length} הודעות אחרונות</p>
          <div className="rounded-2xl overflow-hidden overflow-x-auto" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-card)' }}>
            <table className="w-full text-[12.5px] min-w-[560px]">
              <thead>
                <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
                  {['נמען', 'ערוץ', 'תבנית', 'הודעה', 'סטטוס', 'תאריך'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-right font-semibold" style={{ color: 'var(--ink-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? '#fff' : 'var(--bg-2)' }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--ink)' }}>{l.recipient_name ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: l.channel === 'wa' ? '#DCFCE7' : l.channel === 'sms' ? '#EFF6FF' : 'var(--bg-2)',
                          color: l.channel === 'wa' ? '#166534' : l.channel === 'sms' ? '#1E40AF' : 'var(--ink-3)' }}>
                        <Send size={9} />{CHANNEL_LABELS[l.channel]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--ink-3)' }}>{l.template_key ?? '—'}</td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--ink-2)' }}>{l.message_body}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1">{STATUS_ICONS[l.status]}<span style={{ color: 'var(--ink-3)' }}>{l.status}</span></span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: 'var(--ink-4)' }}>{formatDate(l.sent_at)}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center" style={{ color: 'var(--ink-4)' }}>אין הודעות עדיין</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit / New modal ── */}
      {(showNew || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <h2 className="font-black text-[16px]" style={{ color: 'var(--ink)' }}>{editing ? 'עריכת תבנית' : 'תבנית חדשה'}</h2>
              <button onClick={close} style={{ color: 'var(--ink-4)' }}><X size={18} /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>מזהה (key)</label>
                  <input value={form.key ?? ''} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                    placeholder="registration_confirmation"
                    disabled={!!editing}
                    className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none disabled:opacity-50"
                    style={{ borderColor: 'var(--line)' }} />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>שם</label>
                  <input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-9 rounded-lg border px-3 text-[13px] focus:outline-none"
                    style={{ borderColor: 'var(--line)' }} />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>ערוץ</label>
                <select value={form.channel ?? 'both'} onChange={e => setForm(f => ({ ...f, channel: e.target.value as MessageTemplate['channel'] }))}
                  className="h-9 rounded-lg border px-3 text-[13px] focus:outline-none"
                  style={{ borderColor: 'var(--line)' }}>
                  <option value="both">שניהם (WA + SMS)</option>
                  <option value="wa">וואצאפ בלבד</option>
                  <option value="sms">SMS בלבד</option>
                </select>
              </div>

              {(form.channel === 'wa' || form.channel === 'both') && (
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>טקסט וואצאפ</label>
                  <textarea value={form.wa_text ?? ''} onChange={e => setForm(f => ({ ...f, wa_text: e.target.value }))}
                    rows={5} className="w-full rounded-lg border px-3 py-2 text-[13px] resize-none focus:outline-none"
                    style={{ borderColor: 'var(--line)' }}
                    placeholder="שלום {{name}}..." />
                </div>
              )}

              {(form.channel === 'sms' || form.channel === 'both') && (
                <div>
                  <label className="block text-[12px] font-semibold mb-1" style={{ color: 'var(--ink-2)' }}>טקסט SMS</label>
                  <textarea value={form.sms_text ?? ''} onChange={e => setForm(f => ({ ...f, sms_text: e.target.value }))}
                    rows={3} className="w-full rounded-lg border px-3 py-2 text-[13px] resize-none focus:outline-none"
                    style={{ borderColor: 'var(--line)' }} />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active ?? true}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="active" className="text-[13px]" style={{ color: 'var(--ink-2)' }}>תבנית פעילה</label>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--line)' }}>
              <button onClick={close} className="px-5 py-2 rounded-xl text-[13px] font-semibold border"
                style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>ביטול</button>
              <button onClick={save} disabled={saving}
                className="px-5 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-60"
                style={{ background: 'var(--teal)' }}>
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

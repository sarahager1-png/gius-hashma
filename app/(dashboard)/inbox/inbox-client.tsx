'use client'

import { useState } from 'react'
import { Inbox, Mail, MailOpen, Briefcase } from 'lucide-react'

interface Message {
  id: string
  subject: string | null
  body: string
  read_at: string | null
  created_at: string
  related_job_id: string | null
  from_profile_id: string
  from_profile: { full_name: string | null } | null
  jobs: { title: string } | null
}

interface Props { messages: Message[] }

export default function InboxClient({ messages: initial }: Props) {
  const [messages, setMessages] = useState(initial)
  const [selected, setSelected] = useState<Message | null>(null)

  async function open(msg: Message) {
    setSelected(msg)
    if (!msg.read_at) {
      await fetch(`/api/messages/${msg.id}`, { method: 'PATCH' })
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read_at: new Date().toISOString() } : m))
    }
  }

  const unread = messages.filter(m => !m.read_at).length

  return (
    <div className="p-4 md:p-8 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="page-title">תיבת הודעות</h1>
        <span className="brand-line" />
        <p className="page-subtitle">
          {unread > 0 ? `${unread} הודעות שלא נקראו` : 'כל ההודעות נקראו'}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-[20px] border p-16 text-center"
          style={{ background: 'linear-gradient(135deg,#FDFCFF,#FAF8FE)', borderColor: 'var(--line)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--purple-050)' }}>
            <Inbox size={24} style={{ color: 'var(--purple)' }} />
          </div>
          <p className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink)' }}>אין הודעות</p>
          <p className="text-[13px]" style={{ color: 'var(--ink-3)' }}>הודעות ממוסדות יופיעו כאן</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Message list */}
          <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--line)', background: '#fff' }}>
            {messages.map((msg, i) => {
              const isUnread = !msg.read_at
              const isSelected = selected?.id === msg.id
              return (
                <button key={msg.id}
                  onClick={() => open(msg)}
                  className="w-full text-right p-4 transition-all"
                  style={{
                    background: isSelected ? 'var(--purple-050)' : 'transparent',
                    borderBottom: i < messages.length - 1 ? '1px solid var(--line)' : 'none',
                    borderInlineStart: isSelected ? '3px solid var(--purple)' : '3px solid transparent',
                  }}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0" style={{ color: isUnread ? 'var(--purple)' : 'var(--ink-4)' }}>
                      {isUnread ? <Mail size={15} /> : <MailOpen size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[13px] font-bold truncate" style={{ color: 'var(--ink)' }}>
                          {msg.from_profile?.full_name ?? 'שולח לא ידוע'}
                        </span>
                        <span className="text-[10.5px] shrink-0" style={{ color: 'var(--ink-4)' }}>
                          {new Date(msg.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                      {msg.subject && (
                        <p className="text-[12px] font-semibold truncate" style={{ color: isUnread ? 'var(--ink)' : 'var(--ink-3)' }}>
                          {msg.subject}
                        </p>
                      )}
                      <p className="text-[11.5px] truncate mt-0.5" style={{ color: 'var(--ink-4)' }}>
                        {msg.body}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Message view */}
          {selected ? (
            <div className="rounded-[16px] border p-6" style={{ borderColor: 'var(--line)', background: '#fff' }}>
              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[14px] font-extrabold" style={{ color: 'var(--ink)' }}>
                    {selected.from_profile?.full_name ?? 'שולח לא ידוע'}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--ink-4)' }}>
                    {new Date(selected.created_at).toLocaleString('he-IL')}
                  </span>
                </div>
                {selected.subject && (
                  <p className="text-[16px] font-black mb-1" style={{ color: 'var(--ink)' }}>{selected.subject}</p>
                )}
                {selected.jobs?.title && (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--purple-050)', color: 'var(--purple)' }}>
                    <Briefcase size={11} />{selected.jobs.title}
                  </span>
                )}
              </div>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
                {selected.body}
              </p>
            </div>
          ) : (
            <div className="rounded-[16px] border p-12 flex flex-col items-center justify-center"
              style={{ borderColor: 'var(--line)', background: '#FAFAFA' }}>
              <MailOpen size={36} style={{ color: 'var(--ink-4)', marginBottom: '12px' }} />
              <p className="text-[14px]" style={{ color: 'var(--ink-4)' }}>בחרי הודעה לצפייה</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

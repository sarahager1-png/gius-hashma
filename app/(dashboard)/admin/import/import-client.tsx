'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface CsvRow {
  name: string
  phone: string
  city: string
  specialization: string
  academic_level: string
  availability_status: string
}

interface ImportResult {
  ok: boolean
  inserted: number
  errors: string[]
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  // skip header line
  return lines.slice(1).map(line => {
    const parts = line.split(',').map(p => p.trim())
    return {
      name:                parts[0] ?? '',
      phone:               parts[1] ?? '',
      city:                parts[2] ?? '',
      specialization:      parts[3] ?? '',
      academic_level:      parts[4] ?? '',
      availability_status: parts[5] ?? '',
    }
  }).filter(r => r.name && r.phone)
}

export default function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [parseError, setParseError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setParseError('')
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      try {
        const parsed = parseCsv(text)
        if (parsed.length === 0) {
          setParseError('לא נמצאו שורות תקינות בקובץ. וודאי שהפורמט: שם,טלפון,עיר,התמחות,רמה,סטטוס')
          setRows([])
        } else {
          setRows(parsed)
        }
      } catch {
        setParseError('שגיאה בפענוח הקובץ')
        setRows([])
      }
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (rows.length === 0) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ ok: false, inserted: 0, errors: ['שגיאת רשת'] })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl" dir="rtl">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] mb-1.5" style={{ color: 'var(--teal-600)' }}>
          ניהול מועמדות
        </p>
        <h1 className="text-[30px] font-black leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}>
          ייבוא מועמדות מ-CSV
        </h1>
        <p className="text-[14px] font-medium mt-1.5" style={{ color: 'var(--ink-3)' }}>
          טעינה המונית של מועמדות מקובץ CSV
        </p>
      </div>

      {/* Format guide */}
      <div className="rounded-[14px] border p-4 mb-5" style={{ background: 'var(--purple-050)', borderColor: 'var(--purple-100)' }}>
        <p className="text-[12px] font-bold mb-1.5" style={{ color: 'var(--purple)' }}>פורמט CSV נדרש (שורה ראשונה = כותרות):</p>
        <code className="text-[12px] font-mono block" style={{ color: 'var(--ink-2)', direction: 'ltr', textAlign: 'left' }}>
          שם,טלפון,עיר,התמחות,רמה,סטטוס
        </code>
        <p className="text-[11px] mt-2" style={{ color: 'var(--ink-3)' }}>
          שם וטלפון הם שדות חובה. שאר השדות אופציונליים.
        </p>
      </div>

      {/* File upload */}
      <div
        className="rounded-[16px] border-2 border-dashed p-8 text-center mb-5 cursor-pointer transition-all"
        style={{
          borderColor: fileName ? 'var(--teal)' : 'var(--line)',
          background: fileName ? 'var(--teal-050)' : '#fff',
        }}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="hidden"
        />
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <FileText size={20} style={{ color: 'var(--teal)' }} />
            <span className="text-[14px] font-semibold" style={{ color: 'var(--teal-600)' }}>{fileName}</span>
          </div>
        ) : (
          <>
            <Upload size={28} className="mx-auto mb-3" style={{ color: 'var(--ink-4)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--ink-2)' }}>לחצי לבחירת קובץ CSV</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--ink-4)' }}>תומך בקידוד UTF-8</p>
          </>
        )}
      </div>

      {parseError && (
        <div className="rounded-[12px] p-4 mb-4 flex items-center gap-2"
          style={{ background: 'var(--red-bg)', border: '1px solid #FCA5A5' }}>
          <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--red)' }}>{parseError}</span>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div className="rounded-[16px] border overflow-hidden mb-5" style={{ background: '#fff', borderColor: 'var(--line)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
            <p className="text-[12px] font-bold uppercase tracking-[.09em]" style={{ color: 'var(--ink-4)' }}>
              תצוגה מקדימה — {rows.length} שורות
            </p>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>
              מציג {Math.min(5, rows.length)} מתוך {rows.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" dir="rtl">
              <thead>
                <tr style={{ background: 'var(--bg-2)' }}>
                  {['שם', 'טלפון', 'עיר', 'התמחות', 'רמה', 'סטטוס'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-right font-bold" style={{ color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td className="px-4 py-2.5 font-semibold" style={{ color: 'var(--ink)' }}>{row.name}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-2)', direction: 'ltr' }}>{row.phone}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-2)' }}>{row.city || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-2)' }}>{row.specialization || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-2)' }}>{row.academic_level || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ink-2)' }}>{row.availability_status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className="rounded-[14px] border p-4 mb-5 flex items-start gap-3"
          style={{
            background: result.ok ? 'var(--green-bg)' : 'var(--red-bg)',
            borderColor: result.ok ? '#86EFAC' : '#FCA5A5',
          }}
        >
          {result.ok
            ? <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
            : <AlertCircle size={18} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
          }
          <div>
            <p className="text-[13.5px] font-bold" style={{ color: result.ok ? 'var(--green)' : 'var(--red)' }}>
              {result.ok ? `יובאו ${result.inserted} מועמדות בהצלחה` : 'שגיאה בייבוא'}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-[12px]" style={{ color: 'var(--red)' }}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={rows.length === 0 || loading}
        className="h-11 px-7 rounded-[12px] text-[14.5px] font-extrabold text-white transition-all"
        style={{
          background: rows.length > 0 && !loading ? 'linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%)' : 'var(--ink-4)',
          boxShadow: rows.length > 0 && !loading ? '0 4px 14px rgba(91,62,174,.3)' : 'none',
          cursor: rows.length > 0 && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'מייבא...' : `ייבאי ${rows.length} מועמדות`}
      </button>
    </div>
  )
}

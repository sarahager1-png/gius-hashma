'use client'

import { useState, useEffect } from 'react'
import { X, Quote } from 'lucide-react'

const QUOTES = [
  'חינוך אמיתי הוא לא מילוי הכלי — אלא הדלקת הנר שבתוך כל ילד.',
  'כל שליחה בחינוך נושאת עמה ניצוץ אלוקי שמאיר את חיי תלמידיה לעולם ועד.',
  'המורה הטובה לא מלמדת מה לחשוב — היא מלמדת כיצד לאהוב ללמוד.',
  'שליחות חינוך אינה מקצוע בלבד — היא ייעוד, אמונה ואחריות לדור הבא.',
  'כאשר מחנכת נכנסת לכיתה באהבה, היא מביאה עמה את נשמת הדור.',
  'כל ילד הוא עולם מלא — ומחנכת אחת יכולה לפתוח בפניו את שערי היקום.',
  'ברשת אהלי יוסף יצחק, כל מחנכת היא שליחה — ושליחות אין לה גבולות.',
  'האור שתדליקי בלב תלמידך היום ילווה אותו לכל ימי חייו.',
  'לחנך מתוך שמחה ואהבה — זו הדרך שסלל הרבי לדורות.',
  'המחנכת הטובה רואה לא רק את התלמיד שלפניה, אלא את מי שהוא עתיד להיות.',
]

function getDailyQuote(): string {
  const seed = new Date().toDateString()
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const idx = Math.abs(hash) % QUOTES.length
  return QUOTES[idx]
}

const STORAGE_KEY = 'chabad_quote_dismissed'

export default function ChabadQuote() {
  const [visible, setVisible] = useState(false)
  const quote = getDailyQuote()

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    const today = new Date().toDateString()
    if (dismissed !== today) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="flex items-center gap-3 mb-5 px-4 py-3 rounded-[14px] border"
      style={{
        background: 'var(--purple-050)',
        borderColor: 'var(--purple-100)',
      }}
      role="note"
      aria-label="ציטוט יומי"
    >
      {/* אייקון ציטוט */}
      <div
        className="shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center"
        style={{ background: 'var(--purple-100)', color: 'var(--purple)' }}
      >
        <Quote size={15} />
      </div>

      {/* הציטוט */}
      <p
        className="flex-1 text-[13.5px] font-semibold italic leading-snug"
        style={{ color: 'var(--purple)' }}
      >
        {quote}
      </p>

      {/* כפתור סגירה */}
      <button
        onClick={dismiss}
        aria-label="סגור ציטוט"
        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
        style={{ color: 'var(--purple)', background: 'transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--purple-100)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <X size={13} />
      </button>
    </div>
  )
}

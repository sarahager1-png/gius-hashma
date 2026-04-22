import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'גיוס והשמה — רשת חינוך חב"ד',
  description: 'פלטפורמה דיגיטלית לגיוס והשמה ברשת החינוך של חב"ד',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}

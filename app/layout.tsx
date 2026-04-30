import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'
import InstallPwa from '@/components/layout/install-pwa'

export const metadata: Metadata = {
  title: 'גיוס והשמה — רשת אהלי יוסף יצחק',
  description: 'פלטפורמה דיגיטלית לגיוס והשמה ברשת החינוך של חב"ד',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/icon-180.png', sizes: '180x180', type: 'image/png' },
  },
}

export const viewport: Viewport = {
  themeColor: '#4B2E83',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="h-full">
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <InstallPwa />
      </body>
    </html>
  )
}

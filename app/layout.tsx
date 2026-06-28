import type { Metadata, Viewport } from 'next'
import './globals.css'

export const dynamic = 'force-dynamic'
import Providers from './providers'
import InstallPwa from '@/components/layout/install-pwa'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://giuus.vercel.app').trim()

export const metadata: Metadata = {
  title: 'השביל — גיוס והשמה',
  description: 'פלטפורמה דיגיטלית לגיוס והשמה ברשת החינוך של חב"ד',
  manifest: '/manifest.json',
  openGraph: {
    title: 'מערכת השביל — גיוס והשמה',
    description: 'פלטפורמה חכמה לגיוס והשמת סגל הוראה ברשת חינוך חב"ד',
    locale: 'he_IL',
    type: 'website',
    images: [{ url: `${APP_URL}/og-image.png`, width: 1200, height: 630, alt: 'מערכת השביל — גיוס והשמה' }],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
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
      <head>
        {/* Capture beforeinstallprompt before React mounts */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});
          window.addEventListener('appinstalled',function(){window.__pwaInstalled=true;});
        ` }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <InstallPwa />
      </body>
    </html>
  )
}

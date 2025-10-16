import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { MobileNav } from '@/components/mobile-nav'
import { AudioProvider } from '@/contexts/audio-context'
import { GlobalAudioPlayer } from '@/components/global-audio-player'

export const metadata: Metadata = {
  title: 'Music App',
  description: 'Your personal music streaming app',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Music App',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AudioProvider>
          <div className="pb-32 md:pb-20">
            {children}
          </div>
          <GlobalAudioPlayer />
          <MobileNav />
          <Toaster />
        </AudioProvider>
        <Analytics />
      </body>
    </html>
  )
}
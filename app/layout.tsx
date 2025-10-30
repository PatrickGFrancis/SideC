import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AudioProvider } from "@/contexts/audio-context";
import { OptimisticTracksProvider } from "@/contexts/optimistic-tracks-context";
import { GlobalAudioPlayer } from "@/components/global-audio-player";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "SideC - Your Music Library",
  description: "Create and share your music collection",
  generator: "v0.app",
  applicationName: "SideC",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SideC",
    startupImage: [
      {
        url: "/icon-512.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#a3e635",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SideC" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#a3e635" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AudioProvider>
          <OptimisticTracksProvider>
            <PageTransition>
              {children}
            </PageTransition>
            <GlobalAudioPlayer />
            <Toaster />
          </OptimisticTracksProvider>
        </AudioProvider>
        <Analytics />
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'DetiNaRakete — Детские праздники с AI 🚀',
    template: '%s | DetiNaRakete'
  },
  description: 'Платформа для поиска и бронирования детских праздников, аниматоров и студий. AI-помощник, генератор сценариев, умный поиск. Найдём идеальное за 30 секунд!',
  keywords: ['детские праздники', 'аниматоры', 'день рождения', 'детские студии', 'организация праздников', 'AI поиск'],
  authors: [{ name: 'DetiNaRakete Team' }],
  creator: 'DetiNaRakete',
  publisher: 'DetiNaRakete',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    title: 'DetiNaRakete — Детские праздники с AI',
    description: 'Платформа для поиска и бронирования детских праздников с AI-помощником',
    siteName: 'DetiNaRakete',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DetiNaRakete — Детские праздники с AI',
    description: 'Платформа для поиска и бронирования детских праздников с AI-помощником',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

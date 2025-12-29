import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CityProvider } from "@/components/providers/city-provider";
import { FavoritesProvider } from "@/components/providers/favorites-provider";
import { AuthProvider } from "@/lib/contexts/auth-context-jwt";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { FontProvider } from "@/components/providers/font-provider";
import { ErrorReporter } from "@/components/shared/error-reporter";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { YandexMapsScript } from "@/components/shared/yandex-maps-script";
import { QueryProvider } from "@/components/providers/query-provider";
import { MonitoringProvider } from "@/components/providers/monitoring-provider";

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'ZumZam — Детские праздники в Санкт-Петербурге | Аниматоры, студии, квесты',
    template: '%s | ZumZam'
  },
  description: 'ZumZam — агрегатор детских праздников в Санкт-Петербурге. Найдём идеальный праздник за 5 минут ⚡ 100+ проверенных организаторов. AI-поиск. Отзывы и фото. Бронирование онлайн.',
  keywords: ['детские праздники спб', 'аниматоры санкт-петербург', 'день рождения ребенка спб', 'детские студии петербург', 'организация праздников спб', 'квесты для детей спб', 'где отметить день рождения спб'],
  authors: [{ name: 'ZumZam Team' }],
  creator: 'ZumZam',
  publisher: 'ZumZam',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    title: 'ZumZam — Детские праздники в Санкт-Петербурге',
    description: 'ZumZam — агрегатор детских праздников в СПб. Найдём идеальный праздник за 5 минут. 100+ проверенных организаторов.',
    siteName: 'ZumZam',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ZumZam - Агрегатор детских праздников в Санкт-Петербурге'
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZumZam — Детские праздники в Санкт-Петербурге',
    description: 'ZumZam — агрегатор детских праздников в СПб. Найдём идеальный праздник за 5 минут.',
    images: ['/og-image.png'],
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
  verification: {
    // Добавить после регистрации в Search Console
    // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
    // yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
  },
  // icons автоматически обрабатываются Next.js из app/icon.svg
  // manifest автоматически генерируется из app/manifest.ts
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* JSON-LD Schema для организации */}
        <OrganizationSchema />
      </head>
      <body
        className={`${onest.variable} antialiased`}
        style={{ fontFamily: 'var(--font-onest), system-ui, sans-serif' }}
      >
        {/* Яндекс.Карты API (только на страницах, где реально нужна карта) */}
        <YandexMapsScript />
        <ThemeProvider>
          <FontProvider>
            <QueryProvider>
              <AuthProvider>
                <MonitoringProvider>
                  <ErrorReporter />
                  <Suspense fallback={null}>
                    <AnalyticsProvider>
                      <CityProvider>
                        <FavoritesProvider>
                          {children}
                          <Toaster />
                        </FavoritesProvider>
                      </CityProvider>
                    </AnalyticsProvider>
                  </Suspense>
                </MonitoringProvider>
              </AuthProvider>
            </QueryProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

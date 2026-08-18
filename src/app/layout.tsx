import type { Metadata } from 'next'
import { buildBaseMetadata } from '@/lib/seo/metadata'
import { AnalyticsProviders } from '@/components/analytics/AnalyticsProviders'
import { AnalyticsConsent } from '@/components/analytics/AnalyticsConsent'
import './globals.css'
import '@/styles/responsive.css'

export const metadata: Metadata = buildBaseMetadata()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID

  return (
    <html lang="es-PE" className="h-full">
      <head />
      <body style={{ background: 'var(--liora-crema)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
        <AnalyticsConsent />
        <AnalyticsProviders gtmId={gtmId} ga4Id={ga4Id} />
      </body>
    </html>
  )
}

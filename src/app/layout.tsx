import type { Metadata } from 'next'
import { buildBaseMetadata } from '@/lib/seo/metadata'
import { GTMScript, GTMNoScript, GA4Script } from '@/components/layout/GTM'
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
        {gtmId && <GTMNoScript gtmId={gtmId} />}
        {children}
        {gtmId && <GTMScript gtmId={gtmId} />}
        {ga4Id && <GA4Script ga4Id={ga4Id} />}
      </body>
    </html>
  )
}

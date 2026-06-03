import type { Metadata } from 'next'
import { buildBaseMetadata } from '@/lib/seo/metadata'
import { GTMScript, GTMNoScript } from '@/components/layout/GTM'
import './globals.css'
import '@/styles/responsive.css'

export const metadata: Metadata = buildBaseMetadata()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID

  return (
    <html lang="es-PE" className="h-full">
      <head />
      <body style={{ background: 'var(--liora-crema)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {gtmId && <GTMNoScript gtmId={gtmId} />}
        {children}
        {gtmId && <GTMScript gtmId={gtmId} />}
      </body>
    </html>
  )
}

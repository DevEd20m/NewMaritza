'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Script from 'next/script'
import { getAnalyticsPreference, subscribeAnalyticsPreference } from '@/lib/analytics/preference'

export function AnalyticsProviders({ gtmId, ga4Id }: { gtmId?: string; ga4Id?: string }) {
  const preference = useSyncExternalStore(subscribeAnalyticsPreference, getAnalyticsPreference, () => 'optout')
  const enabled = preference !== 'optout'

  useEffect(() => {
    if (preference === 'optout') {
      if (ga4Id) (window as typeof window & Record<string, unknown>)[`ga-disable-${ga4Id}`] = true
      window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' })
    }
  }, [ga4Id, preference])

  if (!enabled) return null
  if (gtmId) {
    return <Script id="gtm-script" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script>
  }
  if (!ga4Id) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied'});gtag('config','${ga4Id}',{send_page_view:false,allow_google_signals:false});`}</Script>
    </>
  )
}

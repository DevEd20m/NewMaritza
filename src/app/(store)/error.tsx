'use client'
import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function StoreError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        background: 'var(--liora-crema)',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        textAlign: 'center',
        gap: 24,
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, color: 'var(--liora-uva)', lineHeight: 1 }}>
        Ups.
      </div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--liora-uva)', opacity: 0.75, maxWidth: 400 }}>
        Algo salió mal. Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        style={{
          background: 'var(--liora-uva)',
          color: 'var(--liora-crema)',
          border: 'none',
          borderRadius: 999,
          padding: '14px 32px',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        Intentar de nuevo
      </button>
    </div>
  )
}

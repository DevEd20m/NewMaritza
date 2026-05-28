'use client'
import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--liora-uva)' }}>
        Error en el panel
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, opacity: 0.7, marginBottom: 24 }}>
        {error.message ?? 'Algo salió mal.'}
      </p>
      <button
        onClick={reset}
        style={{ background: 'var(--liora-uva)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}
      >
        Reintentar
      </button>
    </div>
  )
}

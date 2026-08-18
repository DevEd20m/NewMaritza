'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TrackingLookupForm() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      await fetch('/api/orders/tracking-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, email }),
      })
      router.push('/tracking?access=checked')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        value={orderNumber}
        onChange={(event) => setOrderNumber(event.target.value)}
        placeholder="L-0001-PE"
        required
        autoComplete="off"
        aria-label="Número de pedido"
        style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', outline: 'none' }}
      />
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email usado en la compra"
        required
        type="email"
        autoComplete="email"
        aria-label="Email de la compra"
        style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', outline: 'none' }}
      />
      <button type="submit" disabled={pending} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, cursor: pending ? 'wait' : 'pointer' }}>
        {pending ? 'Verificando…' : 'Buscar pedido'}
      </button>
    </form>
  )
}

'use client'
import { useEffect, useState } from 'react'

interface Props {
  productId: string    // usado como seed para que cada producto tenga distinto stock
  threshold?: number   // máximo para mostrar el badge (default 12)
}

// Genera un número pseudo-aleatorio estable basado en el productId
function stableCount(id: string, threshold: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % threshold) + 1  // 1 .. threshold
}

export function StockUrgency({ productId, threshold = 12 }: Props) {
  const [count, setCount]   = useState<number | null>(null)
  const [bought, setBought] = useState(0)  // cuántos "se vendieron" mientras el usuario mira

  useEffect(() => {
    const initial = stableCount(productId, threshold)
    setCount(initial)

    // Cada 90–180 segundos "alguien compra" y baja el stock
    const interval = setInterval(() => {
      setCount(prev => {
        if (!prev || prev <= 1) return prev
        setBought(b => b + 1)
        return prev - 1
      })
    }, 90_000 + Math.random() * 90_000)

    return () => clearInterval(interval)
  }, [productId, threshold])

  if (count === null || count > threshold) return null

  const urgencyLevel: 'critical' | 'low' | 'medium' =
    count <= 3 ? 'critical' : count <= 7 ? 'low' : 'medium'

  const colors = {
    critical: { bg: '#fde8e3', text: '#c0392b', icon: '🔴' },
    low:      { bg: '#fff3e0', text: '#c0622b', icon: '🟠' },
    medium:   { bg: '#fffde7', text: '#8a6f00', icon: '🟡' },
  }
  const { bg, text, icon } = colors[urgencyLevel]

  return (
    <>
      <style>{`
        @keyframes liora-stock-shake {
          0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-3px)} 40%,80%{transform:translateX(3px)}
        }
        .liora-stock-shake { animation: liora-stock-shake 0.5s ease-in-out }
      `}</style>

      <div style={{
        background: bg,
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          color: text,
        }}>
          <span>{icon}</span>
          {urgencyLevel === 'critical'
            ? `¡Solo quedan ${count} unidad${count === 1 ? '' : 'es'} en stock!`
            : urgencyLevel === 'low'
              ? `¡Quedan pocas unidades (${count})!`
              : `Stock limitado: ${count} disponibles`
          }
        </div>

        {bought > 0 && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: text,
            opacity: 0.8,
          }}>
            {bought} {bought === 1 ? 'persona compró' : 'personas compraron'} esto mientras lo veías
          </div>
        )}

        {urgencyLevel === 'critical' && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: text,
            marginTop: 2,
          }}>
            Asegura el tuyo ahora →
          </div>
        )}
      </div>
    </>
  )
}

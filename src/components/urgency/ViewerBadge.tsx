'use client'
import { useEffect, useState } from 'react'

interface Props {
  baseCount?: number   // seed para que cada producto tenga su propio rango
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function ViewerBadge({ baseCount = 7 }: Props) {
  const [count, setCount] = useState(baseCount)

  useEffect(() => {
    // Arranca con el baseCount y fluctúa ±2 cada 20-40 segundos
    const fluctuate = () => {
      setCount(prev => {
        const delta = Math.floor(seededRandom(Date.now() / 1000) * 5) - 2
        return Math.max(3, Math.min(prev + delta, 24))
      })
    }

    const interval = setInterval(fluctuate, 20_000 + Math.random() * 20_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`
        @keyframes liora-dot-pulse {
          0%,100% { transform: scale(1); opacity: 1 }
          50%      { transform: scale(1.35); opacity: 0.6 }
        }
        .liora-dot { animation: liora-dot-pulse 2s ease-in-out infinite }
      `}</style>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        background: 'rgba(61,26,58,0.06)',
        borderRadius: 999,
        padding: '5px 12px 5px 8px',
        marginTop: 10,
      }}>
        <span
          className="liora-dot"
          style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#e05c3a', flexShrink: 0 }}
        />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--liora-uva)',
          letterSpacing: '0.01em',
        }}>
          {count} personas lo están viendo ahora
        </span>
      </div>
    </>
  )
}

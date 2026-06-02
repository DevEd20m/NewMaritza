'use client'
import { useEffect, useState } from 'react'

// Lista de actividad simulada — nombres peruanos + distritos de Lima
const ACTIVITIES = [
  { name: 'Mariana R.', city: 'Miraflores',     product: 'Kit Colágeno Radiante',       time: 2  },
  { name: 'Sofía T.',   city: 'San Isidro',      product: 'Kit Vitaminas Esenciales',    time: 5  },
  { name: 'Lucía M.',   city: 'Surco',           product: 'Colágeno C+ Peru Nutrition',  time: 8  },
  { name: 'Andrea V.',  city: 'La Molina',       product: 'Kit Articulaciones & Movilidad', time: 11 },
  { name: 'Camila F.',  city: 'Barranco',        product: 'Biotina 10,000 MCG Natures Truth', time: 14 },
  { name: 'Valeria S.', city: 'Jesús María',     product: 'Kit Sueño Profundo',          time: 3  },
  { name: 'Daniela P.', city: 'Lince',           product: 'Kit Gym Performance',         time: 7  },
  { name: 'Isabella C.','city': 'San Borja',     product: 'Kit Bienestar Andino',        time: 19 },
  { name: 'Fernanda A.','city': 'Pueblo Libre',  product: 'Magnesio Xtralife 500mg',     time: 22 },
  { name: 'Gabriela N.','city': 'Surquillo',     product: 'Kit Detox & Digestión',       time: 6  },
  { name: 'Renata L.',  city: 'San Miguel',      product: 'Omega 3-6-7-9 Natures Truth', time: 31 },
  { name: 'Catalina R.','city': 'Magdalena',     product: 'Kit Cuidado Capilar',         time: 12 },
  { name: 'Paula M.',   city: 'Chorrillos',      product: 'Vitamina D3 5000 UI Sundown', time: 4  },
  { name: 'Elena B.',   city: 'San Juan de Miraflores', product: 'Creatina Lab Nutrition', time: 9 },
  { name: 'Natalia Q.', city: 'Breña',           product: 'Kit Colágeno Radiante',       time: 16 },
]

function formatTime(minutes: number) {
  if (minutes < 60) return `hace ${minutes} min`
  const h = Math.floor(minutes / 60)
  return `hace ${h}h`
}

export function LiveActivityToast() {
  const [visible, setVisible]     = useState(false)
  const [animIn, setAnimIn]       = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  useEffect(() => {
    // Shuffle activities randomly on mount so each session feels different
    let idx = Math.floor(Math.random() * ACTIVITIES.length)
    setCurrentIdx(idx)

    const show = () => {
      setVisible(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimIn(true)))

      // Hide after 5 seconds
      const hideTimer = setTimeout(() => {
        setAnimIn(false)
        setTimeout(() => {
          setVisible(false)
          idx = (idx + 1) % ACTIVITIES.length
          setCurrentIdx(idx)
        }, 400)
      }, 5000)

      return hideTimer
    }

    // First show after 4 seconds
    const firstTimer = setTimeout(() => {
      const hideTimer = show()
      // Then cycle every 15 seconds
      const cycleInterval = setInterval(() => {
        clearTimeout(hideTimer)
        show()
      }, 15_000)
      return () => clearInterval(cycleInterval)
    }, 4000)

    return () => clearTimeout(firstTimer)
  }, [])

  if (!visible) return null

  const activity = ACTIVITIES[currentIdx]

  return (
    <>
      <style>{`
        @keyframes liora-toast-in  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes liora-toast-out { from { opacity:1; transform:translateY(0) }    to { opacity:0; transform:translateY(16px) } }
        .liora-toast-enter { animation: liora-toast-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards }
        .liora-toast-leave { animation: liora-toast-out 0.35s ease-in forwards }
        @keyframes liora-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .liora-pulse { animation: liora-pulse 1.6s ease-in-out infinite }
      `}</style>

      <div
        className={animIn ? 'liora-toast-enter' : 'liora-toast-leave'}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          background: 'var(--liora-blanco)',
          border: '1.5px solid var(--liora-arena)',
          borderRadius: 20,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 8px 32px rgba(61,26,58,0.12)',
          maxWidth: 320,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        {/* Icono compra */}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--cat-menta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 18,
        }}>
          🛍
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 13,
            color: 'var(--liora-uva)',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {activity.name} de {activity.city}
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--liora-uva)',
            opacity: 0.7,
            marginTop: 2,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            acaba de comprar{' '}
            <span style={{ fontWeight: 600, opacity: 1 }}>{activity.product}</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--liora-uva)',
            opacity: 0.45,
            marginTop: 4,
          }}>
            {formatTime(activity.time)}
          </div>
        </div>

        {/* Indicador activo */}
        <div
          className="liora-pulse"
          style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cat-menta-ink, #2d7a5e)', flexShrink: 0 }}
        />
      </div>
    </>
  )
}

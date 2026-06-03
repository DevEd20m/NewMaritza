'use client'
import { useState, useEffect } from 'react'
import { WhatsappLogo, X } from '@phosphor-icons/react'

const WA_MESSAGE = '¡Hola! Tengo una pregunta sobre los productos LIORA 🌿'

export function WhatsAppButton({ number }: { number?: string }) {
  const waNumber = number ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '51999999999'
  const [visible, setVisible] = useState(false)
  const [tooltip, setTooltip] = useState(true)

  // Aparece después de 3 segundos
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  // Ocultar tooltip después de 6 segundos
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => setTooltip(false), 6000)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible) return null

  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(WA_MESSAGE)}`

  return (
    <>
      <style>{`
        @keyframes liora-wa-in { from{opacity:0;transform:scale(0.7) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes liora-wa-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,0.5)} 50%{box-shadow:0 0 0 12px rgba(37,211,102,0)} }
        .liora-wa-btn { animation: liora-wa-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards, liora-wa-pulse 2.5s ease-in-out 1s 3; }
        .liora-tooltip-in { animation: liora-wa-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9998, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="liora-tooltip-in"
            style={{
              background: 'var(--liora-uva)', color: 'var(--liora-crema)',
              borderRadius: 16, padding: '12px 16px',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              maxWidth: 220, lineHeight: 1.4, boxShadow: '0 8px 32px rgba(61,26,58,0.2)',
              position: 'relative',
            }}
          >
            ¿Tienes dudas sobre tu rutina? ¡Escríbenos! 💬
            <button
              onClick={() => setTooltip(false)}
              style={{
                position: 'absolute', top: 6, right: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--liora-crema)', opacity: 0.6, padding: 0,
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={12} weight="bold" />
            </button>
            {/* Arrow */}
            <div style={{
              position: 'absolute', bottom: -6, right: 22,
              width: 12, height: 12, background: 'var(--liora-uva)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }} />
          </div>
        )}

        {/* WhatsApp button */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="liora-wa-btn"
          aria-label="Contactar por WhatsApp"
          style={{
            width: 58, height: 58, borderRadius: '50%',
            background: '#25d366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
            transition: 'transform 200ms, box-shadow 200ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(37,211,102,0.5)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(37,211,102,0.4)'
          }}
        >
          <WhatsappLogo size={30} weight="fill" color="#ffffff" />
        </a>
      </div>
    </>
  )
}

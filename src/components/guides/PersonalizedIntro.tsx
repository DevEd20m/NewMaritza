'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Tip } from '@/lib/guides'

interface PersonalizationData {
  intro: string
  highlightedTipIndex: number | null
  activeWarnings: string[]
}

const WARNING_COPY: Record<string, { emoji: string; text: string }> = {
  embarazada: { emoji: '🤰', text: 'Estás embarazada o lactando — consulta con tu médico antes de comenzar este kit.' },
  digestivos: { emoji: '🫃', text: 'Tienes sensibilidad digestiva — empieza con la mitad de la dosis los primeros 5 días.' },
  'piel-sensible': { emoji: '🌸', text: 'Tu piel es sensible — haz un patch test antes de aplicar cualquier producto tópico.' },
}

interface Props {
  guideSlug: string
  guideColor: string
  tips: Tip[]
}

export function PersonalizedIntro({ guideSlug, guideColor, tips }: Props) {
  const searchParams = useSearchParams()
  const profileId = searchParams.get('profileId')

  const [data, setData] = useState<PersonalizationData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    fetch('/api/guides/personalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, guideSlug }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.intro) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [profileId, guideSlug])

  if (!profileId) return null

  if (loading) {
    return (
      <div style={{ marginBottom: 40 }}>
        <div style={{
          background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)',
          borderRadius: 20, padding: '24px 28px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--liora-arena)', flexShrink: 0,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, background: 'var(--liora-arena)', borderRadius: 6, marginBottom: 8, width: '60%' }} />
            <div style={{ height: 12, background: 'var(--liora-arena)', borderRadius: 6, width: '85%' }} />
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
        </div>
      </div>
    )
  }

  if (!data) return null

  const highlightedTip = data.highlightedTipIndex !== null ? tips[data.highlightedTipIndex] : null
  const warnings = data.activeWarnings.filter(w => WARNING_COPY[w])

  return (
    <div style={{ marginBottom: 40 }}>

      {/* Intro personalizada */}
      <div style={{
        background: 'var(--liora-uva)', borderRadius: 20, padding: '24px 28px', marginBottom: 14,
      }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--liora-lima)', marginBottom: 10 }}>
          ✨ Tu guía personalizada
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-crema)', lineHeight: 1.6, margin: 0, opacity: 0.92 }}>
          {data.intro}
        </p>
      </div>

      {/* Advertencias según perfil */}
      {warnings.length > 0 && (
        <div style={{
          background: '#fff8e7', border: '1.5px solid #f0d070',
          borderRadius: 16, padding: '16px 22px', marginBottom: 14,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#7a5c00', marginBottom: 6 }}>
              Nota para tu perfil
            </div>
            {warnings.map(w => {
              const c = WARNING_COPY[w]
              return (
                <div key={w} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#7a5c00', lineHeight: 1.45 }}>
                  {c.emoji} {c.text}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Consejo destacado para su perfil */}
      {highlightedTip && (
        <div style={{
          background: guideColor, borderRadius: 16, padding: '18px 22px',
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>{highlightedTip.emoji}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--liora-uva)', opacity: 0.6, marginBottom: 4 }}>
              Consejo clave para ti
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--liora-uva)', marginBottom: 4 }}>
              {highlightedTip.title}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, margin: 0, lineHeight: 1.45 }}>
              {highlightedTip.body}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}

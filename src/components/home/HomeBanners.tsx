'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, Lightning, X, ArrowRight, Truck, Sparkle, Ticket, DeviceMobileCamera } from '@phosphor-icons/react'

interface AbandonedKit {
  profileId: string
  productCount: number
  totalCents: number
  savedAt: number
}

interface Props {
  isLoggedIn: boolean
  userName?: string
  orderNumber?: string | null
  kitTitle?: string | null
  kitProfileId?: string | null
  freeShippingThresholdCents?: number
}

const STORAGE_KEY = 'liora-abandoned-kit'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function HomeBanners({ isLoggedIn, userName, orderNumber, kitTitle, kitProfileId, freeShippingThresholdCents = 15000 }: Props) {
  const router = useRouter()
  const [scenario, setScenario] = useState<'resume' | 'refill' | 'welcome' | null>(null)
  const [abandoned, setAbandoned] = useState<AbandonedKit | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const kit = JSON.parse(raw) as AbandonedKit
        if (Date.now() - kit.savedAt < MAX_AGE_MS && kit.profileId) {
          setAbandoned(kit)
          setScenario('resume')
          return
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    if (isLoggedIn) {
      if (orderNumber) {
        setScenario('refill')
      } else {
        setScenario('welcome')
      }
    }
  }, [isLoggedIn, orderNumber])

  if (!scenario || dismissed) return null

  if (scenario === 'resume' && abandoned) {
    const days = Math.max(1, Math.round((Date.now() - abandoned.savedAt) / (24 * 60 * 60 * 1000)))
    const total = abandoned.totalCents > 0 ? `S/${Math.round(abandoned.totalCents / 100)}` : ''
    return (
      <div className="ckb-strip">
        <div className="ckb-strip-inner">
          <div className="ckb-strip-left">
            <span className="ckb-strip-icon" style={{ background: 'var(--cat-mostaza)' }}>
              <Bookmark size={18} weight="bold" color="var(--liora-uva)" />
            </span>
            <div className="ckb-strip-avatars">
              {['var(--cat-durazno)', 'var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-cielo)'].map((c, i) => (
                <span key={i} className="ckb-strip-avatar" style={{ background: c, marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </div>
          </div>
          <div className="ckb-strip-text">
            <div className="ckb-strip-eyebrow" style={{ color: 'var(--cat-mostaza)' }}>
              <span className="ckb-strip-dot" style={{ background: 'var(--cat-mostaza)' }} />
              Tu kit te espera
            </div>
            <div className="ckb-strip-title">
              Hicimos tu kit hace {days === 1 ? '1 día' : `${days} días`}.
            </div>
            <div className="ckb-strip-desc">
              {abandoned.productCount > 0 ? `${abandoned.productCount} productos` : 'Kit personalizado'}
              {total ? ` · ${total}` : ''} · sin terminar
            </div>
          </div>
          <div className="ckb-strip-helper">
            <DeviceMobileCamera size={14} /> Guardado en este navegador
          </div>
          <div className="ckb-strip-actions">
            <button className="ckb-strip-cta" onClick={() => router.push(`/carrito?profileId=${abandoned.profileId}`)}>
              Retomar <ArrowRight size={14} weight="bold" />
            </button>
            <button className="ckb-strip-close" onClick={() => setDismissed(true)} aria-label="Cerrar">
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
        <style>{CKB_STYLES}</style>
      </div>
    )
  }

  if (scenario === 'refill') {
    return (
      <div className="ckb-strip">
        <div className="ckb-strip-inner">
          <div className="ckb-strip-left">
            <span className="ckb-strip-icon" style={{ background: 'var(--cat-cielo)' }}>
              <Lightning size={18} weight="bold" color="var(--liora-uva)" />
            </span>
            <div className="ckb-strip-avatars">
              {['var(--cat-durazno)', 'var(--cat-cielo)'].map((c, i) => (
                <span key={i} className="ckb-strip-avatar" style={{ background: c, marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </div>
          </div>
          <div className="ckb-strip-text">
            <div className="ckb-strip-eyebrow" style={{ color: 'var(--cat-cielo)' }}>
              <span className="ckb-strip-dot" style={{ background: 'var(--cat-cielo)' }} />
              Hora del refill
            </div>
            <div className="ckb-strip-title">
              {kitTitle ? `Tu ${kitTitle} se acaba pronto.` : 'Tus productos se acaban pronto.'}
            </div>
            <div className="ckb-strip-desc">Refill 1-clic · sin suscripción</div>
          </div>
          <div className="ckb-strip-helper">
            <Truck size={14} /> Envío gratis desde S/{Math.round(freeShippingThresholdCents / 100)}
          </div>
          <div className="ckb-strip-actions">
            <button className="ckb-strip-cta" onClick={() => router.push(kitProfileId ? `/carrito?profileId=${kitProfileId}` : '/cuestionario')}>
              Reabastecer <Lightning size={14} weight="bold" />
            </button>
            <button className="ckb-strip-close" onClick={() => setDismissed(true)} aria-label="Cerrar">
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
        <style>{CKB_STYLES}</style>
      </div>
    )
  }

  if (scenario === 'welcome') {
    return (
      <div className="wb-strip">
        <div className="wb-strip-inner">
          <div className="wb-strip-greeting">
            <span className="wb-strip-avatar">{userName ? userName[0].toUpperCase() : 'C'}</span>
            <div className="wb-strip-greeting-text">
              <div className="wb-strip-eyebrow">
                <span className="wb-strip-dot" />
                De vuelta
              </div>
              <div className="wb-strip-hello">
                Hola, <span className="wb-strip-name">{userName ? `${userName}.` : 'bienvenida.'}</span>
              </div>
            </div>
          </div>

          <span className="wb-strip-sep" />

          {orderNumber && (
            <button onClick={() => router.push(`/tracking?order=${orderNumber}`)} className="wb-strip-pill wb-strip-track">
              <span className="wb-strip-pill-icon"><Truck size={14} weight="bold" /></span>
              <span className="wb-strip-pill-text">
                <span className="wb-strip-pill-label">Pedido #{orderNumber}</span>
                <span className="wb-strip-pill-sub">ver tracking</span>
              </span>
              <ArrowRight size={11} weight="bold" className="wb-strip-pill-arrow" />
            </button>
          )}

          <button onClick={() => router.push('/cuenta')} className="wb-strip-pill wb-strip-kit">
            <span className="wb-strip-avatars">
              {['var(--cat-durazno)', 'var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-cielo)'].map((c, i) => (
                <span key={i} className="wb-strip-mini-avatar" style={{ background: c, marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </span>
            <span className="wb-strip-pill-text">
              <span className="wb-strip-pill-label">{kitTitle ? `Tu kit · ${kitTitle}` : 'Mi cuenta'}</span>
              <span className="wb-strip-pill-sub">ver o repetir</span>
            </span>
          </button>

          <button onClick={() => router.push('/cuestionario')} className="wb-strip-pill" style={{ marginLeft: 'auto' }}>
            <span className="wb-strip-pill-icon" style={{ background: 'transparent', border: 'none' }}>
              <Sparkle size={14} weight="bold" />
            </span>
            <span className="wb-strip-pill-text">
              <span className="wb-strip-pill-label">Nuevo kit</span>
              <span className="wb-strip-pill-sub">8 preguntas</span>
            </span>
          </button>
        </div>
        <style>{WB_STYLES}</style>
      </div>
    )
  }

  return null
}

const CKB_STYLES = `
.ckb-strip { background: var(--liora-uva); color: var(--liora-crema); padding: 0; }
.ckb-strip-inner { max-width: 1280px; margin: 0 auto; padding: 14px 48px; display: flex; align-items: center; gap: 20px; }
.ckb-strip-left { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.ckb-strip-icon { width: 40px; height: 40px; border-radius: 12px; color: var(--liora-uva); font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ckb-strip-avatars { display: flex; align-items: center; }
.ckb-strip-avatar { width: 24px; height: 24px; border-radius: 999px; border: 2px solid var(--liora-uva); display: inline-block; flex-shrink: 0; }
.ckb-strip-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.ckb-strip-eyebrow { font-family: var(--font-body); font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; display: inline-flex; align-items: center; gap: 6px; }
.ckb-strip-dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; animation: ckb-pulse 1.8s ease-in-out infinite; }
@keyframes ckb-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.4; } }
.ckb-strip-title { font-family: var(--font-display); font-weight: 700; font-size: 18px; line-height: 1.15; color: var(--liora-crema); letter-spacing: -0.015em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ckb-strip-desc { font-family: var(--font-body); font-size: 12.5px; color: var(--liora-crema); opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ckb-strip-helper { font-family: var(--font-body); font-size: 12px; color: var(--liora-crema); opacity: 0.7; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; padding: 6px 12px; border-radius: 999px; background: rgba(251,241,226,0.06); border: 1px solid rgba(251,241,226,0.12); }
.ckb-strip-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.ckb-strip-cta { background: var(--liora-lima); color: var(--liora-uva); border: none; border-radius: 999px; padding: 10px 18px; font-family: var(--font-body); font-weight: 700; font-size: 13px; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; transition: transform 180ms cubic-bezier(0.22,1,0.36,1), filter 150ms; }
.ckb-strip-cta:hover { transform: translateY(-1px); filter: brightness(1.06); }
.ckb-strip-close { background: transparent; color: var(--liora-crema); border: 1.5px solid rgba(251,241,226,0.2); border-radius: 999px; width: 34px; height: 34px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: background 150ms; flex-shrink: 0; }
.ckb-strip-close:hover { background: rgba(251,241,226,0.1); }
@media (max-width: 1024px) { .ckb-strip-helper { display: none; } }
@media (max-width: 760px) { .ckb-strip-inner { padding: 12px 16px; gap: 12px; flex-wrap: wrap; } .ckb-strip-title { font-size: 14.5px; white-space: normal; } .ckb-strip-cta { padding: 9px 14px; font-size: 12px; } }
`

const WB_STYLES = `
.wb-strip { background: var(--liora-uva); color: var(--liora-crema); border-top: 1.5px solid rgba(251,241,226,0.08); }
.wb-strip-inner { max-width: 1280px; margin: 0 auto; padding: 12px 48px; display: flex; align-items: center; gap: 14px; overflow-x: auto; scrollbar-width: none; }
.wb-strip-inner::-webkit-scrollbar { display: none; }
.wb-strip-greeting { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.wb-strip-avatar { width: 36px; height: 36px; border-radius: 999px; background: var(--cat-lavanda); color: var(--liora-uva); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 800; font-size: 16px; flex-shrink: 0; }
.wb-strip-greeting-text { display: flex; flex-direction: column; gap: 1px; line-height: 1.1; }
.wb-strip-eyebrow { font-family: var(--font-body); font-weight: 600; font-size: 10px; color: var(--liora-lima); text-transform: uppercase; letter-spacing: 0.1em; display: inline-flex; align-items: center; gap: 6px; }
.wb-strip-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--liora-lima); display: inline-block; animation: wb-pulse 1.8s ease-in-out infinite; }
@keyframes wb-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.4; } }
.wb-strip-hello { font-family: var(--font-display); font-weight: 700; font-size: 16px; color: var(--liora-crema); white-space: nowrap; }
.wb-strip-name { font-family: var(--font-script); font-weight: 600; color: var(--liora-lima); }
.wb-strip-sep { width: 1px; height: 30px; background: rgba(251,241,226,0.15); flex-shrink: 0; }
.wb-strip-pill { background: rgba(251,241,226,0.06); border: 1px solid rgba(251,241,226,0.14); border-radius: 999px; padding: 6px 14px 6px 6px; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; color: var(--liora-crema); font-family: var(--font-body); transition: background 150ms, border-color 150ms; white-space: nowrap; flex-shrink: 0; }
.wb-strip-pill:hover { background: rgba(251,241,226,0.12); border-color: rgba(251,241,226,0.25); }
.wb-strip-pill-icon { width: 30px; height: 30px; border-radius: 999px; background: var(--liora-lima); color: var(--liora-uva); display: inline-flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.wb-strip-pill-text { display: flex; flex-direction: column; gap: 0; line-height: 1.15; }
.wb-strip-pill-label { font-weight: 700; font-size: 12.5px; color: var(--liora-crema); }
.wb-strip-pill-sub { font-size: 10.5px; opacity: 0.65; color: var(--liora-crema); }
.wb-strip-pill-arrow { font-size: 11px; opacity: 0.6; margin-left: 2px; }
.wb-strip-avatars { display: inline-flex; align-items: center; margin-right: 4px; flex-shrink: 0; }
.wb-strip-mini-avatar { width: 24px; height: 24px; border-radius: 999px; border: 2px solid var(--liora-uva); display: inline-block; flex-shrink: 0; }
@media (max-width: 1100px) { .wb-strip-inner { padding: 12px 24px; gap: 12px; } .wb-strip-pill-sub { display: none; } }
@media (max-width: 760px) { .wb-strip-inner { padding: 10px 16px; gap: 10px; } .wb-strip-sep { display: none; } .wb-strip-hello { font-size: 14.5px; } }
@media (max-width: 480px) { .wb-strip-kit { display: none; } }
`

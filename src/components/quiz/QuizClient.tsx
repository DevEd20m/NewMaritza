'use client'
import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Sparkle, ShieldCheck, EnvelopeSimple, XCircle, Check,
  Lightning, Drop, Moon, Leaf, Heart, Star, Barbell, Brain,
  Sun, Suitcase, FirstAid, Sneaker, Compass, Pill,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useQuizStore } from '@/lib/store/quiz'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

interface QuizOption { id: string; text: string; slug: string; icon_url: string | null; sort_order: number }
interface QuizQuestion {
  id: string; text: string; subtext: string | null; type: string; sort_order: number
  conditions: { if_any_slug?: string[] } | null
  quiz_question_options: QuizOption[]
}
interface QuizGroup { id: string; title: string; sort_order: number; interstitial_text: string | null; quiz_questions: QuizQuestion[] }

interface Props {
  templateId: string
  groups: QuizGroup[]
  isLoggedIn?: boolean
  userName?: string
  userEmail?: string
}

const OPTION_COLORS = ['var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-lavanda)', 'var(--cat-menta)', 'var(--cat-cielo)', 'var(--cat-rosa)']

const SLUG_ICONS: Record<string, Icon> = {
  // Q01 objectives
  'obj-rendimiento':  Barbell,
  'obj-belleza':      Drop,
  'obj-bienestar':    Moon,
  'obj-digestivo':    Leaf,
  'obj-nutricion':    Pill,
  'obj-solar':        Sun,
  'obj-viaje':        Suitcase,
  'obj-hogar':        FirstAid,
  'obj-pies-cuerpo':  Sneaker,
  'obj-guia':         Compass,
  // Legacy slugs
  'obj-piel':         Drop,
  'obj-cabello':      Star,
  // Sub-branches
  'foco-sueno':       Moon,
  'foco-estres':      Brain,
  'foco-energia':     Lightning,
  'foco-pantallas':   Brain,
  'guia-piel':        Drop,
  'guia-bienestar':   Moon,
  'guia-gym':         Barbell,
  'guia-digestivo':   Leaf,
  'guia-viaje':       Suitcase,
  'guia-hogar':       FirstAid,
  'bienestar-sueno':  Moon,
  'bienestar-estres': Brain,
  'entreno-fuerza':   Barbell,
  'entreno-cardio':   Heart,
  'nutricion-energia':        Lightning,
  'nutricion-superalimentos': Leaf,
}

export function QuizClient({ templateId, groups, isLoggedIn = false, userName, userEmail }: Props) {
  const router = useRouter()
  const { addAnswer, setTemplateId, setProfileId, complete } = useQuizStore()

  const optionSlugMap = useMemo(() => {
    const map: Record<string, string> = {}
    groups.forEach(g => g.quiz_questions.forEach(q =>
      q.quiz_question_options.forEach(o => { map[o.id] = o.slug })
    ))
    return map
  }, [groups])

  const optionTextMap = useMemo(() => {
    const map: Record<string, string> = {}
    groups.forEach(g => g.quiz_questions.forEach(q =>
      q.quiz_question_options.forEach(o => { map[o.id] = o.text })
    ))
    return map
  }, [groups])

  type Step = { kind: 'question'; group: QuizGroup; question: QuizQuestion } | { kind: 'insight'; group: QuizGroup }
  const allPossibleSteps = useMemo<Step[]>(() => {
    const steps: Step[] = []
    groups.forEach(group => {
      group.quiz_questions.sort((a, b) => a.sort_order - b.sort_order).forEach(q => {
        steps.push({ kind: 'question', group, question: q })
      })
      if (group.interstitial_text) steps.push({ kind: 'insight', group })
    })
    return steps
  }, [groups])

  const [stepIdx, setStepIdx] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [whatsappConsent, setWhatsappConsent] = useState(true)
  const [leadStep, setLeadStep] = useState(false)
  const [fading, setFading] = useState(false)
  const validEmail = /\S+@\S+\.\S+/.test(leadEmail)

  const quizTopRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { if (userEmail) setLeadEmail(userEmail) }, [userEmail])

  useLayoutEffect(() => {
    quizTopRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [stepIdx])

  const selectedSlugs = useMemo(
    () => Object.values(answers).flat().map(id => optionSlugMap[id]).filter(Boolean),
    [answers, optionSlugMap]
  )

  const visibleSteps = useMemo(
    () => allPossibleSteps.filter(step => {
      if (step.kind !== 'question') return true
      const cond = step.question.conditions
      if (!cond?.if_any_slug?.length) return true
      return cond.if_any_slug.some(s => selectedSlugs.includes(s))
    }),
    [allPossibleSteps, selectedSlugs]
  )

  const step = visibleSteps[stepIdx]
  const progress = visibleSteps.length > 0 ? ((stepIdx + 1) / visibleSteps.length) * 100 : 0
  const isLast = stepIdx === visibleSteps.length - 1
  const questionCount = visibleSteps.filter(s => s.kind === 'question').length
  const currentQuestionNum = visibleSteps.filter((s, i) => s.kind === 'question' && i <= stepIdx).length

  const isFirstStep   = stepIdx === 0
  const manyOptions   = step?.kind === 'question' && step.question.quiz_question_options.length > 6
  const compactCards  = step?.kind === 'question' && step.question.quiz_question_options.length >= 5
  const sortedOpts    = step?.kind === 'question'
    ? [...step.question.quiz_question_options].sort((a, b) => a.sort_order - b.sort_order)
    : []
  const lastOpt  = (manyOptions && step?.kind === 'question' && step.question.type === 'single')
    ? (sortedOpts[sortedOpts.length - 1] ?? null)
    : null
  const mainOpts = lastOpt ? sortedOpts.slice(0, -1) : sortedOpts
  const LastOptIcon = lastOpt ? (SLUG_ICONS[lastOpt.slug] ?? null) : null

  // Gender-aware copy
  const genderSlug = selectedSlugs.find(s => s.startsWith('genero-'))
  const isMale = genderSlug === 'genero-masculino'
  const greetVerb = isMale ? 'listo' : 'lista'

  // Summary answers for interstitial (top 2 single-choice answers already given)
  const summaryAnswers = useMemo(() => {
    const result: string[] = []
    for (const g of groups) {
      for (const q of g.quiz_questions) {
        if (q.type !== 'single') continue
        const ids = answers[q.id] ?? []
        if (ids.length === 1) {
          const text = optionTextMap[ids[0]]
          if (text && !text.toLowerCase().includes('ninguna')) result.push(text)
        }
        if (result.length >= 2) break
      }
      if (result.length >= 2) break
    }
    return result
  }, [answers, groups, optionTextMap])

  const handleSelect = (optId: string) => {
    if (step?.kind !== 'question') return
    const q = step.question
    if (q.type === 'multi') {
      const slug = optionSlugMap[optId]
      const ningunaId = q.quiz_question_options.find(o => o.slug.startsWith('sin-'))?.id
      if (ningunaId && slug?.startsWith('sin-')) {
        setSelected([optId])
      } else {
        setSelected(prev => {
          const withoutNinguna = ningunaId ? prev.filter(id => id !== ningunaId) : prev
          return withoutNinguna.includes(optId)
            ? withoutNinguna.filter(x => x !== optId)
            : [...withoutNinguna, optId]
        })
      }
    } else {
      setSelected([optId])
    }
  }

  const advanceStep = (newAnswers: Record<string, string[]>, nextIdx: number) => {
    setFading(true)
    setTimeout(() => {
      setAnswers(newAnswers)
      setSelected([])
      setStepIdx(nextIdx)
      setFading(false)
    }, 150)
  }

  const next = async () => {
    if (step?.kind === 'question') {
      const newAnswers = { ...answers, [step.question.id]: selected }
      addAnswer({ questionId: step.question.id, optionIds: selected })
      if (isLast) {
        setAnswers(newAnswers)
        setSelected([])
        if (isLoggedIn) { submitLead(newAnswers); return }
        setLeadStep(true)
        return
      }
      advanceStep(newAnswers, stepIdx + 1)
    } else {
      if (isLast) {
        if (isLoggedIn) { submitLead(answers); return }
        setLeadStep(true)
        return
      }
      setFading(true)
      setTimeout(() => { setStepIdx(stepIdx + 1); setFading(false) }, 150)
    }
  }

  const goBack = () => {
    if (stepIdx > 0) {
      setFading(true)
      setTimeout(() => { setStepIdx(stepIdx - 1); setFading(false) }, 150)
    } else {
      router.back()
    }
  }

  const submitLead = async (finalAnswers?: Record<string, string[]>) => {
    setLoading(true)
    setSubmitError(null)
    setTemplateId(templateId)
    const answersToSend = finalAnswers ?? answers
    try {
      const payload: Record<string, unknown> = { templateId, answers: answersToSend }
      if (leadEmail) payload.email = leadEmail
      if (leadPhone) payload.phone = leadPhone
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError('Hubo un error. Intenta de nuevo.'); return }
      if (data.profileId) {
        setProfileId(data.profileId)
        complete()
        if (data.sessionToken) {
          document.cookie = `liora_session=${data.sessionToken}; path=/; max-age=2592000; SameSite=Lax`
        }
        if (leadEmail && !isLoggedIn) {
          const supa = createBrowserClient()
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/carrito?profileId=${data.profileId}`)}`
          supa.auth.signInWithOtp({
            email: leadEmail,
            options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
          }).catch(() => {})
        }
        router.push(`/carrito?profileId=${data.profileId}`)
      }
    } catch {
      setSubmitError('Error de conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (leadStep) {
    const TRUST_SIGNALS = [
      { icon: <ShieldCheck size={18} weight="bold" />, label: 'Nunca compartimos tu data' },
      { icon: <EnvelopeSimple size={18} weight="bold" />, label: 'Te enviamos solo lo que pediste' },
      { icon: <XCircle size={18} weight="bold" />, label: 'Te desuscribes con un click' },
    ]
    return (
      <section className="liora-cart-outer" style={{ background: 'var(--liora-crema)', minHeight: '78vh', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1080, width: '100%' }}>
          <button onClick={() => setLeadStep(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, marginBottom: 32, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} weight="bold" /> Volver
          </button>
          <div className="liora-quiz-lead-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 0, background: 'var(--liora-blanco)', borderRadius: 32, border: '1.5px solid var(--liora-arena)', overflow: 'hidden', boxShadow: 'var(--shadow-2)' }}>
            {/* Left panel */}
            <div style={{ background: 'var(--cat-mostaza)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32, minHeight: 540 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--liora-uva)', color: 'var(--liora-lima)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} weight="bold" />
                </span>
                Cuestionario completo · 100%
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, paddingBottom: 8, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Tu kit ya está {greetVerb}.</h1>
                <p style={{ fontFamily: 'var(--font-script)', fontWeight: 600, fontSize: 36, lineHeight: 1.15, color: 'var(--liora-uva)', margin: 0, paddingBottom: 8 }}>¿a dónde te lo enviamos?</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1.5, color: 'var(--liora-uva)', opacity: 0.85, marginTop: 20, maxWidth: 380, marginBottom: 0 }}>
                  Te mandamos tu diagnóstico + kit personalizado. Sin spam — palabra de LIORA.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {TRUST_SIGNALS.map(({ icon, label }) => (
                  <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--liora-uva)' }}>
                    {icon}{label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {isLoggedIn && userEmail ? (
                <>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: 'var(--liora-uva)', margin: '0 0 8px' }}>
                    {userName ? `Todo listo, ${userName}.` : 'Todo listo.'}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', opacity: 0.75, margin: '0 0 28px', lineHeight: 1.5 }}>
                    Tu kit se enviará a <strong>{userEmail}</strong>
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, opacity: 0.7 }}>1 paso · 20 segundos</div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.1, color: 'var(--liora-uva)', margin: 0 }}>Cuéntanos cómo te ubicamos.</h2>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 28 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email <span style={{ color: '#C2433A' }}>·</span></span>
                    <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="cami@email.com" style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', outline: 'none' }} />
                  </label>
                </>
              )}

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: isLoggedIn ? 0 : 16 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>WhatsApp <span style={{ opacity: 0.5 }}>(opcional)</span></span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--liora-uva)', flexShrink: 0 }}>🇵🇪 +51</div>
                  <input type="tel" value={leadPhone} onChange={e => setLeadPhone(e.target.value)} placeholder="987 654 321" style={{ flex: 1, background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', outline: 'none' }} />
                </div>
              </label>

              <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={whatsappConsent} onChange={e => setWhatsappConsent(e.target.checked)} style={{ display: 'none' }} />
                <span style={{ width: 22, height: 22, borderRadius: 6, background: whatsappConsent ? 'var(--liora-uva)' : 'transparent', border: '1.5px solid var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--liora-crema)', flexShrink: 0 }}>
                  {whatsappConsent && <Check size={13} weight="bold" />}
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', lineHeight: 1.4 }}>Quiero recibir mi tracking + tips por WhatsApp</span>
              </label>

              {submitError && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#C2433A', marginTop: 16, marginBottom: 0 }}>{submitError}</p>}

              <button
                onClick={() => (isLoggedIn || validEmail) && !loading && submitLead()}
                disabled={(!isLoggedIn && !validEmail) || loading}
                style={{
                  background: (isLoggedIn || validEmail) ? 'var(--liora-uva)' : 'var(--liora-arena)',
                  color: (isLoggedIn || validEmail) ? 'var(--liora-crema)' : 'var(--liora-uva)',
                  opacity: (isLoggedIn || validEmail) ? 1 : 0.6,
                  border: 'none', borderRadius: 999, padding: '17px 24px',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16,
                  cursor: (isLoggedIn || validEmail) && !loading ? 'pointer' : 'not-allowed',
                  marginTop: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}>
                {loading ? 'Armando tu kit…' : 'Ver mi kit personalizado'}{!loading && <ArrowRight size={18} weight="bold" />}
              </button>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 16, marginBottom: 0 }}>
                Al continuar aceptas que te enviemos tu diagnóstico. Tus datos se guardan según nuestra{' '}
                <a href="/privacidad" style={{ textDecoration: 'underline', color: 'inherit' }}>política de privacidad</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!step) return null

  return (
    <section className="liora-cart-outer" style={{ background: 'var(--liora-crema)', minHeight: '80vh', padding: '32px 48px 96px' }}>
      <div ref={quizTopRef} style={{ scrollMarginTop: 120 }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 900, margin: '0 auto 16px' }}>
        <button onClick={goBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={18} weight="bold" />
          {stepIdx > 0 ? 'Anterior' : 'Salir'}
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7 }}>
          {userName ? `Hola, ${userName} · ` : ''}{step.kind === 'question' ? (currentQuestionNum === 1 ? 'Pregunta 1' : `Pregunta ${currentQuestionNum} / ${questionCount}`) : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 900, margin: '0 auto 24px', position: 'relative' }}>
        <div style={{ height: 8, background: 'var(--liora-arena)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--liora-uva)', borderRadius: 999, transition: 'width 400ms cubic-bezier(0.22,1,0.36,1)' }} />
        </div>
      </div>

      {/* Step content — animated */}
      <div style={{
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'opacity 150ms ease, transform 150ms ease',
      }}>
        {step.kind === 'question' ? (
          <div className="liora-quiz-content" style={{ maxWidth: 760, margin: '0 auto' }}>
            {step.question.type === 'multi' && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '3px 12px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Puedes elegir varias</span>
              </div>
            )}
            <h2 className="liora-quiz-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isFirstStep ? 52 : 44, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              {step.question.text}
            </h2>
            {step.question.subtext && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 16, marginBottom: 0 }}>{step.question.subtext}</p>
            )}
            {manyOptions && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 8, marginBottom: 0 }}>
                Elige una de {step.question.quiz_question_options.length} opciones
              </p>
            )}
            <div className={`liora-quiz-options-grid${manyOptions ? ' liora-quiz-options-grid-many' : ''}`} style={{ display: 'grid', gridTemplateColumns: manyOptions ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: manyOptions ? 12 : 16, marginTop: manyOptions ? 20 : 28, paddingBottom: 8 }}>
              {mainOpts.map((opt, i) => {
                const isSelected = selected.includes(opt.id)
                const PhosphorIcon = SLUG_ICONS[opt.slug]
                const iconSize = compactCards ? 40 : 52
                return (
                  <button key={opt.id} onClick={() => handleSelect(opt.id)}
                    className="liora-quiz-option"
                    style={{
                      background: isSelected ? OPTION_COLORS[i % OPTION_COLORS.length] : 'var(--liora-blanco)',
                      border: isSelected ? '2px solid #4A173F' : '1.5px solid var(--liora-arena)',
                      borderRadius: 24, padding: compactCards ? '14px 18px' : '22px 26px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                      outline: 'none', userSelect: 'none',
                      transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? '0 10px 30px rgba(61,26,58,0.14)' : 'none',
                    }}>
                    <div style={{
                      width: iconSize, height: iconSize, borderRadius: 16,
                      background: isSelected ? 'var(--liora-uva)' : OPTION_COLORS[i % OPTION_COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: isSelected ? 'var(--liora-crema)' : 'var(--liora-uva)',
                    }}>
                      {opt.icon_url
                        ? <img src={opt.icon_url} alt="" style={{ width: compactCards ? 22 : 28, height: compactCards ? 22 : 28 }} />
                        : isSelected
                          ? <Check size={compactCards ? 18 : 22} weight="bold" />
                          : PhosphorIcon
                            ? <PhosphorIcon size={compactCards ? 20 : 24} weight="bold" />
                            : <Sparkle size={compactCards ? 18 : 22} weight="fill" />
                      }
                    </div>
                    <span className="liora-quiz-option-text" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: compactCards ? 16 : 20, color: 'var(--liora-uva)', lineHeight: 1.1 }}>{opt.text}</span>
                  </button>
                )
              })}
            </div>
            {lastOpt && (
              <button
                onClick={() => handleSelect(lastOpt.id)}
                className="liora-quiz-option liora-quiz-option-guide"
                style={{
                  width: '100%', marginTop: 12,
                  background: selected.includes(lastOpt.id) ? 'var(--cat-lavanda)' : 'var(--liora-blanco)',
                  border: selected.includes(lastOpt.id) ? '2px solid #4A173F' : '1.5px solid var(--liora-arena)',
                  borderRadius: 20, padding: '16px 24px',
                  display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                  cursor: 'pointer', outline: 'none', userSelect: 'none',
                  boxShadow: selected.includes(lastOpt.id) ? '0 10px 30px rgba(61,26,58,0.14)' : 'none',
                  transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: selected.includes(lastOpt.id) ? 'var(--liora-uva)' : 'var(--cat-lavanda)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: selected.includes(lastOpt.id) ? 'var(--liora-crema)' : 'var(--liora-uva)',
                }}>
                  {selected.includes(lastOpt.id)
                    ? <Check size={16} weight="bold" />
                    : LastOptIcon ? <LastOptIcon size={18} weight="bold" /> : <Sparkle size={18} weight="fill" />}
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{lastOpt.text}</span>
              </button>
            )}
            <div className="liora-quiz-actions" style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={next}
                disabled={selected.length === 0}
                style={{
                  background: selected.length === 0 ? 'transparent' : 'var(--liora-uva)',
                  color: selected.length === 0 ? 'rgba(61,26,58,0.4)' : 'var(--liora-crema)',
                  border: selected.length === 0 ? '2px solid rgba(61,26,58,0.25)' : 'none',
                  borderRadius: 999, padding: '18px 40px',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17,
                  cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  boxShadow: selected.length === 0 ? 'none' : 'var(--shadow-3)',
                  outline: 'none', userSelect: 'none',
                }}>
                {isLast ? 'Ver mi kit' : 'Siguiente'}
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        ) : (
          <div className="liora-quiz-content" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--liora-lima)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkle size={16} weight="fill" style={{ color: 'var(--liora-uva)' }} />
              </span>
              Ya casi {greetVerb} · Te tenemos
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 24px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
              Buenas noticias antes de seguir.
            </h2>
            {summaryAnswers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                {summaryAnswers.map(a => (
                  <span key={a} style={{ background: 'rgba(61,26,58,0.08)', borderRadius: 999, padding: '6px 16px', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--liora-uva)' }}>
                    {a}
                  </span>
                ))}
              </div>
            )}
            <p style={{ fontFamily: 'var(--font-script)', fontSize: 28, color: 'var(--liora-uva)', margin: '0 0 40px' }}>
              {step.group.interstitial_text}
            </p>
            <div className="liora-quiz-actions" style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={next}
                style={{
                  background: 'var(--liora-uva)', color: 'var(--liora-crema)',
                  border: 'none', borderRadius: 999, padding: '18px 40px',
                  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
                  boxShadow: 'var(--shadow-3)',
                }}>
                Continuar
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

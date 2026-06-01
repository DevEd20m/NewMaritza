'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Sparkle, ShieldCheck, EnvelopeSimple, XCircle, Check } from '@phosphor-icons/react'
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
}

const OPTION_COLORS = ['var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-lavanda)', 'var(--cat-menta)', 'var(--cat-cielo)', 'var(--cat-rosa)']

export function QuizClient({ templateId, groups, isLoggedIn = false }: Props) {
  const router = useRouter()
  const { addAnswer, setTemplateId, setProfileId, complete } = useQuizStore()

  // Build option ID → slug lookup (stable across renders)
  const optionSlugMap = useMemo(() => {
    const map: Record<string, string> = {}
    groups.forEach(g => g.quiz_questions.forEach(q =>
      q.quiz_question_options.forEach(o => { map[o.id] = o.slug })
    ))
    return map
  }, [groups])

  // All possible steps in sorted order (questions + interstitials)
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
  const validEmail = /\S+@\S+\.\S+/.test(leadEmail)

  // All slugs selected so far — used for conditional question logic
  const selectedSlugs = useMemo(
    () => Object.values(answers).flat().map(id => optionSlugMap[id]).filter(Boolean),
    [answers, optionSlugMap]
  )

  // Filter steps based on conditions using current answers
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

  const handleSelect = (optId: string) => {
    if (step?.kind !== 'question') return
    const q = step.question
    if (q.type === 'multi') {
      const slug = optionSlugMap[optId]
      const ningunaId = q.quiz_question_options.find(o => o.slug === 'sin-restriccion')?.id
      if (slug === 'sin-restriccion') {
        // "Ninguna" clears everything else
        setSelected([optId])
      } else {
        setSelected(prev => {
          const withoutNinguna = prev.filter(id => id !== ningunaId)
          return withoutNinguna.includes(optId)
            ? withoutNinguna.filter(x => x !== optId)
            : [...withoutNinguna, optId]
        })
      }
    } else {
      setSelected([optId])
    }
  }

  const next = async () => {
    if (step?.kind === 'question') {
      const newAnswers = { ...answers, [step.question.id]: selected }
      setAnswers(newAnswers)
      addAnswer({ questionId: step.question.id, optionIds: selected })
    }
    setSelected([])

    if (isLast) {
      if (isLoggedIn) { submitLead(); return }
      setLeadStep(true)
      return
    }
    setStepIdx(stepIdx + 1)
  }

  const submitLead = async () => {
    setLoading(true)
    setSubmitError(null)
    setTemplateId(templateId)
    try {
      const payload: Record<string, unknown> = { templateId, answers }
      if (leadEmail) payload.email = leadEmail
      if (leadPhone) payload.phone = leadPhone
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError('Hubo un error al procesar tu solicitud. Intenta de nuevo.'); return }
      if (data.profileId) {
        setProfileId(data.profileId)
        complete()

        // Send magic link so the lead can create / log into their account
        // Non-blocking: user goes to kit immediately, email arrives in background
        if (leadEmail) {
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
      <section style={{ background: 'var(--liora-crema)', minHeight: '78vh', padding: '32px 48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 1080, width: '100%' }}>
          <button onClick={() => setLeadStep(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, marginBottom: 32, opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeft size={16} weight="bold" /> Volver al cuestionario
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 0, background: 'var(--liora-blanco)', borderRadius: 32, border: '1.5px solid var(--liora-arena)', overflow: 'hidden', boxShadow: 'var(--shadow-2)' }}>
            <div style={{ background: 'var(--cat-mostaza)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32, minHeight: 540 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--liora-uva)', color: 'var(--liora-lima)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} weight="bold" />
                </span>
                Cuestionario completo · 100%
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, paddingBottom: 8, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Tu kit ya está listo.</h1>
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
            <div style={{ padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, opacity: 0.7 }}>1 paso · 20 segundos</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, lineHeight: 1.1, color: 'var(--liora-uva)', margin: 0 }}>Cuéntanos cómo te ubicamos.</h2>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 28 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email <span style={{ color: '#C2433A' }}>·</span></span>
                <input type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} placeholder="cami@email.com" style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 14, padding: '14px 18px', fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', outline: 'none' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
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
              <button onClick={() => validEmail && !loading && submitLead()} disabled={!validEmail || loading}
                style={{ background: validEmail ? 'var(--liora-uva)' : 'var(--liora-arena)', color: validEmail ? 'var(--liora-crema)' : 'var(--liora-uva)', opacity: validEmail ? 1 : 0.6, border: 'none', borderRadius: 999, padding: '17px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, cursor: validEmail && !loading ? 'pointer' : 'not-allowed', marginTop: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
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
    <section style={{ background: 'var(--liora-crema)', minHeight: '80vh', padding: '32px 48px 120px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 900, margin: '0 auto 32px' }}>
        <button onClick={() => stepIdx > 0 ? setStepIdx(stepIdx - 1) : router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={18} weight="bold" /> Salir del cuestionario
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.7 }}>
          Paso {stepIdx + 1} / {visibleSteps.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth: 900, margin: '0 auto 56px', height: 8, background: 'var(--liora-arena)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--liora-uva)', borderRadius: 999, transition: 'width 400ms cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

      {step.kind === 'question' ? (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>Pregunta {currentQuestionNum} de {questionCount}</span>
            {step.question.type === 'multi' && (
              <span style={{ background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '2px 10px', fontSize: 10 }}>Puedes elegir varias</span>
            )}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {step.question.text}
          </h2>
          {step.question.subtext && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 16, marginBottom: 40 }}>{step.question.subtext}</p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 40 }}>
            {step.question.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order).map((opt, i) => {
              const isSelected = selected.includes(opt.id)
              return (
                <button key={opt.id} onClick={() => handleSelect(opt.id)} style={{
                  background: isSelected ? OPTION_COLORS[i % OPTION_COLORS.length] : 'var(--liora-blanco)',
                  border: isSelected ? '2.5px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)',
                  borderRadius: 24, padding: '22px 26px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                  transition: 'all 220ms cubic-bezier(0.22,1,0.36,1)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: isSelected ? 'var(--liora-uva)' : OPTION_COLORS[i % OPTION_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 28, color: isSelected ? 'var(--liora-crema)' : 'var(--liora-uva)' }}>
                    {opt.icon_url ? <img src={opt.icon_url} alt="" style={{ width: 28, height: 28 }} /> : (isSelected ? <Check size={22} weight="bold" /> : '✦')}
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--liora-uva)', lineHeight: 1.1 }}>{opt.text}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--liora-lima)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={16} weight="fill" style={{ color: 'var(--liora-uva)' }} />
            </span>
            Mitad del camino · Te tenemos
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1, color: 'var(--liora-uva)', margin: '0 0 40px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            Buenas noticias antes de seguir.
          </h2>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: 28, color: 'var(--liora-uva)', margin: '24px 0 0' }}>
            {step.group.interstitial_text}
          </p>
        </div>
      )}

      {/* Fixed next button */}
      <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <button onClick={next} disabled={step.kind === 'question' && selected.length === 0}
          style={{
            background: step.kind === 'question' && selected.length === 0 ? 'var(--liora-arena)' : 'var(--liora-uva)',
            color: 'var(--liora-crema)',
            opacity: step.kind === 'question' && selected.length === 0 ? 0.6 : 1,
            border: 'none', borderRadius: 999, padding: '18px 40px',
            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17,
            cursor: step.kind === 'question' && selected.length === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            boxShadow: 'var(--shadow-3)',
          }}>
          {step.kind === 'insight' ? 'Continuar' : (isLast ? 'Ver mi kit' : 'Siguiente')}
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </section>
  )
}

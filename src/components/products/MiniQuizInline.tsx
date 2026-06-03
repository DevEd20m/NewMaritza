'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Sparkle } from '@phosphor-icons/react'

interface MiniOption { id: string; text: string; slug: string; sort_order: number }
interface MiniQuestion { id: string; text: string; subtext: string | null; type: string; quiz_question_options: MiniOption[] }
interface MiniGroup { quiz_questions: MiniQuestion[] }

interface Props {
  templateId: string
  groups: MiniGroup[]
  kitName: string
}

const OPTION_COLORS = ['var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-lavanda)', 'var(--cat-menta)']

export function MiniQuizInline({ templateId, groups, kitName }: Props) {
  const router = useRouter()
  const questions = groups.flatMap(g =>
    g.quiz_questions.sort((a, b) => (a as any).sort_order - (b as any).sort_order)
  )

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const q = questions[step]
  const isLast = step === questions.length - 1

  const handleSelect = (optId: string) => {
    if (q.type === 'multi') {
      setSelected(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId])
    } else {
      setSelected([optId])
    }
  }

  const next = async () => {
    const newAnswers = { ...answers, [q.id]: selected }
    setAnswers(newAnswers)
    setSelected([])

    if (!isLast) { setStep(step + 1); return }

    // Submit and redirect to cart
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, answers: newAnswers }),
      })
      const data = await res.json()
      setDone(true)
      if (data.profileId) {
        setTimeout(() => router.push(`/carrito?profileId=${data.profileId}`), 1200)
      }
    } catch {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ background: 'var(--liora-lima)', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={22} weight="bold" color="var(--liora-crema)" />
        </span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--liora-uva)' }}>Kit personalizado listo.</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 2 }}>Llevándote al carrito…</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {questions.map((_, i) => (
          <div key={i} style={{ width: i <= step ? 24 : 8, height: 8, borderRadius: 999, background: i < step ? 'var(--liora-uva)' : i === step ? 'var(--liora-uva)' : 'var(--liora-arena)', opacity: i > step ? 0.4 : 1, transition: 'all 300ms ease' }} />
        ))}
      </div>

      {/* Question */}
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.5, marginBottom: 8 }}>
        Pregunta {step + 1} de {questions.length}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.1, color: 'var(--liora-uva)', margin: '0 0 6px', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
        {q.text}
      </h3>
      {q.subtext && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.65, margin: '0 0 20px' }}>{q.subtext}</p>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {q.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order).map((opt, i) => {
          const isSel = selected.includes(opt.id)
          return (
            <button key={opt.id} onClick={() => handleSelect(opt.id)} style={{
              background: isSel ? OPTION_COLORS[i % OPTION_COLORS.length] : 'var(--liora-crema)',
              border: isSel ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)',
              borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
              transition: 'all 180ms ease',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: isSel ? 'var(--liora-uva)' : OPTION_COLORS[i % OPTION_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isSel ? <Check size={14} weight="bold" color="var(--liora-crema)" /> : <Sparkle size={14} weight="fill" color="var(--liora-uva)" style={{ opacity: 0.6 }} />}
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{opt.text}</span>
            </button>
          )
        })}
      </div>

      {/* Next button */}
      <button onClick={next} disabled={selected.length === 0 || loading}
        style={{ background: selected.length > 0 ? 'var(--liora-uva)' : 'var(--liora-arena)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '14px 28px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: selected.length > 0 ? 1 : 0.5 }}>
        {loading ? 'Armando tu kit…' : isLast ? 'Ver mi kit personalizado' : 'Siguiente'}
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  )
}

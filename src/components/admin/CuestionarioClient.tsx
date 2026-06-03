'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PencilSimple, Check, X, ChatCircle, Funnel, Export, Warning, ArrowSquareOut, Users, ChartBar } from '@phosphor-icons/react'

export interface AdminQuizOption { id: string; text: string; slug: string; sort_order: number }

export interface AdminQuizQuestion {
  id: string; text: string; subtext: string | null; type: 'single' | 'multi'
  sort_order: number; conditions: { if_any_slug?: string[] } | null
  quiz_question_options: AdminQuizOption[]
}

export interface AdminQuizGroup {
  id: string; title: string; sort_order: number; interstitial_text: string | null
  quiz_questions: AdminQuizQuestion[]
}

export interface AdminMiniKit {
  templateId: string; kitId: string; kitName: string; kitSlug: string
  groups: AdminQuizGroup[]
}

export interface AdminLead {
  id: string; email: string; phone: string | null; source: string | null; created_at: string
}

interface Props {
  groups: AdminQuizGroup[]
  miniKits: AdminMiniKit[]
  leads: AdminLead[]
  totalProfiles: number
  topOptions: { question_text: string; option_text: string; count: number }[]
}

const KIT_COLORS: Record<string, string> = {
  energia: 'var(--cat-mostaza)', piel: 'var(--cat-coral)',
  'post-entreno': 'var(--cat-durazno)', reset: 'var(--cat-menta)', detox: 'var(--cat-menta)',
}
function kitColor(slug: string) {
  for (const [k, v] of Object.entries(KIT_COLORS)) if (slug.includes(k)) return v
  return 'var(--cat-lavanda)'
}

// ─── Inline editable text ──────────────────────────────────────────────────
function InlineEdit({ value, onSave, multiline = false, placeholder, style }: {
  value: string; onSave: (v: string) => Promise<void>; multiline?: boolean
  placeholder?: string; style?: React.CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null)

  const start = () => { setDraft(value); setEditing(true); setTimeout(() => ref.current?.focus(), 30) }
  const cancel = () => { setDraft(value); setEditing(false) }
  const save = async () => {
    if (draft === value) { setEditing(false); return }
    setSaving(true); await onSave(draft); setSaving(false); setEditing(false)
  }

  if (!editing) return (
    <span onClick={start} title="Click para editar"
      style={{ cursor: 'text', borderRadius: 6, padding: '2px 4px', transition: 'background 120ms', ...style }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(61,26,58,0.06)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      {value || <span style={{ opacity: 0.35 }}>{placeholder ?? 'Sin texto'}</span>}
      <PencilSimple size={11} style={{ marginLeft: 5, opacity: 0.35, verticalAlign: 'middle' }} />
    </span>
  )

  const inputStyle: React.CSSProperties = {
    fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit',
    background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)',
    borderRadius: 8, padding: '4px 8px', outline: 'none', resize: 'vertical',
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 6, width: '100%' }}>
      {multiline
        ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} value={draft} onChange={e => setDraft(e.target.value)} rows={2} style={{ ...inputStyle, width: '100%' }} onKeyDown={e => { if (e.key === 'Escape') cancel() }} />
        : <input ref={ref as React.Ref<HTMLInputElement>} value={draft} onChange={e => setDraft(e.target.value)} style={{ ...inputStyle, minWidth: 160 }} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }} />
      }
      <button onClick={save} disabled={saving} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}><Check size={12} weight="bold" /></button>
      <button onClick={cancel} style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}><X size={12} weight="bold" /></button>
    </span>
  )
}

// ─── Question tree (reused for main quiz and mini-quizzes) ─────────────────
function QuestionTree({ groups, onPatch }: { groups: AdminQuizGroup[]; onPatch: (url: string, body: Record<string, unknown>) => Promise<void> }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(groups.map(g => g.id)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map((group, gi) => {
        const open = expanded.has(group.id)
        return (
          <div key={group.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Group row */}
            <div onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(group.id) ? n.delete(group.id) : n.add(group.id); return n })}
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: gi % 2 === 0 ? 'var(--liora-crema)' : 'var(--liora-blanco)' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                Sección {group.sort_order}
              </span>
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>
                <InlineEdit value={group.title} onSave={v => onPatch(`/api/admin/quiz/groups/${group.id}`, { title: v })} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }} />
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.4 }}>{group.quiz_questions.length} preguntas {open ? '▲' : '▼'}</span>
            </div>

            {/* Interstitial message */}
            {open && (
              <div style={{ padding: '8px 18px', background: 'var(--cat-mostaza)', display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: '1px solid rgba(61,26,58,0.1)' }}>
                <ChatCircle size={15} weight="bold" style={{ marginTop: 3, flexShrink: 0, opacity: 0.7 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3, opacity: 0.7 }}>
                    Mensaje de pausa — aparece entre esta sección y la siguiente
                  </div>
                  <InlineEdit
                    value={group.interstitial_text ?? ''}
                    placeholder="Sin mensaje — click para agregar uno"
                    multiline
                    onSave={v => onPatch(`/api/admin/quiz/groups/${group.id}`, { interstitial_text: v || null })}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}
                  />
                </div>
              </div>
            )}

            {/* Questions */}
            {open && group.quiz_questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
              <div key={q.id} style={{ borderTop: '1px solid var(--liora-arena)', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.4, flexShrink: 0, marginTop: 2 }}>{qi + 1}</span>
                  <div style={{ flex: 1 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ background: q.type === 'multi' ? 'var(--cat-lavanda)' : 'var(--liora-arena)', borderRadius: 999, padding: '2px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', textTransform: 'uppercase' }}>
                        {q.type === 'multi' ? 'Multi-respuesta' : 'Una respuesta'}
                      </span>
                      {q.conditions?.if_any_slug && (
                        <span style={{ background: 'var(--cat-coral)', borderRadius: 999, padding: '2px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Funnel size={9} weight="bold" />
                          Solo aparece si eligió: {q.conditions.if_any_slug.join(', ')}
                        </span>
                      )}
                    </div>
                    {/* Question text */}
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--liora-uva)', marginBottom: 4 }}>
                      <InlineEdit value={q.text} onSave={v => onPatch(`/api/admin/quiz/questions/${q.id}`, { text: v })} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }} />
                    </div>
                    {/* Subtext */}
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6 }}>
                      <InlineEdit value={q.subtext ?? ''} placeholder="Sin descripción — click para agregar" onSave={v => onPatch(`/api/admin/quiz/questions/${q.id}`, { subtext: v || null })} style={{ fontFamily: 'var(--font-body)', fontSize: 13 }} />
                    </div>
                    {/* Options grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginTop: 10 }}>
                      {q.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order).map(opt => (
                        <div key={opt.id} style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 10, padding: '8px 12px' }}>
                          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', marginBottom: 3 }}>
                            <InlineEdit value={opt.text} onSave={v => onPatch(`/api/admin/quiz/options/${opt.id}`, { text: v })} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, opacity: 0.4 }}>slug:</span>
                            <code style={{ fontFamily: 'monospace', fontSize: 9, background: 'var(--liora-arena)', borderRadius: 4, padding: '1px 5px', color: 'var(--liora-uva)' }}>
                              <InlineEdit value={opt.slug} onSave={v => onPatch(`/api/admin/quiz/options/${opt.id}`, { slug: v })} style={{ fontFamily: 'monospace', fontSize: 9 }} />
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export function CuestionarioClient({ groups, miniKits, leads, totalProfiles, topOptions }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'main' | 'mini' | 'leads' | 'analytics'>('main')
  const [selectedMiniKit, setSelectedMiniKit] = useState<string | null>(null)
  const [leadSearch, setLeadSearch] = useState('')

  const patch = async (url: string, body: Record<string, unknown>) => {
    await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    router.refresh()
  }

  const filteredLeads = leadSearch
    ? leads.filter(l => l.email.toLowerCase().includes(leadSearch.toLowerCase()) || (l.phone ?? '').includes(leadSearch))
    : leads

  const exportLeads = () => {
    const csv = ['Email,Teléfono,Fuente,Fecha', ...leads.map(l =>
      `${l.email},${l.phone ?? ''},${l.source ?? ''},${new Date(l.created_at).toLocaleDateString('es-PE')}`
    )].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads-liora.csv'; a.click()
  }

  const activeMiniKit = miniKits.find(k => k.kitId === selectedMiniKit) ?? miniKits[0] ?? null

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Marketing</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Cuestionario</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
          {totalProfiles} perfiles · {leads.length} leads · Click en cualquier texto para editarlo
        </p>
      </div>

      {/* Top-level nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {/* Main quiz */}
        <button onClick={() => setView('main')}
          style={{ background: view === 'main' ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: view === 'main' ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (view === 'main' ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>Cuestionario principal</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>8 preguntas para todas</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 6, lineHeight: 1.4 }}>Las clientas lo responden al entrar a /cuestionario. Al final reciben un kit personalizado por IA.</div>
        </button>

        {/* Mini quizzes */}
        <button onClick={() => setView('mini')}
          style={{ background: view === 'mini' ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: view === 'mini' ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (view === 'mini' ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>Mini-cuestionarios</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>3 preguntas por kit</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 6, lineHeight: 1.4 }}>Aparecen en la página de cada kit. Solo preguntas específicas para ese kit.</div>
        </button>

        {/* Leads */}
        <button onClick={() => setView('leads')}
          style={{ background: view === 'leads' ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: view === 'leads' ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (view === 'leads' ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>Leads</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{leads.length} emails</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 6, lineHeight: 1.4 }}>Clientas que dejaron email al terminar el cuestionario. Exportable a CSV.</div>
        </button>

        {/* Analytics */}
        <button onClick={() => setView('analytics')}
          style={{ background: view === 'analytics' ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: view === 'analytics' ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (view === 'analytics' ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>Analytics</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, lineHeight: 1.1, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{totalProfiles} perfiles</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, opacity: 0.65, marginTop: 6, lineHeight: 1.4 }}>Qué están respondiendo las clientas. Qué opciones ganan más.</div>
        </button>
      </div>

      {/* ── MAIN QUIZ VIEW ─────────────────────────────────────────── */}
      {view === 'main' && (
        <div>
          {/* Context banner */}
          <div style={{ background: 'var(--cat-menta)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'var(--liora-crema)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18 }}>8</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)' }}>Cuestionario principal — todas las clientas lo responden</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 3, lineHeight: 1.5 }}>
                Este cuestionario está en <strong>/cuestionario</strong>. Las clientas responden 8 preguntas (o menos si algunas son condicionales) y al final reciben una recomendación de kit personalizada por IA. Puedes editar cualquier texto haciendo click en él.
              </div>
            </div>
            <a href="/cuestionario" target="_blank" style={{ marginLeft: 'auto', background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '8px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <ArrowSquareOut size={12} weight="bold" /> Ver en vivo
            </a>
          </div>
          <QuestionTree groups={groups} onPatch={patch} />
        </div>
      )}

      {/* ── MINI QUIZZES VIEW ──────────────────────────────────────── */}
      {view === 'mini' && (
        <div>
          {/* Context banner */}
          <div style={{ background: 'var(--cat-lavanda)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--liora-uva)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'var(--liora-crema)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16 }}>3</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)' }}>Mini-cuestionarios — uno por cada kit, solo en su página</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 3, lineHeight: 1.5 }}>
                Cada kit tiene 3 preguntas muy específicas que aparecen en <strong>/tienda/kit/[nombre-kit]</strong>. Solo las ve quien ya está interesada en ese kit. Son mucho más directas que el cuestionario general.
              </div>
            </div>
          </div>

          {/* Kit selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
            {miniKits.map(k => {
              const bg = kitColor(k.kitSlug)
              const isActive = (selectedMiniKit ?? miniKits[0]?.kitId) === k.kitId
              return (
                <button key={k.kitId} onClick={() => setSelectedMiniKit(k.kitId)}
                  style={{ background: isActive ? bg : 'var(--liora-blanco)', border: isActive ? '2px solid var(--liora-uva)' : '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, marginBottom: 4 }}>Mini-quiz</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--liora-uva)', lineHeight: 1.2, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{k.kitName}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 4 }}>
                    {k.groups.reduce((n, g) => n + g.quiz_questions.length, 0)} preguntas
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected kit questions */}
          {activeMiniKit && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: kitColor(activeMiniKit.kitSlug) }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)' }}>Preguntas del {activeMiniKit.kitName}</span>
                <a href={`/tienda/kit/${activeMiniKit.kitSlug}`} target="_blank" style={{ marginLeft: 'auto', color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, textDecoration: 'none', opacity: 0.6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowSquareOut size={12} weight="bold" /> Ver página del kit
                </a>
              </div>
              <QuestionTree groups={activeMiniKit.groups} onPatch={patch} />
            </div>
          )}
        </div>
      )}

      {/* ── LEADS VIEW ─────────────────────────────────────────────── */}
      {view === 'leads' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Buscar email o teléfono…"
              style={{ flex: 1, padding: '10px 16px', border: '1.5px solid var(--liora-arena)', borderRadius: 999, background: 'var(--liora-blanco)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none' }} />
            <button onClick={exportLeads} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Export size={14} weight="bold" /> Exportar CSV
            </button>
          </div>

          {leads.length === 0 ? (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16 }}>
              <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>Aún no hay leads. Cuando una clienta complete el cuestionario y deje su email, aparecerá aquí.</div>
            </div>
          ) : (
            <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', padding: '10px 20px', background: 'var(--liora-crema)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--liora-arena)' }}>
                <span>Email</span><span>Teléfono</span><span>Fuente</span><span>Fecha</span>
              </div>
              {filteredLeads.map((lead, i) => (
                <div key={lead.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 110px 130px', padding: '12px 20px', borderTop: i > 0 ? '1px solid var(--liora-arena)' : undefined, fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{lead.email}</span>
                  <span style={{ opacity: 0.7 }}>{lead.phone ? `+51 ${lead.phone}` : '—'}</span>
                  <span style={{ background: 'var(--liora-arena)', borderRadius: 999, padding: '2px 10px', fontSize: 11, width: 'fit-content' }}>{lead.source ?? '—'}</span>
                  <span style={{ opacity: 0.6 }}>{new Date(lead.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS VIEW ─────────────────────────────────────────── */}
      {view === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Cuestionarios completados', value: totalProfiles, sub: 'Perfiles creados en total' },
              { label: 'Emails capturados', value: leads.length, sub: 'Leads del cuestionario' },
              { label: 'Tasa de email', value: totalProfiles > 0 ? `${Math.round((leads.length / totalProfiles) * 100)}%` : '—', sub: 'Completaron → dejaron email' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: 'var(--liora-uva)' }}>{c.value}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.45, marginTop: 2 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {topOptions.length > 0 ? (
            <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, opacity: 0.7 }}>Qué están eligiendo las clientas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topOptions.map((opt, i) => {
                  const maxCount = topOptions[0]?.count ?? 1
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 50px', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={opt.question_text}>{opt.question_text}</div>
                      <div style={{ position: 'relative', height: 28, background: 'var(--liora-arena)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(opt.count / maxCount) * 100}%`, minWidth: 60, background: 'var(--liora-uva)', borderRadius: 999, display: 'flex', alignItems: 'center', paddingLeft: 12, transition: 'width 600ms ease' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: 'var(--liora-crema)', whiteSpace: 'nowrap' }}>{opt.option_text}</span>
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', textAlign: 'right' }}>{opt.count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '64px 24px', textAlign: 'center', background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16 }}>
              <ChartBar size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>Los datos aparecerán aquí cuando haya clientas que completen el cuestionario.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

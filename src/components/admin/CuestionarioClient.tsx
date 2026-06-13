'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  PencilSimple, Check, X, ChatCircle, Export, ArrowSquareOut,
  Users, ChartBar, Tag, Plus, Trash, Warning,
  RadioButton, CheckSquare, ArrowRight, GitBranch,
} from '@phosphor-icons/react'
import type { AdminTag } from './TagsClient'

export interface AdminQuizOption { id: string; text: string; slug: string; sort_order: number; tag_ids: string[] }
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
  tags: AdminTag[]
}

// Slugs del routing + su color + label legible
// IMPORTANTE: estos slugs deben coincidir exactamente con los slugs de las opciones en Sección 1
const BRANCHES: { slug: string; label: string; color: string; emoji: string }[] = [
  { slug: 'obj-rendimiento', label: 'Rendimiento físico', color: 'var(--cat-durazno)',   emoji: '💪' },
  { slug: 'obj-belleza',     label: 'Piel y cabello',     color: 'var(--cat-coral)',     emoji: '🧴' },
  { slug: 'obj-bienestar',   label: 'Bienestar',          color: 'var(--cat-lavanda)',   emoji: '🌙' },
  { slug: 'obj-digestivo',   label: 'Digestión',          color: 'var(--cat-menta)',     emoji: '🌿' },
  { slug: 'obj-nutricion',   label: 'Nutrición',          color: 'var(--cat-mostaza)',   emoji: '🍊' },
  { slug: 'obj-solar',       label: 'Protección solar',   color: 'var(--cat-cielo)',     emoji: '☀️' },
  { slug: 'obj-viaje',       label: 'Viaje & outdoor',    color: 'var(--cat-uva-clara)', emoji: '🧳' },
  { slug: 'obj-hogar',       label: 'Hogar & botiquín',   color: 'var(--cat-rosa)',      emoji: '🏠' },
  { slug: 'obj-pies-cuerpo', label: 'Pies y cuerpo',      color: 'var(--cat-durazno)',   emoji: '👟' },
  { slug: 'obj-guia',        label: 'Necesita orientación', color: '#EDE8F5',             emoji: '✨' },
]
const BRANCH_MAP = Object.fromEntries(BRANCHES.map(b => [b.slug, b]))

function branchOf(q: AdminQuizQuestion) {
  const slugs = q.conditions?.if_any_slug ?? []
  return BRANCHES.find(b => slugs.includes(b.slug)) ?? null
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

// ─── Tag picker ────────────────────────────────────────────────────────────
function TagPicker({ optionId, selectedIds, tags, onSave }: {
  optionId: string; selectedIds: string[]; tags: AdminTag[]
  onSave: (ids: string[]) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [ids, setIds] = useState(selectedIds)
  const [saving, setSaving] = useState(false)

  const toggle = (id: string) => setIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const save = async () => { setSaving(true); await onSave(ids); setSaving(false); setOpen(false) }

  if (!open) return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
      {ids.length === 0 ? (
        <button onClick={() => setOpen(true)} style={{ background: 'transparent', border: '1px dashed var(--liora-arena)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--liora-uva)', opacity: 0.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Tag size={8} /> asignar tags
        </button>
      ) : (
        <>
          {ids.map(id => {
            const tag = tags.find(t => t.id === id)
            return tag ? (
              <span key={id} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '2px 7px', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600 }}>{tag.name}</span>
            ) : null
          })}
          <button onClick={() => setOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.4, padding: 0 }}>
            <PencilSimple size={9} />
          </button>
        </>
      )}
    </div>
  )

  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)', borderRadius: 8, padding: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {tags.map(tag => {
          const sel = ids.includes(tag.id)
          return (
            <button key={tag.id} onClick={() => toggle(tag.id)} style={{ background: sel ? 'var(--liora-uva)' : 'transparent', color: sel ? 'var(--liora-crema)' : 'var(--liora-uva)', border: `1px solid ${sel ? 'var(--liora-uva)' : 'var(--liora-arena)'}`, borderRadius: 999, padding: '2px 8px', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>
              {tag.name}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={save} disabled={saving} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 6, padding: '3px 10px', fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={() => { setIds(selectedIds); setOpen(false) }} style={{ background: 'transparent', border: '1px solid var(--liora-arena)', borderRadius: 6, padding: '3px 8px', fontFamily: 'var(--font-body)', fontSize: 9, cursor: 'pointer', color: 'var(--liora-uva)' }}>✕</button>
      </div>
    </div>
  )
}

// ─── Conditions editor ─────────────────────────────────────────────────────
function ConditionsBadge({ question, onSave }: {
  question: AdminQuizQuestion
  onSave: (conditions: { if_any_slug: string[] } | null) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>(question.conditions?.if_any_slug ?? [])
  const [saving, setSaving] = useState(false)

  const branch = branchOf(question)

  const toggle = (slug: string) => setSelected(prev =>
    prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
  )
  const save = async () => {
    setSaving(true)
    await onSave(selected.length ? { if_any_slug: selected } : null)
    setSaving(false)
    setOpen(false)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} title="Editar condición de visibilidad"
      style={{
        background: branch ? branch.color : 'var(--liora-arena)',
        border: 'none', borderRadius: 999, padding: '3px 10px',
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
        color: 'var(--liora-uva)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
      }}>
      {branch ? `Rama: ${branch.label}` : 'Aparece siempre'}
      <PencilSimple size={9} />
    </button>
  )

  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)', borderRadius: 10, padding: 12, display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>¿Cuándo aparece esta pregunta?</div>
      <button
        onClick={() => setSelected([])}
        style={{ background: selected.length === 0 ? 'var(--liora-uva)' : 'transparent', color: selected.length === 0 ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
        Siempre (sin condición)
      </button>
      {BRANCHES.map(b => {
        const sel = selected.includes(b.slug)
        return (
          <button key={b.slug} onClick={() => toggle(b.slug)}
            style={{ background: sel ? b.color : 'transparent', color: 'var(--liora-uva)', border: `1.5px solid ${sel ? 'var(--liora-uva)' : 'var(--liora-arena)'}`, borderRadius: 999, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
            {sel && <Check size={10} weight="bold" />}
            Solo si eligió: {b.label}
          </button>
        )
      })}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button onClick={save} disabled={saving} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 6, padding: '5px 12px', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? '…' : 'Guardar'}
        </button>
        <button onClick={() => { setSelected(question.conditions?.if_any_slug ?? []); setOpen(false) }} style={{ background: 'transparent', border: '1px solid var(--liora-arena)', borderRadius: 6, padding: '5px 10px', fontFamily: 'var(--font-body)', fontSize: 10, cursor: 'pointer', color: 'var(--liora-uva)' }}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Question card ─────────────────────────────────────────────────────────
function QuestionCard({ q, qi, groupId, onPatch, onDelete, onAddOption, onDeleteOption, tags }: {
  q: AdminQuizQuestion; qi: number; groupId: string
  onPatch: (url: string, body: Record<string, unknown>) => Promise<void>
  onDelete: (questionId: string) => Promise<void>
  onAddOption: (questionId: string, groupId: string) => Promise<void>
  onDeleteOption: (optionId: string, questionId: string) => Promise<void>
  tags: AdminTag[]
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const branch = branchOf(q)

  const branchColor = branch ? branch.color : 'var(--liora-lima)'

  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderLeft: `4px solid ${branchColor}`, borderRadius: 14, overflow: 'hidden' }}>
      {/* Question header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--liora-arena)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5, flexShrink: 0, marginTop: 2, minWidth: 20 }}>{qi + 1}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: q.type === 'multi' ? 'var(--cat-lavanda)' : 'var(--liora-arena)',
              borderRadius: 999, padding: '2px 10px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, color: 'var(--liora-uva)', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {q.type === 'multi'
                ? <><CheckSquare size={10} weight="bold" /> Varias opciones</>
                : <><RadioButton size={10} weight="bold" /> Una opción</>
              }
            </span>
            <ConditionsBadge
              question={q}
              onSave={conditions => onPatch(`/api/admin/quiz/questions/${q.id}`, { conditions })}
            />
          </div>
          {/* Question text */}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--liora-uva)', marginBottom: 4 }}>
            <InlineEdit value={q.text} onSave={v => onPatch(`/api/admin/quiz/questions/${q.id}`, { text: v })} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }} />
          </div>
          {/* Subtext */}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6 }}>
            <InlineEdit value={q.subtext ?? ''} placeholder="Descripción opcional" onSave={v => onPatch(`/api/admin/quiz/questions/${q.id}`, { subtext: v || null })} style={{ fontFamily: 'var(--font-body)', fontSize: 12 }} />
          </div>
        </div>

        {/* Delete question */}
        <div style={{ flexShrink: 0 }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#C2433A', fontWeight: 600 }}>¿Eliminar?</span>
              <button onClick={() => onDelete(q.id)} style={{ background: '#C2433A', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700 }}>Sí</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: 'transparent', border: '1px solid var(--liora-arena)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--liora-uva)', fontSize: 10 }}>No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} title="Eliminar pregunta"
              style={{ background: 'transparent', border: '1px solid var(--liora-arena)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.45, display: 'flex', alignItems: 'center' }}>
              <Trash size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, marginBottom: 8 }}>
          {q.quiz_question_options.sort((a, b) => a.sort_order - b.sort_order).map(opt => (
            <div key={opt.id} style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 10, padding: '8px 10px', position: 'relative' }}>
              {/* Delete option */}
              <button onClick={() => onDeleteOption(opt.id, q.id)} title="Quitar opción"
                style={{ position: 'absolute', top: 5, right: 5, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.3, padding: 2, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}>
                <X size={10} weight="bold" />
              </button>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: 'var(--liora-uva)', marginBottom: 3, paddingRight: 16 }}>
                <InlineEdit value={opt.text} onSave={v => onPatch(`/api/admin/quiz/options/${opt.id}`, { text: v })} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: tags.length > 0 ? 5 : 0 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, opacity: 0.4 }}>slug:</span>
                <code style={{ fontFamily: 'monospace', fontSize: 9, background: 'var(--liora-arena)', borderRadius: 4, padding: '1px 5px', color: 'var(--liora-uva)' }}>
                  <InlineEdit value={opt.slug} onSave={v => onPatch(`/api/admin/quiz/options/${opt.id}`, { slug: v })} style={{ fontFamily: 'monospace', fontSize: 9 }} />
                </code>
              </div>
              {tags.length > 0 && (
                <TagPicker optionId={opt.id} selectedIds={opt.tag_ids ?? []} tags={tags}
                  onSave={ids => onPatch(`/api/admin/quiz/options/${opt.id}`, { tag_ids: ids })} />
              )}
            </div>
          ))}

          {/* Add option */}
          <button onClick={() => onAddOption(q.id, groupId)}
            style={{ background: 'transparent', border: '1.5px dashed var(--liora-arena)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, minHeight: 52 }}>
            <Plus size={12} weight="bold" /> Agregar opción
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Branch section (questions grouped by obj-* condition) ────────────────
function BranchSection({ branch, questions, groupId, onPatch, onDelete, onAddQuestion, onAddOption, onDeleteOption, tags }: {
  branch: typeof BRANCHES[0] | null
  questions: AdminQuizQuestion[]
  groupId: string
  onPatch: (url: string, body: Record<string, unknown>) => Promise<void>
  onDelete: (questionId: string) => Promise<void>
  onAddQuestion: (groupId: string, condition: string | null) => Promise<void>
  onAddOption: (questionId: string, groupId: string) => Promise<void>
  onDeleteOption: (optionId: string, questionId: string) => Promise<void>
  tags: AdminTag[]
}) {
  const [expanded, setExpanded] = useState(true)
  const isUniversal = !branch
  const label = branch ? `${branch.emoji}  ${branch.label}` : 'Para todos los perfiles'
  const color = branch ? branch.color : 'var(--liora-lima)'

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Branch header */}
      <button onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', background: color, border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 8 : 0 }}>
        {isUniversal
          ? <Users size={14} weight="bold" style={{ flexShrink: 0, color: 'var(--liora-uva)' }} />
          : <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--liora-uva)', flexShrink: 0 }} />
        }
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', flex: 1, textAlign: 'left' }}>{label}</span>
        {isUniversal && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.55, fontStyle: 'italic', marginRight: 8 }}>sin importar el objetivo</span>
        )}
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6 }}>{questions.length} pregunta{questions.length !== 1 ? 's' : ''} {expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16, borderLeft: `3px solid ${color}` }}>
          {questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
            <QuestionCard key={q.id} q={q} qi={qi} groupId={groupId}
              onPatch={onPatch} onDelete={onDelete} onAddOption={onAddOption} onDeleteOption={onDeleteOption} tags={tags} />
          ))}
          <button onClick={() => onAddQuestion(groupId, branch?.slug ?? null)}
            style={{ background: 'transparent', border: `1.5px dashed ${color}`, borderRadius: 12, padding: '10px 16px', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} weight="bold" />
            {isUniversal ? 'Agregar pregunta para todos los perfiles' : `Agregar pregunta en "${branch.label}"`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Quiz editor for a set of groups ──────────────────────────────────────
function QuizEditor({ groups, onPatch, onDeleteQuestion, onAddQuestion, onAddOption, onDeleteOption, tags }: {
  groups: AdminQuizGroup[]
  onPatch: (url: string, body: Record<string, unknown>) => Promise<void>
  onDeleteQuestion: (questionId: string) => Promise<void>
  onAddQuestion: (groupId: string, condition: string | null) => Promise<void>
  onAddOption: (questionId: string, groupId: string) => Promise<void>
  onDeleteOption: (optionId: string, questionId: string) => Promise<void>
  tags: AdminTag[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.sort((a, b) => a.sort_order - b.sort_order).map(group => {
        const isBranchGroup = group.quiz_questions.some(q => q.conditions?.if_any_slug?.some(s => s.startsWith('obj-')))

        return (
          <div key={group.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, overflow: 'hidden' }}>
            {/* Group header */}
            <div style={{ padding: '14px 20px', background: 'var(--liora-crema)', borderBottom: '1px solid var(--liora-arena)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, background: 'var(--liora-lima)', color: 'var(--liora-uva)', borderRadius: 999, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                Sección {group.sort_order}
              </span>
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>
                <InlineEdit value={group.title} onSave={v => onPatch(`/api/admin/quiz/groups/${group.id}`, { title: v })} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14 }} />
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.4 }}>
                {group.quiz_questions.length} preguntas
              </span>
            </div>

            {/* Interstitial */}
            {group.interstitial_text !== undefined && (
              <div style={{ padding: '10px 20px', background: 'rgba(243,187,56,0.12)', borderBottom: '1px solid rgba(61,26,58,0.08)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <ChatCircle size={14} weight="bold" style={{ marginTop: 3, flexShrink: 0, opacity: 0.6 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3, opacity: 0.6 }}>
                    Mensaje motivacional — aparece al inicio de esta sección
                  </div>
                  <InlineEdit
                    value={group.interstitial_text ?? ''}
                    placeholder="Sin mensaje — click para agregar"
                    multiline
                    onSave={v => onPatch(`/api/admin/quiz/groups/${group.id}`, { interstitial_text: v || null })}
                    style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}
                  />
                </div>
              </div>
            )}

            {/* Questions — grouped by branch if it's the branch group */}
            <div style={{ padding: 16 }}>
              {isBranchGroup ? (
                <>
                  {/* Group by branch */}
                  {BRANCHES.map(branch => {
                    const branchQs = group.quiz_questions.filter(q =>
                      q.conditions?.if_any_slug?.includes(branch.slug)
                    )
                    if (branchQs.length === 0) return null
                    return (
                      <BranchSection key={branch.slug} branch={branch} questions={branchQs} groupId={group.id}
                        onPatch={onPatch} onDelete={onDeleteQuestion} onAddQuestion={onAddQuestion}
                        onAddOption={onAddOption} onDeleteOption={onDeleteOption} tags={tags} />
                    )
                  })}
                  {/* Questions without branch condition (universal in this group) */}
                  {(() => {
                    const universalQs = group.quiz_questions.filter(q =>
                      !q.conditions?.if_any_slug?.some(s => s.startsWith('obj-'))
                    )
                    if (universalQs.length === 0) return null
                    return (
                      <BranchSection branch={null} questions={universalQs} groupId={group.id}
                        onPatch={onPatch} onDelete={onDeleteQuestion} onAddQuestion={onAddQuestion}
                        onAddOption={onAddOption} onDeleteOption={onDeleteOption} tags={tags} />
                    )
                  })()}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.quiz_questions.sort((a, b) => a.sort_order - b.sort_order).map((q, qi) => (
                    <QuestionCard key={q.id} q={q} qi={qi} groupId={group.id}
                      onPatch={onPatch} onDelete={onDeleteQuestion} onAddOption={onAddOption} onDeleteOption={onDeleteOption} tags={tags} />
                  ))}
                  <button onClick={() => onAddQuestion(group.id, null)}
                    style={{ background: 'transparent', border: '1.5px dashed var(--liora-arena)', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600 }}>
                    <Plus size={14} weight="bold" /> Agregar pregunta
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export function CuestionarioClient({ groups, miniKits, leads, totalProfiles, topOptions, tags }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'main' | 'mini' | 'leads' | 'analytics'>('main')
  const [selectedMiniKit, setSelectedMiniKit] = useState<string | null>(null)
  const [leadSearch, setLeadSearch] = useState('')

  const patch = async (url: string, body: Record<string, unknown>) => {
    await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    router.refresh()
  }

  const deleteQuestion = async (questionId: string) => {
    await fetch(`/api/admin/quiz/questions/${questionId}`, { method: 'DELETE' })
    router.refresh()
  }

  const addQuestion = async (groupId: string, conditionSlug: string | null) => {
    const maxOrder = groups.flatMap(g => g.quiz_questions).reduce((m, q) => Math.max(m, q.sort_order), 0)
    const conditions = conditionSlug ? { if_any_slug: [conditionSlug] } : null
    await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, text: 'Nueva pregunta', type: 'single', sort_order: maxOrder + 1, conditions }),
    })
    router.refresh()
  }

  const addOption = async (questionId: string) => {
    const allGroups = [...groups, ...miniKits.flatMap(k => k.groups)]
    const question = allGroups.flatMap(g => g.quiz_questions).find(q => q.id === questionId)
    const maxOrder = question?.quiz_question_options.reduce((m, o) => Math.max(m, o.sort_order), 0) ?? 0
    await fetch('/api/admin/quiz/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId, text: 'Nueva opción', slug: `opcion-${Date.now()}`, sort_order: maxOrder + 1 }),
    })
    router.refresh()
  }

  const deleteOption = async (optionId: string) => {
    await fetch(`/api/admin/quiz/options/${optionId}`, { method: 'DELETE' })
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
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Marketing</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Cuestionario</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
          {totalProfiles} perfiles · {leads.length} leads · Click en cualquier texto para editarlo
        </p>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {[
          { key: 'main', title: 'Principal', sub: 'Branching por 6 objetivos · IA recomienda al final' },
          { key: 'mini', title: 'Mini-quizzes', sub: 'Por kit específico · 3 preguntas rápidas' },
          { key: 'leads', title: `${leads.length} Leads`, sub: 'Emails capturados · Exportar CSV' },
          { key: 'analytics', title: `${totalProfiles} Perfiles`, sub: 'Qué están eligiendo · Análisis' },
        ].map(({ key, title, sub }) => (
          <button key={key} onClick={() => setView(key as typeof view)}
            style={{
              background: view === key ? 'var(--liora-uva)' : 'var(--liora-blanco)',
              color: view === key ? 'var(--liora-crema)' : 'var(--liora-uva)',
              border: '1.5px solid ' + (view === key ? 'var(--liora-uva)' : 'var(--liora-arena)'),
              borderRadius: 18, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
            }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, lineHeight: 1.1, marginBottom: 4, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{title}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, opacity: 0.65, lineHeight: 1.4 }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* ── MAIN QUIZ VIEW ─────────────────────────────────────────── */}
      {view === 'main' && (
        <div>
          {/* Flujo del cuestionario */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '14px 18px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <GitBranch size={13} weight="bold" style={{ opacity: 0.4, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Flujo:</span>
              {[
                { label: 'Sección 1 · ¿Qué buscas?', note: 'Objetivo del usuario' },
                { label: 'Sección 2 · Cuéntanos más', note: 'Preguntas por objetivo + para todos' },
                { label: 'Sección 3 · Para terminar', note: 'Alergias, género, presupuesto' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <ArrowRight size={11} weight="bold" style={{ opacity: 0.35 }} />}
                  <div style={{ background: 'var(--liora-crema)', borderRadius: 8, padding: '4px 10px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)' }}>{step.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)', opacity: 0.5 }}>{step.note}</div>
                  </div>
                </div>
              ))}
              <a href="/cuestionario" target="_blank" style={{ marginLeft: 'auto', background: 'var(--liora-uva)', color: 'var(--liora-crema)', borderRadius: 999, padding: '6px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <ArrowSquareOut size={11} weight="bold" /> Ver en vivo
              </a>
            </div>
          </div>

          {/* Leyenda de ramas */}
          <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '12px 18px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>Ramas por objetivo:</span>
            {BRANCHES.map(b => (
              <span key={b.slug} style={{ background: b.color, borderRadius: 999, padding: '3px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)' }}>{b.emoji} {b.label}</span>
            ))}
            <span style={{ background: 'var(--liora-lima)', borderRadius: 999, padding: '3px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Users size={10} weight="bold" /> Para todos
            </span>
          </div>

          <QuizEditor
            groups={groups}
            onPatch={patch}
            onDeleteQuestion={deleteQuestion}
            onAddQuestion={addQuestion}
            onAddOption={(qId) => addOption(qId)}
            onDeleteOption={deleteOption}
            tags={tags}
          />
        </div>
      )}

      {/* ── MINI QUIZZES VIEW ──────────────────────────────────────── */}
      {view === 'mini' && (
        <div>
          <div style={{ background: 'var(--cat-lavanda)', borderRadius: 16, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)' }}>Mini-cuestionarios por kit</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.75, marginTop: 4 }}>
              Aparecen en la página de cada kit. Preguntas específicas para ese kit — 3 máximo para no cansar.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {miniKits.map(k => {
              const isActive = (selectedMiniKit ?? miniKits[0]?.kitId) === k.kitId
              return (
                <button key={k.kitId} onClick={() => setSelectedMiniKit(k.kitId)}
                  style={{ background: isActive ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: isActive ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (isActive ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, lineHeight: 1.2, marginBottom: 3, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{k.kitName}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, opacity: 0.55 }}>
                    {k.groups.reduce((n, g) => n + g.quiz_questions.length, 0)} preguntas
                  </div>
                </button>
              )
            })}
          </div>
          {activeMiniKit && (
            <QuizEditor
              groups={activeMiniKit.groups}
              onPatch={patch}
              onDeleteQuestion={deleteQuestion}
              onAddQuestion={addQuestion}
              onAddOption={(qId) => addOption(qId)}
              onDeleteOption={deleteOption}
              tags={tags}
            />
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
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>Aún no hay leads. Cuando alguien complete el cuestionario y deje su email, aparecerá aquí.</div>
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
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, opacity: 0.7 }}>Qué están eligiendo</div>
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
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>Los datos aparecerán cuando haya respuestas completadas.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

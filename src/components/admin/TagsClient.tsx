'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash, Tag, X, Check } from '@phosphor-icons/react'

export interface AdminTag {
  id: string
  name: string
  slug: string
  group: string
  product_count: number
}

const GROUP_META: Record<string, { label: string; color: string; bg: string }> = {
  objetivo:   { label: 'Objetivo',   color: 'var(--liora-uva)',   bg: 'var(--cat-lavanda)' },
  actividad:  { label: 'Actividad',  color: 'var(--liora-uva)',   bg: 'var(--cat-menta)' },
  piel:       { label: 'Tipo de piel', color: 'var(--liora-uva)', bg: 'var(--cat-rosa)' },
}

const GROUPS: Array<'objetivo' | 'actividad' | 'piel'> = ['objetivo', 'actividad', 'piel']

const emptyForm = { name: '', slug: '', group: 'objetivo' as const }

export function TagsClient({ initialTags }: { initialTags: AdminTag[] }) {
  const router = useRouter()
  const [tags, setTags] = useState(initialTags)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const grouped = GROUPS.reduce<Record<string, AdminTag[]>>((acc, g) => {
    acc[g] = tags.filter(t => t.group === g)
    return acc
  }, { objetivo: [], actividad: [], piel: [] })

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleCreate = async () => {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setShowForm(false)
    setForm(emptyForm)
    setSaving(false)
    router.refresh()
    // Optimistic: refetch tags
    const r2 = await fetch('/api/admin/tags')
    const d2 = await r2.json()
    setTags(d2.tags ?? [])
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este tag? Se quitará de todos los productos y opciones del quiz.')) return
    setDeletingId(id)
    await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
    setTags(prev => prev.filter(t => t.id !== id))
    setDeletingId(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55, marginBottom: 4 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0, lineHeight: 1 }}>
            Tags
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>
            Los tags conectan las respuestas del quiz con los productos correctos. {tags.length} tags en total.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 14, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={15} weight="bold" /> Crear tag
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)', borderRadius: 20, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)' }}>Nuevo tag</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Ej: Energía"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="ej: energia"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Grupo *</label>
              <select
                value={form.group}
                onChange={e => setForm(f => ({ ...f, group: e.target.value as typeof form.group }))}
                style={inputStyle}
              >
                <option value="objetivo">Objetivo</option>
                <option value="actividad">Actividad</option>
                <option value="piel">Tipo de piel</option>
              </select>
            </div>
          </div>
          {error && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cat-coral)', fontWeight: 600 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={saving || !form.name || !form.slug}
              style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 12, padding: '10px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: saving ? 'wait' : 'pointer', opacity: saving || !form.name ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={13} weight="bold" /> {saving ? 'Guardando…' : 'Crear'}
            </button>
            <button onClick={() => { setShowForm(false); setError(null) }}
              style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 12, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tag groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {GROUPS.map(group => {
          const meta = GROUP_META[group]
          const groupTags = grouped[group]
          return (
            <div key={group}>
              {/* Group header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ background: meta.bg, color: meta.color, borderRadius: 999, padding: '4px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {meta.label}
                </div>
                <div style={{ height: 1, flex: 1, background: 'var(--liora-arena)' }} />
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.45 }}>{groupTags.length} tags</div>
              </div>

              {groupTags.length === 0 ? (
                <div style={{ background: 'var(--liora-blanco)', border: '1.5px dashed var(--liora-arena)', borderRadius: 16, padding: '24px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.45 }}>
                  Sin tags en este grupo
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {groupTags.map(tag => (
                    <div key={tag.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 150ms' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Tag size={15} weight="bold" color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{tag.name}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.5, marginTop: 2 }}>
                          {tag.slug} · {tag.product_count} producto{tag.product_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        disabled={deletingId === tag.id}
                        title="Eliminar tag"
                        style={{ background: 'transparent', border: 'none', cursor: deletingId === tag.id ? 'wait' : 'pointer', color: 'var(--liora-uva)', opacity: 0.3, padding: 4, borderRadius: 8, display: 'flex', transition: 'opacity 120ms', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12,
  color: 'var(--liora-uva)', display: 'block', marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--liora-arena)', borderRadius: 12,
  background: 'var(--liora-crema)', fontFamily: 'var(--font-body)',
  fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box',
}

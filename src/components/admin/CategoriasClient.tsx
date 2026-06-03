'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash, FolderSimple, X, Check, PencilSimple } from '@phosphor-icons/react'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
  created_at: string
  product_count: number
}

const emptyForm = { name: '', slug: '', sort_order: 0 }

export function CategoriasClient({ initialCategories }: { initialCategories: AdminCategory[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '' })

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const refetch = async () => {
    const r = await fetch('/api/admin/categories')
    const d = await r.json()
    setCategories(d.categories ?? [])
  }

  const handleCreate = async () => {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/categories', {
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
    await refetch()
  }

  const handleEdit = async (id: string) => {
    setSaving(true); setError(null)
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setEditingId(null)
    setSaving(false)
    router.refresh()
    await refetch()
  }

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) { alert(`No se puede eliminar "${name}": tiene ${count} producto(s) asignados. Reasigna los productos primero.`); return }
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); setDeletingId(null); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, slug: cat.slug })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55, marginBottom: 4 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0, lineHeight: 1 }}>
            Categorías
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>
            Organiza tu catálogo. {categories.length} categoría{categories.length !== 1 ? 's' : ''} en total.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 14, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={15} weight="bold" /> Nueva categoría
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)', borderRadius: 20, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)' }}>Nueva categoría</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
                placeholder="Ej: Vitaminas"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="ej: vitaminas"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Orden</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                min={0}
                style={inputStyle}
              />
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

      {categories.length === 0 ? (
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px dashed var(--liora-arena)', borderRadius: 20, padding: '48px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>
          Sin categorías. Crea la primera.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FolderSimple size={17} weight="bold" color="var(--liora-uva)" />
              </div>

              {editingId === cat.id ? (
                <div style={{ flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{ ...inputStyle, flex: 1, padding: '7px 12px', fontSize: 13 }}
                    autoFocus
                  />
                  <input
                    value={editForm.slug}
                    onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                    style={{ ...inputStyle, width: 160, padding: '7px 12px', fontSize: 13 }}
                    placeholder="slug"
                  />
                  <button onClick={() => handleEdit(cat.id)} disabled={saving}
                    style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 10, padding: '7px 14px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Check size={12} weight="bold" /> Guardar
                  </button>
                  <button onClick={() => setEditingId(null)}
                    style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 10, padding: '7px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{cat.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.5, marginTop: 2 }}>
                    /{cat.slug} · {cat.product_count} producto{cat.product_count !== 1 ? 's' : ''} · orden {cat.sort_order}
                  </div>
                </div>
              )}

              {editingId !== cat.id && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => startEdit(cat)} title="Editar"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.35, padding: 6, borderRadius: 8, display: 'flex', transition: 'opacity 120ms' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}>
                    <PencilSimple size={15} weight="bold" />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name, cat.product_count)} disabled={deletingId === cat.id} title="Eliminar"
                    style={{ background: 'transparent', border: 'none', cursor: deletingId === cat.id ? 'wait' : 'pointer', color: 'var(--liora-uva)', opacity: 0.3, padding: 6, borderRadius: 8, display: 'flex', transition: 'opacity 120ms' }}
                    onMouseEnter={e => cat.product_count === 0 && (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}>
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash, FolderSimple, X, Check, PencilSimple, House } from '@phosphor-icons/react'
import { ImageUploadField } from './ImageUploadField'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  sort_order: number
  created_at: string
  product_count: number
  show_in_hero: boolean
  hero_sort_order: number
  hero_tagline: string | null
  color: string
  image_url: string | null
}

const COLOR_OPTIONS = [
  { label: 'Menta',    value: 'var(--cat-menta)' },
  { label: 'Coral',    value: 'var(--cat-coral)' },
  { label: 'Mostaza',  value: 'var(--cat-mostaza)' },
  { label: 'Durazno',  value: 'var(--cat-durazno)' },
  { label: 'Lavanda',  value: 'var(--cat-lavanda)' },
  { label: 'Cielo',    value: 'var(--cat-cielo)' },
  { label: 'Rosa',     value: 'var(--cat-rosa)' },
]

const emptyForm = { name: '', slug: '', sort_order: 0 }

export function CategoriasClient({ initialCategories }: { initialCategories: AdminCategory[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', slug: '', hero_tagline: '', color: 'var(--cat-lavanda)', hero_sort_order: 0, image_url: '' })

  const heroCount = categories.filter(c => c.show_in_hero).length

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
    setShowForm(false); setForm(emptyForm); setSaving(false)
    router.refresh(); await refetch()
  }

  const patch = async (id: string, update: Partial<AdminCategory>) => {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    })
    if (res.ok) setCategories(prev => prev.map(c => c.id === id ? { ...c, ...update } : c))
  }

  const handleEdit = async (id: string) => {
    setSaving(true); setError(null)
    await patch(id, {
      name: editForm.name,
      slug: editForm.slug,
      hero_tagline: editForm.hero_tagline || null,
      color: editForm.color,
      hero_sort_order: editForm.hero_sort_order,
      image_url: editForm.image_url || null,
    })
    setEditingId(null); setSaving(false)
    router.refresh()
  }

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) { alert(`No se puede eliminar "${name}": tiene ${count} producto(s) asignados.`); return }
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error); setDeletingId(null); return }
    setCategories(prev => prev.filter(c => c.id !== id)); setDeletingId(null)
  }

  const startEdit = (cat: AdminCategory) => {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, slug: cat.slug, hero_tagline: cat.hero_tagline ?? '', color: cat.color ?? 'var(--cat-lavanda)', hero_sort_order: cat.hero_sort_order ?? 0, image_url: cat.image_url ?? '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.55, marginBottom: 4 }}>Catálogo</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0 }}>Categorías</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>
            {categories.length} categoría{categories.length !== 1 ? 's' : ''} · <strong>{heroCount}</strong> mostradas en el hero del home
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 14, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={15} weight="bold" /> Nueva categoría
        </button>
      </div>

      {/* Hero preview hint */}
      <div style={{ background: 'var(--liora-crema)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <House size={16} weight="bold" color="var(--liora-uva)" style={{ opacity: 0.6, flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', opacity: 0.75 }}>
          Las categorías con el toggle <strong>Hero</strong> activo aparecen en el lado derecho del hero de la página principal. Máximo 4 recomendado.
        </span>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-uva)', borderRadius: 20, padding: 24, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)' }}>Nueva categoría</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))} placeholder="Ej: Vitaminas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ej: vitaminas" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Orden</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} min={0} style={inputStyle} />
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
            <div key={cat.id} style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>

              {/* Color swatch */}
              <div style={{ width: 36, height: 36, borderRadius: 12, background: cat.color || 'var(--cat-lavanda)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <FolderSimple size={17} weight="bold" color="var(--liora-uva)" />
              </div>

              {editingId === cat.id ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Nombre</label>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ ...inputStyle, padding: '7px 12px', fontSize: 13 }} autoFocus />
                    </div>
                    <div>
                      <label style={labelStyle}>Slug</label>
                      <input value={editForm.slug} onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))} style={{ ...inputStyle, padding: '7px 12px', fontSize: 13 }} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Tagline del hero <span style={{ opacity: 0.5 }}>(se muestra en la tarjeta del home)</span></label>
                    <input value={editForm.hero_tagline} onChange={e => setEditForm(f => ({ ...f, hero_tagline: e.target.value }))} placeholder="Ej: Rutinas para cuidar tu piel cada día" style={{ ...inputStyle, padding: '7px 12px', fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={labelStyle}>Imagen de la categoría <span style={{ opacity: 0.5 }}>(PNG con fondo transparente recomendado)</span></label>
                    <ImageUploadField
                      value={editForm.image_url}
                      onChange={url => setEditForm(f => ({ ...f, image_url: url }))}
                      pathPrefix={`categories/${cat.slug}`}
                      previewBg={editForm.color || 'var(--cat-lavanda)'}
                      previewNote="Vista previa sobre color de categoría"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Color de la tarjeta</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {COLOR_OPTIONS.map(c => (
                          <button key={c.value} onClick={() => setEditForm(f => ({ ...f, color: c.value }))}
                            title={c.label}
                            style={{ width: 28, height: 28, borderRadius: 8, background: c.value, border: editForm.color === c.value ? '2.5px solid var(--liora-uva)' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Orden en hero</label>
                      <input type="number" value={editForm.hero_sort_order} onChange={e => setEditForm(f => ({ ...f, hero_sort_order: Number(e.target.value) }))} min={0} style={{ ...inputStyle, padding: '7px 12px', fontSize: 13 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleEdit(cat.id)} disabled={saving}
                      style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 10, padding: '7px 16px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} weight="bold" /> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)}
                      style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 10, padding: '7px 12px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--liora-uva)', lineHeight: 1.2 }}>{cat.name}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.5, marginTop: 2 }}>
                      /{cat.slug} · {cat.product_count} producto{cat.product_count !== 1 ? 's' : ''} · orden {cat.sort_order}
                    </div>
                    {cat.hero_tagline && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.65, marginTop: 4, fontStyle: 'italic' }}>
                        "{cat.hero_tagline}"
                      </div>
                    )}
                  </div>

                  {/* Hero toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hero</span>
                    <button
                      onClick={() => patch(cat.id, { show_in_hero: !cat.show_in_hero })}
                      style={{ width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', background: cat.show_in_hero ? 'var(--liora-uva)' : 'var(--liora-arena)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: 4, left: cat.show_in_hero ? 23 : 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => startEdit(cat)} title="Editar"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', opacity: 0.35, padding: 6, borderRadius: 8, display: 'flex' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}>
                      <PencilSimple size={15} weight="bold" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name, cat.product_count)} disabled={deletingId === cat.id} title="Eliminar"
                      style={{ background: 'transparent', border: 'none', cursor: deletingId === cat.id ? 'wait' : 'pointer', color: 'var(--liora-uva)', opacity: 0.3, padding: 6, borderRadius: 8, display: 'flex' }}
                      onMouseEnter={e => cat.product_count === 0 && (e.currentTarget.style.opacity = '0.8')} onMouseLeave={e => (e.currentTarget.style.opacity = '0.3')}>
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </>
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

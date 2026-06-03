'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, FloppyDisk, Trash, MagnifyingGlass } from '@phosphor-icons/react'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AdminCoupon {
  id: string
  code: string
  description: string | null
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  is_active: boolean
  is_public: boolean
  new_customers_only: boolean
  scope: 'all' | 'category'
  scope_category_ids: string[]
  min_purchase_cents: number | null
  max_uses: number | null
  max_uses_per_user: number
  used_count: number
  starts_at: string | null
  expires_at: string | null
  color: string
  created_at: string
}

type CouponStatus = 'active' | 'scheduled' | 'paused' | 'expired' | 'depleted'

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<CouponStatus, { label: string; bg: string }> = {
  active:    { label: 'Activo',     bg: 'var(--cat-menta)'   },
  scheduled: { label: 'Programado', bg: 'var(--cat-cielo)'   },
  paused:    { label: 'Pausado',    bg: 'var(--cat-mostaza)' },
  expired:   { label: 'Vencido',    bg: 'var(--liora-arena)' },
  depleted:  { label: 'Agotado',    bg: 'var(--cat-coral)'   },
}

const SWATCHES = [
  'var(--cat-lavanda)', 'var(--cat-menta)', 'var(--cat-cielo)', 'var(--cat-rosa)',
  'var(--cat-mostaza)', 'var(--cat-coral)', 'var(--cat-durazno)', 'var(--liora-lima)',
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function couponStatus(c: AdminCoupon): CouponStatus {
  const now = new Date()
  if (c.max_uses !== null && c.used_count >= c.max_uses) return 'depleted'
  if (c.expires_at && new Date(c.expires_at) < now) return 'expired'
  if (!c.is_active) return 'paused'
  if (c.starts_at && new Date(c.starts_at) > now) return 'scheduled'
  return 'active'
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid var(--liora-arena)', borderRadius: 12,
  background: 'var(--liora-crema)', fontFamily: 'var(--font-body)',
  fontSize: 13, color: 'var(--liora-uva)', outline: 'none', boxSizing: 'border-box',
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? 'var(--liora-uva)' : 'var(--liora-blanco)',
    color: active ? 'var(--liora-crema)' : 'var(--liora-uva)',
    border: `1.5px solid ${active ? 'var(--liora-uva)' : 'var(--liora-arena)'}`,
    borderRadius: 999, padding: '7px 14px',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: 'var(--liora-crema)', border: '1px solid var(--liora-arena)',
      fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--liora-uva)',
      opacity: 0.85, padding: '2px 7px', borderRadius: 6,
    }}>{children}</span>
  )
}

function StatCard({ label, value, dark, warn }: { label: string; value: string; dark?: boolean; warn?: boolean }) {
  return (
    <div style={{ background: dark ? 'var(--liora-uva)' : 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: '20px 22px' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: dark ? 'var(--liora-crema)' : 'var(--liora-uva)', opacity: dark ? 0.7 : 0.55, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, lineHeight: 1, color: dark ? 'var(--liora-crema)' : warn && Number(value) > 0 ? 'var(--cat-coral)' : 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>{value}</div>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 18, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.8 }}>{title}</div>
      {children}
    </div>
  )
}

function FormField({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--liora-uva)', display: 'block', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--cat-coral)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--liora-uva)', opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// ─── CouponTicket ──────────────────────────────────────────────────────────

function CouponTicket({ c, onClick }: { c: AdminCoupon; onClick: () => void }) {
  const st = couponStatus(c)
  const { label, bg } = STATUS_CFG[st]
  const usagePct = c.max_uses ? (c.used_count / c.max_uses) * 100 : 0

  const stubText = c.type === 'percentage'
    ? { big: String(c.value), small: '%' }
    : c.type === 'fixed_amount'
    ? { big: String(c.value), small: 'S/' }
    : { big: 'Envío', small: 'gratis' }

  return (
    <article
      onClick={onClick}
      style={{ background: 'var(--liora-blanco)', border: '1.5px solid var(--liora-arena)', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', display: 'flex', transition: 'border-color 150ms' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--liora-uva)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--liora-arena)')}
    >
      {/* Left stub */}
      <div style={{ background: c.color, width: 80, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 10px', gap: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: c.type === 'free_shipping' ? 16 : 28, color: 'var(--liora-uva)', lineHeight: 1, textAlign: 'center', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
          {stubText.big}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: 'var(--liora-uva)', opacity: 0.75, textAlign: 'center' }}>
          {stubText.small}
        </div>
      </div>

      {/* Dashed divider */}
      <div style={{ width: 0, borderLeft: '2px dashed var(--liora-arena)', margin: '12px 0', flexShrink: 0 }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: 'var(--liora-uva)' }}>{c.code}</span>
          <span style={{ background: bg, color: 'var(--liora-uva)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 9, padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>{label}</span>
        </div>

        {c.description && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.description}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
          {c.is_public && <Chip>Público</Chip>}
          {c.new_customers_only && <Chip>1ª compra</Chip>}
          {c.scope === 'category' && <Chip>Por categoría</Chip>}
          {c.min_purchase_cents ? <Chip>Mín. S/{c.min_purchase_cents / 100}</Chip> : null}
          {c.max_uses
            ? <Chip>{c.used_count}/{c.max_uses} usos</Chip>
            : c.used_count > 0 ? <Chip>{c.used_count} usos</Chip> : null}
          {c.expires_at && <Chip>Vence {fmtDate(c.expires_at)}</Chip>}
        </div>

        {c.max_uses && (
          <div style={{ background: 'var(--liora-arena)', borderRadius: 999, height: 3, overflow: 'hidden', marginTop: 2 }}>
            <div style={{ width: `${Math.min(usagePct, 100)}%`, height: '100%', background: usagePct > 80 ? 'var(--cat-coral)' : 'var(--liora-uva)', borderRadius: 999 }} />
          </div>
        )}
      </div>
    </article>
  )
}

// ─── Form state ────────────────────────────────────────────────────────────

interface CouponForm {
  code: string; description: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'; value: string
  is_active: boolean; is_public: boolean; new_customers_only: boolean
  scope: 'all' | 'category'; scope_category_ids: string[]
  min_purchase: string; max_uses: string; max_uses_per_user: string
  starts_at: string; expires_at: string; color: string
}

const EMPTY_FORM: CouponForm = {
  code: '', description: '', type: 'percentage', value: '',
  is_active: true, is_public: false, new_customers_only: false,
  scope: 'all', scope_category_ids: [],
  min_purchase: '', max_uses: '', max_uses_per_user: '1',
  starts_at: '', expires_at: '', color: 'var(--cat-lavanda)',
}

function formFromCoupon(c: AdminCoupon): CouponForm {
  return {
    code: c.code, description: c.description ?? '',
    type: c.type, value: c.type === 'free_shipping' ? '' : String(c.value),
    is_active: c.is_active, is_public: c.is_public,
    new_customers_only: c.new_customers_only,
    scope: c.scope ?? 'all', scope_category_ids: c.scope_category_ids ?? [],
    min_purchase: c.min_purchase_cents ? String(c.min_purchase_cents / 100) : '',
    max_uses: c.max_uses ? String(c.max_uses) : '',
    max_uses_per_user: String(c.max_uses_per_user),
    starts_at: c.starts_at ? c.starts_at.slice(0, 10) : '',
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
    color: c.color,
  }
}

function formToPayload(f: CouponForm) {
  return {
    code: f.code.toUpperCase().replace(/\s+/g, ''),
    description: f.description || null,
    type: f.type,
    value: f.type === 'free_shipping' ? 0 : Number(f.value) || 0,
    is_active: f.is_active,
    is_public: f.is_public,
    new_customers_only: f.new_customers_only,
    scope: f.scope,
    scope_category_ids: f.scope === 'category' ? f.scope_category_ids : [],
    min_purchase_cents: f.min_purchase ? Math.round(Number(f.min_purchase) * 100) : null,
    max_uses: f.max_uses ? Number(f.max_uses) : null,
    max_uses_per_user: Number(f.max_uses_per_user) || 1,
    starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
    expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
    color: f.color,
  }
}

// ─── CouponDrawer ──────────────────────────────────────────────────────────

function CouponDrawer({ editing, onClose, onSaved, categories }: {
  editing: 'new' | AdminCoupon | null
  onClose: () => void
  onSaved: () => void
  categories: Array<{ id: string; name: string }>
}) {
  const isNew = editing === 'new'
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) return
    setForm(isNew ? EMPTY_FORM : formFromCoupon(editing as AdminCoupon))
    setError(null)
  }, [editing, isNew])

  if (!editing) return null

  const set = <K extends keyof CouponForm>(k: K, v: CouponForm[K]) =>
    setForm(p => ({ ...p, [k]: v }))

  const canSave = form.code.length >= 2 && (form.type === 'free_shipping' || Number(form.value) > 0)

  const preview: AdminCoupon = {
    id: '', code: form.code.toUpperCase() || 'CODIGO',
    description: form.description || null, type: form.type,
    value: Number(form.value) || 0, is_active: form.is_active, is_public: form.is_public,
    new_customers_only: form.new_customers_only,
    scope: form.scope, scope_category_ids: form.scope_category_ids,
    min_purchase_cents: form.min_purchase ? Math.round(Number(form.min_purchase) * 100) : null,
    max_uses: form.max_uses ? Number(form.max_uses) : null,
    max_uses_per_user: Number(form.max_uses_per_user) || 1,
    used_count: 0,
    starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
    expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    color: form.color, created_at: '',
  }

  const toggleCategory = (id: string) => {
    const current = form.scope_category_ids
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    set('scope_category_ids', next)
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true); setError(null)
    try {
      const url = isNew ? '/api/admin/coupons' : `/api/admin/coupons/${(editing as AdminCoupon).id}`
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formToPayload(form)) })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error al guardar'); return }
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (isNew) return
    if (!confirm(`¿Eliminar el cupón "${(editing as AdminCoupon).code}"? No se puede deshacer.`)) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/coupons/${(editing as AdminCoupon).id}`, { method: 'DELETE' })
      onSaved(); onClose()
    } finally { setDeleting(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(61,26,58,0.35)', zIndex: 50, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 600, background: 'var(--liora-crema)', zIndex: 51, boxShadow: '-8px 0 40px rgba(61,26,58,0.18)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--liora-arena)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--liora-uva)', fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>
            {isNew ? 'Nuevo cupón' : 'Editar cupón'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--liora-uva)', padding: 8, opacity: 0.6 }}>
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Live preview */}
        <div style={{ padding: '16px 24px', background: 'var(--liora-blanco)', borderBottom: '1.5px solid var(--liora-arena)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.5, marginBottom: 10 }}>Vista previa</div>
          <CouponTicket c={preview} onClick={() => {}} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

          <FormSection title="Información básica">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Código" required>
                <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/\s+/g, ''))} placeholder="Ej. BIENVENIDA15" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.08em' }} />
              </FormField>
              <FormField label="Estado">
                <div style={{ display: 'flex', gap: 8 }}>
                  {([{ v: true, l: 'Activo' }, { v: false, l: 'Pausado' }] as const).map(s => (
                    <button key={String(s.v)} onClick={() => set('is_active', s.v)} style={{ flex: 1, background: form.is_active === s.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.is_active === s.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.is_active === s.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
            <FormField label="Visible en tienda" hint="Los clientes lo verán en el home y su perfil">
              <div style={{ display: 'flex', gap: 8 }}>
                {([{ v: true, l: 'Sí, público' }, { v: false, l: 'No, privado' }] as const).map(s => (
                  <button key={String(s.v)} onClick={() => set('is_public', s.v)} style={{ flex: 1, background: form.is_public === s.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.is_public === s.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.is_public === s.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {s.l}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Descripción interna" hint="Solo visible en el admin">
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ej. Cupón bienvenida — clientes nuevas" style={inputStyle} />
            </FormField>
          </FormSection>

          <FormSection title="Tipo de descuento">
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                { v: 'percentage',    l: '% Porcentaje' },
                { v: 'fixed_amount',  l: 'S/ Monto fijo' },
                { v: 'free_shipping', l: 'Envío gratis'  },
              ] as const).map(t => (
                <button key={t.v} onClick={() => set('type', t.v)} style={{ flex: 1, background: form.type === t.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.type === t.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.type === t.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  {t.l}
                </button>
              ))}
            </div>
            {form.type !== 'free_shipping' && (
              <FormField label={form.type === 'percentage' ? 'Porcentaje (%)' : 'Monto (S/)'} required>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5 }}>
                    {form.type === 'percentage' ? '%' : 'S/'}
                  </span>
                  <input type="number" min="0" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0" style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
              </FormField>
            )}
          </FormSection>

          <FormSection title="Alcance de productos">
            <FormField label="Aplica a">
              <div style={{ display: 'flex', gap: 8 }}>
                {([{ v: 'all', l: 'Todos los productos' }, { v: 'category', l: 'Por categoría' }] as const).map(s => (
                  <button key={s.v} onClick={() => set('scope', s.v)} style={{ flex: 1, background: form.scope === s.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.scope === s.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.scope === s.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {s.l}
                  </button>
                ))}
              </div>
            </FormField>
            {form.scope === 'category' && (
              <FormField label="Categorías" hint="El descuento aplica solo si el carrito tiene productos de estas categorías">
                {categories.length === 0
                  ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.5 }}>No hay categorías disponibles.</div>
                  : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {categories.map(cat => {
                        const selected = form.scope_category_ids.includes(cat.id)
                        return (
                          <button key={cat.id} onClick={() => toggleCategory(cat.id)} style={{ background: selected ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: selected ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (selected ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 999, padding: '7px 14px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                            {cat.name}
                          </button>
                        )
                      })}
                    </div>
                  )
                }
              </FormField>
            )}
          </FormSection>

          <FormSection title="Condiciones de uso">
            <FormField label="Restricción de cliente">
              <div style={{ display: 'flex', gap: 8 }}>
                {([{ v: false, l: 'Cualquier cliente' }, { v: true, l: 'Solo primera compra' }] as const).map(s => (
                  <button key={String(s.v)} onClick={() => set('new_customers_only', s.v)} style={{ flex: 1, background: form.new_customers_only === s.v ? 'var(--liora-uva)' : 'var(--liora-blanco)', color: form.new_customers_only === s.v ? 'var(--liora-crema)' : 'var(--liora-uva)', border: '1.5px solid ' + (form.new_customers_only === s.v ? 'var(--liora-uva)' : 'var(--liora-arena)'), borderRadius: 12, padding: '10px 0', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                    {s.l}
                  </button>
                ))}
              </div>
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Compra mínima (S/)" hint="Vacío = sin mínimo">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--liora-uva)', opacity: 0.5 }}>S/</span>
                  <input type="number" min="0" value={form.min_purchase} onChange={e => set('min_purchase', e.target.value)} placeholder="0" style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
              </FormField>
              <FormField label="Usos por cliente" hint="1 = una vez por persona">
                <input type="number" min="1" value={form.max_uses_per_user} onChange={e => set('max_uses_per_user', e.target.value)} style={inputStyle} />
              </FormField>
            </div>
            <FormField label="Usos totales máximos" hint="Vacío = ilimitado">
              <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Ilimitado" style={inputStyle} />
            </FormField>
          </FormSection>

          <FormSection title="Vigencia">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Fecha inicio">
                <input type="date" value={form.starts_at} onChange={e => set('starts_at', e.target.value)} style={inputStyle} />
              </FormField>
              <FormField label="Fecha expiración">
                <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} style={inputStyle} />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Color del ticket">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SWATCHES.map(sw => (
                <button
                  key={sw}
                  onClick={() => set('color', sw)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: sw, border: `3px solid ${form.color === sw ? 'var(--liora-uva)' : 'transparent'}`, cursor: 'pointer', transition: 'border-color 120ms', outline: 'none' }}
                />
              ))}
            </div>
          </FormSection>

          {error && (
            <div style={{ background: 'var(--cat-coral)', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', fontWeight: 600 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--liora-arena)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={deleting} style={{ background: 'transparent', color: 'var(--cat-coral)', border: '1.5px solid var(--cat-coral)', borderRadius: 999, padding: '10px 16px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, cursor: deleting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 'auto', opacity: deleting ? 0.7 : 1 }}>
              <Trash size={13} weight="bold" /> Eliminar
            </button>
          )}
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--liora-uva)', border: '1.5px solid var(--liora-arena)', borderRadius: 999, padding: '10px 18px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !canSave} style={{ background: canSave ? 'var(--liora-uva)' : 'var(--liora-arena)', color: canSave ? 'var(--liora-crema)' : 'var(--liora-uva)', border: 'none', borderRadius: 999, padding: '10px 22px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: !canSave || saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
            <FloppyDisk size={14} weight="bold" /> {isNew ? 'Crear cupón' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main export ───────────────────────────────────────────────────────────

export function CuponesClient({ initialCoupons, categories }: { initialCoupons: AdminCoupon[]; categories: Array<{ id: string; name: string }> }) {
  const router = useRouter()
  const [editing, setEditing] = useState<'new' | AdminCoupon | null>(null)
  const [filterStatus, setFilterStatus] = useState<CouponStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const withStatus = useMemo(() =>
    initialCoupons.map(c => ({ ...c, _status: couponStatus(c) as CouponStatus })),
    [initialCoupons]
  )

  const filtered = useMemo(() => {
    let list = withStatus
    if (filterStatus !== 'all') list = list.filter(c => c._status === filterStatus)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.code.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q))
    }
    return list
  }, [withStatus, filterStatus, search])

  const activeCount = withStatus.filter(c => c._status === 'active').length
  const totalUses = initialCoupons.reduce((s, c) => s + c.used_count, 0)
  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiringCount = initialCoupons.filter(c =>
    c.is_active && c.expires_at && new Date(c.expires_at) > now && new Date(c.expires_at) <= weekAhead
  ).length
  const statusCounts = (Object.keys(STATUS_CFG) as CouponStatus[]).reduce((acc, k) => {
    acc[k] = withStatus.filter(c => c._status === k).length
    return acc
  }, {} as Record<CouponStatus, number>)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: 'var(--liora-uva)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10 }}>Descuentos</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.02em', color: 'var(--liora-uva)', margin: 0, fontVariationSettings: "'opsz' 144,'SOFT' 80,'WONK' 1" }}>Cupones</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
            {initialCoupons.length} cupones · {activeCount} activos
          </p>
        </div>
        <button onClick={() => setEditing('new')} style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', border: 'none', borderRadius: 999, padding: '11px 20px', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Plus size={15} weight="bold" /> Nuevo cupón
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Cupones activos" value={String(activeCount)} dark />
        <StatCard label="Usos totales" value={String(totalUses)} />
        <StatCard label="Vencen esta semana" value={String(expiringCount)} warn={expiringCount > 0} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <button style={chipStyle(filterStatus === 'all')} onClick={() => setFilterStatus('all')}>
          Todos <span style={{ opacity: 0.65, fontSize: 11 }}>({initialCoupons.length})</span>
        </button>
        {(Object.entries(STATUS_CFG) as [CouponStatus, typeof STATUS_CFG[CouponStatus]][]).map(([key, cfg]) => (
          <button key={key} style={chipStyle(filterStatus === key)} onClick={() => setFilterStatus(key)}>
            {cfg.label} <span style={{ opacity: 0.65, fontSize: 11 }}>({statusCounts[key] ?? 0})</span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--liora-uva)', opacity: 0.5, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar código…" style={{ padding: '9px 14px 9px 34px', border: '1.5px solid var(--liora-arena)', borderRadius: 999, background: 'var(--liora-blanco)', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--liora-uva)', outline: 'none', width: 200 }} />
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(c => (
          <CouponTicket key={c.id} c={c} onClick={() => setEditing(c)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.5 }}>
            {search ? `No hay cupones que coincidan con "${search}"` : 'No hay cupones en esta categoría.'}
          </div>
        )}
      </div>

      <CouponDrawer
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => router.refresh()}
        categories={categories}
      />
    </div>
  )
}

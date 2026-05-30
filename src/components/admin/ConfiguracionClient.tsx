'use client'
import { useState } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import type { StoreSettings } from '@/lib/settings'

export function ConfiguracionClient({ initial }: { initial: StoreSettings }) {
  const [threshold, setThreshold] = useState(String(initial.free_shipping_threshold_cents / 100))
  const [shippingCost, setShippingCost] = useState(String(initial.shipping_cost_cents / 100))
  const [deliveryMessage, setDeliveryMessage] = useState(initial.delivery_message)

  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSave = async () => {
    setSaving(true); setStatus('idle')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          free_shipping_threshold_cents: Math.round(Number(threshold) * 100),
          shipping_cost_cents: Math.round(Number(shippingCost) * 100),
          delivery_message: deliveryMessage.trim(),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('ok')
      } else {
        setStatus('error'); setErrorMsg(data.error ?? 'Error al guardar')
      }
    } catch {
      setStatus('error'); setErrorMsg('Error de red')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--liora-uva)', margin: 0 }}>Configuración</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', opacity: 0.6, marginTop: 6 }}>Ajustes de envío y mensajes de la tienda</p>
      </div>

      <div style={{ background: 'var(--liora-blanco)', borderRadius: 20, border: '1.5px solid var(--liora-arena)', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

        <Section title="Envío">
          <Field label="Monto mínimo para envío gratis (S/)" hint="Pedidos iguales o mayores a este monto no pagan envío">
            <NumericInput value={threshold} onChange={setThreshold} prefix="S/" />
          </Field>
          <Field label="Costo de envío (S/)" hint="Aplicado cuando el pedido no alcanza el mínimo">
            <NumericInput value={shippingCost} onChange={setShippingCost} prefix="S/" />
          </Field>
        </Section>

        <div style={{ height: 1, background: 'var(--liora-arena)' }} />

        <Section title="Tiempos de entrega">
          <Field
            label="Mensaje de entrega"
            hint='Aparece en el banner superior. Usa · para separar zonas. Ej: "Lima 36–48h · Provincias 3–5 días"'
          >
            <TextInput
              value={deliveryMessage}
              onChange={setDeliveryMessage}
              placeholder="Lima 36–48h · Provincias 3–5 días"
            />
          </Field>
          <Preview text={`Envío gratis en pedidos +S/${Math.round(Number(threshold) || 0)} · ${deliveryMessage || '…'} · Haz tu cuestionario`} />
        </Section>

        <div style={{ paddingTop: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'var(--liora-uva)', color: 'var(--liora-crema)',
              border: 'none', borderRadius: 14, padding: '13px 28px',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          {status === 'ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-lima-deep)', fontWeight: 600 }}>
              <CheckCircle size={18} weight="fill" />
              Guardado
            </div>
          )}
          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cat-coral)', fontWeight: 600 }}>
              <WarningCircle size={18} weight="fill" />
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Preview({ text }: { text: string }) {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--liora-uva)', opacity: 0.45, marginBottom: 6 }}>
        Vista previa del banner
      </div>
      <div style={{ background: 'var(--liora-uva)', color: 'var(--liora-crema)', textAlign: 'center', padding: '9px 16px', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, borderRadius: 8 }}>
        {text}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--liora-uva)', opacity: 0.5 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: 'var(--liora-uva)' }}>{label}</label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--liora-uva)', opacity: 0.55 }}>{hint}</div>}
    </div>
  )
}

function NumericInput({ value, onChange, prefix }: { value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--liora-arena)', borderRadius: 12, overflow: 'hidden', background: 'var(--liora-crema)' }}>
      {prefix && (
        <span style={{ padding: '10px 12px', fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--liora-uva)', opacity: 0.6, borderRight: '1.5px solid var(--liora-arena)' }}>{prefix}</span>
      )}
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ flex: 1, padding: '10px 14px', border: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', outline: 'none' }}
      />
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ padding: '10px 14px', border: '1.5px solid var(--liora-arena)', borderRadius: 12, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--liora-uva)', background: 'var(--liora-crema)', outline: 'none' }}
    />
  )
}

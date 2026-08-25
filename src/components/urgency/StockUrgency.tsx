interface Props {
  /** Se conserva para compatibilidad con las fichas de kits, que no exponen inventario. */
  productId?: string
  stockQuantity?: number | null
  threshold?: number
}

export function StockUrgency({ stockQuantity, threshold = 12 }: Props) {
  // null representa stock ilimitado. Conservamos un CTA visible sin afirmar
  // una cantidad finita que contradiga el inventario real.
  if (stockQuantity === null) {
    return (
      <div style={{
        background: '#fff3e0',
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          color: '#c0622b',
        }}>
          <span aria-hidden="true">🔥</span>
          Disponible ahora · Lima 36–48 h
        </div>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: '#c0622b',
          marginTop: 2,
        }}>
          Pídelo hoy →
        </div>
      </div>
    )
  }

  if (stockQuantity === undefined || stockQuantity <= 0 || stockQuantity > threshold) return null
  const count = stockQuantity

  const urgencyLevel: 'critical' | 'low' | 'medium' =
    count <= 3 ? 'critical' : count <= 7 ? 'low' : 'medium'

  const colors = {
    critical: { bg: '#fde8e3', text: '#c0392b', icon: '🔴' },
    low:      { bg: '#fff3e0', text: '#c0622b', icon: '🟠' },
    medium:   { bg: '#fffde7', text: '#8a6f00', icon: '🟡' },
  }
  const { bg, text, icon } = colors[urgencyLevel]

  return (
    <>
      <style>{`
        @keyframes liora-stock-shake {
          0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-3px)} 40%,80%{transform:translateX(3px)}
        }
        .liora-stock-shake { animation: liora-stock-shake 0.5s ease-in-out }
      `}</style>

      <div style={{
        background: bg,
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        marginTop: 16,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          color: text,
        }}>
          <span>{icon}</span>
          {urgencyLevel === 'critical'
            ? `¡Solo quedan ${count} unidad${count === 1 ? '' : 'es'} en stock!`
            : urgencyLevel === 'low'
              ? `¡Quedan pocas unidades (${count})!`
              : `Stock limitado: ${count} disponibles`
          }
        </div>

        {urgencyLevel === 'critical' && (
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: text,
            marginTop: 2,
          }}>
            Asegura el tuyo ahora →
          </div>
        )}
      </div>
    </>
  )
}

interface AnnouncementBarProps {
  thresholdCents: number
  deliveryMessage: string
}

export function AnnouncementBar({ thresholdCents, deliveryMessage }: AnnouncementBarProps) {
  const thresholdSoles = Math.round(thresholdCents / 100)
  return (
    <div
      style={{
        background: 'var(--liora-uva)',
        color: 'var(--liora-crema)',
        textAlign: 'center',
        padding: '10px 24px',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      Envío gratis en pedidos +S/{thresholdSoles} · {deliveryMessage} ·{' '}
      <a
        href="/cuestionario"
        style={{ color: 'var(--liora-lima)', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Haz tu cuestionario
      </a>
    </div>
  )
}

export function AnnouncementBar() {
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
      Envío gratis en pedidos +S/150 · Lima 36–48h ·{' '}
      <a
        href="/cuestionario"
        style={{ color: 'var(--liora-lima)', textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        Haz tu cuestionario
      </a>
    </div>
  )
}

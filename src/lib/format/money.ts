interface FormatPENOptions {
  space?: boolean
}

/** Muestra los céntimos cuando existen y evita redondear el precio comercial. */
export function formatPEN(cents: number, { space = false }: FormatPENOptions = {}): string {
  const decimals = Math.abs(cents) % 100 === 0 ? 0 : 2
  return `S/${space ? ' ' : ''}${(cents / 100).toFixed(decimals)}`
}

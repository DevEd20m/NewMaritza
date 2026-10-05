# Auditoría

Una auditoría es una **instantánea fechada** de qué está roto o es vulnerable. **No se edita
después**: si se editara al corregir cada hallazgo, dejaría de ser la foto de un momento y pasaría a
ser un segundo backlog con otro dueño. El **estado** de cada hallazgo —abierto, corregido,
descartado— vive en el [backlog](../BACKLOG.md#hallazgos-de-auditoría).

Una auditoría nueva es un archivo nuevo (`hallazgos-AAAA-MM-DD.md`); los ids `AUD-NNN` continúan la
numeración y no se reutilizan.

Cada auditoría declara:

- **Alcance**: qué se miró, sobre qué commit y rama.
- **Método**: estático (leyendo código) o dinámico (ejecutando), y sus límites.
- **Lo que explícitamente NO se hizo.**
- **Resultado**: cuántos hallazgos por severidad, obtenido con un comando que se cita.

| Auditoría | Commit | Hallazgos |
|---|---|---|
| [2026-10-04](hallazgos.md) | `080d0e1` | AUD-001 … AUD-011 |
| [2026-10-04 · ejecución](hallazgos-2026-10-04-ejecucion.md) | `b0e640a` | AUD-012 |

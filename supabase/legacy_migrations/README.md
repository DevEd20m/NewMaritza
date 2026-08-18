# Migraciones locales históricas

Estos archivos estaban en el repositorio con timestamps que nunca fueron
registrados por Supabase producción. Sus cambios sí existen en producción bajo
las migraciones canónicas descargadas con `supabase migration fetch` (por
ejemplo, las variantes de stock remotas `20260603165804` y `20260603165849`).

Se conservan fuera de `supabase/migrations/` únicamente para auditoría. No deben
volver a ejecutarse ni marcarse con `migration repair`: hacerlo duplicaría seeds,
funciones y alteraciones que ya forman parte del historial remoto canónico.

La ruta activa `supabase/migrations/` contiene ahora el historial de producción
y las migraciones nuevas pendientes de validar primero en staging.

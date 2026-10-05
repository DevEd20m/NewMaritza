# Hallazgos de auditoría — ejecución de suites

**Instantánea del 2026-10-04 · commit `b0e640a` · rama `sdd/adopcion-metodo`**

Segunda instantánea del mismo día. La [primera](hallazgos.md) fue estática y declaró explícitamente
que **no se ejecutó ninguna suite**, porque la máquina tenía Node 20. Esta recoge lo que apareció al
poder ejecutarlas: un stack Supabase local con las migraciones aplicadas sobre un Postgres limpio y
`supabase test db` corriendo los tests pgTAP.

La numeración `AUD-NNN` continúa la de la primera y no se reutiliza.

## Método y sus límites

- `supabase start` sobre Postgres limpio, las 40+ migraciones de `supabase/migrations/` y
  `supabase/seed.sql`.
- `supabase test db --local`, y consultas directas a `information_schema` y `pg_policies` para
  comprobar lo que el test afirma.
- **No se ejecutó contra staging ni producción**, así que no se sabe si esos entornos tienen la
  misma configuración de privilegios que produce una base reconstruida desde las migraciones.

## Resumen

| ID | Sev. | Categoría | Componente | Título |
|---|---|---|---|---|
| [AUD-012](#aud-012) | Medio | autorización | backend | Las tablas de analítica conservan todos los permisos de `anon`, y su test lo dice desde hace tiempo |

---

## AUD-012

### Las tablas de analítica conservan todos los permisos de `anon`, y su test lo dice desde hace tiempo

- **Severidad:** Medio · **Categoría:** autorización · **Componente:** backend
- **Confianza:** Confirmado por ejecución
- **Flujos:** analítica de navegación

**Evidencia.** `supabase test db --local` sobre una base reconstruida desde cero:

```
/supabase/tests/analytics_journeys.sql ..
# Failed test 4: "anonymous clients cannot read journeys"
#         have: true
#         want: false
Files=2, Tests=33,  Result: FAIL
```

El test que lo exige está en `supabase/tests/analytics_journeys.sql:8`:

```sql
select is(has_table_privilege('anon', 'public.analytics_sessions', 'SELECT'), false,
          'anonymous clients cannot read journeys');
```

Y la base dice lo contrario. `anon` conserva las siete concesiones por defecto de Supabase sobre las
tres tablas:

```
analytics_delivery_outbox: 7
analytics_page_views: 7
analytics_sessions: 7
```

La migración que las crea (`20260818000000_analytics_journeys.sql`) habilita RLS en las tres
(líneas 76-78) y revoca el `execute` de sus seis funciones (320-325), pero **nunca revoca los
permisos de tabla**. La migración anterior sí lo hacía para las suyas
(`20260817000000_production_checkout_hardening.sql:554-559`), así que el patrón existía y aquí se
omitió.

**Impacto.** Hoy los datos **no** quedan expuestos: RLS está activo y las tres tablas tienen **cero
políticas**, y una tabla con RLS y sin políticas deniega todo a quien no lo evada. El riesgo es que
la única barrera es esa, sin la defensa en profundidad que el resto del esquema sí tiene: el día que
alguien añada una política permisiva para un caso concreto, la concesión de tabla ya está puesta y
no habrá nada más que frene a `anon`.

El problema inmediato es otro y es de proceso: **la puerta lleva tiempo en rojo y nadie lo vio.**
`supabase test db` corre en `ci.yml` desde antes de esta adopción. Un test que falla siempre deja de
mirarse, que es exactamente lo que el método advierte.

**Precondiciones.** Para que haya exposición real hace falta además una política `select` permisiva
sobre esas tablas. Hoy no existe: **latente**.

**Recomendación.** Revocar los permisos de tabla a `anon` y `authenticated` sobre las tres tablas,
replicando lo que hace `production_checkout_hardening`. Es una migración de tres líneas y deja verde
un test que ya existía: no hace falta historia nueva, hace falta el arreglo.

**Esfuerzo:** S.

---

## Corrección sobre la instantánea anterior

**[AUD-002](hallazgos.md#aud-002) es un falso positivo.** Afirmaba que `orders.quiz_profile_id`
existía en producción y en los tipos pero en ninguna migración. Es falso: la crea
`20260712021621_order_guide_snapshots.sql:2-3`.

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS quiz_profile_id uuid REFERENCES quiz_profiles(id) ON DELETE SET NULL;
```

La búsqueda que sustentaba el hallazgo era sensible a mayúsculas y esa migración escribe `ADD
COLUMN` en mayúsculas. Comprobado contra una base reconstruida desde cero: la columna está.

La instantánea anterior no se edita —es una foto de lo que se creyó ver—; el estado corregido vive
en el [backlog](../BACKLOG.md#hallazgos-de-auditoría), marcado como descartado con este motivo.

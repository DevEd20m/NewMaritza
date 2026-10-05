#!/usr/bin/env node
// Crea la cuenta administrativa del Supabase LOCAL. Hace falta porque seed.sql no puede:
// los usuarios viven en el esquema `auth` y los gestiona GoTrue, no SQL.
//
// Se vuelve a necesitar después de cada `supabase db reset`, que borra la base entera.
//
//   node scripts/crear-admin-local.mjs [email] [contraseña]
//
// Sin argumentos usa E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD de .env.local, que es donde los
// buscan los tests de extremo a extremo. Ver docs/arquitectura/entorno-local.md.
//
// Se niega a ejecutarse contra cualquier cosa que no sea el stack local.

import { readFileSync } from 'node:fs'

const API = process.env.SUPABASE_LOCAL_URL ?? 'http://127.0.0.1:54321'
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(API)) {
  console.error(`Este script solo opera contra el stack local. Recibido: ${API}`)
  process.exit(1)
}

// La clave de servicio del stack local es la de demostración del CLI: igual en todas las
// máquinas, inútil fuera de localhost.
const SERVICE_KEY = process.env.SUPABASE_LOCAL_SERVICE_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

function deEnvLocal(clave) {
  try {
    const linea = readFileSync('.env.local', 'utf-8')
      .split('\n')
      .find((l) => l.startsWith(`${clave}=`))
    return linea?.slice(clave.length + 1).trim() || null
  } catch {
    return null
  }
}

const email = process.argv[2] ?? process.env.E2E_ADMIN_EMAIL ?? deEnvLocal('E2E_ADMIN_EMAIL')
const password = process.argv[3] ?? process.env.E2E_ADMIN_PASSWORD ?? deEnvLocal('E2E_ADMIN_PASSWORD')

if (!email || !password) {
  console.error('Falta el email o la contraseña. Pásalos como argumentos o déjalos en .env.local')
  console.error('  node scripts/crear-admin-local.mjs admin@local.test <contraseña>')
  process.exit(1)
}

const cabeceras = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// 1 · El usuario. `email_confirm` evita tener que pasar por el buzón local.
const alta = await fetch(`${API}/auth/v1/admin/users`, {
  method: 'POST',
  headers: cabeceras,
  body: JSON.stringify({ email, password, email_confirm: true }),
})

let id
if (alta.ok) {
  id = (await alta.json()).id
} else {
  // Ya existía: lo buscamos. Pasa siempre que se reejecuta sin haber hecho db reset.
  const lista = await fetch(`${API}/auth/v1/admin/users`, { headers: cabeceras })
  if (!lista.ok) {
    console.error(`No se pudo listar usuarios (${lista.status}). ¿Está levantado el stack local?`)
    process.exit(1)
  }
  id = (await lista.json()).users?.find((u) => u.email === email)?.id
  if (!id) {
    console.error(`El alta falló (${alta.status}) y el usuario tampoco existe: ${await alta.text()}`)
    process.exit(1)
  }
}

// 2 · El rol. El trigger on_auth_user_created ya creó su fila en profiles con role='customer';
//     lo único que mira verifyAdminPage() es ese campo.
const promocion = await fetch(`${API}/rest/v1/profiles?id=eq.${id}`, {
  method: 'PATCH',
  headers: { ...cabeceras, Prefer: 'return=representation' },
  body: JSON.stringify({ role: 'admin', first_name: 'Admin', last_name: 'Local' }),
})

const filas = promocion.ok ? await promocion.json() : []
if (filas[0]?.role !== 'admin') {
  console.error(`No se pudo promover el perfil (${promocion.status}): ${JSON.stringify(filas)}`)
  process.exit(1)
}

console.log(`Listo: ${email} es admin en el stack local (${id}).`)

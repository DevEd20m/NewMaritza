import { execFileSync, spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const LOCAL_ADMIN = {
  email: 'e2e-admin@liora.local',
  password: 'LocalE2E-Admin-2026!',
  role: 'admin',
  firstName: 'Admin E2E',
}

const LOCAL_CUSTOMER = {
  email: 'e2e-customer@liora.local',
  password: 'LocalE2E-Customer-2026!',
  role: 'customer',
  firstName: 'Cliente E2E',
}

function readLocalSupabaseEnvironment() {
  const output = execFileSync('supabase', ['status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })

  return Object.fromEntries(
    output
      .split('\n')
      .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]])
  )
}

function assertLocalUrl(value) {
  const url = new URL(value)
  if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error(`E2E local rechazado para host no local: ${url.hostname}`)
  }
  // Keep the app and Supabase on the same loopback hostname. WebKit treats
  // localhost -> 127.0.0.1 as a different local-network origin.
  url.hostname = 'localhost'
  return url.origin
}

async function ensureUser(supabase, fixture) {
  let page = 1
  let user

  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    user = data.users.find((candidate) => candidate.email === fixture.email)
    if (user || data.users.length < 100) break
    page += 1
  }

  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: fixture.password,
      email_confirm: true,
    })
    if (error) throw error
    user = data.user
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
    })
    if (error) throw error
    user = data.user
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    first_name: fixture.firstName,
    role: fixture.role,
    updated_at: new Date().toISOString(),
  })
  if (profileError) throw profileError
}

async function main() {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error('test:e2e:local no acepta PLAYWRIGHT_BASE_URL')
  }

  const local = readLocalSupabaseEnvironment()
  const apiUrl = assertLocalUrl(local.API_URL)
  if (!local.ANON_KEY || !local.SERVICE_ROLE_KEY) {
    throw new Error('Supabase local no entregó ANON_KEY/SERVICE_ROLE_KEY')
  }

  const supabase = createClient(apiUrl, local.SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  await ensureUser(supabase, LOCAL_ADMIN)
  await ensureUser(supabase, LOCAL_CUSTOMER)

  const testEnvironment = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_WHATSAPP_NUMBER: '51999999999',
    E2E_ADMIN_EMAIL: LOCAL_ADMIN.email,
    E2E_ADMIN_PASSWORD: LOCAL_ADMIN.password,
    E2E_CUSTOMER_EMAIL: LOCAL_CUSTOMER.email,
    E2E_CUSTOMER_PASSWORD: LOCAL_CUSTOMER.password,
    RUN_ANALYTICS_E2E: '1',
    PLAYWRIGHT_WEB_SERVER_COMMAND: 'npm start',
  }

  if (process.env.LOCAL_E2E_SKIP_BUILD !== '1') {
    const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env: testEnvironment })
    if (build.status !== 0) process.exit(build.status ?? 1)
  }

  const args = ['playwright', 'test', ...process.argv.slice(2)]
  const result = spawnSync('npx', args, { stdio: 'inherit', env: testEnvironment })

  process.exit(result.status ?? 1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

import { createClient } from '@supabase/supabase-js'

// Server client (service role) — used in API routes and Server Actions
// Never exposed to the browser
export function supabaseAdmin() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url)        throw new Error('NEXT_PUBLIC_SUPABASE_URL not set')
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')
  return createClient(url, serviceKey, {
    auth: { persistSession: false }
  })
}

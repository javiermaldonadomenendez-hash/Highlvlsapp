import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const checks: Record<string, string> = {}

  checks.SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL     ? '✅ set' : '❌ MISSING'
  checks.SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY     ? '✅ set' : '❌ MISSING'
  checks.VAPID_PUBLIC     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY  ? '✅ set' : '❌ MISSING'
  checks.VAPID_PRIVATE    = process.env.VAPID_PRIVATE_KEY             ? '✅ set' : '❌ MISSING'

  try {
    const { data, error } = await supabaseAdmin().from('users').select('id').limit(1)
    checks.supabase_query = error ? `❌ ${error.message}` : `✅ ok (${data?.length ?? 0} rows)`
  } catch (e: any) {
    checks.supabase_query = `❌ ${e?.message}`
  }

  return NextResponse.json(checks)
}

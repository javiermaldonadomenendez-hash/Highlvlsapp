import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Runs every Sunday at 23:05 UTC (Vercel cron)
// Deletes KPI entries from previous weeks to keep the DB clean.
// The app already shows a fresh week automatically via weekKey(),
// so this is purely a maintenance cleanup.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()

  // Current week key
  const d = new Date()
  const y = d.getFullYear()
  const start = new Date(y, 0, 1)
  const w = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  const currentWeek = `${y}-W${w}`

  const { error } = await db
    .from('kpi_entries')
    .delete()
    .neq('week_key', currentWeek)

  if (error) {
    console.error('[cron-reset]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[cron-reset] KPI entries before ${currentWeek} deleted`)
  return NextResponse.json({ ok: true, currentWeek })
}

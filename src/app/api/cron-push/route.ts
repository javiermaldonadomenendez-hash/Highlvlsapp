import { NextRequest, NextResponse } from 'next/server'
import { getAllPushSubscriptions, deletePushSubscription } from '@/lib/queries'
import { sendPushToSubs } from '@/lib/push'

const MESSAGES = {
  afternoon: { title: 'Highlevels ⏰', body: 'Noch Zeit! Hast du deine Quests für heute erledigt?' },
  evening:   { title: 'Highlevels 🎯', body: 'Quests noch offen? Jetzt schnell noch erledigen!' },
  night:     { title: 'Highlevels 📋', body: 'Letzter Check: Alles für heute abgehakt?' },
} as const

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slot = (req.nextUrl.searchParams.get('slot') ?? 'evening') as keyof typeof MESSAGES
  const msg  = MESSAGES[slot] ?? MESSAGES.evening
  const subs = await getAllPushSubscriptions()

  const { sent, failed } = await sendPushToSubs(
    subs,
    {
      title: msg.title,
      body:  msg.body,
      icon:  '/emoji/lucasfreude.png',
      badge: '/emoji/lucasfreude.png',
      tag:   `hl-daily-${slot}`,
      url:   '/',
    },
    deletePushSubscription
  )

  console.log(`[cron-push] slot=${slot} sent=${sent} failed=${failed}`)
  return NextResponse.json({ ok: true, slot, sent, failed })
}

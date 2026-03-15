import { NextRequest, NextResponse } from 'next/server'
import { getAllPushSubscriptions, deletePushSubscription } from '@/lib/queries'
import { sendPushToSubs } from '@/lib/push'

const MESSAGES = {
  afternoon: [
    { title: 'Highlevels 💪', body: 'Bereit für heute? Deine Quests warten — leg jetzt los!' },
    { title: 'Highlevels 🚀', body: 'Team Highlevel — heute wieder auf 100%! Was ist dein erster Move?' },
    { title: 'Highlevels ⚡', body: 'Der Countdown läuft. Wer heute alles erledigt, gewinnt XP und Respekt.' },
    { title: 'Highlevels 🎯', body: 'Focus-Time! Prozessliste, Potential Planer, PoPa & PoKu — let\'s go.' },
    { title: 'Highlevels 🔥', body: 'Kein Tag ohne Punkte. Dein Team zählt auf dich!' },
  ],
  evening: [
    { title: 'Highlevels ⏰', body: 'Noch 2 Stunden! Hast du heute schon deine Quests erledigt?' },
    { title: 'Highlevels 📊', body: 'Check dein KPI-Dashboard — bist du auf Kurs?' },
    { title: 'Highlevels 🏆', body: 'Wer heute noch pusht, klettert im Ranking. Jetzt ist die Zeit!' },
    { title: 'Highlevels 💡', body: 'Schnell-Check: Potential Planer ausgefüllt? PoPa & PoKu eingetragen?' },
    { title: 'Highlevels ⚡', body: 'Letzter Sprint des Tages — hol dir deine XP!' },
  ],
  night: [
    { title: 'Highlevels 🌙', body: 'Tagesabschluss: Wie war dein Tag? Reflexion nicht vergessen!' },
    { title: 'Highlevels 😤', body: 'Noch nicht alle Quests erledigt? Jetzt ist die letzte Chance!' },
    { title: 'Highlevels 🔥', body: 'Streak in Gefahr! Erledige deine Aufgaben bevor der Tag endet.' },
    { title: 'Highlevels 🏅', body: 'Die Besten hören nicht auf — dein Team schaut aufs Ranking!' },
    { title: 'Highlevels 💪', body: 'Ein starker Abschluss macht den Unterschied. Push it!' },
  ],
} as const

type Slot = keyof typeof MESSAGES

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const slot = (req.nextUrl.searchParams.get('slot') ?? 'evening') as Slot
  const msgs = MESSAGES[slot] ?? MESSAGES.evening
  const idx  = new Date().getDate() % msgs.length
  const msg  = msgs[idx]

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

  console.log(`[cron-push] slot=${slot} idx=${idx} sent=${sent} failed=${failed}`)
  return NextResponse.json({ ok: true, slot, sent, failed })
}

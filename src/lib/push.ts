// Server-only push helper — imported only from queries.ts and api routes
import webpush from 'web-push'
import type { PushSubscriptionRecord } from '@/types'

function initVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO      ?? 'mailto:J_Maldonadomenendez@taures.de',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
    process.env.VAPID_PRIVATE_KEY ?? ''
  )
}

export async function sendPushToSubs(
  subs: PushSubscriptionRecord[],
  payload: Record<string, string>,
  onExpired?: (userId: number) => Promise<void>
): Promise<{ sent: number; failed: number }> {
  if (!subs.length) return { sent: 0, failed: 0 }
  initVapid()
  const json = JSON.stringify(payload)
  let sent = 0, failed = 0
  await Promise.all(subs.map(async ({ user_id, subscription }) => {
    try {
      await webpush.sendNotification(subscription as any, json)
      sent++
    } catch (err: any) {
      failed++
      if ((err.statusCode === 410 || err.statusCode === 404) && onExpired) {
        await onExpired(user_id).catch(() => {})
      }
    }
  }))
  return { sent, failed }
}

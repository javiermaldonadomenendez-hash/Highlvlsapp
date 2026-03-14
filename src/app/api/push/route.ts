import { NextRequest, NextResponse } from 'next/server'
import { savePushSubscription, deletePushSubscription } from '@/lib/queries'

export async function POST(req: NextRequest) {
  try {
    const { action, subscription, userId } = await req.json()
    if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

    if (action === 'subscribe') {
      if (!subscription || !userId) return NextResponse.json({ error: 'Missing subscription or userId' }, { status: 400 })
      await savePushSubscription(userId, subscription)
      return NextResponse.json({ ok: true })
    }

    if (action === 'unsubscribe') {
      if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
      await deletePushSubscription(userId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[push]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

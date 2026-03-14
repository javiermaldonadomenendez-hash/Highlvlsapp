'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export function NotifPrompt() {
  const { state, showToast } = useApp()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    const asked = localStorage.getItem('hl_notif_asked')
    if (!asked) setTimeout(() => setShow(true), 3000)
  }, [])

  async function accept() {
    setShow(false)
    localStorage.setItem('hl_notif_asked', 'true')
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      showToast('🔔 Push-Notifications aktiviert!', 'green')
      await subscribePush()
    }
  }

  function decline() {
    setShow(false)
    localStorage.setItem('hl_notif_asked', 'true')
  }

  async function subscribePush() {
    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_VAPID_PUBLIC_KEY_HERE') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', subscription: sub, userId: state.user?.id }),
      })
    } catch (err) {
      console.warn('[push] subscribe failed', err)
    }
  }

  return (
    <div className={`notif-prompt ${show ? 'show' : ''}`}>
      <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
        🔔 Erinnerungen aktivieren?
      </div>
      <div style={{ fontSize: '.63rem', color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 11 }}>
        Erhalte täglich motivierende Push-Benachrichtigungen und Erinnerungen bei offenen Quests.
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="np-btn no" onClick={decline}>Nein danke</button>
        <button className="np-btn yes" onClick={accept}>Ja, aktivieren</button>
      </div>
    </div>
  )
}

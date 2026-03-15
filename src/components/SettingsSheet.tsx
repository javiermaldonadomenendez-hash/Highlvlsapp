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

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsSheet({ open, onClose }: Props) {
  const { state, showToast } = useApp()
  const [permState, setPermState] = useState<NotificationPermission | 'unsupported'>('default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) { setPermState('unsupported'); return }
    setPermState(Notification.permission)
  }, [open])

  async function subscribePush() {
    if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return
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
  }

  async function handleToggle() {
    if (permState === 'unsupported') return
    if (permState === 'denied') {
      showToast('⚙️ Bitte in den Browser-Einstellungen aktivieren')
      return
    }
    setLoading(true)
    try {
      if (permState === 'granted') {
        // Unsubscribe
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.getSubscription()
          if (sub) await sub.unsubscribe()
        }
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'unsubscribe', userId: state.user?.id }),
        })
        localStorage.removeItem('hl_notif_asked')
        setPermState('default')
        showToast('🔕 Push-Notifications deaktiviert')
      } else {
        // Request permission + subscribe
        const perm = await Notification.requestPermission()
        setPermState(perm)
        if (perm === 'granted') {
          await subscribePush()
          localStorage.setItem('hl_notif_asked', 'true')
          showToast('🔔 Push-Notifications aktiviert!', 'green')
        } else {
          showToast('❌ Berechtigung verweigert')
        }
      }
    } catch (e: any) {
      showToast('❌ ' + (e?.message ?? 'Fehler'))
    } finally {
      setLoading(false)
    }
  }

  const isOn = permState === 'granted'
  const isDenied = permState === 'denied'

  return (
    <div className={`overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <span>⚙️</span>
          <span>Einstellungen</span>
          <button className="sheet-close" onClick={onClose}>✕</button>
        </div>

        <div className="sec-label" style={{ marginTop: 4 }}>Benachrichtigungen</div>

        <div className="setting-row">
          <div>
            <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 2 }}>🔔 Push-Notifications</div>
            <div style={{ fontSize: '.62rem', color: 'var(--muted2)', lineHeight: 1.4 }}>
              {isDenied
                ? '⚠️ Im Browser blockiert — in den Einstellungen aktivieren'
                : isOn
                ? 'Tägliche Erinnerungen & Quest-Alerts aktiv'
                : 'Erhalte tägliche Motivation & Quest-Erinnerungen'}
            </div>
          </div>
          <button
            className={`setting-toggle ${isOn ? 'on' : ''} ${isDenied ? 'denied' : ''}`}
            onClick={handleToggle}
            disabled={loading || permState === 'unsupported'}
            style={isDenied ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
          >
            <div className="toggle-knob" />
          </button>
        </div>

        <div className="sec-label">Konto</div>
        <div className="setting-row">
          <div>
            <div style={{ fontSize: '.82rem', fontWeight: 700, marginBottom: 2 }}>👤 Angemeldet als</div>
            <div style={{ fontSize: '.62rem', color: 'var(--muted2)' }}>{state.user?.name} · {state.user?.role}</div>
          </div>
        </div>

        <button className="sheet-save" style={{ width: '100%', marginTop: 14 }} onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  )
}

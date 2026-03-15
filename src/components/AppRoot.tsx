'use client'

import { useEffect } from 'react'
import { useApp } from '@/lib/store'
import { LoginScreen } from './LoginScreen'
import { AppShell } from './AppShell'
import { Toast } from './Toast'
import { XPPop } from './XPPop'
import { Mascot } from './Mascot'
import { CookieBanner } from './CookieBanner'
import type { User, Team } from '@/types'

interface Props {
  users: User[]
  teams: Team[]
}

// Full-screen skeleton shown during localStorage hydration
function AppSkeleton() {
  return (
    <div className="screen active" style={{ justifyContent: 'flex-start' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px 7px' }}>
        <div className="sk-bar" style={{ width: 120, height: 28, borderRadius: 8 }} />
        <div className="sk-bar" style={{ width: 80, height: 28, borderRadius: 14 }} />
      </div>
      {/* Deadline strip */}
      <div style={{ padding: '3px 14px' }}>
        <div className="sk-bar" style={{ height: 34, borderRadius: 10 }} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: '7px 13px 80px' }}>
        <div className="sk-bar" style={{ height: 72, borderRadius: 16, marginBottom: 9 }} />
        <div className="sk-bar" style={{ height: 36, borderRadius: 10, marginBottom: 9 }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="sk-bar" style={{ height: 68, borderRadius: 15, marginBottom: 6, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(13,17,23,.94)', borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', padding: '5px 0 env(safe-area-inset-bottom, 0px)' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '3px 1px' }}>
            <div className="sk-bar" style={{ width: 22, height: 22, borderRadius: '50%' }} />
            <div className="sk-bar" style={{ width: 30, height: 8, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AppRoot({ users, teams }: Props) {
  const { state } = useApp()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Show skeleton while reading localStorage (prevents login flash)
  if (!state.hydrated) return <AppSkeleton />

  return (
    <>
      {!state.user
        ? <LoginScreen users={users} teams={teams} />
        : <AppShell teams={teams} />
      }
      <Mascot />
      <Toast />
      <XPPop />
      <CookieBanner />
    </>
  )
}

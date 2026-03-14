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

export function AppRoot({ users, teams }: Props) {
  const { state } = useApp()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

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

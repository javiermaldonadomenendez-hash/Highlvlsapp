'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useApp } from '@/lib/store'
import { initials, nextSunday23 } from '@/lib/helpers'
import { LEADER_IDS } from '@/lib/data'
import { NotifPrompt } from './NotifPrompt'
import { SettingsSheet } from './SettingsSheet'
import type { Team } from '@/types'

// ── Skeleton ──────────────────────────────────────────────────
function TabSkeleton() {
  return (
    <div style={{ padding: '8px 0' }}>
      <div className="sk-bar" style={{ height: 72, borderRadius: 16, marginBottom: 9 }} />
      <div className="sk-bar" style={{ height: 36, borderRadius: 10, marginBottom: 9 }} />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="sk-bar" style={{ height: 68, borderRadius: 15, marginBottom: 6, animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  )
}

// ── Dynamic Tab Imports ───────────────────────────────────────
const QuestsTab   = dynamic(() => import('./tabs/QuestsTab').then(m => ({ default: m.QuestsTab })),     { loading: () => <TabSkeleton />, ssr: false })
const KpiTab      = dynamic(() => import('./tabs/KpiTab').then(m => ({ default: m.KpiTab })),           { loading: () => <TabSkeleton />, ssr: false })
const RankingTab  = dynamic(() => import('./tabs/RankingTab').then(m => ({ default: m.RankingTab })),   { loading: () => <TabSkeleton />, ssr: false })
const ContactsTab = dynamic(() => import('./tabs/ContactsTab').then(m => ({ default: m.ContactsTab })), { loading: () => <TabSkeleton />, ssr: false })
const PinboardTab = dynamic(() => import('./tabs/PinboardTab').then(m => ({ default: m.PinboardTab })), { loading: () => <TabSkeleton />, ssr: false })
const LeaderTab   = dynamic(() => import('./tabs/LeaderTab').then(m => ({ default: m.LeaderTab })),     { loading: () => <TabSkeleton />, ssr: false })

interface Props {
  teams: Team[]
}

export function AppShell({ teams }: Props) {
  const { state, logout, setTab, showMascot } = useApp()
  const { user, currentTab } = state
  const [dlText, setDlText] = useState('–')
  const [dlUrgent, setDlUrgent] = useState(false)
  const [dlPct, setDlPct] = useState(100)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isLeader = user ? LEADER_IDS.includes(user.id) : false

  // Deadline timer
  useEffect(() => {
    function update() {
      const now = new Date()
      const dl = nextSunday23()
      const diff = dl.getTime() - now.getTime()
      if (diff < 0) { setDlText('Vorbei!'); setDlUrgent(true); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setDlText(`SO 23:00 · ${d ? d + 'T ' : ''}${h}H ${m}M`)
      setDlUrgent(diff < 7200000)
      setDlPct(Math.max(0, Math.min(100, (1 - diff / (7 * 86400000)) * 100)))
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  // Badge
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      navigator.clearAppBadge?.().catch(() => {})
    }
  }, [currentTab])

  // Mascot on quests tab
  useEffect(() => {
    if (currentTab === 'quests') {
      setTimeout(() => showMascot('lucasfreude.png', 'Los geht\'s! 💪 Erledige deine Quests für heute.', false), 300)
    }
  }, [currentTab, showMascot])

  function handleLogout() {
    if (confirm('Abmelden?')) logout()
  }

  const tabs = [
    { id: 'quests',   icon: '⚔️',  label: 'Quests' },
    { id: 'kpi',      icon: '🎯',  label: 'KPIs' },
    { id: 'ranking',  icon: '🏆',  label: 'Ranking' },
    { id: 'contacts', icon: '👥',  label: 'Kontakte' },
    { id: 'pinboard', icon: '📌',  label: 'Board' },
    ...(isLeader ? [{ id: 'leader', icon: '👑', label: 'Team' }] : []),
  ] as const

  if (!user) return null

  return (
    <div className="screen active" id="appScreen">
      <div className="app-header">
        <div className="hl-logo">High<span>levels</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 6px', color: 'var(--muted)', lineHeight: 1 }}
            aria-label="Einstellungen"
          >⚙️</button>
          <div className="user-chip" onClick={handleLogout}>
            <span style={{ fontSize: '.76rem', fontWeight: 600, color: 'var(--muted2)' }}>{user.name}</span>
            <div className="user-av">{initials(user.name)}</div>
          </div>
        </div>
      </div>

      <div className="dl-strip">
        <div className="dl-inner">
          <span className="dl-label">⏰ Deadline</span>
          <span className={`dl-time ${dlUrgent ? 'urgent' : ''}`}>{dlText}</span>
          <div className="dl-bar-wrap">
            <div className="dl-bar-fill" style={{ width: `${dlPct}%` }} />
          </div>
        </div>
      </div>

      <div className="content-area" id="content">
        {currentTab === 'quests'   && <QuestsTab />}
        {currentTab === 'kpi'      && <KpiTab teams={teams} />}
        {currentTab === 'ranking'  && <RankingTab teams={teams} />}
        {currentTab === 'contacts' && <ContactsTab />}
        {currentTab === 'pinboard' && <PinboardTab />}
        {currentTab === 'leader'   && isLeader && <LeaderTab teams={teams} />}
      </div>

      <div className="bottom-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`nbtn ${currentTab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id as any)}
          >
            <span className="ni">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <NotifPrompt />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

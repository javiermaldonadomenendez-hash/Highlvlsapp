'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getAllKpiEntriesThisWeek, getAllBwsEntriesThisMonth, getUsers } from '@/lib/queries'
import { calcPtsFromEntries, fmtBWS, kwNum, monthKey } from '@/lib/helpers'
import { TEAM_GRADIENT } from '@/lib/data'
import type { User, Team, TeamKey, RankPeriod } from '@/types'

interface Props { teams: Team[] }

interface RankEntry {
  user: User
  score: number
  label: string
}

export function RankingTab({ teams }: Props) {
  const { state } = useApp()
  const user = state.user!
  const [period, setPeriod] = useState<RankPeriod>('weekly')
  const [ranked, setRanked] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [users, kpiData, bwsData] = await Promise.all([
      getUsers(),
      getAllKpiEntriesThisWeek(),
      getAllBwsEntriesThisMonth(),
    ])

    let entries: RankEntry[] = []

    if (period === 'weekly') {
      entries = users.map(u => {
        const uEntries = kpiData.filter(e => e.user_id === u.id).map(e => ({
          kpi_id: e.kpi_id, week_key: '', values: e.values ?? [], slider_value: e.slider_value
        }))
        const score = calcPtsFromEntries(uEntries)
        return { user: u, score, label: 'Pts' }
      })
    } else {
      entries = users.map(u => {
        const bws = bwsData.find(e => e.user_id === u.id)
        return { user: u, score: bws?.value ?? 0, label: '€ BWS' }
      })
    }

    entries.sort((a, b) => b.score - a.score)
    setRanked(entries)
    setLoading(false)
  }, [period])

  useEffect(() => { load() }, [load])

  const myRank = ranked.findIndex(r => r.user.id === user.id) + 1
  const myEntry = ranked.find(r => r.user.id === user.id)
  const top3 = ranked.slice(0, 3)
  const rest = ranked.slice(3, 10)
  const maxScore = ranked[0]?.score ?? 1

  function teamGradient(u: User) {
    return TEAM_GRADIENT[u.team_key as TeamKey] ?? 'var(--accent)'
  }

  function initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
  }

  // podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumClass = (entry: RankEntry) => {
    const rank = ranked.indexOf(entry) + 1
    return rank === 1 ? 'p1' : rank === 2 ? 'p2' : 'p3'
  }
  const podiumMedal = (entry: RankEntry) => {
    const rank = ranked.indexOf(entry) + 1
    return rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
  }

  const isWeekly = period === 'weekly'
  const heroLabel = isWeekly ? `KW ${kwNum()} · Wöchentliche Punkte` : `${monthKey()} · Monatlicher BWS`

  return (
    <div>
      {/* Switcher */}
      <div className="rank-switcher">
        <button className={`rank-sw-btn kpi-sw ${isWeekly ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>
          <span className="sw-icon">📊</span>KPI Ranking
        </button>
        <button className={`rank-sw-btn bws-sw ${!isWeekly ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>
          <span className="sw-icon">💰</span>BWS Ranking
        </button>
      </div>

      {/* Hero */}
      <div className={`rank-hero ${isWeekly ? 'kpi-hero' : 'bws-hero'}`}>
        <div>
          <div className="rank-hero-title">{isWeekly ? 'Wochen-Ranking' : 'BWS-Ranking'}</div>
          <div className="rank-hero-sub">{heroLabel}</div>
        </div>
        <div className="rank-hero-badge">{isWeekly ? '📊' : '💰'}</div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'32px', color:'var(--muted)', fontSize:'.75rem' }}>Laden…</div>
      ) : ranked.length === 0 ? (
        <div className="rank-empty">
          <span className="rank-empty-icon">📭</span>
          <div className="rank-empty-text">Noch keine Daten für diese Periode.</div>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <div className="rank-podium">
              {podiumOrder.map(entry => {
                if (!entry) return <div key="empty" />
                const cls = podiumClass(entry)
                return (
                  <div key={entry.user.id} className={`rank-pod ${cls}`}>
                    <div className="rank-pod-medal">{podiumMedal(entry)}</div>
                    <div className="rank-pod-av" style={{ background: teamGradient(entry.user) }}>
                      {initials(entry.user.name)}
                    </div>
                    <div className="rank-pod-name">{entry.user.name.split(' ')[0]}</div>
                    <div className="rank-pod-role">{entry.user.role}</div>
                    <div className="rank-pod-score">
                      {isWeekly ? entry.score : fmtBWS(entry.score)}
                    </div>
                    <div className="rank-pod-lbl">{entry.label}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Rest 4–10 */}
          {rest.length > 0 && (
            <>
              <div style={{ fontSize:'.52rem', fontWeight:700, letterSpacing:'.09em', textTransform:'uppercase', color:'var(--muted)', margin:'10px 0 5px 2px' }}>
                Plätze 4–10
              </div>
              {rest.map((entry, i) => {
                const rank = i + 4
                const barPct = maxScore > 0 ? (entry.score / maxScore) * 100 : 0
                const barColor = isWeekly
                  ? 'linear-gradient(90deg,var(--accent),#a78bfa)'
                  : 'linear-gradient(90deg,var(--gold),#f97316)'
                return (
                  <div key={entry.user.id} className="rank-row">
                    <div className="rank-row-num">{rank}</div>
                    <div className="rank-row-av" style={{ background: teamGradient(entry.user) }}>
                      {initials(entry.user.name)}
                    </div>
                    <div className="rank-row-info">
                      <div className="rank-row-name">{entry.user.name}</div>
                      <div className="rank-row-bar">
                        <div className="rank-row-bar-fill" style={{ width:`${barPct}%`, background: barColor }} />
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div className="rank-row-score" style={{ color: isWeekly ? 'var(--accent)' : 'var(--gold)' }}>
                        {isWeekly ? entry.score : fmtBWS(entry.score)}
                      </div>
                      <div className="rank-row-lbl">{entry.label}</div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* My rank card (if outside top 10) */}
          {myRank > 10 && myEntry && (
            <div className="rank-me">
              <div className="rank-row-num">{myRank}</div>
              <div className="rank-row-av" style={{ background: teamGradient(user) }}>{initials(user.name)}</div>
              <div className="rank-row-info">
                <div className="rank-row-name">
                  {user.name}
                  <span style={{ fontSize:'.5rem', fontWeight:700, color:'var(--accent)', background:'rgba(79,140,255,.15)', borderRadius:5, padding:'2px 5px', marginLeft:4 }}>Du</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div className="rank-row-score">{isWeekly ? myEntry.score : fmtBWS(myEntry.score)}</div>
                <div className="rank-row-lbl">{myEntry.label}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

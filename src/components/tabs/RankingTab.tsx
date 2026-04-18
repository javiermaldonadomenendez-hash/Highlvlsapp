'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getAllKpiEntriesThisWeek, getAllBwsEntriesThisMonth, getUsers, getSubTeamT1ThisMonth, saveSubTeamT1 } from '@/lib/queries'
import { calcPtsFromEntries, fmtBWS, kwNum, monthKey } from '@/lib/helpers'
import { TEAM_GRADIENT, SUB_TEAMS, CUP_GOAL, CUP_MAX_PCT, CUP_PRIZE, CUP_MONTH } from '@/lib/data'
import type { User, Team, TeamKey, RankPeriod, SubTeamT1 } from '@/types'

interface Props { teams: Team[] }

interface RankEntry {
  user: User
  score: number
  label: string
}

export function RankingTab({ teams }: Props) {
  const { state, showToast } = useApp()
  const user = state.user!
  const [period, setPeriod] = useState<RankPeriod>('weekly')
  const [ranked, setRanked] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Cup state
  const [cupEntries, setCupEntries] = useState<SubTeamT1[]>([])
  const [cupUsers, setCupUsers] = useState<User[]>([])
  const [myT1Input, setMyT1Input] = useState(0)
  const [cupSaving, setCupSaving] = useState(false)

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

  const loadCup = useCallback(async () => {
    setLoading(true)
    const [users, t1Data] = await Promise.all([getUsers(), getSubTeamT1ThisMonth()])
    setCupUsers(users)
    setCupEntries(t1Data)
    const myEntry = t1Data.find(e => e.user_id === user.id)
    setMyT1Input(myEntry?.count ?? 0)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    if (period === 'cup') loadCup()
    else load()
  }, [period, load, loadCup])

  async function handleSaveCup() {
    setCupSaving(true)
    await saveSubTeamT1(user.id, myT1Input)
    showToast('✅ T1 gespeichert', 'green')
    await loadCup()
    setCupSaving(false)
  }

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

  // Cup helpers
  const mySubTeam = SUB_TEAMS.find(st => st.members.includes(user.id))

  function getCupTeamTotal(memberIds: number[]) {
    return memberIds.reduce((sum, uid) => {
      const e = cupEntries.find(x => x.user_id === uid)
      return sum + (e?.count ?? 0)
    }, 0)
  }

  function getCupMemberCount(userId: number) {
    return cupEntries.find(e => e.user_id === userId)?.count ?? 0
  }

  function getUserName(uid: number) {
    return cupUsers.find(u => u.id === uid)?.name ?? `#${uid}`
  }

  const cupTeamsSorted = [...SUB_TEAMS].sort(
    (a, b) => getCupTeamTotal(b.members) - getCupTeamTotal(a.members)
  )

  const isCupMonth = monthKey() === CUP_MONTH

  return (
    <div>
      {/* Switcher */}
      <div className="rank-switcher" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button className={`rank-sw-btn kpi-sw ${isWeekly ? 'active' : ''}`} onClick={() => setPeriod('weekly')} style={{ flex: 1 }}>
          <span className="sw-icon">📊</span>KPI Ranking
        </button>
        <button className={`rank-sw-btn bws-sw ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')} style={{ flex: 1 }}>
          <span className="sw-icon">💰</span>BWS Ranking
        </button>
        <button
          className={`rank-sw-btn ${period === 'cup' ? 'active' : ''}`}
          onClick={() => setPeriod('cup')}
          style={{
            flex: 1,
            background: period === 'cup' ? 'linear-gradient(135deg,#f5a623,#f97316)' : 'var(--card)',
            color: period === 'cup' ? '#fff' : 'var(--muted)',
            border: period === 'cup' ? 'none' : '1px solid var(--border)',
            borderRadius: 12,
            padding: '8px 4px',
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '.62rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>🏆</span>Team-Cup
        </button>
      </div>

      {/* ── TEAM-CUP VIEW ────────────────────────────────────── */}
      {period === 'cup' && (
        <>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg,#f5a623,#f97316)',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 10,
            color: '#fff',
          }}>
            <div style={{ fontSize: '.62rem', fontWeight: 700, opacity: .8, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>
              Team-Wettbewerb · {isCupMonth ? 'Mai 2026' : monthKey()}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>🏆 10 T1 Challenge</div>
            <div style={{ fontSize: '.68rem', opacity: .9 }}>🎬 Preis: {CUP_PRIZE}</div>
            <div style={{ fontSize: '.62rem', opacity: .75, marginTop: 4 }}>Max. 60% von einer Person · Team-Leistung zählt</div>
          </div>

          {/* My T1 Input */}
          {mySubTeam && (
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '12px 14px',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: '.6rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                Deine T1 ({mySubTeam.name})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <button
                    onClick={() => setMyT1Input(Math.max(0, myT1Input - 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '1rem', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >−</button>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, minWidth: 36, textAlign: 'center', color: 'var(--text)' }}>{myT1Input}</span>
                  <button
                    onClick={() => setMyT1Input(Math.min(CUP_GOAL, myT1Input + 1))}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '1rem', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >+</button>
                  <span style={{ fontSize: '.65rem', color: 'var(--muted)', marginLeft: 4 }}>T1 diesen Monat</span>
                </div>
                <button
                  onClick={handleSaveCup}
                  disabled={cupSaving}
                  style={{
                    background: 'linear-gradient(135deg,#f5a623,#f97316)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 14px',
                    color: '#fff',
                    fontSize: '.68rem',
                    fontWeight: 700,
                    cursor: cupSaving ? 'not-allowed' : 'pointer',
                    opacity: cupSaving ? .7 : 1,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {cupSaving ? '…' : 'Speichern'}
                </button>
              </div>
            </div>
          )}

          {/* Team List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)', fontSize: '.75rem' }}>Laden…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cupTeamsSorted.map((team, idx) => {
                const total = getCupTeamTotal(team.members)
                const pct = Math.min(1, total / CUP_GOAL)
                const done = total >= CUP_GOAL
                const memberCounts = team.members.map(uid => ({ uid, count: getCupMemberCount(uid), name: getUserName(uid) }))
                const maxMemberCount = Math.max(...memberCounts.map(m => m.count), 0)
                const overLimit = total > 0 && maxMemberCount / total > CUP_MAX_PCT

                return (
                  <div
                    key={team.name}
                    style={{
                      background: 'var(--card)',
                      border: done ? '1.5px solid #22c97a' : overLimit ? '1.5px solid rgba(255,79,79,.4)' : '1px solid var(--border)',
                      borderRadius: 14,
                      padding: '12px 14px',
                    }}
                  >
                    {/* Team header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>{team.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--text)' }}>
                          {idx + 1}. {team.name}
                          {done && <span style={{ marginLeft: 6, fontSize: '.6rem', background: '#22c97a', color: '#fff', borderRadius: 6, padding: '2px 6px' }}>✅ Ziel erreicht!</span>}
                          {overLimit && !done && <span style={{ marginLeft: 6, fontSize: '.6rem', background: 'rgba(255,79,79,.15)', color: 'var(--red)', borderRadius: 6, padding: '2px 6px' }}>⚠️ &gt;60% Limit</span>}
                        </div>
                        <div style={{ fontSize: '.6rem', color: 'var(--muted)', marginTop: 1 }}>
                          {memberCounts.map(m => `${m.name}: ${m.count}`).join(' · ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '.85rem', fontWeight: 800, color: done ? '#22c97a' : 'var(--accent)' }}>{total}</span>
                        <span style={{ fontSize: '.6rem', color: 'var(--muted)' }}>/{CUP_GOAL}</span>
                      </div>
                    </div>

                    {/* Timeline Steps */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflowX: 'auto' }}>
                      {Array.from({ length: CUP_GOAL }, (_, i) => {
                        const filled = i < total
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: filled
                                ? done
                                  ? '#22c97a'
                                  : 'linear-gradient(135deg,#f5a623,#f97316)'
                                : 'var(--bg)',
                              border: filled ? 'none' : '1.5px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '.5rem',
                              fontWeight: 800,
                              color: filled ? '#fff' : 'var(--muted)',
                              transition: 'background .2s',
                            }}>
                              {i + 1}
                            </div>
                            {i < CUP_GOAL - 1 && (
                              <div style={{ width: 6, height: 1.5, background: filled && i + 1 < total ? (done ? '#22c97a' : '#f5a623') : 'var(--border)', flexShrink: 0 }} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginTop: 8, height: 4, background: 'var(--bg)', borderRadius: 99 }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 99,
                        width: `${pct * 100}%`,
                        background: done ? '#22c97a' : 'linear-gradient(90deg,#f5a623,#f97316)',
                        transition: 'width .3s',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── KPI / BWS RANKING VIEW ───────────────────────────── */}
      {period !== 'cup' && (
        <>
          {/* Hero */}
          <div className={`rank-hero ${isWeekly ? 'kpi-hero' : 'bws-hero'}`}>
            <div>
              <div className="rank-hero-title">{isWeekly ? 'Wochen-Ranking' : 'BWS-Ranking'}</div>
              <div className="rank-hero-sub">{heroLabel}</div>
            </div>
            <div className="rank-hero-badge">{isWeekly ? '📊' : '💰'}</div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)', fontSize: '.75rem' }}>Laden…</div>
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
                  <div style={{ fontSize: '.52rem', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--muted)', margin: '10px 0 5px 2px' }}>
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
                            <div className="rank-row-bar-fill" style={{ width: `${barPct}%`, background: barColor }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
                      <span style={{ fontSize: '.5rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(79,140,255,.15)', borderRadius: 5, padding: '2px 5px', marginLeft: 4 }}>Du</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="rank-row-score">{isWeekly ? myEntry.score : fmtBWS(myEntry.score)}</div>
                    <div className="rank-row-lbl">{myEntry.label}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

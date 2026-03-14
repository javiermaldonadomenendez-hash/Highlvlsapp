'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getUsersByTeam, getQuestCompletions, getUserXp, getBwsEntry, getAllKpiEntriesThisWeek } from '@/lib/queries'
import { dayKey, initials, fmtBWS, calcPtsFromEntries } from '@/lib/helpers'
import { QUESTS, ROLE_ORDER } from '@/lib/data'
import type { User, Team } from '@/types'

interface Props { teams: Team[] }

interface MemberStat {
  user: User
  questsDone: number
  xp: number
  pts: number
  bws: number
}

export function LeaderTab({ teams }: Props) {
  const { state } = useApp()
  const user = state.user!
  const [members, setMembers] = useState<MemberStat[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const teamUsers = await getUsersByTeam(user.team_key)
    const sorted = [...teamUsers].sort((a, b) => {
      const ro = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
      return ro !== 0 ? ro : a.name.localeCompare(b.name)
    })

    const kpiData = await getAllKpiEntriesThisWeek()

    const stats = await Promise.all(sorted.map(async m => {
      const [comps, xpData, bws] = await Promise.all([
        getQuestCompletions(m.id),
        getUserXp(m.id),
        getBwsEntry(m.id),
      ])
      const questsDone = comps.filter(c => c.day_key === dayKey()).length
      const uEntries = kpiData.filter(e => e.user_id === m.id).map(e => ({
        kpi_id: e.kpi_id, week_key: '', values: e.values ?? [], slider_value: e.slider_value
      }))
      const pts = calcPtsFromEntries(uEntries)
      return { user: m, questsDone, xp: xpData.xp, pts, bws }
    }))

    setMembers(stats)
    setLoading(false)
  }, [user.team_key])

  useEffect(() => { load() }, [load])

  const totalMembers = members.length
  const allQuestsDone = members.filter(m => m.questsDone === QUESTS.length).length
  const avgPts = totalMembers > 0 ? Math.round(members.reduce((s, m) => s + m.pts, 0) / totalMembers) : 0
  const totalBws = members.reduce((s, m) => s + m.bws, 0)
  const team = teams.find(t => t.key === user.team_key)

  return (
    <div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.1rem', letterSpacing:'.07em', marginBottom:10 }}>
        👑 Team {team?.name ?? user.team_key}
      </div>

      {/* Summary cards */}
      <div className="leader-summary">
        <div className="ls-card">
          <div className="ls-val green">{allQuestsDone}/{totalMembers}</div>
          <div className="ls-lbl">Quests heute ✅</div>
        </div>
        <div className="ls-card">
          <div className="ls-val gold">{avgPts}</div>
          <div className="ls-lbl">Ø KPI Punkte</div>
        </div>
        <div className="ls-card">
          <div className="ls-val accent" style={{ color:'var(--accent)' }}>{fmtBWS(totalBws)}</div>
          <div className="ls-lbl">Team BWS gesamt</div>
        </div>
        <div className="ls-card">
          <div className="ls-val">{totalMembers}</div>
          <div className="ls-lbl">Teammitglieder</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'24px', color:'var(--muted)', fontSize:'.75rem' }}>Laden…</div>
      ) : (
        <>
          <div className="sec-label">Mitglieder</div>
          {members.map(m => (
            <div key={m.user.id} className="leader-card">
              <div className="leader-av">{initials(m.user.name)}</div>
              <div className="leader-info" style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.78rem', fontWeight:700 }}>{m.user.name}</div>
                <div style={{ fontSize:'.55rem', color:'var(--muted)', marginTop:1 }}>{m.user.role} · {m.pts} Pts · BWS {fmtBWS(m.bws)}</div>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {QUESTS.map((q, i) => (
                  <div key={q.id} className={`lq-dot ${i < m.questsDone ? 'done' : ''}`}>
                    {i < m.questsDone ? '✓' : ''}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

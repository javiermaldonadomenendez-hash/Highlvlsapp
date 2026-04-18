'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getUsers, getSubTeamT1ThisMonth, saveSubTeamT1 } from '@/lib/queries'
import { SUB_TEAMS, CUP_GOAL, CUP_MAX_PCT, CUP_PRIZE } from '@/lib/data'
import type { User, SubTeamT1 } from '@/types'

export function CupTab() {
  const { state, showToast } = useApp()
  const user = state.user!

  const [cupEntries, setCupEntries] = useState<SubTeamT1[]>([])
  const [cupUsers, setCupUsers] = useState<User[]>([])
  const [myT1Input, setMyT1Input] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [users, t1Data] = await Promise.all([getUsers(), getSubTeamT1ThisMonth()])
    setCupUsers(users)
    setCupEntries(t1Data)
    const myEntry = t1Data.find(e => e.user_id === user.id)
    setMyT1Input(myEntry?.count ?? 0)
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    await saveSubTeamT1(user.id, myT1Input)
    showToast('✅ T1 gespeichert', 'green')
    await load()
    setSaving(false)
  }

  function getCupTeamTotal(memberIds: number[]) {
    return memberIds.reduce((sum, uid) => {
      return sum + (cupEntries.find(x => x.user_id === uid)?.count ?? 0)
    }, 0)
  }

  function getMemberCount(uid: number) {
    return cupEntries.find(e => e.user_id === uid)?.count ?? 0
  }

  function getUserName(uid: number) {
    return cupUsers.find(u => u.id === uid)?.name ?? `#${uid}`
  }

  const mySubTeam = SUB_TEAMS.find(st => st.members.includes(user.id))

  const cupTeamsSorted = [...SUB_TEAMS].sort(
    (a, b) => getCupTeamTotal(b.members) - getCupTeamTotal(a.members)
  )

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#f5a623,#f97316)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 10,
        color: '#fff',
      }}>
        <div style={{ fontSize: '.62rem', fontWeight: 700, opacity: .8, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>
          Team-Wettbewerb · Mai 2026
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
            Deine T1 · {mySubTeam.emoji} {mySubTeam.name}
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
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg,#f5a623,#f97316)',
                border: 'none',
                borderRadius: 10,
                padding: '8px 14px',
                color: '#fff',
                fontSize: '.68rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? .7 : 1,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {saving ? '…' : 'Speichern'}
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
            const done = total >= CUP_GOAL
            const memberCounts = team.members.map(uid => ({ uid, count: getMemberCount(uid), name: getUserName(uid) }))
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  {Array.from({ length: CUP_GOAL }, (_, i) => {
                    const filled = i < total
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: filled
                            ? done ? '#22c97a' : 'linear-gradient(135deg,#f5a623,#f97316)'
                            : 'var(--bg)',
                          border: filled ? 'none' : '1.5px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '.5rem',
                          fontWeight: 800,
                          color: filled ? '#fff' : 'var(--muted)',
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
                    width: `${Math.min(1, total / CUP_GOAL) * 100}%`,
                    background: done ? '#22c97a' : 'linear-gradient(90deg,#f5a623,#f97316)',
                    transition: 'width .3s',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

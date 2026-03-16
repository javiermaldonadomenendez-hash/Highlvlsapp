'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getKpiEntries, saveKpiEntry, getBwsEntry, saveBwsEntry } from '@/lib/queries'
import { weekKey, kwNum, fmtBWS, calcPtsFromEntries } from '@/lib/helpers'
import { KPIS, SLIDER_KPI_IDS, MAX_PTS } from '@/lib/data'
import type { KpiEntry, Team } from '@/types'

interface Props { teams: Team[] }

export function KpiTab({ teams }: Props) {
  const { state, showToast } = useApp()
  const user = state.user!
  const team = teams.find(t => t.key === user.team_key)

  const [entries, setEntries] = useState<KpiEntry[]>([])
  const [bwsVal, setBwsVal] = useState(0)
  const [bwsInput, setBwsInput] = useState('')
  const [openKec, setOpenKec] = useState<string | null>(null)
  const [localVals, setLocalVals] = useState<Record<string, string[]>>({})
  const [sliderVals, setSliderVals] = useState<Record<string, number>>({})
  const [checkedVals, setCheckedVals] = useState<Record<string, boolean[]>>({})

  const load = useCallback(async () => {
    const [kpiData, bws] = await Promise.all([getKpiEntries(user.id), getBwsEntry(user.id)])
    setEntries(kpiData)
    setBwsVal(bws)
    setBwsInput(bws > 0 ? String(bws) : '')
    const lv: Record<string, string[]> = {}
    const sv: Record<string, number> = {}
    for (const k of KPIS) {
      const e = kpiData.find(x => x.kpi_id === k.id)
      if (SLIDER_KPI_IDS.includes(k.id)) {
        sv[k.id] = e?.slider_value ?? 0
      } else {
        const vals = e?.values ?? []
        lv[k.id] = vals.length < k.target ? [...vals, ...Array(k.target - vals.length).fill('')] : vals
      }
    }
    setLocalVals(lv)
    setSliderVals(sv)
  }, [user.id])

  useEffect(() => { load() }, [load])

  const pts = calcPtsFromEntries(entries)
  const pct = Math.round((pts / MAX_PTS) * 100)

  function updateSliderLocal(kpiId: string, val: number, target: number) {
    const clamped = Math.max(0, Math.min(target, val))
    setSliderVals(prev => ({ ...prev, [kpiId]: clamped }))
    setEntries(prev => {
      const next = prev.filter(e => e.kpi_id !== kpiId)
      next.push({ kpi_id: kpiId, week_key: weekKey(), values: [], slider_value: clamped })
      return next
    })
  }

  async function saveSlider(kpiId: string) {
    await saveKpiEntry(user.id, kpiId, [], sliderVals[kpiId] ?? 0)
  }

  async function saveKec(kpiId: string) {
    const vals = localVals[kpiId] ?? []
    await saveKpiEntry(user.id, kpiId, vals)
    setEntries(prev => {
      const next = prev.filter(e => e.kpi_id !== kpiId)
      next.push({ kpi_id: kpiId, week_key: weekKey(), values: vals, slider_value: null })
      return next
    })
    showToast('💾 Gespeichert', 'green')
  }

  async function saveAll() {
    await Promise.all(KPIS.map(k =>
      SLIDER_KPI_IDS.includes(k.id)
        ? saveKpiEntry(user.id, k.id, [], sliderVals[k.id] ?? 0)
        : saveKpiEntry(user.id, k.id, localVals[k.id] ?? [])
    ))
    showToast('💾 Alles gespeichert!', 'green')
  }

  async function handleBwsSave() {
    const val = parseInt(bwsInput) || 0
    await saveBwsEntry(user.id, val, user.name)
    setBwsVal(val)
    showToast('💾 BWS gespeichert', 'green')
  }

  const cfg = {
    bwsChallenges: (team?.bws_challenges ?? []) as any[],
    bwsMarks:      (team?.bws_marks ?? []) as any[],
    bwsMax:        team?.bws_max ?? 500000,
  }
  const bpct = Math.min((bwsVal / cfg.bwsMax) * 100, 100)
  const hc = cfg.bwsChallenges.filter(c => bwsVal >= c.threshold).length
  const barClass = `bws-bar-fill${hc >= 4 ? ' t4' : hc >= 3 ? ' t3' : hc >= 2 ? ' t2' : ''}`
  const lastHit = [...cfg.bwsChallenges].reverse().find(c => bwsVal >= c.threshold)

  const cats = [
    { key: 'high',     label: '⭐ Hauptziele' },
    { key: 'mid',      label: '🎯 Aktivitäten' },
    { key: 'ursachen', label: '📞 Ursachen' },
  ]

  return (
    <div>
      {/* BWS */}
      <div className="bws-module">
        <div className="bws-title">📈 Monats-BWS-Ziel</div>
        <div className="bws-bar-outer">
          <div className={barClass} style={{ width:`${bpct.toFixed(1)}%` }} />
          {cfg.bwsMarks.map((m: any) => (
            <div key={m.label} className="bws-mark" style={{ left:`${m.pct}%` }}>
              <span className="bws-mark-lbl">{m.label}</span>
            </div>
          ))}
          <span className="bws-end-lbl">{(cfg.bwsMax/1000).toFixed(0)}K</span>
        </div>
        <div className={`bws-status ${lastHit ? 'hit' : ''}`}>
          {lastHit ? `${(lastHit as any).icon} ${(lastHit as any).label} erreicht!` : bwsVal > 0 ? fmtBWS(bwsVal) + ' BWS' : '–'}
        </div>
        <div className="bws-prizes" style={{ gridTemplateColumns:`repeat(${cfg.bwsChallenges.length},1fr)` }}>
          {cfg.bwsChallenges.map((c: any) => (
            <div key={c.threshold} className={`bws-prize ${bwsVal >= c.threshold ? 'hit' : ''}`}>
              <div className="bws-prize-ck">{bwsVal >= c.threshold ? '✓' : '○'}</div>
              <div className="bws-prize-name">{c.label}</div>
              <div className="bws-prize-sub">{(c.threshold/1000).toFixed(0)}K</div>
            </div>
          ))}
        </div>
        {cfg.bwsChallenges.filter((c: any) => bwsVal >= c.threshold).map((c: any) => (
          <div key={c.threshold} className={c.badge}>{c.icon} {c.label}</div>
        ))}
        <div className="bws-input-row">
          <input className="bws-input" type="number" min="0" placeholder="Aktuelle BWS..."
            value={bwsInput} onChange={e => setBwsInput(e.target.value)} />
          <button className="bws-save" onClick={handleBwsSave}>💾 Speichern</button>
        </div>
      </div>

      {/* KPI Header */}
      <div className="kpi-week-hdr">
        <div>
          <div className="wl">KW {kwNum()} · Deine Woche</div>
          <div className="wn">{user.name} · {user.role}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="wpts">{pts}</div>
          <div className="wpts-sub">/ {MAX_PTS} Pts · {pct}%</div>
        </div>
      </div>

      {cats.map(cat => {
        const catKpis = KPIS.filter(k => k.cat === cat.key)
        if (!catKpis.length) return null
        return (
          <div key={cat.key}>
            <div className="kpi-cat-label">{cat.label}</div>
            {catKpis.map(k => {
              if (SLIDER_KPI_IDS.includes(k.id)) {
                const sv = sliderVals[k.id] ?? 0
                const frac = Math.min(sv / k.target, 1)
                const earned = Math.round(frac * k.pts * 10) / 10
                const full = sv >= k.target
                return (
                  <div key={k.id} className="kpi-card" style={{ padding:'12px 13px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 }}>
                      <div>
                        <div className="kec-name">{k.name}</div>
                        <div className="kec-prog">{sv} / {k.target}</div>
                      </div>
                      <div className={`kec-pts ${full ? 'full' : ''}`}>{earned} Pts</div>
                    </div>
                    <div className="sl-bar-wrap">
                      <div className={`sl-bar-fill ${full ? 'sl-full' : ''}`} style={{ width:`${(frac*100).toFixed(1)}%` }} />
                    </div>
                    <input type="range" className="sl-range" min={0} max={k.target} value={sv}
                      onChange={e => updateSliderLocal(k.id, parseInt(e.target.value), k.target)}
                      onMouseUp={() => saveSlider(k.id)}
                      onTouchEnd={() => saveSlider(k.id)} />
                    <div className="sl-controls">
                      <button className="sl-btn" onClick={() => { updateSliderLocal(k.id, sv-1, k.target); setTimeout(() => saveSlider(k.id), 100) }}>−</button>
                      <span className="sl-val">{sv}</span>
                      <button className="sl-btn" onClick={() => { updateSliderLocal(k.id, sv+1, k.target); setTimeout(() => saveSlider(k.id), 100) }}>+</button>
                    </div>
                  </div>
                )
              }

              const vals = localVals[k.id] ?? Array(k.target).fill('')
              const filled = vals.filter(v => v && v.trim()).length
              const frac = Math.min(filled / k.target, 1)
              const earned = Math.round(frac * k.pts * 10) / 10
              const isOpen = openKec === k.id

              return (
                <div key={k.id} className="kpi-card">
                  <div className="kec-hdr" onClick={() => setOpenKec(isOpen ? null : k.id)}>
                    <div>
                      <div className="kec-name">{k.name}</div>
                      <div className="kec-prog">{filled} / {k.target}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div className={`kec-pts ${filled >= k.target ? 'full' : ''}`}>{earned} Pts</div>
                      <div className={`kec-chev ${isOpen ? 'open' : ''}`}>▼</div>
                    </div>
                  </div>
                  <div className="kec-pbar">
                    <div className="kec-pbar-fill" style={{ width:`${frac*100}%` }} />
                  </div>
                  {isOpen && (
                    <div className="kec-body open">
                      {Array.from({ length: k.target }).map((_, n) => (
                        <div key={n} className="kec-entry-row">
                          <div style={{ width:17, fontSize:'.6rem', color:'var(--muted)', textAlign:'right', flexShrink:0 }}>{n+1}</div>
                          <input className={`kec-input ${vals[n]?.trim() ? 'filled' : ''} ${checkedVals[k.id]?.[n] ? 'kec-done' : ''}`} type="text"
                            value={vals[n] ?? ''} placeholder={k.placeholder}
                            onChange={e => {
                              const next = [...vals]; next[n] = e.target.value
                              setLocalVals(prev => ({ ...prev, [k.id]: next }))
                            }} />
                          {vals[n]?.trim() && (
                            <>
                              <button
                                title="Als erledigt markieren"
                                style={{ background:'none', border:'none', fontSize:'.85rem', cursor:'pointer', padding:3, flexShrink:0, opacity: checkedVals[k.id]?.[n] ? 1 : 0.35 }}
                                onClick={() => setCheckedVals(prev => {
                                  const arr = [...(prev[k.id] ?? Array(k.target).fill(false))]
                                  arr[n] = !arr[n]
                                  return { ...prev, [k.id]: arr }
                                })}>
                                {checkedVals[k.id]?.[n] ? '✅' : '☑️'}
                              </button>
                              <button style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'.8rem', cursor:'pointer', padding:3, flexShrink:0 }}
                                onClick={() => {
                                  setLocalVals(prev => { const next=[...(prev[k.id]||[])]; next[n]=''; return { ...prev, [k.id]: next } })
                                  setCheckedVals(prev => { const arr=[...(prev[k.id]??Array(k.target).fill(false))]; arr[n]=false; return { ...prev, [k.id]: arr } })
                                }}>🗑</button>
                            </>
                          )}
                        </div>
                      ))}
                      <div style={{ display:'flex', gap:6, marginTop:8 }}>
                        <button className="kec-save" onClick={() => saveKec(k.id)}>💾 Speichern</button>
                        <button className="kec-clear" onClick={() => setLocalVals(prev => ({ ...prev, [k.id]: Array(k.target).fill('') }))}>✕ Leeren</button>
                      </div>
                      <div style={{ fontSize:'.57rem', color:'var(--muted)', marginTop:6, textAlign:'right' }}>{earned} / {k.pts} Pts</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      <button className="save-all-btn" onClick={saveAll}>💾 Alles speichern</button>
    </div>
  )
}

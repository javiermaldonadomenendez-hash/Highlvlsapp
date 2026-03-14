'use client'

import { useState } from 'react'
import { createUser, deactivateUser } from '@/lib/queries'
import { ROLE_ORDER } from '@/lib/data'
import { initials } from '@/lib/helpers'
import type { User, Team, Role, TeamKey } from '@/types'

interface Props { users: User[]; teams: Team[] }

export function AdminPanel({ users: initialUsers, teams }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [formOpen, setFormOpen] = useState(false)
  const [fName, setFName]       = useState('')
  const [fRole, setFRole]       = useState<Role>('Trainee')
  const [fTeam, setFTeam]       = useState<TeamKey>('kurosch')
  const [fPin, setFPin]         = useState('')
  const [fLeader, setFLeader]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  async function handleCreate() {
    if (!fName.trim() || fPin.length !== 4) { setMsg('❌ Name und 4-stelliger PIN erforderlich'); return }
    setSaving(true)
    try {
      const newUser = await createUser({ name: fName.trim(), role: fRole, team_key: fTeam, pin: fPin, is_leader: fLeader })
      setUsers(prev => [...prev, newUser])
      setFormOpen(false)
      setFName(''); setFPin(''); setFRole('Trainee'); setFLeader(false)
      setMsg('✅ User erstellt!')
      setTimeout(() => setMsg(''), 3000)
    } catch (e: any) {
      setMsg('❌ Fehler: ' + e.message)
    }
    setSaving(false)
  }

  async function handleDeactivate(id: number, name: string) {
    if (!confirm(`${name} deaktivieren?`)) return
    await deactivateUser(id)
    setUsers(prev => prev.filter(u => u.id !== id))
    setMsg(`🗑 ${name} deaktiviert`)
    setTimeout(() => setMsg(''), 3000)
  }

  const sorted = [...users].sort((a, b) => {
    const tc = a.team_key.localeCompare(b.team_key)
    if (tc !== 0) return tc
    return (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
  })

  const grouped = teams.reduce((acc, t) => {
    acc[t.key] = sorted.filter(u => u.team_key === t.key)
    return acc
  }, {} as Record<string, User[]>)

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', color:'var(--text)', fontFamily:"'DM Sans',sans-serif", padding:'calc(env(safe-area-inset-top,20px)+16px) 16px 40px' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', letterSpacing:'.1em' }}>High<span style={{ color:'var(--gold)' }}>levels</span></div>
            <div style={{ fontSize:'.65rem', color:'var(--muted)', marginTop:-2 }}>Admin Panel</div>
          </div>
          <button
            style={{ background:'var(--green)', border:'none', borderRadius:12, padding:'10px 18px', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1rem', letterSpacing:'.06em', color:'#0d1117', cursor:'pointer' }}
            onClick={() => setFormOpen(true)}
          >+ User hinzufügen</button>
        </div>

        {msg && <div style={{ background:'var(--card)', border:'1px solid var(--border2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:'.74rem' }}>{msg}</div>}

        {/* User list per team */}
        {teams.map(team => (
          <div key={team.key} style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.1rem', letterSpacing:'.07em', color:'var(--muted2)', marginBottom:8 }}>
              {team.name} <span style={{ fontSize:'.65rem', color:'var(--muted)' }}>({grouped[team.key]?.length ?? 0})</span>
            </div>
            {(grouped[team.key] ?? []).map(u => (
              <div key={u.id} className="admin-card" style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'.9rem', color:'#fff', flexShrink:0 }}>{initials(u.name)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.82rem', fontWeight:700 }}>{u.name} {u.is_leader && <span style={{ fontSize:'.55rem', color:'var(--gold)' }}>👑</span>}</div>
                  <div style={{ display:'flex', gap:5, marginTop:3 }}>
                    <span className={`admin-badge ${u.role}`}>{u.role}</span>
                    <span style={{ fontSize:'.55rem', color:'var(--muted)', alignSelf:'center' }}>ID: {u.id}</span>
                  </div>
                </div>
                <button
                  style={{ background:'none', border:'1px solid rgba(255,79,79,.2)', borderRadius:8, padding:'5px 10px', color:'var(--red)', fontSize:'.6rem', fontWeight:700, cursor:'pointer' }}
                  onClick={() => handleDeactivate(u.id, u.name)}
                >Deaktivieren</button>
              </div>
            ))}
          </div>
        ))}

        {/* Summary */}
        <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:'12px 15px', marginTop:8 }}>
          <div style={{ fontSize:'.58rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>Übersicht</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'var(--accent)' }}>{users.length}</div>
              <div style={{ fontSize:'.55rem', color:'var(--muted)' }}>User gesamt</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'var(--gold)' }}>{teams.length}</div>
              <div style={{ fontSize:'.55rem', color:'var(--muted)' }}>Teams</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'var(--green)' }}>{users.filter(u=>u.is_leader).length}</div>
              <div style={{ fontSize:'.55rem', color:'var(--muted)' }}>Leader</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add user form */}
      {formOpen && (
        <div className="overlay open" onClick={() => setFormOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              👤 Neuer User
              <button className="sheet-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>
            <div className="sheet-field"><label>Name</label><input className="sheet-input" value={fName} onChange={e => setFName(e.target.value)} placeholder="Vorname Nachname" /></div>
            <div className="sheet-field">
              <label>Team</label>
              <select className="sheet-input" value={fTeam} onChange={e => setFTeam(e.target.value as TeamKey)}>
                {teams.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
              </select>
            </div>
            <div className="sheet-field">
              <label>Rolle</label>
              <select className="sheet-input" value={fRole} onChange={e => setFRole(e.target.value as Role)}>
                {(['CC','SC','JC','Trainee'] as Role[]).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sheet-field"><label>PIN (4 Stellen)</label><input className="sheet-input" type="password" maxLength={4} inputMode="numeric" value={fPin} onChange={e => setFPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="••••" /></div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <input type="checkbox" id="isLeader" checked={fLeader} onChange={e => setFLeader(e.target.checked)} />
              <label htmlFor="isLeader" style={{ fontSize:'.74rem', cursor:'pointer' }}>Ist Leader (sieht Team-Tab)</label>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="sheet-cancel" onClick={() => setFormOpen(false)}>Abbrechen</button>
              <button className="sheet-save" onClick={handleCreate} disabled={saving}>{saving ? 'Speichern…' : 'User erstellen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

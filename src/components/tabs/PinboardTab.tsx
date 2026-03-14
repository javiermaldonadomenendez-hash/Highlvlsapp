'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getPinboard, savePinboard } from '@/lib/queries'
import { initials } from '@/lib/helpers'
import type { PinTask, PinboardData } from '@/types'

let taskIdCounter = 0
function newTaskId() { return `t${Date.now()}_${taskIdCounter++}` }

export function PinboardTab() {
  const { state, showToast } = useApp()
  const user = state.user!

  const [notes, setNotes] = useState('')
  const [thoughts, setThoughts] = useState('')
  const [tasks, setTasks] = useState<PinTask[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await getPinboard(user.id)
    setNotes(data.notes)
    setThoughts(data.thoughts)
    setTasks(data.tasks ?? [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { load() }, [load])

  async function save() {
    const data: PinboardData = { notes, thoughts, tasks }
    await savePinboard(user.id, data)
    showToast('📌 Board gespeichert', 'green')
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function updateTask(id: string, text: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t))
  }

  function addTask() {
    setTasks(prev => [...prev, { id: newTaskId(), text: '', done: false }])
  }

  if (loading) return <div style={{ textAlign:'center', padding:'32px', color:'var(--muted)', fontSize:'.75rem' }}>Laden…</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {/* Hero header */}
      <div style={{ position:'relative', overflow:'hidden', margin:'-7px -13px 0', padding:'0 13px 0' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(79,140,255,.16) 0%,rgba(167,139,250,.09) 50%,transparent 100%)', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:12, padding:'18px 0 12px' }}>
          <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'#fff', flexShrink:0, boxShadow:'0 6px 22px rgba(79,140,255,.35)' }}>{initials(user.name)}</div>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:'.07em', lineHeight:1 }}>{user.name}</div>
            <div style={{ fontSize:'.62rem', color:'var(--muted2)', marginTop:2 }}>{user.role} · Persönliches Board</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="pin-card">
        <div className="pin-card-hdr">
          <div className="pin-card-icon notes">📝</div>
          <div>
            <div style={{ fontSize:'.88rem', fontWeight:700 }}>Notizen</div>
            <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:1 }}>Freie Gedanken & Ideen</div>
          </div>
        </div>
        <textarea className="pin-textarea" placeholder="Schreib deine Gedanken auf..." value={notes} onChange={e => setNotes(e.target.value)} />
        <button className="pin-save-btn" onClick={save}>💾 Speichern</button>
      </div>

      {/* Tasks */}
      <div className="pin-card">
        <div className="pin-card-hdr">
          <div className="pin-card-icon tasks">✅</div>
          <div>
            <div style={{ fontSize:'.88rem', fontWeight:700 }}>Aufgaben</div>
            <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:1 }}>{tasks.filter(t=>t.done).length} / {tasks.length} erledigt</div>
          </div>
        </div>
        {tasks.map(task => (
          <div key={task.id} className="pin-task-row">
            <div className={`pin-task-chk ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)}>
              {task.done ? '✓' : ''}
            </div>
            <input
              className={`pin-task-inp ${task.done ? 'done-task' : ''}`}
              value={task.text}
              placeholder="Aufgabe eingeben..."
              onChange={e => updateTask(task.id, e.target.value)}
            />
          </div>
        ))}
        <button className="pin-add-task" onClick={addTask}>+ Aufgabe hinzufügen</button>
        <button className="pin-save-btn" onClick={save}>💾 Speichern</button>
      </div>

      {/* Thoughts */}
      <div className="pin-card">
        <div className="pin-card-hdr">
          <div className="pin-card-icon thoughts">💡</div>
          <div>
            <div style={{ fontSize:'.88rem', fontWeight:700 }}>Reflexion</div>
            <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:1 }}>Was läuft gut? Was kann besser werden?</div>
          </div>
        </div>
        <textarea className="pin-textarea" placeholder="Deine Reflexionen..." value={thoughts} onChange={e => setThoughts(e.target.value)} />
        <button className="pin-save-btn" onClick={save}>💾 Speichern</button>
      </div>
    </div>
  )
}

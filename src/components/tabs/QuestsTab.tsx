'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import {
  getQuestCompletions, toggleQuest as toggleQuestAction,
  getMassnahmen, saveMassnahme, getUserXp, updateStreak
} from '@/lib/queries'
import { dayKey } from '@/lib/helpers'
import { QUESTS, MN_QUEST_IDS } from '@/lib/data'
import type { QuestCompletion, MnType } from '@/types'

export function QuestsTab() {
  const { state, showToast, showXP, showMascot } = useApp()
  const user = state.user!

  const [completions, setCompletions] = useState<QuestCompletion[]>([])
  const [xp, setXp] = useState(0)
  const [streak, setStreak] = useState({ count: 0 })
  const [justDone, setJustDone] = useState<string | null>(null)
  const [mnModal, setMnModal] = useState<MnType | null>(null)
  const [mnPerson, setMnPerson] = useState('')
  const [mnItems, setMnItems] = useState(['', '', ''])

  const load = useCallback(async () => {
    const [comps, xpData] = await Promise.all([
      getQuestCompletions(user.id),
      getUserXp(user.id),
    ])
    setCompletions(comps)
    setXp(xpData.xp)
    setStreak({ count: xpData.streak_count })
  }, [user.id])

  useEffect(() => { load() }, [load])

  const isDone = (qid: string) => completions.some(c => c.quest_id === qid)
  const doneCnt = QUESTS.filter(q => isDone(q.id)).length
  const pct = Math.round((doneCnt / QUESTS.length) * 100)

  // Reactive Lucas mascot based on time + quest status
  const lucasImg = (() => {
    if (doneCnt === QUESTS.length) return 'lucasfreude.png'
    const h = new Date().getHours()
    return h >= 18 ? 'lucastraurig.png' : 'lucassauer.png'
  })()
  const lvl = Math.floor(xp / 500) + 1
  const xpPct = Math.min((xp % 500) / 5, 100)
  const today = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  async function handleToggle(qid: string) {
    if (MN_QUEST_IDS.includes(qid)) {
      const mnType: MnType = qid === 'massnahmen_popa' ? 'popa' : 'poku'
      const existing = await getMassnahmen(user.id)
      const ent = existing.find(m => m.type === mnType)
      setMnModal(mnType)
      setMnPerson(ent?.person ?? '')
      setMnItems([ent?.item1 ?? '', ent?.item2 ?? '', ent?.item3 ?? ''])
      return
    }
    const done = !isDone(qid)
    const q = QUESTS.find(x => x.id === qid)!
    await toggleQuestAction(user.id, qid, done, q.xp)
    if (done) {
      showXP(`+${q.xp} XP`)
      showToast(`✅ ${q.name} erledigt! +${q.xp} XP`, 'green')
      setJustDone(qid)
      setTimeout(() => setJustDone(null), 600)
    } else {
      showToast(`↩ ${q.name} zurückgesetzt`)
    }
    const newComps = done
      ? [...completions, { quest_id: qid, day_key: dayKey(), xp_earned: q.xp }]
      : completions.filter(c => c.quest_id !== qid)
    setCompletions(newComps)
    setXp(prev => done ? prev + q.xp : Math.max(0, prev - q.xp))

    if (done && newComps.length === QUESTS.length) {
      await updateStreak(user.id)
      confettiBurst()
      showToast('🏆 Alle Quests erledigt!')
      setTimeout(() => showMascot('lucasfreude.png', 'WOW! Alle Quests heute geschafft! 🏆', true), 400)
    }
  }

  async function saveMn() {
    if (!mnModal) return
    await saveMassnahme(user.id, mnModal, mnPerson, mnItems)
    const filled = mnItems.filter(x => x.length > 0).length
    const qid = `massnahmen_${mnModal}`
    const wasAlreadyDone = isDone(qid)
    if ((filled >= 3 || (mnPerson && filled >= 1)) && !wasAlreadyDone) {
      const q = QUESTS.find(x => x.id === qid)!
      await toggleQuestAction(user.id, qid, true, q.xp)
      setCompletions(prev => [...prev, { quest_id: qid, day_key: dayKey(), xp_earned: q.xp }])
      setXp(prev => prev + q.xp)
      showXP(`+${q.xp} XP`)
    } else if (filled === 0 && !mnPerson && wasAlreadyDone) {
      const q = QUESTS.find(x => x.id === qid)!
      await toggleQuestAction(user.id, qid, false, q.xp)
      setCompletions(prev => prev.filter(c => c.quest_id !== qid))
      setXp(prev => Math.max(0, prev - q.xp))
    }
    setMnModal(null)
    showToast('✅ Maßnahmen gespeichert', 'green')
  }

  function confettiBurst() {
    const cols = ['#22c97a','#f5a623','#4f8cff','#ff4f4f','#fff']
    for (let i = 0; i < 26; i++) {
      const el = document.createElement('div')
      el.className = 'confetti-piece'
      el.style.cssText = `left:${Math.random()*100}vw;top:-10px;background:${cols[i%cols.length]};animation-delay:${Math.random()*.5}s;border-radius:${Math.random()>.5?'50%':'2px'}`
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
    }
  }

  const mnIsPopa = mnModal === 'popa'
  const mnPlaceholders = mnIsPopa ? [
    'z.B. Ich plane mit Max einen Magic Moment und lade ihn zur nächsten Zuführung ein.',
    'z.B. Ich führe mit Lisa das P1-Gespräch und plane gemeinsam eine Zuführung.',
    'z.B. Ich vereinbare mit Tom ein Café­gespräch und erkläre ihm das Geschäftsmodell.',
  ] : [
    'z.B. Ich bereite mit meinem Buddy den EOA-Termin mit Sarah vor und übe den Pitch.',
    'z.B. Ich bespreche mit meiner Führungskraft die Strategie für das Gespräch mit Max.',
    'z.B. Ich schicke Lisa die Unterlagen und vereinbare ein Folgegespräch.',
  ]

  return (
    <div>
      {doneCnt === QUESTS.length && (
        <div style={{ textAlign:'center', padding:'24px 16px', background:'var(--card)', border:'1px solid rgba(34,201,122,.3)', borderRadius:16, marginBottom:9 }}>
          <div style={{ fontSize:'2.5rem' }}>🏆</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.4rem', letterSpacing:'.08em', color:'var(--green)', marginTop:6 }}>Alle Quests erledigt!</div>
          <div style={{ fontSize:'.68rem', color:'var(--muted)', marginTop:3 }}>Perfekter Tag</div>
        </div>
      )}

      <div className="quest-header">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:9 }}>
          <div>
            <div className="qh-title">{doneCnt} / {QUESTS.length} Erledigt</div>
            <div className="qh-date">{today}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="qh-bar-wrap"><div className="qh-bar-fill" style={{ width:`${pct}%` }} /></div>
          <div className="qh-pct">{pct}%</div>
        </div>
        <div className="streak-row">🔥 <span className="streak-val">{streak.count}</span> Tage in Folge</div>
      </div>

      <div className="xp-row">
        <img
          src={`/emoji/${lucasImg}`}
          alt="Lucas"
          width={40}
          height={40}
          style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover', transition: 'opacity .4s' }}
        />
        <div className="xp-label">⚡ Level {lvl} · {xp} XP</div>
        <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{ width:`${xpPct}%` }} /></div>
        <div className="xp-val">{xp % 500} / 500</div>
      </div>

      <div className="sec-label">Tagesaufgaben</div>

      {QUESTS.map(q => {
        const done = isDone(q.id)
        const isMn = MN_QUEST_IDS.includes(q.id)
        return (
          <div key={q.id} className={`qcard ${done ? 'done' : ''} ${justDone === q.id ? 'just-done' : ''}`} onClick={() => handleToggle(q.id)}>
            <div className="qcard-check">{done ? '✔️' : ''}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="qcard-title">{q.icon} {q.name}</div>
              <div className="qcard-desc">{q.desc}</div>
              {isMn && !done && <div style={{ fontSize:'.6rem', color:'var(--accent)', marginTop:4 }}>→ Tippe um Maßnahmen einzugeben</div>}
            </div>
            <div className="qcard-xp">{q.xp} XP</div>
          </div>
        )
      })}

      {mnModal && (
        <div className="overlay open" onClick={() => setMnModal(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              <span>{mnIsPopa ? '🍀' : '⭐'}</span>
              <span>Maßnahmen {mnIsPopa ? 'PoPa' : 'PoKu'}</span>
              <button className="sheet-close" onClick={() => setMnModal(null)}>✕</button>
            </div>
            <p style={{ fontSize:'.62rem', color:'var(--muted)', marginBottom:11 }}>Vollständige Sätze – was genau planst du?</p>
            <input className="sheet-input" style={{ marginBottom:12 }}
              placeholder={mnIsPopa ? 'Name des potentiellen Partners...' : 'Name des potentiellen Kunden...'}
              value={mnPerson} onChange={e => setMnPerson(e.target.value)} />
            {[0,1,2].map(i => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background: mnIsPopa ? 'var(--green)' : 'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',sans-serif", fontSize:'.82rem', color:'#0d1117', flexShrink:0 }}>{i+1}</div>
                  <div style={{ fontSize:'.76rem', fontWeight:600 }}>Maßnahme {i+1}</div>
                  <span style={{ marginLeft:'auto', fontSize:'.57rem', color:'var(--muted)' }}>{mnItems[i].length} / 200</span>
                </div>
                <textarea className="sheet-textarea" placeholder={mnPlaceholders[i]} maxLength={200}
                  value={mnItems[i]} onChange={e => setMnItems(prev => { const n=[...prev]; n[i]=e.target.value; return n })} />
                <button style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'.6rem', cursor:'pointer', marginTop:2 }}
                  onClick={() => setMnItems(prev => { const n=[...prev]; n[i]=''; return n })}>↩ Leeren</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:6, marginTop:5 }}>
              <button className="sheet-cancel" onClick={() => setMnModal(null)}>Abbrechen</button>
              <button className="sheet-save" onClick={saveMn}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import { getContacts, saveContact, updateContact, deleteContact } from '@/lib/queries'
import { fmtDate } from '@/lib/helpers'
import { CONTACT_EMOJIS } from '@/lib/data'
import type { Contact, ContactType } from '@/types'

export function ContactsTab() {
  const { state, showToast } = useApp()
  const user = state.user!

  const [contacts, setContacts] = useState<Contact[]>([])
  const [filter, setFilter] = useState<'all' | ContactType>('all')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  // Form state
  const [fEmoji, setFEmoji] = useState('😀')
  const [fFirst, setFFirst] = useState('')
  const [fLast, setFLast]   = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fBday, setFBday]   = useState('')
  const [fBedarf, setFBedarf] = useState('')
  const [fType, setFType]   = useState<ContactType>('popa')

  const load = useCallback(async () => {
    const data = await getContacts(user.id)
    setContacts(data)
  }, [user.id])

  useEffect(() => { load() }, [load])

  const filtered = contacts.filter(c => {
    const matchType = filter === 'all' || c.type === filter
    const q = search.toLowerCase()
    const matchSearch = !q || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.phone?.includes(q)
    return matchType && matchSearch
  })

  function openForm(c?: Contact) {
    if (c) {
      setEditId(c.id); setFEmoji(c.emoji); setFFirst(c.first_name); setFLast(c.last_name)
      setFPhone(c.phone); setFBday(c.birthday); setFBedarf(c.bedarf); setFType(c.type)
    } else {
      setEditId(null); setFEmoji('😀'); setFFirst(''); setFLast('')
      setFPhone(''); setFBday(''); setFBedarf(''); setFType('popa')
    }
    setDetailContact(null)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!fFirst.trim()) { showToast('❌ Vorname fehlt'); return }
    if (editId) {
      await updateContact(editId, { emoji: fEmoji, first_name: fFirst, last_name: fLast, phone: fPhone, birthday: fBday, bedarf: fBedarf, type: fType })
      showToast('✅ Gespeichert', 'green')
    } else {
      await saveContact({ user_id: user.id, emoji: fEmoji, first_name: fFirst, last_name: fLast, phone: fPhone, birthday: fBday, bedarf: fBedarf, type: fType })
      showToast('✅ Kontakt gespeichert', 'green')
    }
    setFormOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Kontakt löschen?')) return
    await deleteContact(id)
    setDetailContact(null)
    showToast('🗑 Gelöscht')
    load()
  }

  function exportVCard(c: Contact) {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${c.last_name};${c.first_name}\nFN:${c.first_name} ${c.last_name}\nTEL:${c.phone}\nNOTE:${c.bedarf}\nEND:VCARD`
    const a = document.createElement('a')
    a.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcard)
    a.download = `${c.first_name}_${c.last_name}.vcf`
    a.click()
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
        <input className="ct-search" placeholder="🔍 Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="ct-add-fab" onClick={() => openForm()}>＋</button>
      </div>

      <div style={{ display:'flex', gap:5, marginBottom:8 }}>
        {(['all','popa','poku'] as const).map(f => (
          <button key={f} className={`ct-filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Alle' : f === 'popa' ? '🌿 PoPa' : '⭐ PoKu'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'var(--muted)', fontSize:'.74rem' }}>
          Noch keine Kontakte{search ? ' gefunden' : ''}.<br />
          <button style={{ marginTop:10, background:'var(--accent)', border:'none', borderRadius:10, padding:'8px 16px', color:'#fff', fontSize:'.72rem', fontWeight:700, cursor:'pointer' }} onClick={() => openForm()}>+ Erster Kontakt</button>
        </div>
      )}

      {filtered.map(c => (
        <div key={c.id} className="ct-card" onClick={() => setDetailContact(c)}>
          <div className={`ct-av ${c.type}`}>{c.emoji}</div>
          <div className="ct-info">
            <div className="ct-name">{c.first_name} {c.last_name}</div>
            <div className="ct-detail">{c.phone}{c.birthday ? ` · 🎂 ${fmtDate(c.birthday)}` : ''}</div>
          </div>
          <span className={`ct-type ${c.type}`}>{c.type === 'popa' ? 'PoPa' : 'PoKu'}</span>
        </div>
      ))}

      {/* Contact detail sheet */}
      {detailContact && (
        <div className="overlay open" onClick={() => setDetailContact(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display:'flex', gap:11, alignItems:'center', marginBottom:13 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', color:'#fff', flexShrink:0 }}>{detailContact.emoji}</div>
              <div>
                <div style={{ fontSize:'.95rem', fontWeight:700 }}>{detailContact.first_name} {detailContact.last_name}</div>
                <div style={{ fontSize:'.61rem', color:'var(--muted)', marginTop:3 }}>{detailContact.phone}{detailContact.birthday ? ` · 🎂 ${fmtDate(detailContact.birthday)}` : ''}</div>
              </div>
            </div>
            {detailContact.bedarf && (
              <div style={{ fontSize:'.68rem', color:'var(--muted2)', background:'var(--card)', borderRadius:10, padding:'10px 12px', marginBottom:13, lineHeight:1.5 }}>{detailContact.bedarf}</div>
            )}
            <div style={{ display:'flex', gap:6 }}>
              <button style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:9, padding:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.68rem', fontWeight:600, color:'var(--text)', cursor:'pointer', textAlign:'center' }} onClick={() => exportVCard(detailContact)}>📁 vCard</button>
              <button style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:9, padding:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.68rem', fontWeight:600, color:'var(--text)', cursor:'pointer', textAlign:'center' }} onClick={() => openForm(detailContact)}>✏️ Bearbeiten</button>
              <button style={{ flex:1, background:'var(--card)', border:'1px solid rgba(255,79,79,.2)', borderRadius:9, padding:8, fontFamily:"'DM Sans',sans-serif", fontSize:'.68rem', fontWeight:600, color:'var(--red)', cursor:'pointer', textAlign:'center' }} onClick={() => handleDelete(detailContact.id)}>🗑 Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact form sheet */}
      {formOpen && (
        <div className="overlay open" onClick={() => setFormOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              {editId ? '✏️ Kontakt bearbeiten' : '+ Neuer Kontakt'}
              <button className="sheet-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>
            <div className="sheet-field">
              <label>Emoji</label>
              <div className="emoji-row" style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:4 }}>
                {CONTACT_EMOJIS.map(e => (
                  <div key={e} className={`emoji-opt ${fEmoji === e ? 'sel' : ''}`} onClick={() => setFEmoji(e)}>{e}</div>
                ))}
              </div>
            </div>
            <div className="sheet-field"><label>Vorname</label><input className="sheet-input" value={fFirst} onChange={e => setFFirst(e.target.value)} placeholder="Max" /></div>
            <div className="sheet-field"><label>Nachname</label><input className="sheet-input" value={fLast} onChange={e => setFLast(e.target.value)} placeholder="Mustermann" /></div>
            <div className="sheet-field"><label>Telefon</label><input className="sheet-input" type="tel" value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+49..." /></div>
            <div className="sheet-field"><label>Geburtstag</label><input className="sheet-input" type="date" value={fBday} onChange={e => setFBday(e.target.value)} /></div>
            <div className="sheet-field"><label>Bedarf / Notiz</label><textarea className="sheet-textarea" value={fBedarf} onChange={e => setFBedarf(e.target.value)} placeholder="z.B. Altersvorsorge, BU..." /></div>
            <div className="sheet-field">
              <label>Typ</label>
              <div style={{ display:'flex', gap:6 }}>
                <button className={`type-btn popa ${fType === 'popa' ? 'active' : ''}`} onClick={() => setFType('popa')}>🌿 PoPa</button>
                <button className={`type-btn poku ${fType === 'poku' ? 'active' : ''}`} onClick={() => setFType('poku')}>⭐ PoKu</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, marginTop:5 }}>
              <button className="sheet-cancel" onClick={() => setFormOpen(false)}>Abbrechen</button>
              <button className="sheet-save" onClick={handleSave}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

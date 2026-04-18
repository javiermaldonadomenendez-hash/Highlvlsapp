'use client'

import { useEffect, useState, useCallback } from 'react'
import { useApp } from '@/lib/store'
import {
  getTopContacts, getAllTopContacts,
  saveTopContact, updateTopContact, deleteTopContact,
  getUsers,
} from '@/lib/queries'
import type { TopContact, User } from '@/types'

type ListType = 'popa' | 'kunde'

export function ContactsTab() {
  const { state, showToast } = useApp()
  const user = state.user!

  const [listType, setListType] = useState<ListType>('popa')
  const [contacts, setContacts] = useState<TopContact[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<TopContact | null>(null)
  const [fName, setFName] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fType, setFType] = useState<ListType>('popa')

  const isLeader = user.is_leader

  const load = useCallback(async () => {
    if (isLeader) {
      const [data, users] = await Promise.all([getAllTopContacts(), getUsers()])
      setContacts(data)
      setAllUsers(users)
    } else {
      const data = await getTopContacts(user.id)
      setContacts(data)
    }
  }, [user.id, isLeader])

  useEffect(() => { load() }, [load])

  const filtered = contacts.filter(c => c.type === listType)

  function openAdd() {
    setEditItem(null)
    setFName('')
    setFNotes('')
    setFType(listType)
    setFormOpen(true)
  }

  function openEdit(c: TopContact) {
    setEditItem(c)
    setFName(c.name)
    setFNotes(c.notes)
    setFType(c.type)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!fName.trim()) { showToast('❌ Name fehlt'); return }
    if (editItem) {
      await updateTopContact(editItem.id, { name: fName.trim(), notes: fNotes.trim(), type: fType })
      showToast('✅ Gespeichert', 'green')
    } else {
      await saveTopContact({ user_id: user.id, type: fType, name: fName.trim(), notes: fNotes.trim() })
      showToast('✅ Eingetragen', 'green')
    }
    setFormOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eintrag löschen?')) return
    await deleteTopContact(id)
    showToast('🗑 Gelöscht')
    load()
  }

  function getUserName(uid: number) {
    const u = allUsers.find(x => x.id === uid)
    return u?.name ?? `#${uid}`
  }

  const typeLabel = listType === 'popa' ? '🌿 Top-PoPa' : '⭐ Top-Kunden'

  return (
    <div>
      {/* Switcher */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          onClick={() => setListType('popa')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 12,
            border: listType === 'popa' ? 'none' : '1px solid var(--border)',
            background: listType === 'popa' ? 'linear-gradient(135deg,#22c97a,#4f8cff)' : 'var(--card)',
            color: listType === 'popa' ? '#fff' : 'var(--muted)',
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '.68rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🌿 Top-PoPa
        </button>
        <button
          onClick={() => setListType('kunde')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: 12,
            border: listType === 'kunde' ? 'none' : '1px solid var(--border)',
            background: listType === 'kunde' ? 'linear-gradient(135deg,#f5a623,#f97316)' : 'var(--card)',
            color: listType === 'kunde' ? '#fff' : 'var(--muted)',
            fontFamily: "'DM Sans',sans-serif",
            fontSize: '.68rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ⭐ Top-Kunden
        </button>
      </div>

      {/* Leader note */}
      {isLeader && (
        <div style={{ fontSize: '.6rem', color: 'var(--muted)', marginBottom: 8, textAlign: 'center' }}>
          👑 Du siehst alle Einträge des Teams
        </div>
      )}

      {/* Add button */}
      <button
        onClick={openAdd}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: 12,
          border: '1.5px dashed var(--border)',
          background: 'transparent',
          color: 'var(--muted)',
          fontFamily: "'DM Sans',sans-serif",
          fontSize: '.7rem',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: 10,
        }}
      >
        + {listType === 'popa' ? 'PoPa eintragen' : 'Kunden eintragen'}
      </button>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: '.74rem' }}>
          Noch keine Einträge in der {typeLabel}-Liste.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {filtered.map(c => (
            <div
              key={c.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 13,
                padding: '11px 13px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: listType === 'popa'
                  ? 'linear-gradient(135deg,#22c97a,#4f8cff)'
                  : 'linear-gradient(135deg,#f5a623,#f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '.75rem',
                color: '#fff',
                fontWeight: 800,
                flexShrink: 0,
              }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                {c.notes && (
                  <div style={{ fontSize: '.65rem', color: 'var(--muted2)', lineHeight: 1.4, marginBottom: 4 }}>{c.notes}</div>
                )}
                {isLeader && c.user_id !== user.id && (
                  <div style={{ fontSize: '.58rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                    von {getUserName(c.user_id)}
                  </div>
                )}
              </div>
              {(c.user_id === user.id || isLeader) && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {c.user_id === user.id && (
                    <button
                      onClick={() => openEdit(c)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: '2px 4px', color: 'var(--muted)' }}
                    >✏️</button>
                  )}
                  {(c.user_id === user.id || isLeader) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: '2px 4px', color: 'var(--red)' }}
                    >🗑</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form sheet */}
      {formOpen && (
        <div className="overlay open" onClick={() => setFormOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">
              {editItem ? '✏️ Bearbeiten' : '+ Neuer Eintrag'}
              <button className="sheet-close" onClick={() => setFormOpen(false)}>✕</button>
            </div>

            <div className="sheet-field">
              <label>Typ</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  className={`type-btn popa ${fType === 'popa' ? 'active' : ''}`}
                  onClick={() => setFType('popa')}
                >🌿 PoPa</button>
                <button
                  className={`type-btn poku ${fType === 'kunde' ? 'active' : ''}`}
                  onClick={() => setFType('kunde')}
                >⭐ Kunde</button>
              </div>
            </div>

            <div className="sheet-field">
              <label>Name</label>
              <input
                className="sheet-input"
                value={fName}
                onChange={e => setFName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>

            <div className="sheet-field">
              <label>Notiz / Status</label>
              <textarea
                className="sheet-textarea"
                value={fNotes}
                onChange={e => setFNotes(e.target.value)}
                placeholder="z.B. Termin vereinbart, Follow-up nötig..."
              />
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
              <button className="sheet-cancel" onClick={() => setFormOpen(false)}>Abbrechen</button>
              <button className="sheet-save" onClick={handleSave}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

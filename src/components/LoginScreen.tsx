'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '@/lib/store'
import { getEffectivePin, setCustomPin } from '@/lib/queries'
import { initials } from '@/lib/helpers'
import { ROLE_ORDER } from '@/lib/data'
import type { User, Team } from '@/types'

interface Props {
  users: User[]
  teams: Team[]
}

export function LoginScreen({ users, teams }: Props) {
  const { login, showToast, showMascot } = useApp()
  const [openTeam, setOpenTeam]     = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [pinBuf, setPinBuf]         = useState('')
  const [pinChangeMode, setPinChangeMode] = useState(false)
  const [pinNewBuf, setPinNewBuf]   = useState('')
  const [pinNewStep, setPinNewStep] = useState(0)
  const [pinLoading, setPinLoading] = useState(false)
  const [legalModal, setLegalModal] = useState<'impressum' | 'datenschutz' | null>(null)

  // Refs to avoid stale closures in async callbacks
  const selectedUserRef = useRef<User | null>(null)
  const pinNewBufRef    = useRef('')

  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])
  useEffect(() => { pinNewBufRef.current = pinNewBuf }, [pinNewBuf])

  useEffect(() => {
    setTimeout(() => showMascot('lucasfreude.png', 'Willkommen bei Highlevels! 🚀 Meld dich an und leg los!', true), 1200)
  }, [showMascot])

  const sortedMembers = useCallback((teamKey: string) => {
    return users
      .filter(u => u.team_key === teamKey)
      .sort((a, b) => {
        const ro = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
        return ro !== 0 ? ro : a.name.localeCompare(b.name)
      })
  }, [users])

  function toggleTeam(key: string) {
    setOpenTeam(prev => prev === key ? null : key)
  }

  function selectUser(u: User) {
    setSelectedUser(u)
    selectedUserRef.current = u
    setPinBuf('')
    setPinChangeMode(false)
    setPinNewBuf('')
    setPinNewStep(0)
    setPinLoading(false)
  }

  function backToTeams() {
    setSelectedUser(null)
    setPinBuf('')
    setPinChangeMode(false)
    setPinNewBuf('')
    setPinNewStep(0)
    setPinLoading(false)
  }

  async function doLogin(buf: string) {
    const user = selectedUserRef.current
    if (!user) return
    setPinLoading(true)
    try {
      const correct = await getEffectivePin(user.id)
      const match = String(buf).trim() === String(correct).trim()
      if (match) {
        login(user)
      } else {
        setPinBuf('')
        showToast('❌ Falscher PIN')
      }
    } catch (e: any) {
      setPinBuf('')
      showToast('❌ ' + (e?.message ?? 'Verbindungsfehler'))
      console.error('[login]', e)
    } finally {
      setPinLoading(false)
    }
  }

  async function doSavePin(newPin: string) {
    const user = selectedUserRef.current
    if (!user) return
    setPinLoading(true)
    try {
      await setCustomPin(user.id, newPin)
      setPinChangeMode(false)
      setPinNewBuf('')
      setPinNewStep(0)
      setPinBuf('')
      showToast('✅ PIN gesetzt!', 'green')
    } catch (e: any) {
      setPinBuf('')
      showToast('❌ ' + (e?.message ?? 'Fehler beim Speichern'))
      console.error('[setPin]', e)
    } finally {
      setPinLoading(false)
    }
  }

  function handlePk(n: number) {
    if (!selectedUserRef.current || pinLoading) return

    if (pinChangeMode) {
      if (pinNewStep === 0) {
        // Entering new PIN
        if (pinNewBuf.length >= 4) return
        const next = pinNewBuf + String(n)
        setPinNewBuf(next)
        pinNewBufRef.current = next
        setPinBuf(next)
        if (next.length === 4) {
          setTimeout(() => {
            setPinNewStep(1)
            setPinBuf('')
            showToast('↔ PIN wiederholen')
          }, 200)
        }
      } else {
        // Confirming new PIN
        if (pinBuf.length >= 4) return
        const next = pinBuf + String(n)
        setPinBuf(next)
        if (next.length === 4) {
          const stored = pinNewBufRef.current
          setTimeout(() => {
            if (next === stored) {
              doSavePin(next)
            } else {
              setPinBuf('')
              setPinNewBuf('')
              pinNewBufRef.current = ''
              setPinNewStep(0)
              showToast('❌ PINs stimmen nicht überein')
            }
          }, 200)
        }
      }
      return
    }

    // Normal login
    if (pinBuf.length >= 4) return
    const next = pinBuf + String(n)
    setPinBuf(next)
    if (next.length === 4) {
      setTimeout(() => doLogin(next), 80)
    }
  }

  function handleDel() {
    if (pinLoading) return
    if (pinChangeMode && pinNewStep === 0) {
      setPinNewBuf(p => { const v = p.slice(0,-1); pinNewBufRef.current = v; return v })
      setPinBuf(p => p.slice(0, -1))
    } else {
      setPinBuf(p => p.slice(0, -1))
    }
  }

  function activatePinChange() {
    setPinChangeMode(true)
    setPinBuf('')
    setPinNewBuf('')
    pinNewBufRef.current = ''
    setPinNewStep(0)
  }

  const teamColors: Record<string, string> = {
    kurosch: 'kurosch', michael: 'michael', lucas: 'lucas'
  }

  return (
    <div className="screen active" id="loginScreen">
      <p className="logo">High<span>levels</span></p>

      {!selectedUser ? (
        <>
          <div className="team-section" style={{ width: '100%', maxWidth: 400 }}>
            {['kurosch', 'michael', 'lucas'].map(tk => {
              const team = teams.find(t => t.key === tk)
              const members = sortedMembers(tk)
              const isOpen = openTeam === tk
              return (
                <div key={tk}>
                  <button
                    className={`team-acc-btn ${tk} ${isOpen ? 'open' : ''}`}
                    onClick={() => toggleTeam(tk)}
                  >
                    <div className="tacc-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`tacc-av ${tk}`}>{tk[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: '.84rem', fontWeight: 700, color: 'var(--text)' }}>
                          {team?.name ?? tk}
                        </div>
                        <div style={{ fontSize: '.58rem', color: 'var(--muted)' }}>Team {tk[0].toUpperCase() + tk.slice(1)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '.65rem', color: 'var(--muted)', transition: 'transform .3s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  <div className={`team-members-wrap ${isOpen ? 'open' : ''}`}>
                    <div className="team-members">
                      {members.map(m => (
                        <button
                          key={m.id}
                          className={`member-btn ${m.role === 'CC' ? 'is-lead' : ''}`}
                          onClick={() => selectUser(m)}
                        >
                          <div className="mi">{initials(m.name)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                            <div style={{ fontSize: '.54rem', color: 'var(--muted)', marginTop: 1 }}>{m.role}</div>
                          </div>
                          {m.role === 'CC' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="legal-footer">
            <button className="legal-link" onClick={() => setLegalModal('impressum')}>Impressum</button>
            <button className="legal-link" onClick={() => setLegalModal('datenschutz')}>Datenschutz</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', width: '100%', maxWidth: 360, flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div className="pin-user-card">
            <div className="pin-user-av">{initials(selectedUser.name)}</div>
            <div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--text)' }}>{selectedUser.name}</div>
              <div style={{ fontSize: '.6rem', color: 'var(--muted2)', marginTop: 2 }}>
                {pinLoading ? '⏳ Bitte warten…'
                  : pinChangeMode
                    ? (pinNewStep === 0 ? '🔑 Neuen PIN eingeben' : '🔁 PIN bestätigen')
                    : 'Bitte PIN eingeben'}
              </div>
            </div>
          </div>

          <div className="pin-dots">
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot ${i < (pinChangeMode && pinNewStep === 0 ? pinNewBuf.length : pinBuf.length) ? 'filled' : ''}`} />
            ))}
          </div>

          <div className="pin-pad">
            {[1,2,3,4,5,6,7,8,9].map(n => (
              <button key={n} className="pk-btn" onClick={() => handlePk(n)} disabled={pinLoading}>{n}</button>
            ))}
            <button className="pk-btn" style={{ fontSize: '1.2rem' }} onClick={activatePinChange}>🔑</button>
            <button className="pk-btn" onClick={() => handlePk(0)} disabled={pinLoading}>0</button>
            <button className="pk-btn" style={{ fontSize: '1.2rem' }} onClick={handleDel}>⌫</button>
          </div>

          <button
            style={{ fontFamily: 'DM Sans,sans-serif', fontSize: '.68rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, padding: '8px 16px' }}
            onClick={backToTeams}
          >← Andere Person wählen</button>
        </div>
      )}

      {/* Legal modals */}
      {legalModal && (
        <div className="legal-overlay open" onClick={() => setLegalModal(null)}>
          <div className="legal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            {legalModal === 'impressum' ? (
              <>
                <div className="legal-h1">📜 Impressum</div>
                <div className="legal-h2">Angaben gemäß § 5 TMG</div>
                <div className="legal-p"><strong>Javier Tomas Maldonado Menendez</strong><br />Askaristraße 6<br />45357 Essen<br />Deutschland</div>
                <div className="legal-h2">Kontakt</div>
                <div className="legal-p">Telefon: +49 1515 5659712<br />E-Mail: J_Maldonadomenendez@taures.de</div>
                <div className="legal-h2">Haftungsausschluss</div>
                <div className="legal-p">Diese App ist ein internes Werkzeug für Mitarbeiter. Für die Richtigkeit der Inhalte wird keine Gewähr übernommen.</div>
              </>
            ) : (
              <>
                <div className="legal-h1">🔒 Datenschutzerklärung</div>
                <div className="legal-h2">1. Verantwortlicher (Art. 4 Nr. 7 DSGVO)</div>
                <div className="legal-p">Javier Tomas Maldonado Menendez, Askaristraße 6, 45357 Essen — J_Maldonadomenendez@taures.de</div>
                <div className="legal-h2">2. Zweck &amp; Rechtsgrundlage</div>
                <div className="legal-p">Verarbeitung auf Basis Art. 6 Abs. 1 lit. b DSGVO (Arbeitsvertrag) und § 26 BDSG (Beschäftigtendaten). Verarbeitete Daten: Name, Rolle, KPI-Werte, Quest-Erfüllung, BWS-Umsatz, Push-Token.</div>
                <div className="legal-h2">3. Speicherort</div>
                <div className="legal-p">Daten werden in Supabase (PostgreSQL, EU-Server) gespeichert. Kein Zugriff durch Dritte.</div>
                <div className="legal-h2">4. Ihre Rechte (Art. 15–21 DSGVO)</div>
                <div className="legal-p">Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch. Kontakt: J_Maldonadomenendez@taures.de</div>
                <div className="legal-h2">Stand: März 2025</div>
              </>
            )}
            <button className="sheet-save" style={{ width: '100%', marginTop: 14 }} onClick={() => setLegalModal(null)}>Schließen</button>
          </div>
        </div>
      )}
    </div>
  )
}

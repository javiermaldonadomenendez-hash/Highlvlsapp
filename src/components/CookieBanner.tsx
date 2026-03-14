'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'

export function CookieBanner() {
  const { showToast } = useApp()
  const [show, setShow] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)

  useEffect(() => {
    const choice = localStorage.getItem('hl_cookie')
    if (!choice) setTimeout(() => setShow(true), 800)
  }, [])

  function accept(type: 'all' | 'necessary') {
    localStorage.setItem('hl_cookie', type)
    setShow(false)
    showToast(type === 'all' ? '🍪 Verstanden!' : '🔒 Nur notwendige')
  }

  return (
    <>
      <div className={`cookie-banner ${show ? 'show' : ''}`}>
        <span style={{ fontSize: '1.4rem', marginBottom: 7, display: 'block' }}>🔒</span>
        <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: 4 }}>Datenschutzhinweis</div>
        <div style={{ fontSize: '.64rem', color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 12 }}>
          Diese App ist ein internes Werkzeug. Sie speichert technisch notwendige Daten auf Ihrem Gerät — keine Tracking-Cookies. Leistungsdaten werden gemäß <strong>§ 26 BDSG</strong> und <strong>DSGVO Art. 6</strong> verarbeitet.{' '}
          <button className="legal-link" style={{ fontSize: '.63rem', display: 'inline' }} onClick={() => setLegalOpen(true)}>
            Datenschutzerklärung lesen
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="ck-btn accept" onClick={() => accept('all')}>Verstanden</button>
          <button className="ck-btn necessary" onClick={() => accept('necessary')}>Ablehnen</button>
        </div>
      </div>

      {legalOpen && (
        <div className="legal-overlay open" onClick={() => setLegalOpen(false)}>
          <div className="legal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="legal-h1">🔒 Datenschutzerklärung</div>
            <div className="legal-h2">Verantwortlicher</div>
            <div className="legal-p">Javier Tomas Maldonado Menendez, Askaristraße 6, 45357 Essen</div>
            <div className="legal-h2">Rechtsgrundlage</div>
            <div className="legal-p">Art. 6 Abs. 1 lit. b DSGVO, § 26 BDSG. Keine Weitergabe an Dritte.</div>
            <button className="sheet-save" style={{ width: '100%', marginTop: 14 }} onClick={() => setLegalOpen(false)}>Schließen</button>
          </div>
        </div>
      )}
    </>
  )
}

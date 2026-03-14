'use client'

import { useApp } from '@/lib/store'
import { useEffect, useState } from 'react'

export function Mascot() {
  const { state, hideMascot } = useApp()
  const { mascot } = state
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (mascot) {
      setHiding(false)
      setVisible(true)
    } else if (visible) {
      setHiding(true)
      const t = setTimeout(() => { setVisible(false); setHiding(false) }, 380)
      return () => clearTimeout(t)
    }
  }, [mascot])

  if (!visible && !mascot) return null

  return (
    <div
      id="mascotWrap"
      className={`${visible && !hiding ? 'visible' : ''} ${hiding ? 'hiding' : ''} ${mascot?.bounce ? 'bounce' : ''}`}
    >
      <div className="mascot-card">
        <div className="mascot-img-zone">
          <img
            className="mascot-img"
            src={mascot ? `/emoji/${mascot.img}` : ''}
            alt="Lucas"
          />
        </div>
        <div className="mascot-content">
          <div className="mascot-bubble">{mascot?.msg}</div>
          <button className="mascot-close" onClick={hideMascot}>OK ✕</button>
        </div>
      </div>
    </div>
  )
}

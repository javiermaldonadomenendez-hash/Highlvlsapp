'use client'

import { useApp } from '@/lib/store'

export function XPPop() {
  const { state } = useApp()
  return (
    <div className={`xp-pop ${state.xpPop ? 'show' : ''}`}>
      {state.xpPop}
    </div>
  )
}

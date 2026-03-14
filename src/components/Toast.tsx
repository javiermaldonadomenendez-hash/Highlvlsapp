'use client'

import { useApp } from '@/lib/store'

export function Toast() {
  const { state } = useApp()
  const { toast } = state
  return (
    <div className={`toast ${toast ? 'show' : ''} ${toast?.color ?? ''}`}>
      {toast?.msg}
    </div>
  )
}

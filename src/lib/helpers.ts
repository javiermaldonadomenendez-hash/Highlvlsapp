// ============================================================
// DATE / KEY HELPERS
// ============================================================

export function weekKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const start = new Date(y, 0, 1)
  const w = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
  return `${y}-W${w}`
}

export function kwNum(): number {
  return parseInt(weekKey().split('-W')[1])
}

export function dayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function monthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase()
}

export function fmtBWS(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('de-DE')
}

export function fmtDate(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function nextFriday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = (5 - day + 7) % 7 || 7
  const fr = new Date(d)
  fr.setDate(d.getDate() + diff)
  fr.setHours(15, 0, 0, 0)
  return fr
}

// ============================================================
// POINTS CALCULATION
// ============================================================
import { KPIS, SLIDER_KPI_IDS } from './data'
import type { KpiEntry } from '@/types'

export function calcPtsFromEntries(entries: KpiEntry[]): number {
  let pts = 0
  for (const k of KPIS) {
    const entry = entries.find(e => e.kpi_id === k.id)
    if (SLIDER_KPI_IDS.includes(k.id)) {
      const val = entry?.slider_value ?? 0
      pts += Math.min(val / k.target, 1) * k.pts
    } else {
      const values = entry?.values ?? []
      const filled = values.filter(v => v && v.trim()).length
      pts += Math.min(filled / k.target, 1) * k.pts
    }
  }
  return Math.round(pts * 10) / 10
}

// ============================================================
// CORE TYPES
// ============================================================

export type Role = 'CC' | 'SC' | 'JC' | 'Trainee'
export type TeamKey = 'kurosch' | 'michael' | 'lucas'
export type MnBase = 'popa' | 'poku'
export type MnType = 'popa_1' | 'popa_2' | 'popa_3' | 'poku_1' | 'poku_2' | 'poku_3'
export type ContactType = 'popa' | 'poku'
export type RankPeriod = 'weekly' | 'monthly'
export type Tab = 'quests' | 'kpi' | 'ranking' | 'contacts' | 'pinboard' | 'leader'

export interface User {
  id: number
  name: string
  role: Role
  team_key: TeamKey
  pin: string
  is_leader: boolean
  active: boolean
}

export interface Team {
  key: TeamKey
  name: string
  bws_max: number
  bws_challenges: BwsChallenge[]
  bws_marks: BwsMark[]
}

export interface BwsChallenge {
  threshold: number
  label: string
  badge: string
  icon: string
}

export interface BwsMark {
  pct: number
  label: string
}

export interface Kpi {
  id: string
  name: string
  target: number
  pts: number
  cat: 'high' | 'mid' | 'ursachen'
  placeholder: string
  isSlider?: boolean
}

export interface Quest {
  id: string
  name: string
  desc: string
  xp: number
  icon: string
}

export interface QuestCompletion {
  quest_id: string
  day_key: string
  xp_earned: number
}

export interface Massnahme {
  type: MnType
  day_key: string
  person: string
  item1: string
  item2: string
  item3: string
}

export interface KpiEntry {
  kpi_id: string
  week_key: string
  values: string[]
  slider_value: number | null
}

export interface BwsEntry {
  month_key: string
  value: number
}

export interface UserXp {
  user_id: number
  xp: number
  streak_count: number
  streak_last_day: string
}

export interface Contact {
  id: string
  user_id: number
  first_name: string
  last_name: string
  phone: string
  birthday: string
  bedarf: string
  type: ContactType
  emoji: string
  created_at: string
}

export interface PinTask {
  id: string
  text: string
  done: boolean
}

export interface PinboardData {
  notes: string
  thoughts: string
  tasks: PinTask[]
}

export interface PushSubscriptionRecord {
  user_id: number
  subscription: PushSubscriptionJSON
}

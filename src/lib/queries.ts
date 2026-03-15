'use server'

import { supabaseAdmin } from './supabase'
import { dayKey, monthKey, weekKey } from './helpers'
import { sendPushToSubs } from './push'
import type {
  User, Team, QuestCompletion, Massnahme, KpiEntry,
  BwsEntry, UserXp, Contact, PinboardData, PushSubscriptionRecord, MnType
} from '@/types'

function db() { return supabaseAdmin() }

// ── USERS ─────────────────────────────────────────────────────
export async function getUsers(): Promise<User[]> {
  const { data, error } = await db()
    .from('users').select('id,name,role,team_key,pin,is_leader,active').eq('active', true).order('id')
  if (error) throw error
  return data as User[]
}

export async function getUserById(id: number): Promise<User | null> {
  const { data } = await db()
    .from('users').select('id,name,role,team_key,pin,is_leader,active').eq('id', id).single()
  return data as User | null
}

export async function getUsersByTeam(teamKey: string): Promise<User[]> {
  const { data, error } = await db()
    .from('users').select('id,name,role,team_key,pin,is_leader,active').eq('team_key', teamKey).eq('active', true).order('id')
  if (error) throw error
  return data as User[]
}

export async function getEffectivePin(userId: number): Promise<string> {
  const { data } = await db().from('custom_pins').select('pin').eq('user_id', userId).single()
  if (data?.pin) return data.pin
  const { data: u } = await db().from('users').select('pin').eq('id', userId).single()
  return u?.pin ?? ''
}

export async function setCustomPin(userId: number, pin: string): Promise<void> {
  await db().from('custom_pins').upsert({ user_id: userId, pin, updated_at: new Date().toISOString() })
}

// ── TEAMS ─────────────────────────────────────────────────────
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await db().from('teams').select('key,name,bws_max,bws_challenges,bws_marks')
  if (error) throw error
  return data as Team[]
}

// ── QUESTS ────────────────────────────────────────────────────
export async function getQuestCompletions(userId: number): Promise<QuestCompletion[]> {
  const { data, error } = await db()
    .from('quest_completions').select('quest_id,day_key,xp_earned')
    .eq('user_id', userId).eq('day_key', dayKey())
  if (error) throw error
  return (data ?? []) as QuestCompletion[]
}

export async function toggleQuest(userId: number, questId: string, done: boolean, xp: number): Promise<void> {
  if (done) {
    await db().from('quest_completions').upsert({
      user_id: userId, quest_id: questId, day_key: dayKey(), xp_earned: xp
    }, { onConflict: 'user_id,quest_id,day_key' })
    // Add XP
    await db().rpc('increment_xp', { p_user_id: userId, p_amount: xp })
  } else {
    await db().from('quest_completions')
      .delete().eq('user_id', userId).eq('quest_id', questId).eq('day_key', dayKey())
    await db().rpc('increment_xp', { p_user_id: userId, p_amount: -xp })
  }
}

// ── MASSNAHMEN ────────────────────────────────────────────────
export async function getMassnahmen(userId: number): Promise<Massnahme[]> {
  const { data, error } = await db()
    .from('massnahmen').select('id,user_id,type,day_key,person,item1,item2,item3').eq('user_id', userId).eq('day_key', dayKey())
  if (error) throw error
  return (data ?? []) as Massnahme[]
}

export async function saveMassnahme(userId: number, type: MnType, person: string, items: string[]): Promise<void> {
  await db().from('massnahmen').upsert({
    user_id: userId, type, day_key: dayKey(),
    person, item1: items[0] ?? '', item2: items[1] ?? '', item3: items[2] ?? '',
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,type,day_key' })
}

// ── KPI ───────────────────────────────────────────────────────
export async function getKpiEntries(userId: number): Promise<KpiEntry[]> {
  const { data, error } = await db()
    .from('kpi_entries').select('kpi_id,week_key,values,slider_value')
    .eq('user_id', userId).eq('week_key', weekKey())
  if (error) throw error
  return (data ?? []) as KpiEntry[]
}

export async function saveKpiEntry(userId: number, kpiId: string, values: string[], sliderValue?: number): Promise<void> {
  await db().from('kpi_entries').upsert({
    user_id: userId, kpi_id: kpiId, week_key: weekKey(),
    values, slider_value: sliderValue ?? null,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,kpi_id,week_key' })
}

// Für Ranking: alle KPI Einträge der aktuellen Woche
export async function getAllKpiEntriesThisWeek(): Promise<{ user_id: number; kpi_id: string; values: string[]; slider_value: number | null }[]> {
  const { data, error } = await db()
    .from('kpi_entries').select('user_id,kpi_id,values,slider_value').eq('week_key', weekKey())
  if (error) throw error
  return (data ?? []) as any[]
}

// ── BWS ───────────────────────────────────────────────────────
export async function getBwsEntry(userId: number): Promise<number> {
  const { data } = await db()
    .from('bws_entries').select('value').eq('user_id', userId).eq('month_key', monthKey()).single()
  return (data?.value as number) ?? 0
}

function fmtBwsVal(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2) + ' Mio.'
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return n.toLocaleString('de-DE')
}

export async function saveBwsEntry(userId: number, value: number, userName: string): Promise<void> {
  await db().from('bws_entries').upsert({
    user_id: userId, month_key: monthKey(), value,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,month_key' })

  // Live tracking: push to all OTHER subscribers
  const allSubs = await getAllPushSubscriptions()
  const targets = allSubs.filter(s => s.user_id !== userId)
  if (targets.length > 0) {
    await sendPushToSubs(
      targets,
      {
        title: 'Highlevels 💰',
        body:  `${userName} hat ${fmtBwsVal(value)}€ BWS eingetragen! 🔥`,
        icon:  '/emoji/lucasfreude.png',
        badge: '/emoji/lucasfreude.png',
        tag:   'hl-bws-live',
        url:   '/',
      },
      deletePushSubscription
    )
  }
}

export async function getAllBwsEntriesThisMonth(): Promise<{ user_id: number; value: number }[]> {
  const { data, error } = await db()
    .from('bws_entries').select('user_id,value').eq('month_key', monthKey())
  if (error) throw error
  return (data ?? []) as any[]
}

// ── XP / STREAK ───────────────────────────────────────────────
export async function getUserXp(userId: number): Promise<UserXp> {
  const { data } = await db()
    .from('user_xp').select('user_id,xp,streak_count,streak_last_day').eq('user_id', userId).single()
  return data ?? { user_id: userId, xp: 0, streak_count: 0, streak_last_day: '' }
}

export async function updateStreak(userId: number): Promise<void> {
  const { data } = await db().from('user_xp').select('streak_count,streak_last_day').eq('user_id', userId).single()
  const today = dayKey()
  if (data?.streak_last_day === today) return

  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yk = `${yest.getFullYear()}-${yest.getMonth() + 1}-${yest.getDate()}`
  const newCount = data?.streak_last_day === yk ? (data.streak_count ?? 0) + 1 : 1

  await db().from('user_xp').upsert({
    user_id: userId, streak_count: newCount, streak_last_day: today
  }, { onConflict: 'user_id' })
}

// ── CONTACTS ──────────────────────────────────────────────────
export async function getContacts(userId: number): Promise<Contact[]> {
  const { data, error } = await db()
    .from('contacts').select('id,user_id,first_name,last_name,phone,birthday,bedarf,type,emoji,created_at').eq('user_id', userId).order('created_at')
  if (error) throw error
  return (data ?? []) as Contact[]
}

export async function saveContact(contact: Omit<Contact, 'id' | 'created_at'>): Promise<void> {
  await db().from('contacts').insert(contact)
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  await db().from('contacts').update(updates).eq('id', id)
}

export async function deleteContact(id: string): Promise<void> {
  await db().from('contacts').delete().eq('id', id)
}

// ── PINBOARD ──────────────────────────────────────────────────
export async function getPinboard(userId: number): Promise<PinboardData> {
  const { data } = await db().from('pinboard').select('notes,thoughts,tasks').eq('user_id', userId).single()
  return data ?? { notes: '', thoughts: '', tasks: [] }
}

export async function savePinboard(userId: number, data: PinboardData): Promise<void> {
  await db().from('pinboard').upsert({
    user_id: userId, ...data, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}

// ── PUSH ──────────────────────────────────────────────────────
export async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const { data, error } = await db().from('push_subscriptions').select('user_id,subscription')
  if (error) throw error
  return (data ?? []) as PushSubscriptionRecord[]
}

export async function savePushSubscription(userId: number, subscription: PushSubscriptionJSON): Promise<void> {
  await db().from('push_subscriptions').upsert({
    user_id: userId, subscription, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}

export async function deletePushSubscription(userId: number): Promise<void> {
  await db().from('push_subscriptions').delete().eq('user_id', userId)
}

// ── ADMIN ─────────────────────────────────────────────────────
export async function createUser(user: Omit<User, 'id' | 'active'>): Promise<User> {
  const { data, error } = await db().from('users').insert({ ...user, active: true }).select().single()
  if (error) throw error
  await db().from('user_xp').insert({ user_id: (data as User).id })
  return data as User
}

export async function deactivateUser(id: number): Promise<void> {
  await db().from('users').update({ active: false }).eq('id', id)
}

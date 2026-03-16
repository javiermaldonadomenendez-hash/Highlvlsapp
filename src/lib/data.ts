import type { Kpi, Quest, TeamKey } from '@/types'

// ============================================================
// KPIs
// ============================================================
export const KPIS: Kpi[] = [
  { id: 'partnertreffen',  name: 'Potentielle Partner Treffen',       target: 10, pts: 50,  cat: 'high',     placeholder: 'Name des Partners' },
  { id: 'eoa_kunden',      name: 'EOA Kunden (Pitch Kunde)',           target: 3,  pts: 30,  cat: 'high',     placeholder: 'Name des Kunden' },
  { id: 'eoa_partner',     name: 'EOA Partner (Pitch Partner)',        target: 1,  pts: 25,  cat: 'high',     placeholder: 'Name des Partners' },
  { id: 'umsatz_eigen',    name: 'Umsatztermine EV T1–T3',            target: 5,  pts: 40,  cat: 'high',     placeholder: 'Name + Termindetail' },
  { id: 'umsatz_team',     name: 'Umsatztermine TV T1–T3',            target: 8,  pts: 35,  cat: 'high',     placeholder: 'Name + Termindetail' },
  { id: 'neukontakte',     name: 'Neukontakte',                        target: 5,  pts: 10,  cat: 'mid',      placeholder: 'Name des Neukontakts' },
  { id: 'event',           name: 'Event',                              target: 3,  pts: 15,  cat: 'mid',      placeholder: 'Eventname / Person' },
  { id: 'zufuehrung',      name: 'Zuführung',                         target: 1,  pts: 20,  cat: 'mid',      placeholder: 'Name des Zuführers' },
  { id: 'einladungen',     name: 'Einladungen zu Zuführungen',        target: 3,  pts: 10,  cat: 'mid',      placeholder: 'Name + Detail' },
  { id: 'empfehlung',      name: 'Empfehlung erfragen',                target: 3,  pts: 10,  cat: 'mid',      placeholder: 'Von wem / für wen' },
  { id: 'ausbildung',      name: 'Ausbildung',                         target: 3,  pts: 15,  cat: 'mid',      placeholder: 'Name des Auszubildenden' },
  { id: 'cafe',            name: 'Café­gespräche',                    target: 5,  pts: 12,  cat: 'ursachen', placeholder: 'Name der Person' },
  { id: 'tel_5h',          name: 'Stunden Telefonieren',               target: 5,  pts: 8,   cat: 'ursachen', placeholder: 'Thema / Notiz', isSlider: true },
  { id: 'wuc_30',          name: 'Warm Up Calls (bis 30x)',            target: 30, pts: 20,  cat: 'ursachen', placeholder: 'Name / Notiz',  isSlider: true },
]

export const MAX_PTS = KPIS.reduce((s, k) => s + k.pts, 0)
export const SLIDER_KPI_IDS = ['tel_5h', 'wuc_30']

// ============================================================
// QUESTS
// ============================================================
export const QUESTS: Quest[] = [
  { id: 'prozessliste',     name: 'Prozessliste',         desc: 'Tägliche Prozessliste abarbeiten',                xp: 50, icon: '📋' },
  { id: 'potential_planer', name: 'Potential Planer',     desc: 'Potential Planer ausgefüllt und aktualisiert',    xp: 50, icon: '🗺️' },
  { id: 'bws_tracking',     name: 'BWS Tracking',          desc: 'BWS für diese Woche eingetragen und aktualisiert', xp: 30, icon: '📈' },
  { id: 'massnahmen_popa',  name: '3 Maßnahmen PoPa',     desc: '3 konkrete Maßnahmen für Potentielle Partner',   xp: 75, icon: '🍀' },
  { id: 'massnahmen_poku',  name: '3 Maßnahmen PoKu',     desc: '3 konkrete Maßnahmen für Potentielle Kunden',    xp: 75, icon: '⭐' },
]

export const TOTAL_XP = QUESTS.reduce((s, q) => s + q.xp, 0)
export const MN_QUEST_IDS = ['massnahmen_popa', 'massnahmen_poku']

// ============================================================
// ROLE ORDER (for sorting)
// ============================================================
export const ROLE_ORDER: Record<string, number> = { CC: 0, SC: 1, JC: 2, Trainee: 3 }

// ============================================================
// LEADER IDS
// ============================================================
export const LEADER_IDS = [12, 13, 14, 20, 30]

// ============================================================
// CONTACT EMOJIS
// ============================================================
export const CONTACT_EMOJIS = ['😀','😃','🤩','😎','🤓','😊','😇','🤨','🙏','👍','🌟','🔥']

// ============================================================
// MOTIVATIONAL MESSAGES (for push)
// ============================================================
export const MOTI_MSGS = [
  'Zeit für einen neuen Kontakt 👀 Wer steht heute noch auf deiner Liste?',
  'Mission Check 🔥 Hast du heute schon eine PoPa oder PoKu erledigt?',
  'Highlevels Reminder 🚀 Gewinner telefonieren mehr als andere.',
  'Reality Check ☎️ Ein Call kann alles verändern.',
  'Vertrieb schläft nicht 😏 Wer ist dein nächster Kunde?',
  'Quest Alarm 🎯 Noch offene Missionen warten auf dich.',
  'Dein Team zählt auf dich ⚡ Jeder Call bringt dich näher ans Ziel.',
  'Top-Performer sind jetzt aktiv 📊 Was ist dein nächster Schritt?',
  'Highlevels Daily Push 🏆 Wer heute hustlet, feiert morgen.',
  '5 Minuten reichen 📲 Ruf jetzt jemanden an.',
]

// ============================================================
// TEAM COLORS (for avatars in ranking etc.)
// ============================================================
export const TEAM_GRADIENT: Record<TeamKey, string> = {
  kurosch: 'linear-gradient(135deg,#4f8cff,#a78bfa)',
  michael: 'linear-gradient(135deg,#f5a623,#f97316)',
  lucas:   'linear-gradient(135deg,#22c97a,#4f8cff)',
}

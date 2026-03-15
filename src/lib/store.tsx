'use client'

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'
import type { User, Tab } from '@/types'

const SESSION_KEY = 'hl_session'
const SESSION_TTL = 5 * 60 * 1000 // 5 minutes

function saveSession(user: User) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, ts: Date.now() }))
  } catch {}
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const { user, ts } = JSON.parse(raw)
    if (Date.now() - ts > SESSION_TTL) return null
    return user as User
  } catch { return null }
}

function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch {}
}

// ── State ────────────────────────────────────────────────────
interface AppState {
  user: User | null
  currentTab: Tab
  toast: { msg: string; color?: string } | null
  xpPop: string | null
  mascot: { img: string; msg: string; bounce: boolean } | null
  hydrated: boolean
}

const initialState: AppState = {
  user: null,
  currentTab: 'quests',
  toast: null,
  xpPop: null,
  mascot: null,
  hydrated: false,
}

// ── Actions ──────────────────────────────────────────────────
type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SHOW_TOAST'; msg: string; color?: string }
  | { type: 'CLEAR_TOAST' }
  | { type: 'SHOW_XP'; txt: string }
  | { type: 'CLEAR_XP' }
  | { type: 'SHOW_MASCOT'; img: string; msg: string; bounce?: boolean }
  | { type: 'HIDE_MASCOT' }
  | { type: 'HYDRATE'; user: User | null }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':   return { ...state, user: action.user, currentTab: 'quests', hydrated: true }
    case 'LOGOUT':  return { ...initialState, hydrated: true }
    case 'SET_TAB': return { ...state, currentTab: action.tab }
    case 'SHOW_TOAST': return { ...state, toast: { msg: action.msg, color: action.color } }
    case 'CLEAR_TOAST': return { ...state, toast: null }
    case 'SHOW_XP':    return { ...state, xpPop: action.txt }
    case 'CLEAR_XP':   return { ...state, xpPop: null }
    case 'SHOW_MASCOT': return { ...state, mascot: { img: action.img, msg: action.msg, bounce: action.bounce ?? false } }
    case 'HIDE_MASCOT': return { ...state, mascot: null }
    case 'HYDRATE': return { ...state, user: action.user, hydrated: true }
    default: return state
  }
}

// ── Context ──────────────────────────────────────────────────
interface AppCtx {
  state: AppState
  login: (user: User) => void
  logout: () => void
  setTab: (tab: Tab) => void
  showToast: (msg: string, color?: string) => void
  showXP: (txt: string) => void
  showMascot: (img: string, msg: string, bounce?: boolean) => void
  hideMascot: () => void
}

const Ctx = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Restore session from localStorage on mount
  useEffect(() => {
    const cached = loadSession()
    dispatch({ type: 'HYDRATE', user: cached })
  }, [])

  const login  = useCallback((user: User) => {
    saveSession(user)
    dispatch({ type: 'LOGIN', user })
  }, [])

  const logout = useCallback(() => {
    clearSession()
    dispatch({ type: 'LOGOUT' })
  }, [])

  const setTab = useCallback((tab: Tab) => dispatch({ type: 'SET_TAB', tab }), [])

  const showToast = useCallback((msg: string, color?: string) => {
    dispatch({ type: 'SHOW_TOAST', msg, color })
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3200)
  }, [])

  const showXP = useCallback((txt: string) => {
    dispatch({ type: 'SHOW_XP', txt })
    setTimeout(() => dispatch({ type: 'CLEAR_XP' }), 950)
  }, [])

  const showMascot = useCallback((img: string, msg: string, bounce = false) => {
    dispatch({ type: 'SHOW_MASCOT', img, msg, bounce })
    setTimeout(() => dispatch({ type: 'HIDE_MASCOT' }), 8000)
  }, [])

  const hideMascot = useCallback(() => dispatch({ type: 'HIDE_MASCOT' }), [])

  return (
    <Ctx.Provider value={{ state, login, logout, setTab, showToast, showXP, showMascot, hideMascot }}>
      {children}
    </Ctx.Provider>
  )
}

export function useApp() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

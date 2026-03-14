'use client'

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react'
import type { User, Tab } from '@/types'

// ── State ────────────────────────────────────────────────────
interface AppState {
  user: User | null
  currentTab: Tab
  toast: { msg: string; color?: string } | null
  xpPop: string | null
  mascot: { img: string; msg: string; bounce: boolean } | null
}

const initialState: AppState = {
  user: null,
  currentTab: 'quests',
  toast: null,
  xpPop: null,
  mascot: null,
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

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':   return { ...state, user: action.user, currentTab: 'quests' }
    case 'LOGOUT':  return { ...initialState }
    case 'SET_TAB': return { ...state, currentTab: action.tab }
    case 'SHOW_TOAST': return { ...state, toast: { msg: action.msg, color: action.color } }
    case 'CLEAR_TOAST': return { ...state, toast: null }
    case 'SHOW_XP':    return { ...state, xpPop: action.txt }
    case 'CLEAR_XP':   return { ...state, xpPop: null }
    case 'SHOW_MASCOT': return { ...state, mascot: { img: action.img, msg: action.msg, bounce: action.bounce ?? false } }
    case 'HIDE_MASCOT': return { ...state, mascot: null }
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

  const login  = useCallback((user: User) => dispatch({ type: 'LOGIN', user }), [])
  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), [])
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

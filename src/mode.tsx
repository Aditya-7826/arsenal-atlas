import { createContext, useContext, useState, type ReactNode } from 'react'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const KEY = 'aa-mode'
function readPref(): '2d' | '3d' | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === '2d' || v === '3d' ? v : null
  } catch {
    return null
  }
}

type Ctx = { mode: '2d' | '3d'; webgl: boolean; toggle: () => void }
const ModeCtx = createContext<Ctx>({ mode: '2d', webgl: false, toggle: () => {} })

/** 2D fallback: forced on when WebGL is unavailable, otherwise a remembered manual toggle. */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [webgl] = useState(detectWebGL)
  const [pref, setPref] = useState(readPref)
  const mode: '2d' | '3d' = !webgl ? '2d' : (pref ?? '3d')
  const toggle = () => {
    if (!webgl) return
    const next = mode === '3d' ? '2d' : '3d'
    setPref(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }
  return <ModeCtx.Provider value={{ mode, webgl, toggle }}>{children}</ModeCtx.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useMode = () => useContext(ModeCtx)

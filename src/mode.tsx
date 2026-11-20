import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'

/*
 * WebGL support is probed lazily: creating a GL context is expensive, so pages without
 * 3D (category, compare, credits) never pay for it. The lobby and viewer call
 * `probeWebGL()` before mounting a canvas; until then we assume support if the API exists.
 */
let webglResult: boolean | null = null
const webglListeners = new Set<() => void>()

// oxlint-disable-next-line react/only-export-components
export function probeWebGL(): boolean {
  if (webglResult !== null) return webglResult
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    webglResult = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglResult = false
  }
  queueMicrotask(() => webglListeners.forEach((l) => l()))
  return webglResult
}

const apiPresent = () => typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window)
const useWebGL = () =>
  useSyncExternalStore(
    (l) => {
      webglListeners.add(l)
      return () => webglListeners.delete(l)
    },
    () => webglResult ?? apiPresent(),
  )

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
  const webgl = useWebGL()
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

/**
 * Mode for a page that wants to render 3D: runs the real WebGL probe first,
 * so it falls back to 2D before ever mounting a canvas.
 */
// oxlint-disable-next-line react/only-export-components
export function useMode3D() {
  const ctx = useContext(ModeCtx)
  const ok = ctx.mode === '3d' && probeWebGL()
  return { ...ctx, mode: ok ? ('3d' as const) : ('2d' as const) }
}

// oxlint-disable-next-line react/only-export-components
export const useMode = () => useContext(ModeCtx)

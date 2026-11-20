import { useSyncExternalStore } from 'react'

function useMedia(query: string, fallback = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  )
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
export const useIsMobile = () => useMedia('(max-width: 768px), (pointer: coarse)')

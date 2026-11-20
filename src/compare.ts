import { useSyncExternalStore } from 'react'
import { BY_ID } from './data'

const KEY = 'aa-compare'
export const MAX_COMPARE = 3
const listeners = new Set<() => void>()

function read(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((id) => typeof id === 'string' && BY_ID.has(id)).slice(0, MAX_COMPARE) : []
  } catch {
    return []
  }
}
let state = read()

export function setCompare(ids: string[]) {
  state = ids.filter((id) => BY_ID.has(id)).slice(0, MAX_COMPARE)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l())
}

export function toggleCompare(id: string) {
  if (state.includes(id)) setCompare(state.filter((x) => x !== id))
  else setCompare([...state, id].slice(-MAX_COMPARE))
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const useCompare = () => useSyncExternalStore(subscribe, () => state)

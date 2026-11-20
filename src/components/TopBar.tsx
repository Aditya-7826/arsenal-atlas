import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useState } from 'react'
import { useMode } from '../mode'
import { useCompare } from '../compare'
import { IconCompare, IconCredits, IconCube, IconHall, IconSearch, IconSquare } from './Icons'

export function TopBar() {
  const { mode, webgl, toggle } = useMode()
  const compare = useCompare()
  const nav = useNavigate()
  const loc = useLocation()
  const [params] = useSearchParams()
  const onCategory = loc.pathname.startsWith('/category/')
  const urlQ = onCategory ? (params.get('q') ?? '') : ''
  const [q, setQ] = useState(urlQ)
  const [seenQ, setSeenQ] = useState(urlQ)
  // keep the field in step with the URL (back/forward, clearing on the page)
  if (urlQ !== seenQ) {
    setSeenQ(urlQ)
    setQ(urlQ)
  }

  const go = (value: string) => {
    const base = onCategory ? loc.pathname : '/category/all'
    const next = new URLSearchParams(onCategory ? params : undefined)
    if (value) next.set('q', value)
    else next.delete('q')
    const s = next.toString()
    nav(`${base}${s ? `?${s}` : ''}`, { replace: onCategory })
  }

  return (
    <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:gap-4 md:px-6">
      <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Arsenal Atlas: back to the lobby">
        <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M32 10 52 52H12Z" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 40h20" stroke="var(--gold-light)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="font-display hidden text-base text-text sm:inline md:text-lg">ARSENAL ATLAS</span>
      </Link>

      <form
        role="search"
        className="mx-auto flex min-w-0 max-w-md flex-1 items-center"
        onSubmit={(e) => {
          e.preventDefault()
          go(q.trim())
        }}
      >
        <label htmlFor="global-search" className="sr-only">Search firearms</label>
        <div className="relative w-full">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold" />
          <input
            id="global-search"
            type="search"
            className="field w-full pl-10"
            placeholder="Search firearms…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              if (onCategory) go(e.target.value)
            }}
            autoComplete="off"
          />
        </div>
      </form>

      <nav className="flex shrink-0 items-center gap-1.5 md:gap-2" aria-label="Tools">
        <NavLink to="/" className="icon-btn hidden sm:inline-grid" aria-label="Lobby" title="Lobby">
          <IconHall />
        </NavLink>
        <NavLink to="/compare" className="icon-btn relative" aria-label={`Compare (${compare.length} selected)`} title="Compare">
          <IconCompare />
          {compare.length > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-bg">
              {compare.length}
            </span>
          )}
        </NavLink>
        <button
          type="button"
          className="icon-btn"
          onClick={toggle}
          disabled={!webgl}
          aria-pressed={mode === '2d'}
          aria-label={webgl ? (mode === '3d' ? 'Switch to 2D mode' : 'Switch to 3D mode') : '3D unavailable: WebGL is not supported, 2D mode is on'}
          title={webgl ? (mode === '3d' ? '2D mode' : '3D mode') : 'WebGL unavailable'}
        >
          {mode === '3d' ? <IconSquare /> : <IconCube />}
        </button>
        <NavLink to="/credits" className="icon-btn" aria-label="Credits" title="Credits">
          <IconCredits />
        </NavLink>
      </nav>
    </header>
  )
}

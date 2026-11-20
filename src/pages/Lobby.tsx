import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BY_ID, CATEGORIES, FIREARMS, MODEL_COUNT, inCategory, type Firearm } from '../data'
import { useMode3D } from '../mode'
import { GlassPanel } from '../components/GlassPanel'
import { Silhouette2D } from '../components/Silhouette2D'
import { IconArrow } from '../components/Icons'
import { usePageTitle } from '../usePageTitle'

const LobbyScene = lazy(() => import('../three/LobbyScene'))

function Lobby2D() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {CATEGORIES.map((c, i) => (
        <GlassPanel as={Link} to={`/category/${c.slug}`} key={c.slug} stagger={i} className="group flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display grow-line text-lg text-text">{c.name.toUpperCase()}</h2>
            <span className="label shrink-0">{inCategory(c.slug).length} pieces</span>
          </div>
          <p className="text-sm text-muted">{c.blurb}</p>
          <div className="grid grid-cols-3 gap-2">
            {c.featured.map((id) => (
              <div key={id} className="rounded-xl border border-line bg-bg/60 p-2">
                <Silhouette2D firearm={BY_ID.get(id)!} className="h-12 w-full" />
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  )
}

export default function Lobby() {
  usePageTitle()
  const { mode } = useMode3D()
  const nav = useNavigate()
  const [hover, setHover] = useState<Firearm | null>(null)

  const intro = (
    <GlassPanel overCanvas={mode === '3d'} stagger={0} className="max-w-md p-4 sm:p-5">
      <p className="label text-gold!">The armoury hall</p>
      <h1 className="font-display mt-1 text-xl text-text sm:text-2xl md:text-3xl">ARSENAL ATLAS</h1>
      <p className={`mt-2 text-sm text-muted ${mode === '3d' ? 'hidden sm:block' : ''}`}>
        A museum-style collection of {FIREARMS.length} famous firearms across {CATEGORIES.length} galleries, with specifications, history and a 360° viewer.
        {mode === '3d' && ' Drag to look around, then select a piece on display.'}
      </p>
      <p className="mt-3 text-xs text-muted">
        {MODEL_COUNT} 3D models · {FIREARMS.length - MODEL_COUNT} stylised placeholders
      </p>
    </GlassPanel>
  )

  if (mode === '2d') {
    return (
      <div className="flex flex-col gap-4">
        {intro}
        <Lobby2D />
      </div>
    )
  }

  return (
    <div className="relative -m-3 h-[calc(100dvh-4.1rem)] min-h-[480px] overflow-hidden sm:-m-4 md:-m-6 md:h-[calc(100dvh-7.2rem)] md:rounded-b-[24px]">
      <Suspense fallback={<div className="grid h-full place-items-center label" role="status">Opening the hall…</div>}>
        <LobbyScene onHover={setHover} onSelect={(f) => nav(`/firearm/${f.id}`)} onCategory={(c) => nav(`/category/${c.slug}`)} />
      </Suspense>

      <div className="pointer-events-none absolute inset-x-3 top-3 md:inset-x-6 md:top-6">
        <div className="pointer-events-auto inline-block">{intro}</div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-3" aria-live="polite">
        {hover && (
          <GlassPanel overCanvas className="rise flex items-center gap-3 rounded-full px-5 py-2">
            <span className="font-display text-base text-text">{hover.name.toUpperCase()}</span>
            <span className="text-xs text-muted">
              {hover.country} · {hover.year ?? '—'}
            </span>
          </GlassPanel>
        )}
      </div>

      {/* keyboard-accessible gallery dock */}
      <nav aria-label="Galleries" className="absolute inset-x-0 bottom-3 flex justify-center px-3">
        <GlassPanel overCanvas className="flex max-w-full items-center gap-1.5 rounded-full p-1.5 scroll-x">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="chip border-transparent bg-transparent">
              {c.short}
            </Link>
          ))}
          <Link to="/category/all" className="chip" aria-label="Browse all firearms">
            All <IconArrow width={14} height={14} />
          </Link>
        </GlassPanel>
      </nav>
    </div>
  )
}

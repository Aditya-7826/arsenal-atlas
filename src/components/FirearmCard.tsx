import { Link } from 'react-router'
import { hasModel, type Firearm } from '../data'
import { GlassPanel } from './GlassPanel'
import { Silhouette2D } from './Silhouette2D'

export function FirearmCard({ firearm, index }: { firearm: Firearm; index: number }) {
  return (
    <GlassPanel as={Link} to={`/firearm/${firearm.id}`} stagger={Math.min(index, 12)} className="group flex flex-col gap-3 p-3">
      <div className="relative grid aspect-[16/9] place-items-center rounded-xl border border-line bg-bg/70 p-4">
        <Silhouette2D firearm={firearm} className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]" />
        {!hasModel(firearm.id) && <span className="label absolute bottom-2 right-2 text-[0.6rem]!">Placeholder</span>}
      </div>
      <div className="px-1 pb-2">
        <h3 className="font-display grow-line text-[0.95rem] leading-snug text-text">{firearm.name.toUpperCase()}</h3>
        <p className="mt-3 text-xs text-muted">
          {firearm.country} · {firearm.year ?? 'Year unverified'}
        </p>
      </div>
    </GlassPanel>
  )
}

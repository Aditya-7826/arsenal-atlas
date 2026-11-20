import { SHAPES, bounds, shapeFor, type Mat } from '../silhouette'
import type { Firearm } from '../data'

const FILL: Record<Mat, string> = {
  metal: 'var(--text-muted)',
  polymer: 'var(--bronze)',
  wood: 'var(--bronze)',
}
const OPACITY: Record<Mat, number> = { metal: 0.55, polymer: 0.35, wood: 0.6 }

/** Flat side-profile silhouette used for card thumbnails and the 2D fallback. */
export function Silhouette2D({ firearm, className = '' }: { firearm: Firearm; className?: string }) {
  const parts = SHAPES[shapeFor(firearm)]
  const bb = bounds(parts)
  const pad = 0.06
  const w = 1 + pad * 2
  const h = bb.y1 - bb.y0 + pad * 2
  // SVG y grows downward, so flip
  const Y = (y: number) => bb.y1 + pad - y
  return (
    <svg viewBox={`${-pad} 0 ${w} ${h}`} className={className} role="img" aria-label={`Stylised outline of the ${firearm.name}`} preserveAspectRatio="xMidYMid meet">
      <g stroke="var(--gold)" strokeWidth={0.004} strokeLinejoin="round">
        {parts.map((p, i) => {
          if (p.k === 'cyl') {
            return <rect key={i} x={p.x0} y={Y(p.y + p.r)} width={p.x1 - p.x0} height={p.r * 2} rx={Math.min(p.r, 0.02)} fill={FILL[p.m]} fillOpacity={OPACITY[p.m]} />
          }
          const cx = (p.x0 + p.x1) / 2
          const cy = Y((p.y0 + p.y1) / 2)
          return (
            <rect
              key={i}
              x={p.x0}
              y={Y(p.y1)}
              width={p.x1 - p.x0}
              height={p.y1 - p.y0}
              rx={0.008}
              fill={FILL[p.m]}
              fillOpacity={OPACITY[p.m]}
              transform={p.rot ? `rotate(${-p.rot} ${cx} ${cy})` : undefined}
            />
          )
        })}
      </g>
    </svg>
  )
}

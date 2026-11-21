import { SHAPES, bounds, shapeFor, type Mat } from '../silhouette'
import type { Firearm } from '../data'
import { PROFILES, profileBounds, type Profile } from '../profiles'

const FILL: Record<Mat, string> = {
  metal: 'var(--text-muted)',
  polymer: 'var(--bronze)',
  wood: 'var(--bronze)',
}
const OPACITY: Record<Mat, number> = { metal: 0.55, polymer: 0.35, wood: 0.6 }

function DetailedSilhouette({ firearm, profile, className }: { firearm: Firearm; profile: Profile; className: string }) {
  const b = profileBounds(profile)
  const pad = (b.x1 - b.x0) * 0.05
  return (
    <svg
      viewBox={`${b.x0 - pad} ${-b.y1 - pad} ${b.x1 - b.x0 + pad * 2} ${b.y1 - b.y0 + pad * 2}`}
      className={className}
      role="img"
      aria-label={`Outline of the ${firearm.name}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* paths are y-up millimetres: flip once for SVG */}
      <g transform="scale(1,-1)" stroke="var(--gold)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round">
        {profile.parts
          .filter((p) => !p.z || p.z <= 0)
          .map((p, i) => {
            const fill = { fill: FILL[p.m], fillOpacity: OPACITY[p.m], vectorEffect: 'non-scaling-stroke' as const }
            if (p.k === 'shape') return <path key={i} d={p.d} fillRule="evenodd" {...fill} />
            if (p.k === 'cyl') return <rect key={i} x={p.x0} y={p.y - p.r} width={p.x1 - p.x0} height={p.r * 2} rx={Math.min(p.r, 4)} {...fill} />
            return <circle key={i} cx={p.x} cy={p.y} r={p.r} {...fill} />
          })}
      </g>
    </svg>
  )
}

/** Flat side-profile silhouette used for card thumbnails and the 2D fallback. */
export function Silhouette2D({ firearm, className = '' }: { firearm: Firearm; className?: string }) {
  const detailed = PROFILES[firearm.id]
  if (detailed) return <DetailedSilhouette firearm={firearm} profile={detailed} className={className} />
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

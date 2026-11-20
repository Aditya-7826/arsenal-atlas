import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Firearm } from '../data'

/** Hand-drawn SVG sparkline of introduction years across a category, with one firearm highlighted. */
export function Sparkline({ items, current }: { items: Firearm[]; current: Firearm }) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pts = items.filter((f) => f.year != null).sort((a, b) => a.year! - b.year! || a.name.localeCompare(b.name))
  if (pts.length < 2) return <p className="text-sm text-muted">Not enough dated entries to chart.</p>

  const H = 150
  const padX = 14
  const padTop = 30
  const padBottom = 26
  const minY = pts[0].year!
  const maxY = pts[pts.length - 1].year!
  const span = Math.max(1, maxY - minY)
  const x = (i: number) => padX + (i * (w - padX * 2)) / (pts.length - 1)
  const y = (yr: number) => padTop + (1 - (yr - minY) / span) * (H - padTop - padBottom)

  const line = pts.map((f, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(f.year!).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - padBottom} L${x(0).toFixed(1)},${H - padBottom} Z`
  const ci = pts.findIndex((f) => f.id === current.id)
  const rank = ci >= 0 ? ci + 1 : null

  return (
    <div ref={ref} className="w-full">
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-labelledby="spark-title spark-desc" className="block max-w-full overflow-visible">
        <title id="spark-title">Introduction years in this category</title>
        <desc id="spark-desc">
          {`${pts.length} dated entries from ${minY} to ${maxY}.${rank ? ` The ${current.name} (${current.year}) is number ${rank} in order of introduction.` : ''}`}
        </desc>
        <line x1={padX} x2={w - padX} y1={H - padBottom} y2={H - padBottom} stroke="var(--line)" strokeWidth={1} />
        <path d={area} fill="var(--gold)" fillOpacity={0.1} />
        <path d={line} fill="none" stroke="var(--gold)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((f, i) => {
          const on = f.id === current.id
          return (
            <Link key={f.id} to={`/firearm/${f.id}`} aria-label={`${f.name}, ${f.year}`}>
              <circle cx={x(i)} cy={y(f.year!)} r={on ? 5.5 : 2.75} fill={on ? 'var(--gold-light)' : 'var(--bg)'} stroke={on ? 'var(--gold-light)' : 'var(--gold)'} strokeWidth={1.5}>
                <title>{`${f.name} (${f.year})`}</title>
              </circle>
              {on && <circle cx={x(i)} cy={y(f.year!)} r={10} fill="none" stroke="var(--gold-light)" strokeOpacity={0.35} />}
            </Link>
          )
        })}
        {ci >= 0 && (
          <text
            x={Math.min(Math.max(x(ci), 60), w - 60)}
            y={Math.max(14, y(current.year!) - 14)}
            textAnchor="middle"
            fill="var(--gold-light)"
            fontSize={12}
            fontWeight={600}
          >
            {current.year}
          </text>
        )}
        <text x={padX} y={H - 6} fill="var(--text-muted)" fontSize={11}>{minY}</text>
        <text x={w - padX} y={H - 6} fill="var(--text-muted)" fontSize={11} textAnchor="end">{maxY}</text>
      </svg>
    </div>
  )
}

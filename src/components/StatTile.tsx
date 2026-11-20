import { GlassPanel } from './GlassPanel'

export type Compare = { fraction: number; avgFraction: number; caption: string }

/** Big thin numeral, a small uppercase label and a gold line comparing the value with the category average. */
export function StatTile({ label, value, unit, compare, stagger, small }: { label: string; value: string; unit?: string; compare?: Compare | null; stagger?: number; small?: boolean }) {
  return (
    <GlassPanel stagger={stagger} className="flex flex-col justify-between gap-3 p-4 md:p-5">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`numeral text-text ${small ? 'text-[1.75rem] md:text-[2rem]' : 'text-[2.5rem] md:text-[3.25rem]'}`}>{value}</span>
          {unit && value !== '—' && <span className="text-sm text-muted">{unit}</span>}
        </div>
        <p className="label mt-2">{label}</p>
      </div>
      {compare ? (
        <div>
          <div className="relative h-px w-full bg-bronze/60" aria-hidden="true">
            <div className="absolute inset-y-0 left-0 h-px bg-gold transition-[width] duration-500 ease-out" style={{ width: `${Math.max(2, compare.fraction * 100)}%` }} />
            <div className="absolute -top-1.5 h-3.5 w-px bg-gold-light" style={{ left: `${compare.avgFraction * 100}%` }} title="Category average" />
          </div>
          <p className="mt-2 text-xs text-muted">{compare.caption}</p>
        </div>
      ) : (
        <p className="text-xs text-muted">{value === '—' ? 'Not verified yet' : 'No category comparison'}</p>
      )}
    </GlassPanel>
  )
}

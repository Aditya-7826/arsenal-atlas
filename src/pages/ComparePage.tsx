import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BY_ID, CATEGORIES, fmt, inCategory, type Firearm } from '../data'
import { MAX_COMPARE, setCompare, useCompare } from '../compare'
import { GlassPanel } from '../components/GlassPanel'
import { FirearmPreview } from '../components/FirearmPreview'
import { IconClose } from '../components/Icons'
import { usePageTitle } from '../usePageTitle'

type Row = { label: string; get: (f: Firearm) => string; num?: (f: Firearm) => number | null; best?: 'min' | 'max' }
const ROWS: Row[] = [
  { label: 'Country', get: (f) => f.country },
  { label: 'Category', get: (f) => CATEGORIES.find((c) => c.slug === f.category)!.name },
  { label: 'Introduced', get: (f) => (f.year != null ? String(f.year) : '—'), num: (f) => f.year },
  { label: 'Calibre', get: (f) => f.calibre },
  { label: 'Action', get: (f) => f.action },
  { label: 'Weight (empty)', get: (f) => (f.weightKg != null ? `${fmt.weight(f.weightKg)} kg` : '—'), num: (f) => f.weightKg, best: 'min' },
  { label: 'Overall length', get: (f) => (f.lengthMm != null ? `${f.lengthMm} mm` : '—'), num: (f) => f.lengthMm, best: 'min' },
  { label: 'Capacity', get: (f) => (f.capacity != null ? `${f.capacity} rounds` : f.feed === 'Belt-fed' ? 'Belt-fed' : '—'), num: (f) => f.capacity, best: 'max' },
  { label: 'Feed', get: (f) => f.feed },
]
const ROW_SPAN = ROWS.length + 2 // header + picker + rows

function bestIds(items: Firearm[], row: Row) {
  if (!row.best || !row.num || items.length < 2) return new Set<string>()
  const vals = items.map((f) => [f.id, row.num!(f)] as const).filter((x): x is readonly [string, number] => x[1] != null)
  if (vals.length < 2) return new Set<string>()
  const target = row.best === 'min' ? Math.min(...vals.map((v) => v[1])) : Math.max(...vals.map((v) => v[1]))
  return new Set(vals.filter((v) => v[1] === target).map((v) => v[0]))
}

function Picker({ value, onChange, taken }: { value?: string; onChange: (id: string) => void; taken: string[] }) {
  return (
    <select className="field w-full" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label={value ? 'Replace firearm' : 'Choose a firearm'}>
      <option value="" disabled>{value ? 'Replace…' : 'Choose a firearm…'}</option>
      {CATEGORIES.map((c) => (
        <optgroup key={c.slug} label={c.name}>
          {inCategory(c.slug).map((f) => (
            <option key={f.id} value={f.id} disabled={taken.includes(f.id) && f.id !== value}>{f.name}</option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

export default function ComparePage() {
  usePageTitle('Compare')
  const ids = useCompare()
  const [params, setParams] = useSearchParams()

  // a shared link (?ids=a,b,c) seeds the selection once
  useEffect(() => {
    const fromUrl = params.get('ids')?.split(',').filter((id) => BY_ID.has(id))
    if (fromUrl?.length) setCompare(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // keep the URL shareable
  useEffect(() => {
    const cur = params.get('ids') ?? ''
    const want = ids.join(',')
    if (cur !== want) setParams(want ? { ids: want } : {}, { replace: true })
  }, [ids, params, setParams])

  const items = ids.map((id) => BY_ID.get(id)!).filter(Boolean)
  const best = ROWS.map((r) => bestIds(items, r))
  const slots = Array.from({ length: MAX_COMPARE }, (_, i) => items[i])

  const replace = (i: number, id: string) => {
    const next = [...ids]
    if (i < next.length) next[i] = id
    else next.push(id)
    setCompare(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <GlassPanel stagger={0} className="p-5 md:p-6">
        <p className="label">Side by side</p>
        <h1 className="font-display mt-1 text-2xl text-text md:text-3xl">COMPARE</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Choose up to three firearms to compare their specifications. The best value in each numeric row is highlighted: the lightest, the shortest and the largest capacity.
        </p>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" style={{ gridTemplateRows: `repeat(${ROW_SPAN}, auto)` }}>
        {slots.map((f, i) => (
          <GlassPanel
            key={i}
            stagger={i + 1}
            className="grid grid-rows-subgrid gap-0 p-4 md:p-5"
            style={{ gridRow: `span ${ROW_SPAN}` }}
            aria-label={f ? f.name : `Empty slot ${i + 1}`}
            role="group"
          >
            {f ? (
              <>
                <div className="flex items-start justify-between gap-2 pb-3">
                  <div className="min-w-0">
                    <Link to={`/firearm/${f.id}`} className="font-display text-lg leading-tight text-text hover:text-gold-light">{f.name.toUpperCase()}</Link>
                    <div className="mt-3 rounded-xl border border-line bg-bg/60 p-3">
                      <FirearmPreview firearm={f} className="h-14 w-full" />
                    </div>
                  </div>
                  <button type="button" className="icon-btn shrink-0" onClick={() => setCompare(ids.filter((x) => x !== f.id))} aria-label={`Remove ${f.name}`}>
                    <IconClose />
                  </button>
                </div>
                <div className="pb-3">
                  <Picker value={f.id} onChange={(id) => replace(i, id)} taken={ids} />
                </div>
                {ROWS.map((r, ri) => {
                  const hi = best[ri].has(f.id)
                  return (
                    <div key={r.label} className="border-t border-line py-2.5">
                      <div className="label">{r.label}</div>
                      <div className={`mt-0.5 text-sm ${hi ? 'font-semibold text-gold-light' : 'text-text'}`}>
                        {r.get(f)}
                        {hi && <span className="sr-only"> (best in comparison)</span>}
                      </div>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-10 text-center" style={{ gridRow: `span ${ROW_SPAN}` }}>
                <p className="font-display text-base text-muted">EMPTY SLOT</p>
                <div className="w-full max-w-xs">
                  <Picker onChange={(id) => replace(i, id)} taken={ids} />
                </div>
              </div>
            )}
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}

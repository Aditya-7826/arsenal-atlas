import { useMemo, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { CATEGORIES, CATEGORY_BY_SLUG, ERAS, FIREARMS, type CategorySlug, type Firearm } from '../data'
import { GlassPanel } from '../components/GlassPanel'
import { FirearmCard } from '../components/FirearmCard'
import { usePageTitle } from '../usePageTitle'

const SORTS = {
  name: { label: 'Name A–Z', fn: (a: Firearm, b: Firearm) => a.name.localeCompare(b.name) },
  'year-asc': { label: 'Oldest first', fn: (a: Firearm, b: Firearm) => (a.year ?? 9999) - (b.year ?? 9999) },
  'year-desc': { label: 'Newest first', fn: (a: Firearm, b: Firearm) => (b.year ?? 0) - (a.year ?? 0) },
  'weight-asc': { label: 'Lightest first', fn: (a: Firearm, b: Firearm) => (a.weightKg ?? 999) - (b.weightKg ?? 999) },
  'length-asc': { label: 'Shortest first', fn: (a: Firearm, b: Firearm) => (a.lengthMm ?? 99999) - (b.lengthMm ?? 99999) },
} as const
type SortKey = keyof typeof SORTS

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function CategoryPage() {
  const { slug = 'all' } = useParams()
  const [params, setParams] = useSearchParams()
  const category = CATEGORY_BY_SLUG.get(slug as CategorySlug)
  const isAll = slug === 'all'
  usePageTitle(category?.name ?? 'All firearms')

  const q = params.get('q') ?? ''
  const country = params.get('country')
  const era = params.get('era')
  const sort = (params.get('sort') as SortKey) in SORTS ? (params.get('sort') as SortKey) : 'year-asc'

  const base = useMemo(() => (isAll ? FIREARMS : FIREARMS.filter((f) => f.category === slug)), [isAll, slug])
  const countries = useMemo(() => [...new Set(base.map((f) => f.country))].sort(), [base])

  const results = useMemo(() => {
    const needle = norm(q.trim())
    return base
      .filter((f) => !country || f.country === country)
      .filter((f) => !era || f.era === era)
      .filter((f) => {
        if (!needle) return true
        const hay = norm([f.name, f.nickname, f.country, f.calibre, f.manufacturer, f.designer, f.action, ...f.conflicts].filter(Boolean).join(' '))
        return needle.split(/\s+/).every((t) => hay.includes(t))
      })
      .sort(SORTS[sort].fn)
  }, [base, q, country, era, sort])

  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(params)
    if (v == null || next.get(k) === v) next.delete(k)
    else next.set(k, v)
    setParams(next, { replace: true })
  }

  if (!isAll && !category) {
    return (
      <GlassPanel className="mx-auto max-w-lg p-8 text-center" stagger={0}>
        <h1 className="font-display text-2xl">UNKNOWN GALLERY</h1>
        <Link to="/category/all" className="btn mt-6">Browse all firearms</Link>
      </GlassPanel>
    )
  }

  const keepQuery = (s: string) => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (params.get('sort')) next.set('sort', params.get('sort')!)
    const qs = next.toString()
    return `/category/${s}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="grid grid-cols-12 gap-4">
      <GlassPanel stagger={0} className="col-span-12 p-5 md:p-6">
        <p className="label">Gallery</p>
        <h1 className="font-display mt-1 text-2xl text-text md:text-3xl">{(category?.name ?? 'All firearms').toUpperCase()}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{category?.blurb ?? 'Every piece in the collection, across all nine galleries.'}</p>

        <div className="mt-5 flex flex-col gap-3">
          <FilterRow label="Category">
            <Link to={keepQuery('all')} className="chip" aria-current={isAll ? 'page' : undefined}>All</Link>
            {CATEGORIES.map((c) => (
              <Link key={c.slug} to={keepQuery(c.slug)} className="chip" aria-current={slug === c.slug ? 'page' : undefined}>
                {c.name}
              </Link>
            ))}
          </FilterRow>
          <FilterRow label="Era">
            {ERAS.map((e) => (
              <button key={e} type="button" className="chip" aria-pressed={era === e} onClick={() => set('era', e)}>
                {e}
              </button>
            ))}
          </FilterRow>
          <FilterRow label="Country">
            {countries.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={country === c} onClick={() => set('country', c)}>
                {c}
              </button>
            ))}
          </FilterRow>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="numeral text-xl text-text">{results.length}</span> of {base.length} shown
            {q && <> for “<span className="text-gold-light">{q}</span>”</>}
          </p>
          <div className="flex items-center gap-2">
            {(q || country || era) && (
              <button type="button" className="btn" onClick={() => setParams(params.get('sort') ? { sort } : {}, { replace: true })}>
                Clear filters
              </button>
            )}
            <label htmlFor="sort" className="label">Sort</label>
            <select id="sort" className="field" value={sort} onChange={(e) => set('sort', e.target.value)}>
              {(Object.keys(SORTS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORTS[k].label}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassPanel>

      {results.length === 0 ? (
        <GlassPanel className="col-span-12 p-10 text-center" stagger={1}>
          <p className="font-display text-lg">NOTHING MATCHES</p>
          <p className="mt-2 text-sm text-muted">Try a different search or remove a filter.</p>
        </GlassPanel>
      ) : (
        <ul className="col-span-12 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" aria-label="Firearms">
          {results.map((f, i) => (
            <li key={f.id} className="contents">
              <FirearmCard firearm={f} index={i + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <span className="label w-16 shrink-0">{label}</span>
      <div className="flex min-w-0 gap-2 scroll-x pb-1">{children}</div>
    </div>
  )
}

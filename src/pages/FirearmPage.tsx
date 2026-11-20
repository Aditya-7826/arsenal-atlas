import { lazy, Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { BY_ID, CATEGORY_BY_SLUG, boreMm, categoryStats, fmt, hasModel, inCategory, type Firearm } from '../data'
import { useMode } from '../mode'
import { toggleCompare, useCompare, MAX_COMPARE } from '../compare'
import { GlassPanel } from '../components/GlassPanel'
import { StatTile, type Compare } from '../components/StatTile'
import { Sparkline } from '../components/Sparkline'
import { Silhouette2D } from '../components/Silhouette2D'
import { IconBack, IconCompare } from '../components/Icons'
import { usePageTitle } from '../usePageTitle'

// The viewer (and three.js) only loads when a firearm page opens in 3D mode.
const Viewer = lazy(() => import('../three/Viewer'))

const pct = (v: number) => `${Math.abs(Math.round(v * 100))}%`

function versusAvg(f: Firearm, key: 'weightKg' | 'lengthMm' | 'capacity', noun: [string, string]): Compare | null {
  const v = f[key]
  const s = categoryStats(f.category, key)
  if (v == null || !s || s.n < 2) return null
  const top = s.max * 1.05
  const d = (v - s.avg) / s.avg
  const caption = Math.abs(d) < 0.03 ? 'About the category average' : `${pct(d)} ${d > 0 ? noun[0] : noun[1]} than the category average`
  return { fraction: v / top, avgFraction: s.avg / top, caption }
}

function yearVsAvg(f: Firearm): Compare | null {
  const s = categoryStats(f.category, 'year')
  if (f.year == null || !s || s.max === s.min) return null
  const span = s.max - s.min
  const d = Math.round(f.year - s.avg)
  const caption = d === 0 ? 'Right at the category average' : `${Math.abs(d)} years ${d > 0 ? 'after' : 'before'} the category average`
  return { fraction: (f.year - s.min) / span, avgFraction: (s.avg - s.min) / span, caption }
}

function calibreVsAvg(f: Firearm): Compare | null {
  const v = boreMm(f.calibre)
  const vals = inCategory(f.category).map((x) => boreMm(x.calibre)).filter((x): x is number => x != null)
  if (v == null || vals.length < 2) return null
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  const top = Math.max(...vals) * 1.05
  const d = (v - avg) / avg
  const caption = Math.abs(d) < 0.03 ? 'Typical bore for the category' : `Bore ${pct(d)} ${d > 0 ? 'wider' : 'narrower'} than the category average`
  return { fraction: v / top, avgFraction: avg / top, caption }
}

function Fact({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-2.5 last:border-0">
      <dt className="label">{k}</dt>
      <dd className="text-sm text-text">{v ?? '—'}</dd>
    </div>
  )
}

export default function FirearmPage() {
  const { id = '' } = useParams()
  const f = BY_ID.get(id)
  const { mode } = useMode()
  const compare = useCompare()
  usePageTitle(f?.name ?? 'Not found')

  if (!f) {
    return (
      <GlassPanel className="mx-auto max-w-lg p-8 text-center" stagger={0}>
        <h1 className="font-display text-2xl">NOT IN THE COLLECTION</h1>
        <p className="mt-3 text-muted">There is no firearm with the id “{id}”.</p>
        <Link to="/category/all" className="btn mt-6">Browse all firearms</Link>
      </GlassPanel>
    )
  }

  const cat = CATEGORY_BY_SLUG.get(f.category)!
  const siblings = inCategory(f.category)
  const idx = siblings.findIndex((x) => x.id === f.id)
  const prev = siblings[(idx - 1 + siblings.length) % siblings.length]
  const next = siblings[(idx + 1) % siblings.length]
  const inCompare = compare.includes(f.id)
  const [calNum, ...calRest] = f.calibre.split(/(?<=^[\d.]+)(?=[×x ])/)

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Title */}
      <GlassPanel stagger={0} className="col-span-12 flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="min-w-0">
          <Link to={`/category/${cat.slug}`} className="label inline-flex items-center gap-1.5 hover:text-gold-light">
            <IconBack width={14} height={14} /> {cat.name}
          </Link>
          <h1 className="font-display mt-2 text-2xl leading-tight text-text md:text-4xl">{f.name.toUpperCase()}</h1>
          <p className="mt-2 text-sm text-muted">
            {[f.nickname && `“${f.nickname}”`, f.country, f.era].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`btn ${inCompare ? 'btn-solid' : ''}`}
            aria-pressed={inCompare}
            onClick={() => toggleCompare(f.id)}
            title={!inCompare && compare.length >= MAX_COMPARE ? 'Adding replaces the oldest of the three' : undefined}
          >
            <IconCompare width={16} height={16} /> {inCompare ? 'In compare' : 'Add to compare'}
          </button>
          {compare.length > 0 && (
            <Link to="/compare" className="btn">Compare ({compare.length})</Link>
          )}
        </div>
      </GlassPanel>

      {/* Viewer: 8 columns */}
      <GlassPanel stagger={1} className="col-span-12 h-[min(62vh,560px)] min-h-[340px] lg:col-span-8 lg:h-auto lg:min-h-[560px]">
        {mode === '3d' ? (
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center label" role="status">Preparing viewer…</div>}>
            <Viewer firearm={f} />
          </Suspense>
        ) : (
          <div className="absolute inset-0 grid place-items-center p-8">
            <Silhouette2D firearm={f} className="max-h-[70%] w-full" />
            <span className="label absolute left-3 top-3 rounded-full border border-line px-3 py-1.5 text-gold-light!">
              {hasModel(f.id) ? '2D mode: switch to 3D for the model' : 'Model coming soon'}
            </span>
            {f.lengthMm != null && <span className="label absolute bottom-4">{f.lengthMm} mm overall</span>}
          </div>
        )}
      </GlassPanel>

      {/* Stat tiles: 4 columns */}
      <div className="col-span-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
        <StatTile stagger={2} label="Introduced" value={f.year != null ? String(f.year) : '—'} compare={yearVsAvg(f)} />
        <StatTile stagger={3} small label="Calibre" value={calNum} unit={calRest.join('')} compare={calibreVsAvg(f)} />
        <StatTile stagger={4} label="Weight (empty)" value={fmt.weight(f.weightKg)} unit="kg" compare={versusAvg(f, 'weightKg', ['heavier', 'lighter'])} />
        <StatTile stagger={5} label="Overall length" value={fmt.int(f.lengthMm)} unit="mm" compare={versusAvg(f, 'lengthMm', ['longer', 'shorter'])} />
        <StatTile
          stagger={6}
          label={`Capacity · ${f.feed}`}
          value={f.capacity != null ? String(f.capacity) : f.feed === 'Belt-fed' ? 'Belt' : '—'}
          unit={f.capacity != null ? 'rounds' : undefined}
          compare={versusAvg(f, 'capacity', ['more', 'less'])}
        />
      </div>

      {/* History */}
      <GlassPanel stagger={7} className="col-span-12 grid gap-6 p-5 md:grid-cols-12 md:p-6">
        <div className="md:col-span-7">
          <h2 className="label text-gold!">History</h2>
          <p className="mt-3 text-[0.98rem] leading-relaxed text-text">{f.history}</p>
          {f.trivia.length > 0 && (
            <>
              <h2 className="label mt-6 text-gold!">Did you know</h2>
              <ul className="mt-3 space-y-2">
                {f.trivia.map((t) => (
                  <li key={t} className="flex gap-3 text-sm leading-relaxed text-text">
                    <span className="mt-2 h-px w-4 shrink-0 bg-gold" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="label text-gold!">Notable users</h2>
              <ul className="mt-2 space-y-1 text-sm text-text">{f.users.map((u) => <li key={u}>{u}</li>)}</ul>
            </div>
            <div>
              <h2 className="label text-gold!">Notable service</h2>
              <ul className="mt-2 space-y-1 text-sm text-text">
                {f.conflicts.length ? f.conflicts.map((c) => <li key={c}>{c}</li>) : <li className="text-muted">Mainly police, sporting or civilian use</li>}
              </ul>
            </div>
          </div>
        </div>
        <dl className="md:col-span-5 md:border-l md:border-line md:pl-6">
          <Fact k="Country of origin" v={f.country} />
          <Fact k="Manufacturer" v={f.manufacturer} />
          <Fact k="Designer" v={f.designer} />
          <Fact k="Action" v={f.action} />
          <Fact k="Feed" v={f.feed} />
          <Fact k="Calibre" v={f.calibre} />
          <Fact k="Era" v={f.era} />
        </dl>
      </GlassPanel>

      {/* Sparkline */}
      <GlassPanel stagger={8} className="col-span-12 p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="label text-gold!">{cat.name}: year of introduction</h2>
          <span className="text-xs text-muted">Select a point to open that firearm</span>
        </div>
        <Sparkline items={siblings} current={f} />
      </GlassPanel>

      <nav className="col-span-12 flex justify-between gap-3" aria-label="More in this gallery">
        <Link to={`/firearm/${prev.id}`} className="btn max-w-[48%] truncate">
          <IconBack width={16} height={16} /> <span className="truncate">{prev.name}</span>
        </Link>
        <Link to={`/firearm/${next.id}`} className="btn max-w-[48%] truncate">
          <span className="truncate">{next.name}</span> <IconBack width={16} height={16} className="rotate-180" />
        </Link>
      </nav>
    </div>
  )
}

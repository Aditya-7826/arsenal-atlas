import { Link } from 'react-router'
import { BY_ID, CREDITS, FIREARMS, MODEL_COUNT } from '../data'
import { GlassPanel } from '../components/GlassPanel'
import { usePageTitle } from '../usePageTitle'

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const

export default function CreditsPage() {
  usePageTitle('Credits')
  const models = CREDITS.models
  return (
    <div className="grid grid-cols-12 gap-4">
      <GlassPanel stagger={0} className="col-span-12 p-5 md:p-6">
        <p className="label">Attribution</p>
        <h1 className="font-display mt-1 text-2xl text-text md:text-3xl">CREDITS</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          Every 3D model in Arsenal Atlas is licensed CC0 or CC BY and credited here. This page is generated from <code className="text-gold-light">data/credits.json</code>. Text descriptions are original to this project. {MODEL_COUNT} of {FIREARMS.length} firearms currently have a 3D model; the rest use stylised placeholder silhouettes.
        </p>
      </GlassPanel>

      <GlassPanel stagger={1} className="col-span-12 p-5 md:p-6">
        <h2 className="label text-gold!">3D models</h2>
        {models.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No third-party models have been added yet. See MODELS.md in the repository for how to add them.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {models.map((m) => (
              <li key={m.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <Link to={`/firearm/${m.id}`} className="text-text hover:text-gold-light">{BY_ID.get(m.id)?.name ?? m.id}</Link>
                  <p className="text-sm text-muted">
                    “<a href={m.sourceUrl} {...ext} className="underline decoration-line underline-offset-4 hover:text-gold-light">{m.title}</a>” by{' '}
                    {m.authorUrl ? <a href={m.authorUrl} {...ext} className="underline decoration-line underline-offset-4 hover:text-gold-light">{m.author}</a> : m.author}, via {m.source}
                    {m.changes ? `. ${m.changes}` : ''}
                  </p>
                </div>
                <a href={m.licenseUrl} {...ext} className="chip shrink-0 self-start">{m.license}</a>
              </li>
            ))}
          </ul>
        )}
      </GlassPanel>

      <GlassPanel stagger={2} className="col-span-12 p-5 md:p-6">
        <h2 className="label text-gold!">Other assets</h2>
        <ul className="mt-3 divide-y divide-line">
          {CREDITS.assets.map((a) => (
            <li key={a.name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <a href={a.sourceUrl} {...ext} className="text-text hover:text-gold-light">{a.name}</a>
                <p className="text-sm text-muted">by {a.author}, via {a.source}</p>
              </div>
              <a href={a.licenseUrl} {...ext} className="chip shrink-0 self-start">{a.license}</a>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  )
}

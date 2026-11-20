import raw from '../data/firearms.json'
import credits from '../data/credits.json'
import modelIds from 'virtual:model-manifest'

export type Firearm = {
  id: string
  name: string
  nickname: string | null
  country: string
  manufacturer: string | null
  designer: string | null
  year: number | null
  category: CategorySlug
  calibre: string
  action: string
  weightKg: number | null
  lengthMm: number | null
  capacity: number | null
  feed: string
  users: string[]
  conflicts: string[]
  history: string
  trivia: string[]
  era: Era | null
  modelPath: string
}

export type Era = 'Pre-1900' | '1900–1945' | 'Cold War' | 'Modern'
export const ERAS: Era[] = ['Pre-1900', '1900–1945', 'Cold War', 'Modern']

export type CategorySlug =
  | 'assault-rifles'
  | 'battle-rifles'
  | 'sniper-dmr'
  | 'submachine-guns'
  | 'machine-guns'
  | 'shotguns'
  | 'pistols'
  | 'revolvers'
  | 'historic-rifles'

export type Category = {
  slug: CategorySlug
  name: string
  short: string
  blurb: string
  /** typical overall length in mm, used to scale silhouettes when length is unknown */
  typicalMm: number
  featured: string[]
}

export const CATEGORIES: Category[] = [
  { slug: 'assault-rifles', name: 'Assault Rifles', short: 'Assault', typicalMm: 900, blurb: 'Select-fire rifles built around intermediate cartridges.', featured: ['ak-47', 'm16', 'steyr-aug'] },
  { slug: 'battle-rifles', name: 'Battle Rifles', short: 'Battle', typicalMm: 1080, blurb: 'Self-loading rifles firing full-power cartridges.', featured: ['m1-garand', 'fn-fal', 'hk-g3'] },
  { slug: 'sniper-dmr', name: 'Sniper & Marksman', short: 'Sniper', typicalMm: 1150, blurb: 'Precision rifles for long-range and marksman roles.', featured: ['barrett-m82', 'svd-dragunov', 'l115a3'] },
  { slug: 'submachine-guns', name: 'Submachine Guns', short: 'SMG', typicalMm: 650, blurb: 'Compact automatic weapons, mostly in pistol calibres.', featured: ['thompson', 'uzi', 'mp5'] },
  { slug: 'machine-guns', name: 'Machine Guns', short: 'MG', typicalMm: 1150, blurb: 'Light and general-purpose support weapons.', featured: ['mg-42', 'm60', 'm249'] },
  { slug: 'shotguns', name: 'Shotguns', short: 'Shotgun', typicalMm: 1050, blurb: 'Smoothbore long guns, from frontier lever-actions to modern autos.', featured: ['remington-870', 'spas-12', 'benelli-m4'] },
  { slug: 'pistols', name: 'Pistols', short: 'Pistol', typicalMm: 205, blurb: 'Self-loading handguns from the 1890s to today.', featured: ['colt-m1911', 'glock-17', 'desert-eagle'] },
  { slug: 'revolvers', name: 'Revolvers', short: 'Revolver', typicalMm: 280, blurb: 'Cylinder-fed handguns of the frontier, police and cinema.', featured: ['colt-saa', 'sw-model-29', 'colt-python'] },
  { slug: 'historic-rifles', name: 'Historic Rifles', short: 'Historic', typicalMm: 1120, blurb: 'Classic bolt- and lever-action rifles that defined an era.', featured: ['kar98k', 'lee-enfield-smle', 'mosin-nagant'] },
]

export const FIREARMS = raw as Firearm[]
export const BY_ID = new Map(FIREARMS.map((f) => [f.id, f]))
export const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]))
export const COUNTRIES = [...new Set(FIREARMS.map((f) => f.country))].sort()

const MODELS = new Set<string>(modelIds)
export const hasModel = (id: string) => MODELS.has(id)
export const MODEL_COUNT = FIREARMS.filter((f) => MODELS.has(f.id)).length

export const inCategory = (slug: CategorySlug) => FIREARMS.filter((f) => f.category === slug)

/** Overall length in metres, falling back to the category's typical length. */
export function displayLengthM(f: Firearm) {
  return (f.lengthMm ?? CATEGORY_BY_SLUG.get(f.category)!.typicalMm) / 1000
}

type NumKey = 'year' | 'weightKg' | 'lengthMm' | 'capacity'
export function categoryStats(slug: CategorySlug, key: NumKey) {
  const vals = inCategory(slug)
    .map((f) => f[key])
    .filter((v): v is number => v != null)
  if (!vals.length) return null
  const sum = vals.reduce((a, b) => a + b, 0)
  return { avg: sum / vals.length, min: Math.min(...vals), max: Math.max(...vals), n: vals.length }
}

/** Bore diameter in mm parsed from a calibre label, or null (e.g. shotgun gauges). */
export function boreMm(calibre: string): number | null {
  const metric = calibre.match(/^(\d+(?:\.\d+)?)×/)
  if (metric) return parseFloat(metric[1])
  const inch = calibre.match(/^\.(\d+)/)
  if (inch) return parseFloat('0.' + inch[1]) * 25.4
  return null
}

export const fmt = {
  weight: (v: number | null) => (v == null ? '—' : v.toFixed(v < 10 ? 2 : 1).replace(/\.?0+$/, '')),
  int: (v: number | null) => (v == null ? '—' : String(Math.round(v))),
}

export type Credit = {
  id: string
  title: string
  author: string
  authorUrl?: string
  source: string
  sourceUrl: string
  license: 'CC0-1.0' | 'CC-BY-4.0' | 'CC-BY-3.0'
  licenseUrl: string
  changes?: string
}
export type AssetCredit = { name: string; author: string; source: string; sourceUrl: string; license: string; licenseUrl: string }
export const CREDITS = credits as { models: Credit[]; assets: AssetCredit[] }

export const SITE = 'Arsenal Atlas'

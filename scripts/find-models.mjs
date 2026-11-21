#!/usr/bin/env node
/**
 * Find downloadable CC0 / CC-BY candidates on Sketchfab for every catalogue entry
 * (public API, no login needed) and write MODEL-SOURCES.md: one pick per firearm
 * plus alternates. You still review and download each model yourself (Sketchfab
 * requires an account to download).
 *
 *   node scripts/find-models.mjs            all firearms without a model
 *   node scripts/find-models.mjs ak-47 m16  just these ids
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const firearms = JSON.parse(readFileSync(join(root, 'data', 'firearms.json'), 'utf8'))
const only = process.argv.slice(2)
const targets = firearms.filter((f) => (only.length ? only.includes(f.id) : !existsSync(join(root, 'public', 'models', `${f.id}.glb`))))

const API = 'https://api.sketchfab.com/v3'
const OK_LICENCES = new Map([
  ['cc0', { slug: 'CC0-1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  ['by', { slug: 'CC-BY-4.0', url: 'https://creativecommons.org/licenses/by/4.0/' }],
])
// game rips and fan content are excluded: the brief only allows original, reusable work
const GAME = /\b(rust|cs ?: ?go|csgo|counter[- ]?strike|pubg|call of duty|\bcod\b|warzone|fortnite|tarkov|battlefield|valorant|roblox|minecraft|gta|apex|rainbow ?six|r6|halo|far ?cry|stalker|metro|fallout|borderlands|ripped|extracted|game ?ready ?from|left 4 dead|l4d|team fortress|tf2|payday|insurgency|squad|arma|dayz|standoff|free ?fire|critical ops|blackshot|crossfire|point blank|warface|sniper elite|resident evil|half[- ]?life|wolfenstein|battlegrounds)\b/i
const BAD = /\b(cutaway|exploded|disassembl|internal|parts? kit|lowpoly toy|nerf|airsoft|water ?gun|toy|cartoon|stylized|stylised|low ?poly)\b/i

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'model-finder/1.0' } })
    if (res.status === 429) {
      await sleep(4000 * (i + 1))
      continue
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return res.json()
  }
  throw new Error(`rate limited: ${url}`)
}

function queries(f) {
  const q = [f.name]
  if (f.nickname && !/[“”"]/.test(f.nickname) && f.nickname.length < 24) q.push(f.nickname)
  const short = f.name.replace(/^(Heckler & Koch|FN|IMI|IWI|Accuracy International|McMillan|Smith & Wesson|Colt|Franchi|Walther|Browning|Winchester|Steyr|SIG Sauer)\s+/i, '')
  if (short !== f.name) q.push(short)
  return [...new Set(q)]
}

const out = []
for (const [n, f] of targets.entries()) {
  process.stdout.write(`[${n + 1}/${targets.length}] ${f.id} … `)
  const seen = new Map()
  for (const q of queries(f)) {
    const url = `${API}/search?type=models&downloadable=true&count=12&q=${encodeURIComponent(q)}`
    try {
      const r = await get(url)
      for (const m of r.results ?? []) seen.set(m.uid, m)
    } catch (e) {
      process.stdout.write(`(search failed: ${e.message}) `)
    }
    await sleep(700)
  }
  // relevance: the name must mention a distinctive token of the firearm
  const tokens = queries(f)
    .flatMap((q) => q.toLowerCase().split(/[\s()/–-]+/))
    .filter((t) => t.length >= 2 && !['the', 'of', 'gun', 'rifle', 'model', 'sniper', 'system', 'weapon', 'submachine', 'automatic'].includes(t))
  const candidates = [...seen.values()].filter((m) => {
    const text = `${m.name} ${(m.tags ?? []).map((t) => t.name).join(' ')}`.toLowerCase()
    return tokens.some((t) => text.includes(t)) && !GAME.test(text) && !BAD.test(text)
  })

  const checked = []
  for (const m of candidates.slice(0, 8)) {
    try {
      const d = await get(`${API}/models/${m.uid}`)
      const lic = OK_LICENCES.get(d.license?.slug)
      const text = `${d.name} ${d.description ?? ''} ${(d.tags ?? []).map((t) => t.name).join(' ')}`
      if (lic && !GAME.test(text) && !BAD.test(d.name)) {
        checked.push({
          uid: d.uid,
          title: d.name,
          author: d.user?.displayName ?? d.user?.username,
          authorUrl: d.user?.profileUrl,
          url: d.viewerUrl,
          license: lic.slug,
          licenseUrl: lic.url,
          faces: d.faceCount,
          likes: d.likeCount,
          views: d.viewCount,
          animated: d.animationCount > 0,
        })
      }
    } catch {
      /* skip */
    }
    await sleep(500)
  }
  // prefer reasonably detailed (but not huge) static models with community approval
  const score = (c) => c.likes * 3 + Math.log10(c.views + 1) * 10 + (c.faces > 4000 && c.faces < 250000 ? 25 : 0) - (c.faces > 350000 ? 30 : 0) - (c.animated ? 15 : 0)
  checked.sort((a, b) => score(b) - score(a))
  out.push({ f, picks: checked.slice(0, 3) })
  console.log(checked.length ? `${checked.length} ok` : 'none found')
}

const n = out.filter((o) => o.picks.length).length
let md = `# Model sources\n\nGenerated by \`node scripts/find-models.mjs\`. Candidates are downloadable on Sketchfab under **CC0** or **CC BY 4.0**, with obvious game rips, toys and cutaways filtered out. **${n} of ${out.length}** firearms have at least one candidate.\n\n`
md += `## Before you download each one\n\n- Open the link and check the licence box on the page says CC0 or CC Attribution.\n- Skip it if it shows brand logos or trademarks, cutaways or internal parts, or looks like it came from a game.\n- Click **Download 3D model**, choose **GLB**, and save it as \`<id>.glb\` (the id is in the first column).\n- Put the files in \`models-raw/\`, or leave them in your Downloads folder and ask Claude to collect them.\n\n`
md += `| id | firearm | pick | licence | author | faces |\n|---|---|---|---|---|---|\n`
for (const { f, picks } of out) {
  const p = picks[0]
  md += p ? `| \`${f.id}\` | ${f.name} | [${p.title.replace(/\|/g, '/')}](${p.url}) | ${p.license} | ${p.author} | ${p.faces?.toLocaleString('en') ?? '?'} |\n` : `| \`${f.id}\` | ${f.name} | none found | | | |\n`
}
md += `\n## Alternates\n\n`
for (const { f, picks } of out) {
  if (picks.length < 2) continue
  md += `- **${f.id}**: ${picks.slice(1).map((p) => `[${p.title.replace(/[[\]]/g, '')}](${p.url}) (${p.license}, ${p.author})`).join(' · ')}\n`
}
writeFileSync(join(root, 'MODEL-SOURCES.md'), md)
writeFileSync(join(root, 'data', 'model-candidates.json'), JSON.stringify(out.map(({ f, picks }) => ({ id: f.id, picks })), null, 2) + '\n')
console.log(`\nWrote MODEL-SOURCES.md and data/model-candidates.json (${n}/${out.length} with candidates).`)

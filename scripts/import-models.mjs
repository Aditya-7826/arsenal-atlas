#!/usr/bin/env node
/**
 * Import downloaded Sketchfab models listed in data/downloads.json.
 *
 * For every "downloaded" entry:
 *   - copies <SOURCE_DIR>/<file> to models-raw/<id>.glb (copy only; the source is never touched)
 *   - checks the copy starts with the GLB magic bytes "glTF"
 * Then writes data/credits.json: [{ id, title, author, authorUrl, url, license }] sorted by id,
 * for every model that was copied and valid.
 *
 *   npm run models:import
 */
import { copyFileSync, existsSync, mkdirSync, openSync, readSync, closeSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Where the browser saved the downloads. */
const SOURCE_DIR = 'C:\\Users\\ADMIN\\Downloads'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = join(root, 'models-raw')
const log = JSON.parse(readFileSync(join(root, 'data', 'downloads.json'), 'utf8'))

function isGlb(path) {
  const fd = openSync(path, 'r')
  const buf = Buffer.alloc(4)
  readSync(fd, buf, 0, 4, 0)
  closeSync(fd)
  return buf.toString('latin1') === 'glTF'
}

mkdirSync(RAW, { recursive: true })
const copied = []
const missing = []
const invalid = []

for (const e of log.filter((x) => x.status === 'downloaded')) {
  const src = join(SOURCE_DIR, e.file)
  if (!existsSync(src)) {
    missing.push(`${e.id}: ${e.file}`)
    continue
  }
  const dest = join(RAW, `${e.id}.glb`)
  copyFileSync(src, dest)
  if (!isGlb(dest)) {
    invalid.push(`${e.id}: ${e.file} (first 4 bytes are not "glTF")`)
    rmSync(dest) // only our own copy in models-raw/ is removed
    continue
  }
  copied.push({ e, mb: statSync(dest).size / 1048576 })
}

const credits = copied
  .map(({ e }) => ({ id: e.id, title: e.title, author: e.author, authorUrl: e.authorUrl, url: e.url, license: e.license }))
  .sort((a, b) => a.id.localeCompare(b.id))
writeFileSync(join(root, 'data', 'credits.json'), JSON.stringify(credits, null, 2) + '\n')

for (const { e, mb } of copied) console.log(`✓ ${e.id.padEnd(20)} ${mb.toFixed(1).padStart(7)} MB  <- ${e.file}`)
if (missing.length) console.log(`\nMissing source files:\n${missing.map((m) => `  - ${m}`).join('\n')}`)
if (invalid.length) console.log(`\nInvalid GLB files:\n${invalid.map((m) => `  - ${m}`).join('\n')}`)
const total = copied.reduce((s, c) => s + c.mb, 0)
console.log(`\nImport summary: ${copied.length} copied (${total.toFixed(0)} MB raw), ${missing.length} missing, ${invalid.length} invalid, ${log.filter((x) => x.status === 'none').length} marked "none".`)
console.log(`Wrote data/credits.json with ${credits.length} entries.`)
process.exit(missing.length || invalid.length ? 1 : 0)

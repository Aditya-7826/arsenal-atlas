#!/usr/bin/env node
/**
 * Report model coverage for the catalogue:
 *  - which firearms have a model in public/models
 *  - which are still placeholders
 *  - which models have no entry in data/credits.json (must be fixed before deploying)
 *  - credits with a non-CC0/CC-BY licence, and stray files
 *
 * Exits with code 1 if any model lacks credits or has a disallowed licence.
 * `--quiet` prints only the summary.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const quiet = process.argv.includes('--quiet')
const firearms = JSON.parse(readFileSync(join(root, 'data', 'firearms.json'), 'utf8'))
const rawCredits = JSON.parse(readFileSync(join(root, 'data', 'credits.json'), 'utf8'))
const credits = Array.isArray(rawCredits) ? rawCredits : (rawCredits.models ?? [])
const dir = join(root, 'public', 'models')
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.glb')).map((f) => f.slice(0, -4)) : []

const ALLOWED = new Set(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-3.0', 'CC0', 'CC BY 4.0', 'CC BY 3.0'])
const ids = new Set(firearms.map((f) => f.id))
const have = new Set(files)
const credited = new Map(credits.map((c) => [c.id, c]))

const withModel = firearms.filter((f) => have.has(f.id))
const missing = firearms.filter((f) => !have.has(f.id))
const noCredit = withModel.filter((f) => !credited.has(f.id))
const badLicence = credits.filter((c) => !ALLOWED.has(c.license))
const incomplete = credits.filter((c) => !c.author || !(c.url || c.sourceUrl))
const stray = files.filter((id) => !ids.has(id))
const nullPathWithFile = firearms.filter((f) => f.modelPath === null && have.has(f.id))
const orphanCredits = credits.filter((c) => !have.has(c.id))

const list = (title, items) => {
  if (quiet || !items.length) return
  console.log(`\n${title} (${items.length})`)
  for (const i of items) console.log(`  - ${i}`)
}

list('Has a model', withModel.map((f) => `${f.id}  ${f.name}`))
list('Missing a model (placeholder shown)', missing.map((f) => `${f.id}  ${f.name}`))
list('MODEL WITHOUT CREDITS: add to data/credits.json', noCredit.map((f) => f.id))
list(`DISALLOWED LICENCE (allowed: ${[...ALLOWED].join(', ')})`, badLicence.map((c) => `${c.id}: ${c.license}`))
list('Credit entry missing author or source url', incomplete.map((c) => c.id))
list('GLB not in catalogue (rename to <id>.glb)', stray.map((id) => `${id}.glb`))
list('modelPath is null but a GLB exists (set modelPath to /models/<id>.glb)', nullPathWithFile.map((f) => f.id))
list('Credit for a model that is not present (fine if you are about to add it)', orphanCredits.map((c) => c.id))

console.log(`\nModels: ${withModel.length}/${firearms.length} firearms have a real model, ${missing.length} use placeholders.`)
console.log(`Credits: ${noCredit.length} model(s) lack credits, ${badLicence.length} disallowed licence(s), ${stray.length} stray file(s).`)

process.exit(noCredit.length || badLicence.length ? 1 : 0)

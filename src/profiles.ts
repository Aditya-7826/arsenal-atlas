import type { Mat } from './silhouette'

/**
 * Detailed side-profile study models. Coordinates are millimetres in a side view
 * (x: butt -> muzzle, y: up, bore axis near y = 0). Each `shape` part is an SVG-style
 * path (M/L/Q/C/Z, absolute); the first subpath is the outline and any further
 * subpaths are holes. The same data renders as an SVG (cards, 2D mode) and as
 * bevelled extrusions in 3D. External appearance only.
 */
export type DPart =
  | { k: 'shape'; d: string; t: number; z?: number; m: Mat }
  | { k: 'cyl'; x0: number; x1: number; y: number; r: number; r1?: number; z?: number; m: Mat }
  | { k: 'disc'; x: number; y: number; r: number; t: number; z?: number; m: Mat }

export type Profile = { parts: DPart[] }

const S = (d: string, t: number, m: Mat, z?: number): DPart => ({ k: 'shape', d, t, m, z })
const C = (x0: number, x1: number, y: number, r: number, m: Mat = 'metal', r1?: number): DPart => ({ k: 'cyl', x0, x1, y, r, r1, m })

export const PROFILES: Record<string, Profile> = {
  'ak-47': {
    parts: [
      // barrel, muzzle nut and cleaning rod sit behind the furniture
      C(520, 846, 0, 8.5),
      C(840, 870, 0, 10.5),
      C(566, 812, -19, 3),
      C(560, 702, 27, 8),
      // wooden buttstock with steel butt plate
      S('M4 -40 L256 4 L256 -30 Q206 -42 162 -66 L16 -150 Q6 -154 4 -144 Z', 40, 'wood'),
      S('M0 -146 L6 -148 L6 -38 L0 -40 Z', 42, 'metal'),
      // receiver with dust cover and rear trunnion
      S('M250 -31 L250 10 Q251 20 262 21 L498 23 L506 17 L524 17 L524 -31 Z', 30, 'metal'),
      S('M256 21 L500 23 L500 27 Q380 30 262 26 Z', 26, 'metal'),
      // rear sight block and leaf
      S('M500 17 L562 17 L562 30 L548 34 L512 30 Z', 26, 'metal'),
      S('M512 30 L548 34 L548 38 L514 35 Z', 12, 'metal'),
      // wooden upper and lower handguards
      S('M562 18 L686 18 Q694 26 688 36 L572 38 Q562 35 562 27 Z', 34, 'wood'),
      S('M524 -31 L524 14 L700 12 Q712 -4 703 -22 L568 -35 Q534 -37 524 -31 Z', 40, 'wood'),
      // gas block and front sight
      S('M700 -10 L734 -8 L736 39 L700 41 Q696 16 700 -10 Z', 26, 'metal'),
      S('M806 -12 L842 -12 L842 7 L831 46 L819 46 L806 7 Z', 22, 'metal'),
      // curved 30-round magazine with its two reinforcing ribs
      S('M392 -31 L448 -31 Q458 -132 529 -223 L474 -245 Q408 -148 392 -31 Z', 24, 'metal'),
      S('M402 -60 L446 -58 L443 -66 L400 -68 Z', 26, 'metal'),
      S('M470 -226 L520 -210 L516 -218 L474 -234 Z', 26, 'metal'),
      // pistol grip, trigger guard (hollow) and trigger
      S('M300 -31 L346 -31 L323 -137 Q318 -147 306 -147 L285 -145 Q276 -142 278 -132 Z', 28, 'wood'),
      S('M344 -31 L394 -31 Q392 -64 362 -71 L347 -71 Q338 -68 340 -56 Z M352 -35 L384 -35 Q381 -58 363 -63 L353 -63 Q348 -60 349 -52 Z', 8, 'metal'),
      S('M360 -33 L366 -33 Q369 -48 359 -57 L356 -53 Q362 -45 360 -33 Z', 6, 'metal'),
      // selector lever on the right side of the receiver
      S('M268 7 L438 -1 L438 -6 L268 2 Z', 3, 'metal', 16.5),
    ],
  },
}

/* ── path parsing ───────────────────────────────────────────────────── */

export type Seg = ['M' | 'L', number, number] | ['Q', number, number, number, number] | ['C', number, number, number, number, number, number]

/** Parse an absolute M/L/Q/C/Z path into subpaths of segments. */
export function parsePath(d: string): Seg[][] {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g) ?? []
  const out: Seg[][] = []
  let cur: Seg[] = []
  let i = 0
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    const t = tokens[i++]
    if (t === 'M') {
      if (cur.length) out.push(cur)
      cur = [['M', num(), num()]]
    } else if (t === 'L') cur.push(['L', num(), num()])
    else if (t === 'Q') cur.push(['Q', num(), num(), num(), num()])
    else if (t === 'C') cur.push(['C', num(), num(), num(), num(), num(), num()])
    else if (t === 'Z') {
      out.push(cur)
      cur = []
    }
  }
  if (cur.length) out.push(cur)
  return out
}

/** Bounding box of a profile in millimetres (control points included; close enough for framing). */
export function profileBounds(p: Profile) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y)
  }
  for (const part of p.parts) {
    if (part.k === 'shape') {
      for (const sub of parsePath(part.d)) for (const s of sub) for (let j = 1; j < s.length; j += 2) add(s[j] as number, s[j + 1] as number)
    } else if (part.k === 'cyl') {
      const r = Math.max(part.r, part.r1 ?? part.r)
      add(part.x0, part.y - r); add(part.x1, part.y + r)
    } else {
      add(part.x - part.r, part.y - part.r); add(part.x + part.r, part.y + part.r)
    }
  }
  return { x0, x1, y0, y1 }
}

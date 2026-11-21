import type { Firearm } from './data'
import { PROFILES, profileBounds } from './profiles'

/**
 * Stylised placeholder silhouettes. Each shape is a list of simple blocks in a side-profile
 * plane, normalised so the overall length is 1 (x: 0 = butt, 1 = muzzle; y: up).
 * The same definition renders as an SVG (cards, 2D mode) and as three.js primitives (viewer, lobby).
 * External outline only: no internal parts.
 */
export type Mat = 'metal' | 'polymer' | 'wood'
export type Part =
  | { k: 'box'; x0: number; x1: number; y0: number; y1: number; rot?: number; d?: number; m: Mat }
  | { k: 'cyl'; x0: number; x1: number; y: number; r: number; m: Mat }

export type Shape = 'rifle' | 'bullpup' | 'battle' | 'classic' | 'sniper' | 'smg' | 'mg' | 'shotgun' | 'lever' | 'pistol' | 'revolver'

const b = (x0: number, x1: number, y0: number, y1: number, m: Mat, rot = 0, d?: number): Part => ({ k: 'box', x0, x1, y0, y1, m, rot, d })
const c = (x0: number, x1: number, y: number, r: number, m: Mat = 'metal'): Part => ({ k: 'cyl', x0, x1, y, r, m })

export const SHAPES: Record<Shape, Part[]> = {
  rifle: [
    b(0, 0.24, -0.03, 0.07, 'polymer', -4),
    b(0.23, 0.56, 0, 0.085, 'metal'),
    b(0.3, 0.55, 0.085, 0.1, 'metal'),
    b(0.56, 0.8, 0.012, 0.075, 'polymer'),
    c(0.8, 1, 0.045, 0.011),
    b(0.88, 0.9, 0.055, 0.1, 'metal'),
    b(0.33, 0.38, -0.13, 0.0, 'polymer', -16),
    b(0.44, 0.51, -0.19, 0.0, 'metal', 14),
  ],
  bullpup: [
    b(0, 0.63, -0.02, 0.1, 'polymer'),
    b(0.25, 0.58, 0.1, 0.165, 'polymer'),
    c(0.63, 1, 0.05, 0.012),
    b(0.13, 0.21, -0.17, 0, 'metal', 8),
    b(0.42, 0.48, -0.15, 0, 'polymer', -10),
    b(0.4, 0.6, -0.02, 0.0, 'polymer'),
  ],
  battle: [
    b(0, 0.27, -0.035, 0.07, 'wood', -3),
    b(0.26, 0.55, 0, 0.085, 'metal'),
    b(0.55, 0.8, 0.012, 0.075, 'wood'),
    c(0.8, 1, 0.045, 0.011),
    b(0.92, 0.94, 0.055, 0.1, 'metal'),
    b(0.33, 0.38, -0.12, 0, 'wood', -16),
    b(0.45, 0.52, -0.13, 0, 'metal', 4),
  ],
  classic: [
    b(0, 0.3, -0.05, 0.06, 'wood', -4),
    b(0.28, 0.76, -0.005, 0.06, 'wood'),
    b(0.32, 0.47, 0.06, 0.085, 'metal'),
    b(0.47, 0.76, 0.06, 0.075, 'wood'),
    c(0.76, 1, 0.045, 0.01),
    b(0.95, 0.965, 0.055, 0.085, 'metal'),
    b(0.36, 0.42, -0.04, 0, 'metal'),
  ],
  sniper: [
    b(0, 0.27, -0.05, 0.07, 'polymer', -2),
    b(0.26, 0.5, 0, 0.08, 'metal'),
    b(0.5, 0.7, 0.01, 0.07, 'polymer'),
    c(0.5, 1, 0.045, 0.013),
    c(0.27, 0.52, 0.14, 0.026),
    b(0.32, 0.34, 0.08, 0.12, 'metal'),
    b(0.45, 0.47, 0.08, 0.12, 'metal'),
    b(0.3, 0.35, -0.12, 0, 'polymer', -16),
    b(0.38, 0.44, -0.08, 0, 'metal'),
    b(0.67, 0.68, -0.2, 0.01, 'metal', 18),
  ],
  smg: [
    b(0, 0.3, 0.02, 0.05, 'metal'),
    b(0, 0.03, -0.06, 0.05, 'metal'),
    b(0.28, 0.76, 0, 0.13, 'metal'),
    c(0.76, 1, 0.07, 0.022),
    b(0.42, 0.5, -0.22, 0, 'polymer', -12),
    b(0.58, 0.66, -0.32, 0, 'metal', 6),
    b(0.86, 0.88, 0.09, 0.15, 'metal'),
  ],
  mg: [
    b(0, 0.2, -0.04, 0.07, 'polymer', -3),
    b(0.19, 0.5, -0.02, 0.1, 'metal'),
    b(0.27, 0.42, 0.1, 0.13, 'metal'),
    c(0.5, 0.76, 0.05, 0.026),
    c(0.76, 1, 0.05, 0.012),
    b(0.3, 0.36, -0.14, -0.02, 'polymer', -14),
    b(0.38, 0.48, -0.15, -0.02, 'metal'),
    b(0.71, 0.72, -0.2, 0.03, 'metal', 22),
    b(0.73, 0.74, -0.2, 0.03, 'metal', -22),
  ],
  shotgun: [
    b(0, 0.3, -0.05, 0.05, 'wood', -5),
    b(0.29, 0.47, -0.02, 0.07, 'metal'),
    c(0.47, 1, 0.052, 0.012),
    c(0.47, 0.88, 0.022, 0.011),
    b(0.55, 0.72, -0.004, 0.044, 'wood'),
    b(0.33, 0.4, -0.06, -0.02, 'metal'),
  ],
  lever: [
    b(0, 0.3, -0.05, 0.05, 'wood', -5),
    b(0.29, 0.44, -0.02, 0.065, 'metal'),
    b(0.3, 0.42, -0.08, -0.02, 'metal'),
    b(0.44, 0.62, -0.005, 0.04, 'wood'),
    c(0.44, 1, 0.045, 0.011),
    c(0.62, 0.95, 0.018, 0.01),
  ],
  pistol: [
    b(0, 1, 0.34, 0.6, 'metal'),
    b(0.02, 0.78, 0.22, 0.36, 'polymer'),
    b(0.05, 0.33, -0.4, 0.3, 'polymer', -12),
    b(0.33, 0.52, 0.12, 0.16, 'polymer'),
    b(0.5, 0.53, 0.12, 0.24, 'polymer'),
    b(0.9, 0.95, 0.6, 0.64, 'metal'),
  ],
  revolver: [
    c(0.5, 1, 0.47, 0.055),
    b(0.5, 0.98, 0.4, 0.47, 'metal'),
    c(0.32, 0.5, 0.42, 0.12),
    b(0.16, 0.56, 0.3, 0.56, 'metal'),
    b(0.0, 0.2, -0.28, 0.38, 'wood', 18),
    b(0.12, 0.18, 0.56, 0.64, 'metal', -20),
    b(0.24, 0.4, 0.2, 0.24, 'metal'),
  ],
}

const OVERRIDE: Record<string, Shape> = {
  famas: 'bullpup', 'steyr-aug': 'bullpup', l85: 'bullpup', tavor: 'bullpup', 'qbz-95': 'bullpup', 'fn-p90': 'bullpup',
  'm1-garand': 'classic', 'svt-40': 'classic', sks: 'classic', 'm14': 'battle',
  'winchester-1873': 'lever', 'winchester-1887': 'lever',
  'barrett-m82': 'sniper', 'svd-dragunov': 'sniper', 'vss-vintorez': 'sniper',
  'bar-m1918': 'mg', 'lewis-gun': 'mg', 'rpk': 'mg',
  'mauser-c96': 'pistol',
}
const BY_CATEGORY: Record<Firearm['category'], Shape> = {
  'assault-rifles': 'rifle', 'battle-rifles': 'battle', 'sniper-dmr': 'sniper', 'submachine-guns': 'smg',
  'machine-guns': 'mg', shotguns: 'shotgun', pistols: 'pistol', revolvers: 'revolver', 'historic-rifles': 'classic',
}
export const shapeFor = (f: Firearm): Shape => OVERRIDE[f.id] ?? BY_CATEGORY[f.category]

/** Profile bounds in normalised units. */
export function bounds(parts: Part[]) {
  let y0 = Infinity, y1 = -Infinity
  for (const p of parts) {
    if (p.k === 'box') { y0 = Math.min(y0, p.y0); y1 = Math.max(y1, p.y1) }
    else { y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r) }
  }
  return { x0: 0, x1: 1, y0, y1 }
}

/** Height of the placeholder silhouette in metres (for placing shadows and the scale bar). */
export function profileHeight(firearm: Firearm, lengthM: number) {
  const detailed = PROFILES[firearm.id]
  if (detailed) {
    const b = profileBounds(detailed)
    return ((b.y1 - b.y0) / (b.x1 - b.x0)) * lengthM
  }
  const bb = bounds(SHAPES[shapeFor(firearm)])
  return (bb.y1 - bb.y0) * lengthM
}

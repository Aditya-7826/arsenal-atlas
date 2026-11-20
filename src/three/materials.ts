import { Color, MeshStandardMaterial, type Texture } from 'three'
import type { Mat } from '../silhouette'

// Every colour is derived from the design tokens.
export const TOKENS = {
  bg: '#0A0A0B',
  gold: '#D4AF37',
  goldLight: '#E8C872',
  bronze: '#8C6A1F',
  text: '#F5EFE0',
  muted: '#A39E93',
}

/** ~3200K warm white, mixed from the text and gold-light tokens. */
export const WARM_LIGHT = new Color(TOKENS.text).lerp(new Color(TOKENS.goldLight), 0.45)

type MatSet = Record<Mat, MeshStandardMaterial>
let cache: MatSet | null = null
const withEnv = new Map<Texture, MatSet>()
/**
 * Shared PBR materials for placeholder silhouettes: gunmetal, polymer and wood.
 * Passing an envMap returns a separate set lit by that map only (used by the lobby,
 * whose reflective floor must not pick up the HDRI).
 */
export function placeholderMaterials(envMap?: Texture): MatSet {
  if (envMap) {
    let set = withEnv.get(envMap)
    if (!set) {
      const base = placeholderMaterials()
      set = { metal: base.metal.clone(), polymer: base.polymer.clone(), wood: base.wood.clone() }
      for (const m of Object.values(set)) {
        m.envMap = envMap
        m.envMapIntensity = 0.7
      }
      withEnv.set(envMap, set)
    }
    return set
  }
  if (cache) return cache
  cache = {
    metal: new MeshStandardMaterial({ color: new Color(TOKENS.muted).lerp(new Color(TOKENS.bg), 0.35), metalness: 0.9, roughness: 0.32 }),
    polymer: new MeshStandardMaterial({ color: new Color(TOKENS.bg).lerp(new Color(TOKENS.muted), 0.18), metalness: 0.05, roughness: 0.7 }),
    wood: new MeshStandardMaterial({ color: new Color(TOKENS.bronze).lerp(new Color(TOKENS.bg), 0.35), metalness: 0, roughness: 0.55 }),
  }
  return cache
}

/** Local CC0 HDRI from Poly Haven. */
export const HDRI = '/hdri/studio_small_09_1k.hdr'

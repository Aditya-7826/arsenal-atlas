import { useState } from 'react'
import { hasModel, type Firearm } from '../data'
import { Silhouette2D } from './Silhouette2D'

/**
 * Picture of the firearm's own 3D model (public/thumbs/<id>.webp, rendered by
 * tools/thumbs from the same GLB the viewer loads). Falls back to the flat
 * silhouette when there is no model or the image is missing.
 */
export function FirearmPreview({ firearm, className = '' }: { firearm: Firearm; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!hasModel(firearm.id) || failed) return <Silhouette2D firearm={firearm} className={className} />
  return (
    <img
      src={`/thumbs/${firearm.id}.webp`}
      alt={`3D model of the ${firearm.name}`}
      loading="lazy"
      decoding="async"
      width={960}
      height={540}
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  )
}

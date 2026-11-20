import type { CSSProperties, ElementType, ReactNode, ComponentPropsWithoutRef } from 'react'

type Props<T extends ElementType> = {
  as?: T
  children?: ReactNode
  className?: string
  /** Index for the 40ms staggered fade-and-rise. Omit to skip the animation. */
  stagger?: number
  /** Use the lighter blur that protects frame rate over the 3D canvas on mobile. */
  overCanvas?: boolean
  frame?: boolean
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

/** The one reusable frosted-glass surface used on every page. */
export function GlassPanel<T extends ElementType = 'div'>({ as, children, className = '', stagger, overCanvas, frame, style, ...rest }: Props<T>) {
  const Tag = (as ?? 'div') as ElementType
  const cls = ['glass', frame && 'glass-frame', overCanvas && 'glass-over-canvas', stagger != null && 'rise', className].filter(Boolean).join(' ')
  const s = stagger != null ? ({ ...(style as CSSProperties), '--i': stagger } as CSSProperties) : (style as CSSProperties)
  return (
    <Tag className={cls} style={s} {...rest}>
      {children}
    </Tag>
  )
}

import type { SVGProps } from 'react'

/** Thin 1.5px outline icons. They inherit currentColor (gold by default). */
const Base = ({ children, ...p }: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    {children}
  </svg>
)

export const IconCompare = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="16" rx="1.5" /><rect x="17" y="4" width="4" height="16" rx="1.5" /></Base>
)
export const IconCube = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></Base>
)
export const IconSquare = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 15l5-4 4 3 3-2 4 3" /></Base>
)
export const IconCredits = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5a3.5 3.5 0 1 0 0 5" /></Base>
)
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Base>
)
export const IconExpand = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Base>
)
export const IconShrink = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></Base>
)
export const IconReset = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 12a8 8 0 1 0 2.3-5.6" /><path d="M4 4v4h4" /></Base>
)
export const IconPlay = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M8 5v14l11-7Z" /></Base>
)
export const IconPause = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M9 5v14M15 5v14" /></Base>
)
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
)
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>
)
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Base>
)
export const IconBack = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Base>
)
export const IconHall = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M3 10 12 4l9 6" /><path d="M5 10v9M9.5 10v9M14.5 10v9M19 10v9M3 20h18" /></Base>
)

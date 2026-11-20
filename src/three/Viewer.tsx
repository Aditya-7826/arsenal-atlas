import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject, type ComponentRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Html, Line, OrbitControls, PerformanceMonitor, useProgress } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace, Vector3 } from 'three'
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>
import { displayLengthM, hasModel, type Firearm } from '../data'
import { useIsMobile, useReducedMotion } from '../hooks'
import { FirearmModel } from './FirearmModel'
import { profileHeight } from '../silhouette'
import { TOKENS, WARM_LIGHT } from './materials'
import { IconExpand, IconPause, IconPlay, IconReset, IconShrink } from '../components/Icons'

import { HDRI } from './materials'

type PresetKey = 'front34' | 'left' | 'right' | 'top'
const PRESETS: Record<PresetKey, { label: string; dir: [number, number, number] }> = {
  front34: { label: 'Front ¾', dir: [0.55, 0.32, 0.77] },
  left: { label: 'Left', dir: [0, 0.05, 1] },
  right: { label: 'Right', dir: [0, 0.05, -1] },
  top: { label: 'Top', dir: [0, 1, 0.001] },
}
const ORIGIN = new Vector3()

/** DOM overlay (outside the canvas) driven by the global three.js loading manager. */
function LoaderUI() {
  const { progress, active } = useProgress()
  if (!active) return null
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <div className="glass glass-over-canvas flex w-44 flex-col items-center gap-2 px-4 py-3" role="status" aria-live="polite">
        <span className="label">Loading model</span>
        <span className="numeral text-3xl text-text">{Math.round(progress)}%</span>
        <span className="block h-px w-full bg-bronze">
          <span className="block h-px bg-gold transition-[width]" style={{ width: `${progress}%` }} />
        </span>
      </div>
    </div>
  )
}

/** Smoothly flies the camera to a preset, then hands control back to OrbitControls. */
function CameraRig({ goalRef, controlsRef }: { goalRef: RefObject<Vector3 | null>; controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera)
  useFrame((_, dt) => {
    const c = controlsRef.current
    const goal = goalRef.current
    if (!goal || !c) return
    const k = 1 - Math.exp(-dt * 6)
    camera.position.lerp(goal, k)
    c.target.lerp(ORIGIN, k)
    c.update()
    if (camera.position.distanceTo(goal) < 0.001) goalRef.current = null
  })
  return null
}

/** Distance at which the whole firearm fits the current canvas, whatever its aspect ratio. */
function fitDistance(radius: number, fovDeg: number, aspect: number) {
  const v = (fovDeg * Math.PI) / 360
  const h = Math.atan(Math.tan(v) * aspect)
  return Math.max((radius * 1.12) / Math.sin(Math.min(v, h)), 0.3)
}

function FitCamera({ radius, distRef, dir }: { radius: number; distRef: RefObject<number>; dir: Vector3 }) {
  const { camera, size } = useThree()
  const first = useRef(true)
  useEffect(() => {
    const d = fitDistance(radius, 35, size.width / size.height)
    distRef.current = d
    if (first.current) {
      camera.position.copy(dir).normalize().multiplyScalar(d)
      first.current = false
    }
  }, [camera, size.width, size.height, radius, distRef, dir])
  return null
}

/** Overall-length reference bar with 10 cm ticks (5 cm for handguns). */
function ScaleBar({ lengthM, y, z, label }: { lengthM: number; y: number; z: number; label: string }) {
  const half = lengthM / 2
  const step = lengthM < 0.5 ? 0.05 : 0.1
  const ticks = useMemo(() => {
    const t: [number, number, number][][] = []
    for (let x = 0; x <= lengthM + 1e-6; x += step) {
      const tall = Math.abs(x % (step * 5)) < 1e-6
      t.push([[-half + x, y, z], [-half + x, y, z + (tall ? 0.03 : 0.015) * Math.max(lengthM, 0.3)]])
    }
    return t
  }, [lengthM, half, step, y, z])
  return (
    <group>
      <Line points={[[-half, y, z], [half, y, z]]} color={TOKENS.gold} lineWidth={1.5} />
      {ticks.map((p, i) => (
        <Line key={i} points={p} color={TOKENS.gold} lineWidth={1} transparent opacity={0.7} />
      ))}
      <Html position={[0, y, z + 0.06 * Math.max(lengthM, 0.3)]} center zIndexRange={[10, 0]}>
        <span className="glass glass-over-canvas whitespace-nowrap rounded-full px-3 py-1 text-xs text-text">{label}</span>
      </Html>
    </group>
  )
}

export default function Viewer({ firearm }: { firearm: Firearm }) {
  const reduced = useReducedMotion()
  const mobile = useIsMobile()
  const wrap = useRef<HTMLDivElement>(null)
  const controls = useRef<OrbitControlsImpl | null>(null)
  const goal = useRef<Vector3 | null>(null)
  const [spinPref, setSpin] = useState<boolean | null>(null)
  const spin = spinPref ?? !reduced
  const [full, setFull] = useState(false)

  const L = displayLengthM(firearm)
  const dist = useRef(Math.max(L * 1.9, 0.35))
  const [dpr, setDpr] = useState(mobile ? 1.5 : 2)
  const h = profileHeight(firearm, L)
  const groundY = -h / 2 - 0.02 * L
  const real = hasModel(firearm.id)
  const lengthLabel = firearm.lengthMm != null ? `${firearm.lengthMm} mm overall` : 'Length not verified (scale approximate)'

  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])

  const goTo = useCallback(
    (k: PresetKey) => {
      const [x, y, z] = PRESETS[k].dir
      goal.current = new Vector3(x, y, z).normalize().multiplyScalar(dist.current)
    },
    [],
  )

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void wrap.current?.requestFullscreen?.()
  }

  const onKey = (e: KeyboardEvent) => {
    const c = controls.current
    if (!c) return
    const step = 0.2
    if (e.key === 'ArrowLeft') c.setAzimuthalAngle(c.getAzimuthalAngle() - step)
    else if (e.key === 'ArrowRight') c.setAzimuthalAngle(c.getAzimuthalAngle() + step)
    else if (e.key === 'ArrowUp') c.setPolarAngle(c.getPolarAngle() - step)
    else if (e.key === 'ArrowDown') c.setPolarAngle(c.getPolarAngle() + step)
    else if (e.key === '+' || e.key === '=' || e.key === '-') {
      const cam = c.object
      const d = cam.position.length() * (e.key === '-' ? 1.15 : 0.87)
      cam.position.setLength(Math.min(Math.max(d, c.minDistance), c.maxDistance))
    } else if (e.key === '0' || e.key === 'Home') goTo('front34')
    else return
    e.preventDefault()
    c.update()
  }

  const initialDir = useMemo(() => new Vector3(...PRESETS.front34.dir), [])

  return (
    <div ref={wrap} className={`absolute inset-0 ${full ? 'bg-bg' : ''}`}>
      <div
        className="absolute inset-0"
        tabIndex={0}
        role="img"
        aria-label={`Interactive 360 degree view of the ${firearm.name}. Drag to rotate, scroll or pinch to zoom, double-click to reset. Arrow keys rotate, plus and minus zoom, 0 resets.`}
        onKeyDown={onKey}
        onDoubleClick={() => goTo('front34')}
      >
        <Canvas
          key={firearm.id}
          dpr={dpr}
          camera={{ position: initialDir.clone().multiplyScalar(Math.max(L * 1.9, 0.35)).toArray(), fov: 35, near: 0.01, far: 50 }}
          gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => (gl.toneMappingExposure = 1.05)}
        >
          <Suspense fallback={null}>
            <Environment files={HDRI} environmentIntensity={0.9} />
            <FirearmModel firearm={firearm} lengthM={L} />
            <ContactShadows position={[0, groundY, 0]} scale={L * 2.4} blur={2.4} opacity={0.65} far={h + 0.2} resolution={mobile ? 256 : 512} color={TOKENS.bg} />
            <ScaleBar lengthM={L} y={groundY + 0.001} z={0.14 * Math.max(L, 0.25)} label={lengthLabel} />
          </Suspense>
          <directionalLight position={[2, 3, 2]} intensity={1.1} color={WARM_LIGHT} />
          <directionalLight position={[-3, 1.5, -2]} intensity={0.6} color={TOKENS.goldLight} />
          <OrbitControls
            ref={controls}
            makeDefault
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            autoRotate={spin}
            autoRotateSpeed={1.2}
            minDistance={L * 0.45}
            maxDistance={Math.max(L * 4, 1.2)}
            onStart={() => (goal.current = null)}
          />
          <CameraRig goalRef={goal} controlsRef={controls} />
          <FitCamera radius={Math.hypot(L, h) / 2} distRef={dist} dir={initialDir} />
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.5 : 2)} />
        </Canvas>
      </div>

      <LoaderUI />

      {!real && (
        <span className="glass glass-over-canvas label pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1.5 text-gold-light!">
          Model coming soon
        </span>
      )}

      <div className="absolute right-3 top-3 flex gap-2">
        <button type="button" className="icon-btn glass glass-over-canvas" onClick={() => setSpin(!spin)} aria-pressed={spin} aria-label={spin ? 'Pause turntable' : 'Start turntable'} title={spin ? 'Pause turntable' : 'Start turntable'}>
          {spin ? <IconPause /> : <IconPlay />}
        </button>
        <button type="button" className="icon-btn glass glass-over-canvas" onClick={toggleFull} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'} title={full ? 'Exit fullscreen' : 'Fullscreen'}>
          {full ? <IconShrink /> : <IconExpand />}
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">
        <div className="glass glass-over-canvas flex max-w-full items-center gap-1 rounded-full p-1 scroll-x" role="toolbar" aria-label="Preset views">
          {(Object.keys(PRESETS) as PresetKey[]).map((k) => (
            <button key={k} type="button" className="rounded-full px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-gold hover:text-bg sm:text-sm" onClick={() => goTo(k)}>
              {PRESETS[k].label}
            </button>
          ))}
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-gold transition-colors hover:bg-gold hover:text-bg" onClick={() => goTo('front34')} aria-label="Reset view" title="Reset view (double-click)">
            <IconReset />
          </button>
        </div>
      </div>
    </div>
  )
}

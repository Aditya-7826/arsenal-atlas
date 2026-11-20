import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, Html, MeshReflectorMaterial, OrbitControls, PerformanceMonitor, useCursor, useEnvironment } from '@react-three/drei'
import { ACESFilmicToneMapping, BackSide, Group, Object3D, type Texture } from 'three'
import { BY_ID, CATEGORIES, displayLengthM, inCategory, type Category, type Firearm } from '../data'
import { useIsMobile, useReducedMotion } from '../hooks'
import { FirearmModel } from './FirearmModel'
import { HDRI, TOKENS, WARM_LIGHT } from './materials'

const R = 10.5
const SPREAD = (144 * Math.PI) / 180 // arc of bays, centred on the entrance axis

type Handlers = {
  onHover: (f: Firearm | null) => void
  onSelect: (f: Firearm) => void
  onCategory: (c: Category) => void
}

function Exhibit({ firearm, lengthM, x, reduced, env, ...h }: { firearm: Firearm; lengthM: number; x: number; reduced: boolean; env: Texture } & Handlers) {
  const ref = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  useCursor(hover)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const target = hover && !reduced ? g.rotation.y + dt * 0.8 : Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2
    g.rotation.y += (target - g.rotation.y) * Math.min(1, dt * 4)
    const s = hover ? 1.08 : 1
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * Math.min(1, dt * 8))
  })
  return (
    <group position={[x, 0, 0]}>
      {/* display stand */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 12]} />
        <meshStandardMaterial color={TOKENS.muted} metalness={0.9} roughness={0.3} envMap={env} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.505, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.02, 32]} />
        <meshStandardMaterial color={TOKENS.bg} metalness={0.9} roughness={0.35} envMap={env} envMapIntensity={0.6} />
      </mesh>
      <group
        ref={ref}
        position={[0, 1.32, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          h.onHover(firearm)
        }}
        onPointerOut={() => {
          setHover(false)
          h.onHover(null)
        }}
        onClick={(e) => {
          e.stopPropagation()
          h.onSelect(firearm)
        }}
      >
        <FirearmModel firearm={firearm} lengthM={lengthM} envMap={env} />
        {/* generous invisible hit area so small pieces are easy to pick */}
        <mesh visible={false}>
          <boxGeometry args={[Math.max(lengthM, 0.5), 0.5, 0.3]} />
        </mesh>
      </group>
    </group>
  )
}

function Bay({ category, angle, reduced, mobile, env, ...h }: { category: Category; angle: number; reduced: boolean; mobile: boolean; env: Texture } & Handlers) {
  const items = category.featured.map((id) => BY_ID.get(id)!).filter(Boolean)
  const maxLen = Math.max(...items.map(displayLengthM))
  const scale = Math.min(0.85 / maxLen, 2.2)
  const [target] = useState(() => new Object3D())
  const count = inCategory(category.slug).length
  return (
    <group position={[Math.sin(angle) * R, 0, -Math.cos(angle) * R]} rotation={[0, -angle, 0]}>
      {/* plinth: dark brushed metal with emissive gold edge strips */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[2.9, 0.5, 1.1]} />
        <meshStandardMaterial color={TOKENS.bg} metalness={0.85} roughness={0.42} envMap={env} envMapIntensity={0.55} />
      </mesh>
      {[0.5, 0.005].map((y) => (
        <mesh key={y} position={[0, y, 0.551]}>
          <boxGeometry args={[2.9, 0.012, 0.004]} />
          <meshStandardMaterial color={TOKENS.gold} emissive={TOKENS.gold} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      ))}
      {items.map((f, i) => (
        <Exhibit key={f.id} firearm={f} lengthM={displayLengthM(f) * scale} x={(i - 1) * 0.94} reduced={reduced} env={env} {...h} />
      ))}
      <primitive object={target} position={[0, 1, 0]} />
      <spotLight position={[0, 4.6, 1.6]} target={target} angle={0.55} penumbra={0.85} intensity={mobile ? 40 : 55} decay={2} color={WARM_LIGHT} />
      <Html position={[0, 2.1, 0]} center zIndexRange={[20, 0]}>
        <button
          type="button"
          tabIndex={-1}
          title={category.name}
          onClick={() => h.onCategory(category)}
          className="glass glass-over-canvas flex items-baseline gap-1.5 whitespace-nowrap rounded-full px-3 py-1 transition-colors hover:border-gold-light"
        >
          <span className="font-display text-[0.7rem] text-text md:text-xs">{category.short.toUpperCase()}</span>
          <span className="text-[0.65rem] text-muted">{count}</span>
        </button>
      </Html>
    </group>
  )
}

function Hall({ mobile }: { mobile: boolean }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        {mobile ? (
          <meshStandardMaterial color={TOKENS.bg} metalness={0.3} roughness={0.25} />
        ) : (
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={512}
            mixBlur={1}
            mixStrength={6}
            roughness={0.2}
           
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color={TOKENS.bg}
            metalness={0.3}
            mirror={0.4}
          />
        )}
      </mesh>
      <Grid position={[0, 0.01, 0]} args={[60, 60]} cellSize={1} cellThickness={0.5} cellColor={TOKENS.bronze} sectionSize={4} sectionThickness={0.7} sectionColor={TOKENS.gold} fadeDistance={22} fadeStrength={2} infiniteGrid />
      {/* curved back wall with a faint gold band */}
      <mesh position={[0, 4, 0]}>
        <cylinderGeometry args={[14.5, 14.5, 8, 64, 1, true]} />
        <meshStandardMaterial color={TOKENS.bg} side={BackSide} metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <cylinderGeometry args={[14.45, 14.45, 0.02, 64, 1, true]} />
        <meshStandardMaterial color={TOKENS.gold} emissive={TOKENS.gold} emissiveIntensity={1.2} side={BackSide} toneMapped={false} />
      </mesh>
    </>
  )
}

function Bays({ mobile, reduced, n, ...h }: { mobile: boolean; reduced: boolean; n: number } & Handlers) {
  // HDRI applied per material (not as scene.environment) so the black floor stays black
  const env = useEnvironment({ files: HDRI })
  return (
    <>
      {CATEGORIES.map((c, i) => (
        <Bay key={c.slug} category={c} angle={-SPREAD / 2 + (SPREAD * i) / (n - 1)} reduced={reduced} mobile={mobile} env={env} {...h} />
      ))}
    </>
  )
}

function ResponsiveCamera() {
  const { camera, size } = useThree()
  const aspect = size.width / size.height
  useEffect(() => {
    const z = aspect < 0.8 ? 15 : aspect < 1.3 ? 12 : 9
    camera.position.set(0, aspect < 0.8 ? 4.4 : 3.2, z)
  }, [camera, aspect])
  return null
}

export default function LobbyScene(h: Handlers) {
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const n = CATEGORIES.length
  const [dpr, setDpr] = useState(mobile ? 1.5 : 2)
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 3.4, 8.5], fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: 'high-performance' }}
      onPointerMissed={() => h.onHover(null)}
    >
      <color attach="background" args={[TOKENS.bg]} />
      <fog attach="fog" args={[TOKENS.bg, 11, 30]} />
      <ambientLight intensity={0.35} color={WARM_LIGHT} />
      <hemisphereLight args={[WARM_LIGHT, TOKENS.bg, 0.5]} />
      <ResponsiveCamera />
      <Suspense fallback={null}>
        <Hall mobile={mobile} />
        <Bays mobile={mobile} reduced={reduced} n={n} {...h} />
      </Suspense>
      <OrbitControls
        makeDefault
        target={[0, 1.1, -5]}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={19}
        minPolarAngle={0.9}
        maxPolarAngle={1.45}
        minAzimuthAngle={-1.1}
        maxAzimuthAngle={1.1}
      />
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(mobile ? 1.5 : 2)} />
    </Canvas>
  )
}

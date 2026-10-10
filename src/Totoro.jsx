import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// A big friendly Totoro plush built from primitives: gray egg body, cream belly with chevrons,
// pointy ears, round eyes, whiskers and a leaf on his head. Faces +z, feet at y = 0.

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CONE = new THREE.ConeGeometry(1, 1, 16)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const B = ({ g = SPH, c, p, s, r = [0, 0, 0] }) => <mesh geometry={g} material={m(c)} position={p} scale={s} rotation={r} />

const GRAY = '#7e8189'
const CREAM = '#efe5cc'
const DARK = '#2a2b30'

export default function Totoro({ position = [0, 0, 0], rotation = 0, height = 0.8, phase = 0 }) {
  const body = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    body.current.rotation.z = Math.sin(t * 1.1) * 0.05 // happy sway
    body.current.scale.y = 1 + Math.sin(t * 2.2) * 0.015 // breathing
  })
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={height}>
      <group ref={body}>
        {/* body + belly */}
        <B c={GRAY} p={[0, 0.45, 0]} s={[0.36, 0.45, 0.32]} />
        <B c={CREAM} p={[0, 0.38, 0.13]} s={[0.29, 0.32, 0.21]} />
        {/* belly chevrons */}
        {[
          [-0.1, 0.55],
          [0, 0.57],
          [0.1, 0.55],
          [-0.05, 0.47],
          [0.05, 0.47],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.33 - Math.abs(x) * 0.25]}>
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c={GRAY} p={[0.012 * sx, 0, 0]} r={[0, 0, 0.6 * sx]} s={[0.035, 0.008, 0.01]} />
            ))}
          </group>
        ))}
        {/* ears */}
        {[-1, 1].map((sx) => (
          <B key={sx} g={CONE} c={GRAY} p={[0.14 * sx, 0.93, -0.02]} r={[0, 0, -0.12 * sx]} s={[0.055, 0.2, 0.045]} />
        ))}
        {/* eyes, nose, whiskers */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c="#ffffff" p={[0.12 * sx, 0.74, 0.25]} s={[0.055, 0.055, 0.03]} />
            <B c={DARK} p={[0.12 * sx, 0.74, 0.278]} s={[0.026, 0.026, 0.01]} />
            {[0, 1, 2].map((i) => (
              <B key={i} g={BOX} c={DARK} p={[0.24 * sx, 0.7 - i * 0.03, 0.2]} r={[0, -0.5 * sx, (i - 1) * 0.15 * sx]} s={[0.12, 0.005, 0.005]} />
            ))}
          </group>
        ))}
        <B c={DARK} p={[0, 0.72, 0.29]} s={[0.035, 0.014, 0.015]} />
        {/* stubby arms + feet with little claws */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B c={GRAY} p={[0.33 * sx, 0.42, 0.05]} r={[0, 0, 0.3 * sx]} s={[0.07, 0.17, 0.07]} />
            <B c={GRAY} p={[0.13 * sx, 0.03, 0.1]} s={[0.1, 0.04, 0.13]} />
            {[-1, 0, 1].map((k) => (
              <B key={k} c={CREAM} p={[0.13 * sx + k * 0.03, 0.04, 0.22]} s={[0.012, 0.012, 0.02]} />
            ))}
          </group>
        ))}
        {/* the leaf on his head */}
        <B c="#4f9a3c" p={[0, 0.93, 0.02]} r={[0.2, 0, 0.4]} s={[0.09, 0.012, 0.05]} />
        <B g={BOX} c="#3b7a2c" p={[-0.03, 0.91, 0.02]} r={[0, 0, 0.9]} s={[0.006, 0.05, 0.006]} />
      </group>
    </group>
  )
}

import { useRef } from 'react'
import * as THREE from 'three'
import Totoro from './Totoro.jsx'
import useTalker, { hitMaterial } from './useTalker.js'

// Prof. Peter Schott: SoCal-sunny guy in a light-blue open-collar oxford, khaki chinos and
// brown shoes, wavy brown hair, with his buddy Totoro standing next to him.
// Same conventions as Zaman.jsx: faces +z, his own right hand is at -x.

const C = {
  skin: '#e4b996',
  shade: '#d3a283', // light stubble
  hair: '#5a3a22',
  hairHi: '#6e4a2c',
  shirt: '#bcd0ee',
  shirtDark: '#a6bde0',
  chinos: '#c4ad80',
  belt: '#4a2f1d',
  shoes: '#5a3820',
  eyes: '#5f7688',
}

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const SMILE = new THREE.TorusGeometry(1, 0.22, 6, 16, Math.PI)
const TORSO = new THREE.CylinderGeometry(0.205, 0.185, 0.56, 24) // stops under the shoulders so the collar stays open

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

// wavy, swept-back brown hair: a cap plus a ring of soft waves
const WAVES = Array.from({ length: 11 }, (_, i) => {
  const a = -0.5 + (i / 10) * (Math.PI + 1) // front-left over the top to front-right, back side covered
  return [Math.cos(a) * 0.1, 1.79 + Math.sin(i * 1.7) * 0.012, -Math.sin(a) * 0.07 - 0.01]
})

export default function Schott({ position = [0, 0, 0], rotation = 0, room }) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const hitbox = useRef()
  const s = 1.83 / 1.8

  useTalker('peter-schott', { position, rotation, room }, { root, head, hitbox }, (t, chatting) => {
    // upbeat: little laughing bounce and big explaining hands while you chat
    root.current.position.y = chatting ? Math.max(0, Math.sin(t * 5)) * 0.015 : 0
    head.current.rotation.z = Math.sin(t * (chatting ? 1.8 : 0.7)) * 0.05
    const g = chatting ? 1 : 0.2
    armR.current.rotation.x = -0.1 - g * (0.7 + Math.max(0, Math.sin(t * 2.4)) * 0.7)
    armR.current.rotation.z = -0.15 - g * 0.25
    armL.current.rotation.x = -0.1 - g * (0.5 + Math.max(0, Math.sin(t * 1.9 + 2)) * 0.5)
    armL.current.rotation.z = 0.15 + g * 0.3
  })

  // Totoro stands at his left, facing the class (doesn't spin with him)
  const tx = 0.85 * Math.cos(rotation) + 0.15 * Math.sin(rotation)
  const tz = -0.85 * Math.sin(rotation) + 0.15 * Math.cos(rotation)

  return (
    <group position={position}>
      <mesh ref={hitbox} geometry={CYL} material={hitMaterial} position={[0, 0.95, 0]} scale={[0.42, 1.9, 0.42]} />
      <Totoro position={[tx, 0, tz]} rotation={rotation} height={0.85} />
      <group ref={root} rotation={[0, rotation, 0]}>
        <group scale={s}>
          {/* brown leather shoes */}
          {[-1, 1].map((sx) => (
            <group key={sx} position={[0.095 * sx, 0, 0.03]}>
              <B c={C.shoes} p={[0, 0.045, 0.03]} s={[0.06, 0.045, 0.14]} o={{ roughness: 0.45 }} />
              <B g={BOX} c="#2e1d12" p={[0, 0.01, 0.03]} s={[0.115, 0.02, 0.27]} />
            </group>
          ))}
          {/* khaki chinos + brown belt */}
          {[-1, 1].map((sx) => (
            <B key={sx} g={CYL} c={C.chinos} p={[0.095 * sx, 0.5, 0]} s={[0.077, 0.82, 0.077]} />
          ))}
          <B g={CYL} c={C.chinos} p={[0, 0.88, 0]} s={[0.188, 0.09, 0.15]} />
          <B g={CYL} c={C.belt} p={[0, 0.925, 0]} s={[0.19, 0.035, 0.152]} />
          <B g={BOX} c="#b8b8bf" p={[0, 0.925, 0.152]} s={[0.04, 0.03, 0.01]} o={{ metalness: 0.8, roughness: 0.3 }} />
          {/* light-blue oxford, tucked in, open collar */}
          <mesh geometry={TORSO} material={m(C.shirt)} position={[0, 1.2, 0]} />
          <B c={C.shirt} p={[0, 1.46, 0]} s={[0.26, 0.065, 0.17]} />
          <B g={BOX} c={C.shirtDark} p={[0, 1.18, 0.197]} s={[0.022, 0.5, 0.006]} />
          {[1.02, 1.12, 1.22, 1.32].map((y) => (
            <B key={y} c="#eef2fa" p={[0, y, 0.203]} s={[0.008, 0.008, 0.004]} />
          ))}
          {/* breast pocket on his left */}
          <B g={BOX} c={C.shirtDark} p={[0.1, 1.33, 0.19]} r={[0, 0.25, 0]} s={[0.07, 0.075, 0.006]} />
          {/* open collar: V of skin and two collar wings */}
          <B g={BOX} c={C.skin} p={[0, 1.465, 0.172]} r={[0.25, 0, Math.PI / 4]} s={[0.07, 0.07, 0.01]} />
          {[-1, 1].map((sx) => (
            <B key={sx} g={BOX} c="#d3e0f4" p={[0.06 * sx, 1.5, 0.15]} r={[0.45, 0.3 * sx, -0.6 * sx]} s={[0.075, 0.04, 0.012]} />
          ))}
          {/* arms in long sleeves with cuffs */}
          {[
            [armR, -1],
            [armL, 1],
          ].map(([ref, sx]) => (
            <group key={sx} ref={ref} position={[0.25 * sx, 1.45, 0]}>
              <mesh geometry={CAP} material={m(C.shirt)} position={[0, -0.24, 0]} scale={[0.064, 0.2, 0.064]} />
              <B g={CYL} c={C.shirtDark} p={[0, -0.43, 0]} s={[0.058, 0.04, 0.058]} />
              <B c={C.skin} p={[0, -0.5, 0.01]} s={[0.044, 0.055, 0.04]} />
            </group>
          ))}
          {/* neck + head */}
          <B g={CYL} c={C.skin} p={[0, 1.57, 0]} s={[0.052, 0.08, 0.052]} />
          <group ref={head} position={[0, 1.6, 0]}>
            <group position={[0, -1.6, 0]}>
              <B c={C.skin} p={[0, 1.7, 0]} s={[0.115, 0.14, 0.125]} />
              {/* strong jaw with light stubble */}
              <B c={C.shade} p={[0, 1.635, 0.03]} s={[0.1, 0.06, 0.095]} />
              {[-1, 1].map((sx) => (
                <B key={sx} c={C.skin} p={[0.118 * sx, 1.7, 0]} s={[0.02, 0.034, 0.02]} />
              ))}
              {/* wavy brown hair */}
              <B c={C.hair} p={[0, 1.77, -0.015]} s={[0.122, 0.085, 0.128]} />
              <B c={C.hair} p={[0, 1.72, -0.06]} s={[0.118, 0.09, 0.09]} />
              {WAVES.map((p, i) => (
                <B key={i} c={i % 2 ? C.hairHi : C.hair} p={p} s={[0.05, 0.035, 0.05]} />
              ))}
              <B c={C.hairHi} p={[0.03, 1.815, 0.06]} r={[0.5, 0, -0.3]} s={[0.07, 0.03, 0.05]} />
              {/* blue-gray eyes, brows, nose */}
              {[-1, 1].map((sx) => (
                <group key={sx}>
                  <B c="#ffffff" p={[0.044 * sx, 1.72, 0.108]} s={[0.021, 0.015, 0.012]} />
                  <B c={C.eyes} p={[0.044 * sx, 1.72, 0.117]} s={[0.011, 0.011, 0.008]} />
                  <B g={BOX} c={C.hair} p={[0.046 * sx, 1.748, 0.113]} r={[0, 0, -0.08 * sx]} s={[0.044, 0.011, 0.01]} />
                </group>
              ))}
              <B c="#d6a585" p={[0, 1.69, 0.126]} s={[0.02, 0.03, 0.022]} />
              {/* big friendly grin */}
              <B g={SMILE} c="#8a3e36" p={[0, 1.655, 0.113]} r={[0, 0, Math.PI]} s={[0.038, 0.022, 0.02]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

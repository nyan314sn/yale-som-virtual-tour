import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import Labubu from './Labubu.jsx'
import useTalker, { hitMaterial } from './useTalker.js'

// Prof. Tauhid Zaman: black-and-pink hoodie fit, joggers, pink kicks, glasses, headphones
// around the neck and a Labubu clipped to his belt loop. Built from primitives like the
// wizards in Professor.jsx: faces +z, his own right hand is at -x.
// He turns to face you when you walk up or while you're chatting, and you can click him.

const C = {
  skin: '#c69068',
  hair: '#141012',
  hoodie: '#121215',
  pink: '#ff4fa3',
  pinkSoft: '#ffd6ea',
  pants: '#1b1b20',
  sole: '#f4f4f6',
}

const mats = new Map()
const m = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }))
  return mats.get(k)
}
const SPH = new THREE.SphereGeometry(1, 24, 16)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 20)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CAP = new THREE.CapsuleGeometry(1, 1, 6, 12)
const RING = new THREE.TorusGeometry(1, 0.12, 8, 28)
const SMILE = new THREE.TorusGeometry(1, 0.22, 6, 16, Math.PI)
const TORSO = new THREE.CylinderGeometry(0.205, 0.19, 0.64, 24)

const B = ({ g = SPH, c, p, s, r = [0, 0, 0], o }) => <mesh geometry={g} material={m(c, o)} position={p} scale={s} rotation={r} />

function chestTex() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = C.hoodie
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = C.pink
  g.font = 'bold 74px system-ui, sans-serif'
  g.textAlign = 'center'
  g.fillText('AI', 128, 82)
  g.font = 'bold 20px system-ui, sans-serif'
  g.fillStyle = C.pinkSoft
  g.fillText('YO · SOM · 409', 128, 114)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function Zaman({ position = [0, 0, 0], rotation = 0, room }) {
  const root = useRef()
  const head = useRef()
  const armR = useRef()
  const armL = useRef()
  const charm = useRef()
  const hitbox = useRef()
  const chest = useMemo(() => new THREE.MeshBasicMaterial({ map: chestTex() }), [])

  useTalker('tauhid-zaman', { position, rotation, room }, { root, head, hitbox }, (t, chatting) => {
    head.current.rotation.z = Math.sin(t * (chatting ? 2.2 : 0.9)) * 0.04 // vibing
    // arms: explaining with his hands while chatting, relaxed otherwise
    const g = chatting ? 1 : 0.25
    armR.current.rotation.x = -0.15 - g * (0.5 + Math.max(0, Math.sin(t * 2.1)) * 0.6)
    armR.current.rotation.z = -0.18 - g * 0.2
    armL.current.rotation.x = -0.1 - g * (0.35 + Math.max(0, Math.sin(t * 1.7 + 1.3)) * 0.45)
    armL.current.rotation.z = 0.18 + g * 0.15
    // the Labubu swings on its chain
    charm.current.rotation.z = Math.sin(t * 3.1) * 0.25
    charm.current.rotation.x = Math.sin(t * 2.3 + 0.7) * 0.18
  })

  return (
    <group position={position}>
      {/* invisible click target */}
      <mesh ref={hitbox} geometry={CYL} material={hitMaterial} position={[0, 0.95, 0]} scale={[0.42, 1.9, 0.42]} />
      <group ref={root} rotation={[0, rotation, 0]}>
        {/* pink kicks */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[0.095 * sx, 0, 0.03]}>
            <B g={BOX} c={C.sole} p={[0, 0.025, 0.02]} s={[0.11, 0.05, 0.27]} />
            <B c={C.pink} p={[0, 0.075, 0.01]} s={[0.065, 0.055, 0.13]} />
            <B g={BOX} c={C.sole} p={[0.056 * sx, 0.07, 0]} s={[0.006, 0.03, 0.09]} />
          </group>
        ))}
        {/* joggers with pink side stripe */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={CYL} c={C.pants} p={[0.095 * sx, 0.5, 0]} s={[0.078, 0.8, 0.078]} />
            <B g={CYL} c={C.pink} p={[0.095 * sx, 0.13, 0]} s={[0.07, 0.05, 0.07]} />
            <B g={BOX} c={C.pink} p={[0.172 * sx, 0.52, 0]} s={[0.006, 0.66, 0.025]} />
          </group>
        ))}
        <B g={CYL} c={C.pants} p={[0, 0.88, 0]} s={[0.19, 0.08, 0.15]} />
        {/* Labubu keychain on his right belt loop */}
        <group position={[-0.17, 0.9, 0.09]}>
          <B g={RING} c="#c9c9d1" o={{ metalness: 0.9, roughness: 0.25 }} s={[0.018, 0.018, 0.018]} r={[0, Math.PI / 2, 0]} />
          <group ref={charm}>
            <B g={CYL} c="#c9c9d1" o={{ metalness: 0.9, roughness: 0.25 }} p={[0, -0.04, 0]} s={[0.004, 0.07, 0.004]} />
            <Labubu position={[0, -0.24, 0]} height={0.17} fur="#ff8fc7" expression="mischief" />
          </group>
        </group>
        {/* hoodie: body, kangaroo pocket, pink drawstrings, chest print, hood down */}
        <mesh geometry={TORSO} material={m(C.hoodie)} position={[0, 1.2, 0]} />
        <B g={CYL} c={C.pink} p={[0, 0.9, 0]} s={[0.193, 0.04, 0.193]} />
        <B g={BOX} c="#1c1c21" p={[0, 1.0, 0.185]} s={[0.22, 0.12, 0.02]} />
        <B g={BOX} c={C.pink} p={[0, 1.062, 0.196]} s={[0.22, 0.008, 0.004]} />
        <mesh material={chest} position={[0, 1.27, 0.2]} rotation={[-0.05, 0, 0]}>
          <planeGeometry args={[0.24, 0.12]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <B g={CYL} c={C.pink} p={[0.035 * sx, 1.4, 0.19]} r={[0.12, 0, 0]} s={[0.006, 0.14, 0.006]} />
            <B c={C.pinkSoft} p={[0.035 * sx, 1.325, 0.2]} s={[0.012, 0.016, 0.012]} />
          </group>
        ))}
        <B c={C.hoodie} p={[0, 1.47, 0]} s={[0.26, 0.09, 0.17]} />
        <B c={C.hoodie} p={[0, 1.52, -0.11]} s={[0.17, 0.1, 0.09]} />
        <B c={C.pink} p={[0, 1.535, -0.09]} s={[0.13, 0.07, 0.06]} />
        {/* pink headphones resting on his neck */}
        <B g={RING} c={C.pink} p={[0, 1.53, 0.01]} r={[Math.PI / 2, 0, 0]} s={[0.115, 0.115, 0.08]} />
        {[-1, 1].map((sx) => (
          <B key={sx} g={CYL} c="#1a1a1e" p={[0.11 * sx, 1.52, 0.05]} r={[0, 0, Math.PI / 2]} s={[0.05, 0.03, 0.05]} />
        ))}
        {/* arms in hoodie sleeves with pink cuffs */}
        {[
          [armR, -1],
          [armL, 1],
        ].map(([ref, sx]) => (
          <group key={sx} ref={ref} position={[0.25 * sx, 1.45, 0]}>
            <mesh geometry={CAP} material={m(C.hoodie)} position={[0, -0.24, 0]} scale={[0.066, 0.2, 0.066]} />
            <B g={CYL} c={C.pink} p={[0, -0.44, 0]} s={[0.062, 0.04, 0.062]} />
            <B c={C.skin} p={[0, -0.5, 0.01]} s={[0.044, 0.055, 0.04]} />
          </group>
        ))}
        {/* neck + head */}
        <B g={CYL} c={C.skin} p={[0, 1.57, 0]} s={[0.05, 0.08, 0.05]} />
        <group ref={head} position={[0, 1.6, 0]}>
          <group position={[0, -1.6, 0]}>
            <B c={C.skin} p={[0, 1.7, 0]} s={[0.115, 0.135, 0.125]} />
            {[-1, 1].map((sx) => (
              <B key={sx} c={C.skin} p={[0.118 * sx, 1.7, 0]} s={[0.02, 0.034, 0.02]} />
            ))}
            {/* short black hair, a little volume on top */}
            <B c={C.hair} p={[0, 1.765, -0.012]} s={[0.122, 0.09, 0.128]} />
            <B c={C.hair} p={[0, 1.8, 0.03]} r={[0.35, 0, 0]} s={[0.1, 0.05, 0.08]} />
            {[-1, 1].map((sx) => (
              <B key={sx} c={C.hair} p={[0.1 * sx, 1.72, -0.03]} s={[0.035, 0.06, 0.09]} />
            ))}
            {/* eyes, brows, nose */}
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <B c="#ffffff" p={[0.044 * sx, 1.72, 0.108]} s={[0.021, 0.017, 0.012]} />
                <B c="#1b1210" p={[0.044 * sx, 1.72, 0.118]} s={[0.011, 0.012, 0.008]} />
                <B g={BOX} c={C.hair} p={[0.046 * sx, 1.752, 0.113]} r={[0, 0, -0.12 * sx]} s={[0.042, 0.011, 0.01]} />
              </group>
            ))}
            <B c="#b57d58" p={[0, 1.69, 0.125]} s={[0.02, 0.028, 0.022]} />
            {/* nerd glasses: black frames, pink bridge */}
            {[-1, 1].map((sx) => (
              <B key={sx} g={RING} c="#0b0b0d" p={[0.045 * sx, 1.72, 0.122]} s={[0.033, 0.028, 0.03]} />
            ))}
            <B g={BOX} c={C.pink} p={[0, 1.722, 0.126]} s={[0.025, 0.006, 0.006]} />
            {[-1, 1].map((sx) => (
              <B key={sx} g={BOX} c="#0b0b0d" p={[0.09 * sx, 1.725, 0.06]} s={[0.006, 0.006, 0.11]} />
            ))}
            {/* big grin */}
            <B g={SMILE} c="#6b2f2a" p={[0, 1.66, 0.112]} r={[0, 0, Math.PI]} s={[0.035, 0.022, 0.02]} />
          </group>
        </group>
      </group>
    </group>
  )
}

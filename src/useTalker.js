import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { talk } from './talk.js'

// Shared behavior for professors you can chat with (Zaman.jsx, Schott.jsx):
//  - turns to face you when you walk up inside their room, or while you chat
//  - head tilts toward your eye height
//  - crosshair on their hitbox from inside the room marks them as the one to click
// `animate(t, chatting)` runs each frame for avatar-specific motion (arms, props).

const TALK_RANGE = 6 // meters: crosshair on them within this distance lets you click to talk
const NOTICE_RANGE = 4.5 // they turn toward you when you're this close

// shortest signed angle from a to b
const turn = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

// inside the classroom drum and behind its flat front wall (so nobody talks through a wall)
const inRoom = (x, z, d) =>
  ((x - d.c[0]) / d.rx) ** 2 + ((z - d.c[1]) / d.rz) ** 2 < 1 && (x - d.front.fc[0]) * d.front.back[0] + (z - d.front.fc[1]) * d.front.back[1] > 0

export const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

export default function useTalker(id, { position, rotation, room }, { root, head, hitbox }, animate) {
  const { camera } = useThree()
  const yaw = useRef(rotation)
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const center = useMemo(() => new THREE.Vector2(0, 0), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const dx = camera.position.x - position[0]
    const dz = camera.position.z - position[2]
    const dist = Math.hypot(dx, dz)
    const chatting = talk.get().talking === id
    const here = inRoom(camera.position.x, camera.position.z, room)
    const notice = chatting || (here && dist < NOTICE_RANGE)

    // face the player while chatting or when they walk up; otherwise scan the class
    const target = notice ? Math.atan2(dx, dz) : rotation + Math.sin(t * 0.4) * 0.35
    yaw.current += turn(yaw.current, target) * Math.min(1, dt * (chatting ? 6 : 3))
    root.current.rotation.y = yaw.current

    const tilt = notice ? -Math.atan2(camera.position.y - (position[1] + 1.7), Math.max(dist, 0.5)) : 0
    head.current.rotation.x += (THREE.MathUtils.clamp(tilt, -0.35, 0.35) - head.current.rotation.x) * Math.min(1, dt * 5)

    animate?.(t, chatting)

    if (!chatting) {
      ray.setFromCamera(center, camera)
      const hit = ray.intersectObject(hitbox.current, false)[0]
      const aimed = here && !!hit && hit.distance < TALK_RANGE
      const cur = talk.get().aimed
      if (aimed && cur !== id) talk.set({ aimed: id })
      else if (!aimed && cur === id) talk.set({ aimed: null })
    }
  })
}

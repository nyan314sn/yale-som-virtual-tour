import { useSyncExternalStore } from 'react'

// Shared state between the 3D scene and the chat UI:
//   aimed   professor id under the crosshair (close enough to talk), or null
//   talking professor id whose chat window is open, or null
let state = { aimed: null, talking: null }
const subs = new Set()

export const talk = {
  get: () => state,
  set(patch) {
    const next = { ...state, ...patch }
    if (next.aimed === state.aimed && next.talking === state.talking) return
    state = next
    subs.forEach((f) => f())
  },
  subscribe(f) {
    subs.add(f)
    return () => subs.delete(f)
  },
}

export const useTalk = () => useSyncExternalStore(talk.subscribe, talk.get)

// Talkable professors: backend id + what the UI shows.
export const TALKERS = {
  'tauhid-zaman': { name: 'Prof. Tauhid Zaman', course: 'MGT 409 · AI Foundations for Managers', greeting: "Yo! Welcome to Evans 2200. Ask me anything: AI agents, stats, regression, the central limit theorem, or what other classes are running. What's good?" },
  'peter-schott': { name: 'Prof. Peter Schott', course: 'MGT 407 · Statistics (EMBA)', greeting: "Hey hey, welcome to 2210! Totoro and I were just arguing about confidence intervals. Want to talk stats, trade with China, or tackle a nice long problem together? And tell me how I'm doing, I love feedback!" },
}

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function askProfessor(professorId, sessionId, message) {
  let res
  try {
    res = await fetch(`${API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ professor_id: professorId, session_id: sessionId, message }),
    })
  } catch {
    throw new Error("Can't reach the professor backend. Is it running on port 8000?")
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || (res.status === 404 ? 'The professor backend is not running.' : `Request failed (${res.status}).`))
  }
  return (await res.json()).reply
}

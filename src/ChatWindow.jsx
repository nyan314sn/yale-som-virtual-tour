import { useEffect, useRef, useState } from 'react'
import { TALKERS, askProfessor } from './talk.js'

const newSession = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

// One conversation per professor, kept while the page is open so walking away and back resumes it.
const convos = {}

export default function ChatWindow({ professorId, onClose }) {
  const who = TALKERS[professorId]
  const convo = (convos[professorId] ||= { session: newSession(), messages: [{ role: 'prof', text: who.greeting }] })
  const [messages, setMessages] = useState(convo.messages)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef()
  const log = useRef()

  useEffect(() => {
    convo.messages = messages
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, convo])
  useEffect(() => input.current?.focus(), [busy])
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  async function send(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || busy) return
    setDraft('')
    setError('')
    setMessages((m) => [...m, { role: 'me', text }])
    setBusy(true)
    try {
      const reply = await askProfessor(professorId, convo.session, text)
      setMessages((m) => [...m, { role: 'prof', text: reply }])
    } catch (err) {
      setError(err.message)
      setDraft(text)
      setMessages((m) => m.slice(0, -1))
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    convo.session = newSession()
    setMessages([{ role: 'prof', text: who.greeting }])
    setError('')
  }

  return (
    <div className="chat" role="dialog" aria-label={`Chat with ${who.name}`}>
      <header className="chat-head">
        <div>
          <div className="kicker">{who.course}</div>
          <h2>{who.name}</h2>
        </div>
        <div className="chat-actions">
          <button type="button" onClick={restart} title="Start a new conversation">
            New chat
          </button>
          <button type="button" className="chat-close" onClick={onClose} aria-label="Close chat and keep walking">
            ✕
          </button>
        </div>
      </header>
      <div className="chat-log" ref={log} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="bubble prof typing" aria-label={`${who.name} is typing`}>
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {error && (
        <div className="chat-error" role="alert">
          {error}
        </div>
      )}
      <form className="chat-input" onSubmit={send}>
        <label htmlFor="chat-msg" className="sr-only">
          Message {who.name}
        </label>
        <input
          id="chat-msg"
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about AI, stats, regression, other classes…"
          maxLength={2000}
          autoComplete="off"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
      <div className="chat-foot">AI avatar, not the real professor · Esc to close</div>
    </div>
  )
}

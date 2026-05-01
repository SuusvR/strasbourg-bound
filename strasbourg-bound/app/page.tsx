'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  async function join() {
    if (!name.trim() || !code.trim()) return
    setError('')
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), roomCode: code.trim().toUpperCase() }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    localStorage.setItem('sb_player_name', name.trim())
    localStorage.setItem('sb_room_code', code.trim().toUpperCase())
    router.push(`/player`)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'radial-gradient(ellipse at 50% 0%, #2d1f6e 0%, var(--bg) 60%)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🛤️</div>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem,8vw,3.5rem)', fontWeight: 900, color: 'var(--accent)', letterSpacing: -1, lineHeight: 1, marginBottom: '0.25rem' }}>
          Strasbourg<br/>Bound
        </h1>
        <p style={{ fontSize: '0.75rem', letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '2.5rem' }}>
          BouwApp Team Game
        </p>

        {!joining ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button className="btn btn-gold btn-lg btn-full" onClick={() => router.push('/host')}>
              🎮 Host the game
            </button>
            <button className="btn btn-ghost btn-lg btn-full" onClick={() => setJoining(true)}>
              📱 Join as player
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Your name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '1rem', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-body)' }}
                onKeyDown={e => e.key === 'Enter' && join()}
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Room code</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. STR7"
                maxLength={6}
                style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', outline: 'none', fontFamily: 'var(--font-display)', letterSpacing: 4, textAlign: 'center' }}
                onKeyDown={e => e.key === 'Enter' && join()}
              />
            </div>
            {error && <p style={{ color: 'var(--red)', fontSize: '0.875rem' }}>{error}</p>}
            <button className="btn btn-primary btn-full" onClick={join}>Join game 🎮</button>
            <button className="btn btn-ghost btn-sm btn-full" onClick={() => setJoining(false)}>← Back</button>
          </div>
        )}
      </div>
    </main>
  )
}

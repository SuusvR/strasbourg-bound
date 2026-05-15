'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { PHOTOS, AWARDS, ALL_QUESTIONS, TEAM } from '@/lib/gameData'

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5','av-6','av-7']
function avColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}
function ini(name: string) { return name.slice(0, 2).toUpperCase() }

export default function HostPage() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const [phase, setPhase] = useState('lobby')
  const [players, setPlayers] = useState<string[]>([])
  const [captions, setCaptions] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [buddies, setBuddies] = useState<any[]>([])
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const pollRef = useRef<any>(null)

  useEffect(() => {
    async function createRoom() {
      const res = await fetch('/api/buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_room' }),
      })
      const data = await res.json()
      if (data.code) {
        setRoomCode(data.code)
        const url = `${window.location.origin}/player?code=${data.code}`
        setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=111111`)
      }
    }
    createRoom()
  }, [])

  const poll = useCallback(async () => {
    if (!roomCode) return
    const res = await fetch(`/api/state?code=${roomCode}`)
    const data = await res.json()
    if (data.error) return
    setPlayers(data.players ?? [])
    setCaptions(data.captions ?? [])
    setVotes(data.votes ?? [])
    setBuddies(data.buddies ?? [])
    setCurrentPhotoIdx(data.currentPhotoIdx)
    setCurrentQuestionIdx(data.currentQuestionIdx)
    setPhase(data.phase)
    setRevealed(data.revealed)
  }, [roomCode])

  useEffect(() => {
    if (!roomCode) return
    poll()
    pollRef.current = setInterval(poll, 1500)
    return () => clearInterval(pollRef.current)
  }, [roomCode, poll])

  async function updateState(update: any) {
    setLoading(true)
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, ...update }),
    })
    await poll()
    setLoading(false)
  }

  function computeAwardWinners() {
    const winners: Record<string, string> = {}
    AWARDS.forEach((award, aIdx) => {
      const totalVotes: Record<string, number> = {}
      TEAM.forEach(n => { totalVotes[n] = 0 })
      award.questions.forEach((_, qIdx) => {
        const globalIdx = aIdx * 4 + qIdx
        const qVotes = votes.filter((v: any) => v.question_idx === globalIdx)
        qVotes.forEach((v: any) => {
          if (totalVotes[v.voted_for] !== undefined) totalVotes[v.voted_for]++
        })
      })
      const sorted = Object.entries(totalVotes).sort((a, b) => b[1] - a[1])
      winners[award.id] = sorted[0][0]
    })
    return winners
  }

  if (!roomCode) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dot-loader"><span/><span/><span/></div>
    </div>
  )

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: 'radial-gradient(ellipse at 50% 0%, #2d1f6e 0%, var(--bg) 60%)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, color: 'var(--accent)', marginBottom: 4 }}>🛤️ Strasbourg Bound</div>
          <p style={{ color: 'var(--text2)', marginBottom: '1.5rem' }}>Share this screen via screenshare</p>
          <div className="card" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 8 }}>Room code</p>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '4rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: 8, lineHeight: 1 }}>{roomCode}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text3)', marginTop: 6 }}>or go to: <span style={{ color: 'var(--text2)' }}>{window.location.origin}</span></p>
            {qrUrl && <img src={qrUrl} alt="QR code" style={{ width: 140, height: 140, borderRadius: 8, margin: '12px auto 0', display: 'block', background: 'white', padding: 4 }} />}
          </div>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 10 }}>Connected players ({players.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.5rem' }}>
            {players.map(name => (
              <div key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 50, padding: '4px 12px 4px 4px', fontSize: 13 }}>
                <div className={`avatar ${avColor(name)}`} style={{ width: 22, height: 22, fontSize: 9 }}>{ini(name)}</div>
                {name}
              </div>
            ))}
            {players.length === 0 && <p style={{ color: 'var(--text3)', fontSize: 13 }}>Waiting for players to join…</p>}
          </div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Game plan:</p>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>📸 <strong>Round 1</strong> — Caption This (7 photos)</div>
              <div>🏆 <strong>Round 2</strong> — Team Awards (16 questions)</div>
              <div>🤝 <strong>Finale</strong> — Buddy Pick</div>
            </div>
          </div>
          <button className="btn btn-gold btn-full btn-lg" onClick={() => updateState({ phase: 'caption_submit', currentPhotoIdx: 0, revealed: false })} disabled={loading}>
            🚀 Start game!
          </button>
        </div>
      </div>
    </div>
  )

  // ── CAPTION SUBMIT ──
  if (phase === 'caption_submit') {
    const photo = PHOTOS[currentPhotoIdx]
    const photoCaptions = captions.filter((c: any) => c.photo_idx === currentPhotoIdx)
    return (
      <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={photo.file} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-purple">📸 Caption This</span>
            <span style={{ background: 'rgba(0,0,0,0.6)', borderRadius: 50, padding: '4px 12px', fontSize: 12, color: '#fff' }}>
              Photo {currentPhotoIdx + 1} of {PHOTOS.length}
            </span>
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${((currentPhotoIdx + 1) / PHOTOS.length) * 100}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)' }}>Captions coming in…</p>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{photoCaptions.length} of {players.length}</p>
            </div>
            <button className="btn btn-gold btn-sm" onClick={() => {
              if (currentPhotoIdx < PHOTOS.length - 1) {
                updateState({ phase: 'caption_submit', currentPhotoIdx: currentPhotoIdx + 1 })
              } else {
                updateState({ phase: 'team_vote', currentQuestionIdx: 0, revealed: false })
              }
            }} disabled={loading}>
              {currentPhotoIdx < PHOTOS.length - 1 ? 'Next photo →' : 'Start Round 2 →'}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {photoCaptions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                <div className="dot-loader" style={{ marginBottom: 12 }}><span/><span/><span/></div>
                Waiting for captions…
              </div>
            )}
            {photoCaptions.map((c: any, i: number) => (
              <div key={i} className="caption-card card" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div className={`avatar ${avColor(c.player_name)}`} style={{ width: 24, height: 24, fontSize: 10 }}>{ini(c.player_name)}</div>
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{c.player_name}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.4 }}>"{c.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── TEAM VOTE / REVEAL ──
  if (phase === 'team_vote' || phase === 'team_reveal') {
    const q = ALL_QUESTIONS[currentQuestionIdx]
    const award = AWARDS[q.awardIdx]
    const qVotes = votes.filter((v: any) => v.question_idx === currentQuestionIdx)
    const tally: Record<string, number> = {}
    TEAM.forEach(n => { tally[n] = 0 })
    qVotes.forEach((v: any) => { if (tally[v.voted_for] !== undefined) tally[v.voted_for]++ })
    const sortedTally = Object.entries(tally).sort((a, b) => b[1] - a[1]).filter(([_, v]) => v > 0)
    const maxVotes = sortedTally[0]?.[1] ?? 1
    const winner = sortedTally[0]?.[0]

    return (
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="badge badge-gold">{award.emoji} {award.name}</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${((currentQuestionIdx + 1) / ALL_QUESTIONS.length) * 100}%` }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>Q {currentQuestionIdx + 1} / {ALL_QUESTIONS.length}</span>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="text-muted" style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Question {q.questionIdx + 1} of 4 for this award
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 700, lineHeight: 1.25 }}>{q.text}</p>
            {revealed && winner && (
              <div style={{ marginTop: 12, padding: '10px 20px', background: 'rgba(232,184,109,0.1)', borderRadius: 12, border: '1px solid rgba(232,184,109,0.3)' }}>
                <span style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: 700 }}>🏆 {winner} wins this round!</span>
              </div>
            )}
          </div>
          {revealed && sortedTally.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sortedTally.map(([name, count]) => (
                <div key={name} style={{ background: name === winner ? 'rgba(232,184,109,0.08)' : 'var(--bg3)', border: name === winner ? '1px solid rgba(232,184,109,0.4)' : '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className={`avatar ${avColor(name)}`} style={{ width: 28, height: 28, fontSize: 11 }}>{ini(name)}</div>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{name}</span>
                  <div style={{ width: 100, height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: name === winner ? 'var(--accent)' : 'var(--accent2)', borderRadius: 3, width: `${(count / maxVotes) * 100}%`, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: name === winner ? 'var(--accent)' : 'var(--text2)', minWidth: 20, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
          {!revealed && (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
              {qVotes.length} of {players.length} votes in…
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {!revealed ? (
              <button className="btn btn-gold btn-full" onClick={() => updateState({ phase: 'team_reveal', revealed: true })} disabled={loading}>
                🏆 Reveal answer
              </button>
            ) : (
              <button className="btn btn-primary btn-full" onClick={() => {
                if (currentQuestionIdx < ALL_QUESTIONS.length - 1) {
                  updateState({ phase: 'team_vote', currentQuestionIdx: currentQuestionIdx + 1, revealed: false })
                } else {
                  updateState({ phase: 'awards' })
                }
              }} disabled={loading}>
                {currentQuestionIdx < ALL_QUESTIONS.length - 1 ? 'Next question →' : '🏆 See Awards →'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── AWARDS ──
  if (phase === 'awards' || phase === 'buddy_pick' || phase === 'buddy_reveal') {
    const winners = computeAwardWinners()
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', background: 'radial-gradient(ellipse at 50% 0%, #2d1f6e 0%, var(--bg) 60%)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,6vw,3.5rem)', fontWeight: 900, color: 'var(--accent)', textAlign: 'center', marginBottom: 8 }}>🏆 BouwApp Awards</h1>
          <p style={{ textAlign: 'center', color: 'var(--text2)', marginBottom: '2rem' }}>Strasbourg {new Date().getFullYear()}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            {AWARDS.map(award => {
              const winner = winners[award.id]
              const buddy = buddies.find((b: any) => b.award_id === award.id)
              return (
                <div key={award.id} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 8 }}>{award.emoji}</span>
                  <p style={{ fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 4 }}>{award.name}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{winner || '?'}</p>
                  {buddy ? (
                    <div style={{ marginTop: 8, background: 'rgba(124,106,247,0.1)', borderRadius: 10, padding: '8px 12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--text2)' }}>Buddy: <strong style={{ color: 'var(--accent2)' }}>{buddy.buddy_name}</strong></p>
                      <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{award.buddy_task}</p>
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{award.description}</p>
                  )}
                </div>
              )
            })}
          </div>
          {(phase === 'buddy_pick' || phase === 'buddy_reveal') && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: 12 }}>🤝 Buddy picks incoming…</p>
              {AWARDS.map(award => {
                const winner = winners[award.id]
                const buddy = buddies.find((b: any) => b.award_id === award.id)
                return (
                  <div key={award.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 20 }}>{award.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13 }}><strong>{winner}</strong></span>
                    {buddy ? (
                      <span style={{ fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>picks {buddy.buddy_name} 🤝</span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>choosing…</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {phase === 'awards' && (
            <button className="btn btn-primary btn-full btn-lg" onClick={() => updateState({ phase: 'buddy_pick' })} disabled={loading}>
              🤝 Time to pick buddies!
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

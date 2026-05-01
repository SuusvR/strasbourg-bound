'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PHOTOS, AWARDS, ALL_QUESTIONS, TEAM } from '@/lib/gameData'

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5','av-6','av-7']
function avColor(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AV_COLORS[Math.abs(h) % AV_COLORS.length]
}
function ini(name: string) { return name.slice(0, 2).toUpperCase() }

function PlayerApp() {
  const params = useSearchParams()
  const [phase, setPhase] = useState('loading')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [joined, setJoined] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [captionText, setCaptionText] = useState('')
  const [captionSubmitted, setCaptionSubmitted] = useState<Record<number, boolean>>({})
  const [voteSubmitted, setVoteSubmitted] = useState<Record<number, boolean>>({})
  const [selectedVote, setSelectedVote] = useState('')
  const [winners, setWinners] = useState<Record<string, string>>({})
  const [buddyPicked, setBuddyPicked] = useState<Record<string, boolean>>({})
  const [buddySelected, setBuddySelected] = useState('')
  const [myAward, setMyAward] = useState<any>(null)
  const [revealed, setRevealed] = useState(false)
  const pollRef = useRef<any>(null)

  useEffect(() => {
    const code = params.get('code')
    if (code) setRoomCode(code)
    const savedName = localStorage.getItem('sb_player_name')
    const savedCode = localStorage.getItem('sb_room_code')
    if (savedName && savedCode && (code === savedCode || !code)) {
      setPlayerName(savedName)
      setRoomCode(savedCode)
      setJoined(true)
      setPhase('wait')
    } else {
      setPhase('join')
    }
  }, [params])

  const poll = useCallback(async () => {
    if (!roomCode || !playerName) return
    const res = await fetch(`/api/state?code=${roomCode}`)
    const data = await res.json()
    if (data.error) return
    setPhase(data.phase)
    setCurrentPhotoIdx(data.currentPhotoIdx)
    setCurrentQuestionIdx(data.currentQuestionIdx)
    setRevealed(data.revealed)
    // Compute winners from votes
    if (data.phase === 'awards' || data.phase === 'buddy_pick') {
      const w: Record<string, string> = {}
      AWARDS.forEach((award, aIdx) => {
        const winCounts: Record<string, number> = {}
        TEAM.forEach(n => { winCounts[n] = 0 })
        award.questions.forEach((_, qIdx) => {
          const globalIdx = aIdx * 4 + qIdx
          const qVotes = data.votes.filter((v: any) => v.question_idx === globalIdx)
          const tally: Record<string, number> = {}
          TEAM.forEach(n => { tally[n] = 0 })
          qVotes.forEach((v: any) => { if (tally[v.voted_for] !== undefined) tally[v.voted_for]++ })
          const topName = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
          if (topName) winCounts[topName]++
        })
        w[award.id] = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0][0]
      })
      setWinners(w)
      // Check if this player won an award
      const myAwardEntry = AWARDS.find(a => w[a.id] === playerName)
      setMyAward(myAwardEntry ?? null)
      // Check buddy picks
      const pickedMap: Record<string, boolean> = {}
      data.buddies.forEach((b: any) => { pickedMap[b.award_id] = true })
      setBuddyPicked(pickedMap)
    }
  }, [roomCode, playerName])

  useEffect(() => {
    if (!joined) return
    pollRef.current = setInterval(poll, 1500)
    poll()
    return () => clearInterval(pollRef.current)
  }, [joined, poll])

  async function join() {
    if (!nameInput.trim() || !roomCode.trim()) return
    setError('')
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.trim(), roomCode: roomCode.trim().toUpperCase() }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); return }
    localStorage.setItem('sb_player_name', nameInput.trim())
    localStorage.setItem('sb_room_code', roomCode.trim().toUpperCase())
    setPlayerName(nameInput.trim())
    setRoomCode(roomCode.trim().toUpperCase())
    setJoined(true)
    setPhase('wait')
  }

  async function submitCaption() {
    if (!captionText.trim() || captionSubmitted[currentPhotoIdx]) return
    await fetch('/api/caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, playerName, photoIdx: currentPhotoIdx, text: captionText }),
    })
    setCaptionSubmitted(prev => ({ ...prev, [currentPhotoIdx]: true }))
    setCaptionText('')
  }

  async function submitVote() {
    if (!selectedVote || voteSubmitted[currentQuestionIdx]) return
    await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, playerName, questionIdx: currentQuestionIdx, votedFor: selectedVote }),
    })
    setVoteSubmitted(prev => ({ ...prev, [currentQuestionIdx]: true }))
  }

  async function pickBuddy() {
    if (!buddySelected || !myAward) return
    await fetch('/api/buddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pick_buddy', roomCode, winnerName: playerName, buddyName: buddySelected, awardId: myAward.id }),
    })
    setBuddyPicked(prev => ({ ...prev, [myAward.id]: true }))
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem', maxWidth: 420, margin: '0 auto' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)', marginBottom: 4, alignSelf: 'flex-start' }}>🛤️ Strasbourg Bound</div>
      {children}
    </div>
  )

  // JOIN
  if (phase === 'join') return wrap(
    <div style={{ width: '100%', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>Join the game</h2>
      <div>
        <label style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Your name</label>
        <input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="Enter your name…" maxLength={20}
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 16, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-body)' }}
          onKeyDown={e => e.key === 'Enter' && join()} />
      </div>
      <div>
        <label style={{ fontSize: '0.7rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Room code</label>
        <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} placeholder="e.g. STR7" maxLength={6}
          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)', outline: 'none', fontFamily: 'var(--font-display)', letterSpacing: 4, textAlign: 'center' }}
          onKeyDown={e => e.key === 'Enter' && join()} />
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 14 }}>{error}</p>}
      <button className="btn btn-gold btn-full btn-lg" onClick={join}>Join game 🎮</button>
    </div>
  )

  // WAIT
  if (phase === 'wait' || phase === 'loading') return wrap(
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', width: '100%' }}>
      <div className="dot-loader"><span/><span/><span/></div>
      <p style={{ fontSize: 16, color: 'var(--text2)' }}>Waiting for the host to start…</p>
      <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '12px 20px' }}>
        <p style={{ fontSize: 12, color: 'var(--text2)' }}>Joined as</p>
        <p style={{ fontWeight: 600, fontSize: 18 }}>{playerName}</p>
      </div>
    </div>
  )

  // CAPTION SUBMIT
  if (phase === 'caption_submit') {
    const photo = PHOTOS[currentPhotoIdx]
    const submitted = captionSubmitted[currentPhotoIdx]
    return wrap(
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge badge-purple">📸 Caption This</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Photo {currentPhotoIdx + 1} / {PHOTOS.length}</span>
        </div>
        <img src={photo.file} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 260 }} />
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '1rem' }}>
            <div className="check-circle">✓</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>Caption submitted!</p>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Wait for the host to move on…</p>
          </div>
        ) : (
          <>
            <textarea value={captionText} onChange={e => setCaptionText(e.target.value)} placeholder="Write your best caption… 😄"
              maxLength={120} rows={3}
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', fontSize: 16, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-body)', resize: 'none' }} />
            <button className="btn btn-primary btn-full" onClick={submitCaption} disabled={!captionText.trim()}>✓ Submit caption</button>
          </>
        )}
      </div>
    )
  }

  // TEAM VOTE / REVEAL
  if (phase === 'team_vote' || phase === 'team_reveal') {
    const q = ALL_QUESTIONS[currentQuestionIdx]
    const award = AWARDS[q.awardIdx]
    const submitted = voteSubmitted[currentQuestionIdx]
    return wrap(
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="badge badge-gold">{award.emoji} {award.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>Q{q.questionIdx + 1}/4</span>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>{q.text}</p>
        </div>
        {submitted || revealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '1rem' }}>
            <div className="check-circle">✓</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>Vote submitted!</p>
            {selectedVote && <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>Your vote</p>
              <p style={{ fontWeight: 600, fontSize: 16 }}>{selectedVote}</p>
            </div>}
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>👀 Look at the big screen!</p>
          </div>
        ) : (
          <>
            <div className="vote-grid">
              {TEAM.map(name => (
                <button key={name} className={`vote-btn ${selectedVote === name ? 'selected' : ''}`} onClick={() => setSelectedVote(name)}>
                  <div className={`avatar ${avColor(name)}`} style={{ width: 20, height: 20, fontSize: 8 }}>{ini(name)}</div>
                  {name}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-full" onClick={submitVote} disabled={!selectedVote}>✓ Submit vote</button>
          </>
        )}
      </div>
    )
  }

  // AWARDS + BUDDY PICK
  if (phase === 'awards' || phase === 'buddy_pick') {
    return wrap(
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>🏆 Awards!</p>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Check the big screen for results</p>
        </div>

        {myAward && phase === 'buddy_pick' && !buddyPicked[myAward.id] && (
          <div className="card" style={{ border: '1px solid var(--accent2)' }}>
            <p style={{ fontSize: '0.65rem', letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent2)', marginBottom: 8 }}>🎉 You won!</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{myAward.emoji} {myAward.name}</p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Pick your buddy — you'll be jointly responsible:<br/><em>"{myAward.buddy_task}"</em></p>
            <div className="vote-grid" style={{ marginBottom: 12 }}>
              {TEAM.filter(n => n !== playerName).map(name => (
                <button key={name} className={`vote-btn ${buddySelected === name ? 'selected' : ''}`} onClick={() => setBuddySelected(name)}>
                  <div className={`avatar ${avColor(name)}`} style={{ width: 20, height: 20, fontSize: 8 }}>{ini(name)}</div>
                  {name}
                </button>
              ))}
            </div>
            <button className="btn btn-gold btn-full" onClick={pickBuddy} disabled={!buddySelected}>🤝 Pick {buddySelected || '…'} as my buddy</button>
          </div>
        )}

        {myAward && buddyPicked[myAward.id] && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="check-circle" style={{ margin: '0 auto 12px' }}>🤝</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>Buddy picked!</p>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Check the big screen 👀</p>
          </div>
        )}

        {!myAward && (
          <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text3)' }}>
            <p style={{ fontSize: 13 }}>The winners are picking their buddies…</p>
            <div className="dot-loader" style={{ marginTop: 12 }}><span/><span/><span/></div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerApp />
    </Suspense>
  )
}

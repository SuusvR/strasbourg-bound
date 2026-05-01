import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { roomCode, playerName, questionIdx, votedFor } = await req.json()
  if (!roomCode || !playerName || questionIdx === undefined || !votedFor) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase.from('votes').upsert(
    { room_code: roomCode, player_name: playerName, question_idx: questionIdx, voted_for: votedFor },
    { onConflict: 'room_code,player_name,question_idx' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

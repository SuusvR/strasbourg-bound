import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { roomCode, playerName, photoIdx, text } = await req.json()
  if (!roomCode || !playerName || photoIdx === undefined || !text?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase.from('captions').upsert(
    { room_code: roomCode, player_name: playerName, photo_idx: photoIdx, text: text.trim(), submitted_at: new Date().toISOString() },
    { onConflict: 'room_code,player_name,photo_idx' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

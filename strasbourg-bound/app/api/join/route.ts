import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { name, roomCode } = await req.json()
  if (!name || !roomCode) return NextResponse.json({ error: 'Name and room code required' }, { status: 400 })

  // Check room exists
  const { data: room } = await supabase.from('rooms').select('*').eq('code', roomCode).single()
  if (!room) return NextResponse.json({ error: 'Room not found. Ask the host for the code!' }, { status: 404 })

  // Upsert player (allow rejoin with same name)
  const { error } = await supabase.from('players').upsert(
    { room_code: roomCode, name, joined_at: new Date().toISOString() },
    { onConflict: 'room_code,name' }
  )
  if (error) return NextResponse.json({ error: 'Could not join. Try again!' }, { status: 500 })

  return NextResponse.json({ ok: true, roomCode })
}

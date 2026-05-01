import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { action, roomCode, winnerName, buddyName, awardId } = await req.json()

  if (action === 'create_room') {
    // Generate unique room code
    const code = 'STR' + Math.floor(Math.random() * 9 + 1)
    const { error } = await supabase.from('rooms').insert({
      code,
      phase: 'lobby',
      current_photo_idx: 0,
      current_question_idx: 0,
      revealed: false,
      created_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, code })
  }

  if (action === 'pick_buddy') {
    const { error } = await supabase.from('buddies').upsert(
      { room_code: roomCode, winner_name: winnerName, buddy_name: buddyName, award_id: awardId },
      { onConflict: 'room_code,award_id' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

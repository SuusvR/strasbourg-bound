import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No room code' }, { status: 400 })

  const { data: room } = await supabase.from('rooms').select('*').eq('code', code).single()
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

  const { data: players } = await supabase.from('players').select('name').eq('room_code', code)
  const { data: captions } = await supabase.from('captions').select('*').eq('room_code', code).eq('photo_idx', room.current_photo_idx)
  const { data: votes } = await supabase.from('votes').select('*').eq('room_code', code).eq('question_idx', room.current_question_idx)
  const { data: buddies } = await supabase.from('buddies').select('*').eq('room_code', code)

  return NextResponse.json({
    phase: room.phase,
    currentPhotoIdx: room.current_photo_idx,
    currentQuestionIdx: room.current_question_idx,
    revealed: room.revealed,
    players: players?.map(p => p.name) ?? [],
    captions: captions ?? [],
    votes: votes ?? [],
    buddies: buddies ?? [],
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { roomCode, ...update } = body

  const dbUpdate: any = {}
  if (update.phase !== undefined) dbUpdate.phase = update.phase
  if (update.currentPhotoIdx !== undefined) dbUpdate.current_photo_idx = update.currentPhotoIdx
  if (update.currentQuestionIdx !== undefined) dbUpdate.current_question_idx = update.currentQuestionIdx
  if (update.revealed !== undefined) dbUpdate.revealed = update.revealed

  const { error } = await supabase.from('rooms').update(dbUpdate).eq('code', roomCode)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

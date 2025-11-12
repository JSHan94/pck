import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'
import { json } from '../../_shared/response.ts'
import { requireEnv } from '../../_shared/env.ts'
import { requireUser, AuthError } from '../../_shared/auth.ts'

const SUPABASE_URL = requireEnv('SUPABASE_URL')
const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

serve(async (request) => {
  try {
    const { address } = await requireUser(request)

    await supabase.from('User').upsert({ address })

    const { data: board, error: boardError } = await supabase
      .from('Board')
      .select('boardId, merkleRoot')
      .eq('isAssigned', false)
      .order('createdAt', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (boardError) {
      console.error('Failed to fetch board', boardError)
      return json({ error: 'BOARD_FETCH_FAILED' }, { status: 500 })
    }

    if (!board) {
      return json({ error: 'NO_AVAILABLE_BOARDS' }, { status: 409 })
    }

    const { data: lockedBoard, error: lockError } = await supabase
      .from('Board')
      .update({ isAssigned: true })
      .eq('boardId', board.boardId)
      .eq('isAssigned', false)
      .select('boardId')
      .maybeSingle()

    if (lockError) {
      console.error('Failed to lock board', lockError)
      return json({ error: 'BOARD_LOCK_FAILED' }, { status: 500 })
    }

    if (!lockedBoard) {
      return json({ error: 'BOARD_ALREADY_ASSIGNED' }, { status: 409 })
    }

    const { data: session, error: sessionError } = await supabase
      .from('GameSession')
      .insert({
        userAddress: address,
        boardId: board.boardId,
        pullCount: 0,
        isActive: false,
      })
      .select('sessionId')
      .single()

    if (sessionError) {
      console.error('Failed to create session', sessionError)
      return json({ error: 'SESSION_CREATE_FAILED' }, { status: 500 })
    }

    return json({ merkleRoot: board.merkleRoot, sessionId: session.sessionId })
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, { status: 401 })
    }
    console.error('Unexpected error', error)
    return json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

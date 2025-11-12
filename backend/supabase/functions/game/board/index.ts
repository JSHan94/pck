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

    const { data: session, error: sessionError } = await supabase
      .from('GameSession')
      .select('sessionId, boardId')
      .eq('userAddress', address)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sessionError) {
      console.error('Failed to fetch session', sessionError)
      return json({ error: 'SESSION_FETCH_FAILED' }, { status: 500 })
    }

    if (!session) {
      return json({ boardId: null, revealedCells: [] })
    }

    const { data: revealedCells, error: revealedError } = await supabase
      .from('RevealedCell')
      .select('cellId, tier')
      .eq('sessionId', session.sessionId)
      .order('cellId', { ascending: true })

    if (revealedError) {
      console.error('Failed to fetch revealed cells', revealedError)
      return json({ error: 'REVEALED_FETCH_FAILED' }, { status: 500 })
    }

    return json({ boardId: session.boardId, revealedCells: revealedCells ?? [] })
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, { status: 401 })
    }
    console.error('Unexpected error', error)
    return json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

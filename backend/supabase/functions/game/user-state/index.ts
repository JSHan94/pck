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

    const { data: session, error } = await supabase
      .from('GameSession')
      .select('pullCount, sessionId')
      .eq('userAddress', address)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch user state', error)
      return json({ error: 'USER_STATE_FETCH_FAILED' }, { status: 500 })
    }

    if (!session) {
      return json({ pullCount: 0, sessionId: null })
    }

    return json({ pullCount: session.pullCount ?? 0, sessionId: session.sessionId })
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, { status: 401 })
    }
    console.error('Unexpected error', error)
    return json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

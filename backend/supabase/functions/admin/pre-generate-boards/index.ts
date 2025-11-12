import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'
import { requireAdmin } from '../../_shared/admin.ts'
import { json } from '../../_shared/response.ts'
import { requireEnv } from '../../_shared/env.ts'
import { createBoard } from '../create-board.ts'

const SUPABASE_URL = requireEnv('SUPABASE_URL')
const SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

serve(async (request) => {
  try {
    await requireAdmin(request)

    const { count } = await request.json().catch(() => ({ count: 0 }))
    const total = Number(count)
    if (!Number.isInteger(total) || total <= 0) {
      return json({ error: 'INVALID_COUNT' }, { status: 400 })
    }

    const boards = Array.from({ length: total }, () => createBoard())
    const records = boards.map((board) => ({
      prizeLayout: board.prizeLayout,
      merkleRoot: board.merkleRoot,
      isAssigned: false,
    }))

    const { error } = await supabase.from('Board').insert(records)
    if (error) {
      console.error('Failed to insert boards', error)
      return json({ error: 'INSERT_FAILED' }, { status: 500 })
    }

    return json({ success: true, generated: total })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }
    console.error('Unexpected error', error)
    return json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

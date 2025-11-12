import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { json } from '../../_shared/response.ts'
import { requireAdmin } from '../../_shared/admin.ts'

serve(async (request) => {
  try {
    await requireAdmin(request)
    return json({ isAdmin: true })
  } catch (error) {
    console.error('Admin check failed', error)
    return json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
})

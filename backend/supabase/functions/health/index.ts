import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { GRID_SIZE } from '@pck/shared'
import { json } from '../_shared/response.ts'

serve(() => {
  return json({ ok: true, gridSize: GRID_SIZE })
})

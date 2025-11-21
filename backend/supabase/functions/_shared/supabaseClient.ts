import { createClient } from "@supabase/supabase-js";
import type { Database } from "@pck/shared";
import { HttpError } from "./errors.ts";

export type SupabaseClient = ReturnType<typeof createClient<Database>>;

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new HttpError(
      500,
      "Supabase credentials are not configured",
      "SUPABASE_MISCONFIGURED",
    );
  }

  cachedClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return cachedClient;
}

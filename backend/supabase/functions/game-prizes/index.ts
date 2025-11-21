import { getPrizes, SupabasePrizeRepository } from "./getPrizes.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";
import { requireUser } from "../_shared/userAuth.ts";
import { corsHeaders, HttpError, jsonResponse } from "../_shared/errors.ts";

type GamePrizesResponse = Array<{
  prizeId: string;
  tier: number;
  cellId: number;
  sessionId: number;
}>;

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  try {
    const user = await requireUser(request);
    const supabase = getSupabaseAdminClient();
    const repo = new SupabasePrizeRepository(supabase);
    const prizes = await getPrizes(repo, user);

    return jsonResponse(prizes satisfies GamePrizesResponse, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return handleError(error);
  }
});

function methodNotAllowed(): Response {
  return jsonResponse(
    { error: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
    {
      status: 405,
      headers: corsHeaders,
    },
  );
}

function handleError(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.code, message: error.message },
      {
        status: error.status,
        headers: corsHeaders,
      },
    );
  }

  console.error("[game-prizes] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

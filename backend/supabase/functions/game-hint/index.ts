import { getHint, SupabaseHintRepository } from "./getHint.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";
import { requireUser } from "../_shared/userAuth.ts";
import {
  corsHeaders,
  HttpError,
  badRequest,
  jsonResponse,
} from "../_shared/errors.ts";

type HintResponse = {
  tier4PlusCell: number;
  tier5PlusCell: number;
};

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
    const sessionId = parseSessionId(request);
    const user = await requireUser(request);
    const supabase = getSupabaseAdminClient();
    const repo = new SupabaseHintRepository(supabase);
    const result = await getHint(repo, user, sessionId);

    const body: HintResponse = {
      tier4PlusCell: result.tier4PlusCell,
      tier5PlusCell: result.tier5PlusCell,
    };

    return jsonResponse(body, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return handleError(error);
  }
});

function parseSessionId(request: Request): number {
  const url = new URL(request.url);
  const value = url.searchParams.get("sessionId");
  if (!value) {
    throw badRequest("`sessionId` query parameter is required");
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw badRequest("`sessionId` must be a positive integer");
  }

  return parsed;
}

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

  console.error("[game-hint] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

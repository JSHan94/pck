import type { PullRequest, PullResponse } from "@pck/shared";
import { pullCell } from "./pullCell.ts";
import { requireUser } from "../_shared/userAuth.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";
import {
  corsHeaders,
  HttpError,
  badRequest,
  jsonResponse,
} from "../_shared/errors.ts";

type PullPayload = PullRequest;

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const payload = await parseBody(request);
    const user = await requireUser(request);
    const supabase = getSupabaseAdminClient();
    const result = await pullCell(supabase, user, payload);

    const body: PullResponse = {
      tier: result.tier,
    };

    return jsonResponse(body, { status: 200, headers: corsHeaders });
  } catch (error) {
    return handleError(error);
  }
});

async function parseBody(request: Request): Promise<PullPayload> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }

  const cellId = (json as PullPayload | undefined)?.cellId;
  const sessionId = (json as PullPayload | undefined)?.sessionId;

  if (typeof cellId !== "number" || !Number.isInteger(cellId)) {
    throw badRequest("`cellId` must be an integer");
  }
  if (cellId < 0 || cellId >= 49) {
    throw badRequest("`cellId` must be between 0 and 48");
  }
  if (typeof sessionId !== "number" || !Number.isInteger(sessionId)) {
    throw badRequest("`sessionId` must be an integer");
  }
  if (sessionId <= 0) {
    throw badRequest("`sessionId` must be positive");
  }

  return { cellId, sessionId };
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

  console.error("[game-pull] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

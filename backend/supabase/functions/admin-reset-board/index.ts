import { resetBoard } from "./resetBoard.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";
import {
  corsHeaders,
  HttpError,
  badRequest,
  jsonResponse,
} from "../_shared/errors.ts";

type AdminResetRequest = {
  targetAddress?: string;
};

type AdminResetResponse = {
  success: true;
  resetSessionId: number;
  releasedBoardId: string;
};

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  try {
    const admin = requireAdmin(request);
    const payload = await parseRequest(request, admin.address);
    const supabase = getSupabaseAdminClient();
    const result = await resetBoard(supabase, payload.targetAddress);

    const body: AdminResetResponse = {
      success: true,
      resetSessionId: result.resetSessionId,
      releasedBoardId: result.releasedBoardId,
    };

    return jsonResponse(body, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return handleError(error);
  }
});

async function parseRequest(
  request: Request,
  fallbackAddress: string,
): Promise<Required<AdminResetRequest>> {
  const text = await request.text();
  if (!text) {
    return { targetAddress: fallbackAddress };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw badRequest("Invalid JSON body");
  }

  if (json && typeof json === "object") {
    const { targetAddress } = json as AdminResetRequest;
    if (targetAddress) {
      return { targetAddress };
    }
  }

  return { targetAddress: fallbackAddress };
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

  console.error("[admin-reset-board] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

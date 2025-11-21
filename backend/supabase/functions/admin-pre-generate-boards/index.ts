import { createBoard } from "../_shared/createBoard.ts";
import { requireAdmin } from "../_shared/adminAuth.ts";
import {
  badRequest,
  corsHeaders,
  HttpError,
  jsonResponse,
} from "../_shared/errors.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";

type PreGenerateRequest = {
  count: number;
};

type PreGenerateResponse = {
  success: true;
  generated: number;
};

const MAX_COUNT = Number(Deno.env.get("ADMIN_PREGENERATE_MAX") ?? "200");

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return badRequestResponse("Method not allowed");
  }

  try {
    requireAdmin(request);
    const { count } = await parseRequest(request);
    const supabase = getSupabaseAdminClient();
    const boards = Array.from({ length: count }, () => createBoard());

    const payload = boards.map((board) => ({
      prizeLayout: board.prizeLayout,
      merkleRoot: board.merkleRoot,
      isAssigned: false,
    }));

    const { error } = await supabase.from("Board").insert(payload);
    if (error) {
      throw new HttpError(500, error.message, "DB_INSERT_FAILED");
    }

    const body: PreGenerateResponse = {
      success: true,
      generated: count,
    };

    return jsonResponse(body, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return handleError(error);
  }
});

async function parseRequest(request: Request): Promise<PreGenerateRequest> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }

  const count = assertValidCount(
    json && typeof json === "object" ? (json as PreGenerateRequest).count : undefined,
    MAX_COUNT,
  );

  return { count };
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

  console.error("[admin-pre-generate-boards] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

function badRequestResponse(message: string): Response {
  return jsonResponse(
    { error: "METHOD_NOT_ALLOWED", message },
    {
      status: 405,
      headers: corsHeaders,
    },
  );
}

export function assertValidCount(count: unknown, max: number): number {
  if (typeof count !== "number") {
    throw badRequest("`count` must be provided as a number");
  }

  if (!Number.isInteger(count) || count <= 0) {
    throw badRequest("`count` must be a positive integer");
  }

  if (count > max) {
    throw badRequest(
      `count exceeds maximum of ${max}. Update ADMIN_PREGENERATE_MAX to override.`,
    );
  }

  return count;
}

import { getBoardState, SupabaseGameBoardRepository } from "./getBoard.ts";
import { getSupabaseAdminClient } from "../_shared/supabaseClient.ts";
import { requireUser } from "../_shared/userAuth.ts";
import { corsHeaders, HttpError, jsonResponse } from "../_shared/errors.ts";

type GameBoardResponse = {
  boardId: string;
  revealedCells: Array<{ cellId: number; tier: number }>;
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
    const user = await requireUser(request);
    const supabase = getSupabaseAdminClient();
    const repo = new SupabaseGameBoardRepository(supabase);
    const board = await getBoardState(repo, user);

    const body: GameBoardResponse = {
      boardId: board.boardId,
      revealedCells: board.revealedCells,
    };

    return jsonResponse(body, {
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

  console.error("[game-board] unexpected error", error);
  return jsonResponse(
    { error: "INTERNAL_ERROR", message: "Unexpected server error" },
    {
      status: 500,
      headers: corsHeaders,
    },
  );
}

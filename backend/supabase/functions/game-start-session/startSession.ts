import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import type { UserContext } from "../_shared/userAuth.ts";

export type StartSessionResult = {
  sessionId: number;
  boardId: string;
  merkleRoot: string;
};

type RpcRow = {
  session_id: number;
  board_id: string;
  merkle_root: string;
};

const RPC_FUNCTION = "allocate_board_to_session";

export async function startSession(
  supabase: SupabaseClient,
  user: UserContext,
): Promise<StartSessionResult> {
  const { data, error } = await supabase.rpc<RpcRow[]>(
    RPC_FUNCTION,
    { user_address: user.address },
  );

  if (error) {
    throw mapRpcError(error);
  }

  const row = data?.[0];
  if (!row || !row.session_id || !row.board_id || !row.merkle_root) {
    throw new HttpError(
      500,
      "Failed to create session",
      "SESSION_CREATE_FAILED",
    );
  }

  return {
    sessionId: row.session_id,
    boardId: row.board_id,
    merkleRoot: row.merkle_root,
  };
}

type RpcError = { message?: string; code?: string };

function mapRpcError(error: RpcError): HttpError {
  if (isNoBoardError(error)) {
    return new HttpError(409, "No boards available", "NO_AVAILABLE_BOARDS");
  }

  console.error("[game-start-session] RPC error", error);
  return new HttpError(
    500,
    "Failed to create session",
    "SESSION_CREATE_FAILED",
  );
}

function isNoBoardError(error: RpcError): boolean {
  const message = error.message ?? "";
  const code = error.code ?? "";
  return message.includes("NO_AVAILABLE_BOARDS") ||
    code === "NO_AVAILABLE_BOARDS";
}

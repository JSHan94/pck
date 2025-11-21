import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";

const RPC_FUNCTION = "reset_user_session";

type RpcRow = {
  session_id: number;
  board_id: string;
};

type RpcError = {
  message?: string;
  code?: string;
};

export type ResetBoardResult = {
  resetSessionId: number;
  releasedBoardId: string;
};

export async function resetBoard(
  supabase: SupabaseClient,
  targetAddress: string,
): Promise<ResetBoardResult> {
  const normalized = normalizeAddress(targetAddress);

  const { data, error } = await supabase.rpc<RpcRow[]>(
    RPC_FUNCTION,
    { user_address: normalized },
  );

  if (error) {
    throw mapRpcError(error);
  }

  const row = data?.[0];
  if (!row || typeof row.session_id !== "number" || !row.board_id) {
    throw new HttpError(
      500,
      "Failed to reset session",
      "RESET_FAILED",
    );
  }

  return {
    resetSessionId: row.session_id,
    releasedBoardId: row.board_id,
  };
}

function normalizeAddress(address: string): string {
  if (typeof address !== "string") {
    throw new HttpError(400, "Invalid target address", "INVALID_TARGET");
  }

  const trimmed = address.trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(trimmed)) {
    throw new HttpError(400, "Invalid target address", "INVALID_TARGET");
  }

  return trimmed.toLowerCase();
}

function mapRpcError(error: RpcError): HttpError {
  const code = (error.code ?? error.message ?? "").toUpperCase();

  if (code === "SESSION_NOT_FOUND") {
    return new HttpError(404, "No active session to reset", "SESSION_NOT_FOUND");
  }

  if (code === "INVALID_ADDRESS") {
    return new HttpError(400, "Invalid target address", "INVALID_TARGET");
  }

  console.error("[admin-reset-board] RPC error", error);
  return new HttpError(
    500,
    "Failed to reset session",
    "RESET_FAILED",
  );
}

import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import type { UserContext } from "../_shared/userAuth.ts";

const RPC_FUNCTION = "reveal_cell";

type RpcRow = {
  tier: number;
  prize_id: string;
  pull_count: number;
};

type RpcError = {
  message?: string;
  code?: string;
};

const requireActiveFlag = parseRequireActiveFlag();

export type PullCellParams = {
  sessionId: number;
  cellId: number;
};

export type PullCellResult = {
  tier: number;
  prizeId: string;
  pullCount: number;
};

export async function pullCell(
  supabase: SupabaseClient,
  user: UserContext,
  params: PullCellParams,
): Promise<PullCellResult> {
  const { data, error } = await supabase.rpc<RpcRow[]>(
    RPC_FUNCTION,
    {
      session_id: params.sessionId,
      user_address: user.address,
      cell_id: params.cellId,
      require_active: requireActiveFlag,
    },
  );

  if (error) {
    throw mapRpcError(error);
  }

  const row = data?.[0];
  if (!row || typeof row.tier !== "number") {
    throw new HttpError(500, "Failed to reveal cell", "PULL_FAILED");
  }

  return {
    tier: row.tier,
    prizeId: row.prize_id,
    pullCount: row.pull_count,
  };
}

function parseRequireActiveFlag(): boolean {
  const raw = Deno.env.get("PULL_REQUIRE_ACTIVE");
  if (!raw) {
    return false;
  }

  return raw.trim().toLowerCase() === "true";
}

function mapRpcError(error: RpcError): HttpError {
  const code = (error.code ?? error.message ?? "").toUpperCase();

  switch (code) {
    case "SESSION_NOT_FOUND":
      return new HttpError(404, "Session not found", "SESSION_NOT_FOUND");
    case "SESSION_NOT_ACTIVE":
      return new HttpError(409, "Session is not active", "SESSION_NOT_ACTIVE");
    case "NOT_OWNER":
      return new HttpError(403, "Session does not belong to user", "FORBIDDEN");
    case "ALREADY_REVEALED":
      return new HttpError(409, "Cell already revealed", "ALREADY_REVEALED");
    case "BOARD_COMPLETED":
      return new HttpError(409, "Board already completed", "BOARD_COMPLETED");
    case "CELL_NOT_FOUND":
      return new HttpError(400, "Cell not found on board", "CELL_NOT_FOUND");
    default:
      console.error("[game-pull] unexpected RPC error", error);
      return new HttpError(500, "Failed to reveal cell", "PULL_FAILED");
  }
}

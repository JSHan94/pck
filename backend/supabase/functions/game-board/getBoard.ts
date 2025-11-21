import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import type { RevealedCell } from "@pck/shared";
import type { UserContext } from "../_shared/userAuth.ts";
import { fetchLatestSession } from "../_shared/sessionRepository.ts";

export type RevealedCellSummary = {
  cellId: number;
  tier: number;
};

export type ActiveSession = {
  sessionId: number;
  boardId: string;
};

export interface GameBoardRepository {
  getActiveSession(userAddress: string): Promise<ActiveSession | null>;
  getRevealedCells(sessionId: number): Promise<RevealedCellSummary[]>;
}

export type GameBoardState = {
  boardId: string;
  revealedCells: RevealedCellSummary[];
};

export async function getBoardState(
  repo: GameBoardRepository,
  user: UserContext,
): Promise<GameBoardState> {
  const session = await repo.getActiveSession(user.address);
  if (!session) {
    throw new HttpError(404, "No active session found", "SESSION_NOT_FOUND");
  }

  const revealedCells = await repo.getRevealedCells(session.sessionId);

  return {
    boardId: session.boardId,
    revealedCells,
  };
}

export class SupabaseGameBoardRepository implements GameBoardRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getActiveSession(userAddress: string): Promise<ActiveSession | null> {
    const session = await fetchLatestSession(this.supabase, userAddress);
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      boardId: session.boardId,
    };
  }

  async getRevealedCells(sessionId: number): Promise<RevealedCellSummary[]> {
    const { data, error } = await this.supabase
      .from("RevealedCell")
      .select("cellId, tier")
      .eq("sessionId", sessionId)
      .order("revealedAt", { ascending: true });

    if (error) {
      throw dbError("Failed to load revealed cells", error);
    }

    const rows = (data as Pick<RevealedCell, "cellId" | "tier">[] | null) ?? [];
    return rows.map((row) => ({
      cellId: row.cellId,
      tier: row.tier,
    }));
  }
}

type DbError = { message?: string };

function dbError(message: string, error: DbError): HttpError {
  console.error("[game-board] database error", error);
  return new HttpError(500, message, "DB_QUERY_FAILED");
}

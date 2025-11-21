import { HttpError } from "../_shared/errors.ts";
import type { PrizeLayout } from "@pck/shared";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import type { UserContext } from "../_shared/userAuth.ts";
import {
  fetchSessionById,
  type SessionRecord,
} from "../_shared/sessionRepository.ts";

export type HintResult = {
  tier4PlusCell: number;
  tier5PlusCell: number;
};

export interface HintRepository {
  getSessionById(sessionId: number): Promise<SessionRecord | null>;
  getBoardPrizeLayout(boardId: string): Promise<PrizeLayout>;
  getRevealedCellIds(sessionId: number): Promise<number[]>;
}

const HINT_INTERVAL = 3;

export async function getHint(
  repo: HintRepository,
  user: UserContext,
  sessionId: number,
): Promise<HintResult> {
  const session = await repo.getSessionById(sessionId);
  if (!session) {
    throw new HttpError(404, "Session not found", "SESSION_NOT_FOUND");
  }

  if (session.userAddress !== user.address) {
    throw new HttpError(403, "Session does not belong to user", "FORBIDDEN");
  }

  if (
    session.pullCount === 0 ||
    session.pullCount % HINT_INTERVAL !== 0
  ) {
    throw new HttpError(
      409,
      "Hints unlock every 3 pulls",
      "HINT_NOT_AVAILABLE",
    );
  }

  const [prizeLayout, revealedCells] = await Promise.all([
    repo.getBoardPrizeLayout(session.boardId),
    repo.getRevealedCellIds(session.sessionId),
  ]);

  const revealedSet = new Set(revealedCells);
  const availableCells = prizeLayout.filter((cell) =>
    !revealedSet.has(cell.cellId)
  );

  const tier4PlusCell =
    availableCells.find((cell) => cell.tier <= 4)?.cellId ?? 0;

  const tier5PlusCell =
    availableCells.find((cell) => cell.tier <= 5)?.cellId ?? 0;

  return {
    tier4PlusCell,
    tier5PlusCell,
  };
}

export class SupabaseHintRepository implements HintRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getSessionById(sessionId: number): Promise<SessionRecord | null> {
    return fetchSessionById(this.supabase, sessionId);
  }

  async getBoardPrizeLayout(boardId: string): Promise<PrizeLayout> {
    const { data, error } = await this.supabase
      .from("Board")
      .select("prizeLayout")
      .eq("boardId", boardId)
      .limit(1);

    if (error) {
      throw dbError("Failed to load board", error);
    }

    const row = (data as { prizeLayout: PrizeLayout }[] | null)?.[0];
    if (!row) {
      throw new HttpError(500, "Board not found", "BOARD_NOT_FOUND");
    }

    return row.prizeLayout;
  }

  async getRevealedCellIds(sessionId: number): Promise<number[]> {
    const { data, error } = await this.supabase
      .from("RevealedCell")
      .select("cellId")
      .eq("sessionId", sessionId);

    if (error) {
      throw dbError("Failed to load revealed cells", error);
    }

    return ((data as { cellId: number }[] | null) ?? []).map((row) =>
      row.cellId
    );
  }
}

type DbError = { message?: string };

function dbError(message: string, error: DbError): HttpError {
  console.error("[game-hint] database error", error);
  return new HttpError(500, message, "DB_QUERY_FAILED");
}

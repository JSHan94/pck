import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import { fetchLatestSession } from "../_shared/sessionRepository.ts";
import type { UserContext } from "../_shared/userAuth.ts";
import type { PrizeClaim } from "@pck/shared";

export type PrizeSummary = {
  prizeId: string;
  tier: number;
  cellId: number;
  sessionId: number;
};

export interface PrizeRepository {
  getLatestSession(userAddress: string): Promise<{ sessionId: number } | null>;
  getUnclaimedPrizes(sessionId: number): Promise<PrizeSummary[]>;
}

export async function getPrizes(
  repo: PrizeRepository,
  user: UserContext,
): Promise<PrizeSummary[]> {
  const session = await repo.getLatestSession(user.address);
  if (!session) {
    throw new HttpError(404, "No active session found", "SESSION_NOT_FOUND");
  }

  return repo.getUnclaimedPrizes(session.sessionId);
}

export class SupabasePrizeRepository implements PrizeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLatestSession(
    userAddress: string,
  ): Promise<{ sessionId: number } | null> {
    const session = await fetchLatestSession(this.supabase, userAddress);
    if (!session) {
      return null;
    }
    return { sessionId: session.sessionId };
  }

  async getUnclaimedPrizes(sessionId: number): Promise<PrizeSummary[]> {
    const { data, error } = await this.supabase
      .from("PrizeClaim")
      .select("prizeId, tier, cellId, sessionId")
      .eq("sessionId", sessionId)
      .eq("isClaimed", false)
      .order("createdAt", { ascending: true });

    if (error) {
      console.error("[game-prizes] failed to load prizes", error);
      throw new HttpError(500, "Failed to load prizes", "DB_QUERY_FAILED");
    }

    const rows = (data as Pick<
      PrizeClaim,
      "prizeId" | "tier" | "cellId" | "sessionId"
    >[] | null) ?? [];

    return rows.map((row) => ({
      prizeId: row.prizeId,
      tier: row.tier,
      cellId: row.cellId,
      sessionId: row.sessionId,
    }));
  }
}

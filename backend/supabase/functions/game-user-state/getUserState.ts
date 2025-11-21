import { HttpError } from "../_shared/errors.ts";
import type { SupabaseClient } from "../_shared/supabaseClient.ts";
import { fetchLatestSession } from "../_shared/sessionRepository.ts";
import type { UserContext } from "../_shared/userAuth.ts";

export type UserState = {
  pullCount: number;
  sessionId: number;
};

export interface UserStateRepository {
  getLatestSession(userAddress: string): Promise<UserState | null>;
}

export async function getUserState(
  repo: UserStateRepository,
  user: UserContext,
): Promise<UserState> {
  const session = await repo.getLatestSession(user.address);
  if (!session) {
    throw new HttpError(404, "No active session found", "SESSION_NOT_FOUND");
  }

  return session;
}

export class SupabaseUserStateRepository implements UserStateRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getLatestSession(userAddress: string): Promise<UserState | null> {
    const session = await fetchLatestSession(this.supabase, userAddress);
    if (!session) {
      return null;
    }

    return {
      pullCount: session.pullCount,
      sessionId: session.sessionId,
    };
  }
}

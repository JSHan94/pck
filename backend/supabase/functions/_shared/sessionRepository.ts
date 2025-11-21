import type { SupabaseClient } from "./supabaseClient.ts";
import type { GameSession } from "@pck/shared";
import { HttpError } from "./errors.ts";

export type SessionRecord = Pick<
  GameSession,
  "sessionId" | "boardId" | "pullCount" | "isActive" | "userAddress"
>;

const SESSION_COLUMNS =
  "sessionId, boardId, pullCount, isActive, userAddress";

export async function fetchLatestSession(
  supabase: SupabaseClient,
  userAddress: string,
): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from("GameSession")
    .select(SESSION_COLUMNS)
    .eq("userAddress", userAddress)
    .order("createdAt", { ascending: false })
    .limit(1);

  if (error) {
    throw dbError("Failed to load session", error);
  }

  return ((data as SessionRecord[] | null) ?? [])[0] ?? null;
}

export async function fetchSessionById(
  supabase: SupabaseClient,
  sessionId: number,
): Promise<SessionRecord | null> {
  const { data, error } = await supabase
    .from("GameSession")
    .select(SESSION_COLUMNS)
    .eq("sessionId", sessionId)
    .limit(1);

  if (error) {
    throw dbError("Failed to load session", error);
  }

  return ((data as SessionRecord[] | null) ?? [])[0] ?? null;
}

type DbError = { message?: string };

function dbError(message: string, error: DbError): HttpError {
  console.error("[sessionRepository] database error", error);
  return new HttpError(500, message, "DB_QUERY_FAILED");
}

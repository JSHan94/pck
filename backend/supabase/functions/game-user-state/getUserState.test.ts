import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { getUserState } from "./getUserState.ts";
import { HttpError } from "../_shared/errors.ts";
import type { UserContext } from "../_shared/userAuth.ts";

const user: UserContext = {
  address: "0xabc",
};

type SessionInfo = {
  sessionId: number;
  pullCount: number;
};

class TestRepo {
  constructor(private readonly session: SessionInfo | null) {}

  async getLatestSession(): Promise<SessionInfo | null> {
    return this.session;
  }
}

Deno.test("getUserState returns pull count and session id", async () => {
  const repo = new TestRepo({ sessionId: 11, pullCount: 5 });

  const state = await getUserState(
    repo as unknown as Parameters<typeof getUserState>[0],
    user,
  );

  assertEquals(state, { pullCount: 5, sessionId: 11 });
});

Deno.test("getUserState throws when user has no session", async () => {
  const repo = new TestRepo(null);

  await assertRejects(
    () =>
      getUserState(
        repo as unknown as Parameters<typeof getUserState>[0],
        user,
      ),
    HttpError,
    "No active session found",
  );
});

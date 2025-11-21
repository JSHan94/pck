import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { getPrizes } from "./getPrizes.ts";
import type { UserContext } from "../_shared/userAuth.ts";
import { HttpError } from "../_shared/errors.ts";

const user: UserContext = {
  address: "0xabc",
};

type Prize = {
  prizeId: string;
  tier: number;
  cellId: number;
  sessionId: number;
};

class TestRepo {
  constructor(
    private readonly session: { sessionId: number } | null,
    private readonly prizes: Prize[],
  ) {}

  async getLatestSession() {
    return this.session;
  }

  async getUnclaimedPrizes(sessionId: number) {
    if (!this.session || this.session.sessionId !== sessionId) {
      throw new Error("Unexpected session id");
    }
    return this.prizes;
  }
}

Deno.test("getPrizes returns unclaimed prizes for the active session", async () => {
  const repo = new TestRepo(
    { sessionId: 42 },
    [
      {
        prizeId: "prize-1",
        tier: 4,
        cellId: 5,
        sessionId: 42,
      },
    ],
  );

  const result = await getPrizes(
    repo as unknown as Parameters<typeof getPrizes>[0],
    user,
  );

  assertEquals(result.length, 1);
  assertEquals(result[0].tier, 4);
});

Deno.test("getPrizes throws when user has no session", async () => {
  const repo = new TestRepo(null, []);

  await assertRejects(
    () =>
      getPrizes(
        repo as unknown as Parameters<typeof getPrizes>[0],
        user,
      ),
    HttpError,
    "No active session found",
  );
});

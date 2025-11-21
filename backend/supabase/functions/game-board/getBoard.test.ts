import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { getBoardState } from "./getBoard.ts";
import { HttpError } from "../_shared/errors.ts";
import type { UserContext } from "../_shared/userAuth.ts";

const user: UserContext = {
  address: "0xabc",
};

type RevealedCell = { cellId: number; tier: number };

class TestRepo {
  constructor(
    private session: { sessionId: number; boardId: string } | null,
    private cells: RevealedCell[],
  ) {}

  async getActiveSession() {
    return this.session;
  }

  async getRevealedCells() {
    return this.cells;
  }
}

Deno.test("getBoardState returns boardId and revealed cells for active session", async () => {
  const repo = new TestRepo(
    { sessionId: 10, boardId: "board-123" },
    [
      { cellId: 1, tier: 4 },
      { cellId: 2, tier: 5 },
    ],
  );

  const result = await getBoardState(
    repo as unknown as Parameters<typeof getBoardState>[0],
    user,
  );

  assertEquals(result, {
    boardId: "board-123",
    revealedCells: [
      { cellId: 1, tier: 4 },
      { cellId: 2, tier: 5 },
    ],
  });
});

Deno.test("getBoardState throws when user has no session", async () => {
  const repo = new TestRepo(null, []);

  await assertRejects(
    () =>
      getBoardState(
        repo as unknown as Parameters<typeof getBoardState>[0],
        user,
      ),
    HttpError,
    "No active session found",
  );
});

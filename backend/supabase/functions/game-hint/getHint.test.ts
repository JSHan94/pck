import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { getHint } from "./getHint.ts";
import type { UserContext } from "../_shared/userAuth.ts";
import { HttpError } from "../_shared/errors.ts";
import type { PrizeLayout } from "@pck/shared";

const user: UserContext = {
  address: "0xabc",
};

type SessionInfo = {
  sessionId: number;
  boardId: string;
  pullCount: number;
  userAddress: string;
};

class TestRepo {
  constructor(
    private readonly session: SessionInfo | null,
    private readonly board: PrizeLayout,
    private readonly revealed: number[],
  ) {}

  async getSessionById(): Promise<SessionInfo | null> {
    return this.session;
  }

  async getBoard(): Promise<PrizeLayout> {
    return this.board;
  }

  async getRevealedCells(): Promise<number[]> {
    return this.revealed;
  }
}

const baseBoard: PrizeLayout = [
  { cellId: 0, tier: 6, salt: "0x0" },
  { cellId: 1, tier: 4, salt: "0x0" },
  { cellId: 2, tier: 5, salt: "0x0" },
  { cellId: 3, tier: 2, salt: "0x0" },
];

Deno.test("getHint returns unrevealed tier4+ and tier5+ cells", async () => {
  const repo = new TestRepo(
    {
      sessionId: 10,
      boardId: "board-1",
      pullCount: 6,
      userAddress: user.address,
    },
    baseBoard,
    [1], // tier4 cell already revealed
  );

  const result = await getHint(
    repo as unknown as Parameters<typeof getHint>[0],
    user,
    10,
  );

  assertEquals(result.tier4PlusCell, 3);
  assertEquals(result.tier5PlusCell, 2);
});

Deno.test("getHint rejects when pullCount is not a multiple of 3", async () => {
  const repo = new TestRepo(
    {
      sessionId: 10,
      boardId: "board-1",
      pullCount: 2,
      userAddress: user.address,
    },
    baseBoard,
    [],
  );

  await assertRejects(
    () =>
      getHint(
        repo as unknown as Parameters<typeof getHint>[0],
        user,
        10,
      ),
    HttpError,
    "Hints unlock every 3 pulls",
  );
});

Deno.test("getHint rejects when session belongs to another user", async () => {
  const repo = new TestRepo(
    {
      sessionId: 10,
      boardId: "board-1",
      pullCount: 3,
      userAddress: "0xdef",
    },
    baseBoard,
    [],
  );

  await assertRejects(
    () =>
      getHint(
        repo as unknown as Parameters<typeof getHint>[0],
        user,
        10,
      ),
    HttpError,
    "Session does not belong to user",
  );
});

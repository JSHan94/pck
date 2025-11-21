import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { startSession } from "./startSession.ts";
import { HttpError } from "../_shared/errors.ts";
import type { UserContext } from "../_shared/userAuth.ts";

type RpcCall = {
  fn: string;
  args: Record<string, unknown>;
};

const user: UserContext = {
  address: "0xabc",
};

function mockSupabase(responses: Array<{ data: unknown; error: unknown }>) {
  const calls: RpcCall[] = [];
  return {
    calls,
    async rpc(fn: string, args: Record<string, unknown>) {
      calls.push({ fn, args });
      const next = responses.shift() ?? { data: null, error: null };
      return next;
    },
  };
}

Deno.test("startSession returns normalized session data from RPC", async () => {
  const supabase = mockSupabase([
    {
      data: [
        {
          session_id: 42,
          board_id: "board-123",
          merkle_root: "0xabc",
        },
      ],
      error: null,
    },
  ]);

  const result = await startSession(
    supabase as unknown as Parameters<typeof startSession>[0],
    user,
  );

  assertEquals(supabase.calls[0], {
    fn: "allocate_board_to_session",
    args: { user_address: user.address },
  });
  assertEquals(result, {
    sessionId: 42,
    boardId: "board-123",
    merkleRoot: "0xabc",
  });
});

Deno.test("startSession throws NO_AVAILABLE_BOARDS when RPC returns that error", async () => {
  const supabase = mockSupabase([
    {
      data: null,
      error: { message: "NO_AVAILABLE_BOARDS" },
    },
  ]);

  await assertRejects(
    () =>
      startSession(
        supabase as unknown as Parameters<typeof startSession>[0],
        user,
      ),
    HttpError,
    "No boards available",
  );
});

Deno.test("startSession throws when RPC returns no rows and no error", async () => {
  const supabase = mockSupabase([
    {
      data: null,
      error: null,
    },
  ]);

  await assertRejects(
    () =>
      startSession(
        supabase as unknown as Parameters<typeof startSession>[0],
        user,
      ),
    HttpError,
    "Failed to create session",
  );
});

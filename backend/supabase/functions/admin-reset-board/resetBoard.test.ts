import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { resetBoard } from "./resetBoard.ts";
import { HttpError } from "../_shared/errors.ts";

type RpcCall = {
  fn: string;
  args: Record<string, unknown>;
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

Deno.test("resetBoard invokes RPC and returns result", async () => {
  const supabase = mockSupabase([
    {
      data: [{ session_id: 15, board_id: "board-123" }],
      error: null,
    },
  ]);

  const result = await resetBoard(
    supabase as unknown as Parameters<typeof resetBoard>[0],
    "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
  );

  assertEquals(supabase.calls[0], {
    fn: "reset_user_session",
    args: { user_address: "0xabcdef1234567890abcdef1234567890abcdef12" },
  });
  assertEquals(result.resetSessionId, 15);
  assertEquals(result.releasedBoardId, "board-123");
});

Deno.test("resetBoard maps SESSION_NOT_FOUND errors", async () => {
  const supabase = mockSupabase([
    { data: null, error: { message: "SESSION_NOT_FOUND" } },
  ]);

  await assertRejects(
    () =>
      resetBoard(
        supabase as unknown as Parameters<typeof resetBoard>[0],
        "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      ),
    HttpError,
    "No active session to reset",
  );
});

Deno.test("resetBoard validates addresses", async () => {
  const supabase = mockSupabase([]);

  await assertRejects(
    () =>
      resetBoard(
        supabase as unknown as Parameters<typeof resetBoard>[0],
        "not-an-address",
      ),
    HttpError,
    "Invalid target address",
  );
});

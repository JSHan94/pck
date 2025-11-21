import {
  assertEquals,
  assertRejects,
} from "std/testing/asserts.ts";
import { pullCell } from "./pullCell.ts";
import type { UserContext } from "../_shared/userAuth.ts";
import { HttpError } from "../_shared/errors.ts";

const user: UserContext = {
  address: "0xabc",
};

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

Deno.test("pullCell returns tier from RPC response", async () => {
  const supabase = mockSupabase([
    {
      data: [
        {
          tier: 4,
          prize_id: "uuid-123",
          pull_count: 3,
        },
      ],
      error: null,
    },
  ]);

  const result = await pullCell(
    supabase as unknown as Parameters<typeof pullCell>[0],
    user,
    { sessionId: 1, cellId: 2 },
  );

  assertEquals(supabase.calls[0].fn, "reveal_cell");
  assertEquals(result.tier, 4);
  assertEquals(result.prizeId, "uuid-123");
});

Deno.test("pullCell maps ALREADY_REVEALED error to HttpError", async () => {
  const supabase = mockSupabase([
    {
      data: null,
      error: { message: "ALREADY_REVEALED" },
    },
  ]);

  await assertRejects(
    () =>
      pullCell(
        supabase as unknown as Parameters<typeof pullCell>[0],
        user,
        { sessionId: 1, cellId: 2 },
      ),
    HttpError,
    "Cell already revealed",
  );
});

Deno.test("pullCell maps SESSION_NOT_FOUND to 404", async () => {
  const supabase = mockSupabase([
    {
      data: null,
      error: { message: "SESSION_NOT_FOUND" },
    },
  ]);

  await assertRejects(
    () =>
      pullCell(
        supabase as unknown as Parameters<typeof pullCell>[0],
        user,
        { sessionId: 1, cellId: 2 },
      ),
    HttpError,
    "Session not found",
  );
});

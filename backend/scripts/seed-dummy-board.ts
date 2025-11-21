#!/usr/bin/env -S node --import tsx
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@pck/shared";
import { createBoard } from "../supabase/functions/_shared/createBoard.ts";
import { loadEnvFile, pathFromRoot, requireEnv } from "./utils.ts";

type BoardInsert = Database["public"]["Tables"]["Board"]["Insert"];
type InsertedBoard = Pick<
  Database["public"]["Tables"]["Board"]["Row"],
  "boardId" | "merkleRoot"
>;

const DEFAULT_COUNT = 1;

async function main(): Promise<void> {
  loadEnvFile(pathFromRoot(".env"));

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const { count } = parseArgs(process.argv.slice(2));

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const boards = buildBoards(count);
  const { data, error } = await supabase
    .from("Board")
    .insert(boards)
    .select("boardId, merkleRoot");

  if (error) {
    console.error("❌ Failed to insert dummy boards:", error.message);
    process.exit(1);
  }

  const inserted = data ?? [];
  console.log(`✅ Inserted ${inserted.length} board(s) into Supabase.`);
  inserted.forEach((board, index) => {
    console.log(
      `  [${index + 1}] boardId=${board.boardId} merkleRoot=${board.merkleRoot}`,
    );
  });
}

function parseArgs(argv: string[]): { count: number } {
  const countFlagIndex = argv.findIndex((arg) =>
    arg === "--count" || arg === "-c"
  );

  if (countFlagIndex !== -1) {
    const value = argv[countFlagIndex + 1];
    const count = Number(value);
    if (!Number.isInteger(count) || count <= 0) {
      console.error("❌ --count must be a positive integer.");
      process.exit(1);
    }
    return { count };
  }

  return { count: DEFAULT_COUNT };
}

function buildBoards(count: number): BoardInsert[] {
  return Array.from({ length: count }, () => {
    const board = createBoard();
    return {
      prizeLayout: board.prizeLayout,
      merkleRoot: board.merkleRoot,
      isAssigned: false,
    };
  });
}

main().catch((error) => {
  console.error("❌ Unexpected error while seeding dummy boards:", error);
  process.exit(1);
});

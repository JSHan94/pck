import { assertEquals, assertMatch } from "std/testing/asserts.ts";
import { TIER_DISTRIBUTION, generateMerkleProof } from "@pck/shared";
import { createBoard } from "./createBoard.ts";

Deno.test("createBoard respects tier distribution and cell ordering", () => {
  const board = createBoard();

  assertEquals(board.prizeLayout.length, 49);

  const counts = new Map<number, number>();
  for (const cell of board.prizeLayout) {
    counts.set(cell.tier, (counts.get(cell.tier) ?? 0) + 1);
    assertEquals(cell.cellId >= 0 && cell.cellId < 49, true);
    assertMatch(cell.salt, /^0x[0-9a-f]{64}$/i);
  }

  Object.entries(TIER_DISTRIBUTION).forEach(([tier, expected]) => {
    assertEquals(counts.get(Number(tier)) ?? 0, expected);
  });

  board.prizeLayout.forEach((cell, index) => {
    assertEquals(cell.cellId, index);
  });
});

Deno.test("createBoard returns a merkle root that matches shared hashLeaf logic", () => {
  const board = createBoard();
  const firstCell = board.prizeLayout[0];
  const { root } = generateMerkleProof(board.prizeLayout, firstCell.cellId);
  assertEquals(root.toLowerCase(), board.merkleRoot.toLowerCase());
});

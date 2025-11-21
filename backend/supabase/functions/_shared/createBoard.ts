import {
  TIER_DISTRIBUTION,
  hashLeaf,
  type PrizeLayoutCell,
} from "@pck/shared";
import { concatHex, keccak256 } from "viem";

type Hex = `0x${string}`;

export type CreateBoardResult = {
  prizeLayout: PrizeLayoutCell[];
  merkleRoot: Hex;
};

export function createBoard(): CreateBoardResult {
  const cells = generateCells();
  shuffleCells(cells);
  normalizeCellIds(cells);
  const merkleRoot = buildMerkleRoot(cells);

  return {
    prizeLayout: cells,
    merkleRoot,
  };
}

function generateCells(): PrizeLayoutCell[] {
  const cells: PrizeLayoutCell[] = [];

  Object.entries(TIER_DISTRIBUTION).forEach(([tier, count]) => {
    for (let i = 0; i < count; i++) {
      cells.push({
        cellId: 0,
        tier: Number(tier),
        salt: generateSalt(),
      });
    }
  });

  return cells;
}

function shuffleCells(cells: PrizeLayoutCell[]): void {
  for (let i = cells.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
}

function normalizeCellIds(cells: PrizeLayoutCell[]): void {
  cells.forEach((cell, index) => {
    cell.cellId = index;
  });
}

function buildMerkleRoot(cells: PrizeLayoutCell[]): Hex {
  if (cells.length === 0) {
    throw new Error("EMPTY_CELLS");
  }

  let layer = cells.map((cell) =>
    hashLeaf(cell.cellId, cell.tier, cell.salt).toLowerCase() as Hex
  );

  while (layer.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i];
      const right = layer[i + 1] ?? left;
      const [a, b] = [left, right].sort() as [Hex, Hex];
      next.push(keccak256(concatHex([a, b])) as Hex);
    }
    layer = next;
  }

  return layer[0];
}

function generateSalt(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}` as Hex;
}

function randomInt(maxExclusive: number): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % maxExclusive;
}

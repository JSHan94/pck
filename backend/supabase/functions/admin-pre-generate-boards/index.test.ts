import {
  assertEquals,
  assertThrows,
} from "std/testing/asserts.ts";
import { assertValidCount } from "./index.ts";
import { HttpError } from "../_shared/errors.ts";

Deno.test("assertValidCount accepts positive integers within max", () => {
  const result = assertValidCount(5, 10);
  assertEquals(result, 5);
});

Deno.test("assertValidCount rejects non-numeric values", () => {
  assertThrows(
    () => assertValidCount("three" as unknown as number, 10),
    HttpError,
    "`count` must be provided as a number",
  );
});

Deno.test("assertValidCount rejects zero or negative values", () => {
  assertThrows(
    () => assertValidCount(0, 10),
    HttpError,
    "`count` must be a positive integer",
  );
  assertThrows(
    () => assertValidCount(-1, 10),
    HttpError,
    "`count` must be a positive integer",
  );
});

Deno.test("assertValidCount enforces maximum bound", () => {
  assertThrows(
    () => assertValidCount(11, 10),
    HttpError,
    "count exceeds maximum of 10",
  );
});

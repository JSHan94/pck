import {
  assertEquals,
  assertThrows,
} from "std/testing/asserts.ts";
import { requireUser } from "./userAuth.ts";
import { HttpError } from "./errors.ts";

function makeRequest(headers: HeadersInit = {}): Request {
  return new Request("https://example.com", { headers });
}

Deno.test("requireUser normalizes mixed-case wallet addresses", () => {
  const request = makeRequest({
    "x-user-address": " 0xABCDEF1234567890ABCDEF1234567890ABCDEF12 ",
  });

  const context = requireUser(request);
  assertEquals(
    context.address,
    "0xabcdef1234567890abcdef1234567890abcdef12",
  );
});

Deno.test("requireUser rejects missing header", () => {
  assertThrows(
    () => requireUser(makeRequest()),
    HttpError,
    "Unauthorized",
  );
});

Deno.test("requireUser rejects invalid wallet strings", () => {
  const request = makeRequest({
    "x-user-address": "not-a-wallet",
  });

  assertThrows(
    () => requireUser(request),
    HttpError,
    "Unauthorized",
  );
});

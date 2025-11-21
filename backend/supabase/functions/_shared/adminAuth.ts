import { forbidden, HttpError, unauthorized } from "./errors.ts";

export type AdminContext = {
  address: string;
};

const ADMIN_ADDRESSES: Set<string> = new Set(
  (Deno.env.get("ADMIN_WALLET_ADDRESSES") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const ADMIN_API_KEY = Deno.env.get("ADMIN_API_KEY")?.trim();

export function requireAdmin(request: Request): AdminContext {
  const addressHeader = request.headers.get("x-user-address");
  if (!addressHeader) {
    throw unauthorized("Missing x-user-address header");
  }

  if (!ADMIN_ADDRESSES.size) {
    throw misconfigured(
      "ADMIN_WALLET_ADDRESSES is not configured on the Edge Function",
    );
  }

  const normalizedAddress = addressHeader.trim().toLowerCase();
  if (!ADMIN_ADDRESSES.has(normalizedAddress)) {
    throw forbidden("Address is not authorized for admin API");
  }

  if (ADMIN_API_KEY) {
    const providedKey = request.headers.get("x-admin-api-key")?.trim();
    if (!providedKey || providedKey !== ADMIN_API_KEY) {
      throw forbidden("Invalid admin API key");
    }
  }

  return { address: normalizedAddress };
}

function misconfigured(message: string): HttpError {
  return new HttpError(500, message, "MISCONFIGURED");
}

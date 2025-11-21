import { unauthorized } from "./errors.ts";

export type UserContext = {
  address: string;
};

export function requireUser(request: Request): UserContext {
  const addressHeader = request.headers.get("x-user-address");
  if (!addressHeader) {
    throw unauthorized("Missing x-user-address header");
  }

  const normalized = normalizeAddress(addressHeader);
  return { address: normalized };
}

function normalizeAddress(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    throw unauthorized("Invalid wallet address");
  }
  return normalized;
}

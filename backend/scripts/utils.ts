import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function fileExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

export function loadEnvFile(path: string): void {
  if (!fileExists(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    const value = rawValue.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[key] = value;
  }
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value;
}

export function pathFromRoot(...segments: string[]): string {
  return join(packageRoot, ...segments);
}

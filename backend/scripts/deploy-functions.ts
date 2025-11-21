#!/usr/bin/env -S node --import tsx
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileExists, loadEnvFile, pathFromRoot } from "./utils.ts";

loadEnvFile(pathFromRoot(".env"));

const projectRef =
  process.env.SUPABASE_PROJECT_ID ?? process.env.SUPABASE_PROJECT_REF;

if (!projectRef) {
  console.error(
    "❌ Missing SUPABASE_PROJECT_ID (or SUPABASE_PROJECT_REF) environment variable.",
  );
  process.exit(1);
}

const supabaseBin = process.env.SUPABASE_BIN ?? "supabase";
const supabaseDir = pathFromRoot("supabase");
const functionsDir = join(supabaseDir, "functions");
const envFile = join(supabaseDir, ".env");

const functionNames = readdirSync(functionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
  .map((entry) => entry.name)
  .sort();

if (functionNames.length === 0) {
  console.error("⚠️  No Edge Functions found to deploy.");
  process.exit(0);
}

console.log(
  `🚀 Deploying ${functionNames.length} functions to Supabase project ${projectRef}`,
);

for (const fnName of functionNames) {
  console.log(`\n▶️  Deploying function: ${fnName}`);
  const deployArgs: string[] = [
    "functions",
    "deploy",
    fnName,
    "--project-ref",
    projectRef,
  ];

  if (fileExists(envFile)) {
    deployArgs.push("--env-file", envFile);
  }

  const result = spawnSync(supabaseBin, deployArgs, {
    cwd: supabaseDir,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`❌ Failed to deploy ${fnName}:`, result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`❌ Supabase CLI exited with status ${result.status}.`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n✅ All Edge Functions deployed successfully.");

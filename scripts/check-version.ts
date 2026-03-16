#!/usr/bin/env node

/**
 * Verify that the version in src/version.ts matches package.json.
 * Run as part of linting to catch mismatches early.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
const versionFile = readFileSync(resolve("src/version.ts"), "utf-8");
const match = versionFile.match(/export const VERSION = "(.+)"/);

if (!match) {
  console.error("Could not parse version from src/version.ts");
  process.exit(1);
}

if (match[1] !== pkg.version) {
  console.error(
    `Version mismatch: src/version.ts has "${match[1]}" but package.json has "${pkg.version}"`,
  );
  process.exit(1);
}

#!/usr/bin/env node

/**
 * Build a standalone binary using Rolldown + Node.js SEA (Single Executable Application).
 *
 * Usage: node scripts/build-binary.ts
 *
 * Steps:
 * 1. Bundle src/index.ts into a single JS file with Rolldown
 * 2. Generate a SEA blob using node --experimental-sea-config
 * 3. Copy the node binary and inject the blob
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

// Ensure dist exists
fs.mkdirSync(distDir, { recursive: true });

const seaConfig = {
  main: path.join(distDir, "bundle.cjs"),
  output: path.join(distDir, "sea-prep.blob"),
  disableExperimentalSEAWarning: true,
};

const seaConfigPath = path.join(distDir, "sea-config.json");
fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

// Step 1: Bundle with Rolldown
console.log("Bundling with rolldown...");
execSync(`npx rolldown src/index.ts --format cjs --file dist/bundle.cjs --platform node`, {
  cwd: root,
  stdio: "inherit",
});

// Step 2: Generate SEA blob
console.log("Generating SEA blob...");
execSync(`node --experimental-sea-config ${seaConfigPath}`, {
  cwd: root,
  stdio: "inherit",
});

// Step 3: Copy node binary and inject blob
const platform = process.platform;
const arch = process.arch;
const binaryName = `hype-${platform}-${arch}`;
const binaryPath = path.join(distDir, binaryName);

console.log(`Creating binary: ${binaryName}`);
fs.copyFileSync(process.execPath, binaryPath);

if (platform === "darwin") {
  // Remove code signature on macOS before injecting
  execSync(`codesign --remove-signature ${binaryPath}`, { stdio: "inherit" });
  execSync(
    `npx postject ${binaryPath} NODE_SEA_BLOB ${seaConfig.output} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA`,
    { cwd: root, stdio: "inherit" },
  );
  // Re-sign
  execSync(`codesign --sign - ${binaryPath}`, { stdio: "inherit" });
} else if (platform === "linux") {
  execSync(
    `npx postject ${binaryPath} NODE_SEA_BLOB ${seaConfig.output} --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
    { cwd: root, stdio: "inherit" },
  );
}

// Make executable
fs.chmodSync(binaryPath, 0o755);

console.log(`Binary created: ${binaryPath}`);

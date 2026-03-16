import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("version", () => {
  it("should export a hardcoded version string, not read package.json at runtime", () => {
    const indexSource = readFileSync(resolve("src/index.ts"), "utf-8");

    // The version should NOT be read from package.json at runtime,
    // because that breaks in SEA binaries where import.meta.url
    // resolves to the binary's install path.
    expect(indexSource).not.toMatch(/readFileSync.*package\.json/);
  });

  it("should have a version that matches package.json", async () => {
    const { VERSION } = await import("../src/version.js");
    const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
    expect(VERSION).toBe(pkg.version);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  readConfig,
  writeConfig,
  getToken,
  setToken,
  clearToken,
  getApiUrl,
  setOAuthTokens,
  getRefreshToken,
  getClientId,
  resetConfigCache,
  getConfigPath,
} from "../src/lib/config.js";

let tmpDir: string;
let originalHome: string | undefined;
let originalEnv: { token?: string; apiUrl?: string };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hypedoc-test-"));
  originalHome = process.env.HOME;
  originalEnv = {
    token: process.env.HYPEDOC_TOKEN,
    apiUrl: process.env.HYPEDOC_API_URL,
  };
  process.env.HOME = tmpDir;
  delete process.env.HYPEDOC_TOKEN;
  delete process.env.HYPEDOC_API_URL;
  resetConfigCache();
});

afterEach(() => {
  process.env.HOME = originalHome;
  if (originalEnv.token !== undefined) {
    process.env.HYPEDOC_TOKEN = originalEnv.token;
  } else {
    delete process.env.HYPEDOC_TOKEN;
  }
  if (originalEnv.apiUrl !== undefined) {
    process.env.HYPEDOC_API_URL = originalEnv.apiUrl;
  } else {
    delete process.env.HYPEDOC_API_URL;
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("config", () => {
  it("returns empty config when no file exists", () => {
    const config = readConfig();
    expect(config).toEqual({});
  });

  it("writes and reads config", () => {
    writeConfig({ token: "test-token-123" });
    const config = readConfig();
    expect(config.token).toBe("test-token-123");
  });

  it("getToken returns undefined when no token set", () => {
    expect(getToken()).toBeUndefined();
  });

  it("getToken returns token from env var", () => {
    process.env.HYPEDOC_TOKEN = "env-token";
    expect(getToken()).toBe("env-token");
  });

  it("env var token takes precedence over config file", () => {
    setToken("file-token");
    process.env.HYPEDOC_TOKEN = "env-token";
    expect(getToken()).toBe("env-token");
  });

  it("setToken and getToken round-trip", () => {
    setToken("my-token");
    expect(getToken()).toBe("my-token");
  });

  it("clearToken removes token", () => {
    setToken("to-remove");
    clearToken();
    expect(getToken()).toBeUndefined();
  });

  it("getApiUrl returns default when not configured", () => {
    expect(getApiUrl()).toBe("https://app.myhypedoc.com/api/v1");
  });

  it("getApiUrl returns env var when set", () => {
    process.env.HYPEDOC_API_URL = "http://localhost:3000/api/v1";
    expect(getApiUrl()).toBe("http://localhost:3000/api/v1");
  });
});

describe("OAuth token storage", () => {
  it("setOAuthTokens stores access token, refresh token, and client ID", () => {
    setOAuthTokens("access-123", "refresh-456", "client-789");
    expect(getToken()).toBe("access-123");
    expect(getRefreshToken()).toBe("refresh-456");
    expect(getClientId()).toBe("client-789");
  });

  it("setOAuthTokens handles undefined refresh token", () => {
    setOAuthTokens("access-123", undefined, "client-789");
    expect(getToken()).toBe("access-123");
    expect(getRefreshToken()).toBeUndefined();
    expect(getClientId()).toBe("client-789");
  });

  it("clearToken removes OAuth fields too", () => {
    setOAuthTokens("access-123", "refresh-456", "client-789");
    clearToken();
    expect(getToken()).toBeUndefined();
    expect(getRefreshToken()).toBeUndefined();
    expect(getClientId()).toBeUndefined();
  });
});

describe("config file permissions", () => {
  it("creates config directory and file", () => {
    setToken("test");
    expect(fs.existsSync(getConfigPath())).toBe(true);
  });

  it("config file has restrictive permissions", () => {
    setToken("secret-token");
    const stat = fs.statSync(getConfigPath());
    // 0o600 = owner read/write only
    const mode = stat.mode & 0o777;
    expect(mode).toBe(0o600);
  });
});

describe("config caching", () => {
  it("reads from cache on subsequent calls", () => {
    writeConfig({ token: "cached" });
    const first = readConfig();
    // Manually remove the file to prove cache is used
    fs.unlinkSync(getConfigPath());
    const second = readConfig();
    expect(second.token).toBe(first.token);
  });

  it("resetConfigCache forces a re-read", () => {
    writeConfig({ token: "old" });
    readConfig();
    // Write directly to bypass cache
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify({ token: "new" }));
    resetConfigCache();
    expect(readConfig().token).toBe("new");
  });
});

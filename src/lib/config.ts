import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface HypedocConfig {
  token?: string;
  refresh_token?: string;
  client_id?: string;
  api_url?: string;
}

const DEFAULT_API_URL = "https://app.myhypedoc.com/api/v1";

export function getConfigDir(): string {
  return path.join(os.homedir(), ".hypedoc");
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

let cachedConfig: HypedocConfig | null = null;

export function readConfig(): HypedocConfig {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(getConfigPath(), "utf-8");
    cachedConfig = JSON.parse(raw) as HypedocConfig;
    return cachedConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: HypedocConfig): void {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  cachedConfig = config;
}

export function getToken(): string | undefined {
  return process.env.HYPEDOC_TOKEN ?? readConfig().token;
}

export function setToken(token: string): void {
  const config = readConfig();
  config.token = token;
  writeConfig(config);
}

export function setOAuthTokens(
  accessToken: string,
  refreshToken: string | undefined,
  clientId: string,
): void {
  const config = readConfig();
  config.token = accessToken;
  config.refresh_token = refreshToken;
  config.client_id = clientId;
  writeConfig(config);
}

export function getClientId(): string | undefined {
  return readConfig().client_id;
}

export function getRefreshToken(): string | undefined {
  return readConfig().refresh_token;
}

export function clearToken(): void {
  const config = readConfig();
  delete config.token;
  delete config.refresh_token;
  delete config.client_id;
  writeConfig(config);
}

export function getApiUrl(): string {
  return process.env.HYPEDOC_API_URL ?? readConfig().api_url ?? DEFAULT_API_URL;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}

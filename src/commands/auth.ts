import { Command } from "commander";
import chalk from "chalk";
import open from "open";
import crypto from "node:crypto";
import http from "node:http";
import { getToken, setToken, setOAuthTokens, clearToken, getConfigPath } from "../lib/config.js";
import { formatSuccess, formatError, formatInfo } from "../lib/formatters.js";

const BASE_URL = "https://app.myhypedoc.com";

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return crypto.randomBytes(16).toString("base64url");
}

async function registerClient(redirectUri: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "Hype Doc CLI",
      redirect_uris: [redirectUri],
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Client registration failed");
  }

  if (!res.ok) {
    throw new Error((data.error_description as string) ?? "Client registration failed");
  }

  return data.client_id as string;
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ access_token: string; refresh_token?: string }> {
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Token exchange failed");
  }

  if (!res.ok) {
    throw new Error((data.error_description as string) ?? "Token exchange failed");
  }

  return data as unknown as { access_token: string; refresh_token?: string };
}

export const authCommand = new Command("auth").description("Manage authentication");

authCommand
  .command("login")
  .description("Authenticate via browser (OAuth flow)")
  .action(async () => {
    console.log(formatInfo("Starting browser authentication...\n"));

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Start a local server to receive the OAuth callback
    let timeout: ReturnType<typeof setTimeout>;
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost`);

      if (url.pathname !== "/callback") return;

      const error = url.searchParams.get("error");
      if (error) {
        const description = url.searchParams.get("error_description") ?? error;
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<html><body><h1>Authentication failed</h1><p>${description}</p></body></html>`);
        console.log(formatError(`Authentication failed: ${description}`));
        clearTimeout(timeout);
        server.close();
        return;
      }

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");

      if (!code || returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(
          "<html><body><h1>Authentication failed</h1><p>Invalid or missing authorization code.</p></body></html>",
        );
        console.log(formatError("Authentication failed: invalid callback."));
        clearTimeout(timeout);
        server.close();
        return;
      }

      try {
        const tokens = await exchangeCodeForToken(code, clientId, redirectUri, codeVerifier);
        setOAuthTokens(tokens.access_token, tokens.refresh_token, clientId);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<html><body><h1>Authenticated!</h1><p>You can close this tab and return to your terminal.</p></body></html>",
        );
        console.log(formatSuccess("Authenticated successfully!\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Token exchange failed";
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`<html><body><h1>Authentication failed</h1><p>${message}</p></body></html>`);
        console.log(formatError(message));
      }

      clearTimeout(timeout);
      server.close();
    });

    let clientId: string;
    let redirectUri: string;

    server.listen(0, "127.0.0.1", async () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        console.log(formatError("Failed to start local server."));
        process.exit(1);
      }

      const port = address.port;
      redirectUri = `http://127.0.0.1:${port}/callback`;

      try {
        clientId = await registerClient(redirectUri);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        console.log(formatError(message));
        server.close();
        process.exit(1);
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        state,
        scope: "read write",
      });

      const authUrl = `${BASE_URL}/oauth/authorize?${params}`;

      console.log(formatInfo("Opening browser to authenticate..."));
      console.log(formatInfo("If the browser doesn't open, visit:\n"));
      console.log(`  ${chalk.underline(authUrl)}\n`);

      open(authUrl).catch(() => {
        // Browser open failed silently, the URL is printed above
      });
    });

    // Timeout after 2 minutes
    timeout = setTimeout(() => {
      console.log(formatError("Authentication timed out. Please try again."));
      server.close();
      process.exit(1);
    }, 120_000);
  });

authCommand
  .command("token <token>")
  .description("Set an API token directly (for CI/scripts)")
  .action((token: string) => {
    setToken(token);
    console.log(formatSuccess("API token saved."));
    console.log(formatInfo(`  Config: ${getConfigPath()}`));
  });

authCommand
  .command("status")
  .description("Show current authentication status")
  .action(() => {
    const token = getToken();

    if (token) {
      const masked = token.slice(0, 8) + "..." + token.slice(-4);
      console.log(formatSuccess("Authenticated"));
      console.log(formatInfo(`  Token: ${masked}`));
      console.log(formatInfo(`  Config: ${getConfigPath()}`));
    } else {
      console.log(formatError("Not authenticated."));
      console.log(
        formatInfo("  Run `hype auth login` or `hype auth token <token>` to authenticate."),
      );
    }
  });

authCommand
  .command("logout")
  .description("Remove stored authentication")
  .action(() => {
    clearToken();
    console.log(formatSuccess("Logged out. Token removed."));
  });

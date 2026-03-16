import { getApiUrl, getToken } from "./config.js";
import { formatError, formatInfo } from "./formatters.js";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `API request failed with status ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class AuthenticationError extends Error {
  constructor() {
    super(
      "Not authenticated. Run `hype auth login` or `hype auth token <token>` to set up authentication.",
    );
    this.name = "AuthenticationError";
  }
}

function requireToken(): string {
  const token = getToken();
  if (!token) {
    throw new AuthenticationError();
  }
  return token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = requireToken();
  const url = `${getApiUrl()}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let responseBody: unknown;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }
    throw new ApiError(response.status, responseBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Spaces --

export interface Space {
  id: string;
  name: string;
  emoji: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export function listSpaces(): Promise<Space[]> {
  return request<Space[]>("GET", "/spaces");
}

export interface CreateSpaceParams {
  name: string;
  emoji?: string;
}

export function createSpace(params: CreateSpaceParams): Promise<Space> {
  return request<Space>("POST", "/spaces", { space: params });
}

export interface UpdateSpaceParams {
  name?: string;
  emoji?: string;
}

export function updateSpace(id: string, params: UpdateSpaceParams): Promise<Space> {
  return request<Space>("PATCH", `/spaces/${id}`, { space: params });
}

export function deleteSpace(id: string): Promise<void> {
  return request<void>("DELETE", `/spaces/${id}`);
}

// -- Wins --

export interface Win {
  id: string;
  body_text: string;
  body_html: string;
  occurred_on: string;
  space: { id: string; name: string; emoji: string | null };
  tags: { id: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface ListWinsParams {
  space_id?: string;
  tag?: string;
  since?: string;
  until?: string;
  page?: number;
  per_page?: number;
}

export function listWins(params: ListWinsParams = {}): Promise<Win[]> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return request<Win[]>("GET", `/wins${qs ? `?${qs}` : ""}`);
}

export interface CreateWinParams {
  body: string;
  body_format?: "plain" | "html" | "markdown";
  space_id?: string;
  tag_names?: string[];
  occurred_on?: string;
}

export function createWin(params: CreateWinParams): Promise<Win> {
  return request<Win>("POST", "/wins", { win: params });
}

export function getWin(id: string): Promise<Win> {
  return request<Win>("GET", `/wins/${id}`);
}

export interface UpdateWinParams {
  body?: string;
  body_format?: "plain" | "html" | "markdown";
  space_id?: string;
  tag_names?: string[];
  occurred_on?: string;
}

export function updateWin(id: string, params: UpdateWinParams): Promise<Win> {
  return request<Win>("PATCH", `/wins/${id}`, { win: params });
}

export function deleteWin(id: string): Promise<void> {
  return request<void>("DELETE", `/wins/${id}`);
}

// -- Tags --

export interface Tag {
  id: string;
  name: string;
}

export function listTags(): Promise<Tag[]> {
  return request<Tag[]>("GET", "/tags");
}

export function updateTag(id: string, name: string): Promise<Tag> {
  return request<Tag>("PATCH", `/tags/${id}`, { tag: { name } });
}

export function deleteTag(id: string): Promise<void> {
  return request<void>("DELETE", `/tags/${id}`);
}

// -- Resolve space name to ID --

async function resolveSpaceId(spaceName: string): Promise<string | null> {
  const spaces = await listSpaces();
  const match = spaces.find((s) => s.name.toLowerCase() === spaceName.toLowerCase());
  return match?.id ?? null;
}

export async function requireSpaceId(spaceName: string): Promise<string> {
  const id = await resolveSpaceId(spaceName);
  if (!id) {
    console.log(formatError(`Space "${spaceName}" not found.`));
    console.log(formatInfo("  Run `hype spaces` to see available spaces."));
    process.exit(1);
  }
  return id;
}

export async function requireTagByName(tagName: string): Promise<Tag> {
  const tags = await listTags();
  const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
  if (!tag) {
    console.log(formatError(`Tag "${tagName}" not found.`));
    console.log(formatInfo("  Run `hype tags` to see available tags."));
    process.exit(1);
  }
  return tag;
}

export function withErrorHandling(
  fn: (...args: unknown[]) => Promise<void>,
): (...args: unknown[]) => Promise<void> {
  return async function (this: unknown, ...args: unknown[]) {
    try {
      await fn.apply(this, args);
    } catch (error) {
      if (error instanceof Error) {
        console.log(formatError(error.message));
      } else {
        console.log(formatError(String(error)));
      }
      process.exit(1);
    }
  };
}

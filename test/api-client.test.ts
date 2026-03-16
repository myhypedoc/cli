import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiError, AuthenticationError } from "../src/lib/api-client.js";

let originalToken: string | undefined;

beforeEach(() => {
  originalToken = process.env.HYPEDOC_TOKEN;
  process.env.HYPEDOC_TOKEN = "test-token";
});

afterEach(() => {
  if (originalToken !== undefined) {
    process.env.HYPEDOC_TOKEN = originalToken;
  } else {
    delete process.env.HYPEDOC_TOKEN;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ApiError", () => {
  it("extracts message from JSON error body", () => {
    const error = new ApiError(422, { error: "Name is too long" });
    expect(error.message).toBe("Name is too long");
    expect(error.status).toBe(422);
    expect(error.body).toEqual({ error: "Name is too long" });
  });

  it("uses generic message when body has no error field", () => {
    const error = new ApiError(500, { detail: "something" });
    expect(error.message).toBe("API request failed with status 500");
  });

  it("uses generic message for string body", () => {
    const error = new ApiError(502, "Bad Gateway");
    expect(error.message).toBe("API request failed with status 502");
    expect(error.body).toBe("Bad Gateway");
  });

  it("uses generic message for null body", () => {
    const error = new ApiError(500, null);
    expect(error.message).toBe("API request failed with status 500");
  });
});

describe("AuthenticationError", () => {
  it("has a helpful message", () => {
    const error = new AuthenticationError();
    expect(error.message).toContain("hype auth login");
    expect(error.name).toBe("AuthenticationError");
  });
});

describe("request", () => {
  it("handles non-JSON error responses without double body read", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Internal Server Error", {
          status: 500,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    );

    const { listWins } = await import("../src/lib/api-client.js");

    try {
      await listWins();
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiError = err as ApiError;
      expect(apiError.status).toBe(500);
      expect(apiError.body).toBe("Internal Server Error");
    }
  });

  it("parses JSON error responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Validation failed" }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { listSpaces } = await import("../src/lib/api-client.js");

    try {
      await listSpaces();
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiError = err as ApiError;
      expect(apiError.status).toBe(422);
      expect(apiError.message).toBe("Validation failed");
    }
  });

  it("sends Authorization header and correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { listSpaces } = await import("../src/lib/api-client.js");
    await listSpaces();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://app.myhypedoc.com/api/v1/spaces",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          Accept: "application/json",
        }),
      }),
    );
  });

  it("sends JSON body for POST requests", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "w1", body_text: "test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { createWin } = await import("../src/lib/api-client.js");
    await createWin({ body: "test", body_format: "markdown" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/wins"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: expect.stringContaining('"body":"test"'),
      }),
    );
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const { deleteWin } = await import("../src/lib/api-client.js");
    const result = await deleteWin("some-id");
    expect(result).toBeUndefined();
  });

  it("throws AuthenticationError when no token is set", async () => {
    // Remove env token and point HOME to a temp dir with no config file
    delete process.env.HYPEDOC_TOKEN;
    const tmpDir = (await import("node:fs")).mkdtempSync(
      (await import("node:path")).join((await import("node:os")).tmpdir(), "hype-test-"),
    );
    const originalHome = process.env.HOME;
    process.env.HOME = tmpDir;

    const { resetConfigCache } = await import("../src/lib/config.js");
    resetConfigCache();

    const { listWins } = await import("../src/lib/api-client.js");

    try {
      await expect(listWins()).rejects.toThrow(AuthenticationError);
    } finally {
      process.env.HOME = originalHome;
      resetConfigCache();
      (await import("node:fs")).rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("builds query string for listWins params", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { listWins } = await import("../src/lib/api-client.js");
    await listWins({ space_id: "s1", tag: "impact", per_page: 10 });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("space_id")).toBe("s1");
    expect(url.searchParams.get("tag")).toBe("impact");
    expect(url.searchParams.get("per_page")).toBe("10");
  });

  it("omits undefined params from query string", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", mockFetch);

    const { listWins } = await import("../src/lib/api-client.js");
    await listWins({ tag: "impact" });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    const url = new URL(calledUrl);
    expect(url.searchParams.get("tag")).toBe("impact");
    expect(url.searchParams.has("space_id")).toBe(false);
    expect(url.searchParams.has("per_page")).toBe(false);
  });
});

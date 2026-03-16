import { describe, it, expect } from "vitest";
import type { Win, Space, Tag } from "../src/lib/api-client.js";

import {
  formatWin,
  formatWinList,
  formatWinDetail,
  formatWinConfirmation,
  formatSpaceList,
  formatTagList,
  formatSuccess,
  formatError,
  formatInfo,
} from "../src/lib/formatters.js";

const sampleWin: Win = {
  id: "abc12345-6789-0000-0000-000000000000",
  body_text: "Shipped the new dashboard",
  body_html: "<p>Shipped the new dashboard</p>",
  occurred_on: "2026-01-15",
  space: { id: "s1", name: "Work", emoji: null },
  tags: [
    { id: "t1", name: "impact" },
    { id: "t2", name: "product" },
  ],
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
};

const sampleSpace: Space = {
  id: "s1",
  name: "Work",
  emoji: null,
  position: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const sampleTag: Tag = {
  id: "t1",
  name: "impact",
};

describe("formatWinList", () => {
  it("shows wins with body and date", () => {
    const output = formatWinList([sampleWin]);
    expect(output).toContain("Shipped the new dashboard");
    expect(output).toContain("2026-01-15");
  });

  it("shows empty message for no wins", () => {
    const output = formatWinList([]);
    expect(output).toContain("No wins found");
  });
});

describe("formatWin", () => {
  it("shows truncated ID", () => {
    const output = formatWin(sampleWin);
    expect(output).toContain("abc12345");
  });

  it("shows tags", () => {
    const output = formatWin(sampleWin);
    expect(output).toContain("impact");
    expect(output).toContain("product");
  });

  it("shows space name", () => {
    const output = formatWin(sampleWin);
    expect(output).toContain("Work");
  });

  it("handles win with no tags", () => {
    const win = { ...sampleWin, tags: [] };
    const output = formatWin(win);
    expect(output).toContain("Shipped the new dashboard");
    expect(output).not.toContain("[");
  });

  it("handles win with no space", () => {
    const win = { ...sampleWin, space: { id: "", name: "", emoji: null } };
    const output = formatWin(win);
    expect(output).toContain("Shipped the new dashboard");
  });

  it("shows space emoji when present", () => {
    const win = { ...sampleWin, space: { id: "s1", name: "Work", emoji: "💼" } };
    const output = formatWin(win);
    expect(output).toContain("💼");
  });
});

describe("formatWinDetail", () => {
  it("shows full ID", () => {
    const output = formatWinDetail(sampleWin);
    expect(output).toContain("abc12345-6789-0000-0000-000000000000");
  });

  it("shows date, space, tags, and body", () => {
    const output = formatWinDetail(sampleWin);
    expect(output).toContain("2026-01-15");
    expect(output).toContain("Work");
    expect(output).toContain("impact");
    expect(output).toContain("Shipped the new dashboard");
  });

  it("shows empty space line when space has no name", () => {
    const win = { ...sampleWin, space: { id: "", name: "", emoji: null } };
    const output = formatWinDetail(win);
    // Space line is present but empty since the win still has a space object
    expect(output).toContain("Space:");
  });

  it("omits tags line when no tags", () => {
    const win = { ...sampleWin, tags: [] };
    const output = formatWinDetail(win);
    expect(output).not.toContain("Tags:");
  });
});

describe("formatWinConfirmation", () => {
  it("includes space name", () => {
    const output = formatWinConfirmation(sampleWin);
    expect(output).toContain("in Work");
  });

  it("includes tags", () => {
    const output = formatWinConfirmation(sampleWin);
    expect(output).toContain("impact");
    expect(output).toContain("product");
  });

  it("handles win with no tags or space", () => {
    const win = {
      ...sampleWin,
      space: { id: "", name: "", emoji: null },
      tags: [],
    };
    const output = formatWinConfirmation(win);
    expect(output).toContain("Win logged");
    expect(output).not.toContain("[");
  });
});

describe("formatSpaceList", () => {
  it("shows spaces", () => {
    const output = formatSpaceList([sampleSpace]);
    expect(output).toContain("Work");
  });

  it("shows empty message for no spaces", () => {
    const output = formatSpaceList([]);
    expect(output).toContain("No spaces yet");
  });

  it("shows emoji when present", () => {
    const space = { ...sampleSpace, emoji: "🚀" };
    const output = formatSpaceList([space]);
    expect(output).toContain("🚀");
  });
});

describe("formatTagList", () => {
  it("shows tags", () => {
    const output = formatTagList([sampleTag]);
    expect(output).toContain("impact");
  });

  it("shows empty message for no tags", () => {
    const output = formatTagList([]);
    expect(output).toContain("No tags yet");
  });

  it("shows multiple tags", () => {
    const tags = [sampleTag, { id: "t2", name: "product" }];
    const output = formatTagList(tags);
    expect(output).toContain("impact");
    expect(output).toContain("product");
  });
});

describe("utility formatters", () => {
  it("formatSuccess includes the message", () => {
    const output = formatSuccess("Win logged");
    expect(output).toContain("Win logged");
  });

  it("formatError includes the message", () => {
    const output = formatError("Something went wrong");
    expect(output).toContain("Something went wrong");
  });

  it("formatError includes error prefix", () => {
    const output = formatError("bad thing");
    expect(output).toContain("error:");
  });

  it("formatInfo returns dimmed text", () => {
    const output = formatInfo("some hint");
    expect(output).toContain("some hint");
  });
});

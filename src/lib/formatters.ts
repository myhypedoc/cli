import chalk from "chalk";
import type { Win, Space, Tag } from "./api-client.js";

const sage = chalk.hex("#7FB685");
const dim = chalk.dim;
const bold = chalk.bold;

export function formatWin(win: Win): string {
  const id = dim(win.id.slice(0, 8));
  const date = dim(win.occurred_on);
  const space = win.space ? sage(`${win.space.emoji ?? ""} ${win.space.name}`.trim()) : "";
  const tags = win.tags.length > 0 ? dim(` [${win.tags.map((t) => t.name).join(", ")}]`) : "";

  return `  ${id}  ${date}  ${space}${tags}\n  ${win.body_text}\n`;
}

export function formatWinDetail(win: Win): string {
  const id = dim(`ID: ${win.id}`);
  const date = `Date: ${win.occurred_on}`;
  const space = win.space ? `Space: ${win.space.emoji ?? ""} ${win.space.name}`.trim() : "";
  const tags = win.tags.length > 0 ? `Tags: ${win.tags.map((t) => t.name).join(", ")}` : "";

  const lines = [id, date];
  if (space) lines.push(space);
  if (tags) lines.push(tags);
  lines.push("", win.body_text);

  return `\n${lines.map((l) => `  ${l}`).join("\n")}\n`;
}

export function formatWinList(wins: Win[]): string {
  if (wins.length === 0) {
    return dim("  No wins found.\n");
  }

  const lines = wins.map(formatWin);
  return `\n${lines.join("\n")}`;
}

export function formatSpace(space: Space): string {
  const emoji = space.emoji ?? " ";
  return `  ${emoji}  ${bold(space.name)}`;
}

export function formatSpaceList(spaces: Space[]): string {
  if (spaces.length === 0) {
    return dim("  No spaces yet. Create one in the web app.\n");
  }

  const header = bold("\n  Your Spaces\n");
  const lines = spaces.map(formatSpace);
  return `${header}\n${lines.join("\n")}\n`;
}

export function formatTag(tag: Tag): string {
  return `  ${sage("#")}${bold(tag.name)}`;
}

export function formatTagList(tags: Tag[]): string {
  if (tags.length === 0) {
    return dim("  No tags yet. Add tags when logging a win with --tags.\n");
  }

  const header = bold("\n  Your Tags\n");
  const lines = tags.map(formatTag);
  return `${header}\n${lines.join("\n")}\n`;
}

export function formatWinConfirmation(win: Win): string {
  const spaceName = win.space ? ` in ${win.space.name}` : "";
  const tags = win.tags.length > 0 ? ` [${win.tags.map((t) => t.name).join(", ")}]` : "";
  return formatSuccess(`Win logged${spaceName}${tags}`);
}

export function formatSuccess(message: string): string {
  return `${sage("+")} ${message}`;
}

export function formatError(message: string): string {
  return `${chalk.red("error:")} ${message}`;
}

export function formatInfo(message: string): string {
  return dim(message);
}

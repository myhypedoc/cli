import { Command } from "commander";
import {
  listWins,
  getWin,
  updateWin,
  deleteWin,
  requireSpaceId,
  withErrorHandling,
} from "../lib/api-client.js";
import {
  formatWinList,
  formatWinDetail,
  formatSuccess,
  formatError,
  formatInfo,
} from "../lib/formatters.js";

function parseDuration(duration: string): string {
  const match = duration.match(/^(\d+)([dhwm])$/);
  if (!match) {
    throw new Error(`Invalid duration "${duration}". Use format like 7d, 2w, 1m, 24h.`);
  }

  const [, amount, unit] = match;
  const now = new Date();

  switch (unit) {
    case "h":
      now.setHours(now.getHours() - parseInt(amount!, 10));
      break;
    case "d":
      now.setDate(now.getDate() - parseInt(amount!, 10));
      break;
    case "w":
      now.setDate(now.getDate() - parseInt(amount!, 10) * 7);
      break;
    case "m":
      now.setMonth(now.getMonth() - parseInt(amount!, 10));
      break;
  }

  return now.toISOString().split("T")[0]!;
}

async function resolveWinId(idPrefix: string): Promise<string> {
  // Full UUID: try direct fetch first to avoid listing
  if (/^[0-9a-f-]{36}$/i.test(idPrefix)) {
    const win = await getWin(idPrefix);
    return win.id;
  }

  const wins = await listWins({ per_page: 100 });
  const matches = wins.filter((w) => w.id.startsWith(idPrefix));

  if (matches.length === 0) {
    console.log(formatError(`No win found matching "${idPrefix}".`));
    console.log(formatInfo("  Run `hype wins` to see your wins and their IDs."));
    process.exit(1);
  }

  if (matches.length > 1) {
    console.log(formatError(`Multiple wins match "${idPrefix}". Please use a longer ID prefix.`));
    process.exit(1);
  }

  return matches[0]!.id;
}

export const winsCommand = new Command("wins")
  .description("List and manage your wins")
  .option("-s, --space <name>", "Filter by space name")
  .option("-l, --last <duration>", "Show wins from last period (e.g. 7d, 2w, 1m)")
  .option("-t, --tag <name>", "Filter by tag name")
  .option("-n, --limit <count>", "Maximum number of wins to show", "20")
  .action(
    withErrorHandling(async function (this: Command) {
      const options = this.opts<{ space?: string; last?: string; tag?: string; limit: string }>();

      const spaceId = options.space ? await requireSpaceId(options.space) : undefined;
      const since = options.last ? parseDuration(options.last) : undefined;

      const wins = await listWins({
        space_id: spaceId,
        tag: options.tag,
        since,
        per_page: parseInt(options.limit, 10),
      });

      console.log(formatWinList(wins));
    }),
  );

winsCommand
  .command("show <id>")
  .description("Show details of a specific win")
  .action(
    withErrorHandling(async function (this: Command) {
      const winId = await resolveWinId(this.args[0]!);
      const win = await getWin(winId);
      console.log(formatWinDetail(win));
    }),
  );

winsCommand
  .command("edit <id>")
  .description("Edit a win")
  .option("-b, --body <text>", "New text for the win")
  .option("-s, --space <name>", "Move to a different space")
  .option("-t, --tags <tags>", "Replace tags (comma-separated)")
  .option("-d, --date <date>", "Change the date (YYYY-MM-DD)")
  .action(
    withErrorHandling(async function (this: Command) {
      const id = this.args[0]!;
      const options = this.opts<{
        body?: string;
        space?: string;
        tags?: string;
        date?: string;
      }>();

      if (!options.body && !options.space && !options.tags && !options.date) {
        console.log(
          formatError("Provide at least one option to update (--body, --space, --tags, --date)."),
        );
        process.exit(1);
      }

      const winId = await resolveWinId(id);
      const spaceId = options.space ? await requireSpaceId(options.space) : undefined;
      const tagNames = options.tags ? options.tags.split(",").map((t) => t.trim()) : undefined;

      const win = await updateWin(winId, {
        body: options.body,
        body_format: options.body ? "markdown" : undefined,
        space_id: spaceId,
        tag_names: tagNames,
        occurred_on: options.date,
      });

      const spaceName = win.space ? ` in ${win.space.name}` : "";
      console.log(formatSuccess(`Win updated${spaceName}.`));
    }),
  );

winsCommand
  .command("delete <id>")
  .description("Delete a win")
  .action(
    withErrorHandling(async function (this: Command) {
      const winId = await resolveWinId(this.args[0]!);
      await deleteWin(winId);
      console.log(formatSuccess("Win deleted."));
    }),
  );

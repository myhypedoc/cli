import { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";
import {
  createWin,
  listSpaces,
  listTags,
  requireSpaceId,
  withErrorHandling,
} from "../lib/api-client.js";
import { formatWinConfirmation } from "../lib/formatters.js";

async function interactiveLog() {
  const text = await input({
    message: chalk.bold("What did you accomplish?"),
    validate: (value) => (value.trim() ? true : "Please describe your win."),
  });

  const [spaces, tags] = await Promise.all([listSpaces(), listTags()]);

  let spaceId: string | undefined;
  if (spaces.length > 0) {
    const spaceChoices = spaces.map((s) => ({
      name: s.emoji ? `${s.emoji} ${s.name}` : s.name,
      value: s.id,
    }));

    spaceId = await select({
      message: "Which space?",
      choices: spaceChoices,
    });
  }

  const tagNames: string[] = [];
  while (true) {
    const availableTags = tags.map((t) => t.name).filter((name) => !tagNames.includes(name));

    const choices: { name: string; value: string }[] = [
      { name: chalk.dim("Create a new tag"), value: "__new__" },
      ...availableTags.map((name) => ({ name, value: name })),
    ];

    const doneLabel = tagNames.length > 0 ? `Done (${tagNames.join(", ")})` : "Skip";

    choices.unshift({ name: chalk.dim(doneLabel), value: "__done__" });

    const picked = await select({
      message: tagNames.length > 0 ? "Add another tag?" : "Tags",
      choices,
    });

    if (picked === "__done__") break;

    if (picked === "__new__") {
      const newTag = await input({
        message: "New tag name:",
        validate: (value) => {
          const trimmed = value.trim();
          if (!trimmed) return "Tag name cannot be empty.";
          if (trimmed.length > 25) return "Tag name must be 25 characters or fewer.";
          if (tagNames.includes(trimmed)) return "Tag already added.";
          return true;
        },
      });
      tagNames.push(newTag.trim());
    } else {
      tagNames.push(picked);
    }
  }

  const today = new Date().toISOString().split("T")[0]!;
  const dateChoice = await select({
    message: "When did this happen?",
    choices: [
      { name: `Today (${today})`, value: "today" },
      { name: "Another date", value: "other" },
    ],
  });

  let occurredOn = today;
  if (dateChoice === "other") {
    occurredOn = await input({
      message: "Date (YYYY-MM-DD):",
      validate: (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
          return "Please use YYYY-MM-DD format.";
        }
        const date = new Date(value.trim());
        if (isNaN(date.getTime())) return "Invalid date.";
        if (date > new Date()) return "Date cannot be in the future.";
        return true;
      },
    });
    occurredOn = occurredOn.trim();
  }

  const win = await createWin({
    body: text,
    body_format: "markdown",
    space_id: spaceId,
    tag_names: tagNames.length > 0 ? tagNames : undefined,
    occurred_on: occurredOn,
  });

  console.log(formatWinConfirmation(win));
}

export const logCommand = new Command("log")
  .description("Log a new win")
  .argument("[text]", "What you accomplished")
  .option("-s, --space <name>", "Space to log the win in")
  .option("-t, --tags <tags>", "Comma-separated tags (e.g. impact,product)")
  .option("-d, --date <date>", "Date of the win (YYYY-MM-DD, default: today)")
  .action(
    withErrorHandling(async function (this: Command) {
      const text = this.args[0];
      const options = this.opts<{
        space?: string;
        tags?: string;
        date?: string;
      }>();

      // Interactive mode when no arguments provided
      if (!text && !options.space && !options.tags && !options.date) {
        await interactiveLog();
        return;
      }

      if (!text) {
        console.log(
          chalk.red("error:") +
            " Please provide the win text or run without arguments for interactive mode.",
        );
        process.exit(1);
      }

      const spaceId = options.space ? await requireSpaceId(options.space) : undefined;

      const tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : undefined;

      const win = await createWin({
        body: text,
        body_format: "markdown",
        space_id: spaceId,
        tag_names: tags,
        occurred_on: options.date ?? new Date().toISOString().split("T")[0]!,
      });

      console.log(formatWinConfirmation(win));
    }),
  );

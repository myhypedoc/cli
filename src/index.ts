#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { logCommand } from "./commands/log.js";
import { winsCommand } from "./commands/wins.js";
import { spacesCommand } from "./commands/spaces.js";
import { tagsCommand } from "./commands/tags.js";
import { authCommand } from "./commands/auth.js";
import { AuthenticationError, ApiError } from "./lib/api-client.js";
import { formatError } from "./lib/formatters.js";

const program = new Command();

program
  .name("hype")
  .description("Hype Doc CLI — log and track your wins from the terminal")
  .version("0.1.0")
  .configureOutput({
    outputError: (str) => process.stderr.write(formatError(str) + "\n"),
  });

program.addCommand(logCommand);
program.addCommand(winsCommand);
program.addCommand(spacesCommand);
program.addCommand(tagsCommand);
program.addCommand(authCommand);

// Global error handling
program.hook("preAction", () => {
  // Set up a global unhandled rejection handler for nicer output
  process.on("unhandledRejection", (reason) => {
    if (reason instanceof AuthenticationError) {
      console.error(formatError(reason.message));
      process.exit(1);
    }
    if (reason instanceof ApiError) {
      if (reason.status === 401) {
        console.error(
          formatError("Authentication failed. Run `hype auth login` to re-authenticate."),
        );
      } else if (reason.status === 402) {
        console.error(
          formatError(
            "Win limit reached on free plan. Upgrade at https://app.myhypedoc.com/billing",
          ),
        );
      } else if (reason.status === 429) {
        console.error(formatError("Rate limited. Please wait a moment and try again."));
      } else {
        console.error(formatError(reason.message));
      }
      process.exit(1);
    }
    if (reason instanceof Error) {
      console.error(formatError(reason.message));
      process.exit(1);
    }
  });
});

program.addHelpText(
  "after",
  `
${chalk.dim("Examples:")}
  ${chalk.dim("$")} hype log "Shipped the new dashboard" --space work --tags impact,product
  ${chalk.dim("$")} hype wins --space work --last 7d
  ${chalk.dim("$")} hype spaces
  ${chalk.dim("$")} hype tags
  ${chalk.dim("$")} hype auth login

${chalk.dim("Config:")} ~/.hypedoc/config.json
${chalk.dim("Docs:")}   https://docs.myhypedoc.com
`,
);

program.parse();

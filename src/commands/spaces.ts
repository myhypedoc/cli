import { Command } from "commander";
import {
  listSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  requireSpaceId,
  withErrorHandling,
} from "../lib/api-client.js";
import { formatSpaceList, formatSuccess } from "../lib/formatters.js";

export const spacesCommand = new Command("spaces")
  .description("List and manage your spaces")
  .action(
    withErrorHandling(async () => {
      const spaces = await listSpaces();
      console.log(formatSpaceList(spaces));
    }),
  );

spacesCommand
  .command("create <name>")
  .description("Create a new space")
  .option("-e, --emoji <emoji>", "Emoji for the space")
  .action(
    withErrorHandling(async function (this: Command) {
      const name = this.args[0]!;
      const options = this.opts<{ emoji?: string }>();
      const space = await createSpace({ name, emoji: options.emoji });
      const display = space.emoji ? `${space.emoji} ${space.name}` : space.name;
      console.log(formatSuccess(`Space "${display}" created.`));
    }),
  );

spacesCommand
  .command("rename <name> <new-name>")
  .description("Rename a space")
  .option("-e, --emoji <emoji>", "Change the emoji")
  .action(
    withErrorHandling(async function (this: Command) {
      const [name, newName] = this.args as [string, string];
      const options = this.opts<{ emoji?: string }>();
      const id = await requireSpaceId(name);
      const params: { name?: string; emoji?: string } = {};
      if (newName !== name) params.name = newName;
      if (options.emoji) params.emoji = options.emoji;
      const space = await updateSpace(id, params);
      const display = space.emoji ? `${space.emoji} ${space.name}` : space.name;
      console.log(formatSuccess(`Space updated to "${display}".`));
    }),
  );

spacesCommand
  .command("delete <name>")
  .description("Delete a space and all its wins")
  .action(
    withErrorHandling(async function (this: Command) {
      const name = this.args[0]!;
      const id = await requireSpaceId(name);
      await deleteSpace(id);
      console.log(formatSuccess(`Space "${name}" deleted.`));
    }),
  );

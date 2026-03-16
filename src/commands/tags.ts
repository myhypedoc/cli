import { Command } from "commander";
import {
  listTags,
  updateTag,
  deleteTag,
  requireTagByName,
  withErrorHandling,
} from "../lib/api-client.js";
import { formatTagList, formatSuccess } from "../lib/formatters.js";

export const tagsCommand = new Command("tags").description("List and manage your tags").action(
  withErrorHandling(async () => {
    const tags = await listTags();
    console.log(formatTagList(tags));
  }),
);

tagsCommand
  .command("rename <old-name> <new-name>")
  .description("Rename a tag")
  .action(
    withErrorHandling(async function (this: Command) {
      const [oldName, newName] = this.args as [string, string];
      const tag = await requireTagByName(oldName);
      await updateTag(tag.id, newName);
      console.log(formatSuccess(`Tag "${oldName}" renamed to "${newName}".`));
    }),
  );

tagsCommand
  .command("delete <name>")
  .description("Delete a tag (wins are kept, only the tag is removed)")
  .action(
    withErrorHandling(async function (this: Command) {
      const name = this.args[0]!;
      const tag = await requireTagByName(name);
      await deleteTag(tag.id);
      console.log(formatSuccess(`Tag "${name}" deleted.`));
    }),
  );

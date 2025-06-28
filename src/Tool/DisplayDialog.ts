import { z } from 'zod';
import * as Cli from '../Data/Cli';
import { Tool } from '../Data/Tool';
import { ok } from 'elytra-ts';
import { Done, doneSchema } from '../Data/Zod';

const paramsSchema = z.object({
  message: z.string().describe('Message to display inside the dialog')
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `display_dialog`,
  instruction: `
# Display user computer dialog:
- Use the **display_dialog** tool to display a dialog message in the user's computer.
`,
  fn: async ({ message }) => {
    const script = `display dialog "${message.replace(/"/g, '\\"')}" with title "Alpha"`;
    const command = `osascript -e '${script}'`;
    await Cli.execute(command);
    return ok('Done');
  },
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

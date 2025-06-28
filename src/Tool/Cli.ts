import { z } from 'zod';
import * as Cli from '../Data/Cli';
import { Tool } from '../Data/Tool';

const paramsSchema = z.object({
  command: z.string().describe('The command to execute, e.g., "git status"')
});
type Params = z.infer<typeof paramsSchema>;

const valueSchema = z.string().describe('The stdout of the executed command');
type Value = z.infer<typeof valueSchema>;

const tool: Tool<Params, Value> = {
  name: `run_cli`,
  instruction: `
# CLI:
- Run a CLI command on the host system
- All **command line** should NOT run in batch, so that, you should NOT return MCP tool **run_cli** in array.
- Do not delete system files or directories.
`,
  fn: async ({ command }) => Cli.execute(command),
  paramsSchema,
  valueSchema
};

export default tool;

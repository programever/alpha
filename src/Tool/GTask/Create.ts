import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GTask from '../../Data/GTask';
import { maybeSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  title: z.string().describe('Title of task'),
  notes: maybeSchema(z.string()).describe('Notes of task'),
  due: maybeSchema(z.string()).describe(
    'Should be in RFC3339 format (e.g., "2023-10-01T12:00:00Z")'
  )
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, GTask.GTask> = {
  name: `gtask_create_task`,
  instruction: `
# Google create task:
- Create Google task with 'title', 'notes' and 'due'
- 'due' field should be in RFC3339 format (e.g., "2023-10-01T12:00:00Z")
`,
  fn: async ({ title, notes, due }) => GTask.createTask(title, notes, due),
  paramsSchema,
  valueSchema: GTask.gtaskSchema
};

export default tool;

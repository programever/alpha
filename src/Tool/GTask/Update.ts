import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GTask from '../../Data/GTask';

const paramsSchema = z.object({
  taskId: z.string().describe('Task Id of the task to be updated'),
  params: z.object({
    title: z.string().optional().describe('Title of task'),
    notes: z.string().optional().describe('Notes of task'),
    due: z
      .string()
      .optional()
      .describe('Should be in RFC3339 format (e.g., "2023-10-01T12:00:00Z")'),
    status: GTask.gtaskStatusSchema
      .optional()
      .describe(`Status should be either 'Pending' or 'Completed'`)
  })
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, GTask.GTask> = {
  name: `gtask_update_task`,
  instruction: `
# Google update task:
- Update Google task with optional 'title' - optional 'notes' - optional 'due' - optional 'status'
- 'due' field should be in RFC3339 format (e.g., "2023-10-01T12:00:00Z")
- 'status' field should be either 'Pending' or 'Completed'
`,
  fn: async ({ taskId, params }) => GTask.updateTask(taskId, params),
  paramsSchema,
  valueSchema: GTask.gtaskSchema
};

export default tool;

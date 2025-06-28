import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GTask from '../../Data/GTask';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  taskId: z.string().describe(`Task ID of the task`)
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `gtask_delete_task`,
  instruction: `
# Google delete task:
- Delete Google task by ID - The field is 'taskId'
`,
  fn: async ({ taskId }) => GTask.deleteTask(taskId),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

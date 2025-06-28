import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GTask from '../../Data/GTask';
import { EmptyObject, emptyObjectSchema } from '../../Data/Zod';

const valueSchema = z.array(GTask.gtaskSchema);
type Value = z.infer<typeof valueSchema>;

const tool: Tool<EmptyObject, Value> = {
  name: `gtask_get_tasks`,
  instruction: `
# Google get tasks:
- Get all Google tasks not required any parameter
`,
  fn: async () => GTask.listTask(),
  paramsSchema: emptyObjectSchema,
  valueSchema
};

export default tool;

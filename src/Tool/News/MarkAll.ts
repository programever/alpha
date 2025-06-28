import { Tool } from '../../Data/Tool';
import * as News from '../../Database/News';
import { Done, doneSchema, EmptyObject, emptyObjectSchema } from '../../Data/Zod';

const tool: Tool<EmptyObject, Done> = {
  name: `news_mark_read_all`,
  instruction: `
# Mark read all news:
- Mark all news as read
`,
  fn: async () => News.markReadAll(),
  paramsSchema: emptyObjectSchema,
  valueSchema: doneSchema
};

export default tool;

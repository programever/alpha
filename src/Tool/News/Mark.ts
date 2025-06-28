import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as News from '../../Database/News';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  newsId: z.number().describe(`News ID of the news`)
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `news_mark_read`,
  instruction: `
# News mark read by ID:
- Mark a news article as read by id
`,
  fn: async ({ newsId }) => News.markRead(newsId),
  paramsSchema: paramsSchema,
  valueSchema: doneSchema
};

export default tool;

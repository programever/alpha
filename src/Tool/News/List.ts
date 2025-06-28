import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as News from '../../Database/News';
import { EmptyObject, emptyObjectSchema } from '../../Data/Zod';
import { ok } from 'elytra-ts';

const valueSchema = z.array(News.newsSchema);
type Value = z.infer<typeof valueSchema>;

const tool: Tool<EmptyObject, Value> = {
  name: `news_list`,
  instruction: `
# News listing:
- Get list of news
- Do **not** summary the news
- Display each news item with the following fields:
  + title
  + url
  + summary
`,
  fn: async () =>
    News.list(30).then((xs) => {
      if (xs._t === 'Err') return xs;
      const updatedValue = xs.value.map((s) => ({ ...s, body: '', description: '' }));
      return ok(updatedValue);
    }),
  paramsSchema: emptyObjectSchema,
  valueSchema
};

export default tool;

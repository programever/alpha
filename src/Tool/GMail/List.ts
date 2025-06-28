import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GMail from '../../Data/GMail';
import { ok } from 'elytra-ts';

const paramsSchema = z.object({
  unread: z.boolean().describe('Define if it should return unread mail only or all mails')
});
type Params = z.infer<typeof paramsSchema>;

const valueSchema = z.array(GMail.gmailDataSchema);
type Value = z.infer<typeof valueSchema>;

const tool: Tool<Params, Value> = {
  name: `gmail_list_mail`,
  instruction: `
# Google get mails:
- Get Google mails base on unread only or all by field 'uread'
- Only display 'from' and 'title'
`,
  fn: async ({ unread }) =>
    GMail.listMail(unread).then((xs) => {
      if (xs._t === 'Err') return xs;
      const updatedValue = xs.value.map((s) => ({ ...s, body: '' }));
      return ok(updatedValue);
    }),
  paramsSchema,
  valueSchema
};

export default tool;

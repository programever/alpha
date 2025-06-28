import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GMail from '../../Data/GMail';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  mailId: z.string().describe('Id of the mail which will be replied'),
  body: z.string().describe('Body of mail')
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `gmail_reply_mail`,
  instruction: `
# Google reply mail:
- Reply email by 'mailId' and 'body'
- Always rewrite email body for better/polite English before call MCP tool
`,
  fn: async ({ mailId, body }) => GMail.replyMail(mailId, body),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

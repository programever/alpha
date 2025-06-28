import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GMail from '../../Data/GMail';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  to: z.string().email().describe('Email string of receiver'),
  subject: z.string().describe('Subject of mail'),
  body: z.string().describe('Body of mail')
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `gmail_send_mail`,
  instruction: `
# Google send mail:
- Send Google Gmail to someone
- Always rewrite email title and email body for better/polite English before call MCP tool
`,
  fn: async ({ to, subject, body }) => GMail.sendMail(to, subject, body),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

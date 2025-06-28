import { Tool } from '../../Data/Tool';
import * as GMail from '../../Data/GMail';
import { Done, doneSchema, EmptyObject, emptyObjectSchema } from '../../Data/Zod';

const tool: Tool<EmptyObject, Done> = {
  name: `gmail_mark_mails`,
  instruction: `
# Google mark read mails:
- Mark read all Google Gmail in Inbox
`,
  fn: async () => GMail.markMails(),
  paramsSchema: emptyObjectSchema,
  valueSchema: doneSchema
};

export default tool;

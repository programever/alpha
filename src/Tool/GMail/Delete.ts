import { Tool } from '../../Data/Tool';
import * as GMail from '../../Data/GMail';
import { Done, doneSchema, EmptyObject, emptyObjectSchema } from '../../Data/Zod';

const tool: Tool<EmptyObject, Done> = {
  name: `gmail_delete_mails`,
  instruction: `
# Google delete mails:
- Delete read all only 'read' Gmail in Inbox
`,
  fn: async () => GMail.deleteMails(),
  paramsSchema: emptyObjectSchema,
  valueSchema: doneSchema
};

export default tool;

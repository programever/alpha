import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  eventId: z.string().describe(`Event ID of the event`),
  status: GEvent.geventActionSchema.describe(`Status should be either 'Accepted' or 'Declined'`)
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `gevent_respond_event`,
  instruction: `
# Google response event:
- Respond Google event by ID - The field is 'eventId' with 'status'
- 'status' should be either 'Accepted' or 'Declined'
`,
  fn: async ({ eventId, status }) => GEvent.respondToEvent(eventId, status),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

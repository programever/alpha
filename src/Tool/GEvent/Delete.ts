import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';
import { Done, doneSchema } from '../../Data/Zod';

const paramsSchema = z.object({
  eventId: z.string().describe(`Event ID of the event`)
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, Done> = {
  name: `gevent_delete_event`,
  instruction: `
# Google delete event:
- Delete Google event by ID - The field is 'eventId'
`,
  fn: async ({ eventId }) => GEvent.deleteEvent(eventId),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

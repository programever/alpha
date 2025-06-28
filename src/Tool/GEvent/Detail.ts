import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';

const paramsSchema = z.object({
  eventId: z.string().describe(`Event ID of the event`)
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, GEvent.GEvent> = {
  name: `gevent_get_event`,
  instruction: `
# Google get event:
- Get Google event by ID - The field is 'eventId'
`,
  fn: async ({ eventId }) => GEvent.getEvent(eventId),
  paramsSchema,
  valueSchema: GEvent.geventSchema
};

export default tool;

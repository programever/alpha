import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';
import Env from '../../Env';

const paramsSchema = z.object({
  eventId: z.string().describe(`Event ID of the event`),
  summary: z.string().describe(`Summary of the event`),
  start: z
    .string()
    .describe(
      `Must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}`
    ),
  end: z
    .string()
    .describe(
      `Must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}`
    )
});
type Params = z.infer<typeof paramsSchema>;

const tool: Tool<Params, GEvent.GEvent> = {
  name: `gevent_update_event`,
  instruction: `
# Google update event:
- Update Google event by ID - The field is 'eventId' 
- Update Google event with 'summary' and time range 'start' - 'end' fields.
- 'start' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
- 'end' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
`,
  fn: async ({ eventId, summary, start, end }) => GEvent.updateEvent(eventId, summary, start, end),
  paramsSchema,
  valueSchema: GEvent.geventSchema
};

export default tool;

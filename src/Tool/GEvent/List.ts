import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';
import Env from '../../Env';

const paramsSchema = z.object({
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

const valueSchema = z.array(GEvent.geventSchema);
type Value = z.infer<typeof valueSchema>;

const tool: Tool<Params, Value> = {
  name: `gevent_get_events`,
  instruction: `
# Google get events:
- Get Google events by date time range 'start' and 'end' field.
- 'start' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
- 'end' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
`,
  fn: async ({ start, end }) => GEvent.getEvents(start, end),
  paramsSchema,
  valueSchema
};

export default tool;

import { z } from 'zod';
import { Tool } from '../../Data/Tool';
import * as GEvent from '../../Data/GEvent';
import Env from '../../Env';
import { Done, doneSchema } from '../../Data/Zod';

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

const tool: Tool<Params, Done> = {
  name: `gevent_delete_events`,
  instruction: `
# Google delete events:
- Delete Google events by date time range 'start' and 'end' field.
- 'start' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
- 'end' field must be this format: '2025-06-13T14:30:00+07:00' - Timezone is always +${Env.timeZone}
`,
  fn: async ({ start, end }) => GEvent.deleteEvents(start, end),
  paramsSchema,
  valueSchema: doneSchema
};

export default tool;

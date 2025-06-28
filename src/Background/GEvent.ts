import dayjs from 'dayjs';
import Env from '../Env';
import * as GEvent from '../Data/GEvent';
import { Maybe } from 'elytra-ts';

export async function run(): Promise<Maybe<string[]>> {
  const tzOffset = `+0${Env.timeZone}:00`;
  const start = dayjs().format(`YYYY-MM-DDTHH:mm:ss${tzOffset}`);
  const end = dayjs().endOf('day').format(`YYYY-MM-DDTHH:mm:ss${tzOffset}`);
  const eventsR = await GEvent.getEvents(start, end);
  if (eventsR._t === 'Err') {
    return null;
  }
  const events = eventsR.value;
  const now = dayjs();
  return events
    .map((event) => {
      const startString = event.start?.dateTime || event.start?.date;
      if (startString == null) return null;

      const startDate = dayjs(startString);
      if (startDate.isAfter(now)) {
        return `Title: ${event.summary}\nTime: ${startDate.format('YYYY-MM-DD HH:mm:ss')}`;
      }
      return null;
    })
    .filter((s) => s != null);
}

import { z } from 'zod';
import { calendar_v3, google } from 'googleapis';
import { createAuthenticatedClient, gAuth } from './Google';
import { err, ok, Result } from 'elytra-ts';

export const geventActionSchema = z.union([z.literal('Accepted'), z.literal('Declined')]);
export const geventActionEnum = z.enum(['Accepted', 'Declined']);
export type GEventAction = z.infer<typeof geventActionEnum>;

export const geventDateTimeSchema = z.object({
  date: z.string().nullable().optional(),
  dateTime: z.string().nullable().optional(),
  timeZone: z.string().nullable().optional()
});
export type GEventDateTime = z.infer<typeof geventDateTimeSchema>;

export const geventSchema = z.object({
  id: z.string().nullable().optional(),
  end: geventDateTimeSchema.optional(),
  start: geventDateTimeSchema.optional(),
  summary: z.string().nullable().optional()
});
export type GEvent = z.infer<typeof geventSchema>;

async function getCalendar(): Promise<calendar_v3.Calendar> {
  const auth = gAuth ? gAuth : await createAuthenticatedClient();
  return google.calendar({ version: 'v3', auth });
}

export async function getEvents(start: string, end: string): Promise<Result<string, GEvent[]>> {
  try {
    const calendar = await getCalendar();
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime'
    });
    const { items } = res.data;

    return items ? ok(items.map(pickFields)) : err(`getEvents cannot find item`);
  } catch (error) {
    return err(`getEvents error: ${error}`);
  }
}

export async function getEvent(eventId: string): Promise<Result<string, GEvent>> {
  try {
    const calendar = await getCalendar();
    const res = await calendar.events.get({
      calendarId: 'primary',
      eventId
    });
    return ok(pickFields(res.data));
  } catch (error) {
    return err(`getEvent error: ${error}`);
  }
}

export async function deleteEvents(start: string, end: string): Promise<Result<string, 'Done'>> {
  try {
    const eventsR = await getEvents(start, end);
    if (eventsR._t === 'Err') {
      return eventsR;
    }

    const events = eventsR.value;
    const calendar = await getCalendar();
    for (const event of events) {
      if (event.id) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: event.id
        });
      }
    }

    return ok('Done');
  } catch (error) {
    return err(`deleteEvents error: ${error}`);
  }
}

export async function deleteEvent(eventId: string): Promise<Result<string, 'Done'>> {
  try {
    const calendar = await getCalendar();
    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });
    return ok('Done');
  } catch (error) {
    return err(`deleteEvent error: ${error}`);
  }
}

export async function createEvent(
  summary: string,
  start: string,
  end: string
): Promise<Result<string, GEvent>> {
  try {
    const calendar = await getCalendar();
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        start: { dateTime: start },
        end: { dateTime: end }
      }
    });
    return ok(pickFields(res.data));
  } catch (error) {
    return err(`createEvent error: ${error}`);
  }
}

export async function updateEvent(
  eventId: string,
  summary: string,
  start: string,
  end: string
): Promise<Result<string, GEvent>> {
  try {
    const calendar = await getCalendar();
    const res = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary,
        start: { dateTime: start },
        end: { dateTime: end }
      }
    });
    return ok(pickFields(res.data));
  } catch (error) {
    return err(`updateEvent error: ${error}`);
  }
}

export async function respondToEvent(
  eventId: string,
  action: GEventAction
): Promise<Result<string, 'Done'>> {
  try {
    const calendar = await getCalendar();
    const res = await calendar.events.get({
      calendarId: 'primary',
      eventId
    });
    const attendees = res.data.attendees || [];
    attendees.forEach((att) => {
      if (att.self) att.responseStatus = action === 'Accepted' ? 'accepted' : 'declined';
    });
    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: { attendees }
    });
    return ok('Done');
  } catch (error) {
    return err(`respondToEvent error: ${error}`);
  }
}

function pickFields({ id, end, start, summary }: calendar_v3.Schema$Event): GEvent {
  return { id, end, start, summary };
}

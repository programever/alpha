import dayjs from 'dayjs';
import { err, ok, Result } from 'elytra-ts';
import { z } from 'zod';

export const rawItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  positive_reactions_count: z.number(),
  reading_time_minutes: z.number(),
  readable_publish_date: z.string(),
  published_at: z.string()
});

export type RawItem = z.infer<typeof rawItemSchema>;

export const itemSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  url: z.string().url()
});

export type Item = z.infer<typeof itemSchema>;

export async function getData(tag: string): Promise<Result<string, Item[]>> {
  const dataR = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=50`).then(async (r) =>
    z.array(rawItemSchema).safeParse(await r.json())
  );
  if (dataR.success === false) {
    return err(`DevTo getData error: ${dataR.error}`);
  }
  const { data } = dataR;

  const twoWeeksAgo = dayjs().subtract(14, 'day');
  return ok(
    data
      .filter((a) => {
        const publishedAt = dayjs(a.published_at);
        return (
          a.positive_reactions_count >= 5 && // at least 5 reactions
          a.reading_time_minutes >= 3 && // not too short
          a.description.length > 50 && // has decent description
          publishedAt.isAfter(twoWeeksAgo) // within 2 weeks
        );
      })
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        url: item.url
      }))
  );
}

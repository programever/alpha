import { z } from 'zod';
import db from '../Database';
import { nullableParse } from '../Data/Zod';
import { err, Maybe, ok, Result } from 'elytra-ts';

const tableName = 'news';

export const newsSchema = z.object({
  id: z.number(),
  externalID: z.string(),
  source: z.union([z.literal('DevTo'), z.literal('Others')]),
  tag: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  body: z.string().nullable(),
  summary: z.string().nullable(),
  score: z.number().nullable(),
  status: z.string(),
  updatedAt: z.coerce.date(), // coerce to support string date
  createdAt: z.coerce.date() // coerce to support string date
});

export type News = z.infer<typeof newsSchema>;

export async function getTodayByExternalType(
  source: string,
  tag: string
): Promise<Result<string, Maybe<News>>> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return db
    .selectFrom(tableName)
    .selectAll()
    .where('source', '=', source)
    .where('tag', '=', tag)
    .where('createdAt', '>=', start)
    .where('createdAt', '<', end)
    .limit(1)
    .executeTakeFirst()
    .then((r) => ok(r ? nullableParse(newsSchema, r) : null))
    .catch((error) => err(`getTodayByExternalType error: ${error}`));
}

export async function upsert(data: {
  source: string;
  tag: string;
  externalID: string;
  title: string;
  description: string;
  url: string;
}): Promise<Result<string, 'Done'>> {
  try {
    const now = new Date();
    const existed = await db
      .selectFrom(tableName)
      .selectAll()
      .where('source', '=', data.source)
      .where('externalID', '=', data.externalID)
      .limit(1)
      .executeTakeFirst();

    if (existed) {
      await db
        .updateTable(tableName)
        .set({ ...data, updatedAt: now })
        .where('id', '=', existed.id)
        .execute();
    } else {
      await db
        .insertInto(tableName)
        .values({ ...data, status: 'New', createdAt: now, updatedAt: now })
        .execute();
    }

    return ok('Done');
  } catch (error) {
    return err(`upsert error: ${error}`);
  }
}

export async function emptyScoreNews({
  pageSize
}: {
  pageSize: number;
}): Promise<Result<string, News[]>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where('score', 'is', null)
    .orderBy('createdAt', 'desc')
    .limit(pageSize)
    .execute()
    .then((xs) => {
      const r = z.array(newsSchema).safeParse(xs);
      return r.success ? ok(r.data) : err(`emptyScoreNews invalid data`);
    })
    .catch((error) => err(`emptyScoreNews error: ${error}`));
}

export async function list(limit: number): Promise<Result<string, News[]>> {
  return db
    .selectFrom(tableName)
    .selectAll()
    .where('status', '=', 'New')
    .where('score', '>', 80)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .execute()
    .then((xs) => {
      const r = z.array(newsSchema).safeParse(xs);
      return r.success ? ok(r.data) : err(`list invalid data`);
    })
    .catch((error) => err(`list error: ${error}`));
}

export async function update(
  id: number,
  updates: Partial<Pick<News, 'body' | 'summary' | 'score' | 'status'>>
): Promise<Result<string, 'Done'>> {
  return db
    .updateTable(tableName)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .execute()
    .then(() => ok<'Done'>('Done'))
    .catch((error) => err(`update error: ${error}`));
}

export async function markRead(id: number): Promise<Result<string, 'Done'>> {
  return db
    .updateTable(tableName)
    .set({
      status: 'Read',
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .execute()
    .then(() => ok<'Done'>('Done'))
    .catch((error) => err(`markRead error: ${error}`));
}

export async function markReadAll(): Promise<Result<string, 'Done'>> {
  return db
    .updateTable(tableName)
    .set({
      status: 'Read',
      updatedAt: new Date()
    })
    .where('status', '=', 'New')
    .execute()
    .then(() => ok<'Done'>('Done'))
    .catch((error) => err(`markReadAll error: ${error}`));
}

import { z } from 'zod';
import db from '../src/Database';
import * as File from '../src/Data/File';
import { sql } from 'kysely';
import { parseJsonValue } from 'elytra-ts';
import { newsSchema } from '../src/Database/News';
import Env from '../src/Env';

export async function importTableNews(): Promise<void> {
  const tableName = 'news';
  const inputFile = `${Env.dbBackupPath}/${tableName}.json`;

  const exists = await File.fileExists(inputFile);
  if (!exists) {
    console.info(`⚠️ File not found: ${inputFile}`);
    return;
  }

  const content = await File.readFile(inputFile);
  const result = parseJsonValue(content);
  if (result._t === 'Err') {
    throw new Error(`Invalid JSON in ${result}: expected array`);
  }
  const dataR = z.array(newsSchema).safeParse(result.value);

  if (dataR.success === false) {
    throw new Error(`Invalid JSON in ${inputFile}: expected array`);
  }
  const rows = dataR.data;

  if (rows.length === 0) {
    console.info(`ℹ️ No news rows to import for ${tableName}`);
    return;
  }

  await db.insertInto(tableName).values(rows).execute();

  await db
    .selectFrom('news')
    .select(db.fn.max('id').as('maxID'))
    .executeTakeFirstOrThrow()
    .then((r) =>
      sql`SELECT setval(pg_get_serial_sequence('news', 'id'), ${r.maxID + 1}, true)`.execute(db)
    );

  console.info(`✅ Imported ${rows.length} rows into ${tableName}`);
}

async function importAll() {
  await importTableNews();

  console.info(`✅ Import all tables successfully.`);
  process.exit(0);
}

importAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

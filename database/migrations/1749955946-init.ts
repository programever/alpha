import { Kysely } from 'kysely';

// Why `unknown`? Read more here https://kysely.dev/docs/migrations
export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('news')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('externalID', 'varchar(500)', (col) => col.notNull().unique())
    .addColumn('source', 'varchar(100)', (col) => col.notNull())
    .addColumn('tag', 'varchar(100)', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('url', 'varchar(500)', (col) => col.notNull())
    .addColumn('body', 'text')
    .addColumn('summary', 'text')
    .addColumn('score', 'integer')
    .addColumn('status', 'varchar(100)', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull())
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('news').execute();
}

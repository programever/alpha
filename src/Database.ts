import { Pool } from 'pg';
import { Generated, Kysely, PostgresDialect, TableExpressionOrList } from 'kysely';
import env from './Env';
import { Maybe } from 'elytra-ts';

export type Schema = {
  news: NewsTable;
};

export type TableName = TableExpressionOrList<Schema, never>;

export type NewsTable = {
  id: Generated<number>;
  externalID: string;
  source: string;
  tag: string;
  title: string;
  description: string;
  url: string;
  body: Maybe<string>;
  summary: Maybe<string>;
  score: Maybe<number>;
  status: string;
  updatedAt: Date;
  createdAt: Date;
};

export const pool = new Pool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbDB,
  port: env.dbPort
});

const db = new Kysely<Schema>({
  dialect: new PostgresDialect({
    pool
  })
});

export default db;

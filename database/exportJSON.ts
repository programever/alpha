import db, { TableName } from '../src/Database';
import * as File from '../src/Data/File';
import Env from '../src/Env';

async function exportTable(tableName: TableName): Promise<void> {
  const rows = await db.selectFrom(tableName).selectAll().execute();
  const outputFile = `${Env.dbBackupPath}/${tableName}.json`;

  await File.ensureFileExists(outputFile);
  await File.writeFile(outputFile, JSON.stringify(rows, null, 2));

  console.info(`✅ Exported ${rows.length} news items to ${outputFile}`);
}

async function exportAll() {
  for (const table of ['news']) {
    await exportTable(table as TableName);
  }

  console.info(`✅ Exported all tables successfully.`);
  process.exit(0);
}

exportAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

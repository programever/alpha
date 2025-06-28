import Path from 'path';
import task from './Task';
import role from './Role';
import * as Project from './Project';
import * as File from '../Data/File';

export async function generateInstructions(): Promise<string> {
  const [responseFormat, project] = await Promise.all([
    File.readFile(Path.resolve(__dirname, './ResponseFormat.md')),
    Project.instruction()
  ]);

  return [role, task, responseFormat, project].join('\n');
}

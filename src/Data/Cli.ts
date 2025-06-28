import { z } from 'zod';
import { err, ok, Result } from 'elytra-ts';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execSchema = z.object({ stdout: z.string(), stderr: z.string() });

export async function execute(command: string): Promise<Result<string, string>> {
  try {
    const data = await execAsync(command);
    const result = execSchema.safeParse(data);
    return result.success ? ok(result.data.stdout) : err('Invalid output format');
  } catch (error: unknown) {
    const result = execSchema.safeParse(error);
    if (result.success) {
      return err(result.data.stderr);
    }
    const errMsg = error instanceof Error ? error.message : String(error);
    return err(errMsg);
  }
}

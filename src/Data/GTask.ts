import { tasks_v1, google } from 'googleapis';
import { z } from 'zod';
import { createAuthenticatedClient, gAuth } from './Google';
import { err, Maybe, ok, Result } from 'elytra-ts';
import { maybeSchema } from './Zod';

export const gtaskStatusSchema = z.enum(['Pending', 'Completed']);
export type GTaskStatus = z.infer<typeof gtaskStatusSchema>;

export const gtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  notes: maybeSchema(z.string()),
  status: gtaskStatusSchema,
  due: maybeSchema(z.string())
});

export type GTask = z.infer<typeof gtaskSchema>;

async function getTasks(): Promise<tasks_v1.Tasks> {
  const auth = gAuth ? gAuth : await createAuthenticatedClient();
  return google.tasks({ version: 'v1', auth });
}

export async function listTask(): Promise<Result<string, GTask[]>> {
  try {
    const tasks = await getTasks();
    const res = await tasks.tasks.list({
      tasklist: '@default',
      showCompleted: true,
      maxResults: 100
    });
    const { items } = res.data;

    return items
      ? ok(items.map(toGTask).filter((t) => t != null))
      : err(`listTask cannot find items`);
  } catch (error) {
    return err(`listTask error: ${error}`);
  }
}

export async function createTask(
  title: string,
  notes: Maybe<string>,
  due: Maybe<string>
): Promise<Result<string, GTask>> {
  try {
    const tasks = await getTasks();
    const res = await tasks.tasks.insert({
      tasklist: '@default',
      requestBody: { title, notes, due }
    });
    const gTask = toGTask(res.data);
    return gTask ? ok(gTask) : err(`createTask error: ${JSON.stringify(res.data)}`);
  } catch (error) {
    return err(`createTask error: ${error}`);
  }
}

export async function updateTask(
  taskId: string,
  params: {
    title?: string;
    notes?: string;
    due?: string;
    status?: GTaskStatus;
  }
): Promise<Result<string, GTask>> {
  try {
    const tasks = await getTasks();

    const current = await tasks.tasks.get({ tasklist: '@default', task: taskId });
    if (current.data == null) return err(`Task not found`);

    const updated = await tasks.tasks.update({
      tasklist: '@default',
      task: taskId,
      requestBody: {
        title: params.title || current.data.title,
        notes: params.notes || current.data.notes,
        due: params.due || current.data.due,
        status: params.status ? toStatusString(params.status) : current.data.status
      }
    });

    const gTask = toGTask(updated.data);
    return gTask ? ok(gTask) : err(`updateTask error: ${JSON.stringify(updated.data)}`);
  } catch (error) {
    return err(`updateTask error: ${error}`);
  }
}

export async function deleteTask(taskId: string): Promise<Result<string, 'Done'>> {
  try {
    const tasks = await getTasks();
    await tasks.tasks.delete({ tasklist: '@default', task: taskId });
    return ok('Done');
  } catch (error) {
    return err(`deleteTask error: ${error}`);
  }
}

function toGTask({ id, title, notes, status, due }: tasks_v1.Schema$Task): Maybe<GTask> {
  if (id == null || title == null) return null;
  return { id, title, notes: notes || null, status: toStatus(status), due: due || null };
}

function toStatus(status: string | undefined | null): GTaskStatus {
  if (status === 'completed') return 'Completed';
  return 'Pending';
}

function toStatusString(status: GTask['status']): string {
  return status === 'Completed' ? 'completed' : 'needsAction';
}

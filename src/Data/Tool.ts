import { Result } from 'elytra-ts';
import { z } from 'zod';

export type Tool<P, T> = {
  name: Name;
  instruction: string;
  fn: (p: P) => Promise<Result<string, T>>; // Error will be a string to support AI
  paramsSchema: z.Schema<P>;
  valueSchema: z.Schema<T>;
};

const enum NameEnum {
  RunCli = 'run_cli',
  FetchWebPageContent = 'fetch_web_page_content',
  DisplayDialog = 'display_dialog',
  GEventGetEvents = 'gevent_get_events',
  GEventGetEvent = 'gevent_get_event',
  GEventDeleteEvents = 'gevent_delete_events',
  GEventDeleteEvent = 'gevent_delete_event',
  GEventCreateEvent = 'gevent_create_event',
  GEventUpdateEvent = 'gevent_update_event',
  GEventRespondEvent = 'gevent_respond_event',
  GTaskGetTasks = 'gtask_get_tasks',
  GTaskCreateTask = 'gtask_create_task',
  GTaskUpdateTask = 'gtask_update_task',
  GTaskDeleteTask = 'gtask_delete_task',
  GMailListMail = 'gmail_list_mail',
  GMailMarkMails = 'gmail_mark_mails',
  GMailDeleteMails = 'gmail_delete_mails',
  GMailSendMail = 'gmail_send_mail',
  GMailReplyMail = 'gmail_reply_mail',
  NewsList = 'news_list',
  NewsMarkRead = 'news_mark_read',
  NewsMarkReadAll = 'news_mark_read_all'
}
type Name = `${NameEnum}`;

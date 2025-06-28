import { AI } from './AI';
import { Message } from './Message';

export type Conversation = {
  all: () => Message[];
  addMessage: (m: Message) => Promise<Message[]>;
};

export type CreateParams = {
  ai: AI;
  max: number;
  keep: number;
};
export function create({ ai, max, keep }: CreateParams): Conversation {
  const history: Message[] = [];

  async function run(): Promise<Message[]> {
    const old = history.slice(0, -keep);
    const recent = history.slice(-keep);
    if (history.length > max && old.length > 0) {
      const content = await ai.summarize(old);
      history.length = 0;
      history.push({ _t: 'System', content: `Conversation so far: ${content}` }, ...recent);
    }
    return history;
  }

  async function addMessage(message: Message) {
    history.push(message);
    return run();
  }

  function all() {
    return history;
  }

  return { addMessage, all };
}

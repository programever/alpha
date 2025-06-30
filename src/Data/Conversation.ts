import { AI, Tokens } from './AI';
import { Message } from './Message';

export type Conversation = {
  all: () => Message[];
  addMessage: (m: Message) => Promise<Message[]>;
  usedTokens: Tokens;
  addTokens: (t: Tokens) => Tokens;
};

export type CreateParams = {
  ai: AI;
  max: number;
  keep: number;
};
export function create({ ai, max, keep }: CreateParams): Conversation {
  const history: Message[] = [];
  let usedTokens: Tokens = 0;

  async function run(): Promise<Message[]> {
    const old = history.slice(0, -keep);
    const recent = history.slice(-keep);
    if (history.length > max && old.length > 0) {
      const [summary, tokens] = await ai.summarize(old);
      addTokens(tokens);
      history.length = 0;
      history.push({ _t: 'System', content: `Conversation so far: ${summary}` }, ...recent);
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

  function addTokens(t: Tokens) {
    // Should keep to null if t is null
    // Then we can see the error why it null
    usedTokens = t == null ? null : (usedTokens || 0) + t;
    return usedTokens;
  }

  return { addMessage, all, usedTokens, addTokens };
}

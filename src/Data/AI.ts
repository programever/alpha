import { Message } from './Message';

export type AI = {
  run: (messages: Message[]) => Promise<Message>;
  summarize: (history: Message[]) => Promise<string>;
  reader: (instruction: string, content: string) => Promise<string>;
};

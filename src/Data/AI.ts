import { Maybe, Tuple } from 'elytra-ts';
import { Message } from './Message';

export type Tokens = Maybe<number>;
export type AIResponse<T> = Tuple<T, Maybe<number>>;

export type AI = {
  run: (messages: Message[]) => Promise<AIResponse<Message>>;
  summarize: (history: Message[]) => Promise<AIResponse<string>>;
  reader: (instruction: string, content: string) => Promise<AIResponse<string>>;
};

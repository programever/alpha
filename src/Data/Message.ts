import * as LC from '@langchain/core/messages';
import { JsonValue, Maybe } from 'elytra-ts';

export type Message = SystemMessage | UserMessage | AIMessage | InvalidMessage;

export type SystemMessage = { _t: 'System'; content: string };
export type UserMessage = { _t: 'User'; content: MessageContent };
export type AIMessage = { _t: 'AI'; content: MessageContent };
export type InvalidMessage = { _t: 'Invalid'; message: JsonValue };

export type MessageContent =
  | { _t: 'Text'; value: string }
  | { _t: 'Metadata'; value: MessageMetadata[] }
  | { _t: 'Invalid'; value: string };

export type MessageMetadata =
  | { _t: 'Text'; value: string }
  | { _t: 'Image'; value: string }
  | { _t: 'ImageData'; value: string }
  | { _t: 'Invalid'; value: string };

export function createUserMsg(value: string): UserMessage {
  return { _t: 'User', content: { _t: 'Text', value } };
}

export function messageString(message: Message): Maybe<string> {
  switch (message._t) {
    case 'System':
      return message.content;
    case 'User':
    case 'AI':
      return messageContentToString(message.content);
    case 'Invalid':
      return null;
  }
}

// LangChain

export function toLC(message: Message): Maybe<LC.BaseMessage> {
  switch (message._t) {
    case 'System':
      return new LC.SystemMessage(message.content);
    case 'User': {
      const content = messageContentToString(message.content);
      return content ? new LC.HumanMessage(content) : null;
    }
    case 'AI': {
      const content = messageContentToString(message.content);
      return content ? new LC.AIMessage(content) : null;
    }
    case 'Invalid':
      return null;
  }
}

export function fromLC(message: LC.BaseMessage): Message {
  const content = message.content;
  if (LC.isAIMessage(message)) {
    return { _t: 'AI', content: fromMessageContentLC(message.content) };
  } else if (LC.isHumanMessage(message)) {
    return { _t: 'User', content: fromMessageContentLC(message.content) };
  } else if (LC.isSystemMessage(message)) {
    return {
      _t: 'System',
      content: typeof content === 'string' ? content : JSON.stringify(content)
    };
  }
  return { _t: 'Invalid', message };
}

function fromMessageContentLC(message: LC.MessageContent): MessageContent {
  if (typeof message === 'string') {
    return { _t: 'Text', value: message };
  } else if (Array.isArray(message)) {
    const value: MessageMetadata[] = message.map((item) => {
      switch (item.type) {
        case 'text':
          return { _t: 'Text', value: item.text };
        case 'image_url':
          return { _t: 'Text', value: item.image_url };
        case 'image_base64':
          return { _t: 'Text', value: item.image_base64 };
        default:
          return { _t: 'Invalid', value: `Invalid message: ${JSON.stringify(item)}` };
      }
    });
    return { _t: 'Metadata', value };
  }

  return { _t: 'Invalid', value: `Invalid message: ${JSON.stringify(message)}` };
}

function messageContentToString(content: MessageContent): Maybe<string> {
  switch (content._t) {
    case 'Text':
      return content.value;
    case 'Metadata':
      return content.value.reduce((a, c) => {
        switch (c._t) {
          case 'Text':
            return `${a}\n${c.value}`;
          case 'Image':
          case 'ImageData':
          case 'Invalid':
            return a;
        }
      }, '');
    case 'Invalid':
      return null;
  }
}

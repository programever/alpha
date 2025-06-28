import { ChatOpenAI } from '@langchain/openai';
import { AI } from '../Data/AI';
import * as Msg from '../Data/Message';
import { generateInstructions } from '../Instruction/Instruction';
import * as LC from '../LangChain';
import toolsLC from '../Tool/LangChain';

const model = new ChatOpenAI({
  model: 'gpt-4.1',
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY
});

async function run(messages: Msg.Message[]): Promise<Msg.Message> {
  const systemMessage: Msg.SystemMessage = { _t: 'System', content: await generateInstructions() };
  const newMessage = await LC.query(model, {
    messages: [systemMessage, ...messages].map(Msg.toLC).filter((m) => m != null),
    tools: toolsLC
  });

  return Msg.fromLC(newMessage);
}

async function summarize(history: Msg.Message[]): Promise<string> {
  const message: Msg.UserMessage = {
    _t: 'User',
    content: { _t: 'Text', value: 'Summarize the following conversation in 10 concise sentences.' }
  };
  const summarizeMessage = await LC.query(model, {
    messages: [...history, message].map(Msg.toLC).filter((m) => m != null),
    tools: []
  });
  return Msg.messageString(Msg.fromLC(summarizeMessage)) || 'Cannot summarize the conversation';
}

async function reader(instruction: string, content: string): Promise<string> {
  const systemMessage: Msg.SystemMessage = { _t: 'System', content: instruction };
  const userMessage: Msg.UserMessage = {
    _t: 'User',
    content: { _t: 'Text', value: `Help me summarize this content:\n${content}` }
  };
  const summarizeMessage = await LC.query(model, {
    messages: [systemMessage, userMessage].map(Msg.toLC).filter((m) => m != null),
    tools: []
  });
  return Msg.messageString(Msg.fromLC(summarizeMessage)) || 'Cannot summarize the conversation';
}

const alpha: AI = { run, summarize, reader };
export default alpha;

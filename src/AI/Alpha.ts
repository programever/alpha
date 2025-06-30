import { ChatOpenAI } from '@langchain/openai';
import Env from '../Env';
import { AI, AIResponse, Tokens } from '../Data/AI';
import * as Msg from '../Data/Message';
import { generateInstructions } from '../Instruction/Instruction';
import * as LangChain from '../LangChain';
import toolsLC, { LCTool } from '../Tool/LangChain';
import { BaseMessage } from '@langchain/core/messages';
import { getTokenizer } from '../Data/Tiktoken';
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling';

const modelName = 'gpt-4.1';
const model = new ChatOpenAI({
  model: modelName,
  temperature: 0,
  openAIApiKey: Env.modelKeys.openAI
});

function calculateTokens(tools: Array<LCTool>, msgs: BaseMessage[]): Tokens {
  const tokenizer = getTokenizer(modelName);
  if (tokenizer == null) return null;

  let tokens = 0;
  for (const msg of msgs) {
    tokens += 4; // OpenAI fixed per-message overhead

    const role = msg.getType();
    const content =
      typeof msg.content === 'string'
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content
              .map((p) => (typeof p === 'string' ? p : 'text' in p ? p.text : ''))
              .join(' ')
          : String(msg.content);

    tokens += tokenizer.encode(role).length;
    tokens += tokenizer.encode(content).length;
  }
  tokens += 2; // Final assistant starter

  const openAITools = tools.map((tool) => convertToOpenAIFunction(tool));
  tokens += tokenizer.encode(JSON.stringify(openAITools)).length;

  return tokens;
}

async function run(messages: Msg.Message[]): Promise<AIResponse<Msg.Message>> {
  const systemMessage: Msg.SystemMessage = { _t: 'System', content: await generateInstructions() };
  const [newMessage, tokens] = await LangChain.query(model, {
    messages: [systemMessage, ...messages].map(Msg.toLC).filter((m) => m != null),
    tools: toolsLC,
    calculateTokens
  });

  return [Msg.fromLC(newMessage), tokens];
}

async function summarize(history: Msg.Message[]): Promise<AIResponse<string>> {
  const message: Msg.UserMessage = {
    _t: 'User',
    content: { _t: 'Text', value: 'Summarize the following conversation in 10 concise sentences.' }
  };
  const [summarizeMessage, tokens] = await LangChain.query(model, {
    messages: [...history, message].map(Msg.toLC).filter((m) => m != null),
    tools: [],
    calculateTokens
  });
  return [
    Msg.messageString(Msg.fromLC(summarizeMessage)) || 'Cannot summarize the conversation',
    tokens
  ];
}

async function reader(instruction: string, content: string): Promise<AIResponse<string>> {
  const systemMessage: Msg.SystemMessage = { _t: 'System', content: instruction };
  const userMessage: Msg.UserMessage = {
    _t: 'User',
    content: { _t: 'Text', value: `Help me summarize this content:\n${content}` }
  };
  const [summarizeMessage, tokens] = await LangChain.query(model, {
    messages: [systemMessage, userMessage].map(Msg.toLC).filter((m) => m != null),
    tools: [],
    calculateTokens
  });
  return [
    Msg.messageString(Msg.fromLC(summarizeMessage)) || 'Cannot summarize the conversation',
    tokens
  ];
}

const alpha: AI = { run, summarize, reader };
export default alpha;

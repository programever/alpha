import { ToolCall } from '@langchain/core/dist/messages/tool';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, isAIMessage, ToolMessage } from '@langchain/core/messages';
import type { AIResponse, Tokens } from './Data/AI';
import type { LCTool } from './Tool/LangChain';

export type QueryParams = {
  messages: BaseMessage[];
  tools: Array<LCTool>;
  calculateTokens: (t: LCTool[], m: BaseMessage[]) => Tokens;
};

export async function query(
  model: BaseChatModel,
  params: QueryParams
): Promise<AIResponse<BaseMessage>> {
  const [newMessage, tokens] = await run(model, params);
  return queryHandler(model, params, newMessage, tokens);
}

export async function queryHandler(
  model: BaseChatModel,
  params: QueryParams,
  newMessage: BaseMessage,
  tokens: Tokens
): Promise<AIResponse<BaseMessage>> {
  const { tools, messages } = params;
  messages.push(newMessage);

  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  const toolCalls = getToolCalls(newMessage);

  if (toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const tool = toolMap.get(toolCall.name);

      if (!tool || !toolCall.id) {
        messages.push(new AIMessage('Tool not found or tool call ID is missing.'));
        continue;
      }

      const result = await tool.invoke(toolCall.args);
      const resultString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      messages.push(new ToolMessage(resultString, toolCall.id));
    }

    const [nextMessage, nextTokens] = await run(model, { ...params, messages });
    const newTokens = tokens && nextTokens ? tokens + nextTokens : null;
    return queryHandler(model, { ...params, messages }, nextMessage, newTokens);
  }

  return [newMessage, tokens];
}

async function run(model: BaseChatModel, params: QueryParams): Promise<AIResponse<BaseMessage>> {
  const { calculateTokens, tools, messages } = params;

  const sendTokens = calculateTokens(tools, messages);
  const newMessage = await run_(model, params);
  const receiveTokens = calculateTokens([], [newMessage]);
  const tokens = sendTokens && receiveTokens ? sendTokens + receiveTokens : null;

  return [newMessage, tokens];
}

async function run_(model: BaseChatModel, params: QueryParams): Promise<BaseMessage> {
  const { tools, messages } = params;

  if (tools.length === 0) {
    return model.invoke(messages);
  } else if (model.bindTools) {
    const bindedModel = model.bindTools(tools);
    return bindedModel.invoke(messages, { tool_choice: 'auto' });
  } else {
    return new AIMessage(
      'This model does not support tool binding. Please use a model that supports it.'
    );
  }
}

function getToolCalls(message: BaseMessage): ToolCall[] {
  return isAIMessage(message) && message.tool_calls ? message.tool_calls : [];
}

import { ToolCall } from '@langchain/core/dist/messages/tool';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, isAIMessage, ToolMessage } from '@langchain/core/messages';
import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';

export type QueryParams = {
  messages: BaseMessage[];
  tools: Array<DynamicStructuredTool | StructuredToolInterface>;
};

export async function query(model: BaseChatModel, params: QueryParams): Promise<BaseMessage> {
  const newMessage = await run(model, params);
  return queryHandler(model, params, newMessage);
}

export async function queryHandler(
  model: BaseChatModel,
  { tools, messages }: QueryParams,
  newMessage: BaseMessage
): Promise<BaseMessage> {
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

    const nextMessage = await run(model, { tools, messages });
    return queryHandler(model, { tools, messages }, nextMessage);
  }

  return newMessage;
}

async function run(model: BaseChatModel, params: QueryParams): Promise<BaseMessage> {
  if (params.tools.length === 0) {
    return model.invoke(params.messages);
  } else if (model.bindTools) {
    const bindedModel = model.bindTools(params.tools);
    return bindedModel.invoke(params.messages, { tool_choice: 'auto' });
  } else {
    return new AIMessage(
      'This model does not support tool binding. Please use a model that supports it.'
    );
  }
}

function getToolCalls(message: BaseMessage): ToolCall[] {
  return isAIMessage(message) && message.tool_calls ? message.tool_calls : [];
}

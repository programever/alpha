import { Maybe } from 'elytra-ts';
import { AI } from '../Data/AI';
import * as Msg from '../Data/Message';

export async function run(ai: AI): Promise<Maybe<string>> {
  const content = `Summary my stuff - Please always call MCP tools to get latest data, do NOT assume/reuse old data. ONLY display Dialog if there is future event, Dialog message is "There are upcomming events!".`;
  return await ai.run([Msg.createUserMsg(content)]).then(Msg.messageString);
}

import { DynamicStructuredTool, StructuredToolInterface } from '@langchain/core/tools';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { z } from 'zod';
import Env from '../Env';
import Cli from './Cli';
import FetchWebPage from './FetchWebPage';
import DisplayDialog from './DisplayDialog';
import GEventCreate from './GEvent/Create';
import GEventDelete from './GEvent/Delete';
import GEventDeleteMultiple from './GEvent/DeleteMultiple';
import GEventDetail from './GEvent/Detail';
import GEventList from './GEvent/List';
import GEventRespond from './GEvent/Respond';
import GEventUpdate from './GEvent/Update';
import GTaskCreate from './GTask/Create';
import GTaskDelete from './GTask/Delete';
import GTaskList from './GTask/List';
import GTaskUpdate from './GTask/Update';
import GMailDelete from './GMail/Delete';
import GMailList from './GMail/List';
import GMailRead from './GMail/Read';
import GMailReply from './GMail/Reply';
import GMailSend from './GMail/Send';
import NewsList from './News/List';
import NewsMark from './News/Mark';
import NewsMarkAll from './News/MarkAll';

// Hack any - Hahahahahhahahahahahaha
interface ZTool<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  instruction: string;
  paramsSchema: T;
  fn: (params: z.infer<T>) => Promise<unknown>;
}

function makeTool(tool: ZTool): DynamicStructuredTool {
  return new DynamicStructuredTool({
    name: tool.name,
    description: tool.instruction,
    schema: tool.paramsSchema,
    func: tool.fn
  });
}

const gTools: Array<DynamicStructuredTool | StructuredToolInterface> = [
  makeTool(GEventCreate),
  makeTool(GEventDelete),
  makeTool(GEventDeleteMultiple),
  makeTool(GEventDetail),
  makeTool(GEventList),
  makeTool(GEventRespond),
  makeTool(GEventUpdate),
  makeTool(GTaskCreate),
  makeTool(GTaskDelete),
  makeTool(GTaskList),
  makeTool(GTaskUpdate),
  makeTool(GMailDelete),
  makeTool(GMailList),
  makeTool(GMailRead),
  makeTool(GMailReply),
  makeTool(GMailSend)
];

const tools: Array<DynamicStructuredTool | StructuredToolInterface> = [
  makeTool(Cli),
  makeTool(FetchWebPage),
  makeTool(DisplayDialog),
  ...(Env.withGoogle ? gTools : []),
  makeTool(NewsList),
  makeTool(NewsMark),
  makeTool(NewsMarkAll)
];

const fsToolClient = new MultiServerMCPClient({
  mcpServers: {
    fs: {
      transport: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', Env.homePath]
    }
  },
  prefixToolNameWithServerName: true
});

(async () => {
  const fsTools = await fsToolClient.getTools();
  tools.push(...fsTools);
})();

export default tools;

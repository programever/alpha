import { z } from 'zod';
import { Tool } from '../Data/Tool';
import * as Browser from '../Data/Browser';

const paramsSchema = z.object({
  url: z.string().url().describe('The URL of the web page to fetch'),
  withHtml: z.boolean().describe('Whether to return HTML content or plain text')
});
type Params = z.infer<typeof paramsSchema>;

const valueSchema = z.string().describe('The content of the web page, either HTML or plain text');
type Value = z.infer<typeof valueSchema>;

const tool: Tool<Params, Value> = {
  name: `fetch_web_page_content`,
  instruction: `
# Fetch Web Page Content:
- Use this tool to fetch the content of a web page by URL.
- The contend can be returned as plain text or HTML.
`,
  fn: async ({ url, withHtml }) => Browser.fetchContent(url, withHtml),
  paramsSchema,
  valueSchema
};

export default tool;

import { err, ok, Result } from 'elytra-ts';
import { Readability } from '@mozilla/readability';
import { VirtualConsole, JSDOM } from 'jsdom';
import { execute } from './Cli';

const virtualConsole = new VirtualConsole();
virtualConsole.on('log', () => {});
virtualConsole.on('error', () => {});
virtualConsole.on('warn', () => {});

export async function fetchContent(
  url: string,
  withHtml: boolean
): Promise<Result<string, string>> {
  const command = `curl -L --connect-timeout 10 --max-time 10 "${url}"`;
  const result = await execute(command);
  if (result._t === 'Err') {
    return result;
  }
  try {
    const dom = new JSDOM(result.value, {
      runScripts: undefined,
      resources: 'usable',
      pretendToBeVisual: false,
      virtualConsole
    });
    const reader = new Readability(dom.window.document, { debug: false });
    const article = reader.parse();

    if (article && article.content && article.textContent) {
      return ok(withHtml ? article.content : article.textContent);
    } else {
      return err('Failed to parse HTML content with Readability.');
    }
  } catch (parseError) {
    return err(`Error parsing HTML content: ${String(parseError)}`);
  }
}
